# 試堂後老師評語

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | 試堂生實際出席後，老師撰寫約 30 字評語；前台在試堂跟進列讀取，用以回訪並促成正式報讀 |
| 不含 | 銷售工作台、下次聯絡日、跟進負責人；把評語自動發給家長；改本堂教學紀錄的用途；催評語電郵／收件匣；快捷片語；試堂列「評語未到」篩選；學生詳情再掛一份評語 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md)（審批通過並合入 `main` 後才搬列） |
| 立案 | 2026-10-23 |
| 定案 | 2026-10-23（併入 UX 評審與工程審閱；模擬後鎖定不回填上線日及以前） |
| 對照 | [`trial-sessions.md`](./trial-sessions.md)（試堂收款與出席已結案）；[`trial-sessions-page-review.md`](./trial-sessions-page-review.md)（試堂頁跟進主按鈕；已明確不做銷售工作台）；[`trial-teacher-comment-ux-review.md`](./trial-teacher-comment-ux-review.md)（已併入）；[`trial-teacher-comment-review.md`](./trial-teacher-comment-review.md)（已併入） |

## 一句

評語掛在該筆試堂。點名儲存成功後，老師在同一張點名紙寫可對家長說的短評；略過者留在老師首頁。前台在試堂頁「正式報讀」列先讀再打，不再以 WhatsApp 催收。

## 開工閘

1. **本檔未獲審批前不開工**：不改 schema、不改點名紙、不改試堂頁、不改老師首頁。
2. **不擋 [`trial-sessions-page-review.md`](./trial-sessions-page-review.md)**：該題已改過 `/TrialSessions` 主按鈕；本題只在「正式報讀」列上方加評語區塊。若兩題同時改 `TrialSessionsView.tsx`，後合入者 rebase，不要等該題關帳。
3. 實作須跟下方「已鎖定」各節；不要再發明 overlay、篩選或快捷片語。
4. **不催老師回填舊堂**：`trial_date` ≤ 功能上線日（香港日，含當日）的試堂，點名後不開評語表單、不進老師首頁待辦。前台試堂列**仍有**評語區塊，可把既有 WhatsApp 評語代貼進去，但不標「評語未到」（那是催老師的語氣）。上線日寫成程式常數，等於首次合入 production 的香港日期，不要用「今天」動態回推。

---

## 對兩份審閱

原立案方向正確。以下為定案採納；不採納項不得在實作時「順便」加回。

### UI／UX 評審

| 意見 | 採納？ | 定案 |
| --- | --- | --- |
| 不擋點名、不擋正式報讀／標流失 | **採納** | 維持 |
| 評語不寫進教學紀錄、不寫進結果備註 | **採納** | 維持 |
| 實際出席才要求；缺席／請假不寫 | **採納** | 含錄影回放等，沿用 `isActualPresentStatus` |
| 不在點名表加欄；不另開路由 | **採納** | 見「互動契約」 |
| 有待寫評語時不出「點名已儲存」橫幅 | **採納** | 評語表面頂部寫「點名已儲存，請為試堂生寫評語」 |
| 流動裝置：同一 overlay 內把名冊換成表單；禁止再疊 bottom sheet | **採納** | |
| 桌面：置中 Dialog；遮罩不可點關閉；`Esc`＝稍後再寫 | **採納** | 須擋住點名紙原有 `Esc` 關閉 |
| 次動作文案「稍後再寫」，不用「略過／取消」 | **採納** | |
| 部分填寫只存已填格；全空白則主按鈕停用 | **採納** | 不要讓老師存入「。」清待辦 |
| 字數可見；30 不是下限；80 硬上限 | **採納** | |
| 首頁待辦用資訊色，不要 `warning` | **採納** | 對齊「即將試堂」 |
| 已結束結果（正式報讀／流失／其他）退出待辦 | **採納** | 原案「直至寫完」會變成噪音 |
| 「評語未到」中性語氣，旁加「仍可正式報讀」 | **採納** | 禁止 `warning`／`destructive` |
| 有評語可複製 | **採納** | |
| 行政代貼走獨立動作，不復用「寫備註」 | **採納** | |
| 列表聚焦時靜默重抓；寫入後 `invalidate` | **採納** | 不要為本欄取消整頁 TTL 快取 |
| 禁止快捷片語、兩個必填欄、評語未到篩選、學生詳情再掛 | **採納** | |

