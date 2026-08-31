#!/usr/bin/env python3
"""Import munder-difflin hive tasks.json into Multica issues (Strategy D).

Does NOT run the Difflin hive protocol — only migrates the task ledger into
Multica issues so the Munder shell / Multica board becomes the source of truth.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

STATUS_MAP = {
    "todo": "todo",
    "backlog": "backlog",
    "planned": "todo",
    "doing": "in_progress",
    "in_progress": "in_progress",
    "blocked": "in_review",  # surface as 硬闸 / needs human
    "in_review": "in_review",
    "review": "in_review",
    "done": "done",
    "completed": "done",
    "cancelled": "cancelled",
    "canceled": "cancelled",
}


def run(args: list[str]) -> subprocess.CompletedProcess:
    print("+", " ".join(args), flush=True, file=sys.stderr)
    return subprocess.run(args, check=True, text=True, capture_output=True)


def run_json(args: list[str]):
    return json.loads(run(args).stdout)


def normalize_task(raw: dict) -> dict | None:
    tid = raw.get("id") or raw.get("task_id")
    if not tid:
        return None
    title = (
        raw.get("title")
        or raw.get("subject")
        or raw.get("spec")
        or raw.get("name")
        or f"hive:{tid}"
    )
    description_parts = []
    for key in ("description", "body", "spec", "notes", "result"):
        val = raw.get(key)
        if isinstance(val, str) and val.strip() and val.strip() != title:
            description_parts.append(f"**{key}**: {val.strip()}")
    description_parts.append(f"**hive_id**: `{tid}`")
    if raw.get("origin"):
        description_parts.append(f"**origin**: {raw['origin']}")
    if raw.get("needs_human"):
        description_parts.append("**needs_human**: true → imported as in_review (硬闸)")
    status_raw = str(raw.get("status") or "todo").lower()
    if raw.get("needs_human") and status_raw not in ("done", "completed", "cancelled", "canceled"):
        status_raw = "blocked"
    status = STATUS_MAP.get(status_raw, "todo")
    assignee = raw.get("assignee") or raw.get("owner") or raw.get("assignee_name")
    return {
        "hive_id": str(tid),
        "title": str(title)[:200],
        "description": "\n\n".join(description_parts),
        "status": status,
        "assignee": assignee,
        "priority": raw.get("priority"),
    }


def find_existing_by_hive_id(issues: list[dict], hive_id: str) -> dict | None:
    needle = f"**hive_id**: `{hive_id}`"
    for issue in issues:
        desc = issue.get("description") or ""
        if needle in desc:
            return issue
        # also accept metadata if present
        meta = issue.get("metadata") or {}
        if meta.get("hive_id") == hive_id:
            return issue
    return None


def resolve_assignee_id(agents: list[dict], name: str | None) -> str | None:
    if not name:
        return None
    lower = name.lower()
    for agent in agents:
        if (agent.get("name") or "").lower() == lower:
            return agent["id"]
    # fuzzy contains
    for agent in agents:
        if lower in (agent.get("name") or "").lower():
            return agent["id"]
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--tasks",
        type=Path,
        default=Path("fixtures/hive/tasks.json"),
        help="Path to hive tasks.json (array of task objects)",
    )
    parser.add_argument("--workspace-id", default=os.environ.get("MUNDER_WORKSPACE_ID", ""))
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Create/update issues in Multica (default: dry-run)",
    )
    parser.add_argument(
        "--skip-done",
        action="store_true",
        default=True,
        help="Skip hive tasks already done (default true)",
    )
    parser.add_argument("--include-done", action="store_true", help="Also import done tasks")
    args = parser.parse_args()
    skip_done = not args.include_done

    if shutil_which("multica") is None:
        print("multica CLI required on PATH", file=sys.stderr)
        return 1

    raw = json.loads(args.tasks.read_text())
    if isinstance(raw, dict) and "tasks" in raw:
        raw = raw["tasks"]
    if not isinstance(raw, list):
        print("tasks.json must be a JSON array (or {tasks:[...]})", file=sys.stderr)
        return 1

    tasks = [t for t in (normalize_task(x) for x in raw if isinstance(x, dict)) if t]
    ws_args = ["--workspace-id", args.workspace_id] if args.workspace_id else []

    issues_payload = run_json(["multica", "issue", "list", *ws_args, "--output", "json"])
    issues = issues_payload.get("issues", issues_payload) if isinstance(issues_payload, dict) else issues_payload
    agents = run_json(["multica", "agent", "list", *ws_args, "--output", "json"])

    plan = []
    for task in tasks:
        if skip_done and task["status"] == "done":
            plan.append({**task, "action": "skip_done"})
            continue
        existing = find_existing_by_hive_id(issues, task["hive_id"])
        assignee_id = resolve_assignee_id(agents, task.get("assignee"))
        if existing:
            plan.append(
                {
                    **task,
                    "action": "exists",
                    "issue": existing.get("identifier") or existing.get("id"),
                    "assignee_id": assignee_id,
                }
            )
            continue
        plan.append({**task, "action": "create", "assignee_id": assignee_id})

    print(json.dumps({"dry_run": not args.apply, "count": len(plan), "plan": plan}, indent=2))

    if not args.apply:
        print("dry-run only — pass --apply to write Multica issues", file=sys.stderr)
        return 0

    created = []
    for item in plan:
        if item["action"] != "create":
            continue
        create_args = [
            "multica",
            "issue",
            "create",
            "--title",
            item["title"],
            "--description",
            item["description"],
            "--status",
            item["status"],
            *ws_args,
            "--output",
            "json",
        ]
        issue = run_json(create_args)
        ident = issue.get("identifier") or issue.get("id")
        if item.get("assignee_id") and item["status"] not in ("done", "cancelled"):
            # assign without necessarily starting if already in_review
            assign = [
                "multica",
                "issue",
                "assign",
                ident,
                "--to-id",
                item["assignee_id"],
                *ws_args,
            ]
            if item["status"] == "in_review":
                assign.append("--no-start")
            run(assign)
        created.append({"hive_id": item["hive_id"], "issue": ident})

    print(json.dumps({"created": created}, indent=2))
    return 0


def shutil_which(cmd: str) -> str | None:
    from shutil import which

    return which(cmd)


if __name__ == "__main__":
    # ensure PATH for multica
    home = Path.home()
    os.environ["PATH"] = f"{home / '.local' / 'bin'}:{os.environ.get('PATH', '')}"
    raise SystemExit(main())
