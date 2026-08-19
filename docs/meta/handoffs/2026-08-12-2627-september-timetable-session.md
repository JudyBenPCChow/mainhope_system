# Session HANDOFF：2627 九月常規時間表方案

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-12 |
| 主題／backlog | [`docs/product/topics/2627-september-timetable.md`](../backlog/2627-september-timetable.md) |
| 分支／工作樹 | `main`；本主題產物已在 repo（見 `d0310ce0` 等）；工作樹另有無關未提交（校曆／員工指引等） |

## 目標
- 把 2627 九月常規小組課試排升級為可簽收嘅專業紀錄（規則＋全校表＋老師一周表）
- 更新排課規則；方案待營運簽收後再入 production

## 已完成
- `docs/policies/scheduling/SCHEDULING_RULES.md`：同日同室、Christine 日最早 11:30、禁 TBD、Jackson 三＋六、六／日不排 09:00、Cyndi Ng 日最早 10:15＋一對一高中英文預留
- 全校方案：`docs/year/2627/timetable/archive/2026-08-08/2627_timetable_scheme_2026-08-08.{docx,pdf}`（36 小組班＋1 預留；無驗證摘要；格內全寫）
- 老師附件：`docs/year/2627/timetable/archive/2026-08-08/2627_timetable_teachers_week_2026-08-08.{docx,pdf}`（一周總覽＋大學課表式周視圖；無分日明細）
- 生成腳本：`scripts/generate_2627_timetable_doc.py`（嵌入新細明體／PMingLiU）
- 索引：`docs/year/2627/timetable/2627_timetable_schemes.md`；backlog／`BACKLOG.md` 本輪收尾會再對齊

## 未完成／卡住
- **營運未簽收**；prod `2627` 仍 0 班
- 未排缺口：初中英／數第二班、中六英文第二班等（禁 TBD 填格）
- 首堂日／校曆、錄入方式未決
- 方案文件生成驗證：腳本自檢；**未**跑 `npm run build`（純 docs／腳本）

## 下一步（給新會話）
1. 請營運審閱兩份 pdf（全校＋老師周視圖）；收集改格意見或簽收
2. 簽收後：按 `SCHEDULING_RULES.md` 驗證清單，於 production 建 `2627` 班別＋逢星期排程
3. 解阻 [`summer-enrollment-roster-consistency.md`](../backlog/summer-enrollment-roster-consistency.md) live `2627` E2E

## 開局必讀（精簡）
- `AGENTS.md`
- `docs/product/topics/2627-september-timetable.md`
- `docs/policies/scheduling/SCHEDULING_RULES.md`
- （改表時）`scripts/generate_2627_timetable_doc.py`

## 勿再踩
- PDF 唔好用簡體宋體／錯 TTC face → 會缺字亂碼；要用 **新細明體（PMingLiU）** 嵌入
- 時間表格內禁簡稱（唔寫 S6／功／TBD）；專科格三行：班別全寫、老師全名、時段
- 方案文件唔要「驗證摘要」章；老師附件唔要分日明細，要周視圖

## 明確唔做
- 未簽收前唔入 production 班務
- 唔自動排課引擎；員工營運指引不載每周課表／老師名單（見分題「下游」）
- 本 handoff 唔處理工作樹上其他未提交（校曆 handout／員工指引等）
