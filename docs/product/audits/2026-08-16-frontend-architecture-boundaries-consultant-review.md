# 前端架構邊界計劃 — 技術顧問覆核

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-16 |
| 對象 | [`2026-08-16-frontend-architecture-boundaries.md`](../plans/2026-08-16-frontend-architecture-boundaries.md) |
| 方法 | 對讀現行程式、針對失敗路徑做靜態追蹤、執行現有品質閘、試跑建議 eslint 規則 |
| 不含 | 實作 |
| 判決 | 有條件通過。採納項已寫入計劃（2026-08-16）；本檔保留為證據，**與計劃衝突以計劃為準** |

## 結論

主方向正確：本期不應為行數硬拆三大 View；先修「失敗扮 0」同收回資料查詢，杠杆最高。C-1、C-3 的團隊取向合理，TanStack Query 亦不應成為本題前置。

不過，現方案仍有三個會令驗收「表面過、實際未守」的缺口：

1. `ScheduleManagePage.reloadStats` 只補 `catch` 無效，因為 service 未檢查三個 Supabase query 的 `error`，查詢失敗仍會 resolve 成 0。
2. `{ ok } | { error }` 只具體落到數字卡，現有 payload 無法表達漏斗、趨勢、分析、告警、CSV 等區塊的「失敗但非空」；實作者很容易繼續用 `[]`。
3. 計劃聲稱鎖 `component → service → lib`，但建議 eslint 只鎖 UI 直打 DB；現有八組 `service → component` import 可以原封不動留低。本題仍可被標 `done`，但架構邊界其實未鎖。

建議保留波次 1–2，但先按本文 P0 修訂資料契約、載入編排、eslint 邊界同測試矩陣。

> 2026-08-16 其後：採納項已寫入計劃 §4（依賴群組、排程 `.error`、eslint auth 豁免、done 收窄）。**未採納**「拆 Core／Details 當本題完工」同「十項測試當關閉閘」。與計劃衝突以計劃為準。

---

## 實測結果

### 現行品質閘

| 指令 | 結果 | 解讀 |
| --- | --- | --- |
| `npm run test` | 通過：19 files；109 passed、2 skipped | 只證明現有測試綠；未有 dashboard query failure 測試 |
| `npm run typecheck:test` | 通過 | 此閘存在，但原計劃完工線漏列 |
| `npm run build` | 通過 | 有既有 dynamic/static import 同大 chunk warning |
| `npm run lint` | 通過：0 error、43 warnings | 尚未有分層規則 |
| `npm run ui:check` | 通過 | 與本題資料失敗語意無直接覆蓋 |

`tsconfig.app.json` 排除 `*.test.ts`；所以 `build` 加 `test` 不等於測試 TypeScript 已 type-check。完工線應明列 `npm run typecheck:test`。

### eslint 規則試跑

以計劃建議的 `no-restricted-imports` 限制 `@/lib/supabaseClient` 的 `supabase` named import，現行三檔同時被截：

- `TeacherHomeView.tsx`：資料查詢，應截。
- `RollCallPage.tsx`：資料查詢，應截。
- `Layout.tsx`：只有 `supabase.auth.signOut()`，按計劃應豁免，但同樣被截。

結論：`no-restricted-imports` 不懂同一 client 上的 `.from()` 與 `.auth.*`。必須用明確 auth allowlist，或把 Auth 操作收進獨立 facade，然後在 UI／page／lib 全面禁止匯入 raw `supabase`；不能只寫「auth 除外」交由實作者猜。

---

## P0 — 開工前要改計劃

### P0-1　排程統計只改 component `catch`，仍會靜默 0

現行 `fetchScheduleStatsSnapshot` 對三個 query 用 `Promise.all`，但之後只讀：

- `todayLessons.count ?? 0`
- `pendingCancel.count ?? 0`
- `todaySchedRows.data ?? []`

完全沒有檢查三者的 `.error`。Supabase 查詢錯誤通常是 fulfilled response，不會令 `Promise.all` reject；因此 `ScheduleManagePage.reloadStats` 的 `catch` 不會執行，今日堂數／待處理取消／今日學生人數仍會顯示 0。

**修訂：**

1. 波次 2.7 改為先修 `fetchScheduleStatsSnapshot`：任一必要 query error，回 `{ error }` 或 throw 給單一 caller。
2. `ScheduleStatsSnapshot` 畫面狀態要有 `loading | ready | error`；error 時三張統計不得保留初始 0。
3. 加 fault test：三個 query 各自失敗一次，都要驗證畫面／view model 為未知，而非 0。

