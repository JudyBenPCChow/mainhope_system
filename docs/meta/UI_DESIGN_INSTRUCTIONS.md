# UI 設計與互動指引（明學管理）

本文件約束**錯誤呈現**與**表單／按鈕送出**行為，與現有程式慣例一致；實作時請直接沿用已提供的工具方法，避免使用者遇到「按了沒反應」或無法追蹤的失敗。

---

## 1. 錯誤處理：紅字提醒 + 外星人端可追蹤

### 1.1 使用者當下必須看得見

當某次操作**失敗且無法在前景自動修復**（例如 API／Supabase 拒絕、驗證失敗、網路錯誤）時：

- **必須**在該頁或該對話框內顯示**紅色錯誤區塊**（`role="alert"`，邊框／底色依專案既有 `destructive` 樣式），文案為**可讀的一句話**，不可空白、不可僅 `console.error`、不可靜默吞掉例外。
- 若錯誤來自 **PostgREST／非 `Error` 實例** 的物件，請先用 `**formatUnknownError`**（`src/lib/formatUnknownError.ts`）轉成字串再顯示，避免畫面上出現 `[object Object]`。

### 1.2 外星人「報錯與問題」必須收得到

同一類錯誤除在當頁顯示外，應寫入 `**mgmt_system_errors`**，供**外星人角色**於側欄 **「報錯與問題」**（路由 `/SystemIssues`；口語／舊稱「系統錯誤」即指此列表）查閱；首頁上帝視角亦會預覽近期錯誤。

實作方式：在 UI 層的 `catch` 內呼叫 `**reportUserFacingError`**（`src/lib/mgmtErrorReporting.ts`），並盡量傳入：

- `**source`**：穩定字串，建議 `元件檔名.函式名`（例如 `ScheduleManagePage.confirmMove`），方便在報錯列表篩選。
- `**setErr`**：將訊息寫入該頁／對話框的錯誤 state，以觸發紅字區塊。
- `**userMessage`**（選填）：若已用 `formatUnknownError(e)` 得到較完整訊息，可傳入以覆寫預設訊息。

`reportUserFacingError` 會節流（同 `source` + 相同訊息約 **60 秒**內不重複上報），避免洗版；仍會先透過 `setErr` 讓使用者當下看到錯誤。

若未設定 Supabase，錯誤會進入 **localStorage 佇列**，於 App 啟動時由 `**flushMgmtErrorQueue`** 補送。

### 1.3 不建議的做法

- 在 `catch` 裡只 `return` 或只 `void` 呼叫 async 卻**不** `catch`，導致未處理的 Promise rejection。
- 僅 `alert()` 而**不**上報（除非是純前端提示且無後端關聯）；與使用者資料／權限相關的失敗應走 `reportUserFacingError`。

---

## 2. 表單與按鈕送出：必須有實際效果與回饋

### 2.1 非提交行為

- 在 `<form>` 內或可能被誤觸發時，按鈕預設使用 `**type="button"`**，避免意外觸發整表單 submit。
- 會觸發 async 的按鈕應有 `**disabled={saving}`**（或等價狀態），並在進行中顯示 **「儲存中…」** 等文案，避免重複送出。
- **優先**使用共用 `Button` 的 `loading` prop（`src/components/ui/button.tsx`），例如 `<Button loading={saving} loadingText="儲存中…">儲存</Button>`；`loading=true` 時自動 `disabled` 與 `aria-busy`。微交互細節見 [`MICRO_INTERACTIONS.md`](./MICRO_INTERACTIONS.md)。
- **優先**使用共用 `Button` 的 `loading` prop（`src/components/ui/button.tsx`），例如 `<Button loading={saving} loadingText="儲存中…">儲存</Button>`；`loading=true` 時自動 `disabled` 與 `aria-busy`。微交互細節見 [`MICRO_INTERACTIONS.md`](./MICRO_INTERACTIONS.md)。

### 2.2 Async 流程

- `onClick={() => void submit()}` 時，`**submit` 內必須 `try/catch/finally`**：`catch` 中顯示錯誤並依 1.2 上報；`finally` 中結束 saving 狀態。
- 成功後應有明確結果：**關閉對話框**、**重新載入列表**、或 `**role="status"` 成功提示** 擇一或併用，讓使用者確認「有送到」。

### 2.3 驗證

- 可預期的表單錯誤（缺必填、格式錯）應在送出前或 `catch` 開頭以**內嵌紅字／欄位提示**說明，不必每筆都寫入 `mgmt_system_errors`；若仍呼叫 `reportUserFacingError`，請使用不會洗版的訊息或節流後仍合理之 `source`。

