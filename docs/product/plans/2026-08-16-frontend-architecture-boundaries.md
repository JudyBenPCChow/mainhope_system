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

分題仍係日常索引（現況表、檔案名單）。本計劃＝開工前嘅**因果＋定案**。兩者衝突以本計劃為準（2026-08-16 審核＋顧問覆核後）。同日對抗同顧問覆核已併入 §4；唔使再讀一遍除非要證據。

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
| 1 邊界違規 | 試堂／待補／`enrollmentPeriod` 收回 service | **留。** 對得住「一個出口」。欠 eslint 鎖資料 client——依家 eslint 無 import 邊界，`AGENTS.md` 擋唔住再漏。Auth 要明確豁免。 |
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
| eslint import 邊界 | 鎖死 UI／page／lib 直打 DB | **要。** 併入波次 1。Auth 用 allowlist／facade。service→component 反向 import 本期唔鎖 |
| 先抽 hook，後抽 JSX | `useStudentLeaveTab` 可單測；畫面可暫留 | **要。** 取代「按 tab 切 JSX」做波次 3 預設手法 |
| XState／頁級 reducer | 報讀＋收款係資料耦合，唔係狀態機複雜 | **否** |
| 只做 1–2，God files 擱置 | 謊言同重複查詢清咗；開發稅仍在 | **可接受為本期完工定義**。God file 等下一個真要改嗰座山嘅產品 PR 再抽 island。完整單向分層（反向 import）同樣擱置 |

### 3.4 審核結論

1. P1-2 同 P2-5 可留同一主題（同一「吞錯誤、堆大檔」文化），但**驗收唔好綁死「View 已拆」**。
2. 本期最佳解＝收回直打 DB＋修 KPI 謊言。拆 JSX 唔係杠杆。寫入錯位（波次 4）唔擋關閉。
3. 更重嘅架構（React Query、目錄切片、service→component 反向 import 清乾）長線可能更好，依家做會貴過收益，而且同 P0／學年工作搶人手。
4. 顧問覆核（同日）確認 C-1／C-3；C-2 改為按依賴群組失敗；eslint「auth 除外」同排程統計 `catch` 係字面實作陷阱——已寫入 §4。

---

## 4. 改善後方案（定案）

### 4.1 原則

1. **先守資料存取邊界，再考慮搬家。** 直打 DB、`lib` 查詢、KPI 失敗語意，唔使拆 3,000 行 View。本期鎖嘅係「邊個准打表」，唔係完整單向分層。
2. **抽檔合格線（三揀一，否則唔抽）：** 切片擁有自己嘅載入／錯誤／寫入；**或**第二個畫面已做同一件事；**或**抽出嚟嘅 hook／純函式有失敗＋空＋成功測試。父檔 3,000 行但邏輯喺可測 hook，已經達標。
3. **重用跟現有指引：** UI 原子同收款入口必須重用。業務區塊得第二消費者先共用 JSX。禁止為「將來可能共用」抽通用 `LeaveBlock`。
4. **錯誤走頁內紅字**（現有 §1），唔用 2 秒 banner。Count：`{ ok: number } | { error: string }`；列表：`{ ok: T[] } | { error }`，`ok.length === 0` 即真空。唔做第三個 `empty` 變體。失敗單位係**依賴群組**（同源 count／sum 一齊失敗），唔係逐張卡各自「—」，亦唔係任一失敗隱藏全頁。
5. **eslint 鎖資料 client。** `src/components/**`、`src/pages/**`、`src/lib/**` 禁止匯入 raw Supabase 再 `.from`／`.rpc`。Auth 用明確 allowlist 或獨立 facade——`no-restricted-imports` 唔識分 `.from()` 同 `.auth.*`，唔好寫「auth 除外」交實作者猜。service → component 反向 import **本期唔清、唔擋關閉**（另開題）。
6. **寫入一個聚合根一個出口。** 學生檔不准 insert payment；班檔唔兼排程 CRUD。讀側 facade 可以為畫面組。波次 4 唔擋本期關閉。
7. 路由、tab、深連結、角色可見性、寫入確認行為不變。

### 4.2 波次

**波次 1 — 資料存取邊界（細、可驗）**

