# 2627 九月常規開班時間表

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 高 |
| 範圍 | `2627`（2026-09-01 → 2027-06-30）正規小組課：定稿每周時間表 → 錄入班別／排程；唔含暑期；一對一僅方案內「預留時段」標示 |
| 不含 | 自動排課引擎；公眾假／首堂日校曆全表（可另跟）；功輔產品化（見 [homework-tutoring.md](./homework-tutoring.md)） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-08 |
| 最近更新 | 2026-08-12（方案修訂：Katie 放假五六＋連三；Mark 一／二連三＋四高中兩班＋六×1；開會改五；老師周視圖另頁；待簽收） |

## 結論

**2026-08-12 修訂候選**已寫入方案文件與 [`SCHEDULING_RULES.md`](../policies/scheduling/SCHEDULING_RULES.md)：全校課室表＋各老師一周排程（總覽；**周視圖另頁**；含每周授課時數）。**36** 小組班全具名、另 Cyndi Ng 一對一高中英文預留 1 格。**尚未營運簽收、尚未寫入 production**（仍 0 班）。未排缺口見方案「四、未排缺口」。

## 既有產物

| 文件 | 用途 |
| --- | --- |
| [`reports/2627_timetable_scheme_2026-08-08.docx`](../year/2627/timetable/2627_timetable_scheme_2026-08-08.docx)／[`.pdf`](../year/2627/timetable/2627_timetable_scheme_2026-08-08.pdf) | **現行候選**全校方案紀錄（標註修訂 2026-08-12） |
| [`reports/2627_timetable_teachers_week_2026-08-08.docx`](../year/2627/timetable/2627_timetable_teachers_week_2026-08-08.docx)／[`.pdf`](../year/2627/timetable/2627_timetable_teachers_week_2026-08-08.pdf) | **獨立附件**：各老師一周總覽；周視圖**另頁** |
| [`reports/2627_timetable_schemes.md`](../year/2627/timetable/2627_timetable_schemes.md) | 方案索引 |
| [`../../scripts/generate_2627_timetable_doc.py`](../../scripts/generate_2627_timetable_doc.py) | 重出 docx／pdf |
| [`SCHEDULING_RULES.md`](../policies/scheduling/SCHEDULING_RULES.md) | 排課權威規則（已同步 2026-08-12） |
| [`reports/2026-09-regular-year-ops-brief.md`](../year/2627/timetable/2026-09-regular-year-ops-brief.md) | 9 月常規規劃用營運描述 |
| `reports/2627_timetable_scheme_a.html`／`_b.html`、v3–v5 | 2026-07-31 歷史試排（含 TBD；已過時） |
| Session | [`../handoffs/2026-08-12-2627-september-timetable-session.md`](../handoffs/2026-08-12-2627-september-timetable-session.md)（開局用；細節以本檔＋方案 pdf 為準） |

## 本輪規則要點（已入主檔）

- 同日同室（盡量）；禁 TBD 填格  
- Christine Fan：日最早 11:30；無六  
- Jackson Lau：恰星期三＋星期六各一  
- 六／日現況不排 09:00-10:15  
- Cyndi Ng：日小組自 10:15；另預留 1 一對一高中英文  
- Katie：放假五／六；一×1、二至四各連排三堂、日×3（合共 **13**；每周 **16 小時 15 分鐘**）  
- Mark Yu：一／二連排三堂；**四高中兩班**（S5數A＋S6數A，17:45–20:15）；六×1（合共 **9**；每周 **11 小時 15 分鐘**）；無三／五／日  
- 開會空檔：**星期五** 16:30–17:45（Mark／Christine／Katie）  
- 連堂例外：Mark 一／二、Katie 二至四允許連 **3**

## 待決（定稿前）

1. 營運簽收現行兩份文件（或列出要改嘅格）  
2. 未排缺口：增聘／確認老師後是否再開一輪  
3. 首堂日策略與校曆缺口  
4. 錄入方式：人手後台 vs 批次／import  

**下游：** 員工營運指引**不載**每周課表、**不列**老師（已決）；時間表簽收／錄入仍按本分題獨立推進。

## 待做（摘要）

1. 營運定稿  
2. production 建 `2627` 小組班＋固定逢星期排程  
3. 抽樣驗證（規則驗證清單）  
4. 解阻報讀權益 live `2627` E2E（見 [summer-enrollment-roster-consistency.md](./summer-enrollment-roster-consistency.md)）  

## 相關

- 學年字典：[`ACADEMIC_YEARS.md`](../policies/academic/ACADEMIC_YEARS.md)
- 政策索引：[`OPS_POLICIES.md`](../policies/_INDEX.md)
- 報讀／點名權益：[summer-enrollment-roster-consistency.md](./summer-enrollment-roster-consistency.md)
- 員工守則（下游）：[`2627-regular-year-ops-guide.md`](./2627-regular-year-ops-guide.md)
