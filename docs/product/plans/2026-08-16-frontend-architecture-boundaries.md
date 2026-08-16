# 前端架構邊界 — 計劃（含第一性審核）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-16 |
| 狀態 | 方案已審；**未開工** |
| 讀者 | 實作 agent ＋ 外部顧問（本檔自洽；唔使先讀完技術債全文） |
| 分題 | [`frontend-architecture-boundaries.md`](../topics/frontend-architecture-boundaries.md) |
| 來源稽核 | [`2026-08-14-tech-debt-review.md`](../audits/2026-08-14-tech-debt-review.md)（P1-2、P2-5） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 性質 | 工程邊界／錯誤語意；**不改**學費、報讀、點名等營運規則 |

本檔要回答：點解有呢題、依家傷喺邊、原方案有咩問題、改善後做咩、點先算完。顧問可只讀本檔；細節證據喺分題。

---

## 0. 一句給顧問

明學行政後台已有「畫面唔准直打資料庫」嘅分層約定，但未守；少數超大檔把畫面、規則、查詢、錯誤處理綁死。最危險嘅用戶可見後果唔係「檔案太大」，而係 **查詢失敗被畫成「今日零」**——管理層首頁會當無事。

原方案把「拆 God files」同「修靜默 0」捆成四波重構。第一性審核後：**先鎖分層＋修 KPI 謊言（本期可關閉）；拆畫面只喺切片能自己擁有狀態、或第二個畫面已共用時先做。** 唔為行數搬家。

---

## 1. 前因

### 1.1 產品同技術約束

明學教育（MainHope）行政後台：Vite + React 18 + TypeScript，資料走 Supabase。開發以 agent 為主，約定寫喺 `AGENTS.md`：

| 層 | 職責 | 資料流 |
| --- | --- | --- |
| `src/pages/` | 薄路由 | ↓ |
| `src/components/<領域>/` | 畫面與領域邏輯 | ↓ |
| `src/services/` | **所有** `supabase.from(...)`，map 成具名型別 | ↓ |
| `src/lib/` | 純工具；不含 React、不含 DB | |

即：**component → service → lib**。Component 不直接打 DB。

錯誤呈現已有產品契約（[`UI_DESIGN_INSTRUCTIONS.md`](../../meta/UI_DESIGN_INSTRUCTIONS.md) §1）：操作／載入失敗必須喺**該頁或 Dialog 內**出紅色區塊（`role="alert"`），並經 `reportUserFacingError` 寫入外星人「報錯與問題」。頂欄 `pushBanner` 2 秒即消失，**唔係**載入失敗通道。

UI 原子（`Select`、`Tag`、日期框）同收款入口（只連 `/Payments`）已要求重用、禁止另寫。**沒有**「每個業務 tab 都要抽成全域積木」嘅規定。

同期仍有權限硬化（P0-1）、2627 學年 live、流動介面等，會同本主題搶同一批大檔。方案必須可分段關閉，唔好開一場「拆晒先算完」嘅重構。

### 1.2 點解會變成 backlog 一題

2026-08-14 全盤技術債檢視把兩項列為高優先、並合併：

| 原 ID | 當時一句 |
| --- | --- |
| P1-2 | God files：`StudentDetailView` 3,143／`ClassDetailView` 3,060／`ScheduleManagePage` 2,936 行 |
| P2-5 | `TeacherHomeView` 直打 `trial_sessions`；dashboard 錯誤當 0 |

合併理由（當時）：畫面、規則、查詢、錯誤處理集中喺少數超大檔，先堆、再吞錯誤。分開睇會以為「只係檔案太大」。

2026-08-16 對代碼再盤：行數幾乎無變；補咗證據——`lib/enrollmentPeriod.ts` 夾查詢、service 反向 import `components/`、`RollCallPage` 亦直打待補 count、營運總覽至少 10 處 `console.warn` 後 `return 0`。學生詳情其實**已按 tab 懶載**（`reloadCore`／`ensureTabData`），資料邊界在、JSX／state 未搬走。

產品曾踩過同一類謊言：出席紀錄列表 timeout 後把列清空，KPI 全 0，前線以為無人點名。已修（[`attendance-records-range-query.md`](../topics/attendance-records-range-query.md)）。**營運總覽未跟同一契約。**

### 1.3 本計劃相對分題

分題仍係日常索引（現況表、檔案名單）。本計劃＝給顧問同開工前嘅**因果＋定案**。兩者衝突以本計劃為準（2026-08-16 審核後）。

---

## 2. 問題（要解嘅三件事）

行數係代理指標。真正工作有三件，傷害唔同級：

