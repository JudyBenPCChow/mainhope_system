# 流動裝置介面（後台三角色）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 高 |
| 範圍 | 行政 `admin`／老師 `teacher`／外星人 `alien`（本 repo 管理後台） |
| 不含 | 家長 Portal、學生端登入殼 |
| 規範 | 手機該點做 → [`UI_DESIGN_INSTRUCTIONS.md`](../UI_DESIGN_INSTRUCTIONS.md) §14 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點日期 | 2026-07-30 |
| 老師對照 | 2026-07-31 模擬：[audits/2026-07-31-teacher-desktop-mobile-parity.md](../audits/2026-07-31-teacher-desktop-mobile-parity.md) |
| 行政模擬 | 2026-07-31：見 §F |

## 結論

[`AdaptiveLayout`](../../src/components/AdaptiveLayout.tsx) → [`MobileLayout`](../../src/components/mobile/MobileLayout.tsx) 殼可用；學生／班別／試堂／繳費紀錄／老師首頁／點名名冊已有卡片或簡化版。真正痛點是**底欄高頻頁仍靠橫向捲動表格**，以及少數 **z-index／橫幅遮擋**。

老師角色另見 §E：點名／班別手機大致對等，落差在排程日視圖、一對一橫滑、底欄無排程；學生詳情繳費／請假屬權限殘項（見 [role-ops-hardening.md](./role-ops-hardening.md)）。

## 問題類型

- **會擋操作（少數）**：更新橫幅蓋底欄、阿Po 蓋點名／詳情 sheet、部分高 Dialog 無捲動。
- **無手機替代（多數痛點）**：Inbox、Alien 首頁、SystemIssues、Leave、PrivateTutoring、TeacherTimetable、MgmtDashboard 等。
- **彆扭但能用**：排程按日期、Payments 長表單、雙重 padding、底欄 IA、kanban 橫滑。
- **已適配**：學生／班別卡片、繳費紀錄、老師首頁、點名名冊、AdaptiveLayout。

---

## A. 殼層／導航

| 嚴重度 | 問題 | 依據 |
| --- | --- | --- |
| 高 | 主區鎖 `max-w-lg`，時間表／多欄作業被擠壓後再橫向捲 | [`MobileLayout.tsx`](../../src/components/mobile/MobileLayout.tsx) |
| 中 | 底欄資訊架構偏角色：行政無排程／學生；老師無收件匣；外星人無點名／排程 → 高頻功能埋在「更多」／drawer | [`mobileNav.ts`](../../src/lib/mobileNav.ts) |
| 中 | 更新橫幅 `fixed bottom-0 z-[100]` 可能蓋住底欄 | [`AppUpdateGuard.tsx`](../../src/components/AppUpdateGuard.tsx) |
| 中 | 阿Po FAB `z-[240]` 高於詳情／點名 sheet `z-[200]`，可蓋住操作層 | [`ApoAssistant.tsx`](../../src/components/assistant/ApoAssistant.tsx)、[`DetailLayerShell.tsx`](../../src/components/detail/DetailLayerShell.tsx)、[`RollCallSheet.tsx`](../../src/components/attendance/RollCallSheet.tsx) |
| 中 | FilterSheet／NavDrawer `270` > Dialog `260`：兩者同時開時 sheet 蓋 Dialog | UI §14 |
| 低 | 頁面自帶 `p-4` + MobileLayout 已有 padding → 雙重留白 | 多頁（Students、FrontDesk、Availability 等） |
| 低 | Header「首頁」與底欄「首頁」重複；部分關閉鈕觸控小於 `h-10` | [`MobileHeader.tsx`](../../src/components/mobile/MobileHeader.tsx) |

---

## B. 共用模式

