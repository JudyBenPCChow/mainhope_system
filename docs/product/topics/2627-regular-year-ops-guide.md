# 2627 常規學年營運指引（全公司守則）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（**v1.2** md＋docx 已出；產品刪線／書面語已吸納；**附件甲**專科校曆已入；§7 功輔仍留空；職員發佈／SYSTEM_MANUAL 索引未掛） |
| 優先 | 中 |
| 範圍 | `2627`（2026-09-01 → 2027-06-30）常規學年全公司員工守則（繁中書面語、可列印） |
| 不含 | 技術實作、給 AI 指示、暑期兩期制全文、計糧全文、機構稱呼專章、每周課表、個別老師名單 |
| 產物 | [`manual/2627_REGULAR_YEAR_OPS_GUIDE.md`](../year/2627/ops-guide.md)（**v1.2**／2026-08-12）；[`manual/2627_REGULAR_YEAR_OPS_GUIDE.docx`](../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.docx) |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-08 |
| 上次更新 | 2026-08-12 |

## 結論

**v1.2（2026-08-12）：** 產品刪線與修改建議已套用；全文改為**繁體中文書面語**（不用廣東話）；「正規班」→「常規班」、正文少提學年 label；專科班校曆改入**附件甲**（跟 CSV；重陽**正日放假、翌日不放假**）；§11 已跟出單先上紙（全價／半價／免費）；刪 §3.6／§4.4 及「不列什麼」類句。docx 已同步重出。

職員以 WhatsApp／列印發佈；`OPS_POLICIES` 已有政策姊妹篇；**`SYSTEM_MANUAL` 索引仍未掛**本指引連結。

權威細節：校曆見 [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md)；本指引為員工彙編。

## 章節一覽（v1.2）

| 章 | 狀態 |
| --- | --- |
| 1 文件說明 | 已寫；校曆改指向附件甲 |
| 2 學年與報讀 | 已寫；學年定位併入封面 |
| 3 排課規則 | 已寫（小組第 10 格不排、一對一可約；連堂上限 3／全日 6） |
| 4 課室與場地 | 已寫（已刪獨立「容量」節；五室表無容量欄） |
| 5 專科班 | 已寫 |
| 6 一對一課程 | 已寫 |
| 7 功課輔導 | **留空**（待 [`homework-tutoring.md`](./homework-tutoring.md)） |
| 8 學費與逾期罰款 | 已寫（試堂價改全價／半價／免費） |
| 9 點名、請假與補堂 | 已寫 |
| 10 代堂與換主責老師 | 已寫 |
| 11 試堂 | ✅ 已跟出單先上紙 |
| 12 收款與單據 | 已寫（按錯類型分流） |
| 附件甲 專科班校曆 | ✅ 十期表＋校舍假期（未入 DB；見政策篇） |

## 已定產品決策（摘要）

| 項目 | 決定 |
| --- | --- |
| 路徑 | `docs/year/2627/ops-guide.md`；封面寫 version／更新日期 |
| 完整度 | 列印即完整（正文＋附件甲） |
| 發佈 | 職員 WhatsApp／列印；唔靠系統搵文件 |
| repo 索引 | `OPS_POLICIES` 已掛校曆政策；**SYSTEM_MANUAL 仍待掛**本指引 |
| 課表／老師 | 不載每周課表；不列個別老師 |
| 專科校曆 | **附件甲**（非正文）；權威＋入庫檢查見 [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) |
| 重陽 | 正日放假、翌日不放假（跟 CSV；與政府假翌日可不一致） |
| 功輔章 | 先留空 |
| 機構稱呼專章 | 不設 |
| 計糧 | 不寫入本指引 |
| 課室容量 | 不單列；未公佈前勿當正式上限 |
| 學費參考價 | §8.2；試堂見 §11 |
| 文風 | **書面語**；少寫系統欄位名；少提「2627」以利下學年沿用 |
| docx | 由 `scripts/generate_2627_ops_guide_doc.py` 重出；改 md 同步 docx |

## 依賴（餘下）

| 項目 | 依賴 | 狀態 |
| --- | --- | --- |
| 補寫 §7 | [`homework-tutoring.md`](./homework-tutoring.md)（H7 功輔校曆初稿已在 `ACADEMIC_CALENDAR` §3；待簽收／價錢） | 仍缺 |
| 專科校曆入 DB | [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) §2 簽收後寫 `academic_calendar_closures` | 未入庫 |
| 收款 §12 阿Po／收據手册 | [`payment-entitlement-correction-ui.md`](./payment-entitlement-correction-ui.md) | 另包 |

## 待做

1. 產品再審 v1.2（如有）→ 升版重出 docx  
2. 審閱通過後掛 [`SYSTEM_MANUAL.md`](../playbooks/_INDEX.md)（維護用）  
3. 職員 WhatsApp／列印發佈  
4. §7：功輔拍板後補寫（可對照 `ACADEMIC_CALENDAR` §3–§4）  
5. 專科附件甲簽收後入 DB（政策篇檢查清單）  
6. 刪 WIP：[`2627-regular-year-ops-guide-decisions-wip.md`](./2627-regular-year-ops-guide-decisions-wip.md)（可刪）

## 相關

- 正文：[`manual/2627_REGULAR_YEAR_OPS_GUIDE.md`](../year/2627/ops-guide.md)
- 列印：[`manual/2627_REGULAR_YEAR_OPS_GUIDE.docx`](../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.docx)
- 校曆政策：[`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md)
- 試堂總則：[`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md)
- WIP（可刪）：[`2627-regular-year-ops-guide-decisions-wip.md`](./2627-regular-year-ops-guide-decisions-wip.md)
- 功輔：[`homework-tutoring.md`](./homework-tutoring.md)
- 時間表（獨立；本指引不載課表）：[`2627-september-timetable.md`](./2627-september-timetable.md)
- 政策索引：[`OPS_POLICIES.md`](../policies/_INDEX.md)
- 說明書目錄：[`SYSTEM_MANUAL.md`](../playbooks/_INDEX.md)
- 應用內閱讀（另題）：[`ops-docs-viewer.md`](./ops-docs-viewer.md)
