# AGENTS.md — 明學（MainHope）行政後台

**對使用者回覆：只用繁體中文書面語，不得使用粵語口語。** 不可生造口語產品名（例如「走堂一次」「班主」「客人」當學生）。介面、文件、訊息的用詞與自稱、班型見 `.cursor/rules/terminology.mdc`（員工定義：`docs/meta/TERMINOLOGY.md`）。改術語須同步兩份並審閱營運文件（`.cursor/rules/terminology-sync.mdc`）。程式識別字維持英文。既有文件若以粵語書寫，可讀、可引用，但回覆與新寫內容須改為書面語。

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
2627 **時間表方案工程已完**（ver. 4.0 簽收）。其後加班／改班只入系統（班別＋排程），**不要** bump 4.x、**不要**出 md／docx／pdf。見 `.cursor/rules/2627-timetable-doc.mdc`。  
樣式沙盒（使用者說「沙盒」）：第一件可雙擊 HTML（`sandbox/<名>/index.html`）。見 `.cursor/rules/ui-sandbox-html.mdc`。

## 新增功能

路由 `App.tsx` + 側欄 `src/lib/navStructure.ts`（含 roles）同步改。  
頁面：`pages/` → `components/<領域>/` → `services/`。  
大量 UUID 用 `forEachIdChunk`。一對一列表在 `/PrivateTutoring`。

## 鐵則

- **UI**：共用 `Select`/`MultiSelect`、`Tag`+`statusToTagTone`、日期 `Input type="date"`；禁 `alert`/`confirm`/原生 `<select>`。淺底警示用 `text-warning`，禁 `bg-warning/10` + `text-warning-foreground`（白字）。詳見 `docs/meta/UI_DESIGN_INSTRUCTIONS.md` §9。
- **RLS**：改 schema 必檢 RLS；anon key 在瀏覽器。見 `docs/meta/RLS_ROLLOUT.md`。
- **角色**：`localStorage.mgmt_role` ≠ Auth；讀權限 manager ≥ admin（`finance` 可讀職員資料、入口收窄至計糧／繳費＋排程／出席核對）；分流見 `docs/product/topics/mgmt-manager-role.md`／計糧見 `docs/product/topics/payroll-engine.md`。
- **代堂**：只改該堂 `schedules.teacher_id`，勿改 `classes.teacher_id`。見 `docs/policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md`。
- **`makeup_of=`：不要刪。** `schedules.remarks` 標記（`makeup_of=<取消堂id>`）不要從程式抽走，也不要清除 `26SM` 歷史。`2627` 點名紙不靠它入場，但安排補回靠它查重。見 `.cursor/rules/makeup-of-marker.mdc`。
- **2627 專科排程**：跟 `docs/year/2627/ops-guide.md` 附件甲。每星期幾扣假後 **40** 堂（十期×四）；最後上課日 **2027-06-28**。不要用 `academic_years.end_date`（6/30）當專科最後一堂——6/29、6/30 專科已完課（功輔仍開）。假期列「取消」＝校舍該日沒有課堂，不是需要補回的取消堂。見 `.cursor/rules/2627-timetable-doc.mdc`。
- **查庫／模擬運作**：不要把空班、暑期未續常規、學期結束仍「就讀中」、未繳仍出現在點名紙當成缺陷。見 `.cursor/rules/ops-data-check.mdc`。
- **Migration**：寫完即單檔套用；優先 `npm run db:apply -- <檔>`；禁全量 `db push`。見 `.cursor/rules/supabase-migrations.mdc` 與 skill `apply-supabase-migration`。
- **Feature 熱檔**：不要 commit `BACKLOG.md` 索引表（只在 `main` 搬列；分題表頭狀態＝該題真源）。不要帶 `dist/`、`docs/generated/**`。`ops-guide` 只在本題 PR 才改。見 `.cursor/rules/feature-branch-hot-files.mdc`。
- **Git 收尾**：合入 `main` 後由 agent 對齊 `main`、刪該題 branch／worktree，不要叫使用者下次記得。見 `.cursor/rules/git-hygiene.mdc` 與 skill `git-branch-closeout`。

## 讀檔階梯

文件總門牌：`docs/README.md`（政策／操作／學年／工程／meta 四門）。  
預設只靠本檔。問未做／可否開工 → 讀 **`origin/main` 的** `docs/product/BACKLOG.md`「進行中／未完成」（`git show origin/main:docs/product/BACKLOG.md`）；讀不到就掃 `docs/product/topics/*.md` 表頭狀態 `open`／`in_progress`。問卡住／在等什麼 → 同檔「等待中」（未解除不開工）。做主題 → `docs/product/topics/<topic>.md`（改狀態寫分題，**不要**改 BACKLOG）。**先讀分題「開工閘」**：對上一個工程未完成則停、提醒使用者，不開工。  
步驟寫在分題；不另開 `plans/`／`audits/`。  
營運規則 → `docs/policies/`；前線操作 → `docs/playbooks/`；本年物料 → `docs/year/2627/`。其餘不要預讀。

**MD↔DOCX：** 改 `docs/year/2627/ops-guide.md`（或其他有成對 `.docx` 的營運 md）正文時，同一輪用對應腳本重出 docx（見 `.cursor/rules/md-docx-sync.mdc`）。  
**術語：** 改用詞／定義時同步 `docs/meta/TERMINOLOGY.md` 與 `.cursor/rules/terminology.mdc`，並審閱政策／playbooks／2627 指引（見 `.cursor/rules/terminology-sync.mdc`）。  
**政策鏡像（E4）：** 改 `docs/policies/` 或 `docs/year/*/ops-guide.md` 正文時，同一輪跑 `scripts/sync_policies_to_vault.sh` 把全文鏡像入 `Mainhope_admin/60-政策與流程/系統鏡像/`（vault 人手零雙寫；script 同時更新 vault 政策筆記的「系統現況」標記）。
