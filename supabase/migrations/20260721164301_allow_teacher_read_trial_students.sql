-- 試堂生尚未有 student_class_enrollments；老師雖可讀 trial_sessions，
-- students RLS 原本仍會隱藏姓名及聯絡資料，導致名單顯示「—」。

begin;

create or replace function public.teacher_can_access_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_class_enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = p_student_id
      and c.teacher_id = public.current_teacher_id()
  )
  or exists (
    select 1
    from public.calendar_event_students ces
    join public.calendar_event_teachers cet on cet.event_id = ces.event_id
    where ces.student_id = p_student_id
      and cet.teacher_id = public.current_teacher_id()
  )
  or exists (
    select 1
    from public.leave_makeup_records l
    where l.student_id = p_student_id
      and l.makeup_schedule_id is not null
      and public.teacher_can_access_schedule(l.makeup_schedule_id)
  )
  or exists (
    select 1
    from public.trial_sessions t
    where t.student_id = p_student_id
      and public.teacher_can_access_class(t.class_id)
  );
$$;

comment on function public.teacher_can_access_student(uuid) is
  'RLS Phase B: student enrolled in teacher class, linked via assigned todo, makeup target, or trial session in teacher class.';

commit;
