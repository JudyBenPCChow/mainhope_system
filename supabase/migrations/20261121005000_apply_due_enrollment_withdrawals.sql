-- 未來生效的退讀，生效日前維持就讀中。
-- 香港日期一到生效日，把狀態改為已退讀。點名資格在退讀當下已按生效日作廢。

create or replace function public.apply_due_enrollment_withdrawals()
returns integer
language plpgsql
set search_path = public
as $$
declare
  n integer;
begin
  with due as (
    update public.student_class_enrollments
    set status = '已退讀',
        updated_at = now()
    where status = '就讀中'
      and withdraw_effective_date is not null
      and withdraw_effective_date <= (timezone('Asia/Hong_Kong', now()))::date
    returning id
  )
  select count(*)::integer into n from due;
  return coalesce(n, 0);
end;
$$;

comment on function public.apply_due_enrollment_withdrawals() is
  '香港日期已到退讀生效日、狀態仍為就讀中者，改為已退讀';

revoke all on function public.apply_due_enrollment_withdrawals() from public, anon, authenticated;
grant execute on function public.apply_due_enrollment_withdrawals() to service_role;

create extension if not exists pg_cron;

do $$
declare
  r record;
begin
  for r in
    select jobid from cron.job
    where jobname = 'apply-due-enrollment-withdrawals'
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end $$;

-- 香港 00:05（UTC 16:05）
select cron.schedule(
  'apply-due-enrollment-withdrawals',
  '5 16 * * *',
  $$select public.apply_due_enrollment_withdrawals()$$
);

select public.apply_due_enrollment_withdrawals();
