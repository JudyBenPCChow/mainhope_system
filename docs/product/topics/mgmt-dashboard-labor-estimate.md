# 營運總覽：未結算導師人工預估

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-09-08） |
| 優先 | 中 |
| 範圍 | `/MgmtDashboard` 毛利／毛利率（及純利減項）：未結算月份以計糧草稿 `payroll_runs.snapshot` 當預估工資 |
| 不含 | 成本分析 `/HkExpenses`（只計已確認日記帳）；員工績效；觸發 live 重算；改計糧結算／過帳 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 觸發 | 2026-09-08：計糧草稿快取已落地，管理層要月中睇毛利，唔好一直「—」 |
| 相關 | [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 4 · [`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md) · [`hk-expense-cost-stats.md`](./hk-expense-cost-stats.md) · [`intelligence-analytics-ia-review.md`](./intelligence-analytics-ia-review.md) |

## 開工閘

對上一個工程（營運總覽重整／計糧草稿快取）已關帳。本題唔改 `mgmt-dashboard-overhaul.md`。

## 目標（一句）

未有已結算過帳人工時，營運總覽用計糧草稿當預估工資顯示毛利；有確實過帳則用過帳數。

## 產品規則

1. **已結算過帳**（費用帳 `labor_tutor`＋僱主強積金）永遠優先，與現況相同。
2. **未過帳但有計糧草稿**（`payroll_runs.snapshot` 有老師列）：毛利／毛利率用草稿合計（薪酬＋僱主強積金；已排除老師不計）；標籤「預估」；純利在已確認開支之上再減同一筆預估人工，避免純利高於毛利。
3. **未過帳且無草稿**（本月從未開計糧或尚無計算）：毛利維持「—」。
4. **只讀草稿**，唔呼叫 `loadPayrollWorkbench`、唔 live 重算、唔寫 `calc_at`。
5. **成本分析、日記帳**仍然只顯示已確認列；預估唔入帳。
6. 草稿過期（計糧頁會重算）唔影響總覽：總覽顯示當時快照，文案寫明尚未結算。

## 關帳

2026-09-08：營運總覽未過帳月份讀計糧草稿預估；成本分析／日記帳仍只計已確認列。

## 相關

- 計糧草稿 TTL／重算：[`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 4
- 指標 15–20：[`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)
