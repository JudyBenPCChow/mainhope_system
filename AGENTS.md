# AGENTS.md — 明學 mingxue-admin 專案總綱

本檔是 AI agent 的「入口指南」：先讀這份對齊全局，細節指向 `docs/`。介面用語一律 **繁體中文**；機構自稱見 `docs/TERMINOLOGY.md`（正式名 **明學教育**；用校方／本校／補習社；禁院方、禁「明學補習社」、禁以書院／學院自稱）。

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
| `npm run ui:check` | UI 規範靜態檢查（禁 `alert`/`confirm`/原生 `<select>`、狀態 Tag 須走 `statusToTagTone`、Select 子元素勿 Fragment 包 `<option>`） |

## 新增功能檢查清單

1. **路由**：在 `src/App.tsx` 的 `<Route element={<Layout />}>` 內新增。
2. **側欄**：同步改 `src/components/Layout.tsx` 的 `NAV_STRUCTURE`（含 `roles`：`admin`/`manager`/`teacher`/`alien`），避免「有路由沒入口」或相反。
3. **頁面**：`pages/Xxx.tsx`（薄）→ `components/<領域>/XxxView.tsx`（畫面）→ `services/xxxQueries.ts`（查詢）。
4. 查大量 UUID 時用 `forEachIdChunk`（`src/lib/supabaseInChunks.ts`）避免 URL 超長。
5. **一對一**：列表在 `/PrivateTutoring`；點班名進班別詳情。小組課：班別管理 → 班別詳情。詳見 `docs/AGENT_HANDOFF.md` §6.1。

## 鐵則（最常被違反，務必遵守）

- **UI 一致性**：下拉用共用 `Select`/`MultiSelect`，狀態標籤用 `Tag` + `statusToTagTone`，日期用共用 `Input type="date"`，通知用 Banner、確認用 Confirm Dialog（禁 `alert`/`confirm`/原生 `<select>`）。完整條文見 `docs/UI_DESIGN_INSTRUCTIONS.md`。
- **RLS**：anon key 會出現在瀏覽器；改 schema 必須一併檢視 RLS。上線前移除 `baseline.sql` 的 `dev_*` 全開政策。見 `docs/RLS_ROLLOUT.md`。
- **角色**：目前前端角色為 `localStorage.mgmt_role`（`admin`/`manager`/`teacher`/`alien`，見 `src/lib/mgmtRole.ts`），**不等於** Supabase Auth，前端隱藏按鈕不代表有權限保護。管理層分流見 `docs/backlog/mgmt-manager-role.md`。
- **排程篩選依角色**：admin／alien 有老師多選＋三個進階篩選；專班老師資料已鎖定自己、不顯示老師篩選，進階篩選僅「未有學生報讀」。見 `docs/AGENT_HANDOFF.md` §6.2。
- **代堂 ≠ 改主責**：同班偶發／輪流代課只改該堂 `schedules.teacher_id`（指派代堂），勿改 `classes.teacher_id`；算堂數看排程老師。見 `docs/SCHEDULE_SUBSTITUTE_TEACHER.md`。
- **Migration 套用（寫完即套，勿等使用者提醒）**：寫完本任務需要的 `supabase/migrations/*.sql` 後**主動**對 linked 遠端（`MainHope_production`）單檔套用。優先 `npm run db:apply -- <檔>`；若失敗／超時，立刻改手動兩步（勿誤判成未 login）：
  ```bash
  export PATH="$HOME/.local/bin:$PATH"
  supabase db query --linked -f supabase/migrations/YYYYMMDDHHMMSS_描述.sql
  supabase migration repair --status applied YYYYMMDDHHMMSS --linked
  ```
  遠端／本地歷史不一致時**禁止**全量 `db push`。詳見 `docs/SUPABASE_MIGRATION_APPLY.md` 與 skill `apply-supabase-migration`。

## 深入文件

- **跨專案總覽**（Desktop）：[`../PROJECTS.md`](../PROJECTS.md)
- **工程待跟進**：`docs/BACKLOG.md`（問「有咩未做」時讀此；細節見 `docs/backlog/`；已完成稽核見 `docs/audits/`）
- **系統說明書（營運操作現況）**：`docs/SYSTEM_MANUAL.md`（篇章目錄）；繳費收據：`docs/manual/PAYMENT_RECEIPTS.md`；連堂單項請假／補堂：`docs/manual/LEAVE_MAKEUP_CONSECUTIVE.md`
- **營運政策索引**：`docs/OPS_POLICIES.md`（正規／暑期學年、學費節奏與逾期罰款、點名扣堂、代堂、學生狀態、課室／17K 退租、小組課排課規則、文案稱呼等姊妹篇）
- 小組課排課規則（格網、兼職密排、老師檔期）：`docs/SCHEDULING_RULES.md`
- 文案與稱呼（明學教育／校方／本校；禁院方、禁明學補習社）：`docs/TERMINOLOGY.md`
- 正規／暑期學年與報讀：`docs/ACADEMIC_YEARS.md`（含 §1.1 後台寫入：不硬鎖歷史學年；非當期 confirm＋audit）
- 學費學期節奏與逾期罰款（部分尚未系統強制）：`docs/TUITION_TERM_AND_LATE_FEE_POLICY.md`
- 架構與資料層細節：`docs/AGENT_HANDOFF.md`（含 §6.2 排程管理篩選依角色；§9 繳費列印現況）
- 學生編號（學號）生成規則：`docs/STUDENT_CODE.md`（程式來源 `src/lib/studentCode.ts`）
- UI 設計規範：`docs/UI_DESIGN_INSTRUCTIONS.md`
- 學生狀態分類與判定（注冊／報讀／活躍、子字串誤判防呆）：`docs/STUDENT_STATUS_CLASSIFICATION.md`
- 點名狀態與扣堂／已上堂數：`docs/ATTENDANCE_BILLING.md`（程式 `src/lib/attendanceBilling.ts`）；獨立頁「進行點名」`/Attendance`，排程頁亦可「確定點名」滑出點名紙
- 同班偶發代課／代堂（主責 vs 當日老師、報表風險）：`docs/SCHEDULE_SUBSTITUTE_TEACHER.md`
- RLS 上線：`docs/RLS_ROLLOUT.md`
- 遠端單檔套用 migration：`docs/SUPABASE_MIGRATION_APPLY.md`（`npm run db:apply`；fallback：`db query` + `migration repair`）
- 資料重匯入：`docs/REIMPORT_PLAYBOOK.md`、`docs/SEED.md`
