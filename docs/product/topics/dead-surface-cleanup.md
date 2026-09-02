# 死碼／路由表面清理（稽核後續）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 前端未掛載模組、沙盒路由、Base44／命名殘渣（技術債 P2-4＋P3-1 前端部分） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點日期 | 2026-07-31 |
| 上次更新 | 2026-09-03 |

## 進度摘要

| 區塊 | 狀態 |
| --- | --- |
| 2026-07-31 沙盒／demo 路由下線 | **歷史 done；其後部分路由加返** |
| 待辦看板廢除（UI＋歷史資料＋文件） | **done** |
| **已上線功能對應之 prototype／沙盒刪除** | **open（2026-09-03 產品定案：要刪）** |
| 月費獨立頁／queries 殘碼 | **暫緩・勿刪** |
| `sandbox/tuition-quote`（未產品化） | **暫緩・可留作 HTML 沙盒範本** |
| `src/api/entities.ts`（可選） | **open** |
| Base44 `app-params.ts`／Vite env／package 名 | **open** |
| `/Courses` nav／深連結對齊 | **已併出** [`tech-debt-hardening.md`](./tech-debt-hardening.md) P1-4 |
| 點名雙入口文案 | **open**（低；功能刻意保留） |
| 試堂收費路徑 | **已結** [`trial-sessions.md`](./trial-sessions.md) |

---

## 產品定案（2026-09-03）

**正式功能已上線者：刪除對應 React prototype／獨立沙盒**（頁面、路由、`src/prototypes/<名>/`、相關假資料）。勿再「暫緩當藍本」——正式碼即真源。

先前 D2a「`contactUpdate` 暫緩勿刪」**撤銷**（正式 [`contact-update-campaign`](./contact-update-campaign.md) 已 `done`）。

### 要刪（已有正式入口）

| 沙盒 | 刪什麼 | 正式入口（保留） |
| --- | --- | --- |
| frontDeskWizard | `PrototypeFrontDeskWizard`、`src/prototypes/frontDeskWizard/` | `/FrontDeskWizard` |
| teacherLeaveWizard | `PrototypeTeacherLeaveWizard`、`src/prototypes/teacherLeaveWizard/` | `/TeacherLeaveWizard` |
| contactUpdate | `PrototypeContactUpdate*`、`/prototype/ContactUpdateCampaign`、`src/prototypes/contactUpdate/` | `/ContactUpdate/:token`、`/ContactUpdateCampaign` |
| homeWayfinding | `PrototypeHomeWayfinding`、`/prototype/HomeWayfinding`、`src/prototypes/homeWayfinding/` | 正式行政／老師首頁 |
| scheduleRollCall | `PrototypeScheduleRollCall`、`src/prototypes/scheduleRollCall/` | `/Schedule`＋點名 |
| secondaryAttendanceReport | `PrototypeSecondaryAttendanceReport`、`src/prototypes/secondaryAttendanceReport/` | `/SecondaryAttendanceReport` |
| inboxSystemNotices | `PrototypeInboxSystemNotices`、`src/prototypes/inboxSystemNotices/` | `/Inbox` |
| payroll-ui | `sandbox/payroll-ui/`、相關 `npm run sandbox:payroll*`（若無其他依賴） | `/Payroll`（及既有 preview 旗標路由若仍要則另判，**勿**留整站假資料沙盒） |
| （歷史）ReceiptDemo 等 | `src/pages/ReceiptDemo.tsx` 若仍在 | 無正式 demo 路由 |

開工順序建議：

1. 拆 `App.tsx` 仍掛之 `/prototype/*`（現況：`HomeWayfinding`、`ContactUpdateCampaign`）。
2. 刪上表頁面與 `src/prototypes/**`（整目錄清完則可收窄 `eslint.config.js` 對 `src/prototypes/**` 的 ignore）。
3. 刪 `sandbox/payroll-ui/` 並清 package scripts／文件引用。
4. `npm run build`／lint；搜殘餘 `prototype/`、`FlaskConical` 沙盒橫幅連結。

### 暫緩・勿刪

