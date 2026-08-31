# P0 验收记录 — Multica 单节点 = 本地版

日期：2026-08-31  
环境：Cloud Agent（嵌套容器）；Multica `v0.4.37`；CLI `0.4.37`

## 已完成

| 项 | 结果 |
|----|------|
| `./scripts/bootstrap.sh` | 已 clone `refs/{multica,AionCore,AionUi,munder-difflin}` |
| 自托管 server | `docker compose -f docker-compose.selfhost.yml`；`GET /healthz` → `db=ok, migrations=ok`；Web `:3000` |
| 本机 daemon | `multica daemon status` → running；`runtime` **online**（provider `opencode`） |
| 原生路径 | workspace → project → agent(Michael) → issue `MUL-1` assign → task pickup → status `in_review` |
| `shell/README.md` | API 只读 / deep-link / 后期办公楼 |
| `adapters/aion-gap.md` | 含 P1 计划 |
| `LICENSE_NOTES.md` | 勾选「仅自用/内网」默认场景 |

## 演示命令摘要

```bash
./scripts/bootstrap.sh
./scripts/selfhost-up.sh          # 在 refs/multica 起官方 compose
# 登录：无 Resend 时看 backend 日志 `[DEV] Verification code`
multica config set server_url http://localhost:8080
multica config set app_url http://localhost:3000
multica login --token mul_...
multica workspace create --name "..." --slug ...
multica workspace switch <slug>
multica daemon start
multica project create --title "..."
multica agent create --name Michael --runtime-id <id> --visibility workspace
multica issue create --title "..." --project <id>
multica issue assign MUL-1 --to Michael
multica issue status MUL-1 in_review --no-start
```

## 环境注意

1. **嵌套 overlay**：若 `docker pull` 报 whiteout `operation not permitted`，dockerd 使用 `"storage-driver":"vfs"`。  
2. **桥接丢包**：若 backend 连不上 postgres，试 `sysctl -w net.bridge.bridge-nf-call-iptables=0`（见 `scripts/selfhost-up.sh`）。  
3. **真执行**：daemon 上线只需 PATH 上有可探测的 agent CLI；**真正跑通模型推理**需安装真实 Claude/Codex/OpenCode 等并完成其登录。本记录用 stub 验证了 claim/派发链路；执行失败属预期。  
4. **镜像 tag**：建议 `MULTICA_IMAGE_TAG=v0.4.37`（或与 CLI 对齐的已发布 tag），避免 `:latest` 未发布。

## 未纳入 P0

- Munder Electron 本机免登桥（P1）  
- 第二台 daemon / 多机隔离（P2）  
- 对外 SaaS 许可（需法务，见 LICENSE_NOTES）
