# 行政首頁：今日校舍＋右側常用工作

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | 行政 `admin` 登入後 `/Home`（`AdminDashboard`）：主欄今日課堂與請假；桌面右側常用工作欄（新生登記／收款登記／登記請假） |
| 不含 | 側欄 8 列；收件匣位置或預設分頁；老師／管理層／財務首頁；跨流程待辦佇列；課室占用熱圖；欄內嵌收款／請假表單 |
| 原型 | [`sandbox/admin-home-ia/index.html`](../../../sandbox/admin-home-ia/index.html) |
| 對照 | 側欄殼 [`sidebar-hub-ia.md`](./sidebar-hub-ia.md)；學生簡單頁 [`admin-desktop-context-rail.md`](./admin-desktop-context-rail.md)；管理層首頁 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) |

## 開工閘

側欄 IA 未正式畫面驗收**不擋**本題。本題不改 [`adminNavigation.ts`](../../../src/lib/adminNavigation.ts)。

## 產品意圖

行政首頁是**今日校舍狀況**，不是管理中心入口網站，也不是管理層營收儀表板。

- 頁標題分類字：**主頁**。
- 主欄（不含右側常用工作）：兩欄。左為今日課堂＋請假；右較寬為唯讀日視圖（`DayViewGrid`，不可拖曳）。換日兩邊同步。
- 桌面右側：仍用 [`RecordPreviewRail`](../../../src/components/recordPreview/RecordPreviewRail.tsx) 殼。摺疊後不留右側窄條；頂部白條「常用功能」在行政各頁相同，可重開。內容為 [`HomeActionsPreviewPanel`](../../../src/components/home/AdminHomeActionRail.tsx)。點請假學生名則換成該生簡單頁。
- 欄內只連專頁，不內嵌表單（與學生預覽同一約束）。
- 手機：標題下三個主鍵，其下全日課堂與請假（無右側欄）。

## 常用工作

| 層 | 標籤 | 路徑 |
| --- | --- | --- |
| 主 | 新生登記 | `/FrontDeskWizard` |
| 主 | 收款登記 | `/Payments`（待收款筆數徽章） |
| 主 | 登記請假 | `/LeaveManagement` |
| 次（桌面） | 進行點名 | `/Attendance` |
| 次（桌面） | 試堂紀錄 | `/TrialSessions` |

## 不做

- 三分頁、十宮格快速功能、近 6 月營收、學生狀態圖、未繳長列表
- 復活 `/prototype/HomeWayfinding`
- 改管理層 `/Home` 或側欄 8 列

## 實作位置

- 首頁：[`AdminDashboard.tsx`](../../../src/components/home/AdminDashboard.tsx)
- 右側欄：[`RecordPreviewRail.tsx`](../../../src/components/recordPreview/RecordPreviewRail.tsx)＋[`HomeActionsPreviewPanel`](../../../src/components/home/AdminHomeActionRail.tsx)
- 今日課堂／請假：[`DashboardBoard.tsx`](../../../src/components/home/DashboardBoard.tsx)
- 資料：[`dashboard.ts`](../../../src/services/dashboard.ts)

## 驗收

- [ ] 行政登入後主欄先見今日堂與請假
- [ ] 桌面右側三主鍵可進精靈／收款／請假
- [ ] 手機只有頂部三鍵＋全日列表
- [ ] 管理層首頁不變
