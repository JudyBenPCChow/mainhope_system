-- 與該列無關的 RLS 判斷改為每個語句只算一次。
-- 可見列保持原樣。表達式依套用前的 live policy 改寫。
-- 列條件（班別、老師、學生、audience）留在子查詢外面。

BEGIN;

ALTER POLICY "rls_cap_select_academic_calendar_closures"
ON public."academic_calendar_closures"
  USING (
    (SELECT (private.has_capability('calendar.manage'::text) OR (private.has_capability('payments.read'::text) AND public.is_mgmt_staff())))
  );

ALTER POLICY "rls_cap_write_academic_calendar_closures"
ON public."academic_calendar_closures"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "portal_select_academic_year_periods"
ON public."academic_year_periods"
  USING (
    ((SELECT public.is_portal()) AND (EXISTS ( SELECT 1
   FROM classes c
  WHERE ((c.academic_year_id = academic_year_periods.academic_year_id) AND (portal_can_access_class(c.id) OR portal_class_matches_current_student_grade(c.id))))))
  );

ALTER POLICY "rls_cap_select_academic_year_periods"
ON public."academic_year_periods"
  USING (
    (SELECT (private.has_capability('classes.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_academic_year_periods"
ON public."academic_year_periods"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_academic_year_periods"
ON public."academic_year_periods"
  USING (
    (SELECT public.is_teacher_role())
  );

ALTER POLICY "rls_cap_select_academic_years"
ON public."academic_years"
  USING (
    (SELECT (private.has_capability('classes.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_academic_years"
ON public."academic_years"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_academic_years"
ON public."academic_years"
  USING (
    (SELECT public.is_teacher_role())
  );

ALTER POLICY "rls_cap_select_admin_todos"
ON public."admin_todos"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "rls_cap_write_admin_todos"
ON public."admin_todos"
  USING (
    (SELECT private.has_capability('catalog.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('catalog.manage'::text))
  );

ALTER POLICY "app_user_pinned_pages_own_delete"
ON public."app_user_pinned_pages"
  USING (
    (app_user_id = (SELECT public.current_app_user_id()))
  );

ALTER POLICY "app_user_pinned_pages_own_insert"
ON public."app_user_pinned_pages"
  WITH CHECK (
    (app_user_id = (SELECT public.current_app_user_id()))
  );

ALTER POLICY "app_user_pinned_pages_own_select"
ON public."app_user_pinned_pages"
  USING (
    (app_user_id = (SELECT public.current_app_user_id()))
  );

ALTER POLICY "app_user_pinned_pages_own_update"
ON public."app_user_pinned_pages"
  USING (
    (app_user_id = (SELECT public.current_app_user_id()))
  )
  WITH CHECK (
    (app_user_id = (SELECT public.current_app_user_id()))
  );

ALTER POLICY "rls_cap_roles_grant_app_user_roles"
ON public."app_user_roles"
  USING (
    (SELECT private.has_capability('roles.grant'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('roles.grant'::text))
  );

ALTER POLICY "rls_cap_users_manage_app_users"
ON public."app_users"
  USING (
    (SELECT private.has_capability('users.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('users.manage'::text))
  );

ALTER POLICY "rls_expense_owner_picker_app_users"
ON public."app_users"
  USING (
    ((SELECT private.has_capability('expenses.record'::text)) AND (role = ANY (ARRAY['admin'::text, 'manager'::text, 'finance'::text])))
  );

ALTER POLICY "rls_phase_b_auth_select_own_app_user"
ON public."app_users"
  USING (
    (lower(COALESCE(email, ''::text)) = (SELECT public.current_app_user_email()))
  );

ALTER POLICY "rls_cap_select_attendance_declaration_exceptions"
ON public."attendance_declaration_exceptions"
  USING (
    (SELECT (public.is_mgmt_staff() AND (private.has_capability('entitlements.read'::text) OR private.has_capability('students.read'::text))))
  );

ALTER POLICY "rls_cap_write_attendance_declaration_exceptions"
ON public."attendance_declaration_exceptions"
  USING (
    (SELECT (private.has_capability('students.enroll'::text) OR private.has_capability('entitlements.correct'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('students.enroll'::text) OR private.has_capability('entitlements.correct'::text)))
  );

ALTER POLICY "rls_teacher_select_attendance_declaration_exceptions"
ON public."attendance_declaration_exceptions"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_class(class_id))
  );

ALTER POLICY "rls_cap_select_attendance_declarations"
ON public."attendance_declarations"
  USING (
    (SELECT (public.is_mgmt_staff() AND (private.has_capability('entitlements.read'::text) OR private.has_capability('students.read'::text))))
  );

ALTER POLICY "rls_cap_write_attendance_declarations"
ON public."attendance_declarations"
  USING (
    (SELECT (private.has_capability('students.enroll'::text) OR private.has_capability('attendance.take'::text) OR private.has_capability('entitlements.correct'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('students.enroll'::text) OR private.has_capability('attendance.take'::text) OR private.has_capability('entitlements.correct'::text)))
  );

ALTER POLICY "rls_teacher_select_attendance_declarations"
ON public."attendance_declarations"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_schedule(schedule_id))
  );

ALTER POLICY "portal_select_attendance"
ON public."attendance_details"
  USING (
    ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id())))
  );

ALTER POLICY "rls_cap_delete_attendance_details"
ON public."attendance_details"
  USING (
    (SELECT (private.has_capability('attendance.delete'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_insert_attendance_details"
ON public."attendance_details"
  WITH CHECK (
    (SELECT (private.has_capability('attendance.take'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_select_attendance_details"
ON public."attendance_details"
  USING (
    (SELECT (private.has_capability('attendance.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_attendance_details"
ON public."attendance_details"
  USING (
    (SELECT (public.is_mgmt_staff() AND (private.has_capability('attendance.take'::text) OR private.has_capability('attendance.correct'::text))))
  )
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND (private.has_capability('attendance.take'::text) OR private.has_capability('attendance.correct'::text))))
  );

ALTER POLICY "rls_phase_b_teacher_insert_attendance_details"
ON public."attendance_details"
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND teacher_can_write_attendance(class_id, schedule_id))
  );

ALTER POLICY "rls_phase_b_teacher_select_attendance_details"
ON public."attendance_details"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_read_attendance(class_id, schedule_id))
  );

ALTER POLICY "rls_phase_b_teacher_update_attendance_details"
ON public."attendance_details"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_write_attendance(class_id, schedule_id))
  )
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND teacher_can_write_attendance(class_id, schedule_id))
  );

ALTER POLICY "portal_select_calendar_event_students"
ON public."calendar_event_students"
  USING (
    ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id())))
  );

ALTER POLICY "rls_cap_select_calendar_event_students"
ON public."calendar_event_students"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_write_calendar_event_students"
ON public."calendar_event_students"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_calendar_event_students"
ON public."calendar_event_students"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_calendar_event(event_id))
  );

ALTER POLICY "rls_cap_select_calendar_event_tags"
ON public."calendar_event_tags"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_write_calendar_event_tags"
ON public."calendar_event_tags"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_calendar_event_tags"
ON public."calendar_event_tags"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_calendar_event(event_id))
  );

ALTER POLICY "rls_cap_select_calendar_event_teachers"
ON public."calendar_event_teachers"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_write_calendar_event_teachers"
ON public."calendar_event_teachers"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_calendar_event_teachers"
ON public."calendar_event_teachers"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_calendar_event(event_id))
  );

