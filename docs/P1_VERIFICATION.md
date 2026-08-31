# P1 验收记录 — Munder 壳 + 本机桥

日期：2026-08-31  
分支：`cursor/p1-munder-shell-e6b3`

## 已完成

| 项 | 结果 |
|----|------|
| 本机免登桥 `shell/bridge.mjs` | loopback-only；local 读 `~/.multica/config.json`；remote 用 env token |
| Web 壳 | assignee 看板 + runtime 在线灯 + 硬闸（Inbox / `in_review`） |
| Electron 入口 | `shell/electron/main.mjs` 拉起桥并加载 loopback |
| 单元测试 | `cd shell && npm test` |
| 产品叙述 | 硬闸 = Inbox 未归档 + `in_review`（见看板文案与 `shell/README.md`） |

## 演示

```bash
./scripts/selfhost-up.sh          # 若尚未起 Multica
multica daemon start              # runtime online
./scripts/shell-up.sh             # http://127.0.0.1:3927
curl -fsS http://127.0.0.1:3927/bridge/status
curl -fsS http://127.0.0.1:3927/bridge/board | head
```

## 说明

- 桥**不**实现第二套 claim；只代理 Multica App API。  
- Electron 为可选依赖；无 GUI 环境以 Web + `npm test` 验收。  
- 远程模式勿把 PAT 写入仓库。
