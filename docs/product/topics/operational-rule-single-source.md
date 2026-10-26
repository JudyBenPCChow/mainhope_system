# 營運規則單一實作

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 高 |
| 範圍 | 同一條會影響學費、點名或單據的問題，只留一個可執行實作；其餘通道改為呼叫它 |
| 不含 | 重開學費追收頁、功輔產品、點名權益母題；把班別名單與點名紙併成同一條查詢；把 2627 常規第 N 期寫入 `academic_year_periods`；刪除 `makeup_of=` |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-10-24：畫面對話與定期報告已各有一份口徑，換期或改規則時只改到其中一層 |

## 一句

專科「本期要交」、功輔月費、點名紙名單、對話直接寫庫，各自有第二份實作。收口是刪掉第二份裡的規則，不是再寫一份說明。

## 開工閘

- 一組做完再做下一組。預設先做組 1（定期追收 PDF 已與畫面分叉，而且會寄出）。
- 不改已關帳分題的產品決定。組 1 沿用 [`tuition-chase-list.md`](./tuition-chase-list.md)：本期＝仍有上課日 ≥ 查庫日的最早一期。
- 班別名單（誰報了這班）與點名紙（這一堂誰該在紙上）維持兩題。見文末「不要併」。
- 常規學年期數繼續以 `src/lib/specialistTuitionPeriods.ts` 為真源。暑期兩期繼續以 `academic_year_periods` 為真源。

---

## 組 1　專科本期要交幾堂

**同一題：** 某個查庫日，這名學生在常規第 N 期還要交幾堂、要不要出現在追收名單。

| 實作 | 位置 | 口徑 |
| --- | --- | --- |
| 畫面（留這份） | `resolveSpecialistTuitionPeriods`（`src/lib/specialistTuitionPeriods.ts`）；組裝在 `src/services/tuitionChaseQueries.ts` | 本期＝仍有上課日 ≥ 查庫日的最早一期。日期集合來自附件甲。要交用有效宣告，計費出席用 `isBillableAttendanceStatus`（`src/lib/attendanceBilling.ts`） |
| 同一真源的其他讀者 | `src/services/entitlementQueries.ts` 亦呼叫 `resolveSpecialistTuitionPeriods` | 與畫面同一份期數 |
| 定期 PDF（衝突） | `scripts/export_2627_period2_tuition_chase.py` 的 `PERIOD2_DATES`；`scripts/send_admin_pdf_reports.py` 載入該檔；排程經 `supabase/functions/admin-pdf-reports` → `.github/workflows/admin-pdf-reports.yml` | 日期表寫死常規第二期（2026-09-29 至 2026-11-01），`periodLabel` 固定「常規第二期」。計費出席用檔內 `BILLABLE` 集合，沒有 `isBillableAttendanceStatus` 的子字規則 |
| 對話說明（衝突） | `.cursor/skills/tuition-chase-pdf-mail/SKILL.md` | 寫明進入第三期要先改上述 Python 的期數日期 |

**衝突在選期，不在第二期那張日期表本身。** `PERIOD2_DATES` 與 `specialistTuitionPeriods.ts` 常規第二期的 28 個上課日目前相同。畫面用 `indexOfEarliestUnfinishedPeriod`：由第一期往後，找到仍有上課日 ≥ 查庫日的最早一期。PDF 沒有這一步，永遠用第二期。

例：2026-10-01。第一期仍有 10 月 3 日，畫面的本期是常規第一期，10 月 3 日的宣告算本期還會扣；9 月 29 日已屬第二期，畫面把它算進下期。PDF 只收 `PERIOD2_DATES`，10 月 3 日不入帳，9 月 29 日卻當本期。2026-11-02 起第一、二期都已沒有未上完的上課日，畫面轉入常規第三期（第三期含 10 月 27 日起的上課日）；PDF 仍只出第二期。

**衝突也在「還會扣」怎樣看待已點名的狀態。** 兩邊都把計費出席與事假／病假剔出還會扣，空白未點才計入。分歧在不在白名單上的狀態：畫面 `isBillableAttendanceStatus` 對含「網課／線上」計為已扣，其餘已寫狀態（含「缺席」、不是精確「病假」的請假字）計為不扣、不進還會扣。PDF 只認 `BILLABLE` 與 `NONDEDUCT`（「事假」「病假」兩個精確字）裡的字；對不上的狀態仍加進 `pending_units`。

