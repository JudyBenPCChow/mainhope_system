# 出席紀錄日期範圍查詢（timeout → 專用 RPC）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-06；方案 B：預設整月） |
| 優先 | 高 |
| 觸發 | 流動端／後台 `/AttendanceRecords` 查整月出現 `canceling statement due to statement timeout`（統計全 0） |
| 範圍 | 出席紀錄列表載入：`fetchAttendanceRecordsInRange` → `/AttendanceRecords`；同函亦服務當日儀表 `fetchAttendanceDashboardForDate` |
| 不含 | 點名紙名冊、改 `teacher_can_access_student` 廣域放寬、全面 RLS 效能重寫 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 相關 | [代堂指引](../policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md) · [代堂算薪／出勤報表](./substitute-teacher-reporting.md) · 排程載入熱修 `20260722110000_fix_enrollment_dates_and_schedule_rls_perf.sql` |
| 盤點 | 2026-08-06 |
| 審閱 | 2026-08-06 第一性原則檢查後補契約；同日角色模擬（行政／老師／代堂）補運作問題 → 見「開工須一併解決」 |
| 落地 | migration `20260806135000_attendance_records_range_rpc.sql`（索引＋`get_attendance_records_in_range`）；前端改 RPC、刪列表 roster；文案改本月；錯誤隱藏 KPI＋重試；老師路徑信 RPC |

## 現象與根因（已查）

1. **主查**：`attendance_details` 按 `attendance_date` 整段（常為整月）全量拉，深層 PostgREST embed（students／classes／courses／schedules／teachers）；**無分頁**；學生／班別／老師篩選只在前端。
2. **第二次查**：主查後對所有出現過的 `schedule_id` 打 `get_teacher_schedule_roster_context`（`fetchScheduleRosterContext`），只為覆寫姓名／班名；名冊其餘資料列表**無用**，整月極易再 timeout。客戶端雖按 `MAX_SCHEDULE_IDS=100` 分 chunk（故單次唔一定撞 `TOO_MANY_SCHEDULES`），但整月仍變成 **N 次重負載 roster**（production 2026-07：236 distinct 堂 → **3 chunks**），同樣 timeout。
3. **缺索引**：有 `student_id`／`schedule_id`／複合 unique，**無**單純 `attendance_date` 索引（對照排程已有 `schedules_scheduled_date_idx`）。production 已確認。
4. **代堂顯示缺口**：代堂可經 `teacher_can_read_attendance` 見出席列，但 embed `students`／`classes` 受較窄 RLS；名冊 RPC 用 security definer 按堂補名。故「只抽第二次、前端再 select 補名」**不能** 100% 覆蓋代堂。量可細（2026-07 僅 4 筆代堂出席列）但核對信任受損。
5. **預設窗＝整月（日常最大壓力源）**：`AttendanceRecordsPage` 文案寫「預設顯示今天」，實作 `dateRange = currentMonthRange()`；桌面預設 viewMode＝列表。行政／老師**一開頁**就打最重路徑，唔使特意撳「今月」。
6. **失敗 silent 全 0**：`reload` catch 後 `setRows([])`；KPI／月視表／看板無法分辨「載入失敗」與「真的零」，日常易誤判無人點名。

**本質**：產品只需要「日期範圍列表＋可讀標籤＋既有授權」；現行把列表硬塞進深 embed＋點名紙名冊 RPC，形狀同用途唔匹配。

**Production 量級（2026-08-06）**：全表約 577 列；2026-07＝460 列／236 堂／45 班；2026-08（至盤點）＝117 列／49 堂；`statement_timeout`＝120s。瘦 RPC＋索引現況多數可過；成長後仍要守無界量契約。

## 已定方案（決定）

**主方案：專用列表 RPC + 日期索引；列表唔再打 roster。**

