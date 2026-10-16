# 覆核稿：手誤清除報讀後，到課宣告仍有效

覆核與收窄後方案已寫入 [`docs/product/topics/enrollment-declaration-transfer-and-purge.md`](../../product/topics/enrollment-declaration-transfer-and-purge.md)。本檔保留為當日討論與查庫紀錄。

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-10-07 |
| 性質 | 討論與查庫紀錄。方案未拍板 |
| 庫 | MainHope_production（`gudmbilboyhouotilrvt`）。下文時間皆為資料庫 UTC |
| 程式 | 本機工作樹閱讀，未改程式 |

請另一位代理覆核事實是否成立、推論是否越線、原則是否足以擋住這兩個例子。不要依本檔改程式、不要清資料、不要回寫 `docs/product/BACKLOG.md`。

## 不要做

- 不要實作手誤清除、退讀、改期繼承或確認文案。
- 不要作廢或刪除張以諾中文 B、蔡曉朗中文 A、蔡曉朗中三數學的殘留宣告。
- 不要重做已寫入的兩筆營運操作（見下節「本對話沒有重查的既有寫入」）。
- 不要把「推論」一節寫成已證實的按鈕操作。

## 本對話沒有重查的既有寫入

上一輪對話交代這兩筆已寫入 production，本檔作者沒有再查這兩筆的學生出席或請假：

- 2026-09-20 Christine Fan 三堂取消，原因老師請假。涉及中五吳晉銘、霍健一；中六陳心然待補課；中四 B 班當時判斷為無報讀、無待補課。
- 2026-09-03 趙海嵐 CRE 一對一點名「現場」（無堂數池、無扣堂）。

本檔只另外查到：中文 B（`2627-CHIS4001-B`）2026-09-20 排程 `9e01ed21-eb13-4f38-8f71-2339c2e4f1f7` 的 `status=取消`、`cancel_reason=老師請假`、`updated_at=2026-10-06 16:54:35.92176+00`。沒有核對其餘兩堂，也沒有核對趙海嵐。

## 討論背景

題目是：手誤清除或刪除報讀時，到課宣告、共用堂數池、出席、補堂應如何收。未拍板。

曾提出、並在對抗裡未通過的方案是：「只作廢該班有效宣告、不刪池、其他班不動、出席照退讀先問。」未通過的原因：2627 起正式點名紙要「仍有該班報讀」並且「該堂有有效宣告」。刪走報讀之後，此人已經不在該班正課紙上。作廢宣告不能靠「讓他離開點名紙」成立。

當時列出、尚未收窄的四項：

1. 補堂／請假：已排補堂日的人會以請假列上點名紙，不看該班報讀。
2. 待補堂：`student_pending_lessons.enrollment_id` 在報讀刪除時設為空白，狀態可仍是「待補」。這與請假後的待補課不是同一張表。
3. 出席確認：要在文案寫明後果，並且在寫入當下重查；與確認時不一致就整筆中止。
4. 作廢該班每一堂，任一座失敗就不要刪報讀。

其後改從張以諾中文 B、蔡曉朗中文 A 這兩個殘留例子看原則，而不是先寫產品句。

## 程式行為（閱讀結果，未改）

### 手誤清除不結束到課義務

`purgeMistakenEnrollment`（`src/services/studentQueries.ts`）會：

1. 重查該生該班出席。
2. 依確認結果刪除或保留出席。
3. 刪除該報讀的 `enrollment_change_events`、`student_enrollment_sessions`，再刪除 `student_class_enrollments`。
4. 呼叫 `syncStudentEnrollmentState`。

它不呼叫 `voidStudentDeclarationsOnClassFromDate`。學生詳情的確認文案寫「不留下任何痕跡」（`src/components/students/StudentDetailView.tsx`）。`purgeMistakenEnrollment` 本身不寫 `mgmt_audit_log`。

出席確認（`src/lib/enrollmentAttendanceConfirm.ts`）：沒有出席列就不再問。有出席時，手誤清除的預設按鈕是刪除出席；退讀的預設按鈕是保留出席。文案只講出席，不講宣告、堂數池、待補堂、請假。

寫入時 `applyEnrollmentAttendanceDeletes` 會重查出席，但只刪確認當下記下的 `deleteAttendanceIds`。確認之後新出現、且舊列仍在的出席，不會被刪，清除仍會做完。`deleteAttendanceHitsWithAuditOrThrow`（`src/services/attendanceLifecycleQueries.ts`）只刪出席列，不寫 `entitlement_reinstated`。

### 退讀會作廢，但失敗不中止，而且只從生效日起

