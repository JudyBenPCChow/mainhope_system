# 功課輔導班（功輔）產品功能

| 欄位 | 值 |
| --- | --- |
| 狀態 | `waiting`（沙盒已落地；**H1–H10 已定**（H4＝不做讓房）；餘 H11；價曆已簽收、後台未可登記月費） |
| 優先 | 中 |
| 範圍 | 一班制、按月繳費報讀、課室佔用、導師月度編更、獨立功輔校曆；三角色畫面 |
| 不含 | 正式產品頁／DB；計糧功輔時薪（交計糧）；暑期功輔產品化；學生點名紙；**每日功課進度／指示檔正文（留 Notion）**；宣傳物料；專科式請假／補堂／扣堂 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點／定案 | 2026-08-01；待決回覆吸納 2026-08-11 |
| 上次更新 | 2026-08-16（H4 讓房不做） |
| 相關 | [`payroll-engine.md`](./payroll-engine.md)、[`SCHEDULING_RULES.md`](../policies/scheduling/SCHEDULING_RULES.md) §4、[`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) §3、[`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md)、下游員工守則 [`2627-regular-year-ops-guide.md`](./2627-regular-year-ops-guide.md)（§7 校曆＋月費已寫；編更待補） |
| 營運事實整理（vault） | `Mainhope_admin/40-課程/功課輔導班-產品特點與工作流程.md`（2026-08-09；客觀事實，非產品定案；請假段勿當功輔） |
| 待決 WIP | [`homework-tutoring-decisions-wip.md`](./homework-tutoring-decisions-wip.md)（餘 H11） |
| UI 設計 v1 | [`2026-08-01-homework-tutoring-ui-design.md`](../plans/2026-08-01-homework-tutoring-ui-design.md)（首輪備查） |
| UI 設計 v2 | [`2026-08-01-homework-tutoring-ui-design-v2-roles.md`](../plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md)（**現行：全角色**） |
| 沙盒 | `/prototype/HomeworkTutoring`（頂部切行政／管理層／老師；不掛側欄；假資料） |

## 開工閘（agent 必讀）

開工前 check 對上一個工程是否完成。**未完成：停；提醒用戶必須完成後先可以開工。**

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| H11 沙盒審閱 | 無 | 可開工（營運睇沙盒） |
| 正式產品實作（schema／月費登記／編更／側欄） | 本檔 H11 | **H11 通過**；通過後先開實作 plan |
| 補 2627 指引 §7 編更 | 同上 H11 | 見 [`2627-regular-year-ops-guide.md`](./2627-regular-year-ops-guide.md) 開工閘 |

---

## 用語對齊（2026-08-11）

| 概念 | 統一用語 | 勿用／舊說法 | 備註 |
| --- | --- | --- | --- |
| 產品全名 | **功課輔導班**；短稱 **功輔**／**功輔班** | mingxue 等禁語見 `TERMINOLOGY.md` | vault 口語「功課班」可 |
| 本質 | **監督式自修**：完成當日學校功課；導師監督、答疑、維持秩序 | 「按教案授課」 | 非按科目／年級統一上課 |
| 學生組合 | **混級一班** | 分小學部／中學部 | **暫時只做中學**；小學日後未定 |
| 收費 | **月費制**／按月繳費報讀 | 按期／按科（專科） | 不適用專科逾期罰款／禁止入室 |
| 到校 | **慣常到校星期**（與價目檔日數一致） | 扣堂、專科式補堂 | 功輔**不補堂**；唔用點名紙 |
| 天氣停課 | **惡劣天氣停課不補堂** | 專科「學費順延」套功輔 | |
| 編更 | **報更** → **月工作表** → **發布** → **當值** | 「點名紙」當編更 | 截止見 H8；發布後先鎖定 |
| 時段 | 一至五 **15:30–19:30**；佔用自 **15:15**；上下節分界 **17:00** | 舊暫定 17:30 | |
| 課室 | **預設 17D**；行政可調動 | 「完全非固定、無預設」 | `SCHEDULING_RULES` §4 已跟 |
| 進度 | **Notion**；指示檔正文不進系統 | 系統每日功課進度 | |
| 計糧 | 交計糧引擎 | 本期產品做時薪 UI | vault 有歷史時薪／補貼參數 |

