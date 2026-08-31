# ROADMAP — Strategy D

## P0 — Multica 单节点 = 本地版

- [x] bootstrap refs；自托管 server + 本机 daemon（`scripts/bootstrap.sh` + `scripts/selfhost-up.sh`）  
- [x] 用 Multica 原生路径跑通：建项目 → 派 agent → 执行(claim) → review（真模型需真实 CLI；见 `docs/P0_VERIFICATION.md`）  
- [x] 写 `shell/README.md`：Munder 壳接入选项（API 只读 / 后期办公楼）  
- [x] 完成 `LICENSE_NOTES` 勾选（仅自用/内网）  

## P1 — Munder 壳 + 概念映射

- [x] Electron/Web 壳展示任务（assignee）与 runtime 在线状态（`shell/public` + `bridge.mjs`）  
- [x] 本机壳免登连本机桥；远程走 Multica auth（`MUNDER_MULTICA_TOKEN`）  
- [x] 待定/Inbox 映射到「硬闸」产品叙述  

## P2 — Aion 差距补齐

- [x] 对照 Aion Team/关口：Multica skill 草案（`adapters/skills/munder-team-wake`、`munder-hard-gate`）  
- [x] 多机第二个 daemon 验收 claim/隔离（`scripts/p2-second-daemon.sh`）  

## P3 — 品牌与迁移

- [x] Munder 办公楼深度集成（壳内 floor 视图；不替换 Multica Web）  
- [x] 从 munder-difflin hive 导入任务（`scripts/hive-import.sh` + `fixtures/hive`）  
- [x] 商用路径：**暂不考虑**（`docs/COMMERCIAL_PATH.md` 已标明仅内网、不排期对外）  
