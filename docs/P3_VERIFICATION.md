# P3 验收记录 — 办公楼 · hive 导入 · 商用门禁

日期：2026-08-31  
分支：`cursor/p3-office-hive-license-e6b3`

## 已完成

| 项 | 结果 |
|----|------|
| 办公楼视图 | `shell/public`：agent 座位 + runtime 灯 + 桌上 issue；Multica Web 仍可用 |
| hive 导入 | `scripts/hive-import.sh`；样例 `fixtures/hive/tasks.json` |
| 商用许可 | `docs/COMMERCIAL_PATH.md` — 门禁未开放（仅内网） |

## 命令

```bash
./scripts/shell-up.sh          # 打开指挥台看「办公楼」
./scripts/hive-import.sh --tasks fixtures/hive/tasks.json
./scripts/hive-import.sh --tasks fixtures/hive/tasks.json --apply
cd shell && npm test
```

## 商用

**不**宣称可对外 SaaS。对外前必须走 `COMMERCIAL_PATH.md` 全部门禁。
