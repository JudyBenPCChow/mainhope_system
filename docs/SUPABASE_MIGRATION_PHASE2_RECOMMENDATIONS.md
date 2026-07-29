# Migration 第二段建議表（55 檔）

> 產生時間：2026-07-30  
> 遠端證據來自唯讀 `information_schema`／`pg_proc`／`inbox_events` 查詢。  
> **Batch A（2026-07-30）：** 已對 21 個「信心＝高」項目執行 `migration repair --status applied`（**未**跑 SQL）。  
> **Batch B1（2026-07-30）：** 已標記 16 個（Apo／IT狗系列、Special discount、中高信心配套；**未**跑 SQL）。使用者確認阿Po、IT狗、Special discount 正常。

## 總覽

| 建議動作 | 數量 |
| --- | ---: |
| 建議只標記 applied | 38 |
| 功能 OK → 只標記 | 6 |
| 人工對照成對／別名後決定 | 4 |
| 先核對物件名 → 未存在才 apply | 2 |
| 查角色後 → 只標記 | 2 |
| 功能 OK → 只標記 | 1 |
| 再探一欄 → 標記 | 1 |
| 建議 db:apply（跑 SQL） | 1 |

**解讀**

- **建議只標記 applied**：遠端已見對應物件／功能；`supabase migration repair --status applied <version> --linked`，**不要**重跑 SQL。
- **功能 OK → 只標記**：探針大致吻合；你確認該功能現網可用後再標記。
- **人工對照**：成對檔或欄位名與遠端不一致；打開 SQL 對一下再決定。
- **先核對再 apply**：探針未見到預期物件；確認函式／表名後，冇先至 `npm run db:apply`。
- **建議 db:apply**：目前證據傾向「未套用」（例如通告未出現）。

**仍禁止：** `supabase db push --include-all`。

## 完整表

