# Munder 壳接入 Multica（Strategy D）

对外品牌壳是 Munder**；控制面主核是 Multica。

## 概念映射（看板语义）

| Munder / 讨论用语 | Multica | 壳侧如何用 |
|-------------------|---------|------------|
| Michael | Squad leader / 编排 agent | 显示为 assignee（agent） |
| Runtime | daemon 注册的 runtime | 在线/离线状态灯 |
| Claim | assign → task pickup | 只读看 `assignee` + task status |
| PendingDecision | Inbox / `in_review` | **硬闸**列表 |
| 角色 vega | Agent + member 权限 | 权限仍走 Multica |

本地版 = **一台机器上 1 个 daemon**（无 `solo|distributed` 旗标）。

## 快速启动（P1）

前置：Multica 自托管已起，且本机已 `multica login`（`~/.multica/config.json` 有 token）。

```bash
./scripts/shell-up.sh
# 打开 http://127.0.0.1:3927
```

可选 Electron（本机免登，加载同一 loopback 桥）：

```bash
cd shell && npm install   # 拉取 optional electron
npm run electron
```

## 接入层次

### P0a — Deep-link / iframe 过渡

壳内打开 Multica Web：`http://localhost:3000`。鉴权走 Multica。

### P0b / P1 — 本机桥 + Command Center

`shell/bridge.mjs`：

- **只绑 `127.0.0.1`**
- **local 模式**：读 `~/.multica/config.json`，代理时注入 `Authorization` → 壳免登
- **remote 模式**：`MUNDER_MULTICA_TOKEN`（+ `MUNDER_MULTICA_SERVER_URL` / `MUNDER_WORKSPACE_ID`）
- `GET /bridge/board`：issues（assignee）+ runtimes + 硬闸（Inbox + `in_review`）
- `GET /multica/*`：透传 App API（仍注入 token）

UI：`shell/public/` — Munder 品牌指挥台（assignee 看板 · runtime · 硬闸）。

### P2+ — 办公楼深度集成

壳内 **办公楼** 视图（`#office-floor`）：座位=agent、灯=runtime、卡片=assignee issues。  
**不**替换 Multica Web；深链仍可用。

Hive 迁移：`./scripts/hive-import.sh`（见 `adapters/hive-import/README.md`）。

### 商用

见 `docs/COMMERCIAL_PATH.md` — 默认仅内网。

## 本机免鉴权 vs 远程

| 场景 | 鉴权 |
|------|------|
| Munder Web/Electron ↔ 本机桥 | loopback + CLI config token（免二次登录） |
| 浏览器直连 Multica Web | Multica 邮箱验证码 / OAuth |
| 壳连远程 API | `MUNDER_MULTICA_TOKEN` |

## 不要做

- 用另一套 claim/queue 绕过 Multica assign/task
- 对外把壳叙事写成「Multica 永久品牌替换」却不改名
- 未更新 `LICENSE_NOTES.md` 就把栈当对外 SaaS 内核卖
- 把 bridge 绑到 `0.0.0.0`（会绕过本机免登边界）
