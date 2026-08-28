# Session HANDOFF：管理員桌面三欄右欄沙盒

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-28 |
| 主題／backlog | [`admin-desktop-context-rail.md`](../../product/topics/admin-desktop-context-rail.md)（BACKLOG 低／open） |
| 分支／工作樹 | `cursor/cloud-agent-1787954165945-ptsrv`；已 push；HEAD `33e9c599`。工作樹只餘 `node_modules` 髒檔，唔好 commit |
| 驗證 | CI 三項綠（commit `33e9c599`）。獨立 HTML 用 Playwright 驗過摺疊／釘學生／切班別仍在。Vite 路由 `/prototype/AdminContextRail` 喺呢條 branch 嘅 `npm run dev` 可用；**本機 `main` 開呢條路由會空白** |
| PR | https://github.com/JudyBenPCChow/mainhope_system/pull/38 （draft） |

## 目標

- 討論管理員桌面兩欄→三欄（可摺疊右欄：釘學生＋快捷）。
- 先用沙盒試樣式，**未拍板唔改正式 `Layout.tsx`**。

## 已完成

- 設計已拍板（寫入分題）：tri-pane；上截 pinned context、下截 shortcut 導航；開關跟 Cursor（撳先開／開住就留；**否決 hover**）；只限 `admin`；快捷唔內嵌收款表單。
- React 沙盒：`src/prototypes/adminContextRail/`；路由 `/prototype/AdminContextRail`（免登入，假 10 學生／10 班）。
- 獨立 HTML（本機應開呢個）：`sandbox/admin-context-rail/index.html`；`npm run sandbox:context-rail` → http://localhost:4179/ ；Vite 靜態 `public/admin-context-rail.html` → `/admin-context-rail.html`。
- 右欄摺疊改成接縫手柄（摺住顯示姓氏圓標）。

## 未完成／卡住

- **樣式未由用戶簽收**；未移植入正式殼。
- Vercel preview 有 Deployment Protection（會跳 Vercel 登入），唔好當公開試用網址。
- 待決仍喺分題：右欄寬、快捷目錄、收款頁內已有學生上下文會否重複。

## 下一步（給新會話）

1. 等用戶用獨立 HTML（或呢條 branch 嘅 `/admin-context-rail.html`）確認樣式；有改就只改沙盒，唔改 `Layout.tsx`。
2. 用戶拍板後先空殼右欄入 `Layout`（僅 `role === "admin"`），再釘學生＋學生列表「固定」；state 掛 Layout／Outlet 之上。
3. 收款頁 `renderStudentContextPanel` 去留另拍板。

## 開局必讀（精簡）

- `AGENTS.md`
- [`docs/product/topics/admin-desktop-context-rail.md`](../../product/topics/admin-desktop-context-rail.md)
- 試畫面：`sandbox/admin-context-rail/index.html`（移植對照表喺分題）

## 勿再踩

- 用戶要「HTML 沙盒／唔接真實網頁」時，**第一件產出獨立 HTML**（仿 `sandbox/tuition-quote/`），唔好只掛 `/prototype/…` Vite 路由。
- 本機 `main` 開 `/prototype/AdminContextRail`＝React Router 無匹配＝**全白**；Vercel preview URL 可能要登入。
- 唔好把呢題做到 `feat/admin-expense-journal`；唔好 commit `node_modules`。
- 唔用 hover 展開右欄（同「主欄操作時仍見到釘資料」對立）。

## 明確唔做

- 未拍板：改 `Layout.tsx`／流動裝置／右欄內嵌出單／釘班或老師／當授權或 IA1 側欄入口。
- 唔寫行政完工摘要（呢份係 session 交接）。
