# 流動裝置介面（後台三角色）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（行政／老師**高頻波次 1–3 已落**；餘營運總覽／外星人／次要頁） |
| 優先 | 高 → 實務上次優先（高頻夠用後；跟 Mgmt／外星人頁） |
| 範圍 | 行政 `admin`／老師 `teacher`（外星人專屬頁可後做） |
| 不含 | 家長 Portal、學生端登入殼 |
| 規範 | 手機該點做 → [`UI_DESIGN_INSTRUCTIONS.md`](../UI_DESIGN_INSTRUCTIONS.md) §14 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點 | 2026-07-30；落地＋模擬：2026-08-01；三角色覆核：2026-08-05 |
| 模擬 | [波次 1 殼層](../audits/2026-08-01-mobile-shell-wave1-sim.md) · [波次 2](../audits/2026-08-01-mobile-wave2-sim.md) · [波次 3 一對一](../audits/2026-08-01-mobile-wave3-private-tutoring-sim.md) · [三角色裝置](../audits/2026-08-05-mobile-roles-devices-sim.md) |
| 老師對照 | [2026-07-31-teacher-desktop-mobile-parity.md](../audits/2026-07-31-teacher-desktop-mobile-parity.md) |
| 行政模擬 | 見 §F |

## 結論（2026-08-05 覆核）

殼層＋行政／老師**日常高頻頁**仍 Pass（波次 1–3 **無回歸惡化**）。  
**仍欠（高）**：營運總覽、外星人首頁／報錯／日志（`min-w` 大表）。  
**仍欠（中）**：老師 P3 排程捷徑／scope 文案、Inbox 底欄到達、Schedule／Payments FilterSheet、觸控 `h-10`、約房多步。  
**更正**：行政底欄**已有排程**（舊述「無排程」過時）；仍無學生／Inbox／收款捷徑。

學生詳情老師繳費／請假旁路已清 → [role-ops-hardening.md](./role-ops-hardening.md) `done`。

---

## 已落波次（勿當待辦）

| 波次 | 日期 | 內容 | 模擬 |
| --- | --- | --- | --- |
| 1 殼層 | 2026-08-01 | 阿Po z-index；更新橫幅 vs 底欄（M1→`5rem`）；Dialog `max-h`／safe-area；FilterSheet／NavDrawer ＜ Dialog | [wave1-sim](../audits/2026-08-01-mobile-shell-wave1-sim.md) |
| 2 高頻列表 | 2026-08-01 | Inbox 卡片；Leave FilterSheet＋卡片；老師開放 `MobileDayViewGrid`；TeacherWeekTimetable 按日卡片 | [wave2-sim](../audits/2026-08-01-mobile-wave2-sim.md) |
| 3 一對一 | 2026-08-01 | PrivateTutoring 學生列表 FilterSheet＋卡片；預約首屏；改約經 Dialog | [wave3-sim](../audits/2026-08-01-mobile-wave3-private-tutoring-sim.md) |

**先前已有（非本系列波次）**：Students／Classes 卡片、TrialSessions、PaymentHistory、TeacherHome 近三日、RollCall 名冊、AdaptiveLayout／MobileLayout。

---

## 仍欠（進行中範圍）

| 優先 | 項 | 說明 |
| --- | --- | --- |
| 下一波 | 營運總覽 MgmtDashboard | 多表橫滑＋圖表擠壓；無手機簡化版（[08-05 M-1](../audits/2026-08-05-mobile-roles-devices-sim.md)） |
| 可後做 | 外星人 AlienGodViewHome、SystemIssues、SystemLogs | 底欄有報錯入口，內容仍 `min-w` 大表（M-2～M-4） |
| P3 | 老師底欄／首頁排程捷徑；scope 提示勿只桌面顯示 | §E；M-5／M-6 |
| 共用 | Schedule／Payments FilterSheet；觸控對齊 §14 `h-10`；雙重 padding；Inbox 底欄到達 | §A／§B；M-7～M-11 |
| 低 | 次要 CRUD／報表（Courses、Availability、Enrollment、Reports…） | §D |

低嚴重度模擬取捨（非擋操作，可選收斂）：W2-1～W2-4、W3-1～W3-3；08-05 M-13～M-18。

---

## A. 殼層／導航

| 嚴重度 | 問題 | 依據 |
| --- | --- | --- |
| 中 | 主區鎖 `max-w-lg`；多欄作業仍可能擠（高頻列表已改卡片後影響下降） | [`MobileLayout.tsx`](../../src/components/mobile/MobileLayout.tsx) |
| 中 | 底欄 IA 偏角色：行政有排程、仍無學生／Inbox／收款；老師無排程／Inbox；外星人無 Inbox | [`mobileNav.ts`](../../src/lib/mobileNav.ts)；[2026-08-05 sim](../audits/2026-08-05-mobile-roles-devices-sim.md) §2 |
| ~~中~~ | ~~更新橫幅蓋底欄~~ | **已修** |
| ~~中~~ | ~~阿Po 蓋詳情／點名 sheet~~ | **已修** |
| ~~中~~ | ~~FilterSheet／NavDrawer 蓋 Dialog~~ | **已修** |
| 低 | 雙重 padding；Header／底欄「首頁」重複；部分觸控 &lt; `h-10` | 多頁／[`MobileHeader.tsx`](../../src/components/mobile/MobileHeader.tsx) |

