# Aion 能力差距（相对 Multica 主核）

对照 `refs/AionCore` / `refs/AionUi`。实现落在 **adapters/** 与壳，不 subtree 进主核。

| Capability | Multica today | Aion reference | 状态 / 补法 |
|------------|---------------|----------------|-------------|
| Team 会话 / wake | skills + assign / mention / chat / squad | Team MCP（`team_spawn_agent` 等） | **P2**：skill `adapters/skills/munder-team-wake` |
| AskUser / 权限关口 UX | Inbox + `in_review` + agent Access | ACP permission | **P1 壳硬闸** + skill `munder-hard-gate` |
| Cowork / 远程 Web | 内置 Web + auth | AionUi remote | 优先 Multica Web；壳深链 |
| 多 provider CLI 编排质感 | daemon 多 provider | aionrs / ACP | 不 fork 执行器；用 skill/instructions |
| 角色 / 成员权限 | agent permission_mode | Aion 角色 | 壳只展示，不另建 ACL |
| 多机 claim / 隔离 | task 绑 runtime | 分布式接活 | **P2**：`scripts/p2-second-daemon.sh`（第二 `--profile` daemon） |

## 导入 skill（可选，写入当前 Multica workspace）

```bash
cd adapters/skills
zip -r /tmp/munder-team-wake.skill munder-team-wake
zip -r /tmp/munder-hard-gate.skill munder-hard-gate
multica skill import --file /tmp/munder-team-wake.skill --on-conflict overwrite --output json
multica skill import --file /tmp/munder-hard-gate.skill --on-conflict overwrite --output json
```

## 第二 daemon 验收

```bash
./scripts/p2-second-daemon.sh
# 报告：/tmp/munder-p2-second-daemon.json — ok=true 且 task_runtime_id == runtime_b
```

同机双 profile 模拟两台机器（上游支持）；真多机只需第二台装 CLI + `daemon start`。

## 参考路径

- Aion：`refs/AionCore/crates/aionui-api-types/src/team_tools.rs`、AionUi ACP permissions  
- Multica：inbox / assigning-issues / daemon-runtimes / squads  
- 壳：`shell/bridge.mjs` → `hard_gates`
