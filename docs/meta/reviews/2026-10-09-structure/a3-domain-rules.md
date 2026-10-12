# A3 領域規則

| 欄位 | 值 |
| --- | --- |
| 工作狀態 | 已完成 |
| 日期 | 2026-10-09 |
| 父檔 | [`../2026-10-09-structure-review.md`](../2026-10-09-structure-review.md) |

## 結論

抽樣只涵蓋會算錯錢或算錯人的寫入與讀取，沒有通讀政策櫃，也沒有查庫。報讀與權益看了鑄池、點名冊與退讀；點名與扣堂看了暑期期數、單堂綁定、連堂兩列與消耗；排程看了代堂、校舍假期閘、`makeup_of=` 與專科最後上課日；計糧看了代堂歸屬、功輔時薪與 Christine Fan 功輔佣金；三線收費看了功輔月費出單與專科堂數池。

餘額為 0 仍上點名紙、學年結束不自動退讀、暑期不跨期、單堂只計已綁課堂、代堂只改該堂 `schedules.teacher_id`、校舍假期寫入閘、以及計糧按實際授課老師，在本工作樹與所引規則一致，見「已排除」。

仍會算錯的是：連堂追收把每一列都乘上班別堂數；功輔佣金只取最早一班。點名已存但扣堂失敗仍被吞掉，屬未收斂的既有分題。開班預設結束日用學年 `end_date`，批量排程因此可以排到專科最後上課日之後。未查庫，所以沒有「目前有多少班、多少人」。

## 未查範圍

未抽：`STUDENT_STATUS_CLASSIFICATION.md`、`STUDENT_CODE.md`、`SOFT_ARCHIVE.md`、`TRIAL_RECEIPT_BEFORE_ROSTER.md` 全文、`PAYMENT_RECEIPT_VOID_POLICY.md`、`TUITION_TERM_AND_LATE_FEE_POLICY.md` 全文、`SCHEDULING_RULES.md` 全文、`CLASSROOMS_OPS.md`、`PAYROLL_GUIDE.md` 第 6–15 章與附錄費率表、ops-guide 第 4–6 章、第 11–12 章全文、附件甲各期日期表與時間表版本史。試堂出單、逾期罰款公式、課室衝突、強積金與固定月薪未逐條對程式。

## 問題

### A3-01 連堂追收把每一列都乘上班別堂數

- 嚴重度：高
- 狀態：已有分題
- 分類：點名與扣堂
- 觀察：連堂寫入會同一日建兩列（第 1 節、第 2 節）。點名扣堂每一列預設扣 1。追收與收款建議卻把班別 `lesson_slots_per_session`（連堂為 2）乘到每一列，兩列變成 4 堂。未查庫，未知目前有多少連堂班。
- 依據：ops-guide §3.3：「對學費與扣堂而言，連堂通常按兩堂計算（每一時段格扣一堂）」（`docs/year/2627/ops-guide.md` 約第 193 行）。§9.3：「原班連堂生仍兩節一併點名、計兩堂」；補入其中一節「該生只計一堂」（約第 581–583 行）。分題口徑：「連堂按班別堂數（2 格＝2 堂）」。寫入：`insertSchedulesForClassSession` 連堂各插一列（`src/services/scheduleWriteQueries.ts` 約第 269–287 行）；批量排程同樣兩列（`src/services/batchScheduleHelpers.ts` 約第 216–245 行）。扣堂讀寫：`saveAttendanceStatus` 未傳 `lessonUnits`，消耗預設 1（`src/services/attendanceQueries.ts` 約第 755–764 行；`src/services/entitlementQueries.ts` 約第 1182 行）。多計的讀取：`fetchScheduleUnitsInRange` 每列 `units` 取班別堂數（`src/services/tuitionChaseQueries.ts` 約第 281–327 行）；`pendingUnitsForClassInPeriod` 同樣每列寫入 `perSession`（`src/services/entitlementQueries.ts` 約第 1510–1529、1559–1562 行）。
- 影響：連堂班的「本期還會扣」與收款建議堂數會高於實際每節扣 1 的消耗。家長可能被要求多交堂數。
- 建議：追收與收款建議以每一排程列 1 堂計；兩列才是兩堂。不要再把班別的 2 乘到每一列。
- 既有分題：`docs/product/topics/tuition-chase-list.md` 表頭 `done`。殘餘是實作仍按列乘班別堂數，與該題「2 格＝2 堂」及扣堂每列 1 不一致。

