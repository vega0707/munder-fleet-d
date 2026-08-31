---
name: munder-team-wake
description: "Map Aion Team MCP wake/spawn/message tools onto Multica assign, mention, chat, and squads. Use when an agent wants Team-style coordination without a parallel MCP gateway."
user-invocable: false
allowed-tools: Bash(multica *)
---

# Munder · Team wake → Multica（Strategy D）

对照 `refs/AionCore` Team MCP。**不**再起旁路 Team gateway；用 Multica 原生命令覆盖「叫醒 / 派活 / 协调」。

## Aion → Multica 对照

| Aion Team MCP | Multica 等价 | 备注 |
|---------------|--------------|------|
| `team_list_assistants` / `team_describe_assistant` | `multica agent list` / `multica agent get` | 选执行身份 |
| `team_spawn_agent` | `multica agent create`（绑 runtime） | Lead 审批后创建；勿同轮连发 |
| `team_members` | `multica squad member list` / `agent list` | Squad = 协调对象 |
| `team_task_create` / `update` / `list` | `multica issue create` / `update` / `list` | Issue 是工作单元 |
| `team_send_message` / `team_read_messages` | `multica issue comment add` / `list`；或 Chat | 会话写回 issue |
| `team_interrupt_agent` | `multica issue cancel-task` | 打断在飞 run |
| `team_shutdown_agent` | 归档 agent / 停止 daemon（运维） | 非日常路径 |
| Lead wake teammate | `multica issue assign --to <agent>` 或评论 `@agent` | **叫醒 = assign / mention** |

## Lead 工作流（推荐）

1. `multica agent list --output json` — 看谁在线（runtime_bound）
2. 需要多人协调时：`multica squad create --name ... --leader Michael`
3. 派活：`multica issue assign <id> --to <agent-or-squad>`
4. 跟进：`multica issue comment list` / Inbox（壳「硬闸」）
5. 打断：`multica issue cancel-task` / `multica issue runs`

## 禁止

- 自建 claim 队列或第二套 Team MCP 服务抢 Multica 任务
- 把 Aion 登录态并进 Munder 壳（远程鉴权只走 Multica）

## 参考

- Aion：`crates/aionui-api-types/src/team_tools.rs`
- Multica：`multica-squads` / `multica-mentioning` / `multica-working-on-issues` builtin skills
