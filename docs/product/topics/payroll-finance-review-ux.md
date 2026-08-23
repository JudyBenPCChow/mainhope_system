# 計糧財務核對 UX（Cody 回饋）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress` |
| 優先 | 高 |
| 範圍 | 財務在 `/Payroll` 內完成月結核對：合計語意、未點名跟進、真跳轉／真提醒；出席紀錄小修（日期記憶、老師篩選、排序）；改財務複核指引 |
| 不含 | 重開計糧引擎規則；排程管理改成整月報表；財務可點名／改排程／睇請假；功輔班計糧；費率頁／銀行帳號／Cody 入冊（仍見 [`payroll-engine.md`](./payroll-engine.md)） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 觸發 | 2026-08-05 Cody 回饋 PDF（7 月糧；Henry／Jackson／Katie／Liam／Mark／Phoebe／Rafael／Christine／Kenneth／Natalie；例 Cheryl）；嚴重程度＝阻礙出糧 |
| 相關 | [`payroll-engine.md`](./payroll-engine.md)（引擎已 done）· [`substitute-teacher-reporting.md`](./substitute-teacher-reporting.md) · [`attendance-records-range-query.md`](./attendance-records-range-query.md) · [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md)（計糧快取後刀）· 指引 [`cody-payroll-review-guide.html`](../../playbooks/finance/cody-payroll-review-guide.html) · 營運 [`PAYROLL_GUIDE.md`](../../policies/staffing/PAYROLL_GUIDE.md) |
| 舊稽核（對照，唔當待辦全文） | [`2026-08-02-payroll-operational-simulation.md`](../audits/2026-08-02-payroll-operational-simulation.md)（查證無連結）· [`2026-08-01-payroll-finance-ui-review.md`](../audits/2026-08-01-payroll-finance-ui-review.md) §1.1／1.8 |

## 目標（一句）

財務核對留在計糧頁（課堂事實＋扣堂人次同一批點名列）；出席紀錄／排程只處理例外；唔再用兩個頁頂嘅「出席／缺席」對總數。

## 開工閘（agent 必讀）

本題**無前置工程**（進行中／待驗收）。**唔使等** [`substitute-teacher-reporting.md`](./substitute-teacher-reporting.md) 完成；出席篩選跟當日 `schedules.teacher_id` 即可。

下游：代堂「匯出／按老師篩出勤」盤點必須等本題關帳（見該檔開工閘）。未結算 live 重算交 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 4，**該波等本題關帳**。

## 診斷（2026-08-21）

### 她實際流程

計糧逐人審核 → 睇未點名 → 堂數分頁抄出席／缺席 → 開出席紀錄揀 7 月對數字 → 排程管理想睇成個月。指引《每月薪酬複核工作指引》第一步就叫她去排程＋出席紀錄、唔好信系統總數，所以呢個唔係她自己發明。

### 數字對唔上（Cheryl 7 月 production）

同一個「缺席」兩邊意思唔同。計糧合計「出席／缺席」＝扣堂／不扣堂；出席紀錄＝營運桶（現場／no show／請假／補課／網課）。

| 狀態 | 筆數 | 出席紀錄 | 計糧合計 |
| --- | --- | --- | --- |
| 現場 34 + 舊「出席」14 | 48 | 出席 | 扣堂 |
| no show | 1 | **缺席 1** | **扣堂**（合計出席變 49） |
| 事假 2 + 舊「請假」1 | 3 | 請假 3 | **缺席 3** |

中學出席統計仲有第三套（實際到課 vs no show，請假兩面唔入），財務側欄冇入口。

### 產品現況（唔好當她嘅 wish list 逐條對）

- **查證排程／點名表**：對話框只顯示路徑文字，無跳轉（08-02 稽核已寫）。
- **發送點名提醒**：只彈「示範」banner，無 inbox／WhatsApp。
- **財務角色**：可讀排程／出席，**不可點名、改排程、睇請假**。未點名硬擋她清唔到。
- **預設月份相反**：計糧一開上個月；出席紀錄一開今月；日期篩選唔留。
- **出席紀錄老師篩選**：當日老師 **或** 原任 **或** 班主責 → 代堂會雙計（Cheryl 7 月未中；Liam／Kenneth 類會中）。計糧只跟 `schedules.teacher_id`。
- **排程管理**：`RANGE_DAYS = 14`、空日唔列出、開頁可跳去最近有堂日。整月查曾經 timeout（出席紀錄專題）。空名冊堂在排程仍似未點名；計糧 08-05 已跟點名紙跳過。
- **7 月糧**：08-07 已結算。08-05 未點名部分可能係暑假第一期空堂誤判（當日已修）。本題對住之後月份，唔翻 7 月帳。

### 唔做嘅方向

- 唔好把兩邊「缺席」改成同一個意思（會搞壞計薪或前線營運）。
- 唔好為出糧把排程管理改成整月報表（效能＋假未點名）。
- 唔好讓財務點名（授權已定；未點名靠提醒＋排除該人）。

## 方案（按波）

### 第一刀（計糧自給自足）

1. 合計拆欄：扣堂人次｜實際到課｜no show｜不扣堂請假｜未點名 N 堂。含舊狀態「出席」「請假」對照。
2. 逐人「未點名 N 堂」；點入高亮該堂。空名冊唔標未點名。
3. 「查證」改成真跳轉（排程詳情／點名紙唯讀），返回記住月份＋老師＋堂。
4. 點名提醒改真通知（inbox／既有老師渠道）；財務可標「已請補點、等重算」或排除該人其餘照交。

### 第二刀（出席紀錄小修＋指引）

5. 記住日期範圍；由計糧帶老師＋月份時預設該月。頂部註明：此頁合計 ≠ 計糧扣堂。
6. 老師名單同計糧排序（英文名；異常用標記，唔改次序）。篩選預設當日授課老師。
7. 改 `cody-payroll-review-guide.html`：第一步留在計糧抽樣數人頭；出席／排程只喺要改資料或睇點名紙時先出去。計糧指南加一段對照說明。

### 已知會再卡、本期可只記唔做

- 分成原價／代堂雙邊難核（舊稽核 1.5／1.6；代堂專題未完）。
- 未結算 live 重算，對緊數會變（已交 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) 波次 4）。
- 功輔班在出席有、計糧無；補堂計入補上嗰個月。
- 財務無請假權限，唔能獨立證實請假筆數。

## 下一步

1. 第一刀＋第二刀已落地（合計拆欄、未點名高亮、真跳轉／inbox 提醒、出席紀錄小修、指引／指南）。計劃見 [`2026-08-21-payroll-finance-review-ux.md`](../plans/2026-08-21-payroll-finance-review-ux.md)。
2. **關帳 ≠ 8 月糧結算。** 8 月未完、糧未出，正常。本題關帳＝財務確認計糧頁核對 UX 用得順（合計語意、未點名、跳轉／提醒），之後月份沿用同一套。待財務用**下一個未結算月**（而家即 8 月工作底稿，唔使等月底出糧）驗收後改 `done`。
