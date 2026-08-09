-- Sophie Yu：行政人員入冊（teachers）＋固定月薪費率
-- 套用：npm run db:apply -- supabase/migrations/20260807094500_sophie_yu_payroll_enrollment.sql
--
-- 背景：計糧引擎 seed（20260804190000）已有 Sophie 費率邏輯，但當時 teachers 無此人故跳過。
-- 規則：固定月薪 $16,000（MPF 前）；計 MPF（見 PAYROLL_GUIDE §6／§13）。

begin;

do $$
declare
  v_from date := date '2026-03-01';
  tid uuid;
begin
  select id into tid
  from public.teachers
  where full_name = 'Sophie Yu'
     or lower(coalesce(english_name, '')) = lower('Sophie Yu')
  limit 1;

  if tid is null then
    insert into public.teachers (full_name, english_name, abbr, status, subject_speciality)
    values ('Sophie Yu', 'Sophie Yu', 'SOPH', '在職', '{}'::text[])
    returning id into tid;
  else
    update public.teachers
       set full_name = 'Sophie Yu',
           english_name = coalesce(english_name, 'Sophie Yu'),
           abbr = coalesce(nullif(trim(abbr), ''), 'SOPH'),
           status = '在職',
           updated_at = now()
     where id = tid;
  end if;

  -- 敏感備註（觸發器已建 private 列；有則補備註）
  update public.teachers_private
     set remarks = coalesce(nullif(trim(remarks), ''), '行政人員（非專科）；計糧固定月薪'),
         updated_at = now()
   where teacher_id = tid
     and (remarks is null or trim(remarks) = '');

  -- 固定月薪費率（若同日起點已有則略過）
  if not exists (
    select 1
    from public.payroll_rates
    where teacher_id = tid
      and mode = '固定月薪'
      and effective_from = v_from
  ) then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid,
      '固定月薪',
      v_from,
      jsonb_build_object('monthly_salary', 16000, 'mpf', true),
      'Sophie 固定月薪（行政人員）'
    );
  end if;
end $$;

commit;
