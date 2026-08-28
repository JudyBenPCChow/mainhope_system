# 管理員桌面三欄右欄

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（沙盒試樣式；**未拍板唔改正式 Layout**） |
| 優先 | 低 |
| 範圍 | 管理員桌面：左導航＋主欄＋可摺疊右欄（釘學生資料＋快捷導航） |
| 角色 | 只 **管理員** `admin`；不含管理層／財務／老師。外星人以後可作 QA |
| 不含 | 流動裝置、右欄內嵌完整工作流（例如直接出單）、班／老師釘住、改收款頁內右欄 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 沙盒 | 免登入 [`/prototype/AdminContextRail`](../../../src/pages/PrototypeAdminContextRail.tsx)（假資料，不接 DB／正式路由） |

## 開工閘

無對上未完成工程擋路。正式殼（`Layout.tsx`）**未拍板前唔改**。只准改 `src/prototypes/adminContextRail/` 同此分題。

## 結論（已拍板，樣式仍待沙盒確認）

- 幾何：tri-pane。職責：上截 pinned context、下截 utility 快捷。開關跟 Cursor（撳摺疊符號；開住就留住；**唔用 hover**）。
- 釘資料同快捷係兩種性質，共用一條右欄。快捷＝帶學生去現有頁，唔喺右欄複製表單。
- 可用寬度下降＝用家選擇（開就佔、摺就還），同左欄一樣。

## 沙盒對照（移植時）

| 沙盒 | 正式 |
| --- | --- |
| [`SandboxShell.tsx`](../../../src/prototypes/adminContextRail/SandboxShell.tsx) | [`Layout.tsx`](../../../src/components/Layout.tsx) 加右 `aside`（僅 admin） |
| [`ContextRail.tsx`](../../../src/prototypes/adminContextRail/ContextRail.tsx) | 新 `src/components/contextRail/ContextRail.tsx` |
| PrototypeView 內 `pinned` state | `PinnedContextProvider` 包住 `<Outlet />`，切路由唔卸載 |
| [`mockData.ts`](../../../src/prototypes/adminContextRail/mockData.ts) | `studentQueries`；Layout 唔直接打 DB |
| 學生／班別沙盒頁 | **唔搬**；正式列表只加「固定」掣 |
| `/prototype/AdminContextRail` | 確認樣式後可留作回歸，或刪 |

## 待決（樣式確認後）

1. 右欄寬（而家沙盒 `22.5rem`）同摺疊手柄要唔要改。
2. 快捷目錄（而家：詳情／收款登記／繳費紀錄／請假／出席）。
3. 收款頁內已有學生上下文，會唔會同殼右欄重複。

## 待做

1. 沙盒確認樣式（本檔現況）
2. 拍板後先空殼右欄入 `Layout`，再釘學生＋學生列表「固定」