**衝突在名單收誰。** 要交堂數的公式同是 `max(0, 本期還會扣 − 尚餘)`。畫面另算下期要交，尚餘已夠的人留在「已預繳」。PDF 在 `due <= 0` 時 `continue`，不下期、不列已預繳；`initial_lessons` 與已繳堂數都是 0 的池也整池跳過。

**收口：** PDF 改為消費 `specialistTuitionPeriods.ts` 的產出（Node 出 JSON，Python 只排版）。計費出席改呼叫同一白名單。skill 刪掉「換期請改 Python 日期表」。對拍：同一查庫日，畫面與 PDF 的期名、要交堂數一致。

---

## 組 2　功輔這個月收多少

**同一題：** 這名功輔生在某個曆月的月費金額，以及休學是否計入。

| 實作 | 位置 | 口徑 |
| --- | --- | --- |
| 功輔頁與價目（留這份） | `homeworkMonthlyFeeHkd`／`FEE_TABLE`／`PRIMARY_FEE_TABLE`（`src/lib/homeworkTutoringFees.ts`） | 中學部按年級；小學部（course code 含 HWKP）用獨立價；12 月／2 月四分三。小學生留在中學部跟中一價 |
| 誰要計費（留這份） | `mapHomeworkEnrollStatus`、`composeHomeworkFeeDisplays`（`src/lib/homeworkTutoringUi.ts`） | 資料狀態「休學」顯示為「暫停」，只計「在籍」（對應就讀中） |
| 追收 PDF（衝突） | 同組 1 的 `export_2627_period2_tuition_chase.py`：`FEE`、`PRIMARY_FEE`、`hw_fee` | 另一份價目表，四分三用 `round(base * 3 / 4)`。SQL 只取 `status = '就讀中'`，因此休學目前不會入 PDF |
| 對話說明 | `.cursor/skills/tuition-chase-pdf-mail/SKILL.md` | 散文重述「休學不計、價目跟日數檔」 |

**今天的銀碼與休學沒有算錯，衝突在價目寫了兩次。** 中學部、小學部、七日檔的數字，與「course code 含 HWKP 才用小學價、否則小學生跟中一」一致。12 月／2 月都是基價×3／4；現有基價乘出來是整數，`Math.round` 與 Python `round` 結果相同。休學在畫面先對成「暫停」再只留「在籍」，PDF 的 SQL 只取 `status = '就讀中'`，兩邊都不收休學。

分叉點是之後只改一邊：`FEE_TABLE`／`PRIMARY_FEE_TABLE` 與 `hw_fee` 的 `FEE`／`PRIMARY_FEE` 沒有共用。新日數檔、改銀碼、或四分三出現 .5 時，功輔頁用 `homeworkMonthlyFeeHkd`，寄出的 PDF 仍用 `hw_fee`。`mapHomeworkEnrollStatus` 另把任何含「暫停」的字都當成暫停；資料庫沒有這個狀態，PDF 也不讀這個字。

**收口：** PDF 的功輔金額改呼叫 `homeworkMonthlyFeeHkd`。Python 內的 `FEE`／`PRIMARY_FEE` 刪除。

---

## 組 3　這一堂點名紙有誰

**同一題：** 某個 `schedule_id` 上該出現的學生姓名。

