# 明學IT狗離線對答檢查報告

- 時間（香港）：2026-08-02, 16:16
- 結果：**2 項失敗**（168/170）
- 範圍：意圖分類、姓名抽取、howto 直答、代辦拒絕、路由覆蓋（**唔呼叫 DeepSeek**）

## 摘要

| 分組 | 通過 | 失敗 |
| --- | ---: | ---: |
| howto路徑 | 43 | 1 |
| 資料查詢抽取 | 19 | 0 |
| 防誤判 | 8 | 0 |
| 代辦拒絕 | 3 | 0 |
| 路由覆蓋 | 87 | 1 |
| 知識庫健全 | 8 | 0 |

## 失敗項目

- **[howto路徑]** 安排補堂 vs 新增排程 · 意圖 — 期望 "howto"，得到 "db_query"
- **[路由覆蓋]** 側欄路徑皆在 APO_VALID_PATHS（或僅可解釋例外） — 缺：/Payroll

## 全部結果

### howto路徑

- ✓ 刪除出席紀錄 → howto（唔搜學生） · 姓名抽取 — 得到 null
- ✓ 刪除出席紀錄 → howto（唔搜學生） · 意圖 — 得到 "howto"
- ✓ 刪除出席紀錄 → howto（唔搜學生） · guideId — 得到 "attendance_records"
- ✓ 刪除出席紀錄 → howto（唔搜學生） · 回覆唔准假搜學生 — OK
- ✓ 進行點名 → howto · 姓名抽取 — 得到 null
- ✓ 進行點名 → howto · 意圖 — 得到 "howto"
- ✓ 進行點名 → howto · guideId — 得到 "roll_call"
- ✓ 進行點名 → howto · 回覆唔准假搜學生 — OK
- ✓ 行政功能導覽 · 姓名抽取 — 得到 null
- ✓ 行政功能導覽 · 意圖 — 得到 "howto"
- ✓ 行政功能導覽 · guideId — 得到 "admin_feature_map"
- ✓ 行政功能導覽 · 回覆唔准假搜學生 — OK
- ✓ 指派代堂 · 姓名抽取 — 得到 null
- ✓ 指派代堂 · 意圖 — 得到 "howto"
- ✓ 指派代堂 · guideId — 得到 "substitute_teacher"
- ✓ 指派代堂 · 回覆唔准假搜學生 — OK
- ✓ 明日課堂提醒 · 姓名抽取 — 得到 null
- ✓ 明日課堂提醒 · 意圖 — 得到 "howto"
- ✓ 明日課堂提醒 · guideId — 得到 "tomorrow_reminders"
- ✓ 明日課堂提醒 · 回覆唔准假搜學生 — OK
- ✓ 家長報讀申請 · 姓名抽取 — 得到 null
- ✓ 家長報讀申請 · 意圖 — 得到 "howto"
- ✓ 家長報讀申請 · guideId — 得到 "portal_enrollment"
- ✓ 家長報讀申請 · 回覆唔准假搜學生 — OK
- ✓ 老師請假處理 · 姓名抽取 — 得到 null
- ✓ 老師請假處理 · 意圖 — 得到 "howto"
- ✓ 老師請假處理 · guideId — 得到 "teacher_leave_wizard"
- ✓ 老師請假處理 · 回覆唔准假搜學生 — OK
- ✓ 課堂取消後安排補堂 · 姓名抽取 — 得到 null
- ✓ 課堂取消後安排補堂 · 意圖 — 得到 "howto"
- ✓ 課堂取消後安排補堂 · guideId — 得到 "cancelled_class_makeup"
- ✓ 課堂取消後安排補堂 · 回覆唔准假搜學生 — OK
- ✓ 安排補堂 vs 新增排程 · 姓名抽取 — 得到 null
- ✗ 安排補堂 vs 新增排程 · 意圖 — 期望 "howto"，得到 "db_query"
- ✓ 安排補堂 vs 新增排程 · guideId — 得到 "cancelled_class_makeup"
- ✓ 安排補堂 vs 新增排程 · 回覆唔准假搜學生 — OK
- ✓ 在讀活躍分別 → howto · 姓名抽取 — 得到 null
- ✓ 在讀活躍分別 → howto · 意圖 — 得到 "howto"
- ✓ 在讀活躍分別 → howto · guideId — 得到 "enrollment_status"
- ✓ 在讀活躍分別 → howto · 回覆唔准假搜學生 — OK
- ✓ 新增報讀 → howto（admin） · 姓名抽取 — 得到 null
- ✓ 新增報讀 → howto（admin） · 意圖 — 得到 "howto"
- ✓ 新增報讀 → howto（admin） · guideId — 得到 "add_enrollment"
- ✓ 新增報讀 → howto（admin） · 回覆唔准假搜學生 — OK

