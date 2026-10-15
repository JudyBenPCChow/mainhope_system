---
name: product-change-simulate
description: >-
  以 production 真實個案模擬「若實施方案 X」的產品後果，不改程式、不改 schema。
  Use when the user says 模擬檢查、會否有新問題、第一性原則（方案）、不要實作、
  對抗性檢查（產品方案）、war-game a proposal, or asks to simulate a backlog change
  against live cases. Not for security/RLS audits (mainhope-adversarial-audit)
  or UI walkthroughs (mainhope-operational-audit).
---

# 產品方案模擬（不改碼）

用 MainHope_production 抽樣，回答「若實施這個方案，這些人會變成怎樣」。只討論、不實作。

回覆用語：繁體中文書面語。術語見 `.cursor/rules/terminology.mdc`。

## 何時用／何時不用

| 用 | 交給別份 |
| --- | --- |
| 模擬檢查、會否有新問題、方案好壞處 | 本 skill |
| 權限／越權／RLS／資料暴露 | `mainhope-adversarial-audit` |
| 老師／行政逐步點畫面的營運巡檢 | `mainhope-operational-audit` |
| 用戶說「好，請實作」 | **結束本 skill**；請用戶開新對話實作，本窗不要開始改碼 |

沒有可查 production 的通道：**停、通知**。見 `no-forced-output-without-access.mdc`。不要用假名或舊 snapshot 充當模擬。

## 硬閘

1. 不改程式、不改 schema、不寫庫、不補扣堂、不開 PR。
2. **不要寫第二份 md**，除非用戶指定路徑。預設只回聊天。
3. 不要把「對齊名冊／修 bug」寫成「改了已拍板規則」，除非方案真的改規則。
4. 抽樣 5–10 個與方案直接相關的真實學生（或班／堂）。與方案無關的空班、暑期未續、學期完仍就讀中，不要當成缺陷（`ops-data-check.mdc`）。
5. 已有定稿覆核檔且用戶說「這份不要改」→ 只讀、只給意見，不要覆寫。

## 步驟

1. 用一至三句複述方案（用戶原文優先；有分題就 `@` 該檔，不要重抄長規格）。
2. 列出模擬假設（實施後哪一條行為會變）。假設寫不清就停、問，不要發明產品意向。
3. 查 production：現行結果（點名紙、宣告、已繳／已扣、單據狀態等，以方案所涉為準）。
4. 對每個個案推論實施後結果。分不清就標「僅推論」，不要寫成已驗證。
5. 只輸出下面兩塊；結尾只給拍板選項。

## 輸出（嚴格）

先一行結論（實施後主要風險／可接受之處）。再表：

```markdown
| 個案 | 現行結果 | 實施後結果 | 可接受／必須再調 |
| --- | --- | --- | --- |
| 姓名／班／日期（一句） | 現在系統做了什麼 | 方案落地後會怎樣 | 可接受 或 必須再調（原因一句） |
```

其後：

```markdown
## 拍板選項
1. …
2. …
（等用戶選；不要自行開工）
```

不要另寫長篇背景、不要複製政策全文、不要建議「一班一口／mega-pool／刪 makeup_of=」除非用戶本則在問那件事。

## 抽樣怎麼揀

優先：用戶點名的學生；其後同缺陷類型的其他人（例如同一條「無有效宣告仍點現場」）。人數不足 5 個就寫實際找到幾個，不要湊無關個案。
