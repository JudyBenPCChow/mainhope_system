# 試堂紀錄（收尾／可選）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | `/TrialSessions` 正式頁；對帳只讀；點名人頭驗收 |
| 不含 | 已交付：列表深鏈、轉正／流失／改期閘門、KPI、清 `?demo=1`、刪沙盒 |
| 決策 | 見 Cursor plan「試堂頁面重建方案」；學費脫鉤／未點名可轉＋警告／流失須先取消／跨班一律 converted |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 更新日期 | 2026-07-30 |

## 未做（簡明）

| ID | 項目 | 說明 | 建議 |
| --- | --- | --- | --- |
| T1 | 新增試堂內嵌收費 | 半價／原價仍走 `insertPaidTrialSession`（試堂頁收款）；轉正已改只連 `/Payments`，兩邊不一致 | 拍板：保留例外，或改「只建試堂 → 收款頁／前台精靈」 |
| T2 | 點名人頭／改期名單驗收 | 人手只讀：建試堂→該堂名單有人；改期→舊堂無名、新堂有名；點名人數含試堂 | 用測試生；勿對真實待跟進生亂轉正／流失 |
| T3 | 試堂收費對帳（只讀） | 頁頂有 `payment_id` 筆數；完整對帳用 Dashboard SQL 或之後加只讀對帳 UI | 跟 `student_id`／收據，勿只對姓名 |
| T4 | 快速登記 2 步 | 試堂頁「學生→班＋排程」快捷新增 | **暫不做**（用前台精靈「只登記試堂」） |
| T5 | 手機卡片列表 | 正式頁仍橫滑 table；沙盒曾有卡片已刪 | 可併 [`mobile-ui.md`](./mobile-ui.md) |

## 驗收提示（T2）

1. 測試生建免費試堂 → 開該堂點名／排程名單有此人（試堂）。
2. 改期 → 舊堂無名、新堂有名。
3. 流程（另一輪）：未點名轉正警告 → 跨班報讀 → 先取消再流失。

## 相關程式

- [`TrialSessionsView.tsx`](../../src/components/trials/TrialSessionsView.tsx)
- [`trialQueries.ts`](../../src/services/trialQueries.ts)（`insertPaidTrialSession`、`convertTrialToEnrollment`、`rescheduleTrialSession`）
- 點名合併試堂：[`attendanceQueries.ts`](../../src/services/attendanceQueries.ts)、[`RollCallClassPanel.tsx`](../../src/components/attendance/RollCallClassPanel.tsx)