`withdrawStudentFromClass` 在更新報讀之後呼叫 `voidStudentDeclarationsOnClassFromDate`。該函式失敗時只 `console.error`，退讀仍算完成。

`voidStudentDeclarationsOnClassFromDate`（`src/services/entitlementQueries.ts`）只處理 `scheduled_date >= fromDate`、狀態不含「取消」的排程，並且只把 `active` 改成 `void`。不改堂數池餘額。

### 堂數池不會跟著報讀刪掉

`supabase/migrations/20260815183000_entitlement_pool_course_group.sql` 把 `student_entitlement_pools.source_enrollment_id` 改為可空，外鍵 `ON DELETE SET NULL`。註解寫首次鑄池的報讀可空，退讀時設為空白，不級聯刪池。專科共用鍵是年級碼（例如 `S4`），不是班別。

因此手誤清除刪報讀時：池還在，餘額不變，`source_enrollment_id` 變空白，其他班指向同一池的宣告也不動。

### 正式點名紙

2627 起 `rosterStudentsFromDeclarations`（`src/services/rosterEligibilityService.ts`）對宣告路徑要求：該堂有效宣告，並且該生仍有該班報讀、通過報讀日與退讀日閘。試堂、以及 `leave_makeup_records.makeup_schedule_id` 指向該堂的補堂，另外加入，不要求該班報讀。

`fetchRosterForRollCall` 在權益模型學年只回傳「報讀 ∩ 有效宣告」。`RollCallClassPanel` 再補上試堂與補堂生。

只刪報讀，正課紙會沒有此人。補堂請假列仍可把他放上另一堂的紙。殘留的有效宣告本身不會單獨把他放上正課紙。

### 改期補回會把已作廢的宣告抄回新堂

`inheritDeclarationsAcrossSchedules` 讀原堂 `active` 與 `void`，同一學生同一原堂優先取 `active`，否則取最新 `void`，然後在新堂插入 `active`。不檢查該生是否仍有該班報讀。

全班補回加堂（`src/services/scheduleMakeupQueries.ts`）在新堂寫入 `makeup_of=` 備註後呼叫此函式，`source_event_type` 為 `class_reschedule`。

軟取消排程（`src/services/scheduleLifecycleQueries.ts`）對受影響排程呼叫 `voidActiveDeclarationsForSchedules`，不按「現有報讀」過濾，也不改池。

同一堂同一學生只容許一筆 `active`（部分唯一索引 `attendance_declarations_active_schedule_student_uidx`）。`ensureEntitlementPoolAndDeclarations` 遇到這條衝突會略過插入。

## 查庫：張以諾

學生 `20261908`，`students.id = 3718449b-22c0-46ca-8633-3f3e9183616e`。

現有報讀只有一筆：中文 A `2627-CHIS4001-A`，`enrollment_id = ff7dbd15-379e-436a-97f9-44e211938b4f`，狀態就讀中，`enroll_date = 2026-09-12`。增退事件一筆：`action=enroll`，`effective_date=2026-09-06`，原因「由 2026-09-12 起報讀」，`created_at=2026-09-06 06:20:05.110792+00`。沒有中文 B 的報讀，也沒有中文 B 的增退事件。

到課宣告（皆 `source_event_type=enrollment_auto`，皆指向池 `958bd54b-fb5a-4e2d-a331-ac135aa57bf0`）：

| 班 | 狀態 | 筆數 | 排程日期範圍 | 宣告建立 |
| --- | --- | --- | --- | --- |
| `2627-CHIS4001-A` | active | 39 | 2026-09-12 至 2027-06-26 | 2026-09-06 06:20:06.297734+00 |
| `2627-CHIS4001-B` | active | 39 | 2026-09-06 至 2027-06-27 | 2026-09-05 10:49:05.21913+00 |
| `2627-CHIS4001-B` | void | 1 | 2026-09-20 | 建立同上；`updated_at=2026-10-06 16:54:35.92176+00` |

該 void 列所在排程就是上一節的 `9e01ed21-eb13-4f38-8f71-2339c2e4f1f7`。排程 `updated_at` 與宣告 `updated_at` 同為 `2026-10-06 16:54:35.92176+00`，`cancel_reason=老師請假`。其餘 39 筆 B 班宣告仍是 active。B 班沒有他的出席列。

堂數池 `958bd54b-fb5a-4e2d-a331-ac135aa57bf0`：`course_group=group_specialist`，`namespace_key=S4`，`initial_lessons=3.00`，`remaining_lessons=1.00`，`source_enrollment_id` 空白，`class_id` 仍指向中文 B（`fc31bdd5-45cb-464d-a939-58d9f49631cf`），`created_at=2026-09-05 10:49:04.725896+00`。另有一筆試堂池指向物理 B `2627-PHYS4001-B`，與這口 S4 池無關。