### 資料查詢抽取

- ✓ 梁天因今日有冇堂 · 姓名 — 得到 "梁天因"
- ✓ 梁天因今日有冇堂 · 意圖 — 得到 "db_query"
- ✓ 梁天因今日有冇堂 · 應視為學生資料問句或短姓名
- ✓ 陳大文今日上唔上堂 · 姓名 — 得到 "陳大文"
- ✓ 陳大文今日上唔上堂 · 意圖 — 得到 "db_query"
- ✓ 陳大文今日上唔上堂 · 應視為學生資料問句或短姓名
- ✓ 霍健一呢 · 姓名 — 得到 "霍健一"
- ✓ 霍健一呢 · 意圖 — 得到 "db_query"
- ✓ 霍健一呢 · 應視為學生資料問句或短姓名
- ✓ 學生：梁天因 · 姓名 — 得到 "梁天因"
- ✓ 學生：梁天因 · 意圖 — 得到 "db_query"
- ✓ 學生：梁天因 · 應視為學生資料問句或短姓名
- ✓ 學生 陳大文今日有冇堂 · 姓名 — 得到 "陳大文"
- ✓ 學生 陳大文今日有冇堂 · 意圖 — 得到 "db_query"
- ✓ 學生 陳大文今日有冇堂 · 應視為學生資料問句或短姓名
- ✓ 蕭樂瑩依家報什麼 · 姓名 — 得到 "蕭樂瑩"
- ✓ 蕭樂瑩依家報什麼 · 意圖 — 得到 "db_query"
- ✓ 蕭樂瑩依家報什麼 · 應視為學生資料問句或短姓名
- ✓ Mark Yu 老師名 — 得到 "Mark Yu"

### 防誤判

- ✓ 「學生出席紀錄」唔抽姓名 — 抽到 null
- ✓ 「學生出席紀錄」howto 標記
- ✓ 「如何刪除學生出席紀錄」唔抽姓名 — 抽到 null
- ✓ 「如何刪除學生出席紀錄」howto 標記
- ✓ 「出席紀錄邊度睇」唔抽姓名 — 抽到 null
- ✓ 「出席紀錄邊度睇」howto 標記
- ✓ 刪除出席 應走 howto 而非空學生搜尋文案 — guide=attendance_records
- ✓ 空學生搜尋文案仍存在（對照組） — 結構化空結果文案應保留俾真·搜學生用

### 代辦拒絕

- ✓ 你可唔可以幫我加 → 代辦 — 得到 true
- ✓ 如何新增報讀 → 非代辦 — 得到 false
- ✓ 代辦短句有拒絕回覆

### 路由覆蓋

