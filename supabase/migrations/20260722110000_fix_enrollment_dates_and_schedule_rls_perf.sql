-- Hotfix: production 載入過慢
-- 1) get_enrollment_effective_dates 對每列排程呼叫 teacher_can_access_schedule → 平均 6s／次、易 timeout
-- 2) 名單 RPC 補上 withdraw_effective_date，前端可不再二次呼叫慢 RPC
-- 3) schedules 老師 RLS 改欄位比對，避免 per-row 再查一次 schedules
-- 4) 補齊熱路徑 FK／日期索引

begin;

-- ── indexes ──────────────────────────────────────────────────────────────
create index if not exists schedules_class_id_idx
  on public.schedules (class_id);

create index if not exists schedules_teacher_id_idx
  on public.schedules (teacher_id);

create index if not exists schedules_scheduled_date_idx
  on public.schedules (scheduled_date);

create index if not exists classes_teacher_id_idx
  on public.classes (teacher_id);

create index if not exists student_class_enrollments_class_id_idx
  on public.student_class_enrollments (class_id);

-- ── cheap schedule access helper (column-level; used by policies) ─────────
create or replace function public.teacher_owns_schedule_row(
  p_teacher_id uuid,
  p_class_id uuid,
  p_schedule_teacher_id uuid,
  p_original_teacher_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_teacher_id is not null
    and (
      p_schedule_teacher_id = p_teacher_id
      or p_original_teacher_id = p_teacher_id
      or exists (
        select 1
        from public.classes c
        where c.id = p_class_id
          and c.teacher_id = p_teacher_id
      )
    );
$$;

revoke all on function public.teacher_owns_schedule_row(uuid, uuid, uuid, uuid) from public;
revoke all on function public.teacher_owns_schedule_row(uuid, uuid, uuid, uuid) from anon;
grant execute on function public.teacher_owns_schedule_row(uuid, uuid, uuid, uuid) to authenticated;

-- keep id-based helper for other call sites, but reuse column helper
create or replace function public.teacher_can_access_schedule(p_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.schedules s
    where s.id = p_schedule_id
      and public.teacher_owns_schedule_row(
        public.current_teacher_id(),
        s.class_id,
        s.teacher_id,
        s.original_teacher_id
      )
  );
$$;

drop policy if exists rls_phase_b_teacher_select_schedules on public.schedules;
create policy rls_phase_b_teacher_select_schedules
  on public.schedules
  for select
  to authenticated
  using (
    public.is_teacher_role()
    and public.teacher_owns_schedule_row(
      public.current_teacher_id(),
      class_id,
      teacher_id,
      original_teacher_id
    )
  );

drop policy if exists rls_phase_b_teacher_update_schedules on public.schedules;
create policy rls_phase_b_teacher_update_schedules
  on public.schedules
  for update
  to authenticated
  using (
    public.is_teacher_role()
    and public.teacher_owns_schedule_row(
      public.current_teacher_id(),
      class_id,
      teacher_id,
      original_teacher_id
    )
  )
  with check (
    public.is_teacher_role()
    and public.teacher_owns_schedule_row(
      public.current_teacher_id(),
      class_id,
      teacher_id,
      original_teacher_id
    )
  );

-- classes: avoid teacher_can_access_class(id) re-lookup
drop policy if exists rls_phase_b_teacher_select_classes on public.classes;
create policy rls_phase_b_teacher_select_classes
  on public.classes
  for select
  to authenticated
  using (
    public.is_teacher_role()
    and teacher_id = public.current_teacher_id()
  );

-- ── fast enrollment dates（admin 短路；老師用 class／代堂欄位）────────────
create or replace function public.get_enrollment_effective_dates(p_enrollment_ids uuid[])
returns table (
  enrollment_id uuid,
  enroll_date date,
  withdraw_effective_date date
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.enroll_date, e.withdraw_effective_date
  from public.student_class_enrollments e
  where e.id = any(coalesce(p_enrollment_ids, array[]::uuid[]))
    and cardinality(coalesce(p_enrollment_ids, array[]::uuid[])) <= 500
    and (
      public.is_mgmt_staff()
      or (
        public.is_teacher_role()
        and (
          public.teacher_can_access_class(e.class_id)
          or exists (
            select 1
            from public.schedules s
            where s.class_id = e.class_id
              and (
                s.teacher_id = public.current_teacher_id()
                or s.original_teacher_id = public.current_teacher_id()
              )
          )
        )
      )
    );
$$;

comment on function public.get_enrollment_effective_dates(uuid[]) is
  '點名名單日期過濾所需的最小報讀日期；mgmt 直接回傳，老師以班別／代堂欄位授權（避免 per-schedule RLS helper）。';

-- ── roster RPC：直接帶 withdraw_effective_date ───────────────────────────
create or replace function public.get_teacher_schedule_roster_context(p_schedule_ids uuid[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_schedule_ids uuid[];
  v_requested_count integer;
  v_authorized_count integer;
begin
  if public.current_app_role() not in ('admin', 'alien', 'teacher') then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select coalesce(array_agg(x order by x), array[]::uuid[])
  into v_schedule_ids
  from (
    select distinct unnest(coalesce(p_schedule_ids, array[]::uuid[])) as x
  ) requested
  where x is not null;

  v_requested_count := cardinality(v_schedule_ids);
  if v_requested_count = 0 then
    return jsonb_build_object(
      'schedules', '[]'::jsonb,
      'periods', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'enrollment_sessions', '[]'::jsonb,
      'trials', '[]'::jsonb,
      'leaves', '[]'::jsonb,
      'attendance', '[]'::jsonb
    );
  end if;
  if v_requested_count > 100 then
    raise exception 'TOO_MANY_SCHEDULES';
  end if;

  select count(*)
  into v_authorized_count
  from public.schedules s
  where s.id = any(v_schedule_ids)
    and (
      public.is_mgmt_staff()
      or (
        public.is_teacher_role()
        and public.teacher_owns_schedule_row(
          public.current_teacher_id(),
          s.class_id,
          s.teacher_id,
          s.original_teacher_id
        )
      )
    );

  if v_authorized_count <> v_requested_count then
    raise exception 'SCHEDULE_ACCESS_DENIED';
  end if;

  return (
    with requested_schedules as (
      select
        s.id,
        s.class_id,
        s.scheduled_date,
        s.session_number,
        c.academic_year_id,
        ay.label as academic_year_label,
        c.subject,
        c.class_kind,
        c.course_code_full,
        c.day_of_week,
        c.time_slot,
        c.lesson_slots_per_session,
        co.course_name,
        case
          when co.course_mode = 'summer_two_period' then 'summer_two_period'
          else 'regular'
        end as course_mode
      from public.schedules s
      left join public.classes c on c.id = s.class_id
      left join public.courses co on co.id = c.course_id
      left join public.academic_years ay on ay.id = c.academic_year_id
      where s.id = any(v_schedule_ids)
    ),
    requested_classes as (
      select distinct rs.class_id
      from requested_schedules rs
      where rs.class_id is not null
    ),
    requested_years as (
      select distinct rs.academic_year_id
      from requested_schedules rs
      where rs.academic_year_id is not null
    ),
    enrollment_rows as (
      select
        e.id,
        e.class_id,
        e.student_id,
        e.status,
        e.enroll_date,
        e.withdraw_effective_date,
        e.enrollment_period,
        e.created_at,
        st.full_name,
        st.english_name,
        st.grade,
        st.school,
        coalesce(
          nullif(btrim(st.whatsapp), ''),
          nullif(btrim(st.student_phone), ''),
          nullif(btrim(st.parent_phone), '')
        ) as contact_phone
      from public.student_class_enrollments e
      join requested_classes rc on rc.class_id = e.class_id
      join public.students st on st.id = e.student_id
      where e.status = '就讀中'
    ),
    relevant_leaves as (
      select distinct
        l.id,
        l.student_id,
        l.class_id,
        l.schedule_id,
        l.leave_date,
        l.leave_reason,
        l.makeup_type,
        l.makeup_schedule_id,
        l.status,
        l.created_at,
        st.full_name,
        st.english_name,
        st.grade,
        coalesce(
          nullif(btrim(st.whatsapp), ''),
          nullif(btrim(st.student_phone), ''),
          nullif(btrim(st.parent_phone), '')
        ) as contact_phone
      from public.leave_makeup_records l
      join public.students st on st.id = l.student_id
      where l.schedule_id = any(v_schedule_ids)
         or l.makeup_schedule_id = any(v_schedule_ids)
         or exists (
           select 1
           from requested_schedules rs
           where rs.class_id = l.class_id
             and rs.scheduled_date = l.leave_date
         )
    ),
    relevant_attendance as (
      select distinct
        a.id,
        a.student_id,
        a.class_id,
        a.attendance_date,
        a.schedule_id,
        a.status,
        a.remarks,
        a.created_at,
        st.full_name,
        st.english_name
      from public.attendance_details a
      join public.students st on st.id = a.student_id
      where a.schedule_id = any(v_schedule_ids)
         or (
           a.schedule_id is null
           and exists (
             select 1
             from requested_schedules rs
             where rs.class_id = a.class_id
               and rs.scheduled_date = a.attendance_date
           )
         )
    )
    select jsonb_build_object(
      'schedules',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', rs.id,
            'class_id', rs.class_id,
            'scheduled_date', rs.scheduled_date,
            'session_number', rs.session_number,
            'academic_year_id', rs.academic_year_id,
            'academic_year_label', rs.academic_year_label,
            'subject', rs.subject,
            'class_kind', rs.class_kind,
            'course_code_full', rs.course_code_full,
            'course_name', rs.course_name,
            'day_of_week', rs.day_of_week,
            'time_slot', rs.time_slot,
            'lesson_slots_per_session', rs.lesson_slots_per_session,
            'course_mode', rs.course_mode
          )
          order by rs.scheduled_date, rs.id
        )
        from requested_schedules rs
      ), '[]'::jsonb),
      'periods',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'academic_year_id', p.academic_year_id,
            'period_code', p.period_code,
            'label', p.label,
            'start_date', p.start_date,
            'end_date', p.end_date
          )
          order by p.academic_year_id, p.period_code
        )
        from public.academic_year_periods p
        join requested_years ry on ry.academic_year_id = p.academic_year_id
      ), '[]'::jsonb),
      'enrollments',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'class_id', e.class_id,
            'student_id', e.student_id,
            'status', e.status,
            'enroll_date', e.enroll_date,
            'withdraw_effective_date', e.withdraw_effective_date,
            'enrollment_period', e.enrollment_period,
            'created_at', e.created_at,
            'full_name', e.full_name,
            'english_name', e.english_name,
            'grade', e.grade,
            'school', e.school,
            'contact_phone', e.contact_phone
          )
          order by e.created_at, e.id
        )
        from enrollment_rows e
      ), '[]'::jsonb),
      'enrollment_sessions',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'enrollment_id', es.enrollment_id,
            'schedule_id', es.schedule_id,
            'session_number', s.session_number
          )
          order by es.enrollment_id, s.session_number nulls last, es.schedule_id
        )
        from public.student_enrollment_sessions es
        join enrollment_rows e on e.id = es.enrollment_id
        join public.schedules s on s.id = es.schedule_id
      ), '[]'::jsonb),
      'trials',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'schedule_id', t.schedule_id,
            'class_id', t.class_id,
            'student_id', t.student_id,
            'status', t.status,
            'full_name', st.full_name,
            'english_name', st.english_name,
            'grade', st.grade,
            'contact_phone', coalesce(
              nullif(btrim(st.whatsapp), ''),
              nullif(btrim(st.student_phone), ''),
              nullif(btrim(st.parent_phone), '')
            )
          )
          order by t.created_at, t.id
        )
        from public.trial_sessions t
        join public.students st on st.id = t.student_id
        where t.schedule_id = any(v_schedule_ids)
      ), '[]'::jsonb),
      'leaves',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'student_id', l.student_id,
            'class_id', l.class_id,
            'schedule_id', l.schedule_id,
            'leave_date', l.leave_date,
            'leave_reason', l.leave_reason,
            'makeup_type', l.makeup_type,
            'makeup_schedule_id', l.makeup_schedule_id,
            'status', l.status,
            'created_at', l.created_at,
            'full_name', l.full_name,
            'english_name', l.english_name,
            'grade', l.grade,
            'contact_phone', l.contact_phone
          )
          order by l.created_at, l.id
        )
        from relevant_leaves l
      ), '[]'::jsonb),
      'attendance',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'student_id', a.student_id,
            'class_id', a.class_id,
            'attendance_date', a.attendance_date,
            'schedule_id', a.schedule_id,
            'status', a.status,
            'remarks', a.remarks,
            'created_at', a.created_at,
            'full_name', a.full_name,
            'english_name', a.english_name
          )
          order by a.created_at, a.id
        )
        from relevant_attendance a
      ), '[]'::jsonb)
    )
  );
end;
$$;

comment on function public.get_teacher_schedule_roster_context(uuid[]) is
  'Returns minimal roster context for explicitly authorized schedules; includes enroll/withdraw dates for roll-call filtering.';

commit;
