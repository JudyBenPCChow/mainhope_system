# 給協作 Agent 的開發指引（明學 mingxue-admin）

本文整合架構習慣、型別／資料層、RLS 與路由注意事項，方便接手改功能時對齊專案現況。

---

## 1. 技術棧與進入點

- **Vite + React 18 + TypeScript + Tailwind**，路由 **react-router-dom v6**。
- 進入點：`src/main.tsx` → `src/App.tsx`。
- 資料：**Supabase JS**（`src/lib/supabaseClient.ts`），需 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`；未設定時 `supabase === null`，可用 `isSupabaseConfigured` 在 UI 提示。

---

## 2. 目錄職責（請維持）


| 路徑                          | 用途                                                         |
| --------------------------- | ---------------------------------------------------------- |
| `src/pages/`                | 薄頁面：對應路由，多半只 render 某個 `components/...` 大元件。               |
| `src/components/<領域>/`      | 實際畫面與領域邏輯（students、schedule、payments、attendance…）。         |
| `src/components/ui/`        | 無業務語意的基礎元件（Button、Input、Dialog）。                           |
| `src/services/`             | **所有** `supabase.from(...)` 與查詢／寫入封裝；匯出明確 TS 型別給 UI。       |
| `src/lib/`                  | 共用工具、`supabaseClient`。                                     |
| `supabase/migrations/*.sql` | Schema 與 **RLS 政策**（baseline；見第 5 節）。                      |
| `supabase/seed.sql`         | 演示用假資料（`db reset` 最後執行）；與 `teacherScope` UUID 對齊。        |


---

## 3. 新增功能時的檢查清單

1. **路由**：在 `src/App.tsx` 的 `<Route element={<Layout />}>` 內新增 `path` 與對應 `pages/*` 元件。
2. **側欄**：若要在選單顯示，**同步**修改 `src/components/Layout.tsx` 的 `NAV_STRUCTURE`（含 `path`、`label`、**roles**：`admin` / `manager` / `teacher` / `alien`）。避免「有路由但選單沒入口」或相反。
3. **頁面結構**：優先 `pages/NewXxx.tsx` → `components/xxx/XxxView.tsx`，複雜查詢放 `services/xxxQueries.ts`。
4. **文案**：介面用語以專案既有 **繁體中文** 為主，與現有頁一致；機構自稱見 [`TERMINOLOGY.md`](TERMINOLOGY.md)（**明學教育**；校方／本校／補習社；禁院方、禁「明學補習社」、禁以書院／學院自稱）。

---

## 4. 型別與資料映射（重要）

**目標**：UI 元件依賴 **穩定、已命名的 TS 型別**（例如 `StudentRow`、`ScheduleListItem`），而不是對 Supabase 回傳值在畫面層到處 `as`。

**建議做法**：

- 在對應的 `src/services/*.ts` 內：
  - `export type XxxRow = { ... }`（欄位已是 UI 需要的形狀，含 `null` 處理後的預設值）。
  - 實作 `fetchXxx()`：在 **單一處** 把 `Record<string, unknown>` 或查詢結果 map 成 `XxxRow`（巢狀 join 的 unwrap、欄位改名只寫一次）。
- **避免**：在多個 `components/**/*.tsx` 內對同一種列表列重複 `(row as ...)` 或重複 `.map` 拆 `classes (...)`。

**原因簡述**：`as` 不會做執行期檢查；API 或 select 一改，UI 散落的斷言不會被 TypeScript 挡下，易在執行期才出錯。集中在 service 映射可單點維護與重構。

**學生狀態**：四維分類（注冊／在讀／活躍／學業階段）的 DB 重算、`normalize*` 與子字串誤判防呆，見 `docs/policies/enrollment/STUDENT_STATUS_CLASSIFICATION.md`。

---

## 5. RLS（Row Level Security）與上線風險

- **RLS 是 PostgreSQL／Supabase 在資料庫端決定「誰能讀寫哪些列」**，與前端是否「沒顯示按鈕」無關；**anon key 會出現在瀏覽器**，故正式環境必須有實質限制。
- 目前 `supabase/migrations/20260418120000_baseline.sql` 內註明為 **開發用**：對多表建立 `dev_anon_all_*`、`dev_auth_all_*`，條件為 `using (true) with check (true)`，等同 **anon／authenticated 在 RLS 層幾乎全開**，並搭配較寬的 `grant`。
- **上線前必做**：刪除或替換上述 dev policies，改為依 `auth.uid()`、`profiles`／`app_users.role` 或業務規則撰寫 **最小權限** 的 `SELECT`／`INSERT`／`UPDATE`／`DELETE` policy；並複查 `grant` 是否仍過寬。
- 若僅在本地／內網 demo，可暫時保留 dev 政策，但需在文件與部署清單標註 **不可對外公開**。

---

## 6. 角色與登入（現況）

- 演示用：`localStorage.mgmt_role` 為 `admin` | `manager` | `teacher` | `alien`，`Layout` 依此過濾選單。管理層（`manager`）首頁為營運總覽；見 `docs/product/topics/mgmt-manager-role.md`。
- **此機制不等於 Supabase Auth**；真正上線若改用 `supabase.auth`，需把 **RLS** 與 **JWT claims**／`profiles` 對齊，並視情況移除或改寫僅依 localStorage 的前端角色邏輯。
- **Phase 2 預留**：`students.assigned_agent_user_id` → `app_users`（代理人／外包中介）；角色 `agent` 尚未上線，見一對一分流。

---

## 6.1 一對一 vs 小組課

| | 小組課 (`class_kind=group`) | 一對一 (`class_kind=private`) |
| --- | --- | --- |
| 入口 | 班別管理 → 班別詳情 | **一對一學生**（admin）／**我的一對一學生**（teacher，只見自己）點班名 → 班別詳情 |
| 編輯 | 詳情「編輯班別」 | 詳情「編輯老師／學費」＋排程分頁「預約上堂」；列表負責新增報讀、預約、退讀 |
| 排程 | 固定星期／時段／課室，可批量排程 | 無固定時段；列表「預約」或詳情內管理排程 |
| 班別列表 | 預設顯示 | 預設隱藏；可篩「一對一」檢視 |
| 退讀 | 報讀列改為「已退讀」（軟退讀） | 同一對一列表操作，並取消未來課堂 |

判定：`src/lib/privateClassKind.ts` 的 `resolveClassKind`（`class_kind` 優先，班名含「一對一／單對單」後備）。

---

## 6.2 排程管理篩選（依角色）

排程頁（`ScheduleManagePage`）的篩選列**依角色不同**，改 UI 時勿假設三角色共用同一組控制項。

| | admin／alien | teacher（專班，`teacherScopeId` 有值） |
| --- | --- | --- |
| 資料範圍 | 目前載入區間內全部排程 | 已鎖定指派給自己的排程（`getTeacherScopeTeacherId()`） |
| 老師篩選 | 多選按鈕（OR）；選項從目前載入的 `rows` 彙出；未選＝不過濾 | **不顯示**（無需再選老師） |
| 狀態 | 「全部狀態」下拉 | 同左 |
| 進階篩選 | 未有學生報讀、一對一班別、未有課室安排（可多選 AND） | **僅**「未有學生報讀」；一對一／未有課室隱藏 |

實作錨點：`TEACHER_ISSUE_FILTER_IDS`、`effectiveTeacherFilterIds`、`issueFilterOptions`（皆在 `src/components/schedule/ScheduleManagePage.tsx`）。

### 教學紀錄（老師向，選填）

- 欄位：`schedules.teaching_notes`（與營運 `remarks` 分開）；**非必填**，UI 不應以「未填」催促。
- 專頁：`/TeachingRecords`（預設僅顯示有紀錄；可改全部堂次、搜尋、班別；列表可展開編輯）。
- 入田入口：排程詳情、點名紙底部、教學紀錄專頁；編輯器支援快捷片語與「延續上堂」。
- 導航：側欄「教學紀錄」；老師首頁時間表區有快捷按鈕。

---

## 6.3 同班偶發代課（代堂）

- **班別** `classes.teacher_id`＝常任主責；**排程** `schedules.teacher_id`＝當日實際；代堂另存 `original_teacher_id`。
- 偶發／輪流代課：維持主責，用「指派代堂」改該堂；**不要**為偶發代課改班別主責。
- 算堂數／薪資／「誰上了幾堂」以排程 `teacher_id` 為準；已點名勿隨便取消代堂（點名不凍結老師名，取消會改寫歷史歸屬）。
- 完整案例、風險表與檢查清單：`docs/policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md`。

---

## 7. 品質門檻

- 改動後執行：`npm run build`（`tsc -b` + `vite build`）。
- 避免無關大重構；單一 PR 聚焦需求，與既有 Tailwind／元件風格一致。

---

## 8. 架構速查（路由）

完整路由以 `src/App.tsx` 為準；側欄結構以 `src/lib/navStructure.ts`（由 `Layout.tsx` 消費）為準。兩者新增項目時請一併更新。

---

## 9. 繳費出單／列印（現況已完成）

**操作說明（人讀）**：[系統說明書 → 繳費收據](manual/PAYMENT_RECEIPTS.md)（目錄見 [SYSTEM_MANUAL.md](SYSTEM_MANUAL.md)）。含列印／PDF／WhatsApp，以及**作廢**（禁硬刪、密碼二次確認、已收款電郵通知管理層、收件匣系統通知 admin／alien）。  
**營運政策**：[收款單據作廢](PAYMENT_RECEIPT_VOID_POLICY.md)（索引見 [OPS_POLICIES.md](OPS_POLICIES.md)）。  
**設計鐵則（UI）**：[UI_DESIGN_INSTRUCTIONS.md §15](UI_DESIGN_INSTRUCTIONS.md) — **收款單一入口**：錢只經 `/Payments` 入帳，前台對帳只信 `/PaymentHistory`；業務頁（試堂等）唔好內嵌收款／開新收款頁。

### 已完成能力

- **品牌收據版面**：logo、社名、地址、電話、WhatsApp、網站（`src/lib/paymentPrint.ts`）。
- **金額明細**：項目小計、各優惠扣減、折實價（`paymentAmountBreakdown`；列印／預覽／詳情共用）。
- **優惠寫入**：多選優惠存 `payment_discount_applications`；`payments.subtotal_amount` 記項目小計。
- **單據編號**：當日遞增 `MX-{RC|INV}-YYYYMMDD-0001`，DB unique index，併發重試。
- **預覽／列印**：收款登記有收據預覽 Dialog；可勾選「建立後開啟列印」；列印走瀏覽器 `window.print()`（隱藏 iframe）。
- **PDF 下載**：`paymentReceiptPdf`（html2canvas + jsPDF）產生與預覽同版面之 PDF（含 logo）；`PaymentReceiptDownloadButton`；可寫入接待處 OneDrive 學生收據資料夾。
- **WhatsApp**：產生 PDF 後開啟 WhatsApp 供附加傳送。
- **家長開通 QR**：收據附該生專屬開通連結／QR。
- **作廢**：禁硬刪；`void-payment` Edge Function（密碼確認、audit、月費／轉介連動）；已收款可電郵管理層；收件匣系統通知 admin／alien。

觸發入口：`PaymentsPageView`、`PaymentHistoryView`、`StudentDetailView`（繳費分頁導向收款）。（原 `/receipt-demo` 已下線。）

### 開發備註（非操作手冊）

- **單一收款入口：** 新功能若要收錢，只連 `/Payments`（或呼叫既有 `insertPaymentRecord` 且 UI 必須係收款頁／其共用表單）。禁止在試堂、請假、報讀、前台精靈等頁再造收款 Dialog。前台精靈收款步已收斂為導向 `/Payments`（見 UI §15）。
- PDF 為「畫面轉檔」以保留現有 HTML 版面與 logo；不以另畫一套文字 PDF 取代（版面／logo 不可妥協）。
- 機構聯絡資料目前為程式常數；日後若做「機構主檔設定」再改讀設定。

---

*文件版本：與 repo 內 `mingxue-admin` 程式碼結構對齊；若遷移或目錄大改，請同步修訂本檔。*