---

## B. 共用模式

| 嚴重度 | 問題 | 說明 |
| --- | --- | --- |
| 中 | 其餘列表仍僅 `overflow-x-auto`＋`min-w`（Mgmt／Alien／次要頁） | 高頻頁多數已有卡片 |
| 中 | FilterSheet：Payments 主流程、排程等仍擠；Students／Classes／Trials／PaymentHistory／Leave／PrivateTutoring **已有** | §14 |
| ~~中~~ | ~~Dialog 無 max-h／safe-area~~ | **已修** |
| 中 | 觸控高度：文件 `h-10`，Button 預設仍偏矮 | [`button.tsx`](../../src/components/ui/button.tsx) |
| 中 | 營運總覽圖表塞窄殼 | [`MgmtCharts.tsx`](../../src/components/mgmtDashboard/MgmtCharts.tsx) |
| 低 | Class／Teacher 詳情 tab 仍橫向捲 | 不一致 |

---

## C. 依角色：高頻頁現況

### 行政（admin）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| Inbox | — | **已適配**（卡片） |
| Leave | — | **已適配**（FilterSheet＋卡片） |
| PrivateTutoring | — | **已適配**（FilterSheet＋卡片；預約首屏） |
| Schedule | 低 | 手機週曆日視圖已開放 |
| MgmtDashboard | 高 | **仍欠**手機簡化 |
| Payments | 中 | 可堆疊；長流程偏重 |
| Attendance／FrontDesk | 中 | 大致可用 |
| 學生／班別／繳費紀錄／首頁 | 低 | 已適配 |

### 老師（teacher）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| TeacherTimetable | — | **已適配**（按日卡片） |
| PrivateTutoring | — | **已適配**（預約首屏；改約經 Dialog） |
| Schedule | — | **已適配**（`MobileDayViewGrid`） |
| Inbox | — | **已適配**（卡片；仍無底欄入口） |
| Attendance／我的班別／首頁 | 低 | 已適配或對等 |
| RoomBooking | 中 | 可用但切換多 |

### 外星人（alien）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| AlienGodViewHome | 高 | **仍欠**（`min-w` 表） |
| SystemIssues | 高 | **仍欠**（`min-w` 表） |
| Inbox | — | **已適配**（共用） |
| 進「更多」行政頁 | — | 跟行政：一對一／Leave 已適配；Mgmt 仍欠 |

---

## D. 仍幾乎無手機適配（抽樣 · 非高頻）

MgmtDashboard、AlienGodViewHome、SystemIssues／SystemLogs、MonthlyTuition、PaymentDiscounts、ReferralRebates、Courses、Classrooms、TeacherAvailability、EnrollmentChanges、PortalEnrollmentRequests、LessonBalanceMismatch、SecondaryAttendanceReport、EnrollmentReports、AcademicCalendar、RoomBookingAdmin、UserManagement、AiReports、EntityListPage、桌面 DayViewGrid 等。

**已相對可用（含波次 1–3）**：Mobile 殼、Students、Classes、Trials、PaymentHistory、TeacherHome、RollCall、Inbox、Leave、PrivateTutoring、TeacherWeekTimetable（手機）、Schedule 手機週曆。

---

## E. 老師桌面／手機對照

來源：[audits/2026-07-31-teacher-desktop-mobile-parity.md](../audits/2026-07-31-teacher-desktop-mobile-parity.md)。

| 優先 | 項 | 狀態 |
| --- | --- | --- |
| P1 | 老師手機排程日視圖 | **已落** |
| P2 | 一對一卡片＋預約首屏 | **已落** |
| P2 | 收件匣卡片 | **已落** |
| P3 | 底欄／首頁排程捷徑 | **仍欠** |
| P3 | scope 提示勿只桌面顯示 | **仍欠** |
| — | 學生詳情老師見繳費／請假 | **已清** → role-ops-hardening |

---

## 建議實作波次（更新後）

1. ~~殼層擋操作~~ **已落**
2. ~~Inbox／時間表／一對一等高頻~~ **已落**（外星人專屬可後做）
3. ~~老師 P1–P2~~ **已落** → 餘 P3 捷徑／文案
4. ~~Leave／PrivateTutoring~~ **已落** → 餘 Schedule FilterSheet、**MgmtDashboard**
5. 共用：觸控 `h-10`、FilterSheet 擴覆蓋
6. 次要 CRUD／報表

**接手：** 下一優先 **MgmtDashboard** 或外星人頁。逾期罰款已 `done`（見 [tuition-late-fee-enforcement.md](./tuition-late-fee-enforcement.md)）。邊緣個案複雜操作仍寫「回桌面」。

---

## F. 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 與流動相關 | 現況 |
| --- | --- | --- | --- |
| S19 | 手機請假＋收件匣 | 曾卡大表／層級 | Inbox／Leave 卡片＋殼層已修；複雜案回桌面 |
| S01 | 取消補堂（附帶） | 手機請假難操作 | Leave 卡片可開詳情；複雜 Confirm 回桌面 |