| # | Version | 檔案 | 建議 | 信心 | 風險 | SQL 訊號 | 理由 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `20260615120000` | `20260615120000_subjects_category.sql` | 建議只標記 applied | 高 | 低（只標記） | UPDATE, ALTER | 遠端已有 subjects.category |
| 2 | `20260618030000` | `20260618030000_students_phone_country_code_and_contact_method.sql` | 建議只標記 applied | 高 | 低（只標記） | UPDATE, ALTER | 遠端已有 phone country code／preferred_contact 相關欄 |
| 3 | `20260618040000` | `20260618040000_parent_student_portal.sql` | 功能 OK → 只標記 | 中 | 中（檔含 DROP／RLS；勿重跑） | DROP, UPDATE, ALTER, RLS, DATA_INSERT | 有 portal_enrollment_requests／invites；表名可能與檔內不完全一致，建議抽查 portal 登入後再標 |
| 4 | `20260618140000` | `20260618140000_schedule_status_reason_extra.sql` | 人工對照成對／別名後決定 | 中 | 中（勿盲目重跑 UPDATE） | UPDATE, ALTER | 檔寫 status_reason；遠端見 cancel_reason，無 status_reason——可能已用別名／幽靈版實作 |
| 5 | `20260619010000` | `20260619010000_student_tuition_arrears_rpc.sql` | 建議只標記 applied | 高 | 低 | — | 遠端已有 student_tuition_arrears 函式 |
| 6 | `20260707193000` | `20260707193000_students_four_dimension_classification.sql` | 建議只標記 applied | 高 | 低 | UPDATE, ALTER | 遠端已有 registration/enrollment/activity_status 與 recompute 函式（studying_status 欄未必存在） |
| 7 | `20260707200000` | `20260707200000_enrollment_status_any_active_enrollment.sql` | 建議只標記 applied | 中高 | 低～中（有 UPDATE） | UPDATE | 四維狀態已在用；此檔多為函式／規則更新，宜確認後只標記 |
| 8 | `20260708130000` | `20260708130000_apo_chat_feedback.sql` | 建議只標記 applied | 高 | 低（勿重跑 DROP） | DROP, ALTER, RLS | 遠端已有 apo_chat_feedback 表 |
| 9 | `20260708140000` | `20260708140000_apo_assistant_db_tools.sql` | 建議只標記 applied | 中高 | 低 | — | Apo DB tools 線上功能依賴；建議確認後標記（create or replace 型） |
| 10 | `20260709020000` | `20260709020000_apo_assistant_teacher_tools.sql` | 建議只標記 applied | 中高 | 低 | — | Apo teacher tools 系列，功能若正常→標記 |
| 11 | `20260709030000` | `20260709030000_apo_assistant_teacher_scope_hardening.sql` | 建議只標記 applied | 中高 | 低 | — | 同上 scope hardening |
| 12 | `20260709040000` | `20260709040000_apo_assistant_makeup_tuition_lists.sql` | 建議只標記 applied | 中高 | 低 | — | 同上 makeup/tuition lists |
| 13 | `20260709050000` | `20260709050000_apo_assistant_teacher_day_attendance.sql` | 建議只標記 applied | 中高 | 低 | — | 同上 day attendance |
| 14 | `20260709060000` | `20260709060000_apo_chat_satisfaction.sql` | 再探一欄 → 標記 | 中 | 低 | ALTER | 滿意度欄／表需對 apo_chat_* 再查一欄後標記 |
| 15 | `20260709070000` | `20260709070000_apo_assistant_class_display_name.sql` | 建議只標記 applied | 中高 | 低 | — | class display name helper |
| 16 | `20260709080000` | `20260709080000_apo_assistant_student_profile_course_name.sql` | 建議只標記 applied | 中高 | 低 | — | student profile course name |
| 17 | `20260709092225` | `20260709092225_teacher_mgmt_user_constraints.sql` | 人工對照成對／別名後決定 | 中 | 中 | — | 與 20260709173000 主題重複，需對照哪份為準 |
| 18 | `20260709173000` | `20260709173000_teacher_mgmt_user_constraints.sql` | 人工對照成對／別名後決定 | 中 | 中 | ALTER | 與 09092225 成對；只標『已反映現況』嗰份或兩份都標（若後者覆蓋前者） |
| 19 | `20260710130000` | `20260710130000_classes_class_kind.sql` | 建議只標記 applied | 高 | 低 | UPDATE, ALTER | 遠端已有 classes.class_kind |
| 20 | `20260711063758` | `20260711063758_classes_class_kind_ensure.sql` | 建議只標記 applied | 高 | 低 | — | class_kind ensure；欄已在 |
| 21 | `20260711173000` | `20260711173000_single_session_enrollment.sql` | 功能 OK → 只標記 | 中 | 中高 | DROP, ALTER, RLS | 單堂報讀若已上線→只標記；含 DROP／RLS 勿重跑 |
| 22 | `20260711180500` | `20260711180500_drop_temp_frontend_read_policies.sql` | 建議只標記 applied | 中高 | 中（DROP policy） | DROP, RLS | drop temp frontend policies；若現網正常多半已做完 |
| 23 | `20260712023000` | `20260712023000_enrollment_soft_withdraw_and_agent_reserve.sql` | 功能 OK → 只標記 | 中 | 中高 | DROP, ALTER | 軟退讀／agent reserve；功能在用→標記 |
| 24 | `20260712040000` | `20260712040000_portal_enrollment_requests.sql` | 建議只標記 applied | 高 | 中高（檔含 DELETE；勿重跑） | DROP, DELETE, UPDATE, ALTER, RLS, DATA_INSERT | 遠端已有 portal_enrollment_requests 等 |
| 25 | `20260714055439` | `20260714055439_script_library.sql` | 人工對照成對／別名後決定 | 中 | 中 | — | 與 14140000 成對；遠端表名 script_library_entries |
| 26 | `20260714140000` | `20260714140000_script_library.sql` | 建議只標記 applied | 中高 | 中（含 DROP） | DROP, ALTER, RLS | script_library_entries 已存在；成對檔擇一細睇後標記 |
| 27 | `20260715210933` | `20260715210933_schedule_substitute_teacher.sql` | 建議只標記 applied | 高 | 中（勿重跑） | DROP, ALTER, RLS | 遠端 schedules.original_teacher_id（代堂）已在 |
| 28 | `20260716120000` | `20260716120000_student_pending_lessons.sql` | 建議只標記 applied | 高 | 中 | DROP, ALTER, RLS | student_pending_lessons 表已在 |
| 29 | `20260717120000` | `20260717120000_close_orphan_trials_after_enroll.sql` | 先核對物件名 → 未存在才 apply | 中低 | 中 | — | 探針未見 close_orphan* 函式——可能未套或函式名不同；先查檔內函式名再 decide |
| 30 | `20260717123000` | `20260717123000_trial_sessions_open_unique.sql` | 建議只標記 applied | 中 | 低 | — | trial unique 約束；試堂功能若正常→標記 |
| 31 | `20260718030000` | `20260718030000_attendance_billable_whitelist.sql` | 建議只標記 applied | 高 | 低 | — | 點名扣堂 whitelist 已係現況依賴 |
| 32 | `20260718031000` | `20260718031000_trial_sessions_payment_id.sql` | 建議只標記 applied | 高 | 低 | ALTER | trial_sessions.payment_id 已在 |
| 33 | `20260719013000` | `20260719013000_attendance_status_rename_whitelist.sql` | 建議只標記 applied | 高 | 低 | — | 出席狀態 rename whitelist；與扣堂邏輯綁定 |
| 34 | `20260719120000` | `20260719120000_front_desk_intake_sessions.sql` | 建議只標記 applied | 高 | 中高（勿重跑） | DROP, UPDATE, ALTER, RLS, DATA_INSERT | front_desk_pickup_sessions 表已在 |
| 35 | `20260719123000` | `20260719123000_fix_front_desk_intake_token_gen.sql` | 建議只標記 applied | 中高 | 低～中 | DATA_INSERT | pickup token gen 修正；表已在則多半已套 |
| 36 | `20260720170000` | `20260720170000_schedule_teaching_notes.sql` | 建議只標記 applied | 高 | 低 | ALTER | schedules.teaching_notes 已在 |
| 37 | `20260720180000` | `20260720180000_leave_makeup_host_teacher_access.sql` | 功能 OK → 只標記 | 中 | 中（DROP policy） | DROP, RLS | 補堂主持老師 RLS；請假補堂可用→標記 |
| 38 | `20260721020000` | `20260721020000_peek_portal_invite_student_name.sql` | 先核對物件名 → 未存在才 apply | 中低 | 低（多半 add function） | — | 探針未見 peek_portal_invite_student_name——可能未套 |
| 39 | `20260721030000` | `20260721030000_portal_staff_view_as.sql` | 建議只標記 applied | 高 | 中高（勿重跑） | DROP, DELETE, UPDATE, ALTER, RLS, DATA_INSERT | portal_staff_view_as 表已在 |
| 40 | `20260721030100` | `20260721030100_portal_staff_view_as_rls_and_getter.sql` | 建議只標記 applied | 中高 | 中 | DROP, RLS | 同上 RLS／getter 配套 |
| 41 | `20260721030200` | `20260721030200_list_portal_enrollable_class_ids.sql` | 建議只標記 applied | 高 | 低 | — | list_portal_enrollable_class_ids 已在 |
| 42 | `20260721040000` | `20260721040000_lesson_reminder_logs.sql` | 建議只標記 applied | 高 | 中 | DROP, ALTER, RLS | lesson_reminder_logs 表已在 |
| 43 | `20260721161817` | `20260721161817_mark_yu_dual_mgmt_roles.sql` | 查角色後 → 只標記 | 中 | 低～中（DATA） | ALTER, RLS, DATA_INSERT | Mark Yu 雙角色；查 app_user_roles／mgmt_active_roles 後標記 |
| 44 | `20260721163734` | `20260721163734_legacy_student_subject_enrollments.sql` | 功能 OK → 只標記 | 中 | 中 | ALTER, RLS | legacy subject enrollments；有用→標記 |
| 45 | `20260721164301` | `20260721164301_allow_teacher_read_trial_students.sql` | 建議只標記 applied | 中高 | 低 | — | 老師讀試堂生 policy；老師試堂流程正常→標記 |
| 46 | `20260721172118` | `20260721172118_teacher_schedule_roster_context.sql` | 建議只標記 applied | 中高 | 低 | — | teacher schedule roster context |
| 47 | `20260721175957` | `20260721175957_monthly_tuition_calendar.sql` | 建議只標記 applied | 中高 | 中 | DROP, ALTER, RLS | monthly_tuition_charges 已在（months 表名可能不同） |
| 48 | `20260721184621` | `20260721184621_portal_trial_schedules_and_security_hardening.sql` | 功能 OK → 只標記 | 中 | 中（有 UPDATE／INSERT） | UPDATE, DATA_INSERT | portal trial schedules／security；portal 試堂正常→標記 |
| 49 | `20260722110000` | `20260722110000_fix_enrollment_dates_and_schedule_rls_perf.sql` | 功能 OK → 只標記 | 中 | 中高 | DROP, RLS | enrollment dates + schedule RLS perf；現網正常→標記，勿重跑 DROP policy |
| 50 | `20260723043700` | `20260723043700_katie_lee_dual_mgmt_roles.sql` | 查角色後 → 只標記 | 中 | 低～中 | DATA_INSERT | Katie Lee 雙角色；查角色後標記 |
| 51 | `20260723180000` | `20260723180000_admin_payment_discount_applications_write.sql` | 建議只標記 applied | 中高 | 中 | DROP, RLS | admin payment discount write；Special discount 通告已出→多半已套 |
| 52 | `20260725030000` | `20260725030000_inbox_events.sql` | 建議只標記 applied | 高 | 中（勿重跑） | DROP, ALTER, RLS | inbox_events 表已在且有多則系統通告 |
| 53 | `20260729234500` | `20260729234500_payment_void_workflow.sql` | 建議只標記 applied | 高 | 中高（勿重跑） | DROP, ALTER, RLS | payments.voided_* 欄已在（作廢流程） |
| 54 | `20260730020000` | `20260730020000_consecutive_single_slot_makeup_notice.sql` | 建議只標記 applied | 高 | 低（DATA_INSERT） | DATA_INSERT | inbox 已有「連堂可單項請假／補堂」通告 |
| 55 | `20260730053000` | `20260730053000_inbox_notice_payment_void.sql` | 建議 db:apply（跑 SQL） | 中高 | 低（多半 INSERT notice） | DATA_INSERT | inbox 最近通告未見 payment void 相關標題——傾向尚未插入通告 |