### 工程審閱

| 意見 | 採納？ | 定案 |
| --- | --- | --- |
| 五欄（內容／首次寫入／首次人／最後編輯／最後編輯人）＋ `mgmt_audit_log` | **採納** | 三欄無法區分首次與代貼覆寫 |
| Service 把關，不要只靠前端藏按鈕 | **採納** | 寫入走 SECURITY DEFINER RPC，見「權限」 |
| 待寫條件以 `attendance_records` 即時計算，不另存快取欄 | **採納** | 點名後短頁以剛寫入狀態為準，不看 `trial_sessions.status` |
| 代堂跟 `schedules.teacher_id`，不跟 `classes.teacher_id` | **採納** | 工程稿「`class_id IN 老師所屬班別`」**不採納**（代堂會寫錯人） |
| 首頁用黃色警示、連到 `/Schedule/…?trialComment=` | **不採納** | 跟 UX：資訊色；同一套表單就地開，完成後留在首頁 |
| 點名成功後等橫幅再打開評語 | **不採納** | 跟 UX：有待寫則不出橫幅 |
| 快捷片語「基礎：／進度：／建議：」 | **不採納** | 跟 UX：會變成同一句複製 |
| 「評語未到」與「老師評語：待補」兩套標籤 | **不採納** | 只留「評語未到」 |
| 本期預留 `InboxWriteEventType.trial_comment_pending` | **不採納** | 第二期才加類型；本期 schema 已夠觸發條件 |
| `TrialConvertDialog` 顯示評語 | **採納** | 同一頁回訪面，不是學生詳情 |
| 待辦含今天 | **採納** | 不含未來；實際出席才寫 |
| 錄影回放仍要求評語 | **採納** | `isActualPresentStatus` 已含 |

---

## 問題背景

每位試堂學生完成試堂後，補習社要求任教老師撰寫約 30 字評語，說明該生大約的學習情況，以及補習如何幫到他。前台同事憑這段評語回訪學生或家長，促成正式報讀。

現時這段往來在 WhatsApp 完成：前台自行發訊息提醒老師，老師再把評語發回。系統沒有這段文字，也沒有「尚未撰寫」的提示。催收與交件都靠同事記得。

## 現況（系統已有、本題不重做）

| 事實 | 現況 |
| --- | --- |
| 老師知道本堂有試堂生 | 確認收款後，收件匣有「試堂」通知；點名紙該列標「試堂」；老師首頁有即將試堂 |
| 前台知道下一步 | `/TrialSessions` 按整列決定主按鈕：前往收款、等上課、正式報讀、標流失、改期 |
| 可寫文字的鄰近欄位 | 本堂「教學紀錄」屬整堂、選填，給該班全體，不是個別試堂生的招生評語。`outcome_note` 是前台登記結果時的補充，不是老師交來的評語 |
| 老師讀試堂列 | `rls_phase_b_teacher_select_trial_sessions` 用 `teacher_can_access_class(class_id)`（班別任教老師）。寫入政策 `rls_cap_write_trial_sessions` 要 `students.enroll`，老師沒有此能力 |
| 點名儲存後 | `RollCallClassPanel.confirmRollCall` 成功後 `pushBanner`「點名已儲存」（橫幅 `z-[280]`，高於 Dialog `260`）；人仍留在點名紙（`RollCallSheet` `z-[200]`），下方可寫教學紀錄 |

本題只補中間缺的那一段：人已實際出席、結果仍待跟進時，給前台回訪用的短評。

---

## 已鎖定：資料模型

單一 migration，只加欄、不改既有列。**不要**另存「是否已寫」快取欄。

| 欄位 | 型別 | 含義 |
| --- | --- | --- |
| `teacher_comment` | `text` | 最新評語；未寫為 `NULL`（禁止空字串） |
| `teacher_comment_at` | `timestamptz` | 首次寫入時間；其後不變 |
| `teacher_comment_by` | `uuid → teachers.id` | 首次寫入人；其後不變 |
| `teacher_comment_edited_at` | `timestamptz` | 首次之後若有修改，最後編輯時間；否則 `NULL` |
| `teacher_comment_edited_by` | `uuid → teachers.id` | 最後編輯人；否則 `NULL` |

約束：

```sql
check (
  teacher_comment is null
  or (
    char_length(btrim(teacher_comment)) > 0
    and char_length(teacher_comment) <= 80
  )
)
```

