# 點名狀態與扣堂（已扣堂數）

介面用語繁體中文。程式來源：`src/lib/attendanceBilling.ts`、`src/services/attendanceQueries.ts`。  
營運政策索引：[`OPS_POLICIES.md`](../_INDEX.md)。

## 計費單位

- 學費以**堂數**為單位；一堂對應一堂已繳堂數。
- **連堂＝2 堂**：原班學生點名對每個 `schedule_id` 各寫一列，扣 2 堂。
- **連堂單項補堂**：補堂生可只綁連堂其中一節；點名紙仍可見，但只寫入所綁那一節，**只計 1 堂**（並清除同組另一節的多餘列）。點名紙會標「補堂·僅第 N 節」。

### 已繳堂數餘額（`2627` 起）

點名紙、報讀仍**分班**。已繳堂數餘額按課程組別：

| 組別 | 是否共用餘額 |
| --- | --- |
| 專科小組、同一級（例如中一中文＋數學） | 是 |
| 私人課程、試堂、功課輔導班 | 否（跟該班） |
| 混級專科班 | 否（跟該班） |
| 暑期 `*SM`（含 `26SM`） | 唔走此池；舊路徑不變 |

入池只睇學費行 `lesson_count`；優惠只影響錢。試堂不入專科小組共用。逾期罰款仍按班／科，見 [`TUITION_TERM_AND_LATE_FEE_POLICY.md`](../payments/TUITION_TERM_AND_LATE_FEE_POLICY.md)。

## 點名狀態

### 扣堂（計入「已扣堂數」）

| 狀態 | 含義 |
| --- | --- |
| 現場 | 實體到課 |
| 錄影回放 | 當日已交付錄影／回放連結（即日銷堂，不論學生何時觀看） |
| zoom實時網課 | 經 Zoom 等同步上網課 |
| no show | 突然不出現、**沒有**請假通知 |
| 請假而不需補回 | **有**請假紀錄，本應補回但學生自願放棄 → 仍扣堂 |

### 不扣堂

| 狀態 | 含義 |
| --- | --- |
| 事假 | 有請假（事假） |
| 病假 | 有請假（病假） |

歷史「缺席」**不遷移**、不計已扣堂數。舊「出席／網課／補課」仍計（相容）。計費採**嚴格白名單**（見 `isBillableAttendanceStatus`）。

## 請假與點名

- 請假單**不會**自動建立或覆寫已存點名。
- 改請假單最多改變點名「預填」建議；老師可手動改任何狀態。
- 先點名（如 no show）再補請假：需人手改狀態（例如改事假）。
- **未點名不自動銷堂**；系統應**提醒老師盡快點名**。

請假安排 → 預填對照：

| 請假安排 | 預填狀態 |
| --- | --- |
| 待安排 | 事假／病假（依請假理由；尚無補堂日，會進堂數對帳） |
| 調堂 | 事假／病假（依請假理由） |
| 錄影 | 錄影回放 |
| 不補回 | 請假而不需補回 |

「全部現場」：**當日有請假單的學生一律不覆蓋**。

## 取消補堂／清調堂與出席（反操作）

- 取消請假或清／改調堂**不會**靜默刪出席；有可刪補堂出席時會 Confirm（預設一併刪，可選保留）。  
- **孤兒**＝已無應到資格但仍有 `attendance_details`，且計費 status 仍計入已扣堂數。
- 操作細節與覆蓋範圍：[`manual/LEAVE_MAKEUP_CONSECUTIVE.md`](../../playbooks/frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md) §6；現況清：[`manual/LIFECYCLE_ORPHAN_CLEANUP_RUNBOOK.md`](../../playbooks/frontdesk/LIFECYCLE_ORPHAN_CLEANUP_RUNBOOK.md)。  
- **勿硬刪已點名排程**（會令 `schedule_id` 變 null 更難對帳）；應軟取消。

## 連堂請假與單項補堂（營運）

操作細節見系統說明書：[請假與補堂：連堂單項處理](../../playbooks/frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md)。

摘要：

- 請假可選「兩節一併」或「只請本節」；欠補堂數按請假筆數。
- 調堂綁定連堂其中一節＝正確日時；點名紙標「補堂·僅第 N 節」，只計 1 堂。
- 原班連堂生仍兩節一併、計 2 堂；原班「半節出席」分節點名不支援（產品決定不做）。

## 追學費（參考）

顯示條件：**已繳堂數 ≤ 已扣堂數**（且不全為 0）。
已繳堂數＝已收款收據之 `payment_details.lesson_count` 加總（**作廢單據不計**；見 [`PAYMENT_RECEIPT_VOID_POLICY.md`](../payments/PAYMENT_RECEIPT_VOID_POLICY.md)）。
用途為前台參考；學生通常一次繳多堂，非天天催繳工具。

**勿與「逾期罰款」混淆：** 本節是堂數缺口參考。常規專科班拖欠學費之 **HK$50** 罰款（每月每科一次；試堂／私人課程不罰）見 [`manual/TUITION_LATE_FEE_FRONTLINE.md`](../../playbooks/frontdesk/TUITION_LATE_FEE_FRONTLINE.md) 與 [`TUITION_TERM_AND_LATE_FEE_POLICY.md`](../payments/TUITION_TERM_AND_LATE_FEE_POLICY.md)。禁止入室不系統化。營運政策索引：[`OPS_POLICIES.md`](../_INDEX.md)。

## 試堂

半價／全價試堂應先走收款登記入帳（通常 `lesson_count = 1`），並將收據關聯至試堂紀錄；當日點名再扣堂。免費／體驗課可不經收款登記直接建試堂。

### 試堂結果（轉化／流失）

與 `status`（已預約／已完成／取消）分開，用 `trial_sessions.outcome`：

| outcome | 意義 |
| --- | --- |
| `open` | 待跟進 |
| `converted` | 已轉正式報讀（通常有 `converted_enrollment_id`） |
| `lost` | 已流失（含原因） |
| `other` | 其他結果（改期、轉介等） |

點名完成該堂後，建議再轉正式報讀或標結果；**未點名仍可轉正**，但介面必須警告「尚未完成試堂點名」，以免已繳學費與堂數／出席對不上。跨班轉正時，原試堂列一律標 `converted` 並歸因到新報讀。**流失須先取消試堂**再登記原因。學費／出單在 `/Payments`，試堂頁不內嵌收費（對帳以繳費紀錄為準；見 [`UI_DESIGN_INSTRUCTIONS.md` §15](./UI_DESIGN_INSTRUCTIONS.md)）。轉正後學生以就讀名單出現，不再當未結案試堂併入點名。