1. `TeacherHomeView` 試堂 → `trialQueries` **新瘦函式**（例如 `fetchUpcomingTrialsForClassIds`）：select／`trial_date >= today`／按老師 `class_id` chunk 同而家字面一致。**禁止** reuse `fetchTrialsWithRelations`（該函含 `payments!payment_id` embed；老師 JWT／P0-1 RLS 下一整欄試堂會常紅）。component 唔再 import `supabase`／`forEachIdChunk`。同一 PR 刪 inline，唔留雙路徑。搬家**唔等於**失敗契約已完：現行 `allSettled` 失敗仍 `setTrials([])`，列表分唔出「目前沒有試堂」同「試堂未能載入」。本波可維持頁頂「部分首頁資料未能載入」；列表未知態列已知 follow-up，唔擋波次 1 關閉。
2. `RollCallPage` 待補 count → `leaveQueries`。徽章 state 用 `number | null`（或 discriminated）；**每次 reload 開始先 unknown**，失敗保持 unknown，**禁止**留下一輪成功數字。失敗＝標題徽章未知態（唔顯示數字），**唔好**寫入頁級 `err`（該 `err` 而家＝排程列表載入失敗；共用會令老師以為「進行點名」壞咗）。status 字串本波維持 `ilike("%待補%")`，對齊 `"待補課"` 枚舉另開。**禁止**順手加老師／日期篩選（而家係全庫 count；改 scope 係產品決策，唔係搬家）。
3. `enrollmentPeriod.ts` 三條 fetch → 新 service；`lib` 只留純函式。一併搬走或刪死碼 `enrollmentVisibleOnScheduleDate`（async、打 DB、無 caller）。軟／硬錯誤分開：**`!supabase`／缺列 → regular 空 config（唔 throw）**；**PostgREST／query `.error` 維持 error，禁止 catch 成 regular**（否則 roster／請假／待補熱路徑會把查詢失敗當常規設定）。**唔 import** `classQueries`／`studentQueries`（環狀 → 運行時 undefined）。六個現有 service caller 的 import 全部更新。
4. **eslint：** UI／page／lib 不可匯入 raw Supabase **資料** client。Auth 必須有明確 allowlist 或獨立 facade（`Layout`／`MobileLayout` 等而家 `supabase.auth.signOut`）。試跑確認 `TeacherHomeView`／`RollCallPage` 被截、純 auth 檔唔誤傷。呢條先係回歸閘。**唔**加 `src/services/**` 禁 `@/components/**`（反向 import 另題）。

**波次 2 — 營運數字可信（可單獨關閉本題嘅用戶傷害）**

失敗單位＝**依賴群組**。同一群組內嘅卡、delta、sparkline、漏斗、告警、明細、CSV 要一致：好嘅群組保留；壞嘅群組全部「未能載入」，唔好出現「試堂卡紅、漏斗仍 0」。頁頂一句「部分指標未能載入」＋可重試。**唔抄**出席紀錄頁「有 error 就隱藏整組統計」嘅 UI（該頁係後者；總覽選部分成功）。只抄「失敗不扮 0＋可重試」。

建議群組（組裝前以依賴結果建模，唔好逐張卡臨時塞 error）：

| 群組 | 一齊成敗 |
| --- | --- |
| revenue | 本期、上期、趨勢、CSV 收款列 |
| enrollment | 本期、上期、在讀學生／人次 |
| trials | 本期、上期、已轉化、轉化率、漏斗 |
| attendance | 本期、上期、breakdown |
| unpaid | 金額、筆數、告警、明細 |
| withdrawals | 數字、分析、最近退讀 |

型別：每組 `{ ok: T } | { error: string }`。Count 成功 0 仍係 `{ ok: 0 }`。`MgmtDashboardPayload` 而家 `funnel`／`revenueSeries`／`opsAlerts`／`withdrawalAnalysis` 係普通陣列——**只為 `KpiCardModel` 加可選失敗欄不夠**；實作者會繼續用 `[]` 扮真空。

