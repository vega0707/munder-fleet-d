import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHELL_ROOT = path.join(__dirname, "..");

function listenMockMultica(handlers) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const auth = req.headers.authorization || "";
      const ws = req.headers["x-workspace-id"] || "";
      const url = new URL(req.url, "http://127.0.0.1");
      const key = `${req.method} ${url.pathname}`;
      const body = handlers[key];
      if (!body) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `no handler ${key}`, auth, ws }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(typeof body === "function" ? body({ auth, ws }) : body));
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function waitHealth(port, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("bridge health timeout");
}

test("local bridge injects token and builds board with hard gates", async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "munder-bridge-"));
  const cfgPath = path.join(tmp, "config.json");
  const { server, port: apiPort } = await listenMockMultica({
    "GET /api/me": { id: "u1", name: "tester", email: "t@munder.local" },
    "GET /api/issues": {
      issues: [
        {
          id: "i1",
          identifier: "MUL-9",
          title: "Needs review",
          status: "in_review",
          status_category: "in_review",
          assignee_type: "agent",
          assignee_id: "a1",
        },
      ],
      total: 1,
    },
    "GET /api/runtimes": [
      { id: "r1", name: "Box", provider: "opencode", status: "online", device_info: "test" },
    ],
    "GET /api/agents": [
      { id: "a1", name: "Michael", runtime_id: "r1" },
    ],
    "GET /api/inbox": [
      {
        id: "n1",
        title: "Needs review",
        body: "agent failed",
        archived: false,
        read: false,
        type: "new_comment",
      },
    ],
  });

  fs.writeFileSync(
    cfgPath,
    JSON.stringify({
      server_url: `http://127.0.0.1:${apiPort}`,
      app_url: "http://localhost:3000",
      workspace_id: "ws-1",
      token: "mul_test_token",
    })
  );

  const bridgePort = 18000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [path.join(SHELL_ROOT, "bridge.mjs")], {
    cwd: SHELL_ROOT,
    env: {
      ...process.env,
      MUNDER_BRIDGE_PORT: String(bridgePort),
      MUNDER_MULTICA_CONFIG: cfgPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  t.after(() => {
    child.kill();
    server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  await waitHealth(bridgePort);

  const status = await (await fetch(`http://127.0.0.1:${bridgePort}/bridge/status`)).json();
  assert.equal(status.mode, "local");
  assert.equal(status.configured, true);
  assert.equal(status.workspace_id, "ws-1");

  const board = await (await fetch(`http://127.0.0.1:${bridgePort}/bridge/board`)).json();
  assert.equal(board.me.name, "tester");
  assert.equal(board.issues[0].assignee_label, "Michael");
  assert.equal(board.issues[0].runtime_status, "online");
  assert.equal(board.hard_gates.in_review.length, 1);
  assert.equal(board.hard_gates.inbox.length, 1);
  assert.match(board.copy.hard_gate, /硬闸/);
});

test("remote mode uses MUNDER_MULTICA_TOKEN without local config", async (t) => {
  const { server, port: apiPort } = await listenMockMultica({
    "GET /api/me": ({ auth, ws }) => {
      assert.match(auth, /^Bearer mul_remote$/);
      assert.equal(ws, "ws-remote");
      return { id: "u2", name: "remote", email: "r@munder.local" };
    },
    "GET /api/issues": { issues: [], total: 0 },
    "GET /api/runtimes": [],
    "GET /api/agents": [],
    "GET /api/inbox": [],
  });

  const bridgePort = 19000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [path.join(SHELL_ROOT, "bridge.mjs")], {
    cwd: SHELL_ROOT,
    env: {
      ...process.env,
      MUNDER_BRIDGE_PORT: String(bridgePort),
      MUNDER_MULTICA_TOKEN: "mul_remote",
      MUNDER_MULTICA_SERVER_URL: `http://127.0.0.1:${apiPort}`,
      MUNDER_MULTICA_APP_URL: "http://localhost:3000",
      MUNDER_WORKSPACE_ID: "ws-remote",
      MUNDER_MULTICA_CONFIG: path.join(os.tmpdir(), "munder-missing-config.json"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  t.after(() => {
    child.kill();
    server.close();
  });

  await waitHealth(bridgePort);
  const status = await (await fetch(`http://127.0.0.1:${bridgePort}/bridge/status`)).json();
  assert.equal(status.mode, "remote");
  const board = await (await fetch(`http://127.0.0.1:${bridgePort}/bridge/board`)).json();
  assert.equal(board.bridge.mode, "remote");
  assert.equal(board.me.name, "remote");
});