| 工作 | 傷害 | 用戶睇唔睇到 |
| --- | --- | --- |
| **觀察失敗 ≠ 零** | 管理層首頁（`/MgmtDashboard`）單一 KPI 查詢失敗只 `console.warn`，卡面寫 `0`＋「正常」 | 直接。當日當無事、對帳／轉化率會錯。呢類 bug 唔會紅。 |
| **查詢只寫一次** | 老師首頁試堂 join 寫喺畫面；試堂管理頁用 `trialQueries`。點名頁待補 `ilike("%待補%")` 唔經 leave service | 間接。欄位／狀態一改只修一邊。 |
| **變更可隔離** | 學生詳情 69 個 `useState`、一次 import 報讀／繳費／點名／請假。`studentQueries` 約 23 個檔引用、`classQueries` 約 40 個。高風險畫面幾乎無測試 | 開發稅。每個產品 PR 喺同一座山打洞。 |

量度（2026-08-16，不含測試檔）：

| 檔 | 行 | 備註 |
| --- | --- | --- |
| `StudentDetailView.tsx` | 3,143 | 7 tab；已懶載 |
| `ClassDetailView.tsx` | 3,060 | 4 tab |
| `ScheduleManagePage.tsx` | 2,936 | 日視圖 grid 已抽出，編排仍在父檔 |
| `PaymentsPageView.tsx` | 2,088 | 一條收款精靈 |
| `studentQueries.ts` | 2,024 | 學生 CRUD **兼** insert 付款／拉出席／請假 |
| `classQueries.ts` | 1,930 | 班 **兼** 排程 CRUD，同 `scheduleQueries` 重疊 |
| `mgmtDashboardQueries.ts` | 1,555 | 靜默 0 主戰場 |

分層洩漏（資料查詢，唔計 `auth.signOut`）：

- `TeacherHomeView` → `trial_sessions`
- `RollCallPage` → `leave_makeup_records` count；失敗當無待補
- `lib/enrollmentPeriod.ts` 三條 fetch（`lib` 應純工具，卻被 services 廣泛 import）

**真 0、真空、失敗**（用語，避免顧問同原方案三態混淆）：

| 狀態 | 意思 | 畫面應顯示 |
| --- | --- | --- |
| 真 0 | count／金額查詢**成功**，值係 0 | `0`／`HK$ 0`（可信營運事實） |
| 真空 | 列表查詢**成功**，0 列 | 空狀態文案，例如「目前沒有請假」 |
| 失敗 | 查詢**沒成功** | 頁內紅字「資料未能載入」；數字卡「—」。**永遠唔好畫成 0** |

真 0 同真空都係成功而空。依家嘅 bug 係把失敗畫成佢哋。

---

## 3. 第一性原則審核

審核問題：原四波（清違規 → KPI 語意 → 按 tab 拆 JSX → 按 bounded context 拆 service）係咪最佳解？有冇更複雜但更好嘅方案？

錨點：減少謊言、減少重複查詢、令變更可隔離。**唔係**把檔案縮到 N 行。

### 3.1 原方案逐波

| 波次 | 原內容 | 判決 |
| --- | --- | --- |
| 1 邊界違規 | 試堂／待補／`enrollmentPeriod` 收回 service | **留。** 對得住「一個出口」。欠 eslint 鎖層——依家 eslint 無 import 邊界，`AGENTS.md` 擋唔住再漏。 |
| 2 錯誤語意 | 營運總覽 KPI 失敗唔當 0 | **留，且可單獨驗收。** 唯一直接對用戶講大話嘅項；獨立於 God files。原 `LoadResult` 把 empty 做成第三變體，對 count 係多餘（成功而 0 就係真 0）。 |
| 3 拆畫面 | 按 tab 抽 `ClassScheduleTab` 等 | **改。** 學生詳情已懶載；抽出 JSX 而 69 個 `useState` 仍喺父檔＝prop drilling，測試仍要 mock 一堆 props，往往更差。隔離單位係 **island**（自己載入／失敗／寫入，父檔唔知內情），唔係檔案行數。 |
| 4 拆 service | 按域切 2,000 行 query 檔 | **收窄。** `insertPaymentForStudent` 住學生檔＝寫入聚合根錯位，應該搬。唔好因為 2,000 行就切。畫面用嘅讀側組裝可以留 facade。 |

### 3.2 點解「按 tab 拆 JSX」唔係最佳解

React hooks 規則令共享 `reloadSubs` 嘅 state 傾向留喺同一函式。把 `ClassScheduleTab` 抽出、props 傳晒落去，行數下降、耦合不變。

