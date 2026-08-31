# 功輔計糧（時薪＋Christine 佣金）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（2026-08-31 開工：時薪／工時／佣金已接 `/Payroll`；純功輔同事顯示「功輔時薪」） |
| 優先 | 中 |
| 範圍 | 功課輔導班導師**時薪**入 `/Payroll`；**Christine Fan** 功輔佣金（報讀人數門檻） |
| 不含 | 專科分成／HC／固定月薪／WFH／MPF（已喺 [`payroll-engine.md`](./payroll-engine.md)）；功輔產品月費／編更／側欄（見 [`homework-tutoring.md`](./homework-tutoring.md)）；財務核對 UX |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-29（自計糧引擎「暫緩」抽出） |
| 上次更新 | 2026-08-31 |
| 規格舊稿 |  §9（稿寫「功課班」＝功輔） |
| 營運指南 | [`PAYROLL_GUIDE.md`](../../policies/staffing/PAYROLL_GUIDE.md) §16（已納入每月計糧） |

## 開工閘（agent 必讀）

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| 收口規則（工時來源、時薪名單、佣金基數） | [`homework-tutoring.md`](./homework-tutoring.md) 波次 4b | **已開／已簽**。計糧頁佣金獨立列。 |
| 引擎實作 | 本題規則 | **已接**：時薪×編更工時、財務可改工時、放假不計、Christine ≥15／原價×10%；純功輔同事 mode＝功輔時薪 |

唔好當 [`payroll-engine.md`](./payroll-engine.md) 未完成而重開該題。財務核對 UX **唔包**本題。

## 已接線（2026-08-31）

1. **功輔時薪**：導師按當值工時計。2627 時薪名單 **2026-08-31 已簽**（見下表）。
2. **工時來源**：**默認取已發布編更**（該日各人 `session_start`–`session_end`）；財務可喺計糧時人手修正。
3. **放假／惡劣天氣停課當日不計工時**（即使當日曾編更，該日時薪為 0，除非財務人手改）。
4. **無每日補 $50**；亦無試用首月 $80（25–26 Excel 有，2627 不用）。
5. **Christine Fan 功輔佣金**：當月功輔**報讀人數 ≥ 15** 先計（少過 15＝$0）。基數＝該月功輔學費**原價** × 10%（達門檻後計該月全部原價，唔係只計第 15 人起嗰啲）。她本人若當值，時薪 **$100**（同下表），佣金另計。舊稿／指南曾寫 ≥12，**已作廢**。

來源：計糧方法 §9.2；指南 §16；25–26 功輔出糧 Excel。2627 產品期望總人數 ≥12、PT≥1，係編制期望，**唔等於**佣金門檻（15 人）。

### 2627 時薪名單（2026-08-31 簽）

| 時薪 | 同事 |
| --- | --- |
| $70 | Jeffrey Lee、Ken Tam、Leo Chan |
| $100 | Rain Kwok、Annie Leung、Erika Fok、Wing Chan、Liam Lai、Christine Fan、Kenneth Li |
| $110 | Judy Chu |
| $115 | Diana Kwok |
| 唔用時薪 | **Katie Lee**（固定月薪；可編更） |

**不再做功輔、只做專科**（唔入時薪名單，同王俊皓）：Henry Wong、Phoebe Tam、Cheryl Ng。

Excel 有糧、系統已無檔（當已走）：Donald Fung、Moses Law、Andrew Mak、Sabrina Cheng、羅少飛、王俊皓、Angus Chung。

## 未定

無。計糧頁佣金用獨立列（唔摺入專科分成）。

## 相關

- 計糧引擎（已 done，專科主體）：[`payroll-engine.md`](./payroll-engine.md)
- 功輔產品：[`homework-tutoring.md`](./homework-tutoring.md)
- 代堂歸屬（專科）：[`substitute-teacher-reporting.md`](./substitute-teacher-reporting.md)
