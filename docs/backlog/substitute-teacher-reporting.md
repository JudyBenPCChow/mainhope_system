# 代堂算薪／出勤報表歸屬

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 老師堂數／出勤／算薪類查詢與匯出：應以 `schedules.teacher_id`（當日實際）為準，勿偏 `classes.teacher_id`（主責） |
| 不含 | 指派代堂 UI（已可用）；代堂名單 RLS／RPC（已補）；改班主責流程 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 政策／指引 | [`SCHEDULE_SUBSTITUTE_TEACHER.md`](../SCHEDULE_SUBSTITUTE_TEACHER.md) §4 |
| 盤點日期 | 2026-07-31 |

## 結論

偶發／輪流代堂的**日常操作**行政可完成（指派代堂、當日點名）。真正風險在**報表**：部分查詢仍偏班別主責 → 代課堂算在主責名下、代課老師偏少；已點名後若「取消代堂」歷史歸屬會漂。

## 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 判定 | 發現的問題 |
| --- | --- | --- | --- |
| S07 | 文覺稼／文覺瑩型：同班多日輪流代課 | 可完成但易錯 | 指派 UI／名單 RPC OK；**算薪若用主責會偏**；撞堂僅警告；已點名勿隨便清代堂 |
| S08 | 代堂老師開點名 | 可完成 | 歷史 RLS 洞已補；行政仍勿改主責「圖方便」 |

## 待做（建議）

1. 盤點老師詳情出勤、薪資／堂數報表、匯出：凡「誰上了幾堂」改讀 `schedules.teacher_id`（必要時顯示主責＋當日／代堂標）。
2. UI／匯出欄位區分「主責／當日／代堂」，避免只顯示一個老師名。
3. 文件化：已點名代堂禁止 clear；要改用「更改代堂」。
4. （可選）指派時雙重預約由警告升為硬擋——另議產品。

## 相關程式／文件

- [`scheduleSubstitute.ts`](../../src/lib/scheduleSubstitute.ts)、`assignScheduleSubstitute`
- RPC `get_teacher_schedule_roster_context`
- 案例表：文覺稼／文覺瑩數學必修一對二（見 `SCHEDULE_SUBSTITUTE_TEACHER` §3）