寫入規則（RPC 內執行）：

- 內容先 `btrim`；空則拒絕（該格視為未寫，不更新該列）。
- 首次：寫入 `teacher_comment`／`_at`／`_by`；編輯兩欄維持 `NULL`。
- 其後：更新 `teacher_comment`、`_edited_at`、`_edited_by`；保留首次 `_at`／`_by`。
- 每次成功寫入另記 `mgmt_audit_log`，`action = trial_teacher_comment_saved`，`detail` JSON 含 `trial_id`、`student_id`、`class_id`、`schedule_id`、`old_comment`、`new_comment`（全文；80 字上限，不必再截）。做法對齊 `deleteTrialSession` 的 `logMgmtAuditActionOrThrow`。

字數：畫面與 CHECK 皆以字元計（中文一字計一字）。前端 `Array.from(文字).length`；空白不計入「已寫」。

---

## 已鎖定：權限

老師 JWT 不能直接 `update trial_sessions`（現有寫入政策要 `students.enroll`）。**不要**為老師開整表 UPDATE policy，否則可改結果、收據、狀態。

定案：新增 SECURITY DEFINER RPC `save_trial_teacher_comment(p_trial_id uuid, p_comment text)`，只更新五個評語欄。`authenticated` 可 execute；函式內檢查：

| 角色 | 首次撰寫 | 改自己寫的 | 改別人寫的 |
| --- | --- | --- | --- |
| 該堂實際授課老師（`schedules.teacher_id` = 目前老師） | 可 | 可 | 否 |
| 班別任教老師但非該堂 `schedules.teacher_id` | 否 | 否 | 否 |
| 有 `students.enroll` 的職員（行政／管理層／外星人） | 可（代貼） | 可 | 可 |
| 財務、其他老師 | 否 | 否 | 否 |

讀取：

- 職員：維持現有 `rls_cap_select_trial_sessions`。
- 老師：現有 SELECT 只覆蓋班別任教老師，**代堂讀不到該列**。本期擴 SELECT：

```text
is_teacher_role()
and (
  teacher_can_access_class(class_id)
  or teacher_can_access_schedule(schedule_id)
)
```

待辦列表不要用「老師所屬班別」；用 `schedules.teacher_id = 目前老師`。否則代堂寫完，待辦會掛在原任教老師首頁。

Service `saveTrialTeacherComment` 只呼叫此 RPC，不走 `supabase.from("trial_sessions").update`。前端不自行判斷後改庫。

---

## 已鎖定：何時要求評語

只在該生**實際出席**時要求（現場、出席、網課、錄影回放、zoom 實時網課、補課、線上、即時直播等；`src/lib/attendancePresence.ts` 的 `isActualPresentStatus`）。缺席、請假、未點名不要求。

點名「確定」先照常儲存出席，不因未寫評語而擋住整班。出席寫入失敗、或扣堂副作用失敗（現有紅字／錯誤橫幅）**不要**再開評語表面。

出席真源是 `attendance_details`（`schedule_id` + `student_id`），**不是** `attendance_records`（該表不存在）。連堂只看該筆試堂自己的 `schedule_id`。

待寫判定（首頁查詢與點名後過濾同一條件）：

```text
trial_sessions.outcome = 'open'
AND trial_sessions.status 不含「取消」、亦非「待改期」
AND trial_date > 上線日
AND 該班沒有同一學生 status=就讀中 的報讀
AND 該 schedule_id + student_id 在 attendance_details 的狀態屬於 isActualPresentStatus
AND teacher_comment IS NULL
AND schedules.teacher_id = 目前老師   -- 僅首頁待辦
```

上線日及以前的試堂，即使後來才補點現場，也不開表單、不進待辦。前台仍可代貼評語。

| 之後發生 | 評語資料 | 首頁待辦 |
| --- | --- | --- |
| 寫入非空白評語 | 保留 | 消失 |
| 正式報讀／流失／其他結果 | 保留 | 消失 |
| 該班已就讀中（學生頁結案而 outcome 仍 open） | 已寫則保留 | 消失 |
| 出席改成缺席／請假 | 已寫則保留；未寫不新增 | 未寫則拿掉 |
| 其後才改成實際出席（且試堂日 > 上線日） | 未寫則進入待辦 | 進入 |
| 再儲存點名、待寫集合沒有新增 | — | 不打斷點名紙 |