### A3-02 功輔佣金只計最早的一班

- 嚴重度：高
- 狀態：新發現
- 分類：計糧
- 觀察：Christine Fan 功輔佣金先取 `class_kind=homework`、狀態進行中、建立時間最早的一班（`limit 1`），只加總該班月費應收或該班就讀中報讀。中學部與小學部現為兩班。小學部班在較晚的 migration 才種入，讀取不會把它算進人數或原價。未查庫，未知兩班各自人數。
- 依據：計糧指南 §16.2：「當月功輔班報讀人數達 15 人或以上」才計佣金；達門檻後為「該月功輔班學費原價的 10%」（`docs/policies/staffing/PAYROLL_GUIDE.md` 約第 675–677 行）。ops-guide §7.2：「中學部與小學部各一場（各一 homework 班）」（`docs/year/2627/ops-guide.md` 約第 379 行）。月費政策已列獨立小學部班 `2627-HWKP1099-A`（`docs/policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md` 文首）。讀取：`fetchHomeworkCommissionBase`（`src/services/payrollHomeworkQueries.ts` 約第 239–249 行）。寫入計糧結果：`payrollQueries.ts` 約第 670–675、725 行把該結果交入 `computePayrollMonth`。
- 影響：佣金基數少計另一學部的已繳或應計原價，15 人門檻也可能因此達不到。專科分成與功輔時薪是另一條數，不會補上這段。
- 建議：佣金人數與原價加總全部進行中的功課輔導班，再套 15 人與 10%。
- 既有分題：`docs/product/topics/homework-tutoring-payroll.md` 表頭 `done`（關帳時尚未有小學部班）。`docs/product/topics/homework-tutoring-primary-division.md` 表頭 `done`，範圍不含計糧。殘餘不在該兩題正文。

### A3-03 點名已寫入但扣堂失敗仍被吞掉

- 嚴重度：高
- 狀態：已有分題
- 分類：點名與扣堂
- 觀察：`saveAttendanceStatus` 先寫 `attendance_details`，再呼叫消耗。消耗拋錯只 `console.error`，點名狀態仍留下。刪除點名列時，返還失敗同樣只寫主控台。餘額為 0 仍可點名本身不是缺陷。
- 依據：ops-guide §9 重點：「學費以堂數為單位；點名狀態決定該堂是否計入已扣堂數」（`docs/year/2627/ops-guide.md` 約第 540 行）。分題產品意圖：「點名成功與扣堂成功必須一致可見：扣不到不能假裝已存完」。寫入：`src/services/attendanceQueries.ts` 約第 754–767 行與約第 843–855 行。讀取：點名紙與權益池各自讀出席列與 `remaining_lessons`，失敗時池可以不動。
- 影響：老師看到已點，已扣堂數與追學費仍用舊餘額。
- 建議：沿該分題方向，消耗失敗要讓點名者看見，不要只留在瀏覽器主控台。本輪不改程式。
- 既有分題：`docs/product/topics/attendance-marked-not-consumed.md` 表頭 `open`。殘餘是 §3.1 的吞錯仍在上述兩處；§3.2–3.8 不在本軸重述。

### A3-04 開班結束日用學年結束日，批量排程可超過專科最後上課日

