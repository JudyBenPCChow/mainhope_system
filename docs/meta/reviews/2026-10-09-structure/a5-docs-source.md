# A5 文件真源

| 欄位 | 值 |
| --- | --- |
| 工作狀態 | 已完成 |
| 日期 | 2026-10-09 |
| 父檔 | [`../2026-10-09-structure-review.md`](../2026-10-09-structure-review.md) |

## 結論

抽樣對過三類，沒有逐篇通讀，也沒有查資料庫。政策對程式：點名扣堂預填（`ATTENDANCE_BILLING.md`／`attendanceBilling.ts`）、逾期罰款資格（`TUITION_TERM_AND_LATE_FEE_POLICY.md`／`tuitionLateFee.ts`）、功輔月費（`HOMEWORK_TUTORING_MONTHLY_FEE.md`／`homeworkTutoringFees.ts`）、計糧（`PAYROLL_GUIDE.md` 的 Natalie 一對一 $350 與 Christine 功輔佣金／`src/lib/payroll`）、代堂（`SCHEDULE_SUBSTITUTE_TEACHER.md`／`assignScheduleSubstitute`）、專科最後上課日（`ACADEMIC_CALENDAR.md`／`SPECIALIST_LAST_LESSON_YMD_2627`）。操作說明對畫面：試堂出單、逾期罰款前線、連堂請假、代堂，以及 `playbooks/_INDEX.md`。表頭為完成的分題：`summer-enrollment-roster-consistency.md`、`tuition-late-fee-enforcement.md`、`2627-september-timetable.md`、`2627-regular-year-ops-guide.md`、`homework-tutoring.md`（其「不含」小學部不另算落差）。

會算錯堂或算錯罰款的分裂有兩處：請假「不補回」的預填，以及單堂報讀是否收逾期罰款。時間表 ver. 3.x 與學年指引版號在索引、政策文首和分題產物之間仍各說各話。功輔價目、試堂先出單、代堂只改該堂、計糧上述兩條與專科最後上課日，抽樣範圍內文件與程式一致。根目錄舊檔抽看的都是轉址 stub，沒有第二套規則正文。`docs/generated/` 的 docx／pdf 內文未抽取，不當真源。

## 未查範圍

未對照的政策：`STUDENT_CODE.md`、`STUDENT_STATUS_CLASSIFICATION.md`、`SOFT_ARCHIVE.md`、`ACADEMIC_YEARS.md` 正文、`PAYMENT_RECEIPT_VOID_POLICY.md`、`CLASSROOMS_OPS.md`，以及 `SCHEDULING_RULES.md` 格網、課室、年級時段等常設條款（只看了文首版本堆疊）。未對照的操作說明：`PAYMENT_RECEIPTS.md`、`INBOX.md`、`SYSTEM_UPDATES.md`、`finance/` 兩份 html、`ops/` 兩份 runbook。未對照的學年物料：`ops-guide.md` 除第 7 至 9 章以外的章節、`ops-brief.md`、`timetable/versions/` 歷史稿。`docs/product/topics/` 其餘分題、`docs/meta/`、`docs/generated/` 內文、vault 鏡像未抽。沒有查資料庫。

## 問題

### A5-01 請假「不補回」預填扣堂與不扣堂並存

