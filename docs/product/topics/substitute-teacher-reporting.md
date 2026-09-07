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
| 本波更新 | 2026-09-06（匯出盤點；更換任教老師只同步尚未開始的堂） |

## 開工閘（agent 必讀）

開工前 check 對上一個工程是否完成。**未完成：停；提醒用戶必須完成後先可以開工。**

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| 待做 1–2：薪資／堂數匯出盤點、「按老師篩出勤」、UI／匯出區分主責／當日／代堂 | [`payroll-finance-review-ux.md`](./payroll-finance-review-ux.md) | **已滿足**（2026-08-30 關帳） |
| 待做 4：小組換主責只同步未來堂 | 無 | **已滿足**（2026-09-06） |
| 暫緩 E9／可選雙重預約硬擋 | 產品另議 | 唔當可續做 |

財務核對 UX **唔使等**本題完成；該題已對齊當日 `schedules.teacher_id`。

## 結論

偶發／輪流代堂的**日常操作**行政可完成（指派代堂、當日點名）。真正風險在**報表**與**取消代堂改寫歷史**。對抗定案後本波已落地部分防呆與老師詳情出勤歸屬。

## 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 判定 | 發現的問題 |
| --- | --- | --- | --- |
| S07 | 文覺稼／文覺瑩型：同班多日輪流代課 | 可完成但易錯 | 指派 UI／名單 RPC OK；**算薪若用主責會偏**；撞堂僅警告；已點名勿隨便清代堂 |
| S08 | 代堂老師開點名 | 可完成 | 歷史 RLS 洞已補；行政仍勿改主責「圖方便」 |

## 已完成（2026-08-02）

1. **E2**：已點名（連堂組任一節）禁止 `clearScheduleSubstitute`；UI 禁用取消並提示改用更改代堂。
2. **E10**：排程管理／詳情對行政以上警告「未指定當日老師」。**功輔佔室豁免**（2026-08-31）：第二房不開／暫時空缺屬正常，跟當值編更，唔當缺實際授課老師。
3. **老師詳情出勤**：`fetchTeacherAttendance` 改跟 `schedules.teacher_id`。
4. **前線守則**＋ OPS 索引；工程文件寫入連堂整組、撞堂可確認、換主責預設、E11 異常。

## 待做

1. ~~繼續盤點薪資／堂數匯出及其他「按老師篩出勤」查詢~~ **2026-09-06 已盤＋修正消堂／上堂篩選**
2. ~~UI／匯出欄位區分「主責／當日／代堂」（未全面）~~ **2026-09-06 出席紀錄、老師詳情、計糧對帳 CSV 已標代堂；其餘頁未全面**
3. **暫緩 E9**：代課老師「我的班別」無該班的額外提醒。
4. ~~（另開）小組換主責只同步未來堂；一對一修正勿同步已過去堂~~ **2026-09-06 已落**
5. （可選）指派時雙重預約由警告升為硬擋——另議產品。
6. 計糧層 B（10% 佣金）→ [`payroll-engine.md`](./payroll-engine.md)。

## 查詢盤點（2026-09-06）

堂次／點名／算薪跟 **當日** `schedules.teacher_id`；報讀／在讀／退讀跟 **任教** `classes.teacher_id`。

| 路徑 | 老師篩選 | 判定 |
| --- | --- | --- |
| 計糧 `buildLessonInputsForMonth` | `schedules.teacher_id` | 已正確 |
| 老師詳情 `fetchTeacherAttendance` | `schedules.teacher_id` | 已正確；現加代堂標記 |
| 員工績效 `aggregateRevenueByTeacher` | `schedules.teacher_id` | 已正確 |
| 中學出席報表 | `schedules.teacher_id` | 已正確 |
| 出席紀錄 RPC／篩選 | 當日授課 | 已正確；現顯示代堂 |
| 營運總覽 `sumConsumedLessonValue`／`countAttendanceVisits` | 曾用 `classes.teacher_id` | **已改當日** |
| 營運總覽／績效 在讀、報讀、退讀 | `classes.teacher_id` | **故意**：班歸屬不是當日堂 |

## 相關程式／文件

- [`scheduleSubstitute.ts`](../../src/lib/scheduleSubstitute.ts)、`assignScheduleSubstitute`、`clearScheduleSubstitute`、`isClearScheduleSubstituteBlocked`
- [`classTeacherScheduleSync.ts`](../../src/lib/classTeacherScheduleSync.ts)：更換任教老師只同步尚未開始的堂
- RPC `get_teacher_schedule_roster_context`
- 案例表：文覺稼／文覺瑩數學必修一對二（見 `SCHEDULE_SUBSTITUTE_TEACHER` §3）