- ✓ APO_VALID_PATHS 含 /FrontDeskWizard
- ✓ APO_PATH_LABELS 含 /FrontDeskWizard — 前台指引精靈
- ✓ 側欄 nav 含 /FrontDeskWizard — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /TomorrowReminders
- ✓ APO_PATH_LABELS 含 /TomorrowReminders — 明日課堂提醒
- ✓ 側欄 nav 含 /TomorrowReminders — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Attendance
- ✓ APO_PATH_LABELS 含 /Attendance — 進行點名
- ✓ 側欄 nav 含 /Attendance — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Inbox
- ✓ APO_PATH_LABELS 含 /Inbox — 收件匣
- ✓ 側欄 nav 含 /Inbox — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /ScriptLibrary
- ✓ APO_PATH_LABELS 含 /ScriptLibrary — 話術庫
- ✓ 側欄 nav 含 /ScriptLibrary — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Students
- ✓ APO_PATH_LABELS 含 /Students — 學生管理
- ✓ 側欄 nav 含 /Students — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /PortalEnrollmentRequests
- ✓ APO_PATH_LABELS 含 /PortalEnrollmentRequests — 家長報讀申請
- ✓ 側欄 nav 含 /PortalEnrollmentRequests — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /EnrollmentChanges
- ✓ APO_PATH_LABELS 含 /EnrollmentChanges — 增退紀錄
- ✓ 側欄 nav 含 /EnrollmentChanges — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /TrialSessions
- ✓ APO_PATH_LABELS 含 /TrialSessions — 試堂紀錄
- ✓ 側欄 nav 含 /TrialSessions — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /PrivateTutoring
- ✓ APO_PATH_LABELS 含 /PrivateTutoring — 一對一學生
- ✓ 側欄 nav 含 /PrivateTutoring — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /EnrollmentReports
- ✓ APO_PATH_LABELS 含 /EnrollmentReports — 人數報表
- ✓ 側欄 nav 含 /EnrollmentReports — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /SecondaryAttendanceReport
- ✓ APO_PATH_LABELS 含 /SecondaryAttendanceReport — 中學出席統計
- ✓ 側欄 nav 含 /SecondaryAttendanceReport — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /LessonBalanceMismatch
- ✓ APO_PATH_LABELS 含 /LessonBalanceMismatch — 堂數對帳
- ✓ 側欄 nav 含 /LessonBalanceMismatch — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /PromotionMatch
- ✓ APO_PATH_LABELS 含 /PromotionMatch — 宣傳配對
- ✓ 側欄 nav 含 /PromotionMatch — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Classes
- ✓ APO_PATH_LABELS 含 /Classes — 班別管理
- ✓ 側欄 nav 含 /Classes — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Teachers
- ✓ APO_PATH_LABELS 含 /Teachers — 老師管理
- ✓ 側欄 nav 含 /Teachers — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /TeacherAvailability
- ✓ APO_PATH_LABELS 含 /TeacherAvailability — 老師檔期規劃
- ✓ 側欄 nav 含 /TeacherAvailability — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Classrooms
- ✓ APO_PATH_LABELS 含 /Classrooms — 課室管理
- ✓ 側欄 nav 含 /Classrooms — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Schedule
- ✓ APO_PATH_LABELS 含 /Schedule — 排程管理
- ✓ 側欄 nav 含 /Schedule — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /AcademicCalendar
- ✓ APO_PATH_LABELS 含 /AcademicCalendar — 校曆
- ✓ 側欄 nav 含 /AcademicCalendar — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /TeachingRecords
- ✓ APO_PATH_LABELS 含 /TeachingRecords — 教學紀錄
- ✓ 側欄 nav 含 /TeachingRecords — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /TeacherLeaveWizard
- ✓ APO_PATH_LABELS 含 /TeacherLeaveWizard — 老師請假處理
- ✓ 側欄 nav 含 /TeacherLeaveWizard — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /LeaveManagement
- ✓ APO_PATH_LABELS 含 /LeaveManagement — 請假管理
- ✓ 側欄 nav 含 /LeaveManagement — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /RoomBookingAdmin
- ✓ APO_PATH_LABELS 含 /RoomBookingAdmin — 約房審批
- ✓ 側欄 nav 含 /RoomBookingAdmin — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /AttendanceRecords
- ✓ APO_PATH_LABELS 含 /AttendanceRecords — 出席紀錄
- ✓ 側欄 nav 含 /AttendanceRecords — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /Payments
- ✓ APO_PATH_LABELS 含 /Payments — 收款登記
- ✓ 側欄 nav 含 /Payments — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /PaymentHistory
- ✓ APO_PATH_LABELS 含 /PaymentHistory — 繳費紀錄
- ✓ 側欄 nav 含 /PaymentHistory — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /PaymentDiscounts
- ✓ APO_PATH_LABELS 含 /PaymentDiscounts — 優惠折扣
- ✓ 側欄 nav 含 /PaymentDiscounts — navStructure 無此 path
- ✓ APO_VALID_PATHS 含 /MgmtDashboard
- ✓ APO_PATH_LABELS 含 /MgmtDashboard — 營運總覽
- ✓ 側欄 nav 含 /MgmtDashboard — navStructure 無此 path
- ✗ 側欄路徑皆在 APO_VALID_PATHS（或僅可解釋例外） — 缺：/Payroll

### 知識庫健全

- ✓ HOWTO_GUIDES 數量 ≥ 30 — 實際 44
- ✓ guide id 無重複
- ✓ 存在 guide attendance_records
- ✓ 存在 guide admin_feature_map
- ✓ 存在 guide substitute_teacher
- ✓ 存在 guide tomorrow_reminders
- ✓ 存在 guide portal_enrollment
- ✓ 存在 guide teacher_leave_wizard

## 說明

此報告由 `npm run apo:check` 產生。  
若 howto／抽取邏輯有改，請重跑本檢查；線上真實 LLM 回覆另見後續「線上模擬」方案。
