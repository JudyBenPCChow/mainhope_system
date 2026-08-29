# 流動裝置介面（後台三角色）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-29 關帳：波次 1–4。高頻＋外星人專屬＋老師 P3＋FilterSheet／觸控已落；次要 CRUD／約房／行政底欄學生／收款**本期不做**） |
| 優先 | 高 |
| 範圍 | 行政 `admin`／老師 `teacher`／外星人專屬頁（首頁／報錯／日志） |
| 不含 | 家長 Portal、學生端登入殼；**`/MgmtDashboard` 手機簡化版已併入** [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) |
| 規範 | 手機該點做 → [`UI_DESIGN_INSTRUCTIONS.md`](../UI_DESIGN_INSTRUCTIONS.md) §14 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點 | 2026-07-30；落地＋模擬：2026-08-01；三角色覆核：2026-08-05 |
| 模擬 | [波次 1 殼層](../audits/2026-08-01-mobile-shell-wave1-sim.md) · [波次 2](../audits/2026-08-01-mobile-wave2-sim.md) · [波次 3 一對一](../audits/2026-08-01-mobile-wave3-private-tutoring-sim.md) · [三角色裝置](../audits/2026-08-05-mobile-roles-devices-sim.md) |
| 老師對照 | [2026-07-31-teacher-desktop-mobile-parity.md](../audits/2026-07-31-teacher-desktop-mobile-parity.md) |
| 行政模擬 | 見 §F |

## 結論（2026-08-29 關帳）

殼層＋行政／老師高頻頁（波次 1–3）＋外星人專屬頁／老師 P3／FilterSheet／底欄 Inbox／觸控 `h-10`（波次 4）已落地。營運總覽手機已交 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md)。  
**唔以**次要 CRUD／報表、約房減步、雙重 padding、行政底欄再塞學生／收款為關閉條件（複雜操作維持「回桌面」）。要再做另開主題。

學生詳情老師繳費／請假旁路已清 → [role-ops-hardening.md](./role-ops-hardening.md) `done`。

---

## 開工閘（agent 必讀）

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| `/MgmtDashboard` 手機簡化版 | — | **已併出**；見 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 3 |
| 外星人頁／老師 P3／FilterSheet／觸控 | 無 | **已滿足**（2026-08-29 波次 4） |

## 已落波次（勿當待辦）

| 波次 | 日期 | 內容 | 模擬 |
| --- | --- | --- | --- |
| 1 殼層 | 2026-08-01 | 阿Po z-index；更新橫幅 vs 底欄（M1→`5rem`）；Dialog `max-h`／safe-area；FilterSheet／NavDrawer ＜ Dialog | [wave1-sim](../audits/2026-08-01-mobile-shell-wave1-sim.md) |
| 2 高頻列表 | 2026-08-01 | Inbox 卡片；Leave FilterSheet＋卡片；老師開放 `MobileDayViewGrid`；TeacherWeekTimetable 按日卡片 | [wave2-sim](../audits/2026-08-01-mobile-wave2-sim.md) |
| 3 一對一 | 2026-08-01 | PrivateTutoring 學生列表 FilterSheet＋卡片；預約首屏；改約經 Dialog | [wave3-sim](../audits/2026-08-01-mobile-wave3-private-tutoring-sim.md) |
| 4 餘項 | 2026-08-29 | 外星人卡片（M-2～M-4）；老師 P3（M-5／M-6）；Inbox 底欄（M-7）；Schedule FilterSheet（M-9）；Payments pill／提示（M-8）；觸控 `h-10`（M-11） | 真機／瀏覽器覆核 |

**先前已有（非本系列波次）**：Students／Classes 卡片、TrialSessions、PaymentHistory、TeacherHome 近三日、RollCall 名冊、AdaptiveLayout／MobileLayout。

---

## 本期不做（關帳後唔當待辦）

| 項 | 說明 |
| --- | --- |
| 約房多步（M-10） | 可用；減步另開 |
| 行政底欄學生／收款（M-12） | Inbox 已加；五格再加會擠 |
| 雙重 padding／Header「首頁」重複（M-13） | 低；非擋操作 |
| 次要 CRUD／報表（§D） | 非高頻；複雜操作回桌面 |
| 低嚴重度模擬殘 | W2-1～W2-4、W3-1～W3-3；08-05 M-14～M-18 |

---

## A. 殼層／導航

| 嚴重度 | 問題 | 依據 |
| --- | --- | --- |
| 中 | 主區鎖 `max-w-lg`；多欄作業仍可能擠（高頻列表已改卡片後影響下降） | [`MobileLayout.tsx`](../../src/components/mobile/MobileLayout.tsx) |
| 中 | 底欄 IA 偏角色：行政有排程＋**收件匣**，仍無學生／收款；老師有時間表＋**收件匣**，排程改由首頁捷徑；外星人有報錯＋**收件匣** | [`mobileNav.ts`](../../src/lib/mobileNav.ts)；2026-08-29 Inbox 已加 |
| ~~中~~ | ~~更新橫幅蓋底欄~~ | **已修** |
| ~~中~~ | ~~阿Po 蓋詳情／點名 sheet~~ | **已修** |
| ~~中~~ | ~~FilterSheet／NavDrawer 蓋 Dialog~~ | **已修** |
| 低 | 雙重 padding；Header／底欄「首頁」重複 | 多頁／[`MobileHeader.tsx`](../../src/components/mobile/MobileHeader.tsx) |
| ~~低~~ | ~~部分觸控 &lt; `h-10`~~ | **已修**（Button／Input／DateInput／底欄 2026-08-29） |