| 嚴重度 | 問題 | 說明 |
| --- | --- | --- |
| 高 | 多數列表僅 `overflow-x-auto` + `min-w-[640px~1180px]`，**沒有卡片／列表替代** | 可用但難用（橫滑） |
| 高 | [`MobileFilterSheet`](../../src/components/mobile/MobileFilterSheet.tsx) 覆蓋不足：僅 Students／Classes／Trials／PaymentHistory；Payments 主流程、排程、請假、收件匣等篩選仍擠在窄螢幕 | 與 §14 標準不一致 |
| 中 | 基礎 [`Dialog`](../../src/components/ui/dialog.tsx) 無預設 `max-h`／safe-area；矮螢幕上未自行加 overflow 的對話框可能裁切 | 偶發「壞掉」 |
| 中 | 觸控高度：文件要求 `h-10`，[`Button`](../../src/components/ui/button.tsx) 預設仍 `h-9`／`sm:h-8` | 觸控偏小 |
| 中 | 圖表：行政首頁手機隱藏營收圖（刻意）；營運總覽圖表仍塞進窄殼，無簡化版 | [`AdminDashboard.tsx`](../../src/components/home/AdminDashboard.tsx)、[`MgmtCharts.tsx`](../../src/components/mgmtDashboard/MgmtCharts.tsx) |
| 低 | 詳情分頁：Student 手機改 Select；Class／Teacher 仍橫向 tab 捲動 | 不一致 |

---

## C. 依角色：高頻頁

### 行政（admin）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| 收件匣 Inbox | 高 | 底欄主入口，僅 `min-w-[640px]` 表格，無卡片版 |
| 請假管理 Leave | 高 | 篩選 inline + 表 `min-w-[1180px]` |
| 一對一 PrivateTutoring | 高 | 主列表 `min-w-[56rem]` 表格 |
| 營運總覽 MgmtDashboard | 高 | 桌面 padding／sticky 篩選 + 多表橫滑 + 圖表擠壓 |
| 排程 Schedule | 中 | 已強制「按日期」；篩選 chips 仍擠、無 FilterSheet |
| 繳費 Payments | 中 | 表單可堆疊，但長流程／收據 Dialog 偏重 |
| 點名 Attendance | 中 | 名冊卡片可用；Apo z-index、次要鈕偏小 |
| 前台精靈 FrontDesk | 中 | 可用但密、雙重 padding |
| 學生／班別／繳費紀錄／首頁 | 低 | 已有較完整手機適配 |

### 老師（teacher）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| 時間表 TeacherTimetable | 高 | **底欄主入口**仍是 `min-w-[720px]` 週格 + 極小字（`text-[0.65rem]`） |
| 一對一 PrivateTutoring | 高 | `min-w-[56rem]` 表格無替代；預約在最右欄，375px 須橫滑 |
| 排程 Schedule | 高 | 老師手機**不能**用日視圖（`allowMobileDayView = isMgmtStaff()`）；強制按日期；列表亦降級 |
| 點名 Attendance | 低 | 名冊卡片可用；功能對等甚至較適合觸控 |
| 約房 RoomBooking | 中 | 手機單課室單日；功能保留但找空房切換多 |
| 老師首頁 | 低 | 近三日卡片；桌面 CTA／KPI `hidden md:*`（刻意） |
| 我的班別 | 低 | 強制 cards + FilterSheet |
| 收件匣 | 中 | 無底欄、進 drawer 後仍是 `min-w-[640px]` 表格 |
| 出席／教學紀錄 | 低 | 卡片／accordion，大致對等 |

### 外星人（alien）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| 首頁 AlienGodViewHome | 高 | 底欄「首頁」= 兩個 `min-w-[640px]` 表格 |
| 報錯 SystemIssues | 高 | 底欄入口 + `min-w-[880px]` 表格 |
| 收件匣 Inbox | 高 | 底欄入口 + 表格 |
| 進「更多」後的行政頁 | 同行政缺口 | Leave／Mgmt／PrivateTutoring 等 |

---

## D. 幾乎無手機適配（抽樣）