「再儲存打斷」只在這次儲存**新產生**「實際出席且無評語」的試堂生時出現（對比儲存前的待寫集合）。略過後原樣再按確定，不重開；改另一格出席才可能重開。

---

## 已鎖定：互動契約

標題一律「試堂評語」。不要寫「備註」「教學紀錄」「跟進」。

### 點名後（寫）

不另開路由。下課後老師不離開點名紙。

1. `confirmRollCall` **寫庫成功之後**才決定是否開評語表面。
2. 入表：本堂 `source === "trial"`、`trial_date` > 上線日、剛儲存狀態為實際出席、尚無評語、該班尚未就讀中。同一堂兩人就兩格、同一屏，不要「下一位」精靈。三人同堂仍同一屏。
3. 有待寫：不出「點名已儲存」橫幅；表面頂部一句「點名已儲存，請為試堂生寫評語。」
4. 無待寫：維持現有成功橫幅，不開評語表面。
5. 殼：
   - 流動裝置：在 `RollCallSheet` 內把名冊換成評語表單（全幅一步）。「稍後再寫」回到名冊＋教學紀錄。禁止再疊一張 bottom sheet。
   - 桌面：置中 `Dialog`（§11），遮罩不可點關閉。`Esc`／右上關閉＝稍後再寫，且**不得**關閉整張點名紙。
6. 成功寫入後關閉評語表面，人仍在點名紙，可繼續寫教學紀錄。不要再疊一則成功橫幅。

每格：

- 主標：學生姓名
- 次標一行：年級、班別、當日日期與時段
- 欄位上方用途說明（不要只放 placeholder）：

> 約 30 字。前台會用這段向家長說明學習情況，以及補習如何幫到他。請寫可對家長說的話。

- 佔位示例：「代數基礎弱、計算尚可；每週跟校進度可補上。」
- 計數：`12／約 30 · 上限 80`。1–30 中性（`text-muted-foreground`）；31–79 `text-warning` 仍可儲存、不要紅框；80 用 `maxLength={80}`。

按鈕：

| 按鈕 | 角色 | 文案 |
| --- | --- | --- |
| 主（實心、右） | 寫入已填的格 | 儲存評語 |
| 次（outline、左） | 全部未寫、稍後補 | 稍後再寫 |

儲存中須 `loading`／`disabled`（§2）。全部空白（或只空白字元）時主按鈕停用。兩人只寫了一人：寫入已填的，未填留待辦。

### 老師首頁（補寫）

有列才出現。資訊色區塊（對齊「即將試堂」），不要未點名那套 `warning`。放在「即將試堂（我的班）」下方。標題：`待寫試堂評語（N）`。每列：姓名 · 班別 · 日期時段；右側主按鈕「撰寫」。空狀態：整塊不出現。

按「撰寫」開**同一套**表單元件。完成後留在首頁，不要丟進點名紙。

### 前台讀（`/TrialSessions`）

評語區塊出現在主按鈕為「正式報讀」、且該生該堂為**實際出席**的列，位置在按鈕**之上**。上線日及以前只要已實際出席，同樣顯示區塊（供前台選填）；老師側不催。

「未點名」在這頁＝**還沒有實際出席的點名紀錄**。主按鈕已是「正式報讀」時，通常是試堂日已過、該堂或該生尚未點名（`trialFollowupKind`：已可上紙，且已點名**或**試堂日已過）。不是「時間已過」的同義詞：試堂日未到時主按鈕是「等上課」，本來就沒有評語區塊。未點名、事假、缺席：沒有課堂觀察，不顯示評語區塊。

| 狀態 | 顯示 |
| --- | --- |
| 有評語（含上線日前代貼） | 獨立一小段（不要與 `remarks`／`outcome_note` 同款 `text-[11px] text-muted-foreground`）：引述全文（80 字不截斷）；下一行撰寫老師 · 撰寫時間；若 `edited_at` 有值加「其後改過」；複製按鈕 |
| 上線日之後、實際出席、無評語 | 中性「評語未到」。旁邊半句「仍可正式報讀」。禁止 `warning`／`destructive` |
| 上線日及以前、實際出席、無評語 | 中性「尚無評語」。不要寫「評語未到」。可從「更多」代貼 |
| 未點名、事假／缺席、等上課、前往收款、已結束 | 不顯示評語區塊 |