---

## 仍待營運（提我）

詳見 [`homework-tutoring-decisions-wip.md`](./homework-tutoring-decisions-wip.md)。

| # | 項目 | 備註 |
| --- | --- | --- |
| H11 | 沙盒／v2 審閱 | 營運**依家睇**中 |

價曆已簽收；放假日已入庫。後台尚未可登記功輔月費。見 [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) §3、[`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md)。

---

## 目前進度

### 已完成

1. 營運首輪定案（08-01）＋ UI v1／v2＋三角色沙盒。
2. 用語對齊 vault；釐清 vault 請假段屬專科、功輔不點名。
3. **2026-08-11 吸納待決**：H1／H2／H3／H8／H9／H10 已定。**2026-08-16：** **H7 校曆**、**H5 初中月費**、**H6 12／2 月四分三**已簽收；**H4 讓房不做**。2627 指引 v1.8。餘 H11。
4. `SCHEDULING_RULES` §4／驗證清單已改預設 **17D**、分界 **17:00**；沙盒 mock（分界／預設房／報更截止文案）已跟。

### 下一步

1. 完成 **H11** 沙盒審閱（無前置閘）。
2. **H11 通過後**先開正式實作 plan；未通過唔好開工正式 schema／側欄。通過後可補 2627 指引 §7 編更。

### 尚未開始：正式產品實作

- Schema／RLS、正式報讀月費、課室編更（放假日已入 `homework_tutoring_calendar_closures`；產品頁未接）
- 計糧功輔時薪；正式側欄入口

---

## 角色畫面索引（v2）

| 角色 | 沙盒視角 | 主畫面 |
| --- | --- | --- |
| admin／alien | 行政 | 概覽、報讀、月費、當值編更、校曆、設定 |
| manager | 管理層 | 監督首屏、本月當值、報更進度、月費異常 |
| teacher | 老師 | 功輔報更、我的當值、放假日 |

---

## 現況對照（系統）

| 項目 | 現況 |
| --- | --- |
| 科目 | `subjects` 已有 `HWK` |
| 班型 | `class_kind` 僅 `group`／`private` |
| 排課規則 | §4 已：**預設 17D**、可調、分界 **17:00**；末節讓房**不做** |
| 計糧 | 功輔暫不開工 |
| 產品功能 | 僅 UI 沙盒；正式未實作 |

---

## 已定產品

### 班別與報讀（08-01＋08-11）

- **全體學生同一班**（混級同一當值場次）。
- 價目檔次：每週 **三日／四日／五日／七日**；2627 初中銀碼見 [`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md)（H5）。中四至中六未列價。
- **慣常到校星期**可紀錄；**不扣堂、不補堂**。
- 按月繳費報讀。
- **唔做**專科式請假／補堂／扣堂流程（vault 該段屬專科）。功輔若有請假慣例，唔跟專科五步驟；本期系統**唔做**功輔請假模組。
- **唔做**學生每日點名紙（H2）。

### 時間與課室（08-11 更新）

- 一至五 **15:30–19:30**；課室佔用自 **15:15**。
- 課室：**預設 17D**；行政／前台可正常調動（H3）。
- 上下節分界：**17:00**（H9；取代舊暫定 17:30）。
- **不適用**專科逾期罰款／禁止入室。
- 末節讓房：**不做**（H4；2026-08-16）。功輔佔用至營運時段結束。

### 日曆

- 功輔校曆與專科分開；2627 已簽收並已入 `homework_tutoring_calendar_closures`，見 [`ACADEMIC_CALENDAR.md`](../policies/academic/ACADEMIC_CALENDAR.md) §3。

### 月費（H5）

