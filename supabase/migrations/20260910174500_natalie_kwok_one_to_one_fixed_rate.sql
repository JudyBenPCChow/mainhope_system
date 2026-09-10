-- Natalie Kwok 私人課程一對一：兼職 HC 仍用於專科班；一對一改固定 $350／節。
-- 見 docs/policies/staffing/PAYROLL_GUIDE.md §7.5。

begin;

comment on column public.payroll_rates.config is
  '分成制: personal_pct, commission_pct, commission_subject_codes[]; '
  '固定月薪: monthly_salary; '
  '兼職/特別 HC: junior{base,per_extra}, senior{base,per_extra}, one_to_one_hc, one_to_two_hc; '
  '可選 one_to_one / one_to_two 固定價（覆寫等效人頭，例 Natalie 一對一 $350）; '
  '獨立定價: group_per_hc | group_pct, one_to_one, one_to_two; '
  'WFH: hourly_rate; '
  '可選 streams[] 覆寫多模式。';

update public.payroll_rates r
   set config = coalesce(r.config, '{}'::jsonb) || jsonb_build_object('one_to_one', 350),
       notes = '兼職 HC；私人課程一對一固定 $350／節（PAYROLL_GUIDE §7.5）'
 where r.teacher_id = (
        select t.id from public.teachers t
         where t.full_name = 'Natalie Kwok'
         limit 1
      )
   and r.mode = '兼職 HC'
   and (r.effective_to is null or r.effective_to >= date '2026-03-01')
   and coalesce((r.config ->> 'one_to_one')::numeric, 0) <> 350;

commit;