---

## 3. 快速檢查清單（新頁面／新對話框）

- 所有會打 API 的按鈕皆有 **loading / disabled** 與 `**catch`**。
- `catch` 內使用 `**formatUnknownError`** + `**reportUserFacingError`**（含 `**setErr`**），畫面有紅字區塊。
- 成功路徑有關閉／重整／成功提示之一。
- 相關按鈕為 `**type="button"**`（除非確實要整表單 submit）。
- 只要欄位值來自「既定清單」（例如狀態、關係、分類），**不得**用自由文字 `Input`；應使用 `select`、單選按鈕或等價選項元件，避免髒資料。
- **學年**欄位一律使用**剔選多選**（checkbox 清單，選項來自 `academic_years` 主檔）；**禁止**以文字輸入學年代碼。可多選時以逗號串接寫入後端（見 `src/lib/multiValueField.ts`）。

---

## 3.1 老師專長科目 UI（專用規範，2026-05-07）

- 適用範圍：老師資料編輯相關頁（`老師詳細頁`、`老師個人資料`、`新增老師`）中的 `專長科目` 欄位。
- `專長科目` 必須使用 **multi-select chips**；禁止逗號分隔自由文字輸入。
- 選項使用固定清單（第一版）：`中文`、`英文`、`數學`、`綜合科學`、`物理`、`化學`、`生物`、`M2`、`BAFS`、`中史`、`歷史`、`地理`、`經濟`、`ICT`。
- 互動規則：點擊 chip 為切換選取/取消；已選取樣式需明顯有別於未選取（邊框與底色變化）。
- 顯示規則：chips 區塊下方需顯示目前已選項目；若未選則顯示 `尚未選擇專長科目` 提示。
- 儲存規則：送出 payload 時寫入 `subject_speciality: string[] | null`；空陣列需寫入 `null`，避免髒資料格式。
- 維護規則：若新增／刪減科目選項，必須在同一開發批次同步更新三處 UI（`老師詳細頁`、`老師個人資料`、`新增老師`）與其共用常數來源，避免頁面選項不一致。

---

## 4. RLS / 權限治理原則（所有模組通用）

- 前端只要讀寫某資料表（包含列表、詳情、對話框送出），必須在同一開發批次補齊該表的 RLS policy 與 table grants，避免上線後才出現 `permission denied for table ...`。
- 以 migration 管理權限修正；避免僅在 SQL Editor 手動修，防止環境漂移。
- 權限 migration 最少包含：
  - `alter table ... enable row level security`
  - 明確 `drop/create policy`（命名固定、可重跑）
  - `grant select, insert, update, delete ... to anon, authenticated`（依環境策略調整）
- 若頁面依賴多張表（主表 + 關聯表），需一次盤點並一併補齊，避免「修一張又壞下一張」。
- 任何 RLS 權限錯誤都要走既有錯誤呈現規範：頁內紅字 + `reportUserFacingError` 上報，方便外星人於「報錯與問題」追蹤。

---

## 5. 學生管理專用更新原則（2026-04-23 起）

- `新增學生` 對話框欄位需與 `學生詳細頁 > 基本資料` 一致（含三態欄位與家長聯絡欄位），避免兩邊資料結構分裂。
- `新增學生` 只建立 `students` 基本資料；**不得**在同一步驟加入「報讀班別」。
- 新學生要加班別時，必須先完成新增，再到該生詳細頁 `報讀班別` 分頁操作。
- 若 UI 文案提及流程，需明確告知「新增後再到詳細頁加班別」，避免誤解為一步完成。
- 所有影響學生在讀判斷的功能（增讀/退讀/狀態調整）需維持 `students` 三態欄位與報讀資料一致，不可只改單一來源。

---

## 6. 相關程式位置（供對照）


| 用途             | 路徑                                           |
| -------------- | -------------------------------------------- |
| 錯誤上報與可選紅字      | `src/lib/mgmtErrorReporting.ts`              |
| Supabase 錯誤轉字串 | `src/lib/formatUnknownError.ts`              |
| 外星人側欄「報錯與問題」   | `src/components/Layout.tsx`（`/SystemIssues`） |
| 報錯列表 UI        | `src/components/system/SystemIssuesView.tsx` |


以上與視覺樣式細節（色票、間距）可再與設計稿併行，但**錯誤可見性**與**送出可追蹤性**為必須遵守之互動條款。

---

## 7. 待辦事項看板（已廢除 · 2026-07-31）

