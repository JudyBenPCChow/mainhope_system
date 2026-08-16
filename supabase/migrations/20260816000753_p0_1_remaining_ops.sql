-- P0-1 延後表／校曆／檔期／課程主檔／老師目錄。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
-- review_portal_enrollment_request 只改 students.enroll guard；唔好還原自動開待繳費單。
--
-- 試堂／待補堂／前台填表／聯絡更新／Portal 報讀申請
-- 課室預約／校曆活動／校曆停課／老師檔期
-- 課程主檔寫入維持 catalog.manage；subjects／years／classrooms 寫入 classes.update
-- 老師目錄寫入 classes.update（無獨立 key）；teachers_private 財務只讀
-- 老師／家長 SELECT 政策唔郁

-- ---------------------------------------------------------------------------
-- RPC：前台填表／聯絡更新／Portal 審核
-- ---------------------------------------------------------------------------

create or replace function public.front_desk_intake_create()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_id uuid;
  v_expires timestamptz := now() + interval '4 hours';
begin
  if not private.has_capability('students.create') then
    raise exception '無權限建立前台填表連結';
  end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.front_desk_intake_sessions (token, status, expires_at)
  values (v_token, 'open', v_expires)
  returning id into v_id;
  return jsonb_build_object(
    'id', v_id,
    'token', v_token,
    'status', 'open',
    'expires_at', v_expires
  );
end;
$$;

