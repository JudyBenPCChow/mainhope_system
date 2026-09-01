---
name: ops-policy-2627-sync
description: >-
  確認今次改動有冇改到校方「規則」；有則先改 policies 政策篇，再改 2627 營運指引（只 md）。
  唔好自動出 docx／pdf，除非用戶明講要發佈 Word／PDF。
  Use when finishing a feature that changes must/must-not business rules, after product
  decisions (G2/G3 等), when the user says 同步政策／對齊 2627／政策先定稿, or when checking
  whether docs/policies/_INDEX or docs/year/2627/ops-guide need updates.
  Not for pure UI/bug/perf with unchanged rules; not for 阿Po／playbooks unless user asks.
---

# 政策 ↔ 2627 同步檢查

## 一句

**只有改到「校方規則」先要改政策＋2627（markdown）。** 純工程／畫面／bug → 本 skill 結論係「唔使改」就收工。

總門牌：[`docs/README.md`](../../docs/README.md)。

## 何時用

- 功能／定案做完，收工前自檢文件
- 用戶叫「同步政策」「對齊 2627」「改完規則檢查文件」
- Handoff／PR 前懷疑舊句仲喺 2627 或政策篇

## 步驟

### 1. 判斷：有冇改規則？

問自己（對照 diff／定案／用戶說話）：

| 訊號 | 算改規則？ |
| --- | --- |
| 新／改「必須、唔准、一律、舊句作廢」 | ✅ |
| 開錯單／試堂／扣堂／罰款等**分流或條件**變咗 | ✅ |
| 只改 UI、文案語氣、效能、bug、重構，業務結果一樣 | ❌ |
| 只加工程實作，對齊**已寫死**嘅政策（無新規） | ❌（可只改「系統現況」一行） |

❌ → 回覆一句「無改規則，唔使動政策／2627」＋（可選）點名仍舊正確嘅政策篇。**停。**

✅ → 去步驟 2。

### 2. 搵權威政策篇

1. 開 [`docs/policies/_INDEX.md`](../../docs/policies/_INDEX.md) 索引表。
2. 對主題揀**一篇**（一篇一主題；唔好開新巨檔）。
3. 無對應篇 → 先問用戶要新建定係併入現有篇；新建必須掛回索引。

常見對照：

| 主題 | 政策篇 |
| --- | --- |
| 單據作廢／池調動／更正 | `docs/policies/payments/PAYMENT_RECEIPT_VOID_POLICY.md` |
| 試堂出單／上紙／人頭 | `docs/policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md` |
| 扣堂／追學費 | `docs/policies/attendance/ATTENDANCE_BILLING.md` |
| 逾期罰款 | `docs/policies/payments/TUITION_TERM_AND_LATE_FEE_POLICY.md` |
| 代堂 | `docs/policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md` |

定案若仍喺 `docs/product/topics/*`：把**已拍板**句寫入政策篇；topics 標已吸收／指回政策。**唔好**用 topics／backlog 當員工讀本真相。

### 3. 先改政策篇，再改 2627（只 md）

順序不可倒：

1. **政策篇**：寫清一句話／分流表／舊句作廢；更新文首「系統現況」；更新 `policies/_INDEX` 該列摘要。
2. **2627**：[`docs/year/2627/ops-guide.md`](../../docs/year/2627/ops-guide.md) 對應章改成**同一套意思**（可較短；唔另造第二套規）。
3. **術語**：若改主詞／定義，同步 `docs/meta/TERMINOLOGY.md` 與 `.cursor/rules/terminology.mdc`。

**預設停喺 markdown。** 唔跑 `generate_2627_ops_guide_doc.py`、唔出術語／計糧 docx／pdf。用戶要發佈時會明講「出 docx」「出 pdf」「重出 Word」——先跟 [md-docx-sync](../../.cursor/rules/md-docx-sync.mdc)。

只改寫法／例子／語氣、規則不變 → **只改 2627 md**，唔動政策篇。

### 4. 回覆格式（短）

```text
規則？ ✅／❌ — <一句>
政策：<路徑或「唔使」>
2627：§N <改咗咩／唔使>
docx／pdf：未出（要發佈先話）／用戶要求已出／唔適用
未做（另包）：阿Po／playbooks／…（除非用戶要一併）
```

## 明確唔做

- 唔為每個 PR／每次工程自動改 2627
- 唔把政策合成一本巨檔
- 唔擅自改阿Po／`playbooks`／前線 WIP→playbooks（另包或用戶點名）
- 唔用 2627 蓋過政策篇（衝突時以政策篇為準，再改 2627 跟返）
- **唔自動出 docx／pdf**（政策、2627 指引、術語表皆同）

## 維護約定來源

與 `docs/policies/_INDEX.md`「維護約定」一致：改規則＝政策先、2627 md 後；Word／PDF 另叫。
