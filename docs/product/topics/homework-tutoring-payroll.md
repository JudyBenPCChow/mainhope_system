# 功輔計糧（時薪＋Christine 佣金）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（自計糧引擎拆出；規則未齊，**未拍板唔實作**） |
| 優先 | 中 |
| 範圍 | 功課輔導班導師**時薪**入 `/Payroll`；**Christine Fan** 功輔佣金（報讀人數門檻） |
| 不含 | 專科分成／HC／固定月薪／WFH／MPF（已喺 [`payroll-engine.md`](./payroll-engine.md)）；功輔產品月費／編更／側欄（見 [`homework-tutoring.md`](./homework-tutoring.md)）；財務核對 UX |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-29（自計糧引擎「暫緩」抽出） |
| 上次更新 | 2026-08-29 |
| 規格舊稿 | [`2026-08-01-payroll-method-revised.md`](../plans/2026-08-01-payroll-method-revised.md) §9（稿寫「功課班」＝功輔） |
| 營運指南 | [`PAYROLL_GUIDE.md`](../../policies/staffing/PAYROLL_GUIDE.md) §16（現階段不納入每月自動計算） |

## 開工閘（agent 必讀）

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| 收口規則（工時來源、時薪名單、佣金基數） | [`homework-tutoring.md`](./homework-tutoring.md) 波次 4b | **已開**：編更已寫 `schedules` 佔室；可同財務對規則 |
| 引擎實作 | 本題規則 | **未拍板唔寫計算／schema** |

唔好當 [`payroll-engine.md`](./payroll-engine.md) 未完成而重開該題。財務核對 UX **唔包**本題。

## 已記下（未實作）

1. **功輔時薪**：導師按當值工時計；費率／誰屬 $100／hr 名單、非標準時長未定。
2. **Christine Fan 功輔佣金**：當月功輔**報讀人數 ≥ 12** 先計 10%。收入基數（月費？應收？原價？）未定。

來源：計糧方法 §9.2；指南 §16。2627 產品期望總人數 ≥12、PT≥1，與佣金門檻同數字，但計糧門檻＝報讀人數，唔等於編制期望。

## 未定（要財務／營運拍板）

- 工時來源：已發布月工作表／`schedules` 當值？定要另報工時？
- 時薪名單同銀碼（vault 有歷史參數，唔當已簽收）
- 佣金 10% 嘅基數同月份切法
- 放假／惡劣天氣停課當日算唔算工時
- 計糧頁點展示（獨立列 vs 加落 Christine 分成）

## 相關

- 計糧引擎（已 done，專科主體）：[`payroll-engine.md`](./payroll-engine.md)
- 功輔產品：[`homework-tutoring.md`](./homework-tutoring.md)
- 代堂歸屬（專科）：[`substitute-teacher-reporting.md`](./substitute-teacher-reporting.md)
