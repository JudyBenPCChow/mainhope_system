# HK 成本統計（儀表板＋入帳）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（7 月非薪金已確認；剩按金 1 筆待定；計糧結算後驗薪金 void；純利頁另題） |
| 優先 | 中 |
| 範圍 | HK 管理分析用成本帳；計糧結算過帳；預留將來純利組合 |
| 不含 | 本期純利頁、CN、OCR、報銷、複式、間接攤分、繼續用 Excel／Notion 日常入帳 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 實作計劃 | [`2026-08-05-hk-expense-cost-stats.md`](../plans/2026-08-05-hk-expense-cost-stats.md) |
| 舊計劃（已取代） | [`2026-08-04-hk-expense-cost-stats.md`](../plans/2026-08-04-hk-expense-cost-stats.md) |
| 路由（預定） | `/HkExpenses`；側欄「智能分析 → 成本統計」（manager／alien） |

## 目標（一句）

為管理層建立可分析嘅成本資料面（總成本／結構／老師人工）；人工由計糧已結算自動過帳；其他開支系統入帳；歷史只係過渡灌數；模型預留將來「收入 × 成本 → 純利」。

## 下一步

1. 定「綠悠軒17CD 按金及上期租金」$27,307：整筆 void（按金／非成本）定係拆租金？  
2. `/Payroll` 7 月由「財務審閱中」→ 已結算後：重跑 ETL `--apply`（或等價 void SQL）驗歷史薪金雙計；儀表板應出現 `payroll_settle` 人工。  
3. 其餘月（4–6）pending 可另波；純利頁另題。

腳本：`scripts/import_hk_expense_history.py`（原料：`import-output/hk-expense-raw/`）。

## 相關

- 計糧 [`payroll-engine.md`](./payroll-engine.md)
- 員工績效（毛利）`/StaffPerformance`
- 角色 [`mgmt-manager-role.md`](./mgmt-manager-role.md)