- 嚴重度：中
- 狀態：新發現
- 分類：排程
- 觀察：新增班別時，開始日與結束日預設抄學年 `start_date`／`end_date`。2627 學年結束日可為 2027-06-30。批量排程候選日用班別 `end_date`，沒有班別結束日才再用學年結束日，而且不套專科最後上課日。2027-06-29、2027-06-30 不是專科校舍假期，有老師空檔時會被預勾並可寫入排程。班務助手另有一條排堂路徑停在 2027-06-28。未查庫，未知現有班別的 `end_date` 是否已是 6 月 30 日。
- 依據：ops-guide 附件甲：「最後上課日：2027 年 6 月 28 日（星期一）」（`docs/year/2627/ops-guide.md` 約第 785 行）。校曆：「最後上課日 2027-06-28」；「學年字典 `end_date` 仍可為 2027-06-30；最後專科上課日以上表為準」（`docs/policies/academic/ACADEMIC_CALENDAR.md` 約第 50–52 行）。同檔 §4.1：2027-06-29、2027-06-30 功輔仍開放，專科已完課。寫入：`src/components/classes/ClassCreateForm.tsx` 約第 115–130 行；`listCandidateDatesForClass`（`src/services/batchScheduleHelpers.ts` 約第 55–69 行）與 `executeBatchSchedules`（約第 191 行起）。對照寫入：`specialistDatesForNewClass` 在最後上課日之後不再排（`src/lib/adminOpsAssistant/rules.ts` 約第 94–101 行）。讀取：專科十期日期表第十期最後為 6 月 28 日，不含 6 月 29、30 日（`src/lib/specialistTuitionPeriods.ts` 約第 98–103 行）。
- 影響：專科班若經開班表單加批量排程，可能多出校曆以外的堂。那些堂若被點名，會扣堂並計薪，但追收期數表不會把它們當成專科上課日。尚未證實現有班已這樣排過。
- 建議：2627 專科批量排程的結束日用最後上課日 2027-06-28。功輔結束日維持 2027-06-30，不要把專科尾日套到功輔。
- 既有分題：無。`docs/product/topics/2627-september-timetable.md` 表頭 `done`，範圍是已完成的時間表方案，不含這條開班預設。

### A3-05 功輔佣金後備把未設定日數檔當成四日

- 嚴重度：中
- 狀態：新發現
- 分類：計糧
- 觀察：佣金在該班沒有月費應收列時，改讀就讀中報讀。日數檔不是三日／四日／五日／七日時，改當四日再計原價。有應收列時用列上金額，不經這段。未查庫，未知後備是否在某月真的跑過。
- 依據：月費政策：「未設定每週日數檔者，畫面顯示未設定，不以四日計價」（`docs/policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md` 約第 91 行）。ops-guide §7.3 同句（`docs/year/2627/ops-guide.md` 約第 408 行）。讀取：`src/services/payrollHomeworkQueries.ts` 約第 289–291 行。這段原價會經 A3-02 的同一函式寫入計糧佣金。
- 影響：後備月份可能把未設定檔計成四日月費，抬高佣金原價。
- 建議：缺日數檔不要代入四日；與月費頁一樣略過或標未設定。
- 既有分題：無。與 A3-02 同一函式，規則不同。

### A3-06 功輔是否不入堂數池，先看科目字串

- 嚴重度：中
- 狀態：新發現
- 分類：功輔與私人課程混線
- 觀察：鑄池前若命名空間被標成功課輔導班，會直接不鑄池、不加堂。命名空間辨認功輔時只測科目與課程名稱是否含「功課輔導」「HWK」或「homework」，沒有先看 `class_kind=homework`。現有種子班科目是「功課輔導」、課程名稱含「功課輔導」，會被標成功輔並跳過堂數池。若日後班別種類已是功課輔導班，但科目與課程名稱都不再含這些字，中學部課程年級碼為 S1 時會落入專科同年級共用池。未查庫，不能把現有班說成已經入了專科池。
- 依據：月費政策：「功輔按每週報讀日數……收月費；不按堂扣、不補堂、不收專科逾期罰款」（`docs/policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md` 約第 16 行）。ops-guide §7.3：功輔月費另開單據，不填堂數（約第 408 行）。寫入：`ensureEntitlementPoolAndDeclarations` 僅在 `courseGroup === "homework"` 時返回（`src/services/entitlementQueries.ts` 約第 577–579 行）；確認收款抬池同樣跳過（約第 1315–1317 行）。讀取：`resolveEntitlementNamespace`（`src/lib/entitlementNamespace.ts` 約第 91–121 行）。
- 影響：現有種子班不會因此扣專科堂。分類若跟丟 `class_kind`，功輔報讀可能鑄進專科年級池，其後點名會扣專科已繳堂數。
- 建議：`class_kind=homework` 一律進功輔命名空間，不要只靠科目字串。
- 既有分題：`docs/product/topics/product-line-billing-models.md` 表頭 `done`。該題要三線分開；這條辨認殘餘不在其關帳清單。

