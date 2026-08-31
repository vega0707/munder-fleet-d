#!/usr/bin/env node
/**
 * Munder local bridge — loopback-only Multica proxy.
 *
 * Local mode (default): reads ~/.multica/config.json (CLI login) and injects
 * Authorization so the Munder shell needs no separate login on this machine.
 * Remote mode: set MUNDER_MULTICA_TOKEN (+ optional MUNDER_MULTICA_SERVER_URL).
 *
 * Binds 127.0.0.1 only. Does not invent a claim bus — proxies Multica App API.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { URL } from "node:url";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.MUNDER_BRIDGE_HOST || "127.0.0.1";
const PORT = Number(process.env.MUNDER_BRIDGE_PORT || 3927);
const PUBLIC_DIR = path.join(__dirname, "public");

function loadLocalMulticaConfig() {
  const cfgPath =
    process.env.MUNDER_MULTICA_CONFIG ||
    path.join(os.homedir(), ".multica", "config.json");
  try {
    const raw = fs.readFileSync(cfgPath, "utf8");
    return { path: cfgPath, data: JSON.parse(raw) };
  } catch (err) {
    return { path: cfgPath, data: null, error: String(err.message || err) };
  }
}

function resolveUpstream() {
  const local = loadLocalMulticaConfig();
  const envToken = (process.env.MUNDER_MULTICA_TOKEN || "").trim();
  const envServer = (process.env.MUNDER_MULTICA_SERVER_URL || "").trim();
  const envApp = (process.env.MUNDER_MULTICA_APP_URL || "").trim();
  const envWs = (process.env.MUNDER_WORKSPACE_ID || "").trim();

  if (envToken) {
    return {
      mode: "remote",
      serverUrl: (envServer || local.data?.server_url || "http://localhost:8080").replace(
        /\/$/,
        ""
      ),
      appUrl: (envApp || local.data?.app_url || "http://localhost:3000").replace(/\/$/, ""),
      workspaceId: envWs || local.data?.workspace_id || "",
      token: envToken,
      configPath: null,
    };
  }

  if (local.data?.token) {
    return {
      mode: "local",
      serverUrl: (local.data.server_url || "http://localhost:8080").replace(/\/$/, ""),
      appUrl: (local.data.app_url || "http://localhost:3000").replace(/\/$/, ""),
      workspaceId: local.data.workspace_id || "",
      token: local.data.token,
      configPath: local.path,
    };
  }

  return {
    mode: "unconfigured",
    serverUrl: envServer || "http://localhost:8080",
    appUrl: envApp || "http://localhost:3000",
    workspaceId: envWs || "",
    token: "",
    configPath: local.path,
    error:
      local.error ||
      "No token in ~/.multica/config.json; run multica login or set MUNDER_MULTICA_TOKEN",
  };
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function isLoopback(addr) {
  return addr === "127.0.0.1" || addr === "::1" || addr === ":ffff:127.0.0.1";
}

async function multicaFetch(upstream, apiPath, search = "") {
  if (!upstream.token) {
    const err = new Error(upstream.error || "unconfigured");
    err.status = 503;
    throw err;
  }
  const url = `${upstream.serverUrl}${apiPath}${search || ""}`;
  const headers = {
    Authorization: `Bearer ${upstream.token}`,
    Accept: "application/json",
  };
  if (upstream.workspaceId) {
    headers["X-Workspace-Id"] = upstream.workspaceId;
  }
  const resp = await fetch(url, { headers });
  const text = await resp.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!resp.ok) {
    const err = new Error(data?.error || `Multica ${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

function contentType(filePath) {
  switch (path.extname(filePath)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function serveStatic(req, res, urlPath) {
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  rel = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(buf);
  });
}

async function buildBoard(upstream) {
  const [me, issuesResp, runtimes, agents, inbox] = await Promise.all([
    multicaFetch(upstream, "/api/me"),
    multicaFetch(upstream, "/api/issues"),
    multicaFetch(upstream, "/api/runtimes"),
    multicaFetch(upstream, "/api/agents"),
    multicaFetch(upstream, "/api/inbox"),
  ]);

  const issues = Array.isArray(issuesResp) ? issuesResp : issuesResp?.issues || [];
  const agentById = Object.fromEntries((agents || []).map((a) => [a.id, a]));
  const runtimeById = Object.fromEntries((runtimes || []).map((r) => [r.id, r]));

  const enriched = issues.map((issue) => {
    const agent = issue.assignee_type === "agent" ? agentById[issue.assignee_id] : null;
    const runtime = agent?.runtime_id ? runtimeById[agent.runtime_id] : null;
    return {
      ...issue,
      assignee_label:
        agent?.name ||
        (issue.assignee_type === "member" ? "member" : issue.assignee_type) ||
        "unassigned",
      runtime_status: runtime?.status || null,
      runtime_name: runtime?.name || null,
      deep_link: `${upstream.appUrl}`,
    };
  });

  const hardGates = {
    in_review: enriched.filter(
      (i) => i.status_category === "in_review" || i.status === "in_review"
    ),
    inbox: (inbox || []).filter((n) => !n.archived),
  };

  return {
    fetched_at: new Date().toISOString(),
    bridge: {
      mode: upstream.mode,
      server_url: upstream.serverUrl,
      app_url: upstream.appUrl,
      workspace_id: upstream.workspaceId,
    },
    me,
    runtimes: runtimes || [],
    agents: agents || [],
    issues: enriched,
    hard_gates: hardGates,
    copy: {
      hard_gate:
        "硬闸 = Multica Inbox 未归档通知 + status_category=in_review 的 issue（待人拍板）",
      assignee:
        "看板语义保持 assignee；task 绑 runtime（多 daemon 不漂移）— 见 adapters/aion-gap.md",
    },
  };
}

const server = http.createServer(async (req, res) => {
  const remote = req.socket.remoteAddress || "";
  if (!isLoopback(remote)) {
    sendJson(res, 403, { error: "bridge is loopback-only" });
    return;
  }

  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true, service: "munder-bridge" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/bridge/status") {
      const upstream = resolveUpstream();
      sendJson(res, 200, {
        mode: upstream.mode,
        server_url: upstream.serverUrl,
        app_url: upstream.appUrl,
        workspace_id: upstream.workspaceId,
        configured: Boolean(upstream.token),
        config_path: upstream.configPath,
        error: upstream.error || null,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/bridge/board") {
      const upstream = resolveUpstream();
      const board = await buildBoard(upstream);
      sendJson(res, 200, board);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/multica/")) {
      const upstream = resolveUpstream();
      const apiPath = url.pathname.replace(/^\/multica/, "") || "/";
      const data = await multicaFetch(upstream, apiPath, url.search);
      sendJson(res, 200, data);
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res, url.pathname);
      return;
    }

    sendJson(res, 405, { error: "method not allowed" });
  } catch (err) {
    sendJson(res, err.status || 500, {
      error: err.message || String(err),
      detail: err.data || null,
    });
  }
});

server.listen(PORT, HOST, () => {
  const upstream = resolveUpstream();
  console.log(`Munder bridge http://${HOST}:${PORT}  mode=${upstream.mode}`);
  if (!upstream.token) {
    console.warn(`  not configured: ${upstream.error}`);
  }
});
