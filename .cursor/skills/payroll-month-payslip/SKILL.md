---
name: payroll-month-payslip
description: >-
  從 production 即時計算某月工資單 PDF（對話出糧，不上計糧頁），
  並可在核對後把該月記為已結算、過帳成本帳。
  Use when the user says 出工資單、出糧、上月工資單、計糧、記為已結算、過帳人工。
---

# 對話出工資單／結算過帳

系統沒有計糧頁。出糧改對話：即時計算 → 合併 PDF → 核對後結算過帳。公式跟 [`docs/policies/staffing/PAYROLL_GUIDE.md`](../../../docs/policies/staffing/PAYROLL_GUIDE.md)。

無查庫權限／無寄信金鑰：**停、通知使用者**。見 `no-forced-output-without-access.mdc`、`agent-mail.mdc`。不要用舊 JSON 充當本月數。改了 production 業務資料後跑 `agent-db-change-notify`。

## 出工資單

```bash
node scripts/export_payroll_month_payslips.mjs YYYY-MM
```

只出 JSON（稍後結算用）：

```bash
node scripts/export_payroll_month_payslips.mjs YYYY-MM --json-only
```

產出：`docs/generated/payroll/YYYY-MM/YYYY-MM_工資單.json` 與合併 PDF。

- 預設月份＝上一個曆月。用戶指定則用指定月。
- **寄一份合併 PDF**。不要寄全月 zip（易超過電郵上限）。
- 合併檔超過約 20MB：拆兩封，或只寄總表＋未點名、完整明細改對話下載。
- 正文列出未點名／硬阻擋的人。單人 PDF 只在用戶點名某人時另附。
- 未說「寄出」就不要寄。

回覆：人數、總薪酬、實收、未點名／硬阻擋名單、PDF 路徑。

## 結算過帳

只在用戶本則明確要求「記為已結算／過帳」且已核對該月 PDF 後：

```bash
node scripts/settle_payroll_month.mjs YYYY-MM
```

可先 `--dry-run`。腳本讀剛產出的 JSON：金額 0 略過；`hardBlock`（未點名／缺費率）不過帳；其餘凍結快照並插入 `labor_tutor`／`labor_employer_mpf`（`origin_key` 冪等）。已結算月份拒絕覆寫。

不要改七至十月已確認成本列。

## 在家工作／功輔工時

月內核准時數：寫 `payroll_manual_hours`（`status=approved`；額外時薪寫在備註，例如「時薪100」）。功輔合計工時修正寫 `payroll_homework_hour_overrides`。然後重出工資單。