ALTER POLICY "rls_cap_select_calendar_event_updates"
ON public."calendar_event_updates"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_write_calendar_event_updates"
ON public."calendar_event_updates"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_phase_b_teacher_insert_calendar_event_updates"
ON public."calendar_event_updates"
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND (EXISTS ( SELECT 1
   FROM calendar_event_teachers cet
  WHERE ((cet.event_id = calendar_event_updates.event_id) AND (cet.teacher_id = (SELECT public.current_teacher_id()))))))
  );

ALTER POLICY "rls_phase_b_teacher_select_calendar_event_updates"
ON public."calendar_event_updates"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_calendar_event(event_id))
  );

ALTER POLICY "rls_cap_select_calendar_event_users"
ON public."calendar_event_users"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_write_calendar_event_users"
ON public."calendar_event_users"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "portal_select_calendar_events"
ON public."calendar_events"
  USING (
    ((SELECT public.is_portal()) AND ((visibility = 'parents'::text) OR (EXISTS ( SELECT 1
   FROM calendar_event_students ces
  WHERE ((ces.event_id = calendar_events.id) AND (ces.student_id = (SELECT public.current_portal_student_id())))))))
  );

ALTER POLICY "rls_cap_select_calendar_events"
ON public."calendar_events"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_write_calendar_events"
ON public."calendar_events"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_calendar_events"
ON public."calendar_events"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_calendar_event(id))
  );

ALTER POLICY "portal_select_classes"
ON public."classes"
  USING (
    ((SELECT public.is_portal()) AND (portal_can_access_class(id) OR portal_class_matches_current_student_grade(id)))
  );

ALTER POLICY "rls_cap_delete_classes"
ON public."classes"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_cap_insert_classes"
ON public."classes"
  WITH CHECK (
    (SELECT private.has_capability('classes.create'::text))
  );

