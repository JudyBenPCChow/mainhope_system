# HK 成本統計（儀表板＋入帳）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（計劃已 rev；未開工 migration／UI） |
| 優先 | 中 |
| 範圍 | HK 公司開支日記帳＋月度儀表板；歷史 Excel∪Notion 合併匯入後改系統入帳 |
| 不含 | CN、收據／OCR、報銷工作流、複式、與績效／計糧自動對賬、雙源自動去重、繼續用 Excel／Notion 做日常入帳 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 實作計劃 | [`2026-08-04-hk-expense-cost-stats.md`](../plans/2026-08-04-hk-expense-cost-stats.md) |
| 路由（預定） | `/HkExpenses`；側欄「智能分析 → 成本統計」（manager／alien） |

## 目標

- manager／alien：系統入帳、規則建議、人手確認、void
- 儀表板只計 `confirmed` 且未 void（口徑：現金／付款日；唔係績效／計糧／損益）
- 歷史：Excel HK 月表＋Notion「明學日記帳」CSV → 一律 `pending_review`

## 已定案（2026-08-04）

- Excel／Notion **只係歷史資料**；匯入後停用兩本帳入新單，之後只用系統
- 歷史「已報銷／員工先付」**不理**；唔加報銷狀態欄（`staff_advance` 只當支付渠道）
- 雙源可能重疊 → **唔**自動對銷；覆核時人手 void
- 角色：manager／alien 可讀寫；admin／teacher／finance 無側欄；RLS 唔用 `is_mgmt_staff()`
- 禁硬刪；`confirmed` 鎖金額／日期／科目（改類先 reopen）

## Notion 日記帳帶出的計劃修正

來源：本機匯出 `明學日記帳紀錄`（約 150 筆，2025-04～2026-08）；唔入 repo。

| 點 | 處理 |
| --- | --- |
| 支付：Cashbox／公司卡／員工先付 | 正規化 `pay_method`＋與 Excel 對照 |
| 說明常垃圾、真內容在「報銷相關紀錄」 | 匯入擇優／互寫 `title`／`notes` |
| 「其他費用／功課班」混租金、工資、退學費 | title 規則優先；類別只做次級建議 |
| 退學費／退班 | 最高優先 pending＋退款 hint，唔建議當成本 |
| 「清潔劑」 | 勿被「清潔」規則當成清潔費 |
| 圖片、已報銷欄 | 本期丟棄（可選檔名入 `receipt_label` 文字） |

## 下一步（實作）

1. Migration（三表＋seed ledger／rules 含 Notion 增補＋RLS＋trigger）→ `npm run db:apply -- <檔>`
2. `expenseCategorySuggest`／`expensePayMethod`／`expenseQueries`／`expenseImport`
3. `/HkExpenses`＋側欄
4. 儀表板 KPI／文案／待覆核警告
5. Excel＋Notion 歷史合併匯入；抽樣驗收（退款／租金／清潔劑／冪等）

## 相關

- 員工績效 `/StaffPerformance`
- 計糧 [`payroll-engine.md`](./payroll-engine.md)
- 角色 [`mgmt-manager-role.md`](./mgmt-manager-role.md)
