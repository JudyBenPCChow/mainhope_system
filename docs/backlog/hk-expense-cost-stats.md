# HK 成本統計（儀表板＋入帳）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（7 月：非薪金已確認；計糧已結算＋`payroll_settle` 已過帳；歷史薪金已 void；Cody 非計糧人工 $420 已補；剩按金待定；非老師人工流程未產品化；純利另題） |
| 優先 | 中 |
| 範圍 | HK 管理分析用成本帳；計糧結算過帳；預留將來純利組合 |
| 不含 | 本期純利頁、CN、OCR、報銷、複式、間接攤分、繼續用 Excel／Notion 日常入帳 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 實作計劃 | [`2026-08-05-hk-expense-cost-stats.md`](../plans/2026-08-05-hk-expense-cost-stats.md) |
| 舊計劃（已取代） | [`2026-08-04-hk-expense-cost-stats.md`](../plans/2026-08-04-hk-expense-cost-stats.md) |
| 路由 | `/HkExpenses`；側欄「智能分析 → 成本統計」（manager／alien） |

## 目標（一句）

為管理層建立可分析嘅成本資料面（總成本／結構／老師人工）；人工由計糧已結算自動過帳；其他開支系統入帳；歷史只係過渡灌數；模型預留將來「收入 × 成本 → 純利」。

## 已完成（7 月／基盤）

- Schema／UI／計糧結算 → `payroll_settle` 過帳（冪等）  
- 7 月非薪金歷史覆核確認  
- 7 月計糧 **已結算**；`payroll_settle` 人工已入成本帳（約 19 筆 live）  
- 7 月歷史薪金類（標題含「6月」等）已 void，避雙計  
- **Cody（財務／非老師）**：唔入 `teachers`／計糧頁；成本帳直接補 `labor_non_payroll` **$420**（7h × $60；`origin_key` `manual|2026-07|cody-cheong|labor_non_payroll|wfh-7h`；2026-08-08）

## 下一步（未完成）

1. **產品決定**：「綠悠軒17CD 按金及上期租金」$27,307（`spent_on` 2026-07-06，仍 `pending_review`）——整筆 void（按金／非成本）定係拆租金入帳？另有「綠悠軒17D/E 租金按金」$15,000（6 月）亦仍 pending。  
2. **非老師人工（產品缺口）**：科目 `labor_non_payroll` 已有；入帳靠人手／DB。未有工時→審批→自動過帳流（Cody／Carol 前台等）。長遠要定：獨立職員模型 vs 繼續人手。  
3. **其餘月（4–6）**：歷史 pending 覆核／確認可另波。  
4. **純利頁**：另題（本期不做）。

腳本：`scripts/import_hk_expense_history.py`（原料：`import-output/hk-expense-raw/`）。

## 相關

- 計糧 [`payroll-engine.md`](./payroll-engine.md)
- 員工績效（毛利）`/StaffPerformance`
- 角色 [`mgmt-manager-role.md`](./mgmt-manager-role.md)
