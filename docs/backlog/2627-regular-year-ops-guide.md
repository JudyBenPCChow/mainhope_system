# 2627 常規學年營運指引（全公司守則）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（**v1.0 已寫**＋列印 docx；待產品審閱；§7 功輔留空；索引未掛；**§11 待跟出單先上紙**） |
| 優先 | 中 |
| 範圍 | `2627`（2026-09-01 → 2027-06-30）正規學年全公司員工守則（繁中、可列印） |
| 不含 | 技術實作、給 AI 指示、暑期兩期制全文、計糧全文、機構稱呼專章、每周課表、個別老師名單 |
| 產物 | [`manual/2627_REGULAR_YEAR_OPS_GUIDE.md`](../manual/2627_REGULAR_YEAR_OPS_GUIDE.md)（**v1.0**／2026-08-09）；[`manual/2627_REGULAR_YEAR_OPS_GUIDE.docx`](../manual/2627_REGULAR_YEAR_OPS_GUIDE.docx)（由腳本重出） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-08 |
| 上次更新 | 2026-08-11 |

## 結論

v1.0 員工守則已寫入 [`docs/manual/2627_REGULAR_YEAR_OPS_GUIDE.md`](../manual/2627_REGULAR_YEAR_OPS_GUIDE.md)：§1–6、§8–12 齊；**§7 功課輔導暫留空**。已有列印用 docx（Word 內建目錄＋頁碼 `— N —`；改 md 須同步重出，見 `.cursor/rules/md-docx-sync.mdc`）。

職員以 WhatsApp／列印發佈；repo 目錄（`OPS_POLICIES`／`SYSTEM_MANUAL`）**尚未掛連結**。

權威細節仍以各政策專篇為準；本指引為彙編，政策改時須同步升版。**2026-08-11：** 試堂「出單先上紙」已寫入 [`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../TRIAL_RECEIPT_BEFORE_ROSTER.md)；本指引 **§11 仍有「免費可不經付費」舊句，待升版同步 docx**。

## 章節一覽（v1.0）

| 章 | 狀態 |
| --- | --- |
| 1 文件說明 | 已寫 |
| 2 學年與報讀 | 已寫 |
| 3 排課規則 | 已寫（只規則；無課表／無具名老師） |
| 4 課室與場地 | 已寫（容量寫「未公佈」） |
| 5 專科班 | 已寫 |
| 6 一對一課程 | 已寫 |
| 7 功課輔導 | **留空**（待 [`homework-tutoring.md`](./homework-tutoring.md)） |
| 8 學費與逾期罰款 | 已寫（含參考價；$50 罰款） |
| 9 點名、請假與補堂 | 已寫 |
| 10 代堂與換主責老師 | 已寫 |
| 11 試堂 | 已寫；**待跟** [`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../TRIAL_RECEIPT_BEFORE_ROSTER.md) |
| 12 收款與單據 | 已寫（註更正流程可能更新；禁硬刪不變） |

## 已定產品決策（摘要）

| 項目 | 決定 |
| --- | --- |
| 路徑 | `docs/manual/2627_REGULAR_YEAR_OPS_GUIDE.md`；封面寫 version／更新日期 |
| 完整度 | 列印即完整（正文抄齊） |
| 發佈 | 職員 WhatsApp／列印；唔靠系統搵文件 |
| repo 索引 | 審閱後建議掛 `OPS_POLICIES`＋`SYSTEM_MANUAL`（維護用） |
| 課表／老師 | 不載每周課表；不列個別老師 |
| 功輔章 | 先留空 |
| 機構稱呼專章 | 不設 |
| 計糧 | 不寫入本指引 |
| 課室容量 | 寫「未公佈」 |
| 學費參考價 | 寫入 §8.2（以當期收費表為準） |
| 文風 | 白話；少寫系統欄位名；§1 一句不適用暑期 |
| docx | 由 `scripts/generate_2627_ops_guide_doc.py` 重出；改 md 同步 docx |

## 依賴（餘下）

| 項目 | 依賴 | 狀態 |
| --- | --- | --- |
| 補寫 §7 | [`homework-tutoring.md`](./homework-tutoring.md)（課室預設 17D／分界 17:00 已定；餘價錢／校曆／讓房） | 仍缺價／曆先可寫骨架 |
| §11 試堂升版 | [`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../TRIAL_RECEIPT_BEFORE_ROSTER.md)／[`frontline-ops-update.md`](./frontline-ops-update.md) | **待寫入 md＋重出 docx** |
| 收款 §12 更正分流措辭 | [`payment-entitlement-correction-ui.md`](./payment-entitlement-correction-ui.md)／作廢政策更新 | 正文已預留「流程可能更新」 |

## 待做

1. 產品審閱 v1.0；按意見修訂並升版（v1.1…）  
2. **§11 跟出單先上紙**；升版後重出 docx  
3. 審閱通過後掛 [`OPS_POLICIES.md`](../OPS_POLICIES.md)、[`SYSTEM_MANUAL.md`](../SYSTEM_MANUAL.md)  
4. 職員 WhatsApp／列印發佈  
5. §7：功輔拍板後補寫  
6. 刪 WIP：[`2627-regular-year-ops-guide-decisions-wip.md`](./2627-regular-year-ops-guide-decisions-wip.md)（審閱後可刪）  

## 相關

- 正文：[`manual/2627_REGULAR_YEAR_OPS_GUIDE.md`](../manual/2627_REGULAR_YEAR_OPS_GUIDE.md)
- 列印：[`manual/2627_REGULAR_YEAR_OPS_GUIDE.docx`](../manual/2627_REGULAR_YEAR_OPS_GUIDE.docx)
- 試堂總則：[`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../TRIAL_RECEIPT_BEFORE_ROSTER.md)
- WIP（可刪）：[`2627-regular-year-ops-guide-decisions-wip.md`](./2627-regular-year-ops-guide-decisions-wip.md)
- 功輔：[`homework-tutoring.md`](./homework-tutoring.md)
- 時間表（獨立；本指引不載課表）：[`2627-september-timetable.md`](./2627-september-timetable.md)
- 政策索引：[`OPS_POLICIES.md`](../OPS_POLICIES.md)
- 說明書目錄：[`SYSTEM_MANUAL.md`](../SYSTEM_MANUAL.md)
- 應用內閱讀（另題）：[`ops-docs-viewer.md`](./ops-docs-viewer.md)
