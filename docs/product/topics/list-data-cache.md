# 清單資料快取（卸載後返回）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | 清單與獨立詳情／分頁分成不同路由時的記憶體 TTL 快取；班別列表摘要 RPC；寫入後失效；深連結優先於快取 |
| 不含 | 收件匣、進行點名、收款登記、各類報表、家長報讀申請等須即時的工作佇列；計糧／營運總覽快取（見 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md)）；拆分 `ScheduleManagePage`（見 [`schedule-manage-page-refactor.md`](./schedule-manage-page-refactor.md)）；功輔改父路由加 `Outlet`；角色／裝置詳情分流 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 工程位置 | 主線已合入 PR #82；收尾於 `feat/list-data-cache-closeout` |
| 立案 | 2026-09-02：效能工程已有程式，補產品分題並收尾四項缺口 |
| 關帳 | 2026-09-02：共用 helper、功輔寫庫、收款深連結、PostgREST reload、寫入後失效 |

## 一句

清單離開詳情或分頁再返回時，數分鐘內應即時顯示剛才所見的列，不得整表重抓；URL 深連結永遠優先於快取，寫入成功後必須失效。

## 開工閘

- 對上一個工程不擋路。本題進行中時，[`schedule-manage-page-refactor.md`](./schedule-manage-page-refactor.md) **只立項，不實作**。
- `20260901214000_class_schedule_summaries_rpc.sql` 已在 remote history，不得修改該檔。PostgREST reload 見 `20260902090000_reload_postgrest_class_schedule_summaries.sql`。

## 產品規則

1. **何時必須接快取**：清單與詳情、新增頁或分頁是不同路由，離開會卸載 React 樹。篩選可繼續用 `sessionStorage`；已載入的列必須用模組級記憶體快取。
2. **TTL**：預設 5 分鐘（`LIST_DATA_CACHE_TTL_MS`）。新鮮且鍵相符則不打網路；有舊列則先畫，過期則靜默重抓。
3. **快取鍵**：必須包含會改變查詢結果的範圍（學年、日期、老師 scope、學生 ID、角色等）。鍵不符則不得 hydrate 舊列。
4. **失效**：清單或詳情／寫入頁成功後 `invalidate`（保留列以便返回即時顯示，下次進頁靜默重抓）。不可只靠 TTL 過期。
5. **深連結優先**：有效 URL 參數永遠優先於快取。初始 render 必須已用 URL 建立 canonical 快取鍵；不可先畫上一訪資料再靠 effect 修正。
6. **禁止**用 `location.key` 當重載條件。
7. **空列**：`isUsable` 預設要求已有列；空結果不當新鮮快取。

實作入口：`createListDataCache`（`src/lib/listDataCache.ts`）。規範：`AGENTS.md` 鐵則「清單快取」、`.cursor/rules/list-data-cache.mdc`、`docs/meta/UI_DESIGN_INSTRUCTIONS.md` §16.5。

## 適用頁面

| 畫面 | 路由 | 快取鍵 | 寫入後失效 |
| --- | --- | --- | --- |
| 學生管理 | `/Students` ↔ `/Students/:studentId` | `isActiveScope`、`showGraduated` | 學生詳情、班別加／退報讀 |
| 班別管理 | `/Classes` ↔ `/Classes/:classId`、`/Classes/New` | `includeOlderYears` | 新增班、班別詳情寫入；`createListDataCache` |
| 老師管理 | `/Teachers` ↔ `/Teachers/:teacherId` | 無額外範圍 | 老師詳情寫入 |
| 排程管理 | `/Schedule` ↔ `/Schedule/:scheduleId` | `teacherScopeId`、`displayStart`、`rangeEnd` | 排程詳情寫入；日期裁決見下節 |
| 私人課程 | `/PrivateTutoring` | `teacherTid` | `reloadStudents` 非靜默時 `invalidate` |
| 功課輔導班 | `/HomeworkTutoring`、`/HomeworkTutoring/:page` | `role` | `patch`；編更改走 `persistMonthRosterStatus` |
| 收款紀錄 | `/PaymentHistory` | 狀態、日期、搜尋、`filterStudentId`、`includeOlderYears` | 標記已收款、作廢；收款登記出單後亦失效 |
| 增退紀錄 | `/EnrollmentChanges` | 動作、日期、搜尋、`includeOlderYears` | 學生／班別加退報讀、改報讀狀態 |
| 試堂紀錄 | `/TrialSessions` | `includeOlderYears` | `reload` 非靜默時 `invalidate` |
| 請假管理 | `/LeaveManagement` | `includeOlderYears` | `reload` 非靜默時 `invalidate` |
| 出席紀錄 | `/AttendanceRecords` | `from`、`to` | 刪除出席 |
| 教學紀錄 | `/TeachingRecords` | `from`、`to`、`teacherTid` | `TeachingNotesEditor` 儲存 |
| 課程管理 | `/Courses` | 無額外範圍 | 新增／更新課程 |
| 課室管理 | `/Classrooms` | 課室列表無額外範圍；週次排程另核 `selectedRoomId`＋週起迄 | 新增排程 |

班別列表走 `get_class_schedule_summaries`；桌面班別名單用 `StickyListShell` 固定頂列。更新日志為 `SU-20260902-03`～`05`。

## 排除頁面（不要套 TTL 快取）

須看到最新列的工作佇列與報表，離開再回來應重抓：

- 收件匣 `/Inbox`
- 進行點名 `/Attendance`
- 收款登記 `/Payments`（本身不套 TTL；出單成功會失效收款紀錄快取）
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

**收款紀錄**

`?studentId=` 在初始 render 納入 canonical key（`resolvePaymentHistoryHydration`）。鍵不符不 hydrate。載入與載入更多以 request generation 拒絕過期結果。

## 班別摘要 RPC

`supabase/migrations/20260901214000_class_schedule_summaries_rpc.sql` 新增 `get_class_schedule_summaries(uuid[])`。職員全範圍；老師僅自己班。前端 `fetchScheduleSummariesByClassIds` 走 `supabase.rpc()`。

PostgREST reload：`20260902090000_reload_postgrest_class_schedule_summaries.sql`（`NOTIFY pgrst`）。Data API smoke test 見 [`SUPABASE_MIGRATION_APPLY.md`](../../meta/SUPABASE_MIGRATION_APPLY.md)。

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