| 實作 | 位置 | 口徑 |
| --- | --- | --- |
| 畫面點名紙（留這份） | `rosterStudentsForSchedule`（`src/services/scheduleRosterQueries.ts`），資料來自 `get_teacher_schedule_roster_context` | `2627` 起常規學年：有效宣告 ∩ 該班就讀中 ∩ 報讀日／退讀生效日，再加試堂與補堂目標。暑期與較舊學年走 `legacyRosterStudentsForSchedule`：就讀中報讀，並用 `enrollmentVisibleOnSchedule`（`src/lib/enrollmentPeriod.ts`）擋暑期期數與單堂。試堂用 `paidTrialObligesSchedule`（`src/lib/trialLessonObligation.ts`）：已收款、未取消、**排除待改期**。請假套到哪一節用 `leaveAppliesToSchedule`：已綁其他排程的假，不可再用同班同日套到連堂另一節 |
| 正式明日電郵（衝突） | `teacher_tomorrow_lesson_email_payload` 的 `roster`／`leaves`（最新定義 `supabase/migrations/20261023231000_tomorrow_lesson_include_duty_shifts.sql`）；Edge `tomorrow-teacher-lesson-reminder` 呼叫此函式 | 專科：宣告 ∩ 就讀中 ∩ 日期閘。功輔／私人：只看就讀中報讀，不要求宣告。試堂只排除狀態含「取消」，**不排除待改期**。不看學年硬閘，暑期小組班也走宣告。請假的同班同日後備要求 `schedule_id` 為空，這點與畫面一致 |
| 對話查詢（衝突） | `.cursor/skills/tomorrow-teacher-lesson-reminder/SKILL.md` 與 `queries.md` 查詢 2、查詢 3 | 說明寫專科用宣告、功輔／私人用就讀中報讀。查詢 2 卻對所有班型只 join 宣告，功輔與私人課程會漏人。試堂同樣只排除「取消」。查詢 3 的同班同日條件沒有要求 `schedule_id` 為空，已綁另一節的假會套到連堂的另一節 |

`2627` 專科、已收款且未取消的試堂、補堂目標、就讀中加報讀日／退讀日：畫面與電郵函式這幾段一致。衝突在下面四個條件。

1. **待改期。** 畫面 `paidTrialObligesSchedule` 在狀態是「待改期」時回傳否，該生不在這堂點名紙。電郵函式與 skill 查詢 2 只寫 `status not like '%取消%'`。「待改期」不含「取消」，電郵仍列出。
2. **暑期與 `2627` 以前的小組班。** 畫面 `usesEntitlementRosterModel` 對 `*SM` 與較舊 label 走舊路徑：就讀中報讀，再用 `enrollmentVisibleOnSchedule` 對 `academic_year_periods` 擋期數，單堂還要綁定該 `schedule_id`。電郵函式不讀學年 label；`class_kind` 不是功輔或私人就必須有 `status = 'active'` 的宣告。暑期沒有這批宣告時，點名紙有名、電郵名單是空的。
3. **功輔與私人，只在 skill 查詢 2。** 電郵函式第二段 `union` 對這兩種班型改為就讀中報讀，不要求宣告，與畫面舊路徑的「有報讀即上紙」同方向。skill 說明寫了這句，查詢 2 卻對所有班型只 `join attendance_declarations`。沒有宣告的功輔生、私人課程學生不會出現在 agent 手跑的名單，卻會出現在正式電郵與點名紙。
4. **連堂請假套錯節，只在 skill 查詢 3。** 畫面 `leaveAppliesToSchedule` 與電郵 `leaves`：`schedule_id` 已指向其中一節時，不再用「同班而且同日」套到另一節。查詢 3 是 `schedule_id = 這一堂 or (同班 and 同日)`，沒有 `schedule_id is null`。已綁第一節的假會出現在第二節。

**收口：** 電郵函式與 skill 的學生名單改為呼叫與 `rosterStudentsForSchedule` 相同的規則（可把該函式收成一支 Postgres 函式，供畫面 RPC 與電郵共用）。skill 不再附第二份名單 SQL。對拍：同一 `schedule_id`，點名紙姓名與電郵姓名一致，含待改期、功輔、連堂兩節。

未點名「這堂該不該催」不要併進本組。`list_missing_roll_call_lessons`（`supabase/migrations/20261012123000_list_missing_roll_call_lessons.sql`）與 `.cursor/skills/missing-roll-call-reminder/queries.md` 目前條件一致，但是兩份 SQL；函式改了 skill 不會自動跟著改。專科跟進 `.cursor/skills/specialist-rollcall-followup/queries.md` 是另一題（部分點名、出席無有效宣告、空班不算未點名）。收口時：每日未點名只留函式，skill 改為呼叫它；跟進報告維持獨立，不要塞進未點名函式。

---

## 組 4　補堂與試堂單據怎麼寫入

**同一題：** 個別調堂掛哪一堂、全班補回如何標記、試堂半價單據長什麼樣子。

