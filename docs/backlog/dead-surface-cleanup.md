# 死碼／路由表面清理（稽核後續）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（待辦已清；其餘死碼仍 open） |
| 優先 | 中 |
| 範圍 | 前端未掛載模組、已下線路由殘碼 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 來源稽核 | [`../audits/2026-07-31-unused-overlap-routes.md`](../audits/2026-07-31-unused-overlap-routes.md) |
| 盤點日期 | 2026-07-31 |

## 已完成

### 沙盒／demo（2026-07-31）

- 路由下線：`/receipt-demo`、`/prototype/*`
- 正式頁去掉沙盒連結（前台精靈、老師請假精靈）

### 待辦看板廢除（2026-07-31）

- 路由／UI／模組刪除：`/Calendar`、學生詳情「相關事項」、老師時間表「行政事件」、ICS 待辦事件、`src/components/todos/**`、`calendarQueries`、`todoQueries`、相關 pages
- Dashboard `todosToday` 欄位移除；`DetailLayerShell` 的 `todo` variant 移除
- 歷史資料清空：migration `20260731235000_abolish_admin_todo_board_data.sql`（`calendar_events`、`admin_todos` DELETE；**表結構保留**供 Portal／RLS）；遠端已套用並確認兩表 count = 0（2026-08-01）
- 文件／Apo：標「已廢除」，勿再指引 `/Calendar`

## 待做

### 死碼刪除（可一次 PR）

1. 月費獨立頁：`pages/MonthlyTuition.tsx`、`MonthlyTuitionView`、`monthlyTuitionQueries.ts`（保留 `lib/monthlyTuition.ts`）
2. Prototype／ReceiptDemo 原始碼與 `pages/Prototype*`、`pages/ReceiptDemo.tsx`（ContactUpdate 假資料可先留到正式頁上線）
3. 可選：`src/api/entities.ts`（似舊 Base44 shim，無元件 import）

### 產品／文案（低優先）

4. 試堂建立／收費路徑收斂 → 併 [`trial-sessions.md`](./trial-sessions.md) T1
5. 點名雙入口文案澄清（功能保留）
6. `/Courses` 側欄僅 alien，但班別詳情對 admin 有連結 — 對齊

## 不做本期

- drop `calendar_events`／`admin_todos` 表（Portal／RLS 仍引用）
- 重開待辦看板
