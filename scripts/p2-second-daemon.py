#!/usr/bin/env python3
"""P2: second Multica daemon profile — verify task↔runtime claim isolation."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

HOME = Path.home()
PATH = os.environ.get("PATH", "")
os.environ["PATH"] = f"{HOME / '.local' / 'bin'}:{PATH}"

PROFILE_B = os.environ.get("MUNDER_PROFILE_B", "node-b")
SERVER_URL = os.environ.get("MUNDER_MULTICA_SERVER_URL", "http://localhost:8080").rstrip("/")
APP_URL = os.environ.get("MUNDER_MULTICA_APP_URL", "http://localhost:3000").rstrip("/")
REPORT = Path(os.environ.get("MUNDER_P2_REPORT", "/tmp/munder-p2-second-daemon.json"))


def run(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print("+", " ".join(args), flush=True)
    return subprocess.run(args, check=check, text=True, capture_output=True)


def run_json(args: list[str]):
    cp = run(args)
    if cp.stderr.strip():
        print(cp.stderr, file=sys.stderr)
    return json.loads(cp.stdout)


def ensure_opencode_stub() -> None:
    bin_dir = HOME / ".local" / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)
    stub = bin_dir / "opencode"
    if stub.exists():
        return
    stub.write_text(
        "#!/usr/bin/env bash\n"
        "case \"${1:-}\" in\n"
        "  --version|-v|version) echo \"opencode 0.0.0-munder-p0-stub\"; exit 0 ;;\n"
        "  *) echo \"munder stub opencode\" >&2; exit 1 ;;\n"
        "esac\n"
    )
    stub.chmod(0o755)


def load_default_config() -> dict:
    return json.loads((HOME / ".multica" / "config.json").read_text())


def main() -> int:
    if shutil.which("multica") is None:
        print("multica CLI not found", file=sys.stderr)
        return 1
    ensure_opencode_stub()

    import urllib.request

    try:
        with urllib.request.urlopen(f"{SERVER_URL}/healthz", timeout=5) as resp:
            health = json.loads(resp.read().decode())
    except Exception as exc:  # noqa: BLE001
        print(f"server not healthy: {exc}", file=sys.stderr)
        return 1
    if health.get("status") != "ok":
        print(f"unexpected health: {health}", file=sys.stderr)
        return 1

    cfg = load_default_config()
    token = os.environ.get("MUNDER_MULTICA_TOKEN") or cfg["token"]
    ws_id = os.environ.get("MUNDER_WORKSPACE_ID") or cfg["workspace_id"]

    # default daemon
    st = run(["multica", "daemon", "status"], check=False)
    if "running" not in (st.stdout + st.stderr):
        run(["multica", "daemon", "start"])

    # profile B config + login
    run(["multica", "--profile", PROFILE_B, "config", "set", "server_url", SERVER_URL])
    run(["multica", "--profile", PROFILE_B, "config", "set", "app_url", APP_URL])
    run(["multica", "--profile", PROFILE_B, "login", "--token", token])
    profile_cfg_path = HOME / ".multica" / "profiles" / PROFILE_B / "config.json"
    profile_cfg = json.loads(profile_cfg_path.read_text())
    profile_cfg["workspace_id"] = ws_id
    profile_cfg["server_url"] = SERVER_URL
    profile_cfg["app_url"] = APP_URL
    profile_cfg_path.write_text(json.dumps(profile_cfg, indent=2) + "\n")

    run(["multica", "--profile", PROFILE_B, "daemon", "stop"], check=False)
    run(
        [
            "multica",
            "--profile",
            PROFILE_B,
            "daemon",
            "start",
            "--device-name",
            f"munder-{PROFILE_B}",
            "--daemon-id",
            f"munder-{PROFILE_B}",
            "--workspaces-root",
            str(HOME / f"multica_workspaces_{PROFILE_B}"),
        ]
    )
    time.sleep(2)
    print(run(["multica", "--profile", PROFILE_B, "daemon", "status"]).stdout)

    runtimes = run_json(["multica", "runtime", "list", "--workspace-id", ws_id, "--output", "json"])
    online = [r for r in runtimes if r.get("status") == "online"]
    if len(online) < 2:
        REPORT.write_text(
            json.dumps(
                {"ok": False, "error": "need >=2 online runtimes", "runtimes": runtimes},
                indent=2,
            )
            + "\n"
        )
        print("FAIL: need two online runtimes", file=sys.stderr)
        return 1

    def score(r: dict) -> int:
        blob = " ".join(
            [
                str(r.get("name") or ""),
                str(r.get("device_info") or ""),
                str(r.get("daemon_id") or ""),
            ]
        ).lower()
        return int(PROFILE_B.lower() in blob or f"munder-{PROFILE_B}".lower() in blob)

    online_sorted = sorted(online, key=score)
    runtime_b = online_sorted[-1]["id"] if score(online_sorted[-1]) else online[-1]["id"]
    runtime_a = next(r["id"] for r in online if r["id"] != runtime_b)

    agents = run_json(["multica", "agent", "list", "--workspace-id", ws_id, "--output", "json"])
    agent_name = f"WorkerB-{PROFILE_B}"
    agent_b = next((a for a in agents if a.get("name") == agent_name), None)
    if not agent_b:
        agent_b = run_json(
            [
                "multica",
                "agent",
                "create",
                "--name",
                agent_name,
                "--runtime-id",
                runtime_b,
                "--visibility",
                "workspace",
                "--workspace-id",
                ws_id,
                "--output",
                "json",
            ]
        )
    agent_b_id = agent_b["id"]

    issue = run_json(
        [
            "multica",
            "issue",
            "create",
            "--title",
            f"P2 isolation: bind to {PROFILE_B}",
            "--description",
            "Must run only on runtime B",
            "--workspace-id",
            ws_id,
            "--output",
            "json",
        ]
    )
    issue_ref = issue["identifier"]
    run(
        [
            "multica",
            "issue",
            "assign",
            issue_ref,
            "--to-id",
            agent_b_id,
            "--workspace-id",
            ws_id,
        ]
    )
    time.sleep(4)
    runs = run_json(
        ["multica", "issue", "runs", issue_ref, "--workspace-id", ws_id, "--output", "json"]
    )
    if not runs:
        REPORT.write_text(json.dumps({"ok": False, "error": "no runs", "issue": issue_ref}, indent=2) + "\n")
        print("FAIL: no runs", file=sys.stderr)
        return 1

    task = runs[0]
    bound = task.get("runtime_id")
    ok = bound == runtime_b
    report = {
        "ok": ok,
        "issue": issue_ref,
        "agent_b": agent_b_id,
        "runtime_a": runtime_a,
        "runtime_b": runtime_b,
        "online_runtime_count": len(online),
        "task_runtime_id": bound,
        "task_status": task.get("status"),
        "failure_reason": task.get("failure_reason"),
        "isolation": "task bound to assignee runtime; does not migrate to other daemon",
        "note": "stub CLI may fail execution; binding is the P2 criterion",
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if not ok:
        print("FAIL: task runtime mismatched", file=sys.stderr)
        return 1
    print("PASS: claim isolation — task stayed on runtime B")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
