# P2 验收记录 — Aion 差距补齐 + 第二 daemon

日期：2026-08-31  
分支：`cursor/p2-aion-gap-daemon-e6b3`

## 已完成

| 项 | 结果 |
|----|------|
| Team wake 对照 skill | `adapters/skills/munder-team-wake/SKILL.md` |
| 硬闸 / AskUser skill | `adapters/skills/munder-hard-gate/SKILL.md` |
| 差距表更新 | `adapters/aion-gap.md` |
| 第二 daemon 隔离脚本 | `scripts/p2-second-daemon.sh` → `p2-second-daemon.py` |
| 壳文案 | runtime online 计数 + 不漂移说明 |

## 验收命令

```bash
./scripts/p2-second-daemon.sh
cat /tmp/munder-p2-second-daemon.json
# 可选导入 skill：
zip -r /tmp/munder-team-wake.skill adapters/skills/munder-team-wake
multica skill import --file /tmp/munder-team-wake.skill --on-conflict overwrite
```

## 判定标准

- `online_runtime_count >= 2`
- 派给 WorkerB 的 issue，其 task.`runtime_id` **等于** WorkerB 绑定的 runtime（不为另一 daemon）
- 执行失败（stub CLI）可接受；**绑定**才是隔离验收点

## 本环境实测（2026-08-31）

```json
{
  "ok": true,
  "issue": "MUL-2",
  "online_runtime_count": 2,
  "task_status": "failed",
  "isolation": "task bound to assignee runtime; does not migrate to other daemon"
}
```

`task_runtime_id` 与 `runtime_b` 一致 → **PASS**。skills 已 `multica skill import` 进演示 workspace。