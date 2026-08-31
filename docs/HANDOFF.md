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

> **P0–P2 已落地**（2026-08-31）：见 `docs/P0_VERIFICATION.md`、`P1_VERIFICATION.md`、`P2_VERIFICATION.md`。下一位从 **P3** 或复现第二 daemon 开始。

1. 读 `LICENSE_NOTES.md`，确认使用场景（组织内自托管 vs 对外产品）— 已勾选「仅自用/内网」
2. `./scripts/bootstrap.sh`
3. `./scripts/selfhost-up.sh` + `multica daemon start`
4. `./scripts/shell-up.sh` — Munder 指挥台 http://127.0.0.1:3927
5. `./scripts/p2-second-daemon.sh` — 第二 profile daemon，验收 task 不漂移
6. 映射概念：

| Munder / 讨论用语 | Multica |
|-------------------|---------|
| Michael | Squad leader / 编排 agent |
| Runtime | daemon × CLI |
| Claim | assign / agent pickup（绑 runtime） |
| PendingDecision | Inbox / review → 壳**硬闸** |
| 角色 vega | Agent + member 权限 |

7. Aion 差距：`adapters/aion-gap.md` + `adapters/skills/*`

## 不要做

- 未看法务就把 Multica 当对外 SaaS 内核卖
- 用 Multica UI 永久替换 Munder 品牌却不改名（产品叙事混乱）
- 同时大改 Multica 服务端 + 重写 daemon（先上游默认路径跑通）

## 姊妹仓

- A：AionCore 主核（若 D 许可不通可回退）  
- B：TS 自研对齐（许可最干净的工程路径之一）  
- C：规格 oracle  
