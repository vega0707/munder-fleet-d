# Munder 壳接入 Multica（Strategy D）

对外品牌壳是 Munder**；控制面主核是 Multica。P0 不替换 Multica Web，只定接入路径。

## 概念映射（看板语义）

| Munder / 讨论用语 | Multica | 壳侧如何用 |
|-------------------|---------|------------|
| Michael | Squad leader / 编排 agent | 显示为 assignee（agent） |
| Runtime | daemon 注册的 runtime | 在线/离线状态灯 |
| Claim | assign → task pickup | 只读看 `assignee` + task status |
| PendingDecision | Inbox / `in_review` | 「硬闸」列表入口 |
| 角色 vega | Agent + member 权限 | 权限仍走 Multica |

本地版 = **一台机器上 1 个 daemon**（无 `solo|distributed` 旗标）。

## 接入选项（由浅到深）

### P0a — Deep-link / iframe 过渡（最快）

- 壳内打开 Multica Web：`http://localhost:3000`（自托管）或组织域名。
- 深链示例：
  - 看板 / 项目：`/workspaces/{slug}/...`（以当前 Multica Web 路由为准）
  - Issue：通过 identifier（如 `MUL-1`）在 Web 内打开
  - Inbox / review：Web Inbox；状态类别 `in_review` = 待人拍板
- 鉴权：远程走 Multica；本机 Electron 后期可免登桥接（P1）。

适用：先演示品牌壳 + 原生能力，不写适配代码。

### P0b — App API 只读看板（推荐 P0 交付）

用 **成员 JWT 或 PAT（`mul_...`）** 调 Multica App API（默认 `http://localhost:8080`）。  
Public API v1 目前 mainly Issue/Comment 切片；壳看板优先走 Web 同款 App API。

只读最小集合（均需 `Authorization: Bearer <token>`，并带 workspace 上下文——CLI/`X-Workspace-Id` 或路径内 workspace）：

| 用途 | 端点（示意） |
|------|----------------|
| 当前用户 | `GET /api/me` |
| 工作区 | `GET /api/workspaces` |
| 项目 | `GET /api/projects`（workspace 作用域） |
| 任务/Issue（assignee） | `GET /api/issues` |
| Runtime 在线 | `GET /api/runtimes` |
| Agent | `GET /api/agents` |
| 待办/闸口 | `GET /api/inbox` + issue `status`/`status_category=in_review` |

CLI 等价验收（本仓 P0 已跑通）：

```bash
multica project list --output json
multica issue list --output json
multica runtime list --output json
multica agent list --output json
```

壳 UI 建议：**一张 assignee 看板**（member/agent/squad）+ runtime 在线点；不要并行再造 claim 总线。

### P1 — 写操作 + 本机免鉴权桥

- 派单：`POST` assign / `multica issue assign`
- 本机 Electron：loopback 桥签发短时 token；远程仍 Multica auth
- 办公楼可视化：只消费上述只读模型，不另起 hive 协议

### P2+ — 办公楼深度集成

见 `docs/ROADMAP.md` P3；Multica Web 可长期作过渡控制台。

## 本机免鉴权 vs 远程

| 场景 | 鉴权 |
|------|------|
| Munder Electron ↔ 本机 Multica | P1：本机桥免登 |
| 浏览器打开 Multica Web | Multica 邮箱验证码 / OAuth |
| 壳连远程 API | Multica PAT 或 session |

## 不要做

- 用另一套 claim/queue 绕过 Multica assign/task
- 对外把壳叙事写成「Multica 永久品牌替换」却不改名
- 未更新 `LICENSE_NOTES.md` 就把栈当对外 SaaS 内核卖
