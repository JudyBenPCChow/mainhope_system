# HK 成本統計（儀表板＋入帳）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（7 月：非薪金已確認；計糧已結算＋`payroll_settle` 已過帳；歷史薪金已 void；Cody 非計糧人工 $420 已補；**7 月按金已決 void 不作成本（帳上仍待 UI 作廢）**；非老師人工未產品化；**4–6 月分析不做**） |
| 優先 | 中 |
| 範圍 | HK 管理分析用成本帳（**2026-07 起**）；計糧結算過帳；預留將來純利組合 |
| 不含 | 本期純利頁、CN、OCR、報銷、複式、間接攤分、繼續用 Excel／Notion 日常入帳、**2026-06 及之前月份分析** |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 實作計劃 | [`2026-08-05-hk-expense-cost-stats.md`](../plans/2026-08-05-hk-expense-cost-stats.md) |
| 舊計劃（已取代） | [`2026-08-04-hk-expense-cost-stats.md`](../plans/2026-08-04-hk-expense-cost-stats.md) |
| 路由 | `/ExpenseJournal`、`/ExpenseJournalRecords`（日記帳；admin／manager／alien）；`/HkExpenses` 成本分析（manager／alien） |

## 目標（一句）

為管理層建立可分析嘅成本資料面（總成本／結構／老師人工）；人工由計糧已結算自動過帳；其他開支系統入帳；歷史只係過渡灌數；模型預留將來「收入 × 成本 → 純利」。

## 已完成（7 月／基盤）

- Schema／UI／計糧結算 → `payroll_settle` 過帳（冪等）  
- 行政日記帳：前台科目（文具／教材／團建／印刷）可見可入、入帳即確認；租金／人工／水電等管理層科目行政睇唔到；入帳可選上載收據附件（Storage）  
- 7 月非薪金歷史覆核確認  
- 7 月計糧 **已結算**；`payroll_settle` 人工已入成本帳（約 19 筆 live）  
- 7 月歷史薪金類（標題含「6月」等）已 void，避雙計  
- **Cody（財務／非老師）**：唔入 `teachers`／計糧頁；成本帳直接補 `labor_non_payroll` **$420**（7h × $60；`origin_key` `manual|2026-07|cody-cheong|labor_non_payroll|wfh-7h`；2026-08-08）

## 下一步（未完成）

1. **7 月按金（已決）**：「綠悠軒17CD 按金及上期租金」$27,307（`spent_on` 2026-07-06，`pending_review`）——**整筆 void、不作成本**（2026-08-23；不拆上期租金）。帳上仍未作廢（`expenses.void` 權限）；成本統計／純利**當已剔出**。  
2. **6 月按金（非分析）**：「綠悠軒17D/E 租金按金」$15,000（`spent_on` 2026-06-01，仍 pending）＝校舍 **17D＋17E 課室租金按金**（資產／可退，唔係租金開支）。**2026-06 及之前唔做成本／純利分析**；此筆只處理會唔會污染 7 月起開支。現況 `pending_review` 且已 void 嘅列唔入 confirmed 合計，故**未污染 7 月 confirmed 開支**；建議同樣 UI 作廢以免一直掛住覆核。  
3. **非老師人工（產品缺口）**：科目 `labor_non_payroll` 已有；入帳靠人手／DB。未有工時→審批→自動過帳流（Cody／Carol 前台等）。長遠要定：獨立職員模型 vs 繼續人手。  
4. **4–6 月歷史覆核**：**不做**（分析窗 2026-07 起）。  
5. **純利頁**：另題（本期不做）。營運總覽指標 15–20 **已落地**（[`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 1–3）；7 月按金已決不作成本。

腳本：`scripts/import_hk_expense_history.py`（原料：`import-output/hk-expense-raw/`）。

## 相關

- 計糧 [`payroll-engine.md`](./payroll-engine.md)
- 員工績效（毛利）`/StaffPerformance`
- 營運總覽 KPI（毛利／純利列）：[`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)
- 角色 [`mgmt-manager-role.md`](./mgmt-manager-role.md)