行政後台「待辦看板」（原 `/Calendar`／Kanban／學生詳情「相關事項」）**已廢除**：路由、UI、查詢模組已移除；歷史 `calendar_events`／`admin_todos` 列已清空。日常通知請用收件匣 `/Inbox`。家長 Portal 通告若日後重用同表，屬 Portal 範圍，與行政看板無關。

---

## 8. Date Picker 設計規範（2026-04-23 起）

- 全專案日期輸入一律使用共用 `Input type="date"`（由 `src/components/ui/input.tsx` 轉接至 `src/components/ui/date-input.tsx`）；禁止在業務頁各自實作日期彈層。
- Date Picker 面板需維持四段式：**白底圓角容器 + 上方日期顯示區 + 中央月曆 + 底部 Reset**，保持一致視覺語言。
- Date Picker 內容區需置中：上方日期、月份標題、月曆表格與底部 Reset 按鈕皆需以中線對齊，不得預設靠左排版。
- Date Picker 面板須以 **fixed／portal** 掛到 `document.body`（z-index ≥ Select／DateRange 的 `320`），避免在 `MobileFilterSheet`、Dialog（`overflow-y-auto`）內被裁切；窄螢幕寬度用 `min(100vw - 16px, 偏好寬度)`。
- 選取日顏色走 design token（單日 `success`、區間 `primary`），禁止硬編碼 hex。
- Date Picker 不得混入檔案相關能力（附件區、上傳／下載、檔案數量）。
- 對外值格式固定為 `YYYY-MM-DD`；Reset 清除回傳空字串，並需與既有查詢參數/API payload 相容。
- 若要擴充成區間（Start/End）模式，需在共用元件層實作與維護，不可在單頁繞過共用元件另做。
- **開放區間篩選**（可只填起日或只填迄日）維持兩個獨立 `Input type="date"`；僅在確認必須兩端都有時才改用 `DateRangeInput`（Reset 會一次清 from+to）。

---

## 9. 全域 Components 色彩與 Icon 規範（2026-04-23 起）

- 全域顏色只使用設計 token（`neutral` + `utility`）：`success/green`、`info/blue`、`warning/orange`、`destructive(red)`，禁止在新元件直接寫臨時色號。
- 狀態語意對應固定：成功=`success`、資訊=`info`、警示=`warning`、錯誤=`destructive`；中性容器/文字使用 `neutral` 階。
- 共用元件（`Button`、`Input`、`Dialog`、Date Picker）應優先使用 token 顏色，避免頁面各自定義主色導致視覺漂移。
- Icon 與箭咀（arrow/chevron）採統一筆觸規格：圓角端點、較一致線寬；若頁面需特殊尺寸，僅調整尺寸，不改筆觸風格。
- 新增 icon 時優先沿用同一套圖示家族（目前 `lucide-react`），避免混用多套線性 icon 導致風格不一致。

---

## 10. 系統通知 Banner 規範（2026-04-23 起）

- 全域操作通知改用 Banner；不得使用瀏覽器 `alert()`。
- Banner 固定在頁面頂部，以滑入方式出現；多條通知直向堆疊，最新在最上方。
- Banner 出現後 **2 秒**自動關閉；亦可提早按 `X` 關閉。
- Banner 色彩語意：`default`(灰) / `info`(藍) / `success`(綠) / `warning`(橙) / `error`(紅)。
- 內容可點擊展開；若通知含 action，按鈕文案固定為 `前往XXXX頁面`，點擊後需「導頁 + 關閉該通知」。
- 需要二次確認（確認/取消）的互動保留 Dialog，不使用 Banner 取代。

---

## 11. Confirm Dialog 規範（2026-04-23 起）

- 需「確認 / 取消」的操作（刪除、拒絕、覆寫）必須使用全域 Confirm Dialog；不得使用瀏覽器 `confirm()`。
- Dialog 置中顯示，背景遮罩；預設 **不可**點擊遮罩關閉。
- 鍵盤規則：`Enter` 觸發主要動作、`Esc` 視為取消。
- 按鈕配置：次要（outline）在左、主要（實心）在右；窄螢幕允許換行。
- 危險操作主要按鈕使用 destructive 語意色。
- **不可還原的清除／硬刪**（例如手誤清除報讀）：除 `tone: "destructive"` 外，應傳入 `confirmInput`（`label` + `expected`），使用者輸入與 `expected`（trim 後完全一致）後才可按確認；有 `confirmInput` 時自動 focus 輸入框，且僅在輸入正確時允許 `Enter` 確認。實作見 `src/lib/appConfirm.tsx`。

