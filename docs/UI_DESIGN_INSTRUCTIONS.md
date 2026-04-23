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
- `**setErr**`：將訊息寫入該頁／對話框的錯誤 state，以觸發紅字區塊。
- `**userMessage**`（選填）：若已用 `formatUnknownError(e)` 得到較完整訊息，可傳入以覆寫預設訊息。

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

### 2.2 Async 流程

- `onClick={() => void submit()}` 時，`**submit` 內必須 `try/catch/finally`**：`catch` 中顯示錯誤並依 1.2 上報；`finally` 中結束 saving 狀態。
- 成功後應有明確結果：**關閉對話框**、**重新載入列表**、或 `**role="status"` 成功提示** 擇一或併用，讓使用者確認「有送到」。

### 2.3 驗證

- 可預期的表單錯誤（缺必填、格式錯）應在送出前或 `catch` 開頭以**內嵌紅字／欄位提示**說明，不必每筆都寫入 `mgmt_system_errors`；若仍呼叫 `reportUserFacingError`，請使用不會洗版的訊息或節流後仍合理之 `source`。

---

## 3. 快速檢查清單（新頁面／新對話框）

- 所有會打 API 的按鈕皆有 **loading / disabled** 與 `**catch`**。
- `catch` 內使用 `**formatUnknownError`** + `**reportUserFacingError**`（含 `**setErr**`），畫面有紅字區塊。
- 成功路徑有關閉／重整／成功提示之一。
- 相關按鈕為 `**type="button"**`（除非確實要整表單 submit）。
- 只要欄位值來自「既定清單」（例如狀態、關係、分類），**不得**用自由文字 `Input`；應使用 `select`、單選按鈕或等價選項元件，避免髒資料。
- 多選清單（checkbox list）若選項數量 **> 7**，必須提供就地搜尋輸入（filter-as-you-type），避免使用者在長清單中逐項捲動。

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

## 7. 待辦事項看板（Kanban）UI 規範（2026-04-23 起）

- 欄位採卡片容器設計：欄頭置中、狀態名稱使用大寫視覺語氣，右上顯示該欄數量 badge。
- 任務卡需分層：上方 `tag`（分類/狀態/可見性）、中段主資訊（標題/摘要）、下方日期與指派狀態，避免資訊擠在單行。
- 任務卡需提供展開/收合互動（例如 chevron），預設顯示摘要，展開後再顯示完整 Notes 與參與對象。
- 參與對象中，老師與學生名稱需可點擊導向詳細頁；同事可保留純文字。
- 看板卡片**不提供 file 功能**（不顯示附件區、不含上傳/下載/檔案計數），避免與待辦核心流程耦合。