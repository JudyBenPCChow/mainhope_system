# 計糧／營運總覽載入偏慢

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（已診斷；稍後開工） |
| 優先 | 中 |
| 範圍 | `/Payroll`、`/MgmtDashboard` 體感載入；可選主 bundle 再切 |
| 不含 | 軟封存／查詢收窄本體（互補另題）；物理 archive 表 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 相關 | [`soft-archive-query-scope.md`](./soft-archive-query-scope.md)、[`payroll-engine.md`](./payroll-engine.md)、[`mgmt-manager-role.md`](./mgmt-manager-role.md) |
| 記錄 | 2026-08-06 用戶反映計糧／營運總覽慢；代碼路徑診斷 |
| 技術債歸屬 | 2026-08-14 全盤檢視 P2-2；沿用本題，不另開重複工程 |

## 目標（一句）

確認慢因主要喺網頁查詢／重算設計（非純用戶端），之後用少打 API、按需載、計糧快取改善體感。

## 診斷摘要（2026-08-06）

**結論**：主要係站方問題；差網絡會加重，但根因喺設計。

### 計糧 `/Payroll`

- 入口：`PayrollView` → `loadPayrollWorkbench(monthKey)`。
- **已結算**：讀 snapshot＋少量 metadata → 快。
- **未結算（常見）**：每次進入 **live 重算**——月內全部排程、點名、`fetchScheduleRosterContext`、enrollment chunks，再 client `computePayrollMonth`；並 `UPDATE calc_at`。
- 熱點：`src/services/payrollQueries.ts`（`buildLessonInputsForMonth`／`loadPayrollWorkbench`）、`scheduleRosterQueries.ts` roster RPC。

### 營運總覽 `/MgmtDashboard`

- `MgmtDashboardView`：先 `fetchMgmtDashboardSummary`，再 `fetchMgmtDashboard` —— **兩階段串行且大量查詢重複**。
- Full phase 另含 `fetchMisalignedLessonBalances`（全量就讀＋排程）、全表 `students`、出席分頁掃等。
- 服務：`src/services/mgmtDashboardQueries.ts`、`pendingLessonQueries.ts`。

### 首次開站

- 主 JS 約 2.7MB（gzip ~0.8MB）；營運總覽／recharts 多數仍喺主包（lazy 頁 wrapper 極細）。對「第一次入站」有影響；內頁慢仍以資料為主。

### 與軟封存關係

- **互補、唔等同**。軟封存＝冷資料／已畢業／舊學年預設少 load。
- 軟封存可略減營運總覽全表掃體積；**解決唔到**計糧當月 live 重算、summary／full 重複、堂數不符熱路徑、主 bundle。
- 唔好等軟封存當本主題完成。

## 建議方向（開工時）

優先（易見效、產品可接受）：

1. **營運總覽**：合併為單次 fetch（KPI 先 paint 可留，但唔好重打同一輪）；堂數不符／大表改按需。
2. **計糧未結算**：顯示上次計算＋「重新計算」；短 TTL 快取；避免每次無謂 `UPDATE calc_at`。
3. 可選：payments／attendance／students KPI 改 DB 聚合 RPC；主 bundle 再切 recharts／mgmt。

## 下一步

1. 開工前確認產品：計糧可接受「快取＋手動刷新」定必須每次最新。
2. 先做營運總覽去重＋重活按需，再做計糧快取。
3. 寫實作 plan（`docs/product/plans/`）後改狀態 `in_progress`。
