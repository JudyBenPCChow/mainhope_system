# 代堂算薪／出勤報表歸屬

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress` |
| 優先 | 中 |
| 範圍 | 老師堂數／出勤／算薪類查詢與匯出：應以 `schedules.teacher_id`（當日實際）為準，勿偏 `classes.teacher_id`（主責） |
| 不含 | 指派代堂 UI（已可用）；代堂名單 RLS／RPC（已補）；計糧 10% 佣金引擎（見 payroll-engine） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 政策／指引 | [`SCHEDULE_SUBSTITUTE_TEACHER.md`](../policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md)；前線 [`manual/SUBSTITUTE_AND_CLASS_TEACHER_FRONTLINE.md`](../playbooks/frontdesk/SUBSTITUTE_AND_CLASS_TEACHER_FRONTLINE.md) |
| 盤點日期 | 2026-07-31 |
| 本波更新 | 2026-08-02 |

## 結論

偶發／輪流代堂的**日常操作**行政可完成（指派代堂、當日點名）。真正風險在**報表**與**取消代堂改寫歷史**。對抗定案後本波已落地部分防呆與老師詳情出勤歸屬。

## 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 判定 | 發現的問題 |
| --- | --- | --- | --- |
| S07 | 文覺稼／文覺瑩型：同班多日輪流代課 | 可完成但易錯 | 指派 UI／名單 RPC OK；**算薪若用主責會偏**；撞堂僅警告；已點名勿隨便清代堂 |
| S08 | 代堂老師開點名 | 可完成 | 歷史 RLS 洞已補；行政仍勿改主責「圖方便」 |

## 已完成（2026-08-02）

1. **E2**：已點名（連堂組任一節）禁止 `clearScheduleSubstitute`；UI 禁用取消並提示改用更改代堂。
2. **E10**：排程管理／詳情對行政以上警告「未指定當日老師」。
3. **老師詳情出勤**：`fetchTeacherAttendance` 改跟 `schedules.teacher_id`。
4. **前線守則**＋ OPS 索引；工程文件寫入連堂整組、撞堂可確認、換主責預設、E11 異常。

## 待做

1. 繼續盤點薪資／堂數匯出及其他「按老師篩出勤」查詢（如 `sumConsumedLessonValue` 語意註明或改跟排程老師）。
2. UI／匯出欄位區分「主責／當日／代堂」（未全面）。
3. **暫緩 E9**：代課老師「我的班別」無該班的額外提醒。
4. （另開）小組換主責只同步未來堂；一對一修正勿同步已過去堂。
5. （可選）指派時雙重預約由警告升為硬擋——另議產品。
6. 計糧層 B（10% 佣金）→ [`payroll-engine.md`](./payroll-engine.md)。

## 相關程式／文件

- [`scheduleSubstitute.ts`](../../src/lib/scheduleSubstitute.ts)、`assignScheduleSubstitute`、`clearScheduleSubstitute`、`isClearScheduleSubstituteBlocked`
- RPC `get_teacher_schedule_roster_context`
- 案例表：文覺稼／文覺瑩數學必修一對二（見 `SCHEDULE_SUBSTITUTE_TEACHER` §3）