## 低優先

1. 計糧讀取報讀期數失敗時只 `console.warn` 並繼續（`src/services/payrollQueries.ts` 約第 270–273 行）。期數空值會用預設每堂價（`resolvePriceForEnrollment`，`src/lib/enrollmentPeriod.ts` 約第 107–128 行）。2627 常規多不靠暑期第二期價；暑期第二期若查詢失敗，分成基數可能用了第一期價。未查到失敗紀錄。
2. 無 `schedule_id` 的出席列會按同班同日套到該日每一節（`attendanceForSchedule`，`src/services/scheduleRosterQueries.ts` 約第 509–521 行）。連堂兩節可能共用一筆舊列。現寫入有排程時會帶 `schedule_id`（`saveAttendanceStatus`）。這是舊列讀取，不是現寫入路徑。

低優先筆數：2。

## 移交

- 移交 A2：試堂扣堂要讀收款、老師改池受蓋印班限制，見 `attendance-marked-not-consumed.md` §3.2–3.3，屬權限路徑。
- 移交 A5：`campus-holiday-not-cancelled.md` 仍寫前端尚未合入；本工作樹批量排程已跳過校舍假期。
- 移交 A6：連堂堂數與功輔佣金兩班，未見純函式測試鎖住「兩列各 1 堂」與「兩班都入佣金」。

## 已排除

- 已報讀、權益池餘額為 0，仍可出現在點名紙。`rosterStudentsForSchedule` 不因餘額剔除（`src/services/scheduleRosterQueries.ts` 約第 565–593 行）。符合 ops-guide 與權益池定案：拖欠不等於不上紙。
- 退讀只在人手呼叫 `withdrawStudentFromClass` 時寫入（`src/services/studentQueries.ts` 約第 1893 行起）。未見學年或暑期結束自動改已退讀。
- 暑期第一期／第二期：`enrollmentCoversPeriod` 第二期生不涵蓋第一期日期（`src/lib/enrollmentPeriod.ts` 約第 36–44 行）。舊路徑點名冊用此函式；補回堂期數沿用 `makeup_of=` 原堂日期（`scheduleRosterQueries.ts` 約第 325–401 行）。2627 常規沒有這套期數。
- 單堂：報讀必須選定堂次（`insertEnrollment`，`studentQueries.ts` 約第 1502–1509 行）；宣告只掛傳入的 `schedule_id`（`resolvePackageScheduleTargets`，`entitlementQueries.ts` 約第 468–470 行）。
- 代堂：`assignScheduleSubstitute` 只更新排程 `teacher_id`／`original_teacher_id`（`src/services/scheduleQueries.ts` 約第 739–804 行）。`scheduleWriteQueries.ts` 檔頭註明不准寫 `classes.teacher_id`。計糧 `lessonForTeacher` 用該堂 `teacherId`（`src/lib/payroll/computeMonth.ts` 約第 30–31 行），與計糧指南 §2.3「由誰實際上堂，該節授課薪酬即歸誰」一致。
- 校舍假期：migration `20260902040000` 禁止在 `academic_calendar_closures` 當日新增或改期排程。批量排程遇到假期日會跳過，不寫取消列（`batchScheduleHelpers.ts` 約第 191–196 行）。分題 `campus-holiday-not-cancelled.md` 仍為 `in_progress`；「前端尚未合入」相對本工作樹已過時。未查庫，不能說生產沒有殘留取消列。功輔放假日與專科校舍假分開；政策寫明功輔放假包含專科 21 日，該閘擋住功輔佔室與規則相符。
- `makeup_of=` 仍由 `src/lib/scheduleMakeupMarkers.ts` 寫入與解析。本報告不建議刪除。
- 功輔時薪按編更工時，專科堂從 `buildLessonInputsForMonth` 剔除科目像功輔的班（`payrollQueries.ts` 約第 289–325 行），再在 `computeMonth` 另加時薪。現有功輔種子科目含「功課」，不會走專科人頭。收款頁功輔金額有傳課程編號，小學部價與中學部價分開（`PaymentsPageView.tsx` 約第 850–856 行）。
