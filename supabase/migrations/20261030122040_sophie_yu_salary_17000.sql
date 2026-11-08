-- Sophie Yu：固定月薪由 $16,000 調整為 $17,000（2026-11-01 起）
-- 套用：npm run db:apply -- supabase/migrations/20261030122040_sophie_yu_salary_17000.sql
--
-- 強積金（總薪酬 $7,100–$30,000，各 5%）：
--   僱員供款 $850、僱主供款 $850、實收 $16,150。
-- 2026-03-01 至 2026-10-31 維持 $16,000，不改已入審閱的 9 月、10 月糧。

begin;

do $$
declare
  tid uuid;
  v_old_from date := date '2026-03-01';
  v_old_to date := date '2026-10-31';
  v_new_from date := date '2026-11-01';
  closed int;
begin
  select id into tid
  from public.teachers
  where full_name = 'Sophie Yu'
     or lower(coalesce(english_name, '')) = lower('Sophie Yu')
  limit 1;

  if tid is null then
    raise exception 'teachers 找不到 Sophie Yu';
  end if;

  update public.payroll_rates
     set effective_to = v_old_to,
         updated_at = now()
   where teacher_id = tid
     and mode = '固定月薪'
     and effective_from = v_old_from
     and (config->>'monthly_salary')::numeric = 16000
     and effective_to is null;
  get diagnostics closed = row_count;

  if closed <> 1 then
    raise exception '未能收束 Sophie 2026-03-01 月薪 $16,000（更新列數 %）', closed;
  end if;

  if exists (
    select 1
    from public.payroll_rates
    where teacher_id = tid
      and mode = '固定月薪'
      and effective_from = v_new_from
  ) then
    raise exception 'Sophie 已有 2026-11-01 固定月薪，不重複插入';
  end if;

  insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
  values (
    tid,
    '固定月薪',
    v_new_from,
    jsonb_build_object('monthly_salary', 17000, 'mpf', true),
    'Sophie 固定月薪調整（行政人員；2026-11-01 起 $17,000）'
  );
end $$;

commit;
