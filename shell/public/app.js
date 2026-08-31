const metaEl = document.getElementById("bridge-meta");
const runtimeList = document.getElementById("runtime-list");
const gateReview = document.getElementById("gate-review");
const gateInbox = document.getElementById("gate-inbox");
const boardEl = document.getElementById("assignee-board");
const floorEl = document.getElementById("office-floor");
const footCopy = document.getElementById("foot-copy");
const openMultica = document.getElementById("open-multica");

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusDot(status) {
  const cls = status === "online" ? "online" : status ? "offline" : "unknown";
  return `<span class="dot ${cls}" aria-hidden="true"></span>`;
}

function renderFloor(agents, issues, runtimes) {
  const runtimeById = Object.fromEntries((runtimes || []).map((r) => [r.id, r]));
  const byAssignee = new Map();
  for (const issue of issues || []) {
    if (issue.assignee_type !== "agent" || !issue.assignee_id) continue;
    if (!byAssignee.has(issue.assignee_id)) byAssignee.set(issue.assignee_id, []);
    byAssignee.get(issue.assignee_id).push(issue);
  }

  const seats = (agents || []).filter((a) => !a.archived_at);
  if (!seats.length) {
    floorEl.innerHTML = `<p class="empty">暂无 agent 座位 — 先在 Multica 创建 agent</p>`;
    return;
  }

  floorEl.innerHTML = seats
    .map((agent) => {
      const rt = agent.runtime_id ? runtimeById[agent.runtime_id] : null;
      const cards = byAssignee.get(agent.id) || [];
      const online = rt?.status === "online";
      return `<article class="desk ${cards.length ? "" : "empty-seat"}">
        <h3 class="desk-name">${esc(agent.name)}</h3>
        <div class="desk-meta">
          ${statusDot(rt?.status)} ${esc(rt?.name || "未绑定 runtime")}
          ${online ? "· 在席" : "· 空席/离线"}
        </div>
        <ul class="desk-cards">
          ${
            cards.length
              ? cards
                  .map((i) => {
                    const gate =
                      i.status_category === "in_review" || i.status === "in_review";
                    return `<li class="desk-card ${gate ? "gate" : ""}">
                      <strong>${esc(i.identifier)}</strong> ${esc(i.title)}
                      <div class="muted">${esc(i.status)}</div>
                    </li>`;
                  })
                  .join("")
              : `<li class="muted">桌上暂无任务</li>`
          }
        </ul>
      </article>`;
    })
    .join("");
}

function renderRuntimes(runtimes) {
  if (!runtimes.length) {
    runtimeList.innerHTML = `<li class="empty">暂无 runtime — 先 multica daemon start</li>`;
    return;
  }
  runtimeList.innerHTML = runtimes
    .map(
      (r) => `<li class="runtime-item">
        <span>${statusDot(r.status)}<strong>${esc(r.name || r.provider)}</strong>
          <span class="muted"> · ${esc(r.provider)} · ${esc(r.device_info || "")}</span>
        </span>
        <span class="muted">${esc(r.status)}</span>
      </li>`
    )
    .join("");
}

function renderGates(hardGates, appUrl) {
  const reviews = hardGates?.in_review || [];
  const inbox = hardGates?.inbox || [];

  gateReview.innerHTML = reviews.length
    ? reviews
        .map(
          (i) => `<li class="gate-item">
            <a href="${esc(appUrl)}" target="_blank" rel="noreferrer">${esc(i.identifier)} · ${esc(i.title)}</a>
            <span class="muted">${esc(i.assignee_label || "—")}</span>
          </li>`
        )
        .join("")
    : `<li class="empty">无 in_review</li>`;

  gateInbox.innerHTML = inbox.length
    ? inbox
        .map(
          (n) => `<li class="gate-item">
            <span><strong>${esc(n.title || n.type)}</strong><br /><span class="muted">${esc(n.body || "")}</span></span>
            <span class="muted">${n.read ? "read" : "unread"}</span>
          </li>`
        )
        .join("")
    : `<li class="empty">Inbox 空</li>`;
}

function renderBoard(issues) {
  const lanes = new Map();
  for (const issue of issues) {
    const key = issue.assignee_label || "unassigned";
    if (!lanes.has(key)) lanes.set(key, []);
    lanes.get(key).push(issue);
  }
  if (!lanes.size) {
    boardEl.innerHTML = `<p class="empty">暂无 issue</p>`;
    return;
  }
  boardEl.innerHTML = [...lanes.entries()]
    .map(([name, items]) => {
      return `<div class="lane">
        <h3>${esc(name)}</h3>
        <ul>
          ${items
            .map(
              (i) => `<li class="issue-item">
                <span>
                  <strong>${esc(i.identifier)}</strong> ${esc(i.title)}
                  <div class="muted">${esc(i.status)} · ${esc(i.status_category || "")}</div>
                </span>
                <span class="muted">${i.runtime_status ? statusDot(i.runtime_status) + esc(i.runtime_status) : "—"}</span>
              </li>`
            )
            .join("")}
        </ul>
      </div>`;
    })
    .join("");
}

async function refresh() {
  try {
    const res = await fetch("/bridge/board", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);

    metaEl.innerHTML = `mode <strong>${esc(data.bridge.mode)}</strong><br/>
      ${esc(data.me?.name || "")} · ${esc(data.me?.email || "")}<br/>
      ws ${esc(data.bridge.workspace_id || "—")}<br/>
      runtimes online <strong>${(data.runtimes || []).filter((r) => r.status === "online").length}</strong>`;
    openMultica.href = data.bridge.app_url || "http://localhost:3000";
    footCopy.textContent =
      (data.copy?.hard_gate || "") +
      " · " +
      (data.copy?.assignee || "task 绑 runtime，多 daemon 不漂移");

    renderFloor(data.agents || [], data.issues || [], data.runtimes || []);
    renderRuntimes(data.runtimes || []);
    renderGates(data.hard_gates, data.bridge.app_url);
    renderBoard(data.issues || []);
  } catch (err) {
    metaEl.textContent = `桥接失败：${err.message}`;
    floorEl.innerHTML = "";
    runtimeList.innerHTML = "";
    gateReview.innerHTML = `<li class="empty">${esc(err.message)}</li>`;
    gateInbox.innerHTML = "";
    boardEl.innerHTML = `<p class="empty">无法加载看板。确认 Multica 已启动且已 multica login。</p>`;
  }
}

refresh();
setInterval(refresh, 15000);