### P0-2　Dashboard payload 表達不到非 KPI 區塊的失敗

計劃已要求衍生數、漏斗、sparkline、`opsAlerts`、CSV 跟同一失敗契約；但現行型別仍是：

- `kpis: KpiCardModel[]`
- `revenueSeries: RevenueSeriesPoint[]`
- `funnel: FunnelStage[]`
- `withdrawalAnalysis: WithdrawalAnalysis`
- `opsAlerts: OpsAlertItem[]`
- `alerts.*: []`

只為 `KpiCardModel` 加可選失敗欄，不能分辨其餘區塊的「成功真空」與「查詢失敗」。如果實作者在 detail query 失敗時回 `[]`，卡面雖修好，漏斗、分析、告警同 CSV 仍然扮真空。

**修訂：**

在 service 組裝前先以「依賴結果」建模，而非逐張卡臨時塞 error：

```ts
type LoadResult<T> =
  | { status: "ready"; data: T }
  | { status: "error"; message: string }
```

Count 成功 0 仍是 `{ status: "ready", data: 0 }`，沒有第三個 empty 分支。Payload 至少要為以下依賴群組保留 availability：

- revenue：本期、上期、趨勢、CSV 收款列
- enrollment：本期、上期、在讀學生／人次
- trials：本期、上期、已轉化、轉化率、漏斗
- attendance：本期、上期、breakdown
- unpaid：金額、筆數、告警、明細
- withdrawals：數字、分析、最近退讀

同一依賴失敗時，所有消費者一致變 error／隱藏；不能出現「試堂卡未能載入，但漏斗顯示 0」。

另外，波次 2 不能只改 `console.warn`＋`return 0` 一族。`sumPaidAmount`、`sumUnpaidAmount`、`fetchRevenueSeries` 等現時會 throw；full 主 `Promise.all` 完成後，`fetchActiveEnrollmentCounts` 亦仍可 throw。這些路徑要在 orchestration 一併 normalize，否則一條未包住的 rejection 仍可走 View 的整頁 catch。

### P0-3　Summary／full 的單次查詢與保留成功資料，仍未有可執行設計

現況 View 先 await summary，再 await full；兩個 service 函式各自重跑本期／上期收款、報讀、退讀、試堂、轉化、在讀人次、出席等核心查詢。計劃正確指出不得再打兩次，但只寫「兩段同一契約」不足以指導改法。

如果 full 繼續回整份 payload：

- detail query 失敗可能抹掉已成功 summary；
- 為保留 summary 而吞 detail error，又會把 detail 畫成真空；
- core query 容易維持 summary＋full 重複執行。

**修訂：**

明定兩段責任：

1. `fetchMgmtDashboardCore`：核心 KPI 依賴只跑一次，先顯示。
2. `fetchMgmtDashboardDetails`：只拉分析／明細，不重跑 core。
3. View 以 generation id merge details；detail 失敗保留 core，該 detail section 顯示頁內失敗態。
4. 匯出只使用同一份已顯示 state；有 error 的依賴列留空或寫「未能載入」。

若團隊要保留現有 exported function 名稱，亦要在計劃寫清楚新舊責任及 merge 規則，避免實作者只把 `Promise.all` 換成 `allSettled`。

計劃 §4.2.8「抄出席紀錄頁契約」亦要改清楚：應只抄「失敗不扮 0＋可重試」原則，不應抄該頁「有 error 就隱藏整組統計」的 UI 行為；後者與 C-2 的部分成功策略衝突。

### P0-4　「鎖分層」驗收只鎖 DB import，沒有鎖反向依賴

現行 `src/services/**` 仍有以下反向 import：

- `mgmtDashboardQueries`／`staffPerformanceQueries` → `components/mgmtDashboard/types`
- `staffPerformanceQueries` → `components/staffPerformance/types`
- `payrollQueries`／`expenseQueries` → `components/payroll/mockData`
- `batchScheduleHelpers`／`scheduleMakeupQueries`／`teacherAvailabilityQueries` → `components/classes/classesUi`
- `mgmtGodViewQueries` → `components/home/format`

