# 2627 常規學年營運指引（全公司守則）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（**v1.11** md＋docx＋pdf；§7 學部／兩室／小學跟中一＋§7.4 編更已寫；待 WhatsApp 發佈／SYSTEM_MANUAL 索引） |
| 優先 | 中 |
| 範圍 | `2627`（2026-09-01 → 2027-06-30）常規學年全公司員工守則（繁中書面語、可列印） |
| 不含 | 技術實作、給 AI 指示、暑期兩期制全文、計糧全文、機構稱呼專章、每周課表、個別老師名單 |
| 產物 | [`ops-guide.md`](../year/2627/ops-guide.md)（**v1.11**／2026-08-25）；[`2627_REGULAR_YEAR_OPS_GUIDE.docx`](../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.docx)／[`.pdf`](../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.pdf) |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-08 |
| 上次更新 | 2026-08-28 |

## 結論

**v1.11（2026-08-25）：** 功輔 §4／§7：不開小學部；個別小學生入中學部；預設兩室 17D／17E；期望 ≥12 人、PT≥1；小學收費跟中一。docx／pdf 已同步重出。

**v1.10（2026-08-18）：** §3.5 同日順接只適用星期五、六、日；星期一至四不強制。docx／pdf 已同步重出。

**v1.9（2026-08-17）：** §11 補老師收件匣試堂通知；點名紙標試堂；人頭跟手選計入人數／計糧。docx／pdf 已同步重出。

**v1.8（2026-08-16）：** 功輔末節讓房**不做**；佔用至營運時段結束。docx 已同步重出。

**v1.7（2026-08-16）：** 功輔 12 月／2 月收月費四分三（此兩月開放日最少）。docx 已同步重出。

**v1.6（2026-08-16）：** 功輔初中月費已簽收；§7.2 寫入三日／四日／五日／七日 × 中一至中三。docx 已同步重出。

**v1.5（2026-08-16）：** 功輔校曆已簽收；§7 寫入校曆摘要；新增**附件乙**（放假 31 日及與專科相異）。月費／編更／讓房仍待補。docx 已同步重出。

**v1.4（2026-08-15）：** 同一級專科小組已繳堂數共用；點名紙仍分班。docx 已同步重出。

**v1.3（2026-08-15）：** 按明學教育用語表重審全文，統一常規報讀、私人課程、功課輔導班、任教老師／實際授課老師、已繳／已扣堂數等用語；規則與定義不變。docx 已同步重出。

**v1.2（2026-08-12）：** 產品刪線與修改建議已套用；全文改為**繁體中文書面語**（不用廣東話）；「正規班」→「常規班」、正文少提學年 label；專科班校曆改入**附件甲**（跟 CSV；重陽**正日放假、翌日不放假**）；§11 已跟出單先上紙（全價／半價／免費）；刪 §3.6／§4.4 及「不列什麼」類句。docx 已同步重出。

員工以 WhatsApp／列印發佈；`OPS_POLICIES` 已有政策姊妹篇；**`SYSTEM_MANUAL` 索引仍未掛**本指引連結。

權威細節：校曆見 [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md)；本指引為員工彙編。

## 章節一覽（v1.11）

| 章 | 狀態 |
| --- | --- |
| 1 文件說明 | 已寫；專科附件甲、功輔附件乙 |
| 2 學年與報讀 | 已寫；學年定位併入封面 |
| 3 排課規則 | 已寫；v1.10 同日順接只限五／六／日 |
| 4 課室與場地 | 已寫；v1.11 功輔預設佔兩室 |
| 5 專科班 | 已寫 |
| 6 一對一課程 | 已寫 |
| 7 功課輔導 | 校曆＋學部／人手＋月費＋§7.4 編更已寫；讓房不做 |
| 8 學費與逾期罰款 | 已寫（試堂價改全價／半價／免費） |
| 9 點名、請假與補堂 | 已寫 |
| 10 代堂與換主責老師 | 已寫 |
| 11 試堂 | ✅ 出單先上紙；v1.9 老師收件匣 |
| 12 收款與單據 | 已寫（按錯類型分流） |
| 附件甲 專科班校曆 | ✅ 十期表＋校舍假期（21 日已入 `academic_calendar_closures`，2026-08-21） |
| 附件乙 功輔校曆 | ✅ 放假 31 日＋與專科相異（已簽收；已入 `homework_tutoring_calendar_closures`，2026-08-21） |