| 項 | 內容 |
| --- | --- |
| RPC | 新增例如 `get_attendance_records_in_range(from, to)`（`security definer`）；回傳嚴格白名單（見下），**禁止**做成第二個 roster |
| 授權 | 見「開工契約」§授權謂詞 |
| 前端 | `fetchAttendanceRecordsInRange` 改打此 RPC；**刪除**對 `fetchScheduleRosterContext` 的依賴 |
| 索引 | `create index … on attendance_details (attendance_date)`；單檔 `db:apply`，禁全量 `db push` |
| 無界量 | 職員整月＝全機構列；瘦 RPC＋索引多數可過 timeout。若驗收仍 timeout → **同波**上分頁或縮預設窗（升格為阻擋項，唔好只當跟進） |
| 可選跟進 | 篩選下推（學生／班／老師）——非本決定阻擋項；與分頁分開 |

### 開工契約（必須遵守）

#### 1. 授權謂詞

- 角色 gate：`is_mgmt_staff() or is_teacher_role()`（與最新 roster migration 一致；`is_mgmt_staff` 已含 `finance`；側欄 `/AttendanceRecords` 已開畀 finance）。
- **職員**：日期範圍內可見列（`is_mgmt_staff()`）。
- **老師**：對齊出席 SELECT 政策——對每列呼叫 **`teacher_can_read_attendance(class_id, schedule_id)`**（或等價 SQL），**唔好**只寫 `teacher_owns_schedule_row` 而日後兩邊分叉。語意＝當堂／原任／班主責可讀；與點名「按堂授權、唔闊 students RLS」同一哲學。
- 函內過濾；唔信 client 傳入的老師／班 id。

#### 2. 回傳欄位白名單

只輸出對齊 `AttendanceRecordRow`／畫面需要者，例如：

- 出席：`id`, `student_id`, `class_id`, `schedule_id`, `attendance_date`, `status`, `remarks`, `updated_at`
- 學生顯示：`full_name`, `english_name`, `grade`
- 班標：`subject`, `course_code_full`, `course_name`（組 `formatClassLabel`）
- 老師：當堂 `teacher_id`／名、原任 `original_teacher_id`／名、班主責 `class.teacher_id`（篩選用）

**禁止**回傳 enrollments／leaves／trials／periods／名冊其餘負載。參考 roster 只取其**授權／definer 寫法**，勿抄 payload。

#### 3. 儀表耦合（`fetchAttendanceDashboardForDate`）

- 現況：單日統計共用 `fetchAttendanceRecordsInRange(ymd, ymd)`——改 RPC 後通常更好。
- **約束**：若列表 RPC 日後加 `LIMIT`／分頁，儀表**必須**另路（全日聚合或獨立 count RPC），否則 KPI silent 錯。第一波若無分頁可共用；加分頁時一併拆。

#### 4. Security definer 紅線

- `set search_path` 鎖死（對齊最新 roster：`search_path = ''` 或專案慣例）
- `revoke all … from public, anon`；只 `grant execute … to authenticated`
- 角色 gate 用現行 `is_mgmt_staff()`（含 finance），**唔好**抄缺 finance／manager 嘅舊版 gate
- 單檔 migration；`npm run db:apply`；禁全量 `db push`

### 開工須一併解決（角色模擬／運作盤點 · 2026-08-06）

模擬行政、主責老師、代堂老師日常開頁後補入。**開工時逐項處理，唔好只交 RPC／索引就當完。**