- 嚴重度：高
- 狀態：已有分題
- 分類：政策與程式落差
- 觀察：已關帳分題與程式把請假安排「不補回」預填為不扣堂的事假；點名政策的預填表仍寫扣堂狀態「請假而不需補回」。另一份未關帳的補堂目錄草稿仍教同事照扣堂預填。老師若跟政策或該草稿改狀態，已扣堂數會與現行預填相反。
- 依據：`docs/policies/attendance/ATTENDANCE_BILLING.md` 第 65–72 行，預填對照寫「不補回 → 請假而不需補回」。`src/lib/attendanceBilling.ts` 第 76–77 行，`makeup` 含「不補回」時 `return "事假"`，註解寫 G1 預填不扣堂，「請假而不需補回」只可人手選。`docs/product/topics/summer-enrollment-roster-consistency.md` 表頭狀態 `done`（2026-08-31）；第 242 行寫已改預填為事假、不扣堂；第 316–324 行 G1 問句含「預填不扣堂」，回覆為同意。`docs/product/topics/makeup-special-cases.md` 表頭狀態 `open`；第 103–112 行 M03 仍寫選「不補回」則原堂扣 1 堂，預填「請假而不需補回」。
- 影響：同一句「不補回」會被做成扣堂或不扣堂。已扣堂數直接進入拖欠與計糧人頭。
- 建議：以 G1 已同意的預填為準，改點名政策預填表，並改補堂目錄草稿，使三處都寫「不補回預填事假、不扣堂；請假而不需補回只可人手選」。本輪不改政策、不改程式。
- 既有分題：`docs/product/topics/summer-enrollment-roster-consistency.md` 狀態 `done`。殘餘是政策預填表與 `makeup-special-cases.md`（`open`）仍是舊句。

### A5-02 單堂報讀是否收逾期罰款，三處不一致

- 嚴重度：高
- 狀態：新發現
- 分類：雙真源或舊路徑
- 觀察：學費政策的例外表沒有單堂，適用範圍寫常規專科班（報讀欄含單堂）。學年指引與前線指引寫已一次繳清的單堂原則上不收這項罰款。程式的合格判斷只排除私人課程、功課輔導班與非 `regular`，沒有單堂分支。收款畫面因此可能對單堂報讀自動加港幣 50 元，而同事讀本寫不要開罰。
- 依據：`docs/policies/payments/TUITION_TERM_AND_LATE_FEE_POLICY.md` 第 15–21 行，常規報讀含單堂，逾期罰款適用常規專科班；第 36–44 行例外為試堂、私人課程、功課輔導班、暑期，沒有單堂。`docs/year/2627/ops-guide.md` 第 460 行與第 506–514 行寫單堂原則上不收。`docs/playbooks/frontdesk/TUITION_LATE_FEE_FRONTLINE.md` 第 44–51 行，不適用表含單堂。`src/lib/tuitionLateFee.ts` 第 27–36 行 `isLateFeeEligibleCourse` 只看 `classKind` 與 `courseMode`。
- 影響：同一筆單堂拖欠，系統可能加罰，前線讀本要求不要開。金額是每科每月 50 元。
- 建議：先定政策例外表是否包含單堂，再讓學年指引、前線指引與 `isLateFeeEligibleCourse` 跟同一句。未定案前不要當程式已違反某一邊。本輪不改。
- 既有分題：無。`docs/product/topics/tuition-late-fee-enforcement.md` 狀態 `done`，範圍寫常規小組課自動加罰，不含試堂等，沒有寫單堂豁免。

### A5-03 逾期罰款已上線，政策文末仍寫待系統化

- 嚴重度：中
- 狀態：已有分題
- 分類：分題與現況落差
- 觀察：同一份政策文首寫收款已自動加罰、2026-10-01 起生效；文末第 5 節仍標題「待系統化」，並連到已不存在的 `backlog/` 路徑。分題表頭已是完成，結論寫 `/Payments` 已自動加罰。
- 依據：`docs/policies/payments/TUITION_TERM_AND_LATE_FEE_POLICY.md` 第 7–11 行寫已接線、施行日 2026-10-01；第 76–78 行第 5 節「待系統化項目」連結 `backlog/tuition-late-fee-enforcement.md`（相對政策目錄，不是 `docs/product/topics/`）。`docs/product/topics/tuition-late-fee-enforcement.md` 第 5 行狀態 `done`；第 16–18 行寫已收款會自動加入逾期罰款，開關日 2026-10-01。`src/lib/tuitionLateFee.ts` 第 7–10 行金額 50、生效日 `2026-10-01`。
- 影響：下次改罰款的人會以為尚未系統化，或跟失效連結去找工程步驟。
- 建議：刪或改寫政策第 5 節，連結改到已完成分題，並寫明已接線的範圍。本輪不改。
- 既有分題：`docs/product/topics/tuition-late-fee-enforcement.md` 狀態 `done`。殘餘是政策第 5 節與死連結。

