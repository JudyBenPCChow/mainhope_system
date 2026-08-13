# 未用功能／隱藏路由／重疊功能稽核（2026-07-31）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-07-31 |
| 範圍 | 前端路由（`src/App.tsx`）、側欄（`src/lib/navStructure.ts`）、頁面／元件／services 交叉引用 |
| 方法 | 靜態稽核（路由 × 導航 × Link／navigate × import）；未做瀏覽器點擊驗收 |
| 限制 | 前端角色 ≠ RLS；「深連結可開」不等於資料庫允許寫入 |
| 後續 | **待辦看板已於同日廢除**（見總評）；下文 H1／H3 等為稽核當日快照，勿再當現行狀態 |

## 總評

產品主幹（學生／班別／排程／點名／繳費／請假）大多有側欄入口且職責清楚。

**2026-07-31 後續處理：** 沙盒／demo 已下線。**待辦看板已廢除**（路由／UI／學生相關事項／老師行政事件／歷史 `calendar_events`＋`admin_todos` 列清空；表保留）。其餘死碼見 [`../backlog/dead-surface-cleanup.md`](../backlog/dead-surface-cleanup.md)。

主要歷史問題（稽核當日）：

1. **已下線但仍留死碼**（月費頁、舊待辦列表）→ backlog
2. **活功能但側欄找不到**（`/Calendar`）→ **已下線**
3. **正式頁連到沙盒／公開 demo** → **已下線**

---

## 1. 表面積摘要

| 類別 | 約數 | 說明 |
| --- | --- | --- |
| 側欄可達功能 | ~40 unique paths | `navStructure.ts` |
| 詳情／巢狀路由 | 5 | Students／Teachers／Classes／Schedule／Calendar `:id` |
| 公開／無 Layout | 5 | Login、前台 intake、收據 demo×2、ContactUpdate 沙盒 |
| Layout 內 prototype | 5 | 點名／前台／請假／中學出席／收件匣通知 |
| Redirect | 2 | `/`→Home、`/MonthlyTuition`→Payments |
| 側欄孤兒（產品功能） | 1 | `/Calendar` 待辦看板 |
| 未掛路由的 page 模組 | 2 | `MonthlyTuition.tsx`、`Todos.tsx` |

---

## 2. 高優先：死碼／不可發現／誤曝露

### H1 — `/Calendar`（待辦看板）有功能、無側欄

- **現象：** `App.tsx` 掛了 `/Calendar`、`/Calendar/:eventId`；`navStructure.ts` **沒有**「待辦」；`AllFeatures` 只鏡像側欄，因此也找不到。
- **仍可到達：** 學生詳情待辦列 → `/Calendar/:id`；看板內部導航；Apo 路由表有列；直接打 URL。
- **附帶：** `dashboard.ts` 仍 fetch `todosToday`，但 `AdminDashboard` 硬塞 `todosToday: []`，首頁不顯示。
- **建議：** 在側欄加「待辦」（admin／alien，必要時 teacher）；或首頁加卡片；同時停掉無用 `todosToday` fetch。命名避免再用「日曆」，以免與 `/AcademicCalendar`／排程混淆。

### H2 — 月費獨立頁已下線，UI／queries 仍在

- **現象：** `/MonthlyTuition` → `Navigate` 到 `/Payments`；`pages/MonthlyTuition.tsx` + `MonthlyTuitionView` **從未掛載**。
- **死碼：** `services/monthlyTuitionQueries.ts` 僅被該 View 引用。`lib/monthlyTuition.ts` 計算仍被測試／他處使用，應保留。
- **建議：** 刪或 park View／page／queries；文件註明月費流程只走 `/Payments` 提醒。

### H3 — 舊待辦列表整條 orphan

- **現象：** 現行看板是 `TodoBoardView`（`/Calendar`）。`TodosView` + `todoQueries`（`admin_todos`）無任何消費者。`pages/Todos.tsx` 會 redirect 到 `/Calendar`，但 **App 沒有 `/Todos` 路由**。
- **建議：** 刪 `TodosView`／`todoQueries`／未掛載的 `Todos.tsx`；若要保舊書籤，才在 App 加 `/Todos` → `/Calendar`。

### H4 — 正式營運頁連到 prototype 沙盒

- **現象：**
  - `FrontDeskWizardView` →「沙盒試用」`/prototype/FrontDeskWizard`
  - `TeacherLeaveWizardView` →「沙盒」`/prototype/TeacherLeaveWizard`
- **影響：** 需登入，但仍易被前線誤當正式流程。
- **建議：** 限 `alien` 或 `import.meta.env.DEV`；或移除正式頁連結，只留工程師 URL。

### H5 — 公開收據 demo（無 auth）

- **現象：** `/receipt-demo`、`/prototype/ReceiptDemo` 在 Layout 外；手冊有記（訓練／對版用）。
- **建議：** 若仍要給同事對版可接受；否則加 auth 或改難猜路徑。

---

## 3. 中優先：重疊／易混淆（多數刻意）

