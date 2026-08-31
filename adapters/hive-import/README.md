# Hive → Multica 导入

从 **munder-difflin** 的 `hive/tasks.json` 迁任务到 Multica issues。  
不运行 Difflin hive 协议 / claim 总线 — 只做 ledger 迁移。

## 用法

```bash
# dry-run（默认）
./scripts/hive-import.sh --tasks fixtures/hive/tasks.json

# 写入 Multica
./scripts/hive-import.sh --tasks /path/to/hive/tasks.json --apply
```

## 字段映射

| hive（宽松） | Multica |
|--------------|---------|
| `id` | 写入 description `hive_id`（幂等） |
| `title` / `subject` / `spec` | issue title |
| `description` / `body` / `notes` | description |
| `assignee` / `owner` | 按 agent **name** 匹配后 `issue assign` |
| `status` todo/doing/blocked/done… | todo / in_progress / in_review / done |
| `needs_human: true` | 视为 blocked → `in_review`（硬闸） |

已存在相同 `hive_id` 的 issue 会跳过创建。默认跳过 `done`（`--include-done` 可导入）。

## 样例

见 `fixtures/hive/tasks.json`。
