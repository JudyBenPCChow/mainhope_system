-- 功輔計糧：時薪名單＋財務工時修正。計算在前端／service。
-- 套用：npm run db:apply -- supabase/migrations/20260831234500_homework_tutoring_payroll.sql

begin;

create table if not exists public.payroll_homework_rates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  hourly_rate numeric(10, 2) not null check (hourly_rate > 0),
  effective_from date not null,
  effective_to date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_homework_rates_range_chk
    check (effective_to is null or effective_to >= effective_from),
  constraint payroll_homework_rates_teacher_from_unique unique (teacher_id, effective_from)
);

create index if not exists payroll_homework_rates_teacher_from_idx
  on public.payroll_homework_rates (teacher_id, effective_from desc);

comment on table public.payroll_homework_rates is
  '功輔時薪；與 payroll_rates 專科模式分開。Katie Lee 無列＝唔用時薪。';

create table if not exists public.payroll_homework_hour_overrides (
  id uuid primary key default gen_random_uuid(),
  month_key text not null
    check (month_key ~ '^\d{4}-\d{2}$'),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  hours numeric(10, 2) not null check (hours >= 0),
  note text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_homework_hour_overrides_month_teacher_unique unique (month_key, teacher_id)
);

comment on table public.payroll_homework_hour_overrides is
  '財務喺計糧時修正功輔工時；無列則跟已發布編更。';

alter table public.payroll_homework_rates enable row level security;
alter table public.payroll_homework_hour_overrides enable row level security;

drop policy if exists rls_cap_select_payroll_homework_rates on public.payroll_homework_rates;
drop policy if exists rls_cap_write_payroll_homework_rates on public.payroll_homework_rates;
create policy rls_cap_select_payroll_homework_rates
on public.payroll_homework_rates for select to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff());
create policy rls_cap_write_payroll_homework_rates
on public.payroll_homework_rates for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

drop policy if exists rls_cap_select_payroll_homework_hour_overrides
  on public.payroll_homework_hour_overrides;
drop policy if exists rls_cap_write_payroll_homework_hour_overrides
  on public.payroll_homework_hour_overrides;
create policy rls_cap_select_payroll_homework_hour_overrides
on public.payroll_homework_hour_overrides for select to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff());
create policy rls_cap_write_payroll_homework_hour_overrides
on public.payroll_homework_hour_overrides for all to authenticated
using (
  private.has_capability('payroll.prepare')
  or private.has_capability('payroll.hours')
)
with check (
  private.has_capability('payroll.prepare')
  or private.has_capability('payroll.hours')
);

grant select, insert, update, delete on public.payroll_homework_rates to authenticated;
grant select, insert, update, delete on public.payroll_homework_hour_overrides to authenticated;

insert into public.payroll_homework_rates (teacher_id, hourly_rate, effective_from, notes)
select t.id, v.rate, date '2026-09-01', v.notes
from (
  values
    ('Jeffrey Lee', 70::numeric, '2627 功輔 $70'),
    ('Ken Tam', 70::numeric, '2627 功輔 $70'),
    ('Leo Chan', 70::numeric, '2627 功輔 $70'),
    ('Rain Kwok', 100::numeric, '2627 功輔 $100'),
    ('Annie Leung', 100::numeric, '2627 功輔 $100'),
    ('Erika Fok', 100::numeric, '2627 功輔 $100'),
    ('Wing Chan', 100::numeric, '2627 功輔 $100'),
    ('Liam Lai', 100::numeric, '2627 功輔 $100'),
    ('Christine Fan', 100::numeric, '2627 功輔 $100'),
    ('Kenneth Li', 100::numeric, '2627 功輔 $100'),
    ('Judy Chu', 110::numeric, '2627 功輔 $110'),
    ('Diana Kwok', 115::numeric, '2627 功輔 $115')
) as v(full_name, rate, notes)
join public.teachers t on t.full_name = v.full_name
where not exists (
  select 1
  from public.payroll_homework_rates r
  where r.teacher_id = t.id
    and r.effective_from = date '2026-09-01'
);

commit;