| 嚴重度 | 問題 | 開工時做法 |
| --- | --- | --- |
| 阻擋 | **預設窗＝整月**：文案「預設今天」vs `currentMonthRange()`；一開頁即最重路徑 | **二選一（同波必揀）**：(A) 預設改為今天（`localYmd()`），「今月」按鈕才拉整月；或 (B) 維持整月預設，但 RPC＋索引驗收必須以開頁預設路徑為壓力（含流動端）。若 (B) 仍 timeout → 升格分頁或改 (A)。並修正文案／行為一致。 |
| 阻擋 | **timeout／錯誤 → KPI silent 全 0**：`setRows([])` 令「失敗」同「真零」難辨 | 保留／強化錯誤 banner（已有 `err`）；**唔好**在失敗時仍顯示看起來像成功的 0 統計主導畫面。驗收：刻意失敗或慢查時用戶知係載入問題。 |
| 高 | **列表誤用 roster**（N chunk 重負載） | `fetchAttendanceRecordsInRange` **完全刪除** `fetchScheduleRosterContext`；點名紙／排程路徑唔改。 |
| 高 | **代堂姓名／班名缺口**（embed RLS） | RPC definer JOIN 白名單補 `full_name`／班標；驗收代堂帳睇自己已點名列姓名＋班名齊。 |
| 中 | **職員無界量／成長** | 驗收職員選最忙月（現參考 2026-07）。仍 timeout → **同波**分頁或縮預設窗（見上列阻擋項），唔好只記跟進。 |
| 中 | **儀表耦合** | 第一波無分頁可共用 `fetchAttendanceRecordsInRange`；**一旦**加 `LIMIT`／分頁，同波拆 `fetchAttendanceDashboardForDate`（獨立 count／聚合）。 |
| 中 | **老師前端雙重過濾** | 頁面仍用 `teacherTid` 濾 `teacherId`／`originalTeacherId`／`classTeacherId`。現時與 `teacher_can_access_class`（= `class.teacher_id`）對齊；RPC 已按 `teacher_can_read_attendance` 過濾後，前端過濾屬冗餘。開工時：**要麼**確認兩邊語意一致並加註解；**要麼**老師路徑改信 RPC 結果、去掉會 silent 裁切嘅前端再濾（若日後謂詞擴張，前端舊條件會藏列）。 |
| 低 | **篩選仍前端**（學生／班／老師） | 非本波阻擋；量大再下推。流動端整月 payload 留意體感。 |
| 低 | **範圍隔離** | RollCall／ScheduleManage／payroll 等繼續用 roster；唔好為列表「順便」改名冊 RPC。 |

### 明確不採用（作終態）

| 做法 | 原因 |
| --- | --- |
| 只抽第二次查、不補代堂路徑 | 行政／主責多半 OK；代堂可能無名／無班名 |
| 前端「輕量」再查 `students`／`classes` | 同一套 RLS，代堂仍補唔到 |
| 列表繼續用 roster RPC | 功能可對但效能不可接受（N 次重負載；單次 >100 亦硬失敗） |
| 為代堂大幅放寬 `teacher_can_access_student` | blast radius 大（學生詳情等）；當初先用按堂 definer |
| 職員 PostgREST／老師另 RPC 雙路徑 | 授權同顯示分叉，長期更貴 |

### 臨時止血（僅 RPC 未上線前可考慮）

抽第二次＋日期索引可暫減 timeout，**唔當終態**；上線前若採用須知代堂顯示可能回退。

## 驗收

- 手機／桌面開出席紀錄（**含預設開頁路徑**），選整月（含上個月／最忙月 2026-07），唔再出 `statement timeout`／roster 體感失敗；統計與列表有數。
- **預設窗**：文案與行為一致；若維持整月預設，開頁本身必須過 timeout（見「開工須一併解決」）。
- **錯誤態**：載入失敗時用戶可辨識，唔好只見全 0 像「無人點名」。
- **職員**選最忙月份仍低於 statement timeout；若否 → 同波上分頁或縮預設窗（見契約§無界量）。
- 職員見範圍內列（含 finance）；老師只見 `teacher_can_read_attendance` 可讀堂次。
- **代堂老師**睇自己代上且已點名之列：學生姓名、班名齊（與主查可見列一致）。
- 代堂辨認仍以 `schedules.original_teacher_id IS NOT NULL`（主資料已有；唔靠 roster）。
- 老師前端篩選與 RPC 授權語意一致（無 silent 裁切合法列）。
- RPC 回傳無 enrollments／leaves 等名冊負載；migration 符合 definer 紅線；列表程式碼無 `fetchScheduleRosterContext`。
- `npm run build`／相關 lint；migration 單檔已套用。

## 工程觸點（開工時）

- `src/services/attendanceQueries.ts`（`fetchAttendanceRecordsInRange`、`AttendanceRecordRow`、`fetchAttendanceDashboardForDate`）
- `src/components/attendance/AttendanceRecordsPage.tsx`（預設 `dateRange`／文案、錯誤態、老師 `teacherTid` 過濾）
- `supabase/migrations/` 新檔：RPC＋`attendance_date` 索引
- 授權／definer 寫法參考：`get_teacher_schedule_roster_context`（最新含 finance 之 migration）；出席謂詞：`teacher_can_read_attendance`