## 已定產品決策（摘要）

| 項目 | 決定 |
| --- | --- |
| 路徑 | `docs/year/2627/ops-guide.md`；封面寫 version／更新日期 |
| 完整度 | 列印即完整（正文＋附件甲＋附件乙） |
| 發佈 | 職員 WhatsApp／列印；唔靠系統搵文件 |
| repo 索引 | `OPS_POLICIES` 已掛校曆政策；**SYSTEM_MANUAL 仍待掛**本指引 |
| 課表／老師 | 不載每周課表；不列個別老師 |
| 專科校曆 | **附件甲**（非正文）；權威＋入庫檢查見 [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) |
| 功輔校曆 | **附件乙**；權威見 [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) §3（已簽收；放假日已入庫） |
| 重陽 | 正日放假、翌日不放假（跟 CSV；與政府假翌日可不一致） |
| 功輔章 | 校曆＋學部／人手＋月費＋§7.4 編更已寫；讓房不做 |
| 功輔月費 | §7.3；小學跟中一；12／2 月四分三；權威見 [`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md) |
| 機構稱呼專章 | 不設 |
| 計糧 | 不寫入本指引 |
| 課室容量 | 不單列；未公佈前勿當正式上限 |
| 學費參考價 | §8.2；試堂見 §11 |
| 文風 | **書面語**；少寫系統欄位名；少提「2627」以利下學年沿用 |
| docx／pdf | 由 `scripts/generate_2627_ops_guide_doc.py` 重出；改 md 同步 docx＋pdf |

## 開工閘（agent 必讀）

開工前 check 對上一個工程是否完成。**未完成：停；提醒用戶必須完成後先可以開工。**

| 本波 | 對上一個工程 | 完成條件 | 未完成就 |
| --- | --- | --- | --- |
| 發佈／掛 `SYSTEM_MANUAL` | 無 | 可獨立做（校曆＋月費＋§7.4 編更已寫） | — |
| 補寫 §7 編更 | [`homework-tutoring.md`](./homework-tutoring.md) | **完成**（v1.11 §7.4） | — |

## 依賴（餘下）

| 項目 | 依賴 | 狀態 |
| --- | --- | --- |
| 補寫 §7 其餘 | [`homework-tutoring.md`](./homework-tutoring.md) | **完成**（校曆＋月費＋§7.4 編更） |
| 專科校曆入 DB | [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) §2.4 校舍假期 21 日已寫 `academic_calendar_closures` | 已入庫（2026-08-21） |

## 待做

1. 產品再審 v1.3（如有）→ 升版重出 docx
2. 審閱通過後掛 [`SYSTEM_MANUAL.md`](../playbooks/_INDEX.md)（維護用）  
3. 員工 WhatsApp／列印發佈
4. 專科附件甲簽收後入 DB（政策篇檢查清單）  
5. 刪 WIP：[`2627-regular-year-ops-guide-decisions-wip.md`](./2627-regular-year-ops-guide-decisions-wip.md)（可刪）

## 相關

- 正文：[`manual/2627_REGULAR_YEAR_OPS_GUIDE.md`](../year/2627/ops-guide.md)
- 列印：[`manual/2627_REGULAR_YEAR_OPS_GUIDE.docx`](../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.docx)
- 校曆政策：[`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md)
- 功輔月費：[`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md)
- 試堂總則：[`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md)
- WIP（可刪）：[`2627-regular-year-ops-guide-decisions-wip.md`](./2627-regular-year-ops-guide-decisions-wip.md)
- 功輔：[`homework-tutoring.md`](./homework-tutoring.md)
- 時間表（獨立；本指引不載課表）：[`2627-september-timetable.md`](./2627-september-timetable.md)
- 政策索引：[`OPS_POLICIES.md`](../policies/_INDEX.md)
- 說明書目錄：[`SYSTEM_MANUAL.md`](../playbooks/_INDEX.md)
- 應用內閱讀（另題）：[`ops-docs-viewer.md`](./ops-docs-viewer.md)
