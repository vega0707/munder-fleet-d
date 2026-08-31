import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = path.join(root, "scripts", "hive-import.py");
const fixture = path.join(root, "fixtures", "hive", "tasks.json");

test("hive-import dry-run plans create/skip without crashing", () => {
  const env = {
    ...process.env,
    PATH: `${process.env.HOME}/.local/bin:${process.env.PATH || ""}`,
  };
  const r = spawnSync(
    "python3",
    [script, "--tasks", fixture],
    { encoding: "utf8", env }
  );
  // May fail if multica/server down — still validate normalize path when possible
  if (r.status !== 0) {
    // Accept missing multica in pure unit env
    if ((r.stderr || "").includes("multica CLI required")) {
      assert.ok(true);
      return;
    }
  }
  assert.equal(r.status, 0, r.stderr);
  const data = JSON.parse(r.stdout);
  assert.equal(data.dry_run, true);
  assert.ok(data.plan.length >= 2);
  const actions = data.plan.map((p) => p.action);
  assert.ok(actions.includes("skip_done") || actions.includes("create") || actions.includes("exists"));
  const blocked = data.plan.find((p) => p.hive_id === "hive-1002");
  if (blocked && blocked.action === "create") {
    assert.equal(blocked.status, "in_review");
  }
});