---

## B. 共用模式

| 嚴重度 | 問題 | 說明 |
| --- | --- | --- |
| 中 | 其餘列表仍僅 `overflow-x-auto`＋`min-w`（次要 CRUD／報表） | 高頻＋外星人頁多數已有卡片 |
| ~~中~~ | ~~FilterSheet：Payments 主流程、排程等仍擠~~ | **已修**：Schedule FilterSheet；收款長流程改 pill／提示（繳費紀錄本已有 FilterSheet） |
| ~~中~~ | ~~Dialog 無 max-h／safe-area~~ | **已修** |
| ~~中~~ | ~~觸控高度：文件 `h-10`，Button 預設仍偏矮~~ | **已修** Button／Input／DateInput 預設 `h-10` |
| 中 | 營運總覽圖表塞窄殼 | [`MgmtCharts.tsx`](../../src/components/mgmtDashboard/MgmtCharts.tsx) |
| 低 | Class／Teacher 詳情 tab 仍橫向捲 | 不一致 |

---

## C. 依角色：高頻頁現況

### 行政（admin）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| Inbox | — | **已適配**（卡片；底欄已有捷徑） |
| Leave | — | **已適配**（FilterSheet＋卡片） |
| PrivateTutoring | — | **已適配**（FilterSheet＋卡片；預約首屏） |
| Schedule | — | **已適配**（日視圖＋FilterSheet） |
| MgmtDashboard | — | **已適配**（重整波次 3：首屏 8 卡；其餘 KPI 手機摺埋） |
| Payments | 低 | 模式 pill `h-10`；長流程仍直向捲，複雜折扣回桌面 |
| Attendance／FrontDesk | 中 | 大致可用 |
| 學生／班別／繳費紀錄／首頁 | 低 | 已適配 |

### 老師（teacher）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| TeacherTimetable | — | **已適配**（按日卡片） |
| PrivateTutoring | — | **已適配**（預約首屏；改約經 Dialog） |
| Schedule | — | **已適配**（`MobileDayViewGrid`） |
| Inbox | — | **已適配**（卡片；底欄已有捷徑） |
| Attendance／我的班別／首頁 | 低 | 已適配或對等；P3 排程捷徑＋scope 已露 |
| RoomBooking | 中 | 可用但切換多 |

### 外星人（alien）

| 頁面 | 嚴重度 | 現況 |
| --- | --- | --- |
| AlienGodViewHome | — | **已適配**（手機卡片；桌面表保留） |
| SystemIssues | — | **已適配**（卡片＋FilterSheet） |
| SystemLogs | — | **已適配**（卡片＋FilterSheet） |
| Inbox | — | **已適配**（共用；底欄已有捷徑） |
| 進「更多」行政頁 | — | 跟行政：一對一／Leave 已適配；Mgmt 手機已交重整 |

---

## D. 仍幾乎無手機適配（抽樣 · 非高頻）

MonthlyTuition、PaymentDiscounts、ReferralRebates、Courses、Classrooms、TeacherAvailability、EnrollmentChanges、PortalEnrollmentRequests、LessonBalanceMismatch、SecondaryAttendanceReport、EnrollmentReports、AcademicCalendar、RoomBookingAdmin、UserManagement、AiReports、EntityListPage、桌面 DayViewGrid 等。

**已相對可用（含波次 1–4）**：Mobile 殼、Students、Classes、Trials、PaymentHistory、TeacherHome、RollCall、Inbox、Leave、PrivateTutoring、TeacherWeekTimetable（手機）、Schedule 手機週曆＋FilterSheet、外星人首頁／報錯／日志。

---

## E. 老師桌面／手機對照

來源：[audits/2026-07-31-teacher-desktop-mobile-parity.md](../audits/2026-07-31-teacher-desktop-mobile-parity.md)。

| 優先 | 項 | 狀態 |
| --- | --- | --- |
| P1 | 老師手機排程日視圖 | **已落** |
| P2 | 一對一卡片＋預約首屏 | **已落** |
| P2 | 收件匣卡片 | **已落** |
| P3 | 底欄／首頁排程捷徑 | **已落**（首頁「我的排程」；底欄仍係時間表＋收件匣） |
| P3 | scope 提示勿只桌面顯示 | **已落** |
| — | 學生詳情老師見繳費／請假 | **已清** → role-ops-hardening |

---

## 建議實作波次（已關）

1. ~~殼層擋操作~~ **已落**
2. ~~Inbox／時間表／一對一等高頻~~ **已落**
3. ~~老師 P1–P3~~ **已落**
4. ~~Leave／PrivateTutoring／Schedule FilterSheet~~ **已落**
5. ~~觸控 `h-10`、FilterSheet 擴覆蓋、外星人頁~~ **已落**
6. 次要 CRUD／報表／約房 → **本期不做**

逾期罰款已 `done`。邊緣個案複雜操作仍寫「回桌面」。

---

## F. 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 與流動相關 | 現況 |
| --- | --- | --- | --- |
| S19 | 手機請假＋收件匣 | 曾卡大表／層級 | Inbox／Leave 卡片＋殼層已修；複雜案回桌面 |
| S01 | 取消補堂（附帶） | 手機請假難操作 | Leave 卡片可開詳情；複雜 Confirm 回桌面 |
