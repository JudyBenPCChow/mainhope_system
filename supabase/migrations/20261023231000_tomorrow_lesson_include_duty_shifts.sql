-- 明日課堂提醒：同房其餘功輔當值一併列入（上班提醒，要到場就寄）。
-- 佔室列上的老師已有該班當日堂，不重複。其餘人用自己的當值時段與課室。

create or replace function public.teacher_tomorrow_lesson_email_payload(
  p_date date default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with target as (
  select coalesce(
    p_date,
    ((timezone('Asia/Hong_Kong', now()))::date + 1)
  ) as d
),
sched as (
  select
    s.id as schedule_id,
    s.scheduled_date,
    s.start_time,
    s.end_time,
    s.class_id,
    s.teacher_id,
    s.original_teacher_id,
    s.is_extra_lesson,
    s.remarks as schedule_remarks,
    c.subject,
    c.course_code_full,
    c.class_kind,
    co.course_name,
    cr.name as classroom_name,
    t.full_name as teacher_name,
    t.english_name as teacher_english_name,
    t.honorific as teacher_honorific,
    ot.full_name as original_teacher_name,
    p.notification_email
  from public.schedules s
  join public.classes c on c.id = s.class_id
  left join public.courses co on co.id = c.course_id
  left join public.classrooms cr on cr.id = s.classroom_id
  join public.teachers t on t.id = s.teacher_id
  left join public.teachers ot on ot.id = s.original_teacher_id
  left join public.teachers_private p on p.teacher_id = t.id
  cross join target
  where s.scheduled_date = target.d
    and s.teacher_id is not null
    and coalesce(s.status, '') not like '%取消%'
    and coalesce(t.full_name, '') not ilike '%test%'
    and coalesce(c.course_code_full, '') not ilike '%test%'
    and coalesce(c.subject, '') not ilike '%test%'
    and coalesce(co.course_name, '') not ilike '%test%'
),
duty_extra as (
  select
    occ.schedule_id,
    d.duty_date as scheduled_date,
    to_char(a.session_start, 'HH24:MI') as start_time,
    to_char(a.session_end, 'HH24:MI') as end_time,
    c.id as class_id,
    a.teacher_id,
    c.subject,
    c.course_code_full,
    c.class_kind,
    co.course_name,
    a.room as classroom_name,
    t.full_name as teacher_name,
    t.english_name as teacher_english_name,
    t.honorific as teacher_honorific,
    p.notification_email
  from public.homework_tutoring_duty_days d
  join public.homework_tutoring_roster_months rm on rm.id = d.roster_month_id
  join public.homework_tutoring_duty_assignments a on a.duty_day_id = d.id
  join public.classes c on c.id = rm.class_id
  join public.teachers t on t.id = a.teacher_id
  left join public.teachers_private p on p.teacher_id = t.id
  left join public.courses co on co.id = c.course_id
  left join lateral (
    select s.id as schedule_id
    from public.schedules s
    where s.class_id = c.id
      and s.scheduled_date = d.duty_date
      and coalesce(s.status, '') not like '%取消%'
      and coalesce(s.remarks, '') like '%功輔佔室%'
    order by s.start_time
    limit 1
  ) occ on true
  cross join target
  where d.duty_date = target.d
    and rm.status = '已編更'
    and nullif(btrim(d.holiday_label), '') is null
    and coalesce(t.full_name, '') not ilike '%test%'
    and coalesce(c.course_code_full, '') not ilike '%test%'
    and coalesce(c.subject, '') not ilike '%test%'
    and coalesce(co.course_name, '') not ilike '%test%'
    and not exists (
      select 1
      from sched s
      where s.teacher_id = a.teacher_id
        and s.class_id = c.id
        and s.scheduled_date = d.duty_date
    )
),
roster as (
  select distinct s.schedule_id, st.id as student_id, st.full_name as student_name
  from sched s
  join public.attendance_declarations decl
    on decl.schedule_id = s.schedule_id and decl.status = 'active'
  join public.students st on st.id = decl.student_id
  join public.student_class_enrollments e
    on e.student_id = decl.student_id
   and e.class_id = s.class_id
   and e.status = '就讀中'
   and (e.enroll_date is null or s.scheduled_date >= e.enroll_date)
   and (e.withdraw_effective_date is null or s.scheduled_date < e.withdraw_effective_date)
  where coalesce(s.class_kind, 'group') not in ('homework', 'private')

  union

  select distinct s.schedule_id, st.id, st.full_name
  from sched s
  join public.student_class_enrollments e
    on e.class_id = s.class_id
   and e.status = '就讀中'
   and (e.enroll_date is null or s.scheduled_date >= e.enroll_date)
   and (e.withdraw_effective_date is null or s.scheduled_date < e.withdraw_effective_date)
  join public.students st on st.id = e.student_id
  where s.class_kind in ('homework', 'private')

  union

  select distinct s.schedule_id, st.id, st.full_name
  from sched s
  join public.trial_sessions ts on ts.schedule_id = s.schedule_id
  join public.payments pay on pay.id = ts.payment_id
  join public.students st on st.id = ts.student_id
  where ts.payment_id is not null
    and pay.status = '已收款'
    and coalesce(ts.status, '') not like '%取消%'

  union

  select distinct s.schedule_id, st.id, st.full_name
  from sched s
  join public.leave_makeup_records l on l.makeup_schedule_id = s.schedule_id
  join public.students st on st.id = l.student_id
),
leaves as (
  select
    s.schedule_id,
    st.id as student_id,
    st.full_name as student_name,
    l.leave_reason,
    l.makeup_type,
    l.remarks as leave_remarks,
    ms.scheduled_date as makeup_scheduled_date
  from sched s
  join public.leave_makeup_records l
    on (
      l.schedule_id = s.schedule_id
      or (
        l.schedule_id is null
        and l.class_id = s.class_id
        and l.leave_date = s.scheduled_date
      )
    )
  join public.students st on st.id = l.student_id
  left join public.schedules ms on ms.id = l.makeup_schedule_id
),
classified as (
  select
    l.*,
    case
      when coalesce(l.makeup_type, '') ~* '(錄影|錄像|錄音|網課|線上|zoom|即時直播|錄影回放)'
        then 'zoom_or_record'
      else 'leave'
    end as bucket
  from leaves l
),
lesson_json as (
  select
    s.teacher_id,
    s.teacher_name,
    s.teacher_english_name,
    s.teacher_honorific,
    s.notification_email,
    jsonb_build_object(
      'schedule_id', s.schedule_id,
      'start_time', s.start_time,
      'end_time', s.end_time,
      'subject', s.subject,
      'course_code_full', s.course_code_full,
      'course_name', s.course_name,
      'classroom_name', s.classroom_name,
      'class_kind', s.class_kind,
      'is_extra_lesson', coalesce(s.is_extra_lesson, false),
      'original_teacher_name', s.original_teacher_name,
      'schedule_remarks', s.schedule_remarks,
      'is_duty_shift', false,
      'no_teaching_needed', (
        not exists (
          select 1
          from roster r
          where r.schedule_id = s.schedule_id
            and not exists (
              select 1 from classified c
              where c.schedule_id = s.schedule_id
                and c.student_id = r.student_id
                and c.bucket = 'leave'
            )
        )
        and not exists (
          select 1 from classified c
          where c.schedule_id = s.schedule_id and c.bucket = 'zoom_or_record'
        )
      ),
      'student_names', coalesce((
        select jsonb_agg(x.student_name order by x.student_name)
        from (
          select r.student_name
          from roster r
          where r.schedule_id = s.schedule_id
            and not exists (
              select 1 from classified c
              where c.schedule_id = s.schedule_id and c.student_id = r.student_id
            )
        ) x
      ), '[]'::jsonb),
      'zoom_or_record_names', coalesce((
        select jsonb_agg(c.student_name order by c.student_name)
        from classified c
        where c.schedule_id = s.schedule_id and c.bucket = 'zoom_or_record'
      ), '[]'::jsonb),
      'leave_names', coalesce((
        select jsonb_agg(c.student_name order by c.student_name)
        from classified c
        where c.schedule_id = s.schedule_id and c.bucket = 'leave'
      ), '[]'::jsonb),
      'leave_details', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'student_name', c.student_name,
            'leave_reason', c.leave_reason,
            'makeup_type', c.makeup_type,
            'leave_remarks', c.leave_remarks,
            'makeup_scheduled_date', c.makeup_scheduled_date,
            'bucket', c.bucket
          )
          order by c.student_name
        )
        from classified c
        where c.schedule_id = s.schedule_id
      ), '[]'::jsonb)
    ) as lesson
  from sched s

  union all

  select
    dx.teacher_id,
    dx.teacher_name,
    dx.teacher_english_name,
    dx.teacher_honorific,
    dx.notification_email,
    jsonb_build_object(
      'schedule_id', dx.schedule_id,
      'start_time', dx.start_time,
      'end_time', dx.end_time,
      'subject', dx.subject,
      'course_code_full', dx.course_code_full,
      'course_name', dx.course_name,
      'classroom_name', dx.classroom_name,
      'class_kind', dx.class_kind,
      'is_extra_lesson', false,
      'original_teacher_name', null,
      'schedule_remarks', '功輔當值',
      'is_duty_shift', true,
      'no_teaching_needed', false,
      'student_names', coalesce((
        select jsonb_agg(x.student_name order by x.student_name)
        from (
          select r.student_name
          from roster r
          where dx.schedule_id is not null
            and r.schedule_id = dx.schedule_id
            and not exists (
              select 1 from classified c
              where c.schedule_id = dx.schedule_id and c.student_id = r.student_id
            )
        ) x
      ), '[]'::jsonb),
      'zoom_or_record_names', coalesce((
        select jsonb_agg(c.student_name order by c.student_name)
        from classified c
        where dx.schedule_id is not null
          and c.schedule_id = dx.schedule_id
          and c.bucket = 'zoom_or_record'
      ), '[]'::jsonb),
      'leave_names', coalesce((
        select jsonb_agg(c.student_name order by c.student_name)
        from classified c
        where dx.schedule_id is not null
          and c.schedule_id = dx.schedule_id
          and c.bucket = 'leave'
      ), '[]'::jsonb),
      'leave_details', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'student_name', c.student_name,
            'leave_reason', c.leave_reason,
            'makeup_type', c.makeup_type,
            'leave_remarks', c.leave_remarks,
            'makeup_scheduled_date', c.makeup_scheduled_date,
            'bucket', c.bucket
          )
          order by c.student_name
        )
        from classified c
        where dx.schedule_id is not null
          and c.schedule_id = dx.schedule_id
      ), '[]'::jsonb)
    ) as lesson
  from duty_extra dx
)
select coalesce(
  (
    select jsonb_agg(teacher_row order by sort_key)
    from (
      select
        jsonb_build_object(
          'teacher_id', lj.teacher_id,
          'teacher_name', max(lj.teacher_name),
          'teacher_english_name', max(lj.teacher_english_name),
          'honorific', max(lj.teacher_honorific),
          'notification_email', max(lj.notification_email),
          'lessons', jsonb_agg(lj.lesson order by lj.lesson->>'start_time', lj.lesson->>'course_code_full')
        ) as teacher_row,
        coalesce(max(lj.teacher_english_name), max(lj.teacher_name), '') as sort_key
      from lesson_json lj
      group by lj.teacher_id
    ) t
  ),
  '[]'::jsonb
);
$$;

comment on function public.teacher_tomorrow_lesson_email_payload(date) is
  '翌日老師課堂電郵：含專科／功輔／私人，以及同房其餘功輔當值；空班標 no_teaching_needed；當值不標不用上堂。';

revoke all on function public.teacher_tomorrow_lesson_email_payload(date) from public;
revoke all on function public.teacher_tomorrow_lesson_email_payload(date) from anon, authenticated;
grant execute on function public.teacher_tomorrow_lesson_email_payload(date) to service_role;

notify pgrst, 'reload schema';
