# 試堂紀錄（收尾）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（工程主路徑＋PaymentStep 收斂＋系統通知已落；視為試堂問題已完全解決） |
| 優先 | 中（結案） |
| 範圍 | `/TrialSessions`；收款單一入口 §15；O1t 出席清理 |
| 不含 | 已交付：列表深鏈、轉正／流失／改期閘門、KPI、清 demo／沙盒 |
| 決策 | 試堂頁零收款；錢經 `/Payments`；對帳信繳費紀錄；取消／刪／改期强制一併刪點名 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 更新日期 | 2026-08-01 |
| 收款鐵則 | [`UI_DESIGN_INSTRUCTIONS.md` §15](../UI_DESIGN_INSTRUCTIONS.md) |
| 系統通知 | `20260801010000`「試堂與前台：收費統一改去「收款登記」」（admin／alien） |

## 已做（結案）

| ID | 項目 | 說明 |
| --- | --- | --- |
| T1 | 拆試堂頁內嵌收費 | 只建試堂；半價／原價導向 `/Payments` |
| T3 | 最小對帳 | 出單後 `linkOpenTrialsToPayment`；橫幅註明以繳費紀錄為準 |
| S11／O1t | 取消／刪／改期掃出席 | preview＋Confirm 一併刪；無保留路 |
| ADV-SUP-1 | 刪有收據警告＋audit | |
| ADV-SUP-5 | 作廢解掛 | `void-payment` 清 `payment_id`（已 deploy） |
| ADV-SUP-6 | 連堂節數 | `/Payments` 選試堂班預填連堂節數 |
| ADV-SUP-8 | route guard | admin／alien（已有） |
| PaymentStep | 精靈收款收斂 | 只導向 `/Payments`，唔再內嵌出單 |
| T2 | 點名人頭／改期／收費回寫 | **結案**：工程路徑已齊；日常若無異常即視為通過（無需再開票） |

## 另票（非試堂主路徑）

| ID | 項目 | 狀態 | 說明 |
| --- | --- | --- | --- |
| T4 | 快速登記 2 步 | 暫不做 | 用前台「只登記試堂」即可 |
| T5 | 手機卡片列表 | defer | 併 [`mobile-ui.md`](./mobile-ui.md) |

## 前台行為（現況）

- 試堂頁只登記；半價／原價會開收款登記（原價／半價自動計，金額可改）。
- 前台精靈收款步只導去收款登記（唔再精靈入面出單）。
- 對帳信**繳費紀錄**；試堂列表收據號僅新單保證關聯。
- 已點名再取消／刪／改期：必須一併清點名。

## 相關程式

- [`TrialSessionsView.tsx`](../../src/components/trials/TrialSessionsView.tsx)
- [`trialQueries.ts`](../../src/services/trialQueries.ts)
- [`PaymentsPageView.tsx`](../../src/components/payments/PaymentsPageView.tsx)
- [`PaymentStep.tsx`](../../src/components/frontDesk/steps/PaymentStep.tsx)（導引至 `/Payments`）
- [`void-payment/index.ts`](../../supabase/functions/void-payment/index.ts)
