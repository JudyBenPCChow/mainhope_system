# 流動裝置介面（後台三角色）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（行政／老師**高頻波次 1–3 已落**；營運總覽手機已併出；**2026-08-29** 外星人卡片／老師 P3／FilterSheet／底欄 Inbox／觸控 `h-10` 已落；餘次要 CRUD／約房） |
| 優先 | 高 → 實務上次優先（高頻夠用後；跟 Mgmt／外星人頁） |
| 範圍 | 行政 `admin`／老師 `teacher`（外星人專屬頁可後做） |
| 不含 | 家長 Portal、學生端登入殼；**`/MgmtDashboard` 手機簡化版已併入** [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) |
| 規範 | 手機該點做 → [`UI_DESIGN_INSTRUCTIONS.md`](../UI_DESIGN_INSTRUCTIONS.md) §14 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點 | 2026-07-30；落地＋模擬：2026-08-01；三角色覆核：2026-08-05 |
| 行政模擬 | 見 §F |

## 結論（2026-08-05 覆核）

殼層＋行政／老師**日常高頻頁**仍 Pass（波次 1–3 **無回歸惡化**）。  
**2026-08-29 已落**：外星人首頁／報錯／日志手機卡片；老師 P3 首頁排程捷徑＋scope 文案；行政／老師／外星人底欄 Inbox；Schedule FilterSheet；收款模式 pill `h-10`；Button／Input／DateInput／底欄觸控 `h-10`。  
**仍欠**：約房多步、次要 CRUD／報表、行政底欄學生／收款捷徑（Inbox 已加）。營運總覽手機已交重整。

學生詳情老師繳費／請假旁路已清 → [role-ops-hardening.md](./role-ops-hardening.md) `done`。

---

## 開工閘（agent 必讀）

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| `/MgmtDashboard` 手機簡化版 | — | **唔好喺本題開工**；見 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 3 |
| 外星人頁／老師 P3／FilterSheet／觸控 | 無 | 可繼續；唔使等總覽重整 |

## 已落波次（勿當待辦）

| 波次 | 日期 | 內容 |
| --- | --- | --- |
| 1 殼層 | 2026-08-01 | 阿Po z-index；更新橫幅 vs 底欄（M1→`5rem`）；Dialog `max-h`／safe-area；FilterSheet／NavDrawer ＜ Dialog |
| 2 高頻列表 | 2026-08-01 | Inbox 卡片；Leave FilterSheet＋卡片；老師開放 `MobileDayViewGrid`；TeacherWeekTimetable 按日卡片 |
| 3 一對一 | 2026-08-01 | PrivateTutoring 學生列表 FilterSheet＋卡片；預約首屏；改約經 Dialog |
| 4 餘項 | 2026-08-29 | 外星人卡片（M-2～M-4）；老師 P3（M-5／M-6）；Inbox 底欄（M-7）；Schedule FilterSheet（M-9）；Payments pill／提示（M-8）；觸控 `h-10`（M-11） |

**先前已有（非本系列波次）**：Students／Classes 卡片、TrialSessions、PaymentHistory、TeacherHome 近三日、RollCall 名冊、AdaptiveLayout／MobileLayout。

---

## 仍欠（進行中範圍）

| 優先 | 項 | 說明 |
| --- | --- | --- |
| 已併出 | 營運總覽 MgmtDashboard | 2026-08-21 交 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 3（原 08-05 M-1） |
| 已落 | 外星人 AlienGodViewHome、SystemIssues、SystemLogs | 2026-08-29 手機卡片＋Issues／Logs FilterSheet（M-2～M-4） |
| 已落 | 老師 P3 排程捷徑／scope；Inbox 底欄；Schedule FilterSheet；觸控 `h-10` | 2026-08-29（M-5～M-9、M-11）；收款頁係長流程，改 pill 高度＋回桌面提示，唔硬套 FilterSheet |
| 低 | 約房多步、次要 CRUD／報表、雙重 padding、行政底欄學生／收款 | §D；M-10／M-12／M-13 |

低嚴重度模擬取捨（非擋操作，可選收斂）：W2-1～W2-4、W3-1～W3-3；08-05 M-13～M-18。

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

| 優先 | 項 | 狀態 |
| --- | --- | --- |
| P1 | 老師手機排程日視圖 | **已落** |
| P2 | 一對一卡片＋預約首屏 | **已落** |
| P2 | 收件匣卡片 | **已落** |
| P3 | 底欄／首頁排程捷徑 | **已落**（首頁「我的排程」；底欄仍係時間表＋收件匣） |
| P3 | scope 提示勿只桌面顯示 | **已落** |
| — | 學生詳情老師見繳費／請假 | **已清** → role-ops-hardening |

---

## 建議實作波次（更新後）

1. ~~殼層擋操作~~ **已落**
2. ~~Inbox／時間表／一對一等高頻~~ **已落**（外星人專屬可後做）
3. ~~老師 P1–P2~~ **已落** → 餘 P3 捷徑／文案
4. ~~Leave／PrivateTutoring~~ **已落** → Schedule FilterSheet **已落**
5. ~~共用：觸控 `h-10`、FilterSheet 擴覆蓋~~ **已落**
6. 次要 CRUD／報表／約房

**接手：** 次要頁與約房。逾期罰款已 `done`。邊緣個案複雜操作仍寫「回桌面」。

---

## F. 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 與流動相關 | 現況 |
| --- | --- | --- | --- |
| S19 | 手機請假＋收件匣 | 曾卡大表／層級 | Inbox／Leave 卡片＋殼層已修；複雜案回桌面 |
| S01 | 取消補堂（附帶） | 手機請假難操作 | Leave 卡片可開詳情；複雜 Confirm 回桌面 |
