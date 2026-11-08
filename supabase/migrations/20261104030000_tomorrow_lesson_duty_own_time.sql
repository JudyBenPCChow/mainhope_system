-- 明日課堂提醒：功課輔導班佔室排程仍不列入（時間固定 15:15 起）。
-- 已編更、非假期的功輔當值改列入，時間用該段 session_start／session_end。
-- 當值不帶課室。學生只計該日星期包含在 homework_weekdays 的就讀中報讀。

begin;

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
    and coalesce(c.class_kind, '') <> 'homework'
    and coalesce(c.course_code_full, '') !~* 'HWK'
    and coalesce(c.subject, '') !~* '(功課輔導|homework)'
    and coalesce(co.course_name, '') !~* '(功課輔導|homework)'
    and coalesce(s.remarks, '') not like '%功輔佔室%'
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
  where coalesce(s.class_kind, 'group') <> 'private'

  union

  select distinct s.schedule_id, st.id, st.full_name
  from sched s
  join public.student_class_enrollments e
    on e.class_id = s.class_id
   and e.status = '就讀中'
   and (e.enroll_date is null or s.scheduled_date >= e.enroll_date)
   and (e.withdraw_effective_date is null or s.scheduled_date < e.withdraw_effective_date)
  join public.students st on st.id = e.student_id
  where s.class_kind = 'private'

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
),
duty as (
  select
    a.id as schedule_id,
    to_char(a.session_start, 'HH24:MI') as start_time,
    to_char(a.session_end, 'HH24:MI') as end_time,
    c.subject,
    c.course_code_full,
    co.course_name,
    a.teacher_id,
    t.full_name as teacher_name,
    t.english_name as teacher_english_name,
    t.honorific as teacher_honorific,
    p.notification_email,
    c.id as class_id,
    d.duty_date as scheduled_date,
    (array['日','一','二','三','四','五','六'])[extract(dow from d.duty_date)::int + 1] as weekday_char
  from public.homework_tutoring_duty_days d
  join public.homework_tutoring_roster_months rm on rm.id = d.roster_month_id
  join public.homework_tutoring_duty_assignments a on a.duty_day_id = d.id
  join public.classes c on c.id = rm.class_id
  join public.teachers t on t.id = a.teacher_id
  left join public.teachers_private p on p.teacher_id = t.id
  left join public.courses co on co.id = c.course_id
  cross join target
  where d.duty_date = target.d
    and rm.status = '已編更'
    and nullif(btrim(d.holiday_label), '') is null
    and coalesce(t.full_name, '') not ilike '%test%'
    and coalesce(c.course_code_full, '') not ilike '%test%'
    and coalesce(c.subject, '') not ilike '%test%'
    and coalesce(co.course_name, '') not ilike '%test%'
),
duty_json as (
  select
    d.teacher_id,
    d.teacher_name,
    d.teacher_english_name,
    d.teacher_honorific,
    d.notification_email,
    jsonb_build_object(
      'schedule_id', d.schedule_id,
      'start_time', d.start_time,
      'end_time', d.end_time,
      'subject', d.subject,
      'course_code_full', d.course_code_full,
      'course_name', d.course_name,
      'classroom_name', null,
      'class_kind', 'homework',
      'is_extra_lesson', false,
      'original_teacher_name', null,
      'schedule_remarks', null,
      'is_duty_shift', true,
      'no_teaching_needed', false,
      'student_names', coalesce((
        select jsonb_agg(x.student_name order by x.student_name)
        from (
          select distinct st.full_name as student_name
          from public.student_class_enrollments e
          join public.students st on st.id = e.student_id
          where e.class_id = d.class_id
            and e.status = '就讀中'
            and (e.enroll_date is null or d.scheduled_date >= e.enroll_date)
            and (e.withdraw_effective_date is null or d.scheduled_date < e.withdraw_effective_date)
            and d.weekday_char = any(coalesce(e.homework_weekdays, '{}'::text[]))
        ) x
      ), '[]'::jsonb),
      'zoom_or_record_names', '[]'::jsonb,
      'leave_names', '[]'::jsonb,
      'leave_details', '[]'::jsonb
    ) as lesson
  from duty d
),
all_lessons as (
  select * from lesson_json
  union all
  select * from duty_json
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
      from all_lessons lj
      group by lj.teacher_id
    ) t
  ),
  '[]'::jsonb
);
$$;

comment on function public.teacher_tomorrow_lesson_email_payload(date) is
  '明日課堂提醒。專科與私人課程走排程；功課輔導班佔室不列入。功輔當值用各段自己的時段，不帶課室。';

revoke all on function public.teacher_tomorrow_lesson_email_payload(date) from public;
revoke all on function public.teacher_tomorrow_lesson_email_payload(date) from anon, authenticated;
grant execute on function public.teacher_tomorrow_lesson_email_payload(date) to service_role;

notify pgrst, 'reload schema';

commit;