1. `mgmtDashboardQueries` 所有 `console.warn`＋`return 0` **以及**而家會 throw 嘅路徑（`sumPaidAmount`、`sumUnpaidAmount`、`fetchRevenueSeries`、`fetchActiveEnrollmentCounts` 等）喺 orchestration 一併 normalize 成 `{ ok } | { error }`。**禁止**把吞 0 改成內層 `throw` 再靠 View catch（`sumPaidAmount` 而家已經 throw；內層再 throw 會令 View catch 一條 timeout 抹掉全部已成功卡——比依家更假）。`allSettled` 唔係契約本身：query 邊界可以 throw；orchestration 用單一 `settle(name, promise)` 轉成 `{ ok } | { error }`；進入純組裝層後只接受結果型，不再 throw。
2. `KpiCardModel`／區塊支援無法載入；`MgmtStatCard` 顯示「—」／「資料未能載入」，唔格式化 `HK$ 0`。失敗用明確 `loadState?: "ready" | "error"`（預設 ready），**禁止**用 `NaN` 或保留 `value: 0` 做 sentinel——HK 成本統計而家用 `kpis.every(k => k.value === 0)` 判斷 loading，塞 0 會誤觸 skeleton。整頁 catch **唔好**用全 0 嘅 `emptyPayload` 當後備。整次網絡死先用頁級錯誤。`MgmtStatCard` 亦畀職員表現、HK 成本統計用；未列入本題驗收嘅兩頁行為要不變，或同一 PR 改齊。
3. 衍生數跟同一依賴群組，唔好只修大卡：轉化（真 0 堂試堂＝N/A；count **失敗**＝未能載入；有試堂而 0%＝真 0%）、`deltaPct`／漏斗／sparkline／`opsAlerts`。任一輸入 `{ error }` → 該群組 error，**禁止**把 error 當 0 再除（上期失敗當 0 → 環比暴升；欠費 count 失敗當 0 → 告警假綠）。`countAttendanceVisits` 而家 error 就 `break`、已累積 chunk 當全月——改成整段 error 或標不完整，唔好冒充全月。
4. `fetchMgmtDashboardSummary` 同 `fetchMgmtDashboard` **merge 規則**（可保留現有函式名；**本題唔拆**成 Core／Details 效能重構，嗰個屬 P2-2）：
   - 兩段同一 `{ ok } | { error }` 契約。
   - View 已顯示嘅成功群組，full 抵達時**禁止**用空陣列／全 0／整份 `emptyPayload` 覆蓋。
   - detail／分析群組失敗：該 section 顯示頁內失敗態；core 群組保留。
   - **禁止加劇** round trip（count 唔好 summary＋full 各打一次）。去重／「核心 query 只跑一次」仍屬 P2-2，唔擋本題關閉。
5. `exportMgmtDashboardCsv` 只使用同一份已顯示 state。失敗列寫空或「未能載入」，**禁止輸出 0**（卡面修咗、表未修＝WhatsApp 仍傳假零）。真 0 必須輸出 `0`。
6. 測試（最低矩陣；唔使巨型 Supabase mock。優先測純組裝／formatter）：
   - 試堂 count 失敗 → 轉化率卡不是 `0%`＋「正常」；漏斗同組 error。
   - 本期真 0：顯示 `0`，不能誤判 error。
   - 上期失敗、本期成功：主值保留；delta 不顯示（唔好當 0 再除）。
   - CSV：error 欄不得輸出 `0`；真 0 必須輸出 `0`。
   - `fetchScheduleStatsSnapshot` 任一必要 query `.error` → 三張統計未知，不是 0。
   - 重新載入：上一輪成功值不得在新一輪失敗後繼續冒充最新數字（總覽或待補徽章至少一處）。
7. **排程統計先修 service。** `fetchScheduleStatsSnapshot` 對三個 query 而家只讀 `count ?? 0`／`data ?? []`，**唔睇 `.error`**。Supabase 失敗通常 fulfilled，`ScheduleManagePage.reloadStats` 的 `catch { /* ignore */ }` **永遠唔跑**。改法：任一必要 query error → `{ error }`（或 throw 給單一已檢查 caller）；畫面 `loading | ready | error`；error 時三張統計不得保留初始 0。只加 component `catch` 唔算完成。
8. `reportUserFacingError` 組合層**每次 load 最多一條**（現有 throttle key 係 `source + message`；每卡不同 source 仍會灌爆）。service 不上報。UI 可按群組顯示各自紅字。
9. 波次 2 只加載入契約，唔為而家每張卡做精美空態。產品 KPI 規格 1–7（收學費堂數／試堂／免費／消堂）尚未落地，精美空態會跟住作廢。

**波次 3 — 只抽合格 island／hook（機會主義，唔開重構專案）**

預設手法：先 `useXxxTab`（可單測），JSX 可留。搬 JSX 只當合格線滿足。

