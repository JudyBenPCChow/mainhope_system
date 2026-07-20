-- 跨班調堂：接待老師（makeup_schedule 所屬）須能讀取 leave_makeup_records，
-- 並能讀取該補堂學生，否則空班＋補堂會被當成「無需點名／無人報讀」。

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
  );
$$;

comment on function public.teacher_can_access_student(uuid) is
  'RLS Phase B: student enrolled in teacher class, linked via assigned todo, or makeup target on teacher schedule.';

drop policy if exists rls_phase_b_teacher_select_leave_makeup_records on public.leave_makeup_records;
create policy rls_phase_b_teacher_select_leave_makeup_records
on public.leave_makeup_records
for select
to authenticated
using (
  public.is_teacher_role()
  and (
    public.teacher_can_access_class(class_id)
    or (
      makeup_schedule_id is not null
      and public.teacher_can_access_schedule(makeup_schedule_id)
    )
  )
);

commit;
