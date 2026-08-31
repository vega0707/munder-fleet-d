const metaEl = document.getElementById("bridge-meta");
const runtimeList = document.getElementById("runtime-list");
const gateReview = document.getElementById("gate-review");
const gateInbox = document.getElementById("gate-inbox");
const boardEl = document.getElementById("assignee-board");
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
      ws ${esc(data.bridge.workspace_id || "—")}`;
    openMultica.href = data.bridge.app_url || "http://localhost:3000";
    footCopy.textContent = data.copy?.hard_gate || "";

    renderRuntimes(data.runtimes || []);
    renderGates(data.hard_gates, data.bridge.app_url);
    renderBoard(data.issues || []);
  } catch (err) {
    metaEl.textContent = `桥接失败：${err.message}`;
    runtimeList.innerHTML = "";
    gateReview.innerHTML = `<li class="empty">${esc(err.message)}</li>`;
    gateInbox.innerHTML = "";
    boardEl.innerHTML = `<p class="empty">无法加载看板。确认 Multica 已启动且已 multica login。</p>`;
  }
}

refresh();
setInterval(refresh, 15000);
