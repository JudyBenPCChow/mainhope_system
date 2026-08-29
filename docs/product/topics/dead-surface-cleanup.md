# 死碼／路由表面清理（稽核後續）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 前端未掛載模組、沙盒路由、Base44／命名殘渣（技術債 P2-4＋P3-1 前端部分） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 來源稽核 | [`../audits/2026-07-31-unused-overlap-routes.md`](../audits/2026-07-31-unused-overlap-routes.md) |
| 盤點日期 | 2026-07-31 |
| 上次更新 | 2026-08-29 |

## 進度摘要（2026-08-01）

| 區塊 | 狀態 |
| --- | --- |
| 2026-07-31 沙盒／demo 路由下線 | **歷史 done；其後部分路由加返，需重新清理** |
| 待辦看板廢除（UI＋歷史資料＋文件） | **done** |
| 月費獨立頁／queries 殘碼 | **暫緩・勿刪**（之後可能重用／改寫） |
| `contactUpdate` prototype | **暫緩・勿刪**（正式頁已上；沙盒仍作藍本） |
| 其餘 Prototype／ReceiptDemo **原始碼**刪除 | **open** |
| `src/api/entities.ts`（可選） | **open** |
| Base44 `app-params.ts`／Vite env／package 名 | **open** |
| `/Courses` nav／深連結對齊 | **已併出** [`tech-debt-hardening.md`](./tech-debt-hardening.md) P1-4 |
| 點名雙入口文案 | **open**（低；功能刻意保留） |
| 試堂收費路徑 | **已結** [`trial-sessions.md`](./trial-sessions.md)（零頁內收款；統一 `/Payments`） |

---

## 已完成

### 沙盒／demo 路由（2026-07-31；其後已回歸）

- `App.tsx` 移除 `/receipt-demo`、`/prototype/*`
- 正式頁去掉沙盒連結（前台精靈、老師請假精靈）
- 手冊／handoff 已改「已下線」

2026-08-14 全盤檢視確認下列路由其後重新出現，故「全部已下線」不再代表現況：

- `/prototype/HomeWayfinding`：免登入、假資料
- `/prototype/ContactUpdateCampaign`：登入後可 deep-link、假資料

**2026-08-29：** `/prototype/HomeworkTutoring` 已刪（正式走 `/HomeworkTutoring`）。

檔案可按下方「暫緩」保留，但 production `App.tsx` 是否掛路由要獨立處理；側欄無入口不等於無公開網址。

### 待辦看板廢除（2026-07-31～08-01）

- 刪路由／UI／模組：`/Calendar`、學生詳情「相關事項」、老師時間表「行政事件」、ICS 待辦事件、`src/components/todos/**`、`calendarQueries`、`todoQueries`、相關 pages
- Dashboard `todosToday`、`DetailLayerShell` 的 `todo` variant 移除
- Migration `20260731235000_abolish_admin_todo_board_data.sql`：清空 `calendar_events`、`admin_todos`；**表保留**（Portal／RLS）
- 遠端：已套用；兩表 count = 0（2026-08-01 覆核）
- 文件／Apo／UI 規範 §7／Mark Yu 指南／RLS_ROLLOUT：標「已廢除」

---

## 暫緩・先不要改（產品可能重用）

Agent／清碼時**勿刪、勿重構**下列殘碼，直至產品明確決定退役或正式接上：

### D1 — 月費獨立頁（暫緩刪檔；收款路徑已退役）

路由仍 redirect → `/Payments`。**2026-08-09：** `createMonthlyTuitionPayment` 已 throw 拒用（改走收款登記＋權益池）。檔案暫留作藍本，**勿當可收款入口**：

- `src/pages/MonthlyTuition.tsx`
- `src/components/payments/MonthlyTuitionView.tsx`
- `src/services/monthlyTuitionQueries.ts`（preview／列表仍可讀；收款函式已拒）
- `src/lib/monthlyTuition.ts`（計算／測試／報表仍在用，本來就保留）

### D2a — `contactUpdate` prototype（暫緩）

正式 [`contact-update-campaign`](./contact-update-campaign.md) 未接 DB／正式頁；保留作欄位／流程參考：

- `src/pages/PrototypeContactUpdate.tsx`（公開表單；路由已下線）
- `src/pages/PrototypeContactUpdateCampaign.tsx` + `/prototype/ContactUpdateCampaign`（批量活動頁沙盒）
- `src/prototypes/contactUpdate/**`

---

## 後續工程（本主題可做）

### D2b — 其餘 Prototype／ReceiptDemo 原始碼（中）

部分路由已重新掛入 `App.tsx`；先拆 production route，再判斷原始碼是否可刪（勿動上方 D2a）：

- `src/pages/ReceiptDemo.tsx`
- `src/pages/Prototype*.tsx`（除 `PrototypeContactUpdate`）
- `src/prototypes/**`（除 `contactUpdate/`）

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

- 刪月費獨立頁／`monthlyTuitionQueries`（見上方暫緩）
- 刪 `contactUpdate` prototype（見上方暫緩）
- drop `calendar_events`／`admin_todos` 表
- 重開待辦看板
- 試堂建立／收費收斂（見 trial-sessions）
