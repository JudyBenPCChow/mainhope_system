# 清單資料快取（卸載後返回）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress` |
| 優先 | 中 |
| 範圍 | 清單與獨立詳情／分頁分成不同路由時的記憶體 TTL 快取；班別列表摘要 RPC；寫入後失效；深連結優先於快取 |
| 不含 | 收件匣、進行點名、收款登記、各類報表、家長報讀申請等須即時的工作佇列；計糧／營運總覽快取（見 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md)）；拆分 `ScheduleManagePage`（見 [`schedule-manage-page-refactor.md`](./schedule-manage-page-refactor.md)）；功輔改父路由加 `Outlet`；角色／裝置詳情分流 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 工程位置 | 實作在 `cursor/22710242`（遠端 `d0644f95`；以該 SHA 為基線，勿只看本地 `8dea8841`） |
| 立案 | 2026-09-02：效能工程已有程式，補產品分題並收尾四項缺口 |

## 一句

清單離開詳情或分頁再返回時，數分鐘內應即時顯示剛才所見的列，不得整表重抓；URL 深連結永遠優先於快取，寫入成功後必須失效。

## 開工閘

- 以 `cursor/22710242` 相對最新 `origin/main` 的完整 diff 為基線繼續，避免遺失 `8dea8841` 的快取實作與後續 `d0644f95` 功輔型別修正。本地 `cursor/22710242` 可能停在舊 SHA。
- 本工作樹 `main` 上的交接檔與排程拆分分題尚未提交；**不要**把功能程式混入該批未提交文件。功能改動在快取分支進行。
- 開始資料庫工作前，按 `apply-supabase-migration` 核對 `20260901214000_class_schedule_summaries_rpc.sql` 是否已在 remote history。已套用則不得修改該檔。
- 對上一個工程不擋路。本題進行中時，[`schedule-manage-page-refactor.md`](./schedule-manage-page-refactor.md) **只立項，不實作**。

## 產品規則

1. **何時必須接快取**：清單與詳情、新增頁或分頁是不同路由，離開會卸載 React 樹。篩選可繼續用 `sessionStorage`；已載入的列必須用模組級記憶體快取。
2. **TTL**：預設 5 分鐘（`LIST_DATA_CACHE_TTL_MS`）。新鮮且鍵相符則不打網路；有舊列則先畫，過期則靜默重抓。
3. **快取鍵**：必須包含會改變查詢結果的範圍（學年、日期、老師 scope、學生 ID、角色等）。鍵不符則不得 hydrate 舊列。
4. **失效**：清單或詳情／寫入頁成功後 `invalidate`（保留列以便返回即時顯示，下次進頁靜默重抓）。不可只靠 TTL 過期。
5. **深連結優先**：有效 URL 參數永遠優先於快取。初始 render 必須已用 URL 建立 canonical 快取鍵；不可先畫上一訪資料再靠 effect 修正。
6. **禁止**用 `location.key` 當重載條件。
7. **空列**：`isUsable` 預設要求已有列；空結果不當新鮮快取。

實作入口：`createListDataCache`（`src/lib/listDataCache.ts`）。規範：`AGENTS.md` 鐵則「清單快取」、`.cursor/rules/list-data-cache.mdc`、`docs/meta/UI_DESIGN_INSTRUCTIONS.md` §16.5。

## 適用頁面（`cursor/22710242` 已接）

| 畫面 | 路由 | 快取鍵 | 寫入後失效（現況） |
| --- | --- | --- | --- |
| 學生管理 | `/Students` ↔ `/Students/:studentId` | `isActiveScope`、`showGraduated` | 學生詳情、班別加／退報讀 |
| 班別管理 | `/Classes` ↔ `/Classes/:classId`、`/Classes/New` | `includeOlderYears` | 新增班、班別詳情寫入；**仍自建 TTL，未用共用 helper** |
| 老師管理 | `/Teachers` ↔ `/Teachers/:teacherId` | 無額外範圍 | 老師詳情寫入 |
| 排程管理 | `/Schedule` ↔ `/Schedule/:scheduleId` | `teacherScopeId`、`displayStart`、`rangeEnd` | 排程詳情寫入；日期裁決見下節 |
| 私人課程 | `/PrivateTutoring` | `teacherTid` | 已匯出 `invalidate`，**畫面尚未呼叫** |
| 功課輔導班 | `/HomeworkTutoring`、`/HomeworkTutoring/:page` | `role` | 以 `patch` 同步部分寫入；編更狀態仍在 `setState` 內 `void` 寫庫 |
| 收款紀錄 | `/PaymentHistory` | 狀態、日期、搜尋、`filterStudentId`、`includeOlderYears` | 已匯出 `invalidate`，**畫面尚未呼叫**；深連結有競態 |
| 增退紀錄 | `/EnrollmentChanges` | 動作、日期、搜尋、`includeOlderYears` | 無 `invalidate` |
| 試堂紀錄 | `/TrialSessions` | `includeOlderYears` | 已匯出 `invalidate`，**畫面尚未呼叫** |
| 請假管理 | `/LeaveManagement` | `includeOlderYears` | 已匯出 `invalidate`，**畫面尚未呼叫** |
| 出席紀錄 | `/AttendanceRecords` | `from`、`to` | 已匯出 `invalidate`，**畫面尚未呼叫** |
| 教學紀錄 | `/TeachingRecords` | `from`、`to`、`teacherTid` | 無 `invalidate` |
| 課程管理 | `/Courses` | 無額外範圍 | 已匯出 `invalidate`，**畫面尚未呼叫** |
| 課室管理 | `/Classrooms` | 課室列表無額外範圍；週次排程另核 `selectedRoomId`＋週起迄 | 無 `invalidate` |

