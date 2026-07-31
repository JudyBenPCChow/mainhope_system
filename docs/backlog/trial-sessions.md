# 試堂紀錄（收尾／可選）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（階段 1／O1t 已落 code；T2 人手驗收未做） |
| 優先 | 中 |
| 範圍 | `/TrialSessions` 正式頁；對帳只讀；點名人頭驗收 |
| 不含 | 已交付：列表深鏈、轉正／流失／改期閘門、KPI、清 `?demo=1`、刪沙盒 |
| 決策 | 試堂頁零收款；錢經 `/Payments`；§15 單一入口；O1t 取消／刪／改期强制清點名 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 更新日期 | 2026-08-01 |
| 對抗檢查 | [audits/2026-08-01-trial-sessions-wrapup-adversarial.md](../audits/2026-08-01-trial-sessions-wrapup-adversarial.md) · [補充](../audits/2026-08-01-trial-sessions-wrapup-adversarial-supplement.md) |
| 收款鐵則 | [`UI_DESIGN_INSTRUCTIONS.md` §15](../UI_DESIGN_INSTRUCTIONS.md) |

## 未做／已做（簡明）

| ID | 項目 | 狀態 | 說明 |
| --- | --- | --- | --- |
| T1 | 試堂頁內嵌收費 | **done（本輪）** | 只建試堂 → 半價／原價導向 `/Payments`；`linkOpenTrialsToPayment` 回寫 |
| T3 | 對帳最小 | **done（本輪）** | 橫幅註明以繳費紀錄為準；新單自動掛收據 |
| S11／O1t | 取消／刪／改期掃出席 | **done** | preview＋Confirm 一併刪；無保留路 |
| ADV-SUP-5 | 作廢解掛 | **done（本輪）** | `void-payment` 清 `trial_sessions.payment_id`（**須重新 deploy function**） |
| ADV-SUP-6 | 連堂節數 | **done（本輪）** | `/Payments` 選試堂班時預填連堂節數 |
| ADV-SUP-1 | 刪有收據警告 | **done（本輪）** | Confirm＋audit |
| ADV-SUP-8 | route guard | **已有** | `RequireMgmtRoles` admin／alien |
| T2 | 點名人頭／改期驗收 | **仍欠人手** | staging 測生 |
| T4 | 快速登記 | **暫不做** | |
| T5 | 手機卡片 | **defer** | 併 mobile-ui |
| PaymentStep 收斂 | 已知例外 | **另票** | |

## 修改後前台行為

- 試堂頁只登記；半價／原價會開收款登記。
- 收款金額：原價／半價自動計，**可人手改**。
- 對帳信**繳費紀錄**；試堂列表收據號僅新單保證關聯。
- 已點名再取消／刪／改期：必須一併清點名。

## 相關程式

- [`TrialSessionsView.tsx`](../../src/components/trials/TrialSessionsView.tsx)
- [`trialQueries.ts`](../../src/services/trialQueries.ts)（`linkOpenTrialsToPayment`、`previewTrialAttendanceImpact`）
- [`PaymentsPageView.tsx`](../../src/components/payments/PaymentsPageView.tsx)
- [`void-payment/index.ts`](../../supabase/functions/void-payment/index.ts)
