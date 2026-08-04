# AGENTS.md — 明學（MainHope）行政後台

介面用語：**繁體中文**。機構自稱見 `docs/TERMINOLOGY.md`（**明學教育**／**MainHope**；禁 mingxue、院方、「明學補習社」、書院／學院自稱）。

## 技術棧

Vite + React 18 + TypeScript + Tailwind；react-router-dom v6；Supabase JS。  
進入點：`src/main.tsx` → `src/App.tsx`。

## 分層（不可跨層）

| 路徑 | 職責 |
| --- | --- |
| `src/pages/` | 薄頁面／路由 |
| `src/components/<領域>/` | 畫面與領域邏輯 |
| `src/components/ui/` | 無業務語意基礎元件 |
| `src/services/` | **所有** `supabase.from(...)`；map 成具名型別 |
| `src/lib/` | 純工具（不含 React／DB 元件層） |
| `supabase/migrations/` | Schema／RLS；只新增、不改既有 |

資料流：**component → service → lib**。Component 不直接打 DB。

## 指令

`npm run dev`｜`npm run build`（改動後門檻）｜`npm run lint`｜`npm run ui:check`

## 新增功能

路由 `App.tsx` + 側欄 `src/lib/navStructure.ts`（含 roles）同步改。  
頁面：`pages/` → `components/<領域>/` → `services/`。  
大量 UUID 用 `forEachIdChunk`。一對一列表在 `/PrivateTutoring`。

## 鐵則

- **UI**：共用 `Select`/`MultiSelect`、`Tag`+`statusToTagTone`、日期 `Input type="date"`；禁 `alert`/`confirm`/原生 `<select>`。詳見 `docs/UI_DESIGN_INSTRUCTIONS.md`。
- **RLS**：改 schema 必檢 RLS；anon key 在瀏覽器。見 `docs/RLS_ROLLOUT.md`。
- **角色**：`localStorage.mgmt_role` ≠ Auth；讀權限 manager ≥ admin（`finance` 可讀職員資料、入口收窄至計糧／繳費＋排程／出席核對）；分流見 `docs/backlog/mgmt-manager-role.md`／計糧見 `docs/backlog/payroll-engine.md`。
- **代堂**：只改該堂 `schedules.teacher_id`，勿改 `classes.teacher_id`。見 `docs/SCHEDULE_SUBSTITUTE_TEACHER.md`。
- **Migration**：寫完即單檔套用；優先 `npm run db:apply -- <檔>`；禁全量 `db push`。見 `.cursor/rules/supabase-migrations.mdc` 與 skill `apply-supabase-migration`。

## 讀檔階梯

預設只靠本檔。問未做 → `docs/BACKLOG.md`「進行中／未完成」。做主題 → 該列 `docs/backlog/<topic>.md`（＋現行 `docs/plans/`）。  
`docs/audits/`／已完成 plans：除非對對抗、查決策、或用戶點名，否則唔開。  
其餘索引由 `docs/` 自行尋，唔好預讀。
