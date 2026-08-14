# 前端架構邊界／God files 收斂

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（已盤點；未開工） |
| 優先 | 高 |
| 範圍 | P1-2、P2-5：大型元件／service 拆界；component → service 分層；查詢失敗不可靜默當 0／空資料 |
| 不含 | 權限真源／RLS（見 [`tech-debt-hardening.md`](./tech-debt-hardening.md)）；查詢效能（見 [`page-load-perf-payroll-mgmt.md`](./page-load-perf-payroll-mgmt.md)）；全庫一次性重寫 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 稽核 | [`2026-08-14-tech-debt-review.md`](../audits/2026-08-14-tech-debt-review.md) |

## 點解合併

P1-2 同 P2-5 係同一根因：畫面、業務規則、DB 查詢、錯誤處理集中喺少數超大檔，令修改難以隔離及驗證。

已量度例子：

- `StudentDetailView.tsx` 3,143 行
- `ClassDetailView.tsx` 3,060 行
- `ScheduleManagePage.tsx` 2,936 行
- `PaymentsPageView.tsx` 2,088 行
- `studentQueries.ts` 2,024 行；`classQueries.ts` 1,930 行
- `TeacherHomeView.tsx` 直接 `supabase.from("trial_sessions")`，違反 component → service 分層
- `mgmtDashboardQueries.ts` 多處查詢錯誤只 `console.warn`，上層可能把失敗顯示成 0／空資料

## 目標

1. 正式 component 不直接打 DB；所有查詢回 service，map 成具名型別。
2. 先沿「可獨立測試的業務區塊」拆 God files，唔做純粹按行數切檔。
3. 錯誤、真 0、真空資料三種狀態分開；KPI／對帳失敗不可靜默變靚。
4. 拆出來的規則先補針對性測試，再移除舊路徑。

## 建議波次

1. **邊界違規先清**：`TeacherHomeView` 試堂查詢移入 service；盤點所有 component 直打 DB。
2. **錯誤語意**：定義 dashboard／對帳的 partial failure 結果；UI 顯示「資料未能載入」，唔當 0。
3. **高變更、高風險優先拆**：先點名／收款／班別詳情，再學生詳情；每波只拆一個業務 slice。
4. **Service 收斂**：把 1,000+ 行 query 檔按 bounded context 拆開，保留單向依賴。

## 驗收

- `src/components/**`／`src/pages/**` 無 `supabase.from(...)`。
- 被拆區塊有成功、空資料、查詢失敗測試。
- `MgmtDashboard` 關鍵 KPI 查詢失敗不顯示 0。
- 原路由／操作行為不變；build、lint、test、`ui:check` 全過。
