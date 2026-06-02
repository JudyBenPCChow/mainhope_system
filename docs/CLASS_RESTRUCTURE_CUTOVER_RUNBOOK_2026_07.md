# 2026-07 Fresh Start Cutover Runbook

## Scope
- 保留：`students`、`teachers`、`app_users`、`subjects`、權限/設定類資料。
- 重錄：`classes`、`courses`、`schedules`、`student_class_enrollments`、`attendance_details`、`leave_makeup_records`、`payments`、`payment_details`、`trial_sessions`、`enrollment_change_events`。
- 目標學年：`2627`（2026-09-01 ~ 2027-08-31）。

## Pre-Cutover Checklist
- 已在 staging 完整 dry-run 一次。
- 產生 production 全庫備份（含 schema + data）。
- 匯出以下查核報表：班別總數、排程總數、出席總數、請假總數、繳費總數。
- 通知所有使用者切換時間窗，cutover 期間停用資料寫入。

## Execution Steps
1. 進入 maintenance mode（前端唯讀或暫時下線）。
2. 再次確認備份檔可還原。
3. 執行 `supabase/cutover/2026-07-fresh-start-reset.sql`。
4. 執行 smoke checks（見下方）。
5. 開放系統，開始錄入新學年班務資料。

## Smoke Checks (Post Cutover)
- `select count(*) from classes;` 應為 `0`。
- `select count(*) from schedules;` 應為 `0`。
- `select count(*) from student_class_enrollments;` 應為 `0`。
- `select count(*) from students;`、`select count(*) from teachers;` 應維持 cutover 前數量。
- `select label, is_current from academic_years order by label desc;` 至少包含 `2627 / true`。
- 前端抽查：
  - 班別列表可開啟且顯示空狀態。
  - 新增班別可依「學年→科目→年級→課程→班號」建立。
  - 排程、點名、請假、繳費頁可正常載入且空資料無錯誤。

## Rollback Procedure
1. 立即切回 maintenance mode。
2. 以 cutover 前 full backup 還原整庫（schema + data）。
3. 重新執行 smoke checks，確認舊資料完整。
4. 發佈回退公告，排查 cutover SQL 與執行紀錄。

## Notes
- 本 runbook 嚴禁在「無備份」情況下執行。
- 如需多次 rehearsal，可在 staging 重複執行 reset SQL；production 僅在最終時窗執行一次。