| ID | 主題 | 性質 | 建議 |
| --- | --- | --- | --- |
| M1 | `/Attendance` 日清單 vs 排程「確定點名」滑出紙 | **刻意雙入口**（手冊／AGENTS 已寫） | 保留；文案分清「當日批次」vs「從該堂」；可退役 `/prototype/ScheduleRollCall` |
| M2 | 試堂：前台「只登記試堂」／`/TrialSessions` 建檔收費／`/Payments` 試堂項目 | **路徑不一致**（見 backlog trial-sessions T1） | 統一：建立一處、收費走 Payments |
| M3 | `/Payments` vs `/PaymentHistory` vs 學生詳情繳費 | 相關非重複 | 保留拆分 |
| M4 | 老師 `/Schedule` vs `/TeacherTimetable` | 管理／點名 vs 週表＋ICS | 保留；標籤可更清楚 |
| M5 | `/LeaveManagement` vs `/TeacherLeaveWizard` | 學生請假／補堂 vs 老師請假／代堂 | 保留；分組標籤避免都叫「請假」 |
| M6 | `/PrivateTutoring` vs `/Classes`（一對一） | 刻意（HANDOFF §6.1） | 保留 |
| M7 | 點名紙／排程詳情／`/TeachingRecords` 教學紀錄 | 刻意多入口 | 批量／歷史以 TeachingRecords 為主 |
| M8 | Home 營運日板 vs `/MgmtDashboard` KPI | 不同職責；未來 manager 角色會重用 | 勿兩邊都叫「總覽」 |
| M9 | `/Calendar` 待辦 vs `/AcademicCalendar` vs `/Schedule` | **命名碰撞** | 待辦改標「待辦」；勿叫日曆 |

---

## 4. 隱藏路由一覽（無側欄葉節點）

### 4.1 合理（詳情／auth／公開表單）

| 路由 | 說明 |
| --- | --- |
| `/`、`/Login` | 導向／登入 |
| `/FrontDeskIntake/:token` | 家長公開 intake |
| `/Students/:id` 等 5 種詳情 | 由列表進入 |
| `/MonthlyTuition` | 僅 redirect |

### 4.2 Prototype／demo（建議收斂可見性）

| 路由 | Layout | 生產連結？ |
| --- | --- | --- |
| `/receipt-demo`、`/prototype/ReceiptDemo` | 無 | 文件／URL |
| `/prototype/ContactUpdate` | 無 | backlog 沙盒 |
| `/prototype/FrontDeskWizard` | 有 | **有**（前台頁） |
| `/prototype/TeacherLeaveWizard` | 有 | **有**（請假精靈） |
| `/prototype/ScheduleRollCall` | 有 | 無（死沙盒） |
| `/prototype/SecondaryAttendanceReport` | 有 | 無 |
| `/prototype/InboxSystemNotices` | 有 | 僅文件 |

### 4.3 產品功能但側欄缺失

| 路由 | 說明 |
| --- | --- |
| `/Calendar`、`/Calendar/:eventId` | 待辦看板／詳情 — **應補入口或正式下線** |

---

## 5. 角色：側欄隱藏 ≠ 頁面守衛

`AdaptiveLayout` 不依角色擋路由；多數頁只靠 `navStructure` 隱藏。部分頁有 `RequireMgmtRoles`／redirect（Users、Payments、AiReports…），其餘深連結仍可能開到 UI（實際寫入仍受 RLS）。

已知產品立場：前端角色 ≠ Auth／RLS（見 AGENT_HANDOFF、既有 role-ops 稽核）。本報告不重複 RLS 對抗項。

值得留意的導航不一致：

- `/Courses`：側欄僅 alien，但 `ClassDetailView` 對 admin 也有連到課程管理的連結。

---

## 6. Services／模組 orphan

| 模組 | 狀態 |
| --- | --- |
| `services/todoQueries.ts` | Orphan（僅 TodosView） |
| `services/monthlyTuitionQueries.ts` | UI orphan（僅死 MonthlyTuitionView） |
| `pages/Todos.tsx` | 未掛路由 |
| `pages/MonthlyTuition.tsx` | 未掛載（被 Navigate 取代） |
| `components/todos/TodosView.tsx` | 無消費者 |
| `api/entities.ts` | 似舊 Base44 shim，元件無 import（低產品影響） |

---

## 7. 建議清理順序（離開電腦後可排程）

1. **決定 `/Calendar`：** 補側欄「待辦」＋清 `todosToday` 死 fetch，或正式下線看板並改學生詳情深連結。
2. **刪死碼：** MonthlyTuition View／page／queries；TodosView／todoQueries／未掛載 Todos.tsx。
3. **收斂沙盒：** 正式頁去掉 prototype 連結；死 prototype 路由可刪或限 DEV。
4. **試堂路徑（T1）：** 與既有 backlog 合併，勿再開第三個建立入口。
5. **可選：** `/Calendar` 改名為待辦路由／標籤，減少與校曆混淆。

---

## 8. 刻意保留（勿當 bug）

- 點名雙入口、一對一列表 vs 班別詳情、請假兩套（學生／老師）、收款 vs 繳費紀錄、RoleSwitcher（雙身份帳號）、ContactUpdate prototype（功能未上線前沙盒）。
- Seed／重匯入僅 CLI／文件，無 in-app 種子頁。