優先（有產品 PR 先順手，否則可擱）：

- 學生詳情：請假／更動／出席讀（易成 island）
- 已有第二消費者：繼續用 Dialog／Sheet，唔再抽一份
- **不做：** 為行數抽 `ClassScheduleTab`、把收款精靈切四塊、抽學生請假做成通用 LeaveBlock
- 若抽 island：`canViewMoney`／`canMutateLeave`／`unsavedLeave`／`?tab=` 留父層經 props 落去。P0-2 前拆詳情 tab，權限 PR 要改 N 檔——宜等角色真源穩定，或接受爆炸半徑

**波次 4 — 只搬寫入錯位（唔按行數切 service；唔擋本期關閉）**

- `insertPaymentForStudent` **無畫面 caller**。確認無動態引用後**直接刪**；唔搬去 `paymentQueries`、**唔好**接到學生詳情「新增繳費」（會繞過 `/Payments` 優惠／罰款／權益）。
- 班檔內排程 CRUD／detail context → `scheduleQueries`（或 `classScheduleQueries`）屬**獨立高風險 PR**：先抽共用 type／純 helper，避免 `scheduleQueries ↔ classQueries` cycle；搬完可由 `classQueries` 暫時 re-export。`insertScheduleRow` 被排程頁、連堂批次、補堂、私人課程預約、課室占用、批課室申請共用，而且有 audit／inbox／declaration sync／連堂 skip flags。搬家＝檔案位置＋import；**唔改**簽名、連堂雙 insert、學年閘、**唔寫 `classes.teacher_id`**（代堂鐵則：只改該堂 `schedules.teacher_id`）。唔同刪 `insertPaymentForStudent` 綁成同一 PR。
- 時間格 helper 從 `classesUi` 遷 `lib/`，打斷 service → component（若順手；唔擋關閉）
- dashboard 組裝可留；count／sum 失敗語意跟波次 2，唔為瘦檔而下放

### 4.3 本期完工線 vs 後續

**本期可關閉（建議本題 `done` 條件）：**

- eslint：UI／page／lib 不可匯入 raw Supabase 資料 client；Auth 有明確 allowlist／facade。**唔要求** `services/**` 禁 import `components/**`
- `/MgmtDashboard` 任一依賴群組失敗：該組 KPI／衍生／圖／告警／CSV **唔**以 0／`[]` 冒充成功；頁內可讀「資料未能載入」；好嘅群組保留
- `fetchScheduleStatsSnapshot` 檢查每個 query `.error`；失敗唔顯示 0
- 點名待補失敗＝徽章 unknown，且唔保留上一輪數字
- 原路由／操作行為不變；`build`／`lint`／`test`／`typecheck:test`／`ui:check` 過

**明確留後續（唔擋關閉）：**

- 按 tab 切大 View 嘅 JSX（學生詳情請假／更動／出席／未來排程已抽；報讀／繳費未抽）
- 學生詳情加入班別預設同年級（另題 [`student-enroll-class-grade-default.md`](../topics/student-enroll-class-grade-default.md)）
- TanStack Query、feature-sliced 目錄
- `lib/appBanner`／`appConfirm`（刻意放 lib 嘅 UI 模組）；`classQueries` 暫 re-export 排程寫入
- 清 `api/entities.ts`（死碼題）
- 計糧／總覽變快、summary／full 去重（P2-2）
- generated Database types（P1-3）
- 點名待補對齊 `"待補課"` 枚舉／老師／日期 scope

### 4.4 落地紅線（字面實作會比依家差）

對抗全文見[審計](../audits/2026-08-16-frontend-architecture-boundaries-adversarial.md)；顧問字面陷阱見[覆核](../audits/2026-08-16-frontend-architecture-boundaries-consultant-review.md)。未守呢幾條，波次 1–2 會令總覽／老師首頁／點名比依家更假。已寫入上方各波；開工時當 checklist：