| 實作 | 位置 | 口徑 |
| --- | --- | --- |
| 畫面收款（留這份） | `lineAmountFor`（`src/components/payments/paymentsUi.tsx`） | 試堂半價仍填正價；折扣由優惠目錄「試堂半價（50%）」套用，不直接把實收寫成唯一金額 |
| 全班補回（留這份） | `arrangeMakeupForCancelledSchedule`（`src/services/scheduleMakeupQueries.ts`） | 寫入 `schedules.remarks` 的 `makeup_of=<取消堂 id>`，供查重 |
| 個別調堂（留這份） | `src/services/leaveQueries.ts`（寫 `leave_makeup_records.makeup_schedule_id`） | 請假列綁補堂排程 |
| 對話寫庫（衝突） | `.cursor/skills/frontdesk-makeup-trial-ops/SKILL.md` 與 `reference.md` | 用 service role 自行 `insert`／`update`：宿主堂、半價的 `payments`／`payment_details`／`payment_discount_applications`、確認收款後抬試堂權益。規則寫在 markdown，不經過上述函式 |

畫面函式會拒絕或一併寫齊的欄位，對話 SQL 可以只寫其中一部分。衝突在欄位，不在「有 skill 這件事」。

1. **半價單的金額欄。** `lineAmountFor` 在試堂半價時仍回傳正價×堂數，半價差價由優惠「試堂半價（50%）」寫進 `payment_discount_applications`。skill 的正確表也是這樣，但 `reference.md` 允許直接 `insert`。只把 `payment_details.amount` 與 `payments.total_amount` 寫成實收、不插入優惠列時，單據仍能存進庫，畫面上的優惠與正價對不上。
2. **收款狀態與試堂池。** 畫面確認收款才把 `payments.status` 改為已收款，並經 `topUpEntitlementsForPayment` 寫 `course_group = 'trial'` 的池與 `reason = entitlement_top_up`。對話可以先把狀態改成已收款而跳過抬池：點名紙因已收款出現試堂生，扣堂時沒有試堂池。未收就標已收款，是同一處狀態欄沒有跟「待收款」綁在一起。
3. **個別調堂的宿主。** `leaveQueries.ts` 把選定的 `makeup_schedule_id` 寫上請假列。宿主必須是「該生未就讀、優先 0 人」這條規則只寫在 skill 正文，資料庫不拒絕原班。掛回原班時，該班點名紙仍讀就讀中報讀，其他學生一併上紙。這不是 `makeup_of=`：個別調堂不寫該標記。
4. **全班補回的查重標記。** 只有 `arrangeMakeupForCancelledSchedule` 保證 `remarks` 含 `makeup_of=<取消堂 id>`。對話若按 `reference.md` 另插一堂、備註只寫「補堂（班代碼）：姓名」，跟進表找不到這次補回，同一取消堂可以再排一堂。
5. **已取消試堂的改期。** `rescheduleTrialSession` 拒絕已取消、已有結果的試堂，而且新排程必須同一班。skill 寫明導師請假取消後應改同一筆的 `schedule_id` 並把狀態設回已預約、保留 `payment_id`。呼叫函式會被拒，手改則繞過「不可改期」；兩條規則同時存在。

**收口：** skill 只傳學生、班別、日期、金額與半價或正價，寫入改呼叫畫面同一批函式（或與它們等價的 RPC）。`reference.md` 不再保留第二套 insert 範本。`makeup_of=` 繼續由 `arrangeMakeupForCancelledSchedule` 寫入。

---

## 不要併

| 看起來像同一題 | 實際是兩題 | 留在原處 |
| --- | --- | --- |
| 班別及就讀學生 PDF | 誰的報讀狀態為就讀中，不是這一堂的點名紙 | `.cursor/skills/class-roster-pdf/queries.md` |
| 學費追收頁不含功輔 | 追收頁答專科常規第 N 期；功輔月費在功輔頁與 PDF | 不要為了單一查詢把功輔行加回追收頁 |
| 暑期期數 | 只存在 `academic_year_periods`，由 `enrollmentPeriod.ts` 讀取 | 不要抄一份日期進 TypeScript |

## 驗收

每一組收口時：

1. 該題只剩一個實作檔（或一支函式）。另一份不再含日期表、價目表、名單 join 或 insert 範本。
2. 對拍至少一組真實形狀：期數交錯的查庫日、待改期試堂、功輔就讀生、連堂兩節裡只綁其中一節的假。
3. 政策句子若沒有改口徑，不必改 `docs/policies/`。改了口徑才同步政策與 2627 指引 markdown。
