# Aion 能力差距（相对 Multica 主核）

对照 `refs/AionCore` / `refs/AionUi`。P0 只列差距与 **P1 计划**；实现落在 P1/P2。

| Capability | Multica today | Aion reference | P1 计划 |
|------------|---------------|----------------|---------|
| Team 会话 / wake | skills + assign / mention / chat | Team MCP + scheduler wake | 先用 Multica assign + chat 覆盖「叫醒」；Team MCP 细粒度工具做差距清单，优先 **Multica skill** 而非旁路 gateway |
| AskUser / 权限关口 UX | Inbox + review（`in_review`）+ agent Access | ACP permission + questions | 壳内「硬闸」= Inbox 未读 + `in_review` issue；P1 映射文案，不重做协议 |
| Cowork / 远程 Web | 内置 Web + auth | AionUi remote | **优先 Multica Web**；Munder 壳作品牌层深链/只读 API |
| 多 provider CLI 编排质感 | daemon 多 runtime provider | aionrs / ACP 会话 | 对照 daemon 日志与失败理由；缺口用 skill/instructions 补，不 fork 第二执行器 |
| 角色 / 成员权限 | agent Access + workspace member | Aion 角色模型 | 文档映射到 agent permission_mode；壳只展示，不另建 ACL |
| 多机 claim / 隔离 | 每机一 daemon；task 绑 runtime | 分布式接活体验 | P2：第二台 daemon 验收「任务不漂移」 |

## P1 验收建议

1. 壳能列出 Inbox + `in_review`，文案称「待拍板 / 硬闸」  
2. 选定 1–2 个 Aion Team 工具，写成 Multica skill 草案（仍不进主核 fork）  
3. 明确：远程鉴权继续走 Multica，不引入 Aion 并行登录态  

## 参考路径

- Aion：`refs/AionCore`、`refs/AionUi`（对照，不默认 subtree）  
- Multica：`refs/multica` 文档 `inbox` / `assigning-issues` / `daemon-runtimes`
