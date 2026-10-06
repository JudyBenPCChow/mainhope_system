-- Elaine Yao：兼職 HC 計薪＋功輔時薪
-- 合約生效 2026-09-13；費率 effective_from 用 2026-09-01（pickRateForMonth 以月初比對）
--
-- 專科班：
--   初中 $120／節＋$50／人頭（由第 2 人起）
--   高中 $150／節＋$70／人頭（由第 2 人起）
-- 功輔：$100／小時（初中功輔班）
--
-- 套用：npm run db:apply -- supabase/migrations/20261006144000_elaine_yao_payroll_rates.sql

begin;

do $$
declare
  tid uuid;
  v_from date := date '2026-09-01';
begin
  select id into tid
  from public.teachers
  where id = 'fb4f114f-476e-41f3-ae57-b272730a91c0'::uuid
     or full_name = 'Elaine Yao'
     or lower(coalesce(english_name, '')) = lower('Elaine Yao')
  limit 1;

  if tid is null then
    raise exception 'teachers 找不到 Elaine Yao';
  end if;

  -- 專科班兼職 HC（初中 per_extra $50，異於一般兼職 $60）
  if not exists (
    select 1
    from public.payroll_rates
    where teacher_id = tid
      and mode = '兼職 HC'
      and effective_from = v_from
  ) then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid,
      '兼職 HC',
      v_from,
      jsonb_build_object(
        'junior', jsonb_build_object('base', 120, 'per_extra', 50),
        'senior', jsonb_build_object('base', 150, 'per_extra', 70),
        'one_to_one_hc', 3,
        'one_to_two_hc', 4
      ),
      'Elaine Yao：合約 2026-09-13；初中 $120+$50／人頭（第2人起）；高中 $150+$70／人頭（第2人起）'
    );
  else
    update public.payroll_rates
       set config = jsonb_build_object(
             'junior', jsonb_build_object('base', 120, 'per_extra', 50),
             'senior', jsonb_build_object('base', 150, 'per_extra', 70),
             'one_to_one_hc', 3,
             'one_to_two_hc', 4
           ),
           notes = 'Elaine Yao：合約 2026-09-13；初中 $120+$50／人頭（第2人起）；高中 $150+$70／人頭（第2人起）',
           updated_at = now()
     where teacher_id = tid
       and mode = '兼職 HC'
       and effective_from = v_from;
  end if;

  -- 功輔時薪 $100
  if not exists (
    select 1
    from public.payroll_homework_rates
    where teacher_id = tid
      and effective_from = v_from
  ) then
    insert into public.payroll_homework_rates (teacher_id, hourly_rate, effective_from, notes)
    values (tid, 100, v_from, 'Elaine Yao：初中功輔 $100／小時');
  else
    update public.payroll_homework_rates
       set hourly_rate = 100,
           notes = 'Elaine Yao：初中功輔 $100／小時'
     where teacher_id = tid
       and effective_from = v_from;
  end if;
end $$;

commit;
