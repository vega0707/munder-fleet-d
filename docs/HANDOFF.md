# HANDOFF — munder-fleet-d

> 下一个 Agent/人类：以 Multica 为主核开工。

## 背景

A/B/C 之外补 **D**：用户追问「为什么不以 Multica 为主」。结论是——**可以，而且分布式最强**；代价是许可与栈，以及 Munder/Aion 体验要外挂。

跨策略仍成立：

- 无 `solo|distributed` 开关；本地 = 单 runtime/daemon  
- 看板语义尽量保持 **assignee**  
- Electron 本机免鉴权（若壳是 Munder）；连 Multica Web 则走 Multica 鉴权  
- 品牌对外：Munder  

## 立刻该做

> **P0–P3 已落地**（2026-08-31）。**商用暂不考虑**（仅内网），见 `docs/COMMERCIAL_PATH.md`。

1. 读 `LICENSE_NOTES.md`（仅自用/内网；不跟商用）
2. `./scripts/bootstrap.sh` → `./scripts/selfhost-up.sh` → `multica daemon start`
3. `./scripts/shell-up.sh` — 指挥台含**办公楼**座位视图
4. `./scripts/hive-import.sh --tasks fixtures/hive/tasks.json [--apply]`
5. `./scripts/p2-second-daemon.sh` — 多 daemon 隔离（可选复验）
6. 映射概念见下表；Aion skill 见 `adapters/skills/`

| Munder / 讨论用语 | Multica |
|-------------------|---------|
| Michael | Squad leader / 编排 agent |
| Runtime | daemon × CLI |
| Claim | assign / pickup（绑 runtime） |
| PendingDecision | Inbox / review → **硬闸** |
| 办公楼座位 | agent + runtime 在席状态 |
| 角色 vega | Agent + member 权限 |

## 不要做

- 未看法务就把 Multica 当对外 SaaS 内核卖
- 用 Multica UI 永久替换 Munder 品牌却不改名（产品叙事混乱）
- 同时大改 Multica 服务端 + 重写 daemon（先上游默认路径跑通）

## 姊妹仓

- A：AionCore 主核（若 D 许可不通可回退）  
- B：TS 自研对齐（许可最干净的工程路径之一）  
- C：规格 oracle  