可成為 island 嘅：請假紀錄、更動紀錄、上課紀錄（讀）。**唔好硬切嘅：** 報讀 tab 同繳費、待補、班選項共享 `enrollments`；收款頁係一條精靈（選學生 → 行 → 優惠 → 罰款 → 出單），唔係四塊積木。

專案已有正確嘅抽出先例：`CancelReasonDialog`、`VoidPaymentDialog`、`RollCallSheet`——因為**第二個畫面已經做同一件事**。呢個先係重用；唔係先抽再盼共用。

### 3.3 更複雜方案：依家做唔做

| 方案 | 對三件工作 | 依家做？ |
| --- | --- | --- |
| TanStack Query | 錯誤／loading 變一等公民；God file 會瘦（刪大量 `useEffect`）。七十幾處 fetch、invalidation 紀律。同「計糧／總覽慢」（P2-2）重疊 | **唔好當本主題載具。** 可選只喺營運總覽 spike。全站遷移另開題。 |
| Feature-sliced 目錄 | 長線變更面更清。同已寫死嘅 `components/<領域>` 對撞；agent 驅動下搬家 PR 衝突大 | **否** |
| eslint import 邊界 | 鎖死 component→service→lib | **要。** 併入波次 1。複雜度低、比希望跟文件有效。 |
| 先抽 hook，後抽 JSX | `useStudentLeaveTab` 可單測；畫面可暫留 | **要。** 取代「按 tab 切 JSX」做波次 3 預設手法 |
| XState／頁級 reducer | 報讀＋收款係資料耦合，唔係狀態機複雜 | **否** |
| 只做 1–2，God files 擱置 | 謊言同重複查詢清咗；開發稅仍在 | **可接受為本期完工定義**。God file 等下一個真要改嗰座山嘅產品 PR 再抽 island |

### 3.4 審核結論

1. P1-2 同 P2-5 可留同一主題（同一「吞錯誤、堆大檔」文化），但**驗收唔好綁死「View 已拆」**。
2. 本期最佳解＝鎖分層＋修 KPI 謊言＋只搬寫入錯位。拆 JSX 唔係杠杆。
3. 更重嘅架構（React Query、目錄切片）長線可能更好，依家做會貴過收益，而且同 P0／學年工作搶人手。

---

## 4. 改善後方案（定案）

### 4.1 原則

1. **先守邊界，再考慮搬家。** 直打 DB、`lib` 查詢、KPI 失敗語意，唔使拆 3,000 行 View。
2. **抽檔合格線（三揀一，否則唔抽）：** 切片擁有自己嘅載入／錯誤／寫入；**或**第二個畫面已做同一件事；**或**抽出嚟嘅 hook／純函式有失敗＋空＋成功測試。父檔 3,000 行但邏輯喺可測 hook，已經達標。
3. **重用跟現有指引：** UI 原子同收款入口必須重用。業務區塊得第二消費者先共用 JSX。禁止為「將來可能共用」抽通用 `LeaveBlock`。
4. **錯誤走頁內紅字**（現有 §1），唔用 2 秒 banner。Count：`{ ok: number } | { error: string }`；列表：`{ ok: T[] } | { error }`，`ok.length === 0` 即真空。唔做第三個 `empty` 變體。
5. **單向依賴** component → service → lib，用 eslint 鎖。型別跟資料走。
6. **寫入一個聚合根一個出口。** 學生檔不准 insert payment；班檔唔兼排程 CRUD。讀側 facade 可以為畫面組。
7. 路由、tab、深連結、角色可見性、寫入確認行為不變。

### 4.2 波次

**波次 1 — 鎖分層（細、可驗）**

1. `TeacherHomeView` 試堂 → `trialQueries`（具名型別）；component 唔再 import `supabase`／`forEachIdChunk`。
2. `RollCallPage` 待補 count → `leaveQueries`；失敗走 `setErr`／未知，唔當 0。
3. `enrollmentPeriod.ts` 三條 fetch → 新 service；`lib` 只留純函式。
4. **eslint**（`no-restricted-imports` 或等價）：`src/components/**`、`src/pages/**`、`src/lib/**` 禁止資料面 `supabase.from`／`supabase.rpc`（`auth.*` 除外）。呢條先係回歸閘。

**波次 2 — 營運數字可信（可單獨關閉本題嘅用戶傷害）**