| # | 禁 | 要 |
| --- | --- | --- |
| R1 | 內層 KPI `throw`、View catch `emptyPayload` | `{ ok } \| { error }`；壞群組「—」，好群組保留 |
| R2 | reuse `fetchTrialsWithRelations` 做老師首頁 | 新瘦 query，select／日期／class 範圍不變 |
| R3 | 點名待補失敗寫入頁級 `err` | 徽章獨立未知態；仍可點名；reload 先清舊值 |
| R4 | 衍生數把 error 當 0；漏斗／告警失敗回 `[]` | 同一依賴群組一齊失敗；payload 要表達「失敗但非空」 |
| R5 | CSV 仍輸出失敗＝0 | 失敗列空或「未能載入」；真 0 輸出 `0` |
| R6 | `enrollmentPeriod` fetch 把 PostgREST error 吞成 regular，或 import `classQueries` | `!supabase`／缺列語意不變；query error 維持 error |
| R7 | `insertScheduleRow` 順手同步 `classes.teacher_id` | 只搬家；獨立 PR |
| R8 | 為瘦檔令 summary＋full 對同一 count 多打一輪 | 錯誤語意唔准加劇查詢；本題唔做 P2-2 去重 |
| R9 | 只改 `reloadStats` 的 `catch` | 先令 `fetchScheduleStatsSnapshot` 檢查 `.error` |
| R10 | eslint 禁整個 `supabase` client 而無 auth 豁免 | allowlist 或 auth facade；試跑唔誤傷 `Layout` |
| R11 | 把本題標成「完整單向分層已完成」 | done 條件只鎖資料存取＋數字可信 |
| R12 | 失敗卡仍塞 `value: 0` | 明確 `loadState`；HK 成本 `value === 0` loading 判斷唔好被誤觸 |

P0-1 staging 收緊 RLS 當日，總覽變紅＝探測器（好事）；要預告管理層，唔好為咗唔紅又改回吞 0。

---

## 5. 明確唔做

- 唔為行數切 `part1`／`part2`
- 唔等 generated types 先做波次 1–2
- 唔把本主題做效能或權限專案（summary／full 拆 Core／Details、核心 query 只跑一次＝P2-2）
- 唔引入 React Query／狀態機作為本計劃載具
- 唔改學費、報讀、點名等營運規則（無政策／2627 同步）
- 唔把死碼 `insertPaymentForStudent` 接上收款主路徑（刪即可）
- 唔為本題加劇營運總覽 round trip（去重仍屬 P2-2）
- 唔喺本題清 service → component 反向 import，亦唔把「完整單向分層」寫進 done
- 唔喺搬待補 count 時改全庫 scope 或對齊 pending enum

---

## 6. 顧問判決（已吸收）

原 C-1–C-4 已裁定；開工唔使再問。依據：[顧問覆核](../audits/2026-08-16-frontend-architecture-boundaries-consultant-review.md)。未採納「未修完 P0 唔開工」嘅字面——波次 1 可先做；波次 2 必須跟本檔 §4.2，唔好照舊計劃字面只改 component `catch`。

| 項 | 判決 | 寫入本檔 |
| --- | --- | --- |
| C-1 唔拆三大 View 可關閉 | **A**，但題目完工語意收窄成「資料存取邊界＋營運數字可信」 | §4.3、R11 |
| C-2 失敗 UI | **C：按依賴群組**。好組保留；壞組卡／衍生／圖／告警／CSV 一致；頁頂「部分指標未能載入」＋重試。唔用純逐卡，亦唔用整頁隱藏 | §4.1.4、§4.2 開頭 |
| C-3 TanStack Query | **A** 本期唔做 | §5 |
| C-4 寫入錯位 | **拆開**：`insertPaymentForStudent` 確認無 caller 後刪；`insertScheduleRow` 獨立高風險搬家、唔擋關閉 | §4.2 波次 4 |

顧問另有測試十項矩陣、抽 `buildMgmtDashboardCore` 純組裝層——**手法建議、非關閉閘**。最低測試見波次 2.6。

---

## 7. 開工時讀邊

1. 本計劃 §4（定案）＋ §4.4 紅線 checklist
2. 分題證據表（檔案／函式名單）
3. [`UI_DESIGN_INSTRUCTIONS.md`](../../meta/UI_DESIGN_INSTRUCTIONS.md) §1（紅字、唔用 banner 頂替）
4. 出席紀錄失敗契約：只抄「失敗不扮 0＋可重試」，**唔抄**該頁隱藏整組統計
5. 代堂：只改該堂 `schedules.teacher_id`（[`SCHEDULE_SUBSTITUTE_TEACHER.md`](../../policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md)）——波次 4 排程搬家必讀

實作前唔使再做盤點，除非 git 上三大 View 行數已明顯下降。顧問覆核全文唔使再讀，除非對對抗某條紅線。