### A5-04 時間表仍有文件把 ver. 3.6 或更早決定寫成最新

- 嚴重度：中
- 狀態：新發現
- 分類：雙真源或舊路徑
- 觀察：學年包與時間表索引寫 ver. 4.0 已簽收關帳，其後加班只入系統。操作說明索引卻把九月時間表寫成 ver. 3.6，並連到 3.6 簽收紀錄。排課政策文首既寫 4.0 已完，又連續多段都叫「最新排程決定」，其中包括 ver. 3.6 至 3.10。歷史版本不應再當現行班表。
- 依據：`docs/playbooks/_INDEX.md` 第 53 行「ver. 3.6 方案」及 `2627_timetable_signoff_v3.6.md`。`docs/year/2627/README.md` 第 13 行寫 4.0 已簽收關帳。`docs/year/2627/timetable/2627_timetable_schemes.md` 第 3–11 行寫 4.0 為已定稿。`docs/product/topics/2627-september-timetable.md` 第 5 行狀態 `done`；第 13–15 行寫 2026-08-24 簽收 ver. 4.0，其後不開 4.x。`docs/policies/scheduling/SCHEDULING_RULES.md` 第 7–9 行寫 4.0 已完；第 14–28 行仍有多段「最新排程決定」，第 26 行是 ver. 3.6。
- 影響：下次排班或改方案若跟操作索引或其中一段「最新」，會用已取代的班數、老師與時段，而不是系統現況或 4.0 關帳說明。
- 建議：操作索引改指 4.0 已關帳、其後以系統為準。排課政策只保留常設條款與一處關帳說明，其餘版本決定標成歷史，不要再寫「最新」。本輪不改、不重出時間表。
- 既有分題：無。對照 `docs/product/topics/2627-september-timetable.md` 狀態 `done`，該題本身與學年索引一致，分裂在操作索引與排課政策文首。

### A5-05 學年指引版號在索引、分題與正文不一致

- 嚴重度：中
- 狀態：已有分題
- 分類：雙真源或舊路徑
- 觀察：指引正文文首是 v1.21、更新日期 2026-09-03，正文已寫小學部場次自 2026-10-01。操作索引仍稱全公司守則 v1.15。已完成分題的產物欄仍寫 v1.20／2026-09-01，表頭關帳句仍停在 v1.14。三個版號不能同時是現行本。
- 依據：`docs/year/2627/ops-guide.md` 第 8–9 行文件版本 v1.21、更新日期 2026-09-03；第 365–369 行已寫小學部自 2026-10-01 及獨立價目。`docs/playbooks/_INDEX.md` 第 49 行「全公司守則 v1.15」。`docs/product/topics/2627-regular-year-ops-guide.md` 第 5 行狀態 `done`，關帳句寫 v1.14；第 9 行產物寫 v1.20／2026-09-01。
- 影響：同事或下一次發佈會以為列印本仍是 v1.15 或 v1.20。v1.15 的分題紀錄尚未包含其後的點名紙不准手動加名、功輔與專科分單，以及小學部價目。索引同時把 PDF／Word 放在員工讀本，那些檔的內文本次未抽取。
- 建議：以 `ops-guide.md` 正文為學年實例，把索引簡介與分題產物版號改到與正文同一版；若正文已含 10 月小學部而文首日期仍是 9 月 3 日，發佈前先核對是否要升版。不要把手上的 generated 檔當成已核對的現行本。本輪不改、不重出。
- 既有分題：`docs/product/topics/2627-regular-year-ops-guide.md` 狀態 `done`。殘餘是產物版號與操作索引未跟正文。

