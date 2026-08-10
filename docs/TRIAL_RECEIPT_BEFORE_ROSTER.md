# 試堂出單先上紙

介面用語：**繁體中文**。  
性質：**營運政策**（校方規條）。索引見 [`OPS_POLICIES.md`](OPS_POLICIES.md)。  
機構自稱：見 [`TERMINOLOGY.md`](TERMINOLOGY.md)（**明學教育**；禁院方、「明學補習社」、書院／學院自稱）。

**產品定案：** 2026-08-11  
**系統現況：** **核心已系統化（2026-08-11）**——點名紙 roster 只含已確認收款試堂；免費建立後跳收款；$0 單／堂數 1／計人頭手選／半價＝正價＋50% 優惠已接。餘手冊發佈、阿Po、點名紙人頭標籤見 [`backlog/frontline-ops-update.md`](backlog/frontline-ops-update.md)。

---

## 1. 一句話

**試堂必須完整出學費單並確認收款後，先有權益池入帳，亦先上當日點名紙。未出單／未確認：唔入池、唔上點名紙。**

---

## 2. 原則

| # | 規則 |
| --- | --- |
| 1 | 試堂（正價／半價／免費）一律經**收款登記**開學費單，並**確認收款**後，先入權益池、先上當日點名紙 |
| 2 | **未出單或未確認**：唔入權益池；**亦唔上點名紙** |
| 3 | 免費試堂一樣要出 **$0** 學費單；**堂數填 1**（**冇**「純觀摩／堂數 0」） |
| 4 | **計人頭**與收錢／入池**分開**；免費試堂「計人頭」無預設，每次手選 |

### 2.1 為何唔可靠「掛勾即上紙」

家長有時口頭說「嚟到先畀」，但最終冇出現。若只靠試堂掛勾就上點名紙，名單會有幽靈名、對帳與人數統計失真。故校方規定：**出單並確認後**先有權益及入紙。

### 2.2 三軸分開

| 軸 | 做法 |
| --- | --- |
| 名單（點名紙） | 確認收款後先上紙；唔靠「只掛試堂」 |
| 權益池 | 跟學費單 `lesson_count`（免費預設 **1**） |
| 老師人頭 | 獨立勾選；唔綁死「有錢＝計人頭」 |

---

## 3. 與其他文件

| 文件 | 關係 |
| --- | --- |
| [`backlog/frontline-ops-update.md`](backlog/frontline-ops-update.md) | 工程／前台流程對齊（閘點名紙、免費跳收款、人頭 UX 等） |
| [`backlog/trial-promo-receipt-frontline-wip.md`](backlog/trial-promo-receipt-frontline-wip.md) | 前線執行草稿（產品已拍板；待遷 manual） |
| [`backlog/summer-enrollment-roster-consistency.md`](backlog/summer-enrollment-roster-consistency.md) §5.6 | 母題 G3；舊「掛勾即可上紙」**已作廢** |
| [`PAYMENT_RECEIPT_VOID_POLICY.md`](PAYMENT_RECEIPT_VOID_POLICY.md) | 單據禁硬刪／作廢 |
| [`ATTENDANCE_BILLING.md`](ATTENDANCE_BILLING.md) | 點名狀態與扣堂（本篇唔改扣堂白名單） |

---

## 4. 舊說法（作廢）

以下**不再**是校方正確做法（僅留作對照，避免舊 backlog／口頭規矩回流）：

- 「試堂掛勾即可上點名紙」
- 「未出單但點名紙上仍可有試堂名」
- 「免費試堂可不經付費／出單，直接當已上紙」
