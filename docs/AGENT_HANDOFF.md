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
| `src/api/entities.ts`       | 舊 Base44 風格聚合層；**新功能優先**直接擴充 `services/*`，必要時再接到 entities。 |
| `supabase/migrations/*.sql` | Schema 與 **RLS 政策**（baseline；見第 5 節）。                      |
| `supabase/seed.sql`         | 演示用假資料（`db reset` 最後執行）；與 `teacherScope` UUID 對齊。        |


---

## 3. 新增功能時的檢查清單

1. **路由**：在 `src/App.tsx` 的 `<Route element={<Layout />}>` 內新增 `path` 與對應 `pages/*` 元件。
2. **側欄**：若要在選單顯示，**同步**修改 `src/components/Layout.tsx` 的 `NAV_STRUCTURE`（含 `path`、`label`、**roles**：`admin` / `teacher` / `alien`）。避免「有路由但選單沒入口」或相反。
3. **頁面結構**：優先 `pages/NewXxx.tsx` → `components/xxx/XxxView.tsx`，複雜查詢放 `services/xxxQueries.ts`。
4. **文案**：介面用語以專案既有 **繁體中文** 為主，與現有頁一致。

---

## 4. 型別與資料映射（重要）

**目標**：UI 元件依賴 **穩定、已命名的 TS 型別**（例如 `StudentRow`、`ScheduleListItem`），而不是對 Supabase 回傳值在畫面層到處 `as`。

**建議做法**：

- 在對應的 `src/services/*.ts` 內：
  - `export type XxxRow = { ... }`（欄位已是 UI 需要的形狀，含 `null` 處理後的預設值）。
  - 實作 `fetchXxx()`：在 **單一處** 把 `Record<string, unknown>` 或查詢結果 map 成 `XxxRow`（巢狀 join 的 unwrap、欄位改名只寫一次）。
- **避免**：在多個 `components/**/*.tsx` 內對同一種列表列重複 `(row as ...)` 或重複 `.map` 拆 `classes (...)`。

**原因簡述**：`as` 不會做執行期檢查；API 或 select 一改，UI 散落的斷言不會被 TypeScript 挡下，易在執行期才出錯。集中在 service 映射可單點維護與重構。

---

## 5. RLS（Row Level Security）與上線風險

- **RLS 是 PostgreSQL／Supabase 在資料庫端決定「誰能讀寫哪些列」**，與前端是否「沒顯示按鈕」無關；**anon key 會出現在瀏覽器**，故正式環境必須有實質限制。
- 目前 `supabase/migrations/20260418120000_baseline.sql` 內註明為 **開發用**：對多表建立 `dev_anon_all_*`、`dev_auth_all_*`，條件為 `using (true) with check (true)`，等同 **anon／authenticated 在 RLS 層幾乎全開**，並搭配較寬的 `grant`。
- **上線前必做**：刪除或替換上述 dev policies，改為依 `auth.uid()`、`profiles`／`app_users.role` 或業務規則撰寫 **最小權限** 的 `SELECT`／`INSERT`／`UPDATE`／`DELETE` policy；並複查 `grant` 是否仍過寬。
- 若僅在本地／內網 demo，可暫時保留 dev 政策，但需在文件與部署清單標註 **不可對外公開**。

---

## 6. 角色與登入（現況）

- 演示用：`localStorage.mgmt_role` 為 `admin` | `teacher` | `alien`，`Layout` 依此過濾選單。
- **此機制不等於 Supabase Auth**；真正上線若改用 `supabase.auth`，需把 **RLS** 與 **JWT claims**／`profiles` 對齊，並視情況移除或改寫僅依 localStorage 的前端角色邏輯。

---

## 7. 品質門檻

- 改動後執行：`npm run build`（`tsc -b` + `vite build`）。
- 避免無關大重構；單一 PR 聚焦需求，與既有 Tailwind／元件風格一致。

---

## 8. 架構速查（路由）

完整路由以 `src/App.tsx` 為準；側欄結構以 `Layout.tsx` 的 `NAV_STRUCTURE` 為準。兩者新增項目時請一併更新。

---

## 9. 繳費出單／列印 — 待辦優化指引

目前列印實作於 `src/lib/paymentPrint.ts`（瀏覽器 `window.print()`，非程式產生 PDF 檔）；金額拆分邏輯於 `src/lib/paymentAmountBreakdown.ts`。單據編號已改為 **當日遞增序號**（`MX-{RC|INV}-YYYYMMDD-0001`）並有 DB unique index；併發時會重試分配。多項優惠存於 `payment_discount_applications`（migration `20260611130000_payment_discount_applications.sql`）。

後續可依優先序實作：

| 優先 | 項目 | 說明 | 狀態 |
| --- | --- | --- | --- |
| P1 | 版面品牌化 | 補習社名稱、logo、地址、聯絡電話、付款指引（轉數快／銀行帳號等） | 待做 |
| P1 | 金額明細拆分 | 單據顯示項目小計、各項優惠扣減、應繳總額（勿只顯示合計） | **已完成**（`paymentAmountBreakdown` + 列印／詳情） |
| P2 | 優惠資料一致 | 多選優惠存於 `payment_discount_applications`；`payments.subtotal_amount` 記項目小計 | **已完成** |
| P2 | 標記已收後列印 | `markPaymentReceived` 完成後可選「同時列印收據」 | 待做 |
| P2 | 列印預覽 | 先預覽再列印／下載，減少彈窗被擋 | 待做 |
| P3 | 真正 PDF 下載 | 評估 jsPDF／html2canvas 等，一鍵下載 `.pdf` 檔 | 待做 |
| P3 | 模板抽離 | 將 HTML 模板獨立為可維護檔案或設定（方便非工程師調整文案） | 待做 |
| P3 | 明細備註欄 | 列印已移除備註欄重複；詳情列表仍可顯示 description | **部分完成** |

觸發列印入口：`PaymentsPageView`（建立後／紀錄查詢／詳情）、`StudentDetailView`（繳費紀錄分頁）。

---

*文件版本：與 repo 內 `mingxue-admin` 程式碼結構對齊；若遷移或目錄大改，請同步修訂本檔。*