正式報讀與標流失按鈕層級維持現況，不因評語空白而改樣式或停用。

`TrialConvertDialog`：有評語則顯示「老師評語：…」。上線日之後且實際出席、無評語：顯示「尚未收到老師評語」，不擋確認。上線日前無評語：不寫「尚未收到」（不催）；有評語則照常顯示。未點名／非實際出席不提評語。

行政代貼：在「更多」加「貼上老師評語」，開獨立對話，說明這是老師評語、不是備註。已有評語時覆寫須確認（§11 Confirm）。老師亦可再改自己寫過的內容。

清單快取：寫入評語後 `invalidateTrialSessionsDataCache()`。本頁保持聚焦時（`visibilitychange`／視窗 `focus`）`reload({ silent: true })`。不要取消 TTL。

三個文字欄畫面須分得開：

| 欄 | 誰寫 | 給誰看 | 位置 |
| --- | --- | --- | --- |
| 本堂教學紀錄 | 老師，選填 | 該班教學、下次備課 | 點名紙底部 |
| 試堂評語（本題） | 點名老師；行政可代貼 | 前台回訪家長 | 點名後第二步；試堂列按鈕上方 |
| 備註／結果備註 | 前台 | 前台自己 | 試堂列「更多」／結案對話 |

---

## 工程波次（審批後按此開工）

### 波次 0 — 純函式（可先合、無 schema）

| 檔 | 做什麼 |
| --- | --- |
| `src/lib/trialTeacherComment.ts`（新） | 上線日常數；`commentCharCount`、`isWrittenTrialComment`、`commentCountTone`、`isTeacherCommentNudgeInScope`（試堂日 > 上線日；老師表單／待辦／「評語未到」用）、待寫集合差集 `newPendingTrialCommentIds(before, after)` |
| `src/lib/trialTeacherComment.test.ts`（新） | 空白、「。」、81 字、30／80 邊界、差集、上線日當日及以前不催老師但仍可代貼 |

### 波次 1 — Schema 與 RPC

單一 migration（檔名用當日時間戳，只新增不改舊檔）。套用跟 skill `apply-supabase-migration`：`npm run db:apply -- <檔>`。

1. `alter table trial_sessions` 加五欄 + CHECK + `comment on column`。
2. RPC `save_trial_teacher_comment`（權限表如上）；函式內寫 `mgmt_audit_log`（與現有 stamp_actor 一致則不必前端再寫一筆；若函式不寫 audit，則 service 用 `logMgmtAuditActionOrThrow`，失敗則拋錯、視為寫入未完成）。
3. 擴老師 SELECT policy（班或該堂排程）。
4. `GRANT EXECUTE` 給 `authenticated`；`REVOKE` anon／public。
5. 更新 `src/types/database.ts`（專案既有產生方式）。

### 波次 2 — Service

| 檔 | 做什麼 |
| --- | --- |
| `src/services/trialQueries.ts` | `TrialManageRow` 加五欄；`TRIAL_LIST_COLUMNS`／`TRIAL_LIST_COLUMNS_INNER_CLASS` 把欄加入 select；`mapRow` 對應；新增 `saveTrialTeacherComment`；新增 `fetchPendingTrialCommentsForTeacher(teacherId)`——join `schedules.teacher_id` + `attendance_details`，條件見「何時要求評語」。回傳姓名、班別標籤、日期時段、`scheduleId`、`trialId`、年級 |
| `src/services/attendanceQueries.ts` | `fetchTrialStudentsForSchedules` 帶出 `trialSessionId`、現有 `teacher_comment`（點名後過濾用） |
| `src/services/scheduleRosterQueries.ts` | `ScheduleRosterTrial` 如需一併帶評語欄（點名紙已有 `id`；評語可在確認後另查，避免擴大 roster context） |

點名後短頁：確認成功後用本堂 `scheduleIds` + 試堂生 `studentId` 查尚無評語的列即可，不要把評語塞進整份 roster context，除非一次讀已有、改動很小。

### 波次 3 — 共用表單與點名紙