計劃 §4.1 宣稱單向 `component → service → lib`、型別跟資料走；但波次與 done 條件只要求 component／page／lib 不直打 DB。即使所有上述 import 保留，仍可關題，與計劃自己的架構承諾衝突。

**二選一修訂：**

- 若本題真係「鎖分層」：增加 eslint `src/services/**` 禁 import `@/components/**`，並把中性 type／日期／時間格 helper 搬到 `services` 或 `lib`。
- 若本期只鎖「資料存取邊界」：標題、原則與 done 條件改窄，反向 import 另開明確 backlog，避免宣稱已完成完整單向分層。

---

## P1 — 方案可做，但驗收不足

### P1-1　Dashboard 只列一個 fault test 不夠

原計劃只有「試堂 count 失敗 → 轉化率不是 0%＋正常」。至少補以下矩陣：

1. 本期值失敗、上期成功：主值 error；delta 不顯示。
2. 本期成功真 0：顯示 0，不能誤判 error。
3. 上期失敗、本期成功：主值保留；delta error／不顯示。
4. 試堂總數真 0：轉化率 N/A。
5. 試堂總數失敗：試堂卡、轉化率、漏斗一致 error。
6. 已轉化 count 失敗：同上，不可用 0%。
7. 出席第二個 chunk 失敗：整段 error，不得保留第一個 chunk 小計。
8. summary 成功、details 失敗：核心卡保留，detail 顯示失敗。
9. CSV：error 欄不得輸出 `0`；真 0 必須輸出 `0`。
10. 重新載入：上一輪成功值不得在新一輪失敗後繼續冒充最新數字。

### P1-2　現有測試 seam 未配合計劃

`mgmtDashboardQueries.test.ts` 目前只測純函式；專案亦無 Testing Library／jsdom setup。直接 mock 整條 Supabase fluent query 會脆弱，而且很難證明衍生資料一致傳播。

建議抽一個純組裝層，例如：

```ts
buildMgmtDashboardCore(results: MgmtDashboardCoreResults): MgmtDashboardCoreViewModel
```

fault matrix 主要測此純函式；另以少量 service contract test 驗證 Supabase error 被 map 成 `{ status: "error" }`。`MgmtStatCard` 可用純 formatter 測試，或另補最小 render 測試；不要把成功標準綁成一套巨型 Supabase mock。

### P1-3　`reportUserFacingError` 的現有 throttle 不等於一次載入只報一次

現有 throttle key 是 `source + message`。如果每張卡使用不同 source，或同一 timeout 產生不同 message，一次 refresh 仍可寫多條系統問題。

建議：

- UI 可按依賴群組顯示各自 error；
- 系統問題只由 dashboard 組合層每次 load 報一條，detail 列出失敗 dependency keys；
- service 不上報；
- 測試同一 load 有多個 rejection 時，reporter 只被呼叫一次。

### P1-4　RollCall 待補徽章要先清舊值

搬到 `leaveQueries` 後，state 應明確用 `number | null`（或 discriminated state）。每次 reload 開始先進 loading／unknown；失敗設 unknown。否則上一輪成功的待補數會在新一輪失敗後留在標題，仍然冒充最新結果。

### P1-5　`allSettled` 不是錯誤契約本身

如果每個 query helper 已回 `LoadResult<T>`，正常不應 reject；如果仍有 helper throw，`allSettled` 要統一 normalize。兩種錯誤通道並存會令組裝層每項都處理「fulfilled error result」及「rejected」兩次。

建議定一條規則：

- query 邊界可 throw；
- orchestration 用單一 `settle(name, promise)` 轉成 `LoadResult<T>`；
- 進入純組裝層後只接受 `LoadResult<T>`，不再 throw。

### P1-6　共用 `MgmtStatCard` 有第三個回歸面

`MgmtStatCard` 除營運總覽外，亦由職員表現及 HK 成本統計共用。計劃提到失敗欄要 optional 是正確，但 HK 成本面現時以 `kpis.every(k => k.value === 0)` 判斷 loading。若 error 卡仍塞 `value: 0`，可能誤觸 skeleton／loading。

建議 `loadState?: "ready" | "error"` 預設 ready，三個消費面都加回歸測試；不要用 `NaN` 或保留 0 作失敗 sentinel。

### P1-7　RollCall 待補 count 仍有 scope／定義決策

現行 count 是全庫、無日期及老師 scope；同時只用 `ilike("%待補%")`，比 `leaveQueries.isLeaveStatusPending` 的 pending 定義窄。計劃要求本波保持字面 query 可避免順手改規則，但應在 checklist 寫明：

