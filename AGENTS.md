# AGENTS.md — 明學（MainHope）行政後台

介面用語：**繁體中文**。文案／自稱／班型：`.cursor/rules/terminology.mdc`（員工定義：`docs/meta/TERMINOLOGY.md`）。改術語須同步兩份並審營運文件（`.cursor/rules/terminology-sync.mdc`）。

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
2627 時間表方案：先出 md；用戶要求先出 docx／pdf（Word 內建目錄另存）。4.x 自動加版。見 `.cursor/rules/2627-timetable-doc.mdc`。  
樣式沙盒（用戶講「沙盒」）：第一件可雙擊 HTML（`sandbox/<名>/index.html`）。見 `.cursor/rules/ui-sandbox-html.mdc`。

## 新增功能

路由 `App.tsx` + 側欄 `src/lib/navStructure.ts`（含 roles）同步改。  
頁面：`pages/` → `components/<領域>/` → `services/`。  
大量 UUID 用 `forEachIdChunk`。一對一列表在 `/PrivateTutoring`。

## 鐵則

- **UI**：共用 `Select`/`MultiSelect`、`Tag`+`statusToTagTone`、日期 `Input type="date"`；禁 `alert`/`confirm`/原生 `<select>`。詳見 `docs/meta/UI_DESIGN_INSTRUCTIONS.md`。
- **RLS**：改 schema 必檢 RLS；anon key 在瀏覽器。見 `docs/meta/RLS_ROLLOUT.md`。
- **角色**：`localStorage.mgmt_role` ≠ Auth；讀權限 manager ≥ admin（`finance` 可讀職員資料、入口收窄至計糧／繳費＋排程／出席核對）；分流見 `docs/product/topics/mgmt-manager-role.md`／計糧見 `docs/product/topics/payroll-engine.md`。
- **代堂**：只改該堂 `schedules.teacher_id`，勿改 `classes.teacher_id`。見 `docs/policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md`。
- **Migration**：寫完即單檔套用；優先 `npm run db:apply -- <檔>`；禁全量 `db push`。見 `.cursor/rules/supabase-migrations.mdc` 與 skill `apply-supabase-migration`。

## 讀檔階梯

文件總門牌：`docs/README.md`（政策／操作／學年／工程／meta 四門）。  
預設只靠本檔。問未做／可開工 → `docs/product/BACKLOG.md`「進行中／未完成」。問卡住／等緊咩 → 同檔「等待中」（未解除唔開工）。做主題 → 該列 `docs/product/topics/<topic>.md`（＋現行 `docs/product/plans/`）。**先讀分題「開工閘」**：對上一個工程未完成則停、提醒用戶，唔開工。  
`docs/product/audits/`／已完成 plans：除非對對抗、查決策、或用戶點名，否則唔開。  
營運規則 → `docs/policies/`；前線操作 → `docs/playbooks/`；本年物料 → `docs/year/2627/`。其餘唔好預讀。

**MD↔DOCX：** 改 `docs/year/2627/ops-guide.md`（或其他有成對 `.docx` 的營運 md）正文時，同一輪用對應腳本重出 docx（見 `.cursor/rules/md-docx-sync.mdc`）。  
**術語：** 改用詞／定義時同步 `docs/meta/TERMINOLOGY.md` 與 `.cursor/rules/terminology.mdc`，並審閱政策／playbooks／2627 指引（見 `.cursor/rules/terminology-sync.mdc`）。  
**政策鏡像（E4）：** 改 `docs/policies/` 或 `docs/year/*/ops-guide.md` 正文時，同一輪跑 `scripts/sync_policies_to_vault.sh` 把全文鏡像入 `Mainhope_admin/60-政策與流程/系統鏡像/`（vault 人手零雙寫；script 同時更新 vault 政策筆記嘅「系統現況」標記）。