ALTER POLICY "rls_cap_select_classes"
ON public."classes"
  USING (
    (SELECT (private.has_capability('classes.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_classes"
ON public."classes"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_classes"
ON public."classes"
  USING (
    ((SELECT public.is_teacher_role()) AND ((teacher_id = (SELECT public.current_teacher_id())) OR ((class_kind = 'homework'::text) AND (SELECT public.teacher_has_homework_tutoring_nav()))))
  );

ALTER POLICY "rls_cap_select_classroom_booking_requests"
ON public."classroom_booking_requests"
  USING (
    (SELECT (private.has_capability('schedule.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_classroom_booking_requests"
ON public."classroom_booking_requests"
  USING (
    (SELECT private.has_capability('schedule.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('schedule.create'::text))
  );

ALTER POLICY "rls_teacher_delete_classroom_booking_requests"
ON public."classroom_booking_requests"
  USING (
    ((SELECT public.is_teacher_role()) AND (requesting_teacher_id = (SELECT public.current_teacher_id())))
  );

ALTER POLICY "rls_teacher_insert_classroom_booking_requests"
ON public."classroom_booking_requests"
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND (requesting_teacher_id = (SELECT public.current_teacher_id())))
  );

ALTER POLICY "rls_teacher_select_classroom_booking_requests"
ON public."classroom_booking_requests"
  USING (
    (SELECT public.is_teacher_role())
  );

ALTER POLICY "rls_teacher_update_classroom_booking_requests"
ON public."classroom_booking_requests"
  USING (
    ((SELECT public.is_teacher_role()) AND (requesting_teacher_id = (SELECT public.current_teacher_id())))
  )
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND (requesting_teacher_id = (SELECT public.current_teacher_id())))
  );

ALTER POLICY "portal_select_classrooms"
ON public."classrooms"
  USING (
    ((SELECT public.is_portal()) AND (EXISTS ( SELECT 1
   FROM classes c
  WHERE ((c.classroom_id = classrooms.id) AND (portal_can_access_class(c.id) OR portal_class_matches_current_student_grade(c.id))))))
  );

ALTER POLICY "rls_cap_select_classrooms"
ON public."classrooms"
  USING (
    (SELECT (private.has_capability('classes.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_classrooms"
ON public."classrooms"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_classrooms"
ON public."classrooms"
  USING (
    (SELECT public.is_teacher_role())
  );

ALTER POLICY "rls_cap_select_contact_update_tokens"
ON public."contact_update_tokens"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_contact_update_tokens"
ON public."contact_update_tokens"
  USING (
    (SELECT private.has_capability('students.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.update'::text))
  );

ALTER POLICY "portal_select_courses"
ON public."courses"
  USING (
    ((SELECT public.is_portal()) AND (EXISTS ( SELECT 1
   FROM classes c
  WHERE ((c.course_id = courses.id) AND (portal_can_access_class(c.id) OR portal_class_matches_current_student_grade(c.id))))))
  );

ALTER POLICY "rls_cap_select_courses"
ON public."courses"
  USING (
    (SELECT (private.has_capability('classes.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_courses"
ON public."courses"
  USING (
    (SELECT private.has_capability('catalog.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('catalog.manage'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_courses"
ON public."courses"
  USING (
    (SELECT public.is_teacher_role())
  );

ALTER POLICY "rls_cap_select_enrollment_change_events"
ON public."enrollment_change_events"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_enrollment_change_events"
ON public."enrollment_change_events"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_enrollment_change_events"
ON public."enrollment_change_events"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_class(class_id))
  );

ALTER POLICY "rls_cap_insert_entitlement_consumption_events"
ON public."entitlement_consumption_events"
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND (private.has_capability('attendance.take'::text) OR private.has_capability('entitlements.correct'::text))))
  );

ALTER POLICY "rls_cap_select_entitlement_consumption_events"
ON public."entitlement_consumption_events"
  USING (
    (SELECT (private.has_capability('entitlements.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_teacher_insert_entitlement_consumption_events"
ON public."entitlement_consumption_events"
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND (SELECT private.has_capability('attendance.take'::text)) AND ((schedule_id IS NULL) OR teacher_can_access_schedule(schedule_id)))
  );

ALTER POLICY "rls_teacher_select_entitlement_consumption_events"
ON public."entitlement_consumption_events"
  USING (
    ((SELECT public.is_teacher_role()) AND ((schedule_id IS NOT NULL) AND teacher_can_access_schedule(schedule_id)))
  );

ALTER POLICY "rls_cap_select_entitlement_pool_adjustments"
ON public."entitlement_pool_adjustments"
  USING (
    (SELECT (private.has_capability('entitlements.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_entitlement_pool_adjustments"
ON public."entitlement_pool_adjustments"
  USING (
    (SELECT private.has_capability('entitlements.correct'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('entitlements.correct'::text))
  );

ALTER POLICY "rls_cap_select_expense_category_rules"
ON public."expense_category_rules"
  USING (
    (SELECT (private.has_capability('expenses.read'::text) OR private.has_capability('expenses.record'::text)))
  );

ALTER POLICY "rls_cap_write_expense_category_rules"
ON public."expense_category_rules"
  USING (
    (SELECT private.has_capability('catalog.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('catalog.manage'::text))
  );

ALTER POLICY "rls_cap_insert_expense_entries"
ON public."expense_entries"
  WITH CHECK (
    ((SELECT private.has_capability('expenses.record'::text)) AND ((SELECT private.has_capability('expenses.read'::text)) OR (EXISTS ( SELECT 1
   FROM expense_ledger_accounts a
  WHERE ((a.id = expense_entries.ledger_account_id) AND (a.visibility = 'front_desk'::text) AND a.active)))))
  );

ALTER POLICY "rls_cap_select_expense_entries"
ON public."expense_entries"
  USING (
    ((SELECT private.has_capability('expenses.read'::text)) OR ((SELECT private.has_capability('expenses.record'::text)) AND (EXISTS ( SELECT 1
   FROM expense_ledger_accounts a
  WHERE ((a.id = expense_entries.ledger_account_id) AND (a.visibility = 'front_desk'::text))))))
  );

ALTER POLICY "rls_cap_update_expense_entries"
ON public."expense_entries"
  USING (
    (((SELECT private.has_capability('expenses.read'::text)) AND ((SELECT private.has_capability('expenses.record'::text)) OR (SELECT private.has_capability('expenses.confirm'::text)) OR (SELECT private.has_capability('expenses.void'::text)) OR (SELECT private.has_capability('expenses.reopen'::text)))) OR ((SELECT private.has_capability('expenses.record'::text)) AND (NOT (SELECT private.has_capability('expenses.read'::text))) AND (EXISTS ( SELECT 1
   FROM expense_ledger_accounts a
  WHERE ((a.id = expense_entries.ledger_account_id) AND (a.visibility = 'front_desk'::text))))))
  )
  WITH CHECK (
    (((SELECT private.has_capability('expenses.read'::text)) AND ((SELECT private.has_capability('expenses.record'::text)) OR (SELECT private.has_capability('expenses.confirm'::text)) OR (SELECT private.has_capability('expenses.void'::text)) OR (SELECT private.has_capability('expenses.reopen'::text)))) OR ((SELECT private.has_capability('expenses.record'::text)) AND (NOT (SELECT private.has_capability('expenses.read'::text))) AND (EXISTS ( SELECT 1
   FROM expense_ledger_accounts a
  WHERE ((a.id = expense_entries.ledger_account_id) AND (a.visibility = 'front_desk'::text))))))
  );

ALTER POLICY "rls_cap_select_expense_ledger_accounts"
ON public."expense_ledger_accounts"
  USING (
    ((SELECT private.has_capability('expenses.read'::text)) OR ((SELECT private.has_capability('expenses.record'::text)) AND (visibility = 'front_desk'::text)))
  );

ALTER POLICY "rls_cap_write_expense_ledger_accounts"
ON public."expense_ledger_accounts"
  USING (
    (SELECT private.has_capability('catalog.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('catalog.manage'::text))
  );

ALTER POLICY "rls_cap_select_front_desk_intake_sessions"
ON public."front_desk_intake_sessions"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_front_desk_intake_sessions"
ON public."front_desk_intake_sessions"
  USING (
    (SELECT private.has_capability('students.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.create'::text))
  );

ALTER POLICY "homework_day_log_attachments_row_delete"
ON public."homework_student_day_log_attachments"
  USING (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_day_log_attachments_row_insert"
ON public."homework_student_day_log_attachments"
  WITH CHECK (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_day_log_attachments_row_select"
ON public."homework_student_day_log_attachments"
  USING (
    ((SELECT public.can_access_homework_day_logs()) OR ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id()))))
  );

ALTER POLICY "homework_day_log_staff_notes_select"
ON public."homework_student_day_log_staff_notes"
  USING (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_day_log_staff_notes_write"
ON public."homework_student_day_log_staff_notes"
  USING (
    (SELECT public.can_access_homework_day_logs())
  )
  WITH CHECK (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_student_day_logs_staff_delete"
ON public."homework_student_day_logs"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "homework_student_day_logs_staff_insert"
ON public."homework_student_day_logs"
  WITH CHECK (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_student_day_logs_staff_select"
ON public."homework_student_day_logs"
  USING (
    ((SELECT public.can_access_homework_day_logs()) OR ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id()))))
  );

ALTER POLICY "homework_student_day_logs_staff_update"
ON public."homework_student_day_logs"
  USING (
    (SELECT public.can_access_homework_day_logs())
  )
  WITH CHECK (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_student_followups_delete"
ON public."homework_student_followups"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "homework_student_followups_insert"
ON public."homework_student_followups"
  WITH CHECK (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_student_followups_select"
ON public."homework_student_followups"
  USING (
    ((SELECT public.can_access_homework_day_logs()) OR ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id()))))
  );

ALTER POLICY "homework_student_followups_update"
ON public."homework_student_followups"
  USING (
    (SELECT public.can_access_homework_day_logs())
  )
  WITH CHECK (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "homework_student_profiles_select"
ON public."homework_student_profiles"
  USING (
    ((SELECT public.can_access_homework_day_logs()) OR ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id()))))
  );

ALTER POLICY "homework_student_profiles_write"
ON public."homework_student_profiles"
  USING (
    (SELECT public.can_access_homework_day_logs())
  )
  WITH CHECK (
    (SELECT public.can_access_homework_day_logs())
  );

ALTER POLICY "rls_cap_select_homework_tutoring_availability"
ON public."homework_tutoring_availability"
  USING (
    ((SELECT private.has_capability('classes.read'::text)) OR (SELECT private.has_capability('schedule.read'::text)) OR (SELECT public.is_mgmt_staff()) OR ((SELECT public.is_teacher_role()) AND (teacher_id = (SELECT public.current_teacher_id()))))
  );

ALTER POLICY "rls_cap_write_homework_tutoring_availability"
ON public."homework_tutoring_availability"
  USING (
    ((SELECT private.has_capability('classes.update'::text)) OR (SELECT private.has_capability('schedule.write'::text)) OR ((SELECT public.is_teacher_role()) AND (teacher_id = (SELECT public.current_teacher_id()))))
  )
  WITH CHECK (
    ((SELECT private.has_capability('classes.update'::text)) OR (SELECT private.has_capability('schedule.write'::text)) OR ((SELECT public.is_teacher_role()) AND (teacher_id = (SELECT public.current_teacher_id()))))
  );

ALTER POLICY "rls_cap_select_homework_tutoring_calendar_closures"
ON public."homework_tutoring_calendar_closures"
  USING (
    (SELECT (private.has_capability('calendar.manage'::text) OR public.is_teacher_role() OR (private.has_capability('payments.read'::text) AND public.is_mgmt_staff())))
  );

ALTER POLICY "rls_cap_write_homework_tutoring_calendar_closures"
ON public."homework_tutoring_calendar_closures"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_select_homework_tutoring_duty_assignments"
ON public."homework_tutoring_duty_assignments"
  USING (
    (SELECT (private.has_capability('classes.read'::text) OR private.has_capability('schedule.read'::text) OR public.is_mgmt_staff() OR public.is_teacher_role()))
  );

ALTER POLICY "rls_cap_write_homework_tutoring_duty_assignments"
ON public."homework_tutoring_duty_assignments"
  USING (
    (SELECT (private.has_capability('classes.update'::text) OR private.has_capability('schedule.write'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('classes.update'::text) OR private.has_capability('schedule.write'::text)))
  );

ALTER POLICY "rls_cap_select_homework_tutoring_duty_days"
ON public."homework_tutoring_duty_days"
  USING (
    (SELECT (private.has_capability('classes.read'::text) OR private.has_capability('schedule.read'::text) OR public.is_mgmt_staff() OR public.is_teacher_role()))
  );

ALTER POLICY "rls_cap_write_homework_tutoring_duty_days"
ON public."homework_tutoring_duty_days"
  USING (
    (SELECT (private.has_capability('classes.update'::text) OR private.has_capability('schedule.write'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('classes.update'::text) OR private.has_capability('schedule.write'::text)))
  );

ALTER POLICY "rls_cap_select_homework_tutoring_monthly_charges"
ON public."homework_tutoring_monthly_charges"
  USING (
    (SELECT (private.has_capability('payments.read'::text) OR private.has_capability('classes.read'::text) OR public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_homework_tutoring_monthly_charges"
ON public."homework_tutoring_monthly_charges"
  USING (
    (SELECT (private.has_capability('payments.write'::text) OR private.has_capability('students.enroll'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('payments.write'::text) OR private.has_capability('students.enroll'::text)))
  );

ALTER POLICY "rls_cap_select_homework_tutoring_roster_months"
ON public."homework_tutoring_roster_months"
  USING (
    (SELECT (private.has_capability('classes.read'::text) OR private.has_capability('schedule.read'::text) OR public.is_mgmt_staff() OR public.is_teacher_role()))
  );

ALTER POLICY "rls_cap_write_homework_tutoring_roster_months"
ON public."homework_tutoring_roster_months"
  USING (
    (SELECT (private.has_capability('classes.update'::text) OR private.has_capability('schedule.write'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('classes.update'::text) OR private.has_capability('schedule.write'::text)))
  );

ALTER POLICY "rls_cap_delete_system_inbox_events"
ON public."inbox_events"
  USING (
    ((SELECT private.has_capability('system_notice.publish'::text)) AND (category = 'system'::text))
  );

ALTER POLICY "rls_cap_insert_system_inbox_events"
ON public."inbox_events"
  WITH CHECK (
    ((SELECT private.has_capability('system_notice.publish'::text)) AND (category = 'system'::text) AND (event_type = 'system_update'::text))
  );

ALTER POLICY "rls_cap_update_system_inbox_events"
ON public."inbox_events"
  USING (
    ((SELECT private.has_capability('system_notice.publish'::text)) AND (category = 'system'::text))
  )
  WITH CHECK (
    ((SELECT private.has_capability('system_notice.publish'::text)) AND (category = 'system'::text) AND (event_type = 'system_update'::text))
  );

ALTER POLICY "rls_mgmt_insert_ops_inbox_events"
ON public."inbox_events"
  WITH CHECK (
    ((COALESCE(category, 'ops'::text) = 'ops'::text) AND ((SELECT private.has_capability('schedule.create'::text)) OR (SELECT private.has_capability('schedule.reschedule'::text)) OR (SELECT private.has_capability('schedule.cancel'::text)) OR (SELECT private.has_capability('schedule.substitute'::text)) OR (SELECT private.has_capability('classes.update'::text)) OR (SELECT private.has_capability('leaves.manage'::text)) OR (SELECT private.has_capability('students.enroll'::text))))
  );

ALTER POLICY "rls_mgmt_select_inbox_events"
ON public."inbox_events"
  USING (
    ((SELECT private.has_capability('inbox.read'::text)) AND (NOT (SELECT public.is_teacher_role())) AND ((COALESCE(cardinality(audience_roles), 0) = 0) OR ((SELECT public.current_app_role()) = ANY (audience_roles))))
  );

ALTER POLICY "rls_teacher_select_inbox_events"
ON public."inbox_events"
  USING (
    ((SELECT public.is_teacher_role()) AND (((category = 'system'::text) AND ((COALESCE(cardinality(audience_roles), 0) = 0) OR ('teacher'::text = ANY (audience_roles)))) OR ((COALESCE(category, 'ops'::text) = 'ops'::text) AND ((COALESCE(cardinality(audience_roles), 0) = 0) OR ('teacher'::text = ANY (audience_roles))) AND (((SELECT public.current_teacher_id()) = ANY (audience_teacher_ids)) OR ((class_id IS NOT NULL) AND teacher_can_access_class(class_id))))))
  );

ALTER POLICY "rls_own_inbox_reads"
ON public."inbox_reads"
  USING (
    ((SELECT private.has_capability('inbox.read'::text)) AND (actor_key = (SELECT public.current_inbox_actor_key())))
  )
  WITH CHECK (
    ((SELECT private.has_capability('inbox.read'::text)) AND (actor_key = (SELECT public.current_inbox_actor_key())))
  );

ALTER POLICY "rls_cap_all_lead_trial_intentions"
ON public."lead_trial_intentions"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  )
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  );

ALTER POLICY "rls_cap_all_leads"
ON public."leads"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  )
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  );

ALTER POLICY "portal_select_leave_makeup"
ON public."leave_makeup_records"
  USING (
    ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id())))
  );

ALTER POLICY "rls_cap_select_leave_makeup_records"
ON public."leave_makeup_records"
  USING (
    (SELECT (private.has_capability('leaves.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_leave_makeup_records"
ON public."leave_makeup_records"
  USING (
    (SELECT private.has_capability('leaves.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('leaves.manage'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_leave_makeup_records"
ON public."leave_makeup_records"
  USING (
    ((SELECT public.is_teacher_role()) AND (teacher_can_access_class(class_id) OR ((makeup_schedule_id IS NOT NULL) AND teacher_can_access_schedule(makeup_schedule_id))))
  );

ALTER POLICY "legacy_import_batches_mgmt_select"
ON public."legacy_import_batches"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "rls_cap_write_legacy_import_batches"
ON public."legacy_import_batches"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "legacy_student_subject_enrollments_mgmt_select"
ON public."legacy_student_subject_enrollments"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "rls_cap_write_legacy_student_subject_enrollments"
ON public."legacy_student_subject_enrollments"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "rls_cap_select_lesson_reminder_logs"
ON public."lesson_reminder_logs"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_lesson_reminder_logs"
ON public."lesson_reminder_logs"
  USING (
    (SELECT private.has_capability('students.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.update'::text))
  );

ALTER POLICY "rls_cap_select_mgmt_audit_log"
ON public."mgmt_audit_log"
  USING (
    ((SELECT private.has_capability('audit.read_all'::text)) OR ((SELECT private.has_capability('audit.read_own'::text)) AND (role = (SELECT public.current_app_role())) AND (actor_label ~~* (('%'::text || (SELECT public.current_app_user_email())) || '%'::text))))
  );

ALTER POLICY "rls_cap_select_mgmt_system_errors"
ON public."mgmt_system_errors"
  USING (
    (SELECT private.has_capability('audit.read_all'::text))
  );

ALTER POLICY "rls_cap_select_monthly_tuition_charges"
ON public."monthly_tuition_charges"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_monthly_tuition_charges"
ON public."monthly_tuition_charges"
  USING (
    (SELECT private.has_capability('payments.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('payments.create'::text))
  );

ALTER POLICY "rls_cap_select_payment_batches"
ON public."payment_batches"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payment_batches"
ON public."payment_batches"
  USING (
    (SELECT private.has_capability('payments.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('payments.create'::text))
  );

ALTER POLICY "portal_select_payment_details"
ON public."payment_details"
  USING (
    ((SELECT public.is_portal()) AND (EXISTS ( SELECT 1
   FROM payments p
  WHERE ((p.id = payment_details.payment_id) AND (p.student_id = (SELECT public.current_portal_student_id()))))))
  );

ALTER POLICY "rls_cap_select_payment_details"
ON public."payment_details"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payment_details"
ON public."payment_details"
  USING (
    (SELECT (private.has_capability('payments.create'::text) OR private.has_capability('payments.mark_received'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('payments.create'::text) OR private.has_capability('payments.mark_received'::text)))
  );

ALTER POLICY "rls_cap_select_payment_discount_applications"
ON public."payment_discount_applications"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payment_discount_applications"
ON public."payment_discount_applications"
  USING (
    (SELECT private.has_capability('payments.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('payments.create'::text))
  );

ALTER POLICY "rls_cap_select_payment_discounts"
ON public."payment_discounts"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payment_discounts"
ON public."payment_discounts"
  USING (
    (SELECT private.has_capability('catalog.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('catalog.manage'::text))
  );

ALTER POLICY "rls_cap_select_payment_late_fee_items"
ON public."payment_late_fee_items"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payment_late_fee_items"
ON public."payment_late_fee_items"
  USING (
    (SELECT private.has_capability('payments.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('payments.create'::text))
  );

ALTER POLICY "portal_select_payments"
ON public."payments"
  USING (
    ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id())))
  );

ALTER POLICY "rls_cap_insert_payments"
ON public."payments"
  WITH CHECK (
    (SELECT private.has_capability('payments.create'::text))
  );

ALTER POLICY "rls_cap_select_payments"
ON public."payments"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_payments"
ON public."payments"
  USING (
    (SELECT (private.has_capability('payments.create'::text) OR private.has_capability('payments.mark_received'::text) OR private.has_capability('payments.void'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('payments.create'::text) OR private.has_capability('payments.mark_received'::text) OR private.has_capability('payments.void'::text)))
  );

ALTER POLICY "rls_cap_insert_payroll_adjustments"
ON public."payroll_adjustments"
  WITH CHECK (
    (SELECT private.has_capability('payroll.adjust.request'::text))
  );

ALTER POLICY "rls_cap_select_payroll_adjustments"
ON public."payroll_adjustments"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_payroll_adjustments"
ON public."payroll_adjustments"
  USING (
    (SELECT (private.has_capability('payroll.adjust.request'::text) OR private.has_capability('payroll.verify'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('payroll.adjust.request'::text) OR private.has_capability('payroll.verify'::text)))
  );

ALTER POLICY "rls_cap_select_payroll_homework_hour_overrides"
ON public."payroll_homework_hour_overrides"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payroll_homework_hour_overrides"
ON public."payroll_homework_hour_overrides"
  USING (
    (SELECT (private.has_capability('payroll.prepare'::text) OR private.has_capability('payroll.hours'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('payroll.prepare'::text) OR private.has_capability('payroll.hours'::text)))
  );

ALTER POLICY "rls_cap_select_payroll_homework_rates"
ON public."payroll_homework_rates"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payroll_homework_rates"
ON public."payroll_homework_rates"
  USING (
    (SELECT private.has_capability('catalog.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('catalog.manage'::text))
  );

ALTER POLICY "rls_cap_select_payroll_manual_hours"
ON public."payroll_manual_hours"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payroll_manual_hours"
ON public."payroll_manual_hours"
  USING (
    (SELECT private.has_capability('payroll.hours'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('payroll.hours'::text))
  );

ALTER POLICY "rls_cap_select_payroll_rates"
ON public."payroll_rates"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payroll_rates"
ON public."payroll_rates"
  USING (
    (SELECT private.has_capability('catalog.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('catalog.manage'::text))
  );

ALTER POLICY "rls_cap_insert_payroll_runs"
ON public."payroll_runs"
  WITH CHECK (
    (SELECT (private.has_capability('payroll.prepare'::text) OR private.has_capability('payroll.verify'::text)))
  );

ALTER POLICY "rls_cap_select_payroll_runs"
ON public."payroll_runs"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_payroll_runs"
ON public."payroll_runs"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  )
  WITH CHECK (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_select_payroll_teacher_states"
ON public."payroll_teacher_states"
  USING (
    (SELECT (private.has_capability('payroll.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_payroll_teacher_states"
ON public."payroll_teacher_states"
  USING (
    (SELECT (private.has_capability('payroll.prepare'::text) OR private.has_capability('payroll.review'::text) OR private.has_capability('payroll.exclude'::text) OR private.has_capability('payroll.submit'::text) OR private.has_capability('payroll.return'::text) OR private.has_capability('payroll.verify'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('payroll.prepare'::text) OR private.has_capability('payroll.review'::text) OR private.has_capability('payroll.exclude'::text) OR private.has_capability('payroll.submit'::text) OR private.has_capability('payroll.return'::text) OR private.has_capability('payroll.verify'::text)))
  );

ALTER POLICY "portal_enrollment_request_lines_portal_select"
ON public."portal_enrollment_request_lines"
  USING (
    ((SELECT public.is_portal()) AND (EXISTS ( SELECT 1
   FROM portal_enrollment_requests r
  WHERE ((r.id = portal_enrollment_request_lines.request_id) AND (r.student_id = (SELECT public.current_portal_student_id()))))))
  );

ALTER POLICY "rls_cap_select_portal_enrollment_request_lines"
ON public."portal_enrollment_request_lines"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_portal_enrollment_request_lines"
ON public."portal_enrollment_request_lines"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "portal_enrollment_requests_portal_select"
ON public."portal_enrollment_requests"
  USING (
    ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id())))
  );

ALTER POLICY "rls_cap_select_portal_enrollment_requests"
ON public."portal_enrollment_requests"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_portal_enrollment_requests"
ON public."portal_enrollment_requests"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "portal_staff_view_as_own"
ON public."portal_staff_view_as"
  USING (
    ((SELECT private.has_capability('portal.invite'::text)) AND (staff_app_user_id = (SELECT public.current_app_user_id())))
  )
  WITH CHECK (
    ((SELECT private.has_capability('portal.invite'::text)) AND (staff_app_user_id = (SELECT public.current_app_user_id())))
  );

ALTER POLICY "rls_cap_select_referral_records"
ON public."referral_records"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_referral_records"
ON public."referral_records"
  USING (
    (SELECT private.has_capability('payments.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('payments.create'::text))
  );

ALTER POLICY "rls_cap_select_sales_campaign_activities"
ON public."sales_campaign_activities"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_sales_campaign_activities"
ON public."sales_campaign_activities"
  USING (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  )
  WITH CHECK (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_select_sales_campaign_members"
ON public."sales_campaign_members"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_sales_campaign_members"
ON public."sales_campaign_members"
  USING (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  )
  WITH CHECK (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_select_sales_campaigns"
ON public."sales_campaigns"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_sales_campaigns"
ON public."sales_campaigns"
  USING (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  )
  WITH CHECK (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_select_sales_student_states"
ON public."sales_student_states"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_sales_student_states"
ON public."sales_student_states"
  USING (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  )
  WITH CHECK (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_select_scheduled_email_sends"
ON public."scheduled_email_sends"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "portal_select_schedules"
ON public."schedules"
  USING (
    ((SELECT public.is_portal()) AND portal_can_access_class(class_id))
  );

ALTER POLICY "rls_cap_delete_schedules"
ON public."schedules"
  USING (
    (SELECT (private.has_capability('schedule.create'::text) OR private.has_capability('schedule.cancel'::text)))
  );

ALTER POLICY "rls_cap_insert_schedules"
ON public."schedules"
  WITH CHECK (
    (SELECT private.has_capability('schedule.create'::text))
  );

ALTER POLICY "rls_cap_select_schedules"
ON public."schedules"
  USING (
    (SELECT (private.has_capability('schedule.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_schedules"
ON public."schedules"
  USING (
    (SELECT (private.has_capability('schedule.create'::text) OR private.has_capability('schedule.reschedule'::text) OR private.has_capability('schedule.cancel'::text) OR private.has_capability('schedule.substitute'::text) OR private.has_capability('schedule.update_status'::text)))
  )
  WITH CHECK (
    (SELECT (private.has_capability('schedule.create'::text) OR private.has_capability('schedule.reschedule'::text) OR private.has_capability('schedule.cancel'::text) OR private.has_capability('schedule.substitute'::text) OR private.has_capability('schedule.update_status'::text)))
  );

ALTER POLICY "rls_phase_b_teacher_select_schedules"
ON public."schedules"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_owns_schedule_row((SELECT public.current_teacher_id()), class_id, teacher_id, original_teacher_id))
  );

ALTER POLICY "rls_phase_b_teacher_update_schedules"
ON public."schedules"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_owns_schedule_row((SELECT public.current_teacher_id()), class_id, teacher_id, original_teacher_id))
  )
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND teacher_owns_schedule_row((SELECT public.current_teacher_id()), class_id, teacher_id, original_teacher_id))
  );

ALTER POLICY "rls_cap_select_script_library_entries"
ON public."script_library_entries"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "rls_cap_write_script_library_entries"
ON public."script_library_entries"
  USING (
    (SELECT private.has_capability('calendar.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('calendar.manage'::text))
  );

ALTER POLICY "portal_select_enrollments"
ON public."student_class_enrollments"
  USING (
    ((SELECT public.is_portal()) AND (student_id = (SELECT public.current_portal_student_id())))
  );

ALTER POLICY "rls_cap_select_student_class_enrollments"
ON public."student_class_enrollments"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_student_class_enrollments"
ON public."student_class_enrollments"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_student_class_enrollments"
ON public."student_class_enrollments"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_class(class_id))
  );

ALTER POLICY "rls_cap_insert_student_code_counters"
ON public."student_code_counters"
  WITH CHECK (
    (SELECT private.has_capability('students.create'::text))
  );

ALTER POLICY "rls_cap_select_student_code_counters"
ON public."student_code_counters"
  USING (
    (SELECT private.has_capability('students.create'::text))
  );

ALTER POLICY "rls_cap_update_student_code_counters"
ON public."student_code_counters"
  USING (
    (SELECT private.has_capability('students.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.create'::text))
  );

ALTER POLICY "rls_cap_select_student_enrollment_sessions"
ON public."student_enrollment_sessions"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_student_enrollment_sessions"
ON public."student_enrollment_sessions"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "rls_teacher_select_student_enrollment_sessions"
ON public."student_enrollment_sessions"
  USING (
    ((SELECT public.is_teacher_role()) AND (EXISTS ( SELECT 1
   FROM student_class_enrollments e
  WHERE ((e.id = student_enrollment_sessions.enrollment_id) AND teacher_can_access_class(e.class_id)))))
  );

ALTER POLICY "rls_cap_delete_student_entitlement_pools"
ON public."student_entitlement_pools"
  USING (
    (SELECT private.has_capability('entitlements.correct'::text))
  );

ALTER POLICY "rls_cap_insert_student_entitlement_pools"
ON public."student_entitlement_pools"
  WITH CHECK (
    (SELECT (private.has_capability('students.enroll'::text) OR private.has_capability('payments.create'::text) OR private.has_capability('entitlements.correct'::text)))
  );

ALTER POLICY "rls_cap_select_student_entitlement_pools"
ON public."student_entitlement_pools"
  USING (
    (SELECT (private.has_capability('entitlements.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_student_entitlement_pools"
ON public."student_entitlement_pools"
  USING (
    (SELECT (public.is_mgmt_staff() AND (private.has_capability('attendance.take'::text) OR private.has_capability('students.enroll'::text) OR private.has_capability('payments.create'::text) OR private.has_capability('entitlements.correct'::text))))
  )
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND (private.has_capability('attendance.take'::text) OR private.has_capability('students.enroll'::text) OR private.has_capability('payments.create'::text) OR private.has_capability('entitlements.correct'::text))))
  );

ALTER POLICY "rls_teacher_select_student_entitlement_pools"
ON public."student_entitlement_pools"
  USING (
    ((SELECT public.is_teacher_role()) AND (((class_id IS NOT NULL) AND teacher_can_access_class(class_id)) OR (EXISTS ( SELECT 1
   FROM (student_class_enrollments e
     JOIN classes c ON ((c.id = e.class_id)))
  WHERE ((e.student_id = student_entitlement_pools.student_id) AND (c.academic_year_id = student_entitlement_pools.academic_year_id) AND teacher_can_access_class(e.class_id))))))
  );

ALTER POLICY "rls_teacher_update_student_entitlement_pools"
ON public."student_entitlement_pools"
  USING (
    ((SELECT public.is_teacher_role()) AND (SELECT private.has_capability('attendance.take'::text)) AND teacher_can_access_class(class_id))
  )
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND (SELECT private.has_capability('attendance.take'::text)) AND teacher_can_access_class(class_id))
  );

ALTER POLICY "rls_cap_select_student_pending_lessons"
ON public."student_pending_lessons"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_student_pending_lessons"
ON public."student_pending_lessons"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "rls_teacher_select_student_pending_lessons"
ON public."student_pending_lessons"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_class(class_id))
  );

ALTER POLICY "rls_cap_select_student_portal_invites"
ON public."student_portal_invites"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_student_portal_invites"
ON public."student_portal_invites"
  USING (
    (SELECT private.has_capability('portal.invite'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('portal.invite'::text))
  );

ALTER POLICY "rls_cap_select_student_profile_tags"
ON public."student_profile_tags"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_student_profile_tags"
ON public."student_profile_tags"
  USING (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  )
  WITH CHECK (
    (SELECT (private.has_capability('students.update'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_select_student_relationships"
ON public."student_relationships"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_student_relationships"
ON public."student_relationships"
  USING (
    (SELECT private.has_capability('students.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.update'::text))
  );

ALTER POLICY "rls_cap_select_student_status_history"
ON public."student_status_history"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_student_status_history"
ON public."student_status_history"
  USING (
    (SELECT private.has_capability('students.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.update'::text))
  );

ALTER POLICY "portal_select_students"
ON public."students"
  USING (
    ((SELECT public.is_portal()) AND (id = (SELECT public.current_portal_student_id())))
  );

ALTER POLICY "rls_cap_delete_students"
ON public."students"
  USING (
    (SELECT private.has_capability('students.update'::text))
  );

ALTER POLICY "rls_cap_insert_students"
ON public."students"
  WITH CHECK (
    (SELECT private.has_capability('students.create'::text))
  );

ALTER POLICY "rls_cap_select_students"
ON public."students"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_update_students"
ON public."students"
  USING (
    (SELECT private.has_capability('students.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.update'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_students"
ON public."students"
  USING (
    ((SELECT public.is_teacher_role()) AND teacher_can_access_student(id))
  );

ALTER POLICY "rls_cap_select_subjects"
ON public."subjects"
  USING (
    (SELECT (private.has_capability('classes.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_subjects"
ON public."subjects"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_subjects"
ON public."subjects"
  USING (
    (SELECT public.is_teacher_role())
  );

ALTER POLICY "rls_cap_select_teacher_availability_slots"
ON public."teacher_availability_slots"
  USING (
    (SELECT private.has_capability('teacher_availability.manage'::text))
  );

ALTER POLICY "rls_cap_write_teacher_availability_slots"
ON public."teacher_availability_slots"
  USING (
    (SELECT private.has_capability('teacher_availability.manage'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('teacher_availability.manage'::text))
  );

ALTER POLICY "rls_cap_select_teacher_lesson_reminder_logs"
ON public."teacher_lesson_reminder_logs"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_teacher_lesson_reminder_logs"
ON public."teacher_lesson_reminder_logs"
  USING (
    (SELECT private.has_capability('students.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.update'::text))
  );

ALTER POLICY "portal_select_teachers"
ON public."teachers"
  USING (
    ((SELECT public.is_portal()) AND (EXISTS ( SELECT 1
   FROM classes c
  WHERE ((c.teacher_id = teachers.id) AND (portal_can_access_class(c.id) OR portal_class_matches_current_student_grade(c.id))))))
  );

ALTER POLICY "rls_cap_select_teachers"
ON public."teachers"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "rls_cap_write_teachers"
ON public."teachers"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_teachers"
ON public."teachers"
  USING (
    (SELECT public.is_teacher_role())
  );

ALTER POLICY "rls_phase_b_teacher_update_teachers"
ON public."teachers"
  USING (
    ((SELECT public.is_teacher_role()) AND (id = (SELECT public.current_teacher_id())))
  )
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND (id = (SELECT public.current_teacher_id())))
  );

ALTER POLICY "rls_cap_select_teachers_private"
ON public."teachers_private"
  USING (
    (SELECT public.is_mgmt_staff())
  );

ALTER POLICY "rls_cap_write_teachers_private"
ON public."teachers_private"
  USING (
    (SELECT private.has_capability('classes.update'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('classes.update'::text))
  );

ALTER POLICY "rls_teacher_select_own_teachers_private"
ON public."teachers_private"
  USING (
    ((SELECT public.is_teacher_role()) AND (teacher_id = (SELECT public.current_teacher_id())))
  );

ALTER POLICY "rls_teacher_update_own_teachers_private"
ON public."teachers_private"
  USING (
    ((SELECT public.is_teacher_role()) AND (teacher_id = (SELECT public.current_teacher_id())))
  )
  WITH CHECK (
    ((SELECT public.is_teacher_role()) AND (teacher_id = (SELECT public.current_teacher_id())))
  );

ALTER POLICY "trial_invite_request_lines_mgmt_all"
ON public."trial_invite_request_lines"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  )
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  );

ALTER POLICY "trial_invite_request_lines_mgmt_select"
ON public."trial_invite_request_lines"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.read'::text)))
  );

ALTER POLICY "trial_invite_requests_mgmt_all"
ON public."trial_invite_requests"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  )
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  );

ALTER POLICY "trial_invite_requests_mgmt_select"
ON public."trial_invite_requests"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.read'::text)))
  );

ALTER POLICY "trial_invite_tokens_mgmt_all"
ON public."trial_invite_tokens"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  )
  WITH CHECK (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.enroll'::text)))
  );

ALTER POLICY "trial_invite_tokens_mgmt_select"
ON public."trial_invite_tokens"
  USING (
    (SELECT (public.is_mgmt_staff() AND private.has_capability('students.read'::text)))
  );

ALTER POLICY "rls_cap_select_trial_sessions"
ON public."trial_sessions"
  USING (
    (SELECT (private.has_capability('students.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_trial_sessions"
ON public."trial_sessions"
  USING (
    (SELECT private.has_capability('students.enroll'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('students.enroll'::text))
  );

ALTER POLICY "rls_phase_b_teacher_select_trial_sessions"
ON public."trial_sessions"
  USING (
    ((SELECT public.is_teacher_role()) AND (teacher_can_access_class(class_id) OR teacher_can_access_schedule(schedule_id)))
  );

ALTER POLICY "rls_cap_select_tuition_credit_entries"
ON public."tuition_credit_entries"
  USING (
    (SELECT (private.has_capability('payments.read'::text) AND public.is_mgmt_staff()))
  );

ALTER POLICY "rls_cap_write_tuition_credit_entries"
ON public."tuition_credit_entries"
  USING (
    (SELECT private.has_capability('payments.create'::text))
  )
  WITH CHECK (
    (SELECT private.has_capability('payments.create'::text))
  );
COMMIT;