---

## 12. Dropdown / Menu / Tag 規範（2026-04-23 起）

- 全專案下拉選單一律使用共用 `Select`（`src/components/ui/select.tsx`），不得直接在頁面使用原生 `<select>`。
- **例外（長名單 picker）**：選項為大量動態實體（例如繳費「推薦人／舊生」整份學生名單）時，可保留原生 `<select>` 以使用系統 wheel picker，並在 `scripts/ui-guideline-check.mjs` 的 `ALLOW_NATIVE_SELECT_FILES` 登錄；**禁止**為通過檢查而盲換 Radix `Select`（Dialog 內長名單與流動體驗會變差）。後續若改版，優先做可搜尋 bottom sheet，而非共用 Select。
- Dropdown 視覺語言：白底、圓角、細邊框、箭咀圖示一致、hover 邊框加深；disabled 項目維持低對比可辨識。
- 需要 action menu（例如 Edit / Share / Preview）時，選單項目遵循同一套圓角容器與 hover 高亮風格，不得混入另一套 menu 樣式。
- Tag 一律使用共用 `Tag`（`src/components/ui/tag.tsx`）或 `tagVariants`，禁止在業務頁手寫零散色塊。
- 狀態語意對應：`booked/info`、`success`、`pending/warning`、`failed/error`、`cancelled/default`。
- 狀態類標籤需使用共用字典 `statusToTagTone`（`src/lib/statusTag.ts`）做映射；不得在頁面各自硬編碼狀態對色邏輯。
- 狀態映射字典採可配置表 `STATUS_TAG_RULES`；新增狀態時優先修改字典，不改頁面判斷碼。
- **學生四維狀態**（注冊／在讀／活躍／學業階段）的業務定義、`normalize*` 子字串誤判防呆與 DB 重算規則，見 `docs/policies/enrollment/STUDENT_STATUS_CLASSIFICATION.md`。
- 需要**多選下拉**時使用共用 `MultiSelect`（`src/components/ui/multi-select.tsx`），視覺與互動對齊 `Select`（圓角、邊框、箭咀、勾選列）；單選仍用 `Select`。
- **Select 子元素（`<option>`）寫法**（2026-07-07 起）：
  - 共用 `Select` 會從 `children` 萃取原生 `<option>`／`<optgroup>` 再渲染 Radix 選單；**不得**用 `<>...</>`（Fragment）或自訂 JSX 元件包住 `<option>`，否則選項可能無法出現在下拉中（曾導致學生請假「班別」空白）。
  - **建議寫法**（擇一）：
    - 靜態：`<option value="">請選擇</option>` 與 `{items.map(...)}` 並列為 Select 直接子節點。
    - 佔位 + 清單：陣列展開 `[<option key="ph" value="">請選擇</option>, ...items.map(...)]`。
    - 條件：三元運算子直接回傳 `<option>` 或上述陣列，勿再包一層 Fragment。
  - `MultiSelect` 使用 `options` prop，不受此條限制。
  - 參考：`src/components/ui/select.tsx`（`collectOptions`）、`src/components/students/StudentDetailView.tsx`（請假班別／排程）、`src/components/leaves/LeaveManagementView.tsx`（班別三元寫法）。

---

## 13. 學年與多選規範（2026-06-13 起）

- **學年**：表單內任何「限定學年」「適用學年」等欄位必須為**剔選多選**（checkbox 清單），資料來源為 `fetchAcademicYearOptions()` 或等價 `academic_years` 查詢；不得使用 `Input` 手打學年 label。
- **儲存格式**：多選學年以半形逗號串接寫入既有 `text` 欄位（如 `payment_discounts.academic_year`）；讀取時以 `parseMultiValueField` / `joinMultiValueField` 轉換。
- **互斥群組等無主檔清單**：既有群組以 checkbox 剔選；新增代碼使用欄位下方「輸入 + 加入」列（須在對話框內直接操作，避免下拉 portal 被 Dialog 判定為外部點擊）。
- **參考實作**：`src/components/payments/PaymentDiscountsView.tsx`（編輯優惠對話框）。
---

## 14. 流動裝置（`<768px`）刻意例外（2026-07-18 起）