## 低優先

### A5-06 前線篇章連到已搬走的政策檔名

- 嚴重度：低
- 狀態：新發現
- 分類：雙真源或舊路徑
- 觀察：兩份前線說明的連結目標不是現行政策路徑，點下去找不到規則檔。說明正文本身仍在。
- 依據：`docs/playbooks/frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md` 第 5 行連結 `../ATTENDANCE_BILLING.md`。`docs/playbooks/frontdesk/SUBSTITUTE_AND_CLASS_TEACHER_FRONTLINE.md` 第 7 行連結 `../SCHEDULE_SUBSTITUTE_TEACHER.md`。現行檔在 `docs/policies/attendance/ATTENDANCE_BILLING.md` 與 `docs/policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md`。
- 影響：同事要對扣堂或代堂細則時會斷鏈。不直接改計算。
- 建議：改連結到 `policies/` 現行路徑。
- 既有分題：無。

### A5-07 點名政策的孤兒清理連結指到錯誤子目錄

- 嚴重度：低
- 狀態：新發現
- 分類：雙真源或舊路徑
- 觀察：點名政策把生命週期清理說明連到 `playbooks/frontdesk/`，檔案實際在 `playbooks/ops/`。
- 依據：`docs/policies/attendance/ATTENDANCE_BILLING.md` 第 80 行連結 `../../playbooks/frontdesk/LIFECYCLE_ORPHAN_CLEANUP_RUNBOOK.md`。檔案為 `docs/playbooks/ops/LIFECYCLE_ORPHAN_CLEANUP_RUNBOOK.md`（`playbooks/_INDEX.md` 第 42 行）。
- 影響：從點名政策找不到清理步驟。
- 建議：改連結到 `ops/` 該篇。
- 既有分題：無。

### A5-08 已完成功輔分題的用語表仍寫不開小學部

- 嚴重度：低
- 狀態：已有分題
- 分類：分題與現況落差
- 觀察：功輔母題表頭把小學部劃入「不含」，並指向另題，這不算該題未做完。用語對齊表的備註仍寫本學年不開小學部功輔，與已簽收的月費政策和已完成的小學部分題相反。
- 依據：`docs/product/topics/homework-tutoring.md` 第 5–8 行狀態 `done`，不含小學部場次；第 36 行備註「2627 不開小學部功輔」。`docs/policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md` 第 8–10 行寫已開獨立小學部功輔班。`docs/product/topics/homework-tutoring-primary-division.md` 第 5 行狀態 `done`；第 21 行班別 `2627-HWKP1099-A`。
- 影響：只讀母題用語表的人會以為沒有小學部場次。價目真源已在政策篇。
- 建議：母題該列改成「小學部見另題與月費政策」，不要留「不開」當現況。
- 既有分題：`docs/product/topics/homework-tutoring.md` 狀態 `done`（不含小學部）。小學部本身見 `homework-tutoring-primary-division.md` 狀態 `done`。

### A5-09 試堂畫面有「體驗課」，前線說明只列三種

- 嚴重度：低
- 狀態：新發現
- 分類：操作說明落差
- 觀察：試堂紀錄的新增類型含「體驗課」。前線說明只寫全價、半價、免費。已完成分題把體驗與免費都寫成建立後跳收款出 $0 單，所以不是未出單上紙。
- 依據：`src/components/trials/TrialSessionsView.tsx` 第 98 行選項含「體驗課」。`docs/playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md` 第 32–46 行只分全價、半價、免費。`docs/product/topics/frontline-ops-update.md` 第 5 行狀態 `done`；第 37 行寫免費／體驗建立後跳收款出 $0 單。
- 影響：同事可能不知道「體驗課」應按免費試堂出 $0 單。政策第 2 節的三種路徑沒有這個名稱。
- 建議：前線說明加一句：畫面「體驗課」與免費試堂相同，仍要 $0 單並確認後才上點名紙。
- 既有分題：無。對照 `frontline-ops-update.md` 狀態 `done`，該題已寫體驗走 $0 單，缺的是 playbook 用詞。

