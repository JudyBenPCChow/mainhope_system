# 試堂紀錄（收尾／可選）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | `/TrialSessions` 正式頁；對帳只讀；點名人頭驗收 |
| 不含 | 已交付：列表深鏈、轉正／流失／改期閘門、KPI、清 `?demo=1`、刪沙盒 |
| 決策 | 見 Cursor plan「試堂頁面重建方案」；學費脫鉤／未點名可轉＋警告／流失須先取消／跨班一律 converted |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 更新日期 | 2026-07-31 |
| 行政模擬 | 見下方「行政邊緣模擬」 |
| 複查 | 2026-07-31 晚：頁面改版後 code 複查，見下方「複查結論」 |
| 對抗檢查 | 2026-08-01：[audits/2026-08-01-trial-sessions-wrapup-adversarial.md](../audits/2026-08-01-trial-sessions-wrapup-adversarial.md)（P0：收費只走 `/Payments`，唔好再推 PaymentStep 做主路徑） |
| 收款鐵則 | [`UI_DESIGN_INSTRUCTIONS.md` §15](../UI_DESIGN_INSTRUCTIONS.md) |

## 未做（簡明）

| ID | 項目 | 複查 | 說明 | 建議 |
| --- | --- | --- | --- | --- |
| T1 | 新增試堂內嵌收費 | **仍在**（計劃已定案） | 試堂頁仍走 `insertPaidTrialSession`；應對齊：**只建試堂 → `/Payments` 收款**（單一入口 §15）；`payment_id` 由收款出單回寫。前台 `PaymentStep` 係已知例外，另票收斂，**唔做主路徑** | 見對抗 ADV-P0-1 |
| T2 | 點名人頭／改期名單驗收 | **仍欠人手** | code path 仍對：開著試堂按 `schedule_id` 併入點名；改期只換 `schedule_id`（舊堂名冊自然沒人）。**無人手／自動化驗收** | staging 測生走一遍；勿對真實待跟進生亂轉正／流失 |
| T3 | 試堂收費對帳（只讀） | **仍欠完整** | 頁頂仍有 `payment_id` 筆數；列表顯示收據號。無學生／金額／收據完整對帳 UI | Dashboard SQL 或之後加只讀對帳；跟 `student_id`／收據 |
| T4 | 快速登記 2 步 | **仍暫不做** | 試堂頁無「學生→班＋排程」快捷；前台「只登記試堂」仍在 | 維持暫不做 |
| T5 | 手機卡片列表 | **仍在** | 正式頁仍 `overflow-x-auto`＋`min-w-[960px]` table | 可併 [`mobile-ui.md`](./mobile-ui.md) |

## 複查結論（2026-07-31）

對現行 `TrialSessionsView`／`trialQueries`／點名合併路徑再讀一次；**表格上的問題沒有因頁面改版而消失**，閘門／KPI 等已交付項仍在。

| 證據 | 位置 |
| --- | --- |
| 試堂頁內嵌收費 | `TrialSessionsView.confirmTrialCharge` → `insertPaidTrialSession` |
| 轉正不收款 | `convertTrialToEnrollment` 註解「學費請到 /Payments」；`TrialConvertDialog` 只連收款頁 |
| 前台半價／原價先建後收 | `EnrollClassStep` Confirm 後 `insertTrialSession`，收費在 Payment 步 |
| 點名含試堂 | `attendanceQueries` 依 `schedule_id` 撈未完成／未取消 `trial_sessions` |
| 改期不掃出席 | `rescheduleTrialSession` 只 update `schedule_id`／`trial_date` |
| 取消／刪不掃出席 | `updateTrialSession`／`deleteTrialSession` 無 attendance 邏輯；生命週期 O4 仍未做 |
| 轉正未點名警告 | `trialConvertRollCallWarning`＋Convert Dialog 文案仍在 |
| 流失須先取消 | `trialCanRecordLost`／UI「流失須先取消」仍在 |
| 列表仍橫滑表 | `min-w-[960px]` table，無手機卡片 |

## 行政邊緣模擬（2026-07-31）

來源：行政桌面能力模擬（Canvas `admin-edge-case-simulation.canvas.tsx`）。

| 模擬 ID | 個案 | 判定 | 發現的問題 | 落點 |
| --- | --- | --- | --- | --- |
| S11 | 已點名試堂取消／改期 | **複查仍半完成** | 取消／改期**不**掃出席 → 舊堂出席可成孤兒且仍計費；轉正／流失閘門已有，出席生命週期未齊 | **工程主修在** [lifecycle-orphans.md](./lifecycle-orphans.md) **O4（階段 C）**；本檔 T2 仍做人頭／改期名冊驗收 |
| — | （搭配 T2） | — | 模擬建議：staging 用測試生走「建→點名有人→改期舊無名新有名」；勿對真實待跟進生亂轉正 | T2 |

接手試堂頁時：收費／KPI／卡片用本檔；**取消改期的出席清理不要只改試堂 UI**，跟生命週期 O4 同一套掃描 API。

## 驗收提示（T2）

1. 測試生建免費試堂 → 開該堂點名／排程名單有此人（試堂）。
2. 改期 → 舊堂無名、新堂有名。
3. 流程（另一輪）：未點名轉正警告 → 跨班報讀 → 先取消再流失。

## 相關程式

- [`TrialSessionsView.tsx`](../../src/components/trials/TrialSessionsView.tsx)
- [`trialQueries.ts`](../../src/services/trialQueries.ts)（`insertPaidTrialSession`、`convertTrialToEnrollment`、`rescheduleTrialSession`）
- 點名合併試堂：[`attendanceQueries.ts`](../../src/services/attendanceQueries.ts)、[`RollCallClassPanel.tsx`](../../src/components/attendance/RollCallClassPanel.tsx)
- 前台只登記試堂：[`EnrollClassStep.tsx`](../../src/components/frontDesk/steps/EnrollClassStep.tsx)