1. `mgmtDashboardQueries` 所有 `console.warn`＋`return 0` 改為該 KPI `{ error }`；組合用 `allSettled`。
2. `KpiCardModel` 支援無法載入；`MgmtStatCard` 顯示「—」／「資料未能載入」，唔格式化 `HK$ 0`。整頁 catch **唔好**用全 0 嘅 `emptyPayload` 當後備。
3. 測試：mock 試堂 count 失敗 → 轉化率卡不是 `0%`＋「正常」。
4. `ScheduleManagePage.reloadStats` 失敗要頁內提示，唔 `ignore`。
5. 抄出席紀錄頁契約：失敗隱藏誤導 KPI＋可重試。

**波次 3 — 只抽合格 island／hook（機會主義，唔開重構專案）**

預設手法：先 `useXxxTab`（可單測），JSX 可留。搬 JSX 只當合格線滿足。

優先（有產品 PR 先順手，否則可擱）：

- 學生詳情：請假／更動／出席讀（易成 island）
- 已有第二消費者：繼續用 Dialog／Sheet，唔再抽一份
- **不做：** 為行數抽 `ClassScheduleTab`、把收款精靈切四塊、抽學生請假做成通用 LeaveBlock

**波次 4 — 只搬寫入錯位（唔按行數切 service）**

- `insertPaymentForStudent`／學生檔內付款寫入 → `paymentQueries`
- 班檔內排程 CRUD／detail context → `scheduleQueries`（或 `classScheduleQueries`）；班檔留班＋名單
- 時間格 helper 從 `classesUi` 遷 `lib/`，打斷 service → component
- dashboard 組裝可留；count／sum 失敗語意跟波次 2，唔為瘦檔而下放

### 4.3 本期完工線 vs 後續

**本期可關閉（建議本題 `done` 條件）：**

- eslint 鎖層；component／pages／lib 無資料面 `supabase.from`／`rpc`（auth 除外）
- `/MgmtDashboard` 上列關鍵 KPI 任一失敗：唔顯示 0 當正常；頁內可讀「資料未能載入」
- 原路由／操作行為不變；`build`／`lint`／`test`／`ui:check` 過

**明確留後續（唔擋關閉）：**

- 按 tab 切大 View 嘅 JSX
- TanStack Query、feature-sliced 目錄
- 清 `api/entities.ts`（死碼題）
- 計糧／總覽變快（P2-2）
- generated Database types（P1-3）

---

## 5. 明確唔做

- 唔為行數切 `part1`／`part2`
- 唔等 generated types 先做波次 1–2
- 唔把本主題做效能或權限專案
- 唔引入 React Query／狀態機作為本計劃載具
- 唔改學費、報讀、點名等營運規則（無政策／2627 同步）

---

## 6. 請顧問挑戰（Agree／Disagree／改寫）

團隊暫見如下；請逐項表態。優先級：C-1、C-2 影響本期範圍。

### C-1 本期可否喺唔拆三大 View 之下關閉？

團隊：可以。用戶傷害喺謊言同重複查詢，唔喺行數。

| 選項 | 含義 |
| --- | --- |
| A | 同意本期完工線（鎖層＋KPI）；God file 機會主義 |
| B | 必須至少拆一個高變更 View（請指明邊個）先可關閉 |
| C | 其他 |

### C-2 營運總覽失敗：逐卡「—」vs 整頁紅字隱藏全部 KPI？

出席紀錄頁係後者。總覽卡多、部分失敗常見。團隊傾向**逐卡「—」＋頁頂一句「部分指標未能載入」**，避免一張表 timeout 抹掉全部可信卡。

| 選項 | 含義 |
| --- | --- |
| A | 逐卡「—」（現方案） |
| B | 任一關鍵 KPI 失敗就隱藏成組 KPI |
| C | 其他 |

### C-3 應否用營運總覽做 TanStack Query spike？

團隊：唔納入本期。若顧問認為錯誤語意同快取應一次過，先開獨立題，唔綁本計劃關閉。

| 選項 | 含義 |
| --- | --- |
| A | 本期唔做 Query |
| B | 總覽允許小 spike，失敗可棄，唔擋關閉 |
| C | 應改以 Query 做波次 2 載具 |

### C-4 寫入錯位（學生檔 insert payment）係本期還是等產品 PR？

團隊：波次 4 可跟產品 PR 順手；**唔擋**本期關閉。若顧問認為聚合根錯位同靜默 0 同級，再升為完工條件。

---

## 7. 開工時讀邊

1. 本計劃 §4（定案）
2. 分題證據表（檔案／函式名單）
3. [`UI_DESIGN_INSTRUCTIONS.md`](../../meta/UI_DESIGN_INSTRUCTIONS.md) §1（紅字、唔用 banner 頂替）
4. 出席紀錄失敗契約（抄，唔發明）

實作前唔使再做盤點，除非 git 上三大 View 行數已明顯下降。