#### D1 — 月費獨立頁（收款路徑已退役；檔案暫留）

路由仍 redirect → `/Payments`。**勿當可收款入口**：

- `src/pages/MonthlyTuition.tsx`
- `src/components/payments/MonthlyTuitionView.tsx`
- `src/services/monthlyTuitionQueries.ts`
- `src/lib/monthlyTuition.ts`（計算／測試／報表仍在用）

#### D2 — `sandbox/tuition-quote`（未產品化）

獨立 HTML 學費試算；`src` 無對應正式頁。可留作 [ui-sandbox-html](../../../.cursor/skills/ui-sandbox-html/SKILL.md) 範本，**非**「已上線未刪沙盒」。

---

## 已完成

### 沙盒／demo 路由（2026-07-31；其後已回歸）

- 當時曾移除 `/receipt-demo`、`/prototype/*`；其後部分加返（見上方定案，改為刪檔）。

**2026-08-29：** `/prototype/HomeworkTutoring` 已刪（正式走 `/HomeworkTutoring`）。

**2026-08-31：** `/prototype/AdminContextRail` 同 `src/prototypes/adminContextRail/`、對應 HTML 沙盒已刪（正式走 `RecordPreviewRail`）。

### 待辦看板廢除（2026-07-31～08-01）

- 刪路由／UI／模組：`/Calendar`、學生詳情「相關事項」、老師時間表「行政事件」、ICS 待辦事件、`src/components/todos/**`、`calendarQueries`、`todoQueries`、相關 pages
- Dashboard `todosToday`、`DetailLayerShell` 的 `todo` variant 移除
- Migration `20260731235000_abolish_admin_todo_board_data.sql`：清空 `calendar_events`、`admin_todos`；**表保留**（Portal／RLS）
- 遠端：已套用；兩表 count = 0（2026-08-01 覆核）
- 文件／Apo／UI 規範 §7／Mark Yu 指南／RLS_ROLLOUT：標「已廢除」

---

## 後續工程（本主題可做）

### D2b — 已上線 Prototype／沙盒刪除（中・優先）

見上方「產品定案（2026-09-03）」刪除表。完成後本列改 **done**。

### D3 — `src/api/entities.ts`（低／可選）

似舊 Base44 shim，元件無 import；確認無腳本依賴後刪。

同一波先把 `queries.listStudents()` 等正式 caller 遷去用途專用 service；查詢語意／窄 select 見 [`soft-archive-query-scope.md`](./soft-archive-query-scope.md)，避免為刪 shim 直接改共用 API 行為。

### D4 — `/Courses` 角色入口對齊（已併出）

側欄僅 alien；班別詳情「前往課程管理」已限 `isAlien()`。**深連結頁級守衛**已併入 [`tech-debt-hardening.md`](./tech-debt-hardening.md)（P1-4）；本題不再當獨立工程。

### D5 — 點名雙入口文案（低）

`/Attendance` vs 排程「確定點名」刻意保留；補一句產品文案分清「當日批次」vs「從該堂」即可（非刪功能）。

### D6 — Base44／package 命名殘渣（低）

技術債 P3-1 的前端／repo 部分併入本題：

- `src/lib/app-params.ts` 及 `VITE_BASE44_*` 型別：`getAppParams()` 無正式 caller；確認後刪。
- `src/api/entities.ts`：跟 D3 一併處理。
- `package.json` name 仍為 `mingxue-admin`：改成 MainHope 專案一致名稱，並同步 lockfile。
- `.DS_Store` 已在 gitignore 但仍 tracked：另次清理 index，勿連同用戶其他未提交檔誤刪。

DB duplicate index／import table 等 schema 殘渣不放本題，見 [`database-contract-advisor-hygiene.md`](./database-contract-advisor-hygiene.md)。

---

## 不做本期

- 刪月費獨立頁／`monthlyTuitionQueries`（見 D1）
- 刪 `sandbox/tuition-quote`（見 D2；未產品化範本）
- drop `calendar_events`／`admin_todos` 表
- 重開待辦看板
- 試堂建立／收費收斂（見 trial-sessions）
