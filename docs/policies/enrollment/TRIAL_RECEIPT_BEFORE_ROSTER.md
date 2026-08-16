# 試堂出單先上紙

介面用語：**繁體中文**。  
性質：**營運政策**（補習社規則）。索引見 [`OPS_POLICIES.md`](../_INDEX.md)。
機構自稱：見 [`TERMINOLOGY.md`](../../meta/TERMINOLOGY.md)（**明學教育**）。

**產品定案：** 2026-08-11  
**系統現況：** **已系統化（2026-08-16）**——點名紙只含已確認收款試堂；免費建立後跳收款；$0 單／堂數 1／計人頭手選／半價＝全價＋50% 優惠已接；確認後老師收件匣有試堂通知。人數／計糧跟 `counts_toward_headcount`。前線操作見 [`TRIAL_RECEIPT_FRONTLINE.md`](../../playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md)。

---

## 1. 一句話

**試堂必須完整出學費單並確認收款後，先增加已繳堂數，亦先上當日點名紙。未出單／未確認：不增加已繳堂數、不上點名紙。**

---

## 2. 原則

| # | 規則 |
| --- | --- |
| 1 | 試堂（全價／半價／免費）一律經**收款登記**開學費單，並**確認收款**後，先增加已繳堂數、先上當日點名紙 |
| 2 | **未出單或未確認**：不增加已繳堂數；**亦不上點名紙** |
| 3 | 免費試堂一樣要出 **$0** 學費單；**堂數填 1**（**冇**「純觀摩／堂數 0」） |
| 4 | **計人頭**與收款／已繳堂數入帳**分開**；免費試堂「計人頭」無預設，每次手選 |

### 2.1 為何唔可靠「掛勾即上紙」

家長有時口頭說「嚟到先畀」，但最終冇出現。若只靠試堂掛勾就上點名紙，名單會有幽靈名、對帳與人數統計失真。故本社規定：**出單並確認後**先增加已繳堂數及上紙。

### 2.2 三軸分開

| 軸 | 做法 |
| --- | --- |
| 名單（點名紙） | 確認收款後先上紙；唔靠「只掛試堂」 |
| 已繳堂數 | 跟學費單 `lesson_count`（免費預設 **1**） |
| 老師人頭 | 獨立勾選；唔綁死「有錢＝計人頭」 |

---

## 3. 與其他文件

| 文件 | 關係 |
| --- | --- |
| [`TRIAL_RECEIPT_FRONTLINE.md`](../../playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md) | 前線操作（出單、三種試堂、老師收件匣） |
| [`frontline-ops-update.md`](../../product/topics/frontline-ops-update.md) | 工程分題（已完成） |
| [`trial-promo-receipt-frontline-wip.md`](../../product/topics/trial-promo-receipt-frontline-wip.md) | 產品草稿（已遷入 playbook） |
| [`summer-enrollment-roster-consistency.md`](../../product/topics/summer-enrollment-roster-consistency.md) §5.6 | 母題 G3；舊「掛勾即可上紙」**已作廢** |
| [`PAYMENT_RECEIPT_VOID_POLICY.md`](../payments/PAYMENT_RECEIPT_VOID_POLICY.md) | 單據禁硬刪／作廢 |
| [`ATTENDANCE_BILLING.md`](../attendance/ATTENDANCE_BILLING.md) | 點名狀態與扣堂（本篇唔改扣堂白名單） |

---

## 4. 舊說法（作廢）

以下**不再**是本社正確做法（僅留作對照，避免舊 backlog／口頭規矩回流）：

- 「試堂掛勾即可上點名紙」
- 「未出單但點名紙上仍可有試堂名」
- 「免費試堂可不經付費／出單，直接上紙」
