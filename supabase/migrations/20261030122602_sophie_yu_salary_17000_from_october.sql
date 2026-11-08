-- Sophie Yu：固定月薪 $17,000 改由 2026-10-01 起生效（含十月糧）
-- 套用：npm run db:apply -- supabase/migrations/20261030122602_sophie_yu_salary_17000_from_october.sql
--
-- 先前 20261030122040 把 $17,000 設成 2026-11-01 起，十月仍 $16,000。
-- 今次：2026-03-01 至 2026-09-30 維持 $16,000；2026-10-01 起 $17,000。
-- 十月糧單仍在財務審閱中，一併改該月 snapshot，以免未重算前仍顯示 $16,000。

begin;

do $$
declare
  tid uuid;
  closed int;
  moved int;
  v_run uuid;
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
     set effective_to = date '2026-09-30',
         updated_at = now()
   where teacher_id = tid
     and mode = '固定月薪'
     and effective_from = date '2026-03-01'
     and effective_to = date '2026-10-31'
     and (config->>'monthly_salary')::numeric = 16000;
  get diagnostics closed = row_count;
  if closed <> 1 then
    raise exception '未能把 Sophie $16,000 收束至 2026-09-30（更新列數 %）', closed;
  end if;

  update public.payroll_rates
     set effective_from = date '2026-10-01',
         notes = 'Sophie 固定月薪調整（行政人員；2026-10-01 起 $17,000）',
         updated_at = now()
   where teacher_id = tid
     and mode = '固定月薪'
     and effective_from = date '2026-11-01'
     and effective_to is null
     and (config->>'monthly_salary')::numeric = 17000;
  get diagnostics moved = row_count;
  if moved <> 1 then
    raise exception '未能把 Sophie $17,000 生效日改為 2026-10-01（更新列數 %）', moved;
  end if;

  select id into v_run
  from public.payroll_runs
  where month_key = '2026-10'
    and status = '財務審閱中';

  if v_run is null then
    raise exception '找不到財務審閱中的 2026-10 計糧';
  end if;

  update public.payroll_runs
     set snapshot = jsonb_set(
           snapshot,
           '{teachers}',
           (
             select jsonb_agg(
               case
                 when elem->>'name' = 'Sophie Yu'
                  and (elem->>'gross')::numeric = 16000 then
                   elem
                   || jsonb_build_object(
                        'gross', 17000,
                        'net', 16150,
                        'employeeMpf', 850,
                        'employerMpf', 850,
                        'lines', (
                          select jsonb_agg(
                            case
                              when line->>'label' = '固定月薪'
                                then jsonb_set(line, '{amount}', '17000'::jsonb)
                              else line
                            end
                          )
                          from jsonb_array_elements(elem->'lines') line
                        ),
                        'salaryEvidence',
                        coalesce(elem->'salaryEvidence', '{}'::jsonb)
                          || jsonb_build_object('amount', 17000)
                      )
                 else elem
               end
             )
             from jsonb_array_elements(snapshot->'teachers') elem
           )
         ),
         updated_at = now()
   where id = v_run;

  if not exists (
    select 1
    from public.payroll_runs r
    cross join lateral jsonb_array_elements(r.snapshot->'teachers') elem
    where r.id = v_run
      and elem->>'name' = 'Sophie Yu'
      and (elem->>'gross')::numeric = 17000
      and (elem->>'net')::numeric = 16150
      and (elem->>'employeeMpf')::numeric = 850
      and (elem->>'employerMpf')::numeric = 850
  ) then
    raise exception '2026-10 計糧 snapshot 未能改成 Sophie 月薪 $17,000';
  end if;
end $$;

commit;
