-- Katie Lee：2026-10-01 起不再用固定月薪
-- 專科：初中 $130＋$60／其後人頭；高中 $150＋$70／其後人頭
-- 功輔：$100／小時
-- 2026-09-30 或之前仍為固定月薪 $20,000；強積金維持
--
-- 套用：npm run db:apply -- supabase/migrations/20261103233000_katie_lee_hc_from_october.sql

begin;

do $$
declare
  tid uuid := '1f501fa8-dc4f-4d6b-b67b-3381e420acaa'::uuid;
  closed int;
begin
  if not exists (
    select 1 from public.teachers
    where id = tid and full_name = 'Katie Lee'
  ) then
    raise exception 'teachers 找不到 Katie Lee';
  end if;

  update public.payroll_rates
     set effective_to = date '2026-09-30',
         notes = 'Katie 固定月薪 $20,000（2026-09-30 或之前；2026-10-01 起改兼職人頭）',
         updated_at = now()
   where teacher_id = tid
     and mode = '固定月薪'
     and effective_from = date '2026-03-01'
     and effective_to is null
     and (config->>'monthly_salary')::numeric = 20000;
  get diagnostics closed = row_count;
  if closed <> 1 then
    raise exception '未能把 Katie 固定月薪收束至 2026-09-30（更新列數 %）', closed;
  end if;

  if exists (
    select 1 from public.payroll_rates
    where teacher_id = tid
      and mode = '兼職 HC'
      and effective_from = date '2026-10-01'
  ) then
    raise exception 'Katie 2026-10-01 兼職 HC 費率已存在';
  end if;

  insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
  values (
    tid,
    '兼職 HC',
    date '2026-10-01',
    jsonb_build_object(
      'junior', jsonb_build_object('base', 130, 'per_extra', 60),
      'senior', jsonb_build_object('base', 150, 'per_extra', 70),
      'one_to_one_hc', 3,
      'one_to_two_hc', 4,
      'mpf', true
    ),
    'Katie Lee：2026-10-01 起。初中 $130＋$60／其後人頭；高中 $150＋$70／其後人頭。仍計強積金。'
  );

  if exists (
    select 1 from public.payroll_homework_rates
    where teacher_id = tid and effective_from = date '2026-10-01'
  ) then
    raise exception 'Katie 2026-10-01 功輔時薪已存在';
  end if;

  insert into public.payroll_homework_rates (teacher_id, hourly_rate, effective_from, notes)
  values (
    tid,
    100,
    date '2026-10-01',
    'Katie Lee：2026-10-01 起功輔 $100／小時'
  );
end $$;

commit;
