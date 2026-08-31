# DECISIONS — Strategy D

## 2026-08-31 — 增设 Multica 主核策略

回应「为什么不以 Multica 为主」：并行增加 D 仓；不废除 A/B/C。

## 2026-08-31 — 本地 = 单 daemon

与跨策略一致，无双模式。

## 2026-08-31 — 法务门禁

对外嵌入/SaaS 默认禁止，直到 LICENSE_NOTES 勾选通过。

## 2026-08-31 — P0 场景勾选

`LICENSE_NOTES.md` 确认为 **仅自用/内网**；对外产品须人类复签后再改叙事。

## 2026-08-31 — P0 上游默认路径

自托管走官方 `docker-compose.selfhost.yml`（经 `scripts/selfhost-up.sh`）；不并行自研 claim 总线。嵌套容器环境需 vfs storage + 可能关闭 `bridge-nf-call-iptables`（见 `docs/P0_VERIFICATION.md`）。

## 2026-08-31 — P1 本机桥免登

Munder 壳经 `127.0.0.1` bridge 注入本机 Multica CLI token；远程显式 PAT。硬闸 = Inbox + `in_review`。不新增 claim 总线。

## 2026-08-31 — P2 Aion 差距与双 daemon

Team MCP → Multica skill（`adapters/skills`）；第二 daemon 用 `--profile` 验收 task↔runtime 绑定，不迁移。

## 2026-08-31 — P3 办公楼 / hive / 商用门禁

壳内办公楼视图只消费 Multica board；hive `tasks.json` 可导入为 issues；对外商用仍关闭（`COMMERCIAL_PATH.md`）。
