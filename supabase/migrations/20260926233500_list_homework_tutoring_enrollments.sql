-- 功輔報讀名冊：供功課紀錄／今日情況讀取。
-- 老師不可靠 teacher_can_access_class（功輔班未必是其 classes.teacher_id），
-- 改以 can_access_homework_day_logs 安全讀取，避免直查 enrollments＋students embed 卡住。
-- 套用：npm run db:apply -- supabase/migrations/20260926233500_list_homework_tutoring_enrollments.sql

begin;

create or replace function public.list_homework_tutoring_enrollments(p_class_id uuid)
returns table (
  enrollment_id uuid,
  student_id uuid,
  student_name text,
  student_code text,
  grade text,
  homework_day_plan text,
  homework_weekdays text[],
  enroll_date date,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id as enrollment_id,
    e.student_id,
    coalesce(nullif(btrim(s.full_name), ''), '—') as student_name,
    coalesce(nullif(btrim(s.student_code), ''), '—') as student_code,
    coalesce(nullif(btrim(s.grade), ''), '—') as grade,
    e.homework_day_plan::text,
    e.homework_weekdays,
    e.enroll_date,
    e.status::text
  from public.student_class_enrollments e
  join public.students s on s.id = e.student_id
  where e.class_id = p_class_id
    and public.can_access_homework_day_logs()
  order by e.enroll_date desc nulls last;
$$;

comment on function public.list_homework_tutoring_enrollments(uuid) is
  '功輔報讀名冊（功課紀錄用）。僅 can_access_homework_day_logs 可讀。';

revoke all on function public.list_homework_tutoring_enrollments(uuid) from public;
revoke all on function public.list_homework_tutoring_enrollments(uuid) from anon;
grant execute on function public.list_homework_tutoring_enrollments(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