同分支亦已落地：班別列表改走 `get_class_schedule_summaries`；桌面班別名單用 `StickyListShell` 固定頂列。更新日志為 `SU-20260902-03`～`05`。

## 排除頁面（不要套 TTL 快取）

須看到最新列的工作佇列與報表，離開再回來應重抓：

- 收件匣 `/Inbox`
- 進行點名 `/Attendance`
- 收款登記 `/Payments`
- 家長報讀申請 `/PortalEnrollmentRequests`
- 人數報表、中學出席統計、智能分析、職員表現、成本／薪金／總覽等報表與工作台

計糧未結算 live 重算快取屬 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 4，不併入本題。

## 深連結優先次序

**通用**

1. 有效 URL 參數（學生 ID、日期、狀態等）永遠優先。
2. 無衝突時，新鮮且鍵相符的快取可即時還原。
3. 鍵不符：不得 hydrate 舊列，亦不得沿用舊篩選／舊姓名。
4. 過期但鍵相符：先畫舊列，再靜默重抓。

**排程管理**（現況；架構拆分另題）

有效 URL 日期 → 同角色範圍且日期相符的快取 → 未來最近排程 → 今天。日視圖其後寫回 URL，不得覆蓋初始裁決。

**收款紀錄（待修）**

`?studentId=` 必須在初始 state／快取 hydration 前納入 canonical key。現況先用舊快取／空篩選載入，再由 effect 讀 URL；並行請求無 generation guard，較慢的舊結果可覆蓋指定學生結果。

## 班別摘要 RPC

`supabase/migrations/20260901214000_class_schedule_summaries_rpc.sql` 新增 `get_class_schedule_summaries(uuid[])`：每班一列（是否有未取消堂、首尾日期）。職員全範圍；老師僅自己班。前端 `fetchScheduleSummariesByClassIds` 改走 `supabase.rpc()`。

該檔**沒有** `NOTIFY pgrst, 'reload schema'`。資料庫已有函式，不代表 PostgREST Data API 已更新 schema cache。驗收必須走 Data API，不可只查 `pg_proc`。

## 待做

1. **班別快取改用共用 helper**：`classesListState.ts` 改走 `createListDataCache`，保留 `includeOlderYears` 鍵、分階段資料載入、invalidate 與 patch 語意；補 helper 及班別快取測試。
2. **功輔編更寫庫移出 `setState`**：`setMonthRosterStatusPersisted` 改為具名 async command；先 `await` 清除佔室／更新編更狀態，成功後才更新 state 與快取；失敗須保留舊狀態並顯示錯誤。子元件 callback 須回傳 `Promise<void>`。
3. **收款紀錄深連結與競態**：初始 render 直接由 URL 建立 canonical filter key；快取鍵不符便不 hydrate 舊列；學生 ID 改變時清舊姓名；加入 request generation 或 AbortController，拒絕過期的首次載入及載入更多結果。測試「快取學生 A → 深連結學生 B」及兩請求逆序完成。
4. **PostgREST schema reload**：先核對 `20260901214000` 是否已在 remote history。若已套用，新增後續 migration 或其他可重播機制發出 `NOTIFY pgrst, 'reload schema'`，並把 RPC 套用後的 Data API smoke test 寫入 migration 流程文件／skill。
5. **寫入後失效補齊**：私人課程、請假、試堂、出席紀錄、課程、課室、增退紀錄、教學紀錄、收款紀錄等已接快取的畫面，寫入成功後須真正呼叫 `invalidate`（或等價 patch）。只匯出函式不算完成。

## 驗收

- 由學生、班別、老師、排程等名單進入一筆紀錄後，數分鐘內返回即時顯示剛才所見名單，無需再等全表載入。
- 寫入成功後再返回，可見更新後的列（TTL 內亦不可繼續展示失效前的資料當最新）。
- URL 深連結（含收款紀錄 `studentId`、排程 `view=day&date=`）不會先閃上一訪資料。
- 班別管理載入不再對每班拉齊全部排程列；上課時間顯示首尾日期區間。
- `get_class_schedule_summaries` 經 PostgREST `supabase.rpc()` 可呼叫，不出現 schema cache 找不到函式。
- 功輔把編更改為「未編更」時，佔室清除與編更狀態寫入失敗不會讓畫面假裝已改。
- `npm run test`、`npm run lint`、`npm run ui:check`、`npm run build` 通過。涉及 migration 時單檔套用。

## 明確不做

- 不把功輔分頁改為父路由加 `Outlet`。
- 不統一桌面行政／外星人右側預覽與其他角色／流動裝置完整詳情的產品行為。
- 不在本題拆分 `ScheduleManagePage`。
- 不處理 `EntityListPage` 死碼或 Button loading 文件重複。
- 不把本題併入已關帳的「前端架構邊界／God files」。
- 不為清單快取引入 TanStack Query。