Inbox、Alien 首頁、TeacherWeekTimetable、LeaveManagement、PrivateTutoring、MgmtDashboard（含 FilterBar／DetailTables／Charts）、SystemIssues／SystemLogs、DayViewGrid、MonthlyTuition、PaymentDiscounts、ReferralRebates、Courses、Classrooms、TeacherAvailability（含 WeekGrid／RoomDay）、EnrollmentChanges、PortalEnrollmentRequests、LessonBalanceMismatch、SecondaryAttendanceReport、EnrollmentReports、AcademicCalendar、RoomBookingAdmin、UserManagement、AiReports、EntityListPage 等。

**已相對可用**：StudentsList、ClassesList（卡片）、TrialSessions、PaymentHistory、TeacherHome、RollCall 名冊、Mobile 殼本身。

---

## E. 老師桌面／手機對照（2026-07-31 模擬）

來源：[audits/2026-07-31-teacher-desktop-mobile-parity.md](../audits/2026-07-31-teacher-desktop-mobile-parity.md)。方法：靜態推演，非真機。

| 優先 | 項 | 類型 | 觸點 |
| --- | --- | --- | --- |
| P1 | 老師手機排程可視化：開放 `MobileDayViewGrid` 或「今日課室摘要」卡片 | 功能缺口 | `ScheduleManagePage.tsx` `allowMobileDayView` |
| P2 | 一對一列表手機卡片化（預約／改約放首屏） | 體驗 | `PrivateTutoringView.tsx`、`PrivateTutoringStudentDisclosure.tsx` |
| P2 | 收件匣手機卡片／簡表 | 體驗 | `InboxView.tsx` |
| P3 | 底欄或首頁恢復排程捷徑（現底欄無 `/Schedule`；首頁 CTA `hidden md:flex`） | 導覽 | `mobileNav.ts`、`TeacherHomeView.tsx` |
| P3 | 老師 scope 提示勿只桌面顯示（`hidden md:block`／`!isMobile`） | 文案 | RollCall／AttendanceRecords／TeacherHome |
| — | 學生詳情繳費／請假對老師可見 | **權限**（裝置無關） | → [role-ops-hardening.md](./role-ops-hardening.md) 殘項 R1 |

---

## 建議實作波次（尚未開工）

1. **殼層擋操作**：阿Po z-index、更新橫幅 vs 底欄、Dialog `max-h`／safe-area。
2. **底欄高頻無替代頁**：Inbox（行政／外星人）、TeacherTimetable（老師）、Alien 首頁、SystemIssues。
3. **老師對照 P1–P3**（§E）：排程日視圖／摘要 → 一對一／收件匣卡片 → 底欄／首頁捷徑。
4. **行政日常**：Leave、PrivateTutoring、Schedule FilterSheet、MgmtDashboard 簡化。
5. **共用規範**：表格→卡片慣例、FilterSheet 擴覆蓋、觸控高度對齊 §14。
6. **次要 CRUD／報表**：Courses、Availability、Enrollment、Reports 等。

驗收建議：三角色各用真機或 Chrome 375px 走底欄全部 tab + drawer 前 5 個功能，對照「高」項是否改為卡片／按日列表／簡化圖，且無遮擋。老師另走 audit 報告 W1–W5。

---

## F. 行政邊緣模擬（2026-07-31）

來源：行政桌面能力模擬 20 案（Canvas `admin-edge-case-simulation.canvas.tsx`）。與本主題相關：

| 模擬 ID | 個案 | 判定 | 發現的問題 | 建議落點 |
| --- | --- | --- | --- | --- |
| S19 | 接待用手機處理請假＋收件匣作廢跟進 | 半完成 | Inbox／Leave 仍 `min-w` 大表；阿Po／更新橫幅可遮操作；複雜邊緣案不宜只靠手機 | §C 行政 Inbox／Leave；殼層 z-index（§A）；波次 1–2／4 |
| S01 | 林藝涵型取消補堂（附帶） | 桌面可完成 | 手機請假表難操作，不影響桌面 A1 收尾 | Leave 卡片化優先於複雜 Confirm 流程 |

**接手：** 行政高頻先做 Inbox＋Leave 卡片／簡表；邊緣個案操作指引寫「回桌面」。