消耗與入帳（`entitlement_consumption_events`）：

| 時間 (UTC) | 原因 | 堂數 | 班／日期 |
| --- | --- | --- | --- |
| 2026-09-06 06:20:46 | entitlement_top_up | +3 | 無排程 |
| 2026-09-19 03:37:54 | entitlement_top_up | +1 | 無排程（同時段建立試堂池） |
| 2026-09-19 11:36:06 | entitlement_consumed | −1 | 中文 A 2026-09-19 |
| 2026-09-28 07:00:58 | entitlement_consumed | −1 | 中文 A 2026-09-12 |
| 2026-09-30 03:06:13 | entitlement_consumed | −1 | 物理 B 2026-09-22 |

出席：中文 A 2026-09-12 現場、中文 A 2026-09-19 現場、物理 B 2026-09-22 現場。沒有請假列。沒有待補堂。

`mgmt_audit_log` 以學生 id、姓名、現有報讀 id、S4 池 id 搜尋，零列。

## 查庫：蔡曉朗

學生 `20261812`，`students.id = 7666b95d-8a59-42aa-9ee6-ebd6b516fe91`。

現有報讀：

- 中四數學 A `2627-MATHS4001-A`，就讀中，`enroll_date=2026-09-01`，`enrollment_id=26a9c1d0-a361-42b8-aa6f-e1cd0f442bd6`。增退事件 `created_at=2026-09-05 08:25:09.13792+00`，`effective_date=2026-09-05`，原因「由 2026-09-01 起報讀」。
- 暑期數學 B `26SM-MATHS4008-B`，兩期全報，`enroll_date=2026-07-09`。暑期不走這套到課宣告。

沒有中文報讀，也沒有中文增退事件。

中文 A `2627-CHIS4001-A`：40 筆 `active`、`enrollment_auto`，排程日期 2026-09-05 至 2027-06-26，建立於 `2026-09-05 07:24:57.919005+00`。沒有他在該班的出席、請假或待補堂。

這些中文宣告與數學 A 的宣告指向同一口池 `9cb137d6-4e6f-4df2-b73d-e9470d6e9b85`：`group_specialist`／`S4`，`initial_lessons=8.00`，`remaining_lessons=3.00`，`source_enrollment_id` 空白，`class_id` 指向數學 A（`b99388b9-801a-4ec3-a655-97d304a00a1c`），池建立於 `2026-09-04 11:34:12.102344+00`。池比現存數學報讀事件早，也比中文宣告早。

數學 A 另有 40 筆 active 宣告（2026-09-05 至 2027-06-22）及 1 筆 void（排程日 2026-09-01）。扣堂發生在數學班次，沒有落在中文 A。入帳為 2026-09-04 +4、2026-09-29 +4。消耗五筆：數學 B 2026-09-07、數學 A 的 2026-09-08、09-15、09-22、09-29。8 − 5 = 3，與池餘額一致。

稽核查詢與張以諾同一條，零列。

### 蔡曉朗另一筆：中三數學上的補回宣告

這筆不是「中文報讀被清掉」的同一形狀，但是同一個學生身上、改期繼承會抄 void 的實例。

| 列 | 內容 |
| --- | --- |
| void | 班 `2627-MATHS3001-A`，排程日 2026-09-12，`source_event_type=student_makeup`，`source_event_id=386efd0c-70e9-4650-93f0-8abfe7bd923e`，建立 `2026-09-06 02:49:05.897206+00`，更新 `2026-09-06 02:50:38.437+00` |
| 該 `source_event_id` | 仍在的請假：學生是蔡曉朗，班是中四數學 A `b99388b9-801a-4ec3-a655-97d304a00a1c`，請假日 2026-09-05，補堂日 2026-09-07，狀態已完成 |
| 被取消的原堂 | `e1b26ec8-dfec-4993-93cc-c063683d4883`，班 `2627-MATHS3001-A`，2026-09-12，`status=取消`，`cancel_reason=導師請假`，`updated_at=2026-09-06 02:50:38.609+00` |
| active | 同班 2026-09-10，排程狀態正常，`source_event_type=class_reschedule`，建立 `2026-09-06 03:05:02.896554+00`。備註為 `makeup_of=e1b26ec8-dfec-4993-93cc-c063683d4883；補回 2026-09-12；原因：導師請假` |
| 該新堂 | `updated_at=2026-09-06 03:05:02.652945+00` |