- **殼分離**：`AdaptiveLayout` 在 `MOBILE_BREAKPOINT`（768）以下使用 `MobileLayout`，與桌面側欄 `Layout` 分離；**不得**用共用 PageShell 硬合併 chrome（頂欄／底欄／drawer）。
- **Overlay 分工**：詳情 `DetailLayerShell`、篩選 `MobileFilterSheet` = bottom sheet；導航 `MobileNavDrawer` = side drawer；Confirm／表單 = 置中 `Dialog`。**禁止**為「統一」把 sheet／drawer 改成置中 Dialog。
- **篩選呈現**：同一篩選 state；桌面 inline、手機進 `MobileFilterSheet`（Students／Payments／Classes／Trials 為準）。
- **觸控高度**：表單觸發優先 `h-10`／`min-h-10`（對齊共用 `Select`）；**勿**為桌面對齊把 Select 壓成 `h-9`。
- **品牌 hex**：`Layout`／`MobileHeader`／`MobileNavDrawer`／`MobileBottomNav` 的品牌藍允許保留；勿用 lint 全面禁 hex 誤傷。
- **主區底部**：`pb-[calc(5.5rem+safe-area)]`；全高彈層需避開底欄。
- **z-index（勿打亂）**：明學IT狗（阿Po）FAB `90` → 更新橫幅 `100` → DetailLayer／點名紙 `200` → FilterSheet／NavDrawer `250` → Dialog `260/261` → Confirm `270/271` → Select／DateInput／DateRange `320`。

---

## 15. 收款單一入口（2026-08-01 起）

前台對帳以**繳費紀錄**（`/PaymentHistory`）為準。任何「收咗錢」必須能喺繳費紀錄搵到同一張單；**禁止**另開收款頁／另造一套收款 Dialog 令錢唔入 `payments`。

| 要 | 唔好 |
| --- | --- |
| 錢一律經**收款登記** `/Payments`（`insertPaymentRecord` → 繳費紀錄可見） | 喺試堂／請假／報讀／前台精靈等業務頁內嵌「當場收款」另開元件或新路由 |
| 業務頁只管業務（例：試堂頁只建／改／取消試堂）；要收錢 → 連去 `/Payments?studentId=…` | 複製一份收款表單喺精靈／其他頁「圖方便」 |
| 學生詳情「新增繳費」→ navigate 去 `/Payments`；前台精靈收款步 → 導向 `/Payments` | 新做第三套出單 UI |

前台精靈步驟「收款／出單」只作導引（前往／略過），**唔再**內嵌出單表單（2026-08-01 收斂）。

操作說明見 [`manual/PAYMENT_RECEIPTS.md`](./manual/PAYMENT_RECEIPTS.md)；架構備註見 [`AGENT_HANDOFF.md`](./AGENT_HANDOFF.md) §9。

---

## 16. 桌面資料列表：表頭篩選／排序／多選（2026-08-25 起）

適用：管理後台**桌面**資料列表（例如學生管理、班別管理）。新做或大改此類列表時，必須對齊同一套互動，禁止另造表頭漏斗／勾選列 UI。

### 16.1 要用共用殼

路徑：`src/components/list/`

| 元件／工具 | 用途 |
| --- | --- |
| `SortableColumnHeader` | 表頭欄名＋排序箭嘴 |
| `HeaderFilterButton` | 表頭漏斗（preset 選項或文字包含＋唯一值） |
| `BulkSelectionBar` | 「已選 N」工具列外框（全選／清除；批量動作用 children） |
| `listFilterUtils` | `countActiveFilters`、`emptyFiltersForKeys`、`emptyLast`、`dirMul` 等 |

參考實作：

- 學生：`StudentsListTable` + `studentsListColumns` + `StudentsListPage` 批量列
- 班別：`ClassesListTable` + `classesListColumns` + `ClassesListPage` 桌面 list

### 16.2 各頁自備（唔放進共用殼）

- 欄位 id／標籤、取值、篩選比對、排序、儲存格渲染
- 批量實際動作（匯出 CSV、刪除、複製電話等）
- 領域專屬欄（例如學生 WhatsApp、班別行內改狀態）

### 16.3 與大範圍篩選分工（§14）

- **大範圍**：chips／搜尋／學年 Select；手機進 `MobileFilterSheet`（同一 state）
- **表頭篩選**：欄位微調；疊加在大範圍結果之上
- 手機卡片／看板／圖庫：**唔強制**跟表頭篩選／多選；桌面 list 為準

### 16.4 唔好

- 為新列表重寫一套表頭漏斗／勾選／批量列外觀
- 一開始就上 TanStack Table／萬能 DataTable 全家（除非既有殼明顯唔夠）
- 為「統一」把領域欄位邏輯硬塞進共用殼，或拆掉 chips／FilterSheet