create or replace function public.front_desk_intake_consume(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.has_capability('students.create') then
    raise exception '無權限';
  end if;
  update public.front_desk_intake_sessions
  set status = 'consumed', consumed_at = now()
  where token = trim(p_token)
    and status = 'submitted';
end;
$$;

create or replace function public.contact_update_require_admin_or_alien()
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if not private.has_capability('students.update') then
    raise exception '無權限（須 students.update）';
  end if;
end;
$$;

comment on function public.contact_update_require_admin_or_alien() is
  'P0-1：改查 students.update（公理 1 含 manager）。函數名保留以免改呼叫點。';

-- 只改權限 guard；業務維持「核准只建報讀、唔自動開待繳費單」
-- （20260730013000_simplify_tuition_arrears_entrypoints.sql）
create or replace function public.review_portal_enrollment_request(
  p_request_id uuid,
  p_approve boolean,
  p_staff_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.portal_enrollment_requests%rowtype;
  v_line public.portal_enrollment_request_lines%rowtype;
  v_reviewer uuid;
  v_today date := (timezone('Asia/Hong_Kong', now()))::date;
  v_enrollment_id uuid;
  v_existing_id uuid;
  v_existing_status text;
begin
  if not private.has_capability('students.enroll') then
    raise exception '僅職員可審核報讀申請';
  end if;

  select au.id into v_reviewer
  from public.app_users au
  where lower(coalesce(au.email, '')) = public.current_app_user_email()
  limit 1;

  select * into v_req
  from public.portal_enrollment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception '找不到申請';
  end if;
  if v_req.status <> 'submitted' then
    raise exception '此申請已處理';
  end if;

  if not p_approve then
    update public.portal_enrollment_requests
    set status = 'rejected',
        staff_note = nullif(trim(coalesce(p_staff_note, '')), ''),
        reviewed_by = v_reviewer,
        reviewed_at = now(),
        updated_at = now()
    where id = p_request_id;
    return p_request_id;
  end if;

  for v_line in
    select * from public.portal_enrollment_request_lines
    where request_id = p_request_id
    order by created_at
  loop
    select id, status into v_existing_id, v_existing_status
    from public.student_class_enrollments
    where student_id = v_req.student_id
      and class_id = v_line.class_id
    limit 1;

    if v_existing_id is not null then
      if v_existing_status = '就讀中' then
        raise exception '學生已報讀「%」，請先處理既有報讀', coalesce(v_line.class_label, v_line.class_id::text);
      end if;
      update public.student_class_enrollments
      set status = '就讀中',
          enroll_date = v_today,
          enrollment_period = v_line.enrollment_period,
          updated_at = now()
      where id = v_existing_id;
      v_enrollment_id := v_existing_id;
      delete from public.student_enrollment_sessions where enrollment_id = v_enrollment_id;
    else
      insert into public.student_class_enrollments (
        student_id, class_id, status, enroll_date, enrollment_period
      ) values (
        v_req.student_id, v_line.class_id, '就讀中', v_today, v_line.enrollment_period
      )
      returning id into v_enrollment_id;
    end if;

    if v_line.enrollment_period = '單堂' then
      insert into public.student_enrollment_sessions (enrollment_id, schedule_id)
      select v_enrollment_id, sid
      from unnest(v_line.schedule_ids) sid
      on conflict do nothing;
    end if;

    insert into public.enrollment_change_events (
      student_id, class_id, enrollment_id, action, effective_date, reason, enrollment_period
    ) values (
      v_req.student_id,
      v_line.class_id,
      v_enrollment_id,
      'enroll',
      v_today,
      '家長報讀申請核准',
      v_line.enrollment_period
    );
  end loop;

  update public.portal_enrollment_requests
  set status = 'approved',
      payment_id = null,
      staff_note = nullif(trim(coalesce(p_staff_note, '')), ''),
      reviewed_by = v_reviewer,
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  return p_request_id;
end;
$$;

comment on function public.review_portal_enrollment_request(uuid, boolean, text) is
  'P0-1：審核須 students.enroll。核准只建報讀，不自動開待繳費單。';

-- ---------------------------------------------------------------------------
-- trial_sessions
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_trial_sessions on public.trial_sessions;
drop policy if exists rls_cap_select_trial_sessions on public.trial_sessions;
drop policy if exists rls_cap_write_trial_sessions on public.trial_sessions;

create policy rls_cap_select_trial_sessions
on public.trial_sessions for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_trial_sessions
on public.trial_sessions for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

-- ---------------------------------------------------------------------------
-- student_pending_lessons
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_student_pending_lessons
  on public.student_pending_lessons;
drop policy if exists rls_cap_select_student_pending_lessons
  on public.student_pending_lessons;
drop policy if exists rls_cap_write_student_pending_lessons
  on public.student_pending_lessons;

create policy rls_cap_select_student_pending_lessons
on public.student_pending_lessons for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_student_pending_lessons
on public.student_pending_lessons for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

-- ---------------------------------------------------------------------------
-- front_desk_intake_sessions
-- ---------------------------------------------------------------------------

drop policy if exists front_desk_intake_sessions_mgmt_all
  on public.front_desk_intake_sessions;
drop policy if exists rls_cap_select_front_desk_intake_sessions
  on public.front_desk_intake_sessions;
drop policy if exists rls_cap_write_front_desk_intake_sessions
  on public.front_desk_intake_sessions;

create policy rls_cap_select_front_desk_intake_sessions
on public.front_desk_intake_sessions for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_front_desk_intake_sessions
on public.front_desk_intake_sessions for all to authenticated
using (private.has_capability('students.create'))
with check (private.has_capability('students.create'));

-- ---------------------------------------------------------------------------
-- contact_update_tokens
-- ---------------------------------------------------------------------------

drop policy if exists contact_update_tokens_mgmt_all
  on public.contact_update_tokens;
drop policy if exists rls_cap_select_contact_update_tokens
  on public.contact_update_tokens;
drop policy if exists rls_cap_write_contact_update_tokens
  on public.contact_update_tokens;

create policy rls_cap_select_contact_update_tokens
on public.contact_update_tokens for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_contact_update_tokens
on public.contact_update_tokens for all to authenticated
using (private.has_capability('students.update'))
with check (private.has_capability('students.update'));

-- ---------------------------------------------------------------------------
-- portal_enrollment_requests／lines（portal 政策保留）
-- ---------------------------------------------------------------------------

drop policy if exists portal_enrollment_requests_mgmt_all
  on public.portal_enrollment_requests;
drop policy if exists rls_cap_select_portal_enrollment_requests
  on public.portal_enrollment_requests;
drop policy if exists rls_cap_write_portal_enrollment_requests
  on public.portal_enrollment_requests;

create policy rls_cap_select_portal_enrollment_requests
on public.portal_enrollment_requests for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_portal_enrollment_requests
on public.portal_enrollment_requests for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

drop policy if exists portal_enrollment_request_lines_mgmt_all
  on public.portal_enrollment_request_lines;
drop policy if exists rls_cap_select_portal_enrollment_request_lines
  on public.portal_enrollment_request_lines;
drop policy if exists rls_cap_write_portal_enrollment_request_lines
  on public.portal_enrollment_request_lines;

create policy rls_cap_select_portal_enrollment_request_lines
on public.portal_enrollment_request_lines for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_portal_enrollment_request_lines
on public.portal_enrollment_request_lines for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

-- ---------------------------------------------------------------------------
-- classroom_booking_requests（老師自己列保留）
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_classroom_booking_requests
  on public.classroom_booking_requests;
drop policy if exists rls_cap_select_classroom_booking_requests
  on public.classroom_booking_requests;
drop policy if exists rls_cap_write_classroom_booking_requests
  on public.classroom_booking_requests;

create policy rls_cap_select_classroom_booking_requests
on public.classroom_booking_requests for select to authenticated
using (private.has_capability('schedule.read') and public.is_mgmt_staff());

create policy rls_cap_write_classroom_booking_requests
on public.classroom_booking_requests for all to authenticated
using (private.has_capability('schedule.create'))
with check (private.has_capability('schedule.create'));

-- ---------------------------------------------------------------------------
-- 校曆活動
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'calendar_events',
    'calendar_event_teachers',
    'calendar_event_students',
    'calendar_event_tags',
    'calendar_event_updates',
    'calendar_event_users'
  ]
  loop
    execute format(
      'drop policy if exists rls_phase_b_mgmt_all_%I on public.%I', t, t
    );
    execute format(
      'drop policy if exists rls_cap_select_%I on public.%I', t, t
    );
    execute format(
      'drop policy if exists rls_cap_write_%I on public.%I', t, t
    );
    execute format(
      'create policy rls_cap_select_%I on public.%I for select to authenticated using (private.has_capability(''calendar.manage''))',
      t, t
    );
    execute format(
      'create policy rls_cap_write_%I on public.%I for all to authenticated using (private.has_capability(''calendar.manage'')) with check (private.has_capability(''calendar.manage''))',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- academic_calendar_closures（財務讀月費用）
-- ---------------------------------------------------------------------------

drop policy if exists monthly_tuition_calendar_mgmt_closures
  on public.academic_calendar_closures;
drop policy if exists rls_cap_select_academic_calendar_closures
  on public.academic_calendar_closures;
drop policy if exists rls_cap_write_academic_calendar_closures
  on public.academic_calendar_closures;

create policy rls_cap_select_academic_calendar_closures
on public.academic_calendar_closures for select to authenticated
using (
  private.has_capability('calendar.manage')
  or (private.has_capability('payments.read') and public.is_mgmt_staff())
);

create policy rls_cap_write_academic_calendar_closures
on public.academic_calendar_closures for all to authenticated
using (private.has_capability('calendar.manage'))
with check (private.has_capability('calendar.manage'));

-- ---------------------------------------------------------------------------
-- teacher_availability_slots
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_teacher_availability_slots
  on public.teacher_availability_slots;
drop policy if exists rls_cap_select_teacher_availability_slots
  on public.teacher_availability_slots;
drop policy if exists rls_cap_write_teacher_availability_slots
  on public.teacher_availability_slots;

create policy rls_cap_select_teacher_availability_slots
on public.teacher_availability_slots for select to authenticated
using (private.has_capability('teacher_availability.manage'));

create policy rls_cap_write_teacher_availability_slots
on public.teacher_availability_slots for all to authenticated
using (private.has_capability('teacher_availability.manage'))
with check (private.has_capability('teacher_availability.manage'));

-- ---------------------------------------------------------------------------
-- courses：寫入 catalog.manage；職員讀 classes.read
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_c_alien_all_courses on public.courses;
drop policy if exists rls_mgmt_select_courses on public.courses;
drop policy if exists rls_cap_select_courses on public.courses;
drop policy if exists rls_cap_write_courses on public.courses;

create policy rls_cap_select_courses
on public.courses for select to authenticated
using (private.has_capability('classes.read') and public.is_mgmt_staff());

create policy rls_cap_write_courses
on public.courses for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

-- ---------------------------------------------------------------------------
-- subjects／academic_years／periods／classrooms
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects',
    'academic_years',
    'academic_year_periods',
    'classrooms'
  ]
  loop
    execute format(
      'drop policy if exists rls_phase_b_mgmt_all_%I on public.%I', t, t
    );
    execute format(
      'drop policy if exists rls_cap_select_%I on public.%I', t, t
    );
    execute format(
      'drop policy if exists rls_cap_write_%I on public.%I', t, t
    );
    execute format(
      'create policy rls_cap_select_%I on public.%I for select to authenticated using (private.has_capability(''classes.read'') and public.is_mgmt_staff())',
      t, t
    );
    execute format(
      'create policy rls_cap_write_%I on public.%I for all to authenticated using (private.has_capability(''classes.update'')) with check (private.has_capability(''classes.update''))',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- teachers／teachers_private
-- 目錄寫入跟 classes.update（無 teachers.* key）
-- 敏感列：財務可讀（計糧／職員資料），不可寫
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_teachers on public.teachers;
drop policy if exists rls_cap_select_teachers on public.teachers;
drop policy if exists rls_cap_write_teachers on public.teachers;

create policy rls_cap_select_teachers
on public.teachers for select to authenticated
using (public.is_mgmt_staff());

create policy rls_cap_write_teachers
on public.teachers for all to authenticated
using (private.has_capability('classes.update'))
with check (private.has_capability('classes.update'));

drop policy if exists rls_mgmt_all_teachers_private on public.teachers_private;
drop policy if exists rls_cap_select_teachers_private on public.teachers_private;
drop policy if exists rls_cap_write_teachers_private on public.teachers_private;

create policy rls_cap_select_teachers_private
on public.teachers_private for select to authenticated
using (public.is_mgmt_staff());

create policy rls_cap_write_teachers_private
on public.teachers_private for all to authenticated
using (private.has_capability('classes.update'))
with check (private.has_capability('classes.update'));

-- ---------------------------------------------------------------------------
-- 稽核：U3 alien＋manager 全查；admin／finance 只查自己
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_c_alien_select_mgmt_audit_log
  on public.mgmt_audit_log;
drop policy if exists rls_cap_select_mgmt_audit_log
  on public.mgmt_audit_log;

create policy rls_cap_select_mgmt_audit_log
on public.mgmt_audit_log for select to authenticated
using (
  private.has_capability('audit.read_all')
  or (
    private.has_capability('audit.read_own')
    and role = public.current_app_role()
    and actor_label ilike '%' || public.current_app_user_email() || '%'
  )
);

drop policy if exists rls_phase_c_alien_select_mgmt_system_errors
  on public.mgmt_system_errors;
drop policy if exists rls_cap_select_mgmt_system_errors
  on public.mgmt_system_errors;

create policy rls_cap_select_mgmt_system_errors
on public.mgmt_system_errors for select to authenticated
using (private.has_capability('audit.read_all'));

update private.authz_meta
set authz_version = 7,
    updated_at = now()
where id = 1;