他沒有中三數學報讀。他 2026-09-07 的現場出席在中四數學 B `2627-MATHS4001-B`，與上述請假的補堂日一致。中三這兩筆宣告也指向同一口 S4 池，沒有對應的中三消耗列。

## 推論（請覆核，不要當成已證實的操作紀錄）

1. 張以諾中文 B、蔡曉朗中文 A 的形狀與現行程式的手誤清除相符：報讀與增退事件都不在，`enrollment_auto` 宣告仍是 active，池的 `source_enrollment_id` 為空白。程式上能同時做出這三件事的路徑是 `purgeMistakenEnrollment` 加上外鍵 `ON DELETE SET NULL`。沒有稽核列，不能證明當日按的是這個按鈕，還是有人直接刪報讀列。
2. 張以諾的 S4 池與 B 班宣告同一秒建立，`class_id` 仍是 B，其後 A 班宣告寫進同一口池。這與「先報 B、再報 A、B 的報讀後來被刪」相符。A 班兩次現場扣的是這口池，B 班宣告沒有產生消耗。
3. 2026-10-06 取消中文 B 的 2026-09-20 時，軟取消把該堂所有 active 宣告改 void，不過濾報讀。張以諾因此少了 1 筆，其餘 39 筆仍在。這說明「紙上沒有他」之後，按宣告走的寫入仍會碰到他。
4. 蔡曉朗中三：一筆 `student_makeup` 寫在中三 9 月 12 日，其 `source_event_id` 卻是他中四數學 A 的 9 月 5 日請假。約一分鐘後該中三堂因導師請假取消，宣告被 void。約十五分鐘後補回堂建立，`inheritDeclarationsAcrossSchedules` 的呼叫形狀與備註、`class_reschedule`、時間戳相符；繼承函式會把最新 void 抄成新堂 active。本檔沒有逐行證明當次請求一定走了 `scheduleMakeupQueries.ts` 那個函式，只證明庫內結果與該函式的寫入形狀一致。
5. 兩人在錯誤班都沒有出席、沒有待補堂。出席確認與待補堂都不是這次殘留的成因。

## 本對話提出、尚未拍板的原則

共用堂數池的壽命跟「這名學生、這個年級、這個課程組」走。某一班的到課義務跟「這筆報讀」走。手誤清除現在只刪後者的報讀列，不結束義務。

點名紙看兩者的交集，所以只刪報讀，正課紙會乾淨，義務列仍會被軟取消與改期繼承讀到。只作廢該班宣告可以讓「此刻有效」變假，但現行繼承會把 void 再抄成新堂的 active。蔡曉朗中三 9 月 10 日是已發生的抄回；張以諾中文 B 的 39 筆與蔡曉朗中文 A 的 40 筆若日後整堂改期，會走同一條繼承。

因此「作廢該班每一堂」不足以單獨成句。要一併改的是繼承：該生此刻沒有該班報讀，且這筆不是仍有效的補堂請假，就不要抄到新堂。池的餘額與其他班宣告仍然不動。

選錯組別不應再依賴「手誤清除後另報一班」。那條路在這兩個例子裡留下舊班義務，並刪掉增退事件。轉組應沿用同一口池，舊班義務作廢、新班另建宣告。按鈕文案「不留下任何痕跡」與庫內結果相反：刪掉的是增退事件，留下的是仍會被讀到的宣告。

這段是討論結論，不是已同意的產品句。

## 建議覆核的問題

1. 正式點名紙是否還有別的入口會只看 active 宣告、不看報讀？本檔只對過 `rosterStudentsFromDeclarations`、`rosterStudentsForSchedule`、`fetchRosterForRollCall` 與 `RollCallClassPanel`。
2. `inheritDeclarationsAcrossSchedules` 以外，是否還有路徑會把 void 宣告重新插成 active？
3. 張以諾 B、蔡曉朗中文 A 的報讀刪除，有沒有本檔沒查的表（例如收據、繳費明細、作業輔導名冊）仍指向已刪的 `enrollment_id`？本檔沒有查繳費單。
4. 蔡曉朗那筆 `student_makeup` 為何寫到中三 9 月 12 日，而請假本身的補堂日是 9 月 7 日、出席在中四數學 B。本檔只核到 `source_event_id` 與兩張排程，沒有重演當日寫入。
5. 若日後同意改繼承規則，蔡曉朗中三 9 月 10 日這筆 active 應如何定性：它是錯誤抄回，還是當日補回流程的預期結果？本檔傾向前者，但沒有當日操作原文。