- 2627 初中月費見 [`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md)。
- 檔次：三日／四日／五日／七日 × 中一／中二／中三。
- 中四至中六、小學未列價。優惠未另列。
- **12 月、2 月**收該檔月費四分三（H6）；此兩月為功輔開放日最少（全日 21、平日 15）。
- **不適用**專科逾期罰款。

### 導師編更

- 老師自助報更（全日／上節／下節／不可）；行政可代填／覆寫；manager 看進度。
- **報更截止**：該月最後一日起倒數第 3 日（含末日）＝末日 − 2（例：31→29、30→28）（H8）。
- 過截止**仍可補交、不鎖死**；**月工作表發布後**該月報更先鎖定（D2）。
- 盡量全日同一人；可分上下節（分界 17:00）。

### 每日功課進度

- **不進本系統**；Notion。日後最多報讀列外開連結。

### 服務對象（H10）

- **暫時只做中學**；小學日後未定。產品文案先中學；系統唔死鎖年級。

### 薪酬

- 本期不處理；見計糧引擎。vault 參考：$100/hr、試用首月 $80、每上班日補 $50。

---

## 導師編更 — 工程要點（D1–D3）

| # | 要點 |
| --- | --- |
| **D1** | 老師自助報更為主；行政代填／覆寫；manager 看齊交。 |
| **D2** | 發布後寫入佔用＋當值老師；唔做學生點名紙；發布後報更鎖定。 |
| **D3** | 上下節兩段；分界 **17:00**。與專科／課室同時段硬性禁止。 |

---

## 暫緩／後補

| # | 項目 | 狀態 |
| --- | --- | --- |
| H11 | 沙盒審閱 | 依家睇 |
| E | 時薪／佣金 | 待計糧 |

---

## 工程備註

1. 價曆已簽收。後台尚未可登記功輔月費與開放日（待 H11 及實作）。
2. 排課 §4 已跟；讓房**不做**。
3. UI 以 v2 為準；H11 通過後再開正式 plan。
4. vault 紀律／溝通／宣傳／推車打印 → §7／SOP，唔擴產品。

## 待做

- [x] 營運回覆主幹；D 建議入檔
- [x] 排課 §4 首輪；書面語
- [x] UI v1＋v2；Notion 進度範圍
- [x] 三角色沙盒
- [x] 對齊 vault 用語；H1–H11 提問
- [x] 吸納 08-11 回覆（H1–H3／H8–H10；H4 當時後補）
- [x] 同步 `SCHEDULING_RULES` §4／驗證清單（預設 17D、分界 17:00）
- [x] 沙盒 mock 跟分界 17:00
- [x] H7 功輔校曆簽收（2026-08-16）；政策 §3＋2627 附件乙；放假日已入庫（2026-08-21）
- [x] H5 初中月費簽收（2026-08-16）；政策篇＋2627 §7.2
- [x] H6 12／2 月四分三簽收（2026-08-16）；對照校曆為開放日最少兩月
- [x] H4 末節讓房不做（2026-08-16）；佔用至時段結束
- [ ] H11 沙盒審閱結果
- [ ] 正式實作計畫與 Schema（分期）
- [ ] 補寫 `2627_REGULAR_YEAR_OPS_GUIDE` §7 其餘（編更）

## 相關路徑

| 用途 | 路徑 |
| --- | --- |
| 待決 WIP | [`homework-tutoring-decisions-wip.md`](./homework-tutoring-decisions-wip.md) |
| 沙盒入口 | `/prototype/HomeworkTutoring` |
| 沙盒程式 | `src/prototypes/homeworkTutoring/` |
| UI v2 | [`docs/product/plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md`](../plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md) |
| 排課 §4 | [`SCHEDULING_RULES.md`](../policies/scheduling/SCHEDULING_RULES.md) |
| 月費 | [`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md) |
| 計糧 | [`payroll-engine.md`](./payroll-engine.md) |
| vault | `Mainhope_admin/40-課程/功課輔導班-產品特點與工作流程.md` |
