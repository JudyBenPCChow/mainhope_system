# AGENTS.md — 明學 mingxue-admin 專案總綱

本檔是 AI agent 的「入口指南」：先讀這份對齊全局，細節指向 `docs/`。介面用語一律 **繁體中文**。

## 技術棧

Vite + React 18 + TypeScript + Tailwind，路由 react-router-dom v6，資料層 Supabase JS。
進入點：`src/main.tsx` → `src/App.tsx`。

## 目錄分層（請維持，不可跨層）

| 路徑 | 職責 |
| --- | --- |
| `src/pages/` | 薄頁面：對應路由，多半只 render 某個 `components/<領域>` 大元件。 |
| `src/components/<領域>/` | 實際畫面與領域邏輯（students、schedule、payments、attendance…）。 |
| `src/components/ui/` | 無業務語意的基礎元件（Button、Input、Dialog、Select…）。 |
| `src/services/` | **所有** `supabase.from(...)` 查詢／寫入封裝；在單一處 map 成具名 TS 型別（如 `StudentRow`）匯出給 UI。 |
| `src/lib/` | 純工具函式（不依賴 React / Supabase 元件層），含 `supabaseClient`。 |
| `supabase/migrations/*.sql` | Schema 與 **RLS 政策**。命名 `YYYYMMDDHHMMSS_描述.sql`，**只新增、不改既有 migration**。 |

資料流向：**component → service → lib**。component 不直接打 DB；重複的 `as` 斷言改集中在 service 映射。

## 常用指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 本地開發 |
| `npm run build` | `tsc -b` + `vite build`，**改動後的品質門檻** |
| `npm run lint` | ESLint |
| `npm run ui:check` | UI 規範靜態檢查（禁 `alert`/`confirm`/原生 `<select>`、狀態 Tag 須走 `statusToTagTone`） |

## 新增功能檢查清單

1. **路由**：在 `src/App.tsx` 的 `<Route element={<Layout />}>` 內新增。
2. **側欄**：同步改 `src/components/Layout.tsx` 的 `NAV_STRUCTURE`（含 `roles`：`admin`/`teacher`/`alien`），避免「有路由沒入口」或相反。
3. **頁面**：`pages/Xxx.tsx`（薄）→ `components/<領域>/XxxView.tsx`（畫面）→ `services/xxxQueries.ts`（查詢）。
4. 查大量 UUID 時用 `forEachIdChunk`（`src/lib/supabaseInChunks.ts`）避免 URL 超長。

## 鐵則（最常被違反，務必遵守）

- **UI 一致性**：下拉用共用 `Select`/`MultiSelect`，狀態標籤用 `Tag` + `statusToTagTone`，日期用共用 `Input type="date"`，通知用 Banner、確認用 Confirm Dialog（禁 `alert`/`confirm`/原生 `<select>`）。完整條文見 `docs/UI_DESIGN_INSTRUCTIONS.md`。
- **RLS**：anon key 會出現在瀏覽器；改 schema 必須一併檢視 RLS。上線前移除 `baseline.sql` 的 `dev_*` 全開政策。見 `docs/RLS_ROLLOUT.md`。
- **角色**：目前前端角色為 `localStorage.mgmt_role`（`admin`/`teacher`/`alien`，見 `src/lib/mgmtRole.ts`），**不等於** Supabase Auth，前端隱藏按鈕不代表有權限保護。

## 深入文件

- 架構與資料層細節：`docs/AGENT_HANDOFF.md`
- 學生編號（學號）生成規則：`docs/STUDENT_CODE.md`（程式來源 `src/lib/studentCode.ts`）
- UI 設計規範：`docs/UI_DESIGN_INSTRUCTIONS.md`
- RLS 上線：`docs/RLS_ROLLOUT.md`
- 資料重匯入：`docs/REIMPORT_PLAYBOOK.md`、`docs/SEED.md`