| 檔 | 做什麼 |
| --- | --- |
| `src/components/trials/TrialTeacherCommentForm.tsx`（新） | 一位一格、字數、用途說明、主／次按鈕、loading、表單內紅字錯誤（`reportUserFacingError`） |
| `src/components/attendance/RollCallClassPanel.tsx` | `confirmRollCall` 成功後：計算新待寫集合；有則**不** `pushBanner` 成功，改開評語步驟；無則維持橫幅。流動裝置在 panel 內換步；桌面掛 Dialog |
| `src/components/attendance/RollCallSheet.tsx` | 評語步驟進行中，`Escape` 交給表單（稍後再寫），不要關閉點名紙 |

### 波次 4 — 老師首頁與試堂頁

| 檔 | 做什麼 |
| --- | --- |
| `src/components/home/TeacherHomeView.tsx` | `Promise.allSettled` 加 `fetchPendingTrialCommentsForTeacher`；資訊色區塊；「撰寫」開同一表單 Dialog；完成後刷新待辦 |
| `src/components/trials/TrialSessionsView.tsx` | 正式報讀列且實際出席：有評語則引述；上線日後無評語標「評語未到」；上線日前無評語標「尚無評語」並可代貼；複製；「更多」→「貼上老師評語」；`visibilitychange`／focus 靜默重抓；寫入後 invalidate |
| `src/components/trials/TrialConvertDialog.tsx` | target 加評語欄；有評語則顯示；上線日後無評語才寫「尚未收到」 |

### 波次 5 — 營運文件（只改 md）

功能合入後同一輪改（預設不出 docx／pdf）：

- `docs/year/2627/ops-guide.md` §11.3：試堂實際出席後，老師在系統寫評語；前台在試堂頁閱讀後回訪；評語未到仍可正式報讀。
- `docs/playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md` §5：回訪先讀老師評語；未到可先報讀；WhatsApp 收到的同一段用「貼上老師評語」，不要寫進備註。
- 跑 `scripts/sync_policies_to_vault.sh`（改了 `ops-guide`）。

### 驗收（實作後）

- `npm run build`、`npm run lint`、相關單測。
- 本期不強制 Browser MCP（除非使用者明示）。收工時寫明未在瀏覽器親手走的路徑：點名後流動／桌面、首頁補寫、代堂老師待辦、行政代貼覆寫確認、試堂列複製、上線日後實際出席才標評語未到、上線日前實際出席顯示尚無評語可代貼、未點名不出現評語區塊、清單 focus 重抓。

---

## 本期不做

- 銷售工作台、下次聯絡日、跟進負責人
- 未寫評語而阻止點名儲存、正式報讀或標流失
- 缺席／請假仍要求評語
- 自動把原文發給家長或學生
- 催評語電郵／收件匣（第二期）
- 催老師回填上線日及以前的試堂（不開表單、不進待辦、不標「評語未到」）。前台仍可代貼。
- 評語快捷片語、兩個必填欄、點名表加欄、另開路由
- 試堂列「評語未到」篩選、學生詳情再掛一份評語
- 為第二期預留未使用的 `InboxWriteEventType`

## 第二期（本期不開工）

若首頁待辦仍常被略過：下一工作日向該堂實際授課老師收件匣留一則。觸發條件即本期待辦查詢（`trial_date < 今天`）。那時才加 `inbox_events` 類型；不必再改 `trial_sessions` 表。

## 相關程式

- 試堂頁主按鈕：`src/lib/trialFollowupAction.ts`
- 試堂結果是否結束：`src/lib/trialOutcome.ts` 的 `trialOutcomeClosed`
- 點名紙試堂列：`src/components/attendance/RollCallClassPanel.tsx`（成功橫幅約 L496；教學紀錄約 L851）
- 點名紙 overlay：`src/components/attendance/RollCallSheet.tsx`（`z-[200]`；`Escape` 關閉）
- 實際出席判定：`src/lib/attendancePresence.ts`
- 本堂教學紀錄：`src/components/schedule/TeachingNotesEditor.tsx`
- 老師首頁：`src/components/home/TeacherHomeView.tsx`（未點名 warning；即將試堂 info）
- 試堂列下一步：`src/components/trials/TrialSessionsView.tsx`（正式報讀約 L1426；備註約 L1475）
- 清單快取：`src/components/trials/trialSessionsState.ts`
- 試堂寫入／列表欄：`src/services/trialQueries.ts`
- 代堂：`docs/policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md`（只改 `schedules.teacher_id`）
- Overlay z-index：`docs/meta/UI_DESIGN_INSTRUCTIONS.md` §14