## 建議執行批次（若你決定做）

### Batch A — 高信心只標記（最先、最安全） — ✅ 已完成 2026-07-30
已 `repair --status applied`（21 個，唔跑 SQL）：  
`20260615120000` `20260618030000` `20260619010000` `20260707193000` `20260708130000` `20260710130000` `20260711063758` `20260712040000` `20260715210933` `20260716120000` `20260718030000` `20260718031000` `20260719013000` `20260719120000` `20260720170000` `20260721030000` `20260721030200` `20260721040000` `20260725030000` `20260729234500` `20260730020000`

### Batch B — 功能確認後標記
- **B1 ✅ 已完成 2026-07-30（16 個只標記）：**  
  `20260707200000` `20260708140000` `20260709020000`–`09050000` `09070000` `09080000` `11180500` `17123000` `19123000` `21030100` `21164301` `21172118` `21175957` `23180000`  
  （含 Apo／IT狗、Special discount；使用者確認正常）
- **B2 未做：** 單堂／軟退／補堂 host／portal／雙角色等（待你再確認或授權）
- **B 邊角未做：** `20260709060000`（satisfaction 再探一欄）

### Batch C — 人工對照
- `20260618140000` status_reason vs 遠端 `cancel_reason`
- `20260709092225` / `20260709173000` teacher_mgmt 成對
- `20260714055439` / `20260714140000` script_library 成對

### Batch D — 可能要真跑 SQL
- `20260721020000` peek_portal_invite_student_name（探針未見）
- `20260717120000` close_orphan*（探針未見）
- `20260730053000` 作廢通告（inbox 未見對應標題）→ 優先 `npm run db:apply`

### 餘項追蹤

未完成的 B2／C／D（含煙霧測入口）已列入 backlog：[`backlog/supabase-migration-history.md`](backlog/supabase-migration-history.md)（索引 [`BACKLOG.md`](BACKLOG.md)）。雙角色 Mark／Katie 已確認正常，待授權後與 B2 一併只標記。

## 相關

- 單檔日常流程：[`SUPABASE_MIGRATION_APPLY.md`](SUPABASE_MIGRATION_APPLY.md)
