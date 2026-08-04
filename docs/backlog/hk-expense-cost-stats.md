# HK 成本統計（儀表板＋入帳）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（計劃已 rev；未開工 migration／UI） |
| 優先 | 中 |
| 範圍 | HK 公司開支日記帳＋月度儀表板；歷史 Excel∪Notion 合併匯入後改系統入帳 |
| 不含 | CN、收據／OCR、報銷工作流、複式、與績效／計糧自動對賬、雙源自動去重 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 實作計劃 | [`2026-08-04-hk-expense-cost-stats.md`](../plans/2026-08-04-hk-expense-cost-stats.md) |

## 目標

- manager／alien：入帳、規則建議、人手確認、void
- 儀表板只計 `confirmed` 且未 void
- 歷史：Excel HK 月表＋Notion「明學日記帳」CSV → `pending_review`

## 已定案（2026-08-04）

- Excel／Notion **只係歷史**；之後只用系統入帳
- 歷史「已報銷」**不理**；唔加報銷狀態欄
- 雙源可能重疊 → 唔自動對銷；覆核時人手 void
- Notion 修正已寫入計劃 §1.1（支付正規化、標題品質、退款規則、類別次級建議、清潔劑勿當清潔費）

## 下一步

1. Migration（三表＋seed＋RLS＋trigger）→ `npm run db:apply -- <檔>`
2. `expenseCategorySuggest`／`expensePayMethod`／`expenseQueries`／`expenseImport`
3. `/HkExpenses`＋側欄「成本統計」
4. 儀表板文案／KPI
5. 雙源歷史匯入＋抽樣驗收（退款／租金／重複）

## 相關

- 員工績效 `/StaffPerformance`
- 計糧 [`payroll-engine.md`](./payroll-engine.md)
- 角色 [`mgmt-manager-role.md`](./mgmt-manager-role.md)
