---
name: munder-hard-gate
description: "Map Aion ACP AskUser / permission gates to Multica Inbox + in_review hard gates for the Munder shell. Use when human approval is required before continuing."
user-invocable: false
allowed-tools: Bash(multica *)
---

# Munder · 硬闸（AskUser / permission → Multica）

Aion ACP `permission` / AskUser 在 Strategy D 中**不重做协议**。产品叙述：

> **硬闸** = Multica Inbox 未归档通知 ∪ issue.`status_category=in_review`

## 操作

```bash
# 待拍板 issue
multica issue list --output json   # 过滤 status_category == in_review

# 人侧通知
#（CLI 无专用 inbox 时）经壳 /bridge/board → hard_gates.inbox
# 或打开 Multica Web Inbox

# 把工作推到待审
multica issue status <id> in_review --no-start

# 人拍板后继续（示例）
multica issue status <id> in_progress
# 或评论指示 assignee 继续 / re-assign
```

## 与 agent Access 的关系

- 谁能跑某个 agent：Multica agent `permission_mode` / Access
- 谁必须拍板：硬闸列表里的人（Inbox 收件人 / 项目负责人）
- 壳只展示，不另建 ACL

## 参考

- AionUi：`docs/prds/conversations/acp/permissions.md`
- Munder 壳：`shell/public` 硬闸区；`docs/P1_VERIFICATION.md`
