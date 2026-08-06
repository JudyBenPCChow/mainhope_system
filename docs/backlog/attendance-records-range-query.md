# 出席紀錄日期範圍查詢（timeout → 專用 RPC）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（方案已定；未開工） |
| 優先 | 高 |
| 觸發 | 流動端／後台 `/AttendanceRecords` 查整月出現 `canceling statement due to statement timeout`（統計全 0） |
| 範圍 | 出席紀錄列表載入：`fetchAttendanceRecordsInRange` → `/AttendanceRecords`；同函亦服務當日儀表 `fetchAttendanceDashboardForDate` |
| 不含 | 點名紙名冊、改 `teacher_can_access_student` 廣域放寬、全面 RLS 效能重寫 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 相關 | [代堂指引](../SCHEDULE_SUBSTITUTE_TEACHER.md) · [代堂算薪／出勤報表](./substitute-teacher-reporting.md) · 排程載入熱修 `20260722110000_fix_enrollment_dates_and_schedule_rls_perf.sql` |
| 盤點 | 2026-08-06 |

## 現象與根因（已查）

1. **主查**：`attendance_details` 按 `attendance_date` 整段（常為整月）全量拉，深層 PostgREST embed（students／classes／courses／schedules／teachers）；**無分頁**；學生／班別／老師篩選只在前端。
2. **第二次查**：主查後對所有出現過的 `schedule_id` 打 `get_teacher_schedule_roster_context`（`fetchScheduleRosterContext`），只為覆寫姓名／班名；名冊其餘資料列表**無用**，整月極易再 timeout。
3. **缺索引**：有 `student_id`／`schedule_id`／複合 unique，**無**單純 `attendance_date` 索引（對照排程已有 `schedules_scheduled_date_idx`）。
4. **代堂顯示缺口**：代堂可經 `teacher_can_read_attendance` 見出席列，但 embed `students`／`classes` 受較窄 RLS；名冊 RPC 用 security definer 按堂補名。故「只抽第二次、前端再 select 補名」**不能** 100% 覆蓋代堂。

## 已定方案（決定）

**主方案：專用列表 RPC + 日期索引；列表唔再打 roster。**

| 項 | 內容 |
| --- | --- |
| RPC | 新增例如 `get_attendance_records_in_range(from, to)`（`security definer`）；只回列表需要欄位（出席列＋學生姓名、班標籤、當堂／原任／班主責老師等） |
| 授權 | 職員（`is_mgmt_staff` 等既有職員角色）：日期範圍內可見列；老師：僅 `teacher_owns_schedule_row`／等同 `teacher_can_read_attendance` 可讀之列（與點名「按堂授權、唔闊 students RLS」同一哲學） |
| 前端 | `fetchAttendanceRecordsInRange` 改打此 RPC；**刪除**對 `fetchScheduleRosterContext` 的依賴 |
| 索引 | `create index … on attendance_details (attendance_date)`；單檔 `db:apply`，禁全量 `db push` |
| 可選跟進 | 預設窗口縮短／分頁；篩選下推（非本決定之阻擋項） |

### 明確不採用（作終態）

| 做法 | 原因 |
| --- | --- |
| 只抽第二次查、不補代堂路徑 | 行政／主責多半 OK；代堂可能無名／無班名 |
| 前端「輕量」再查 `students`／`classes` | 同一套 RLS，代堂仍補唔到 |
| 列表繼續用 roster RPC | 功能可對但效能不可接受 |
| 為代堂大幅放寬 `teacher_can_access_student` | blast radius 大（學生詳情等）；當初先用按堂 definer |

### 臨時止血（僅 RPC 未上線前可考慮）

抽第二次＋日期索引可暫減 timeout，**唔當終態**；上線前若採用須知代堂顯示可能回退。

## 驗收

- 手機／桌面開出席紀錄，選整月（含上個月），唔再出 `statement timeout`；統計與列表有數。
- 職員見範圍內列；老師只見自己可讀堂次。
- **代堂老師**睇自己代上且已點名之列：學生姓名、班名齊（與主查可見列一致）。
- 代堂辨認仍以 `schedules.original_teacher_id IS NOT NULL`（主資料已有；唔靠 roster）。
- `npm run build`／相關 lint；migration 單檔已套用。

## 工程觸點（開工時）

- `src/services/attendanceQueries.ts`（`fetchAttendanceRecordsInRange`）
- `src/components/attendance/AttendanceRecordsPage.tsx`
- `supabase/migrations/` 新檔：RPC＋`attendance_date` 索引
- 可參考名冊 RPC 授權寫法：`get_teacher_schedule_roster_context`（勿重用其 enrollments／leaves 負載）