## 移交

- A3：2627 同級專科共用已繳餘額之後，逾期罰款仍按 `payment_details.class_id` 計該班已繳（`docs/policies/payments/TUITION_TERM_AND_LATE_FEE_POLICY.md` 第 38 行「該生該班已繳堂數」；`docs/year/2627/ops-guide.md` 第 320 行寫罰款不按共用餘額）。程式這樣寫會不會少算已繳、從而多罰，請 A3 判斷。本軸不推定營運後果。
- A3：排程「新增排程」可勾「標記為加堂」並選就讀生（`src/components/schedule/ScheduleManagePage.tsx` 約第 2746–2764 行）。點名政策寫不准手動加名、缺口用單堂報讀或調堂（`ATTENDANCE_BILLING.md` 第 27–29 行）。這條勾選算不算手動加名，請 A3 判斷。

## 已排除

- 根目錄 `docs/OPS_POLICIES.md`、`docs/ATTENDANCE_BILLING.md`、`docs/PAYROLL_GUIDE.md`、`docs/SYSTEM_MANUAL.md`、`docs/UI_DESIGN_INSTRUCTIONS.md` 抽看都是「已遷移」轉址，沒有第二套規則正文。`docs/PATH_MAP.md` 仍是舊路徑對照，與總門牌一致。
- 功輔月費：政策中一三日 2,800、小學部三日 2,500、十二月五日小學部 2,100，與 `src/lib/homeworkTutoringFees.ts` 及測試一致。逾期罰款不適用功輔，與 `isLateFeeEligibleCourse` 排除 `homework` 一致。
- 逾期罰款金額 50、生效日 2026-10-01，以及私人課程、功課輔導班、暑期不罰，政策例外表與 `tuitionLateFee.ts` 一致。單堂見 A5-02，不在此列。
- 計糧：`PAYROLL_GUIDE.md` 私人課程一對一固定 $350，與 `src/lib/payroll/computeMonth.test.ts` 期望金額 350 一致。Christine 功輔佣金門檻 15 人、原價 10%，與 `src/lib/payroll/homeworkHours.ts` 的 `HOMEWORK_COMMISSION_MIN_ENROLLED`、`HOMEWORK_COMMISSION_PCT` 一致。
- 代堂：政策寫只改該堂 `schedules.teacher_id`。`assignScheduleSubstitute` 只更新 `schedules` 的 `teacher_id` 與 `original_teacher_id`。前線總則「班別記常任、每一堂記當日老師」與這段一致。斷鏈見 A5-06。
- 試堂：政策與前線說明都是確認收款後才上點名紙。`scheduleRosterQueries.ts` 以已確認收款的 `paymentId` 決定試堂是否上紙。收款畫面半價選項文案「半價試堂（正價＋50% 優惠）」與 playbook 第 28 行一致。「體驗課」用詞見 A5-09。
- 連堂請假：playbook 寫預設「只請本節」。`leaveQueries.ts` 註明預設 `this_slot`；`LeaveManagementView.tsx` 選項寫「只請本節（欠 1 堂；預設）」。
- 專科最後上課日：`ACADEMIC_CALENDAR.md` 第 50 行 2027-06-28，並寫明不要用學年 `end_date` 2027-06-30。`src/lib/adminOpsAssistant/config.ts` 常數 `SPECIALIST_LAST_LESSON_YMD_2627` 為同一日。其他批量排程入口未逐一核對。
- `homework-tutoring.md` 把小學部劃入不含，不把「其後另題已開小學部」算成這題未完成。用語表殘句見 A5-08。
- `product-line-billing-models.md` 狀態 `done`，寫明 C9 不切私人課程點名閘。這是分題宣告不做的範圍，不算落差。
