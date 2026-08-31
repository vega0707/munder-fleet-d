# 商用路径门禁 — Strategy D（Multica 主核）

> 改商用叙事前必须先更新本文件与 `LICENSE_NOTES.md`（见 `AGENTS.md`）。

## 默认（当前）

| 项 | 状态 |
|----|------|
| 适用场景 | **仅组织内自用 / 内网自托管**（`LICENSE_NOTES.md` 已勾选） |
| 对外 SaaS | **禁止**，直至获得 Multica producer 商业许可 + 法务签字 |
| 嵌入售卖 | **禁止**（Part I：不得作为商业产品嵌入组件对外分发） |
| 对外品牌 | 可称 **Munder**；文档可写 powered by / based on Multica（保留 NOTICE） |

## 若需要对外商用

按顺序，缺一不可：

1. **法务**：阅读上游 `refs/multica/LICENSE` Part I；书面确认场景（SaaS / 嵌入 / 双模式）
2. **商务**：与 Multica producer 谈妥商业许可条款与费用
3. **勾选**：更新 `LICENSE_NOTES.md` → 「需对外产品（已谈许可）」+ 人类签名日期
4. **ROADMAP**：仅在上述完成后，把本文件「开放条件」改为已满足，并单独立项工程改造
5. **NOTICE**：Fork/衍生保留上游 LICENSE/NOTICE

## 开放条件（检查清单）

- [ ] 律师书面意见归档
- [ ] 商业许可合同编号：____________
- [ ] `LICENSE_NOTES.md` 复签完成
- [ ] 产品叙事已区分 Munder 壳 vs Multica 主核义务

**当前：全部未勾选 → 不得对外售卖或以 Multica 为内核提供第三方托管。**

## 工程上已就绪、许可未就绪的能力

P0–P2 的自托管、壳、导入工具可在**组织内**使用；它们不构成对外商用授权。