- 全庫數字是否真係產品意圖，尤其老師介面；
- 本波刻意不對齊 pending enum，另開題處理；
- 未拍板前不可在「搬 service」時偷偷加老師／日期篩選。

### P1-8　TeacherHome 試堂只搬 query，失敗仍會扮真空

現行 `Promise.allSettled` 失敗後雖有頁內「部分首頁資料未能載入」，仍會 `setTrials([])`。所以 Wave 1 完成後，列表本身仍分不出「目前沒有試堂」與「試堂未能載入」。

這不必阻擋資料查詢搬家，但應列為已知 UI follow-up；否則「查詢只寫一次」完成後容易被誤當整條失敗契約已完成。

### P1-9　`enrollmentPeriod` 搬家要保留的 soft／hard error 邊界

計劃的「`!supabase`／缺列不 throw」只適用這兩種 soft-empty；現行 PostgREST error 會 throw。新 service 若把所有 DB error 都 catch 成 regular／空 periods，會令 roster、請假、待補等熱路徑將查詢失敗當常規設定。

搬家驗收要分開測：

- `!supabase`／缺列：維持 regular／空；
- PostgREST error：維持 error，不得吞成 regular；
- 六個現有 service caller 的 import 全部更新，並刪除零 caller 的 `enrollmentVisibleOnScheduleDate`。

### P1-10　Wave 4 排程搬家欠 cycle／facade／副作用清單

`insertScheduleRow` 不只 insert：亦有 audit、inbox、declaration sync，以及連堂的 skip flags。`classQueries` 已 import `scheduleQueries`；把實作搬入後若反向再 import 班別 helper，會形成 cycle。

若日後執行 Wave 4，建議獨立 PR：

1. 先抽共用 type／純 helper，避免 `scheduleQueries ↔ classQueries`；
2. 搬 implementation 後由 `classQueries` 暫時 re-export，逐步改 caller；
3. 以副作用清單做 characterisation tests；
4. 不與 `insertPaymentForStudent` 刪除綁成同一 PR。

---

## 對 C-1 至 C-4 的顧問判決

### C-1：選 A，但要改題目完工語意

同意不拆三大 View 都可關閉本期用戶傷害；但要完成 P0-4：要麼真鎖反向 import，要麼明確把本期改稱「資料存取邊界＋營運數字可信」，不要把完整前端分層標成已完成。

### C-2：選 C——按依賴群組逐區失敗

不建議純逐卡，也不建議任一失敗隱藏全頁。最佳單位是依賴群組：

- 好的群組保留；
- 壞群組的卡、衍生數、圖表、告警、CSV 一致顯示未能載入；
- 頁頂顯示「部分指標未能載入」並提供重試。

這比逐卡更能避免同源資料互相矛盾。

### C-3：選 A

本期不做 TanStack Query。當前難題是資料契約與依賴圖；換 fetch library 不會自動修正失敗扮 0。

### C-4：拆開處理

`insertPaymentForStudent` 現時無 caller，建議確認無動態引用後直接刪除，風險低；不必為它保留一個新位置。`insertScheduleRow` 等共用排程寫入則應獨立高風險搬家，不擋本期關閉，並保留代堂只改 `schedules.teacher_id` 的規則。

---

## 建議修訂後的本期 done 條件

1. UI／page／lib 不可匯入 raw Supabase data client；Auth 用明確 allowlist／facade。
2. 若仍聲稱完整單向分層：`services/**` 不可 import `components/**`；否則另開 backlog 並改窄本題名稱。
3. Dashboard core query 每次 refresh 只跑一次；details 不重跑 core。
4. 任一 dependency 失敗，其 KPI、delta、sparkline、漏斗、告警、明細、CSV 不得以 0／`[]` 冒充成功。
5. `fetchScheduleStatsSnapshot` 檢查每個 Supabase response error；失敗不顯示 0。
6. RollCall 待補失敗顯示 unknown，且不保留上一輪數字。
7. fault matrix 至少覆蓋 P1-1 十項；同一 load 的系統問題上報只一條。
8. `npm run build`、`npm run lint`、`npm run test`、`npm run typecheck:test`、`npm run ui:check` 全過。

完成以上修訂後，方案可開工；波次 3 的 island／hook 及大 View 拆分繼續不應成為本期關閉條件。
