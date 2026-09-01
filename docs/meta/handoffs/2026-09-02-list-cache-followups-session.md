# Session HANDOFF：清單快取工程收尾

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-09-02 |
| 主題／backlog | [`docs/product/topics/list-data-cache.md`](../../product/topics/list-data-cache.md)（`in_progress`）；排程拆分另見 [`schedule-manage-page-refactor.md`](../../product/topics/schedule-manage-page-refactor.md) |
| 分支／工作樹 | 實作來源為 `cursor/22710242`（遠端 `d0644f95`；本地 ref 可能仍停在 `8dea8841`）。本 HANDOFF、清單快取分題與排程拆分分題目前在 `main` 工作樹未提交 |

## 目標

- 收尾清單資料快取工程：產品分題已立。其餘為班別快取統一、功輔寫庫移出 `setState`、收款紀錄深連結競態、PostgREST RPC schema reload、寫入後失效。
- 不處理功輔路由 `Outlet`、角色／裝置詳情分流，也不在本輪拆分 `ScheduleManagePage`。

## 已完成

- 已核對 `cursor/22710242` 相對 `origin/main`：遠端 `d0644f95`（3 commits ahead、0 behind）。`8dea8841` 之後另有 merge main（更新日志改為 SU-20260902-03～05）及功輔型別修正 `d0644f95`。尚未合入 `main`。
- 已新增 `docs/product/topics/list-data-cache.md`（`in_progress`）；`BACKLOG.md` 索引列僅在本 `main` 工作樹未提交。
- 已確認班別 `classesListState.ts` 仍自行維護 TTL／`fetchedAt`／invalidate／patch，未使用共用 helper。
- 已確認 `setMonthRosterStatusPersisted` 仍在 React state updater 內以 `void` 執行清除佔室及更新編更狀態。
- 已確認 `PaymentHistoryView` 先用舊快取／空篩選載入，再由 effect 讀取 `studentId`；並行請求沒有 generation guard，較慢的舊結果可覆蓋指定學生結果。
- 已確認 RPC migration `20260901214000_class_schedule_summaries_rpc.sql` 及 `db:apply` 流程沒有 `NOTIFY pgrst, 'reload schema'`。
- 第 4 項排程頁架構債已另立 `docs/product/topics/schedule-manage-page-refactor.md`，不屬本次實作。

## 未完成／卡住

- 五項均未實作、未測試、未提交。
- 本會話沒有查詢 production；不可假設 RPC migration、migration history 或目前 schema cache 狀態。開始資料庫工作時須按 Supabase migration skill 核對。
- `cursor/22710242` 與最新 `origin/main` 已分歧；開始前先檢查 branch／PR 狀態及完整 diff，不要在目前 `main` 未提交文件上直接混入功能程式。

## 下一步（給新會話）

1. 以 `cursor/22710242` 遠端 `d0644f95` 為基線開／對齊功能分支，不要把功能程式混入目前 `main` 未提交文件。
2. ~~新增產品分題~~ 已完成：見 `docs/product/topics/list-data-cache.md`。
3. 將 `classesListState.ts` 改用 `createListDataCache`，保留 `includeOlderYears` 鍵、分階段資料載入、invalidate 與 patch 語意；補 helper 及班別快取測試。
4. 把 `setMonthRosterStatusPersisted` 改為具名 async command：先 `await` 清除佔室／更新編更狀態，成功後才更新 state 與快取；失敗須保留舊狀態並顯示錯誤。子元件 callback 須回傳 `Promise<void>`，不可再冒充 React setter。
5. 修正 `PaymentHistoryView`：初始 render 直接由 URL 建立 canonical filter key；快取鍵不符便不 hydrate 舊列；學生 ID 改變時清舊姓名；加入 request generation 或 AbortController，拒絕過期的首次載入及載入更多結果。測試「快取學生 A → 深連結學生 B」及兩請求逆序完成。
6. 處理 RPC schema reload：先核對 `20260901214000` 是否已在 remote history。若已套用，不得修改既有 migration；新增後續 migration 或其他可重播機制發出 `NOTIFY pgrst, 'reload schema'`，並把 RPC 套用後的 Data API smoke test 寫入 migration 流程文件／skill。
7. 跑相關測試後，再跑 `npm run lint`、`npm run ui:check`、`npm run build`；涉及 migration 時須單檔套用並透過 `supabase.rpc()` 或等價 PostgREST 呼叫驗證。

## 開局必讀（精簡）

- `AGENTS.md`
- `docs/product/topics/list-data-cache.md`（若仍不存在，先按上一步建立）
- `src/components/payments/PaymentHistoryView.tsx`
- `src/components/homeworkTutoring/HomeworkTutoringApp.tsx`

## 勿再踩

- React state updater 必須是純函式；不可在其中執行資料庫 I/O。
- 深連結參數須在初始 state／快取 hydration 前取得；不可先畫上一訪資料再靠 effect 修正。
- 資料庫內已存在函式，不代表 PostgREST 已更新 schema cache；驗收必須走 Data API。
- 已套用的 migration 只新增後續檔，不回改歷史檔。
- `BACKLOG.md` 索引只在 `main` 維護；feature 分支只更新產品分題。

## 明確不做

- 不把功輔分頁改為父路由加 `Outlet`；現有學生／月費／編更均命中同一條 `:page` 路由，通常不會卸載 `HomeworkTutoringApp`。
- 不統一桌面行政／外星人右側預覽與其他角色／流動裝置完整詳情的產品行為。
- 不在本工程拆分 `ScheduleManagePage`；另見 `docs/product/topics/schedule-manage-page-refactor.md`。
- 不處理 `EntityListPage` 死碼或 Button loading 文件重複。
