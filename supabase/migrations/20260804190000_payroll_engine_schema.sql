-- 計糧引擎：費率、月結 run、人手工時、調整、逐人審核狀態
-- 套用：npm run db:apply -- supabase/migrations/20260804190000_payroll_engine_schema.sql
--
-- 計算本身在前端／service 純函式；已結算月份 freeze 至 payroll_runs.snapshot。
-- 本期不含功課班。

begin;

-- ---------------------------------------------------------------------------
-- 費率（每月 1 日生效；缺有效費率 → 硬阻擋）
-- ---------------------------------------------------------------------------

create table if not exists public.payroll_rates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  mode text not null
    check (mode in ('分成制', '固定月薪', '兼職 HC', '特別 HC', '獨立定價', 'WFH 時薪')),
  effective_from date not null,
  effective_to date,
  config jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_rates_effective_range_chk
    check (effective_to is null or effective_to >= effective_from)
);

create index if not exists payroll_rates_teacher_from_idx
  on public.payroll_rates (teacher_id, effective_from desc);

comment on table public.payroll_rates is
  '計糧費率；effective_from 建議為每月 1 日。config 依 mode 解讀（見 docs/plans/2026-08-01-payroll-method-revised.md）。';

comment on column public.payroll_rates.config is
  '分成制: personal_pct, commission_pct, commission_subject_codes[]; '
  '固定月薪: monthly_salary; '
  '兼職/特別 HC: junior{base,per_extra}, senior{base,per_extra}, one_to_one_hc, one_to_two_hc; '
  '獨立定價: group_per_hc | group_pct, one_to_one, one_to_two; '
  'WFH: hourly_rate; '
  '可選 streams[] 覆寫多模式。';

-- ---------------------------------------------------------------------------
-- 月結 run（草稿可重算；已結算 snapshot 唯讀）
-- ---------------------------------------------------------------------------

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  month_key text not null,
  status text not null default '財務審閱中'
    check (status in ('草稿', '財務審閱中', '待管理層核實', '已結算')),
  calc_version integer not null default 1,
  calc_at timestamptz,
  submitted_by text,
  submitted_at timestamptz,
  settled_by text,
  settled_at timestamptz,
  return_reason text,
  snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_runs_month_key_chk
    check (month_key ~ '^\d{4}-\d{2}$'),
  constraint payroll_runs_month_key_unique unique (month_key)
);

comment on table public.payroll_runs is
  '計糧月份狀態機。snapshot 於「已結算」時凍結逐人明細（jsonb）。';

comment on column public.payroll_runs.snapshot is
  '結算凍結：{ teachers: PayrollTeacherRow[], calcVersion, settledAt }';

-- ---------------------------------------------------------------------------
-- 逐人審核／送核／排除
-- ---------------------------------------------------------------------------

create table if not exists public.payroll_teacher_states (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payroll_runs (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  finance_reviewed boolean not null default false,
  excluded boolean not null default false,
  exclude_reason text,
  submit_status text not null default 'none'
    check (submit_status in ('none', 'submitted', 'accepted', 'returned')),
  submit_note text,
  manager_spot_checked boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint payroll_teacher_states_run_teacher_unique unique (run_id, teacher_id)
);

create index if not exists payroll_teacher_states_run_idx
  on public.payroll_teacher_states (run_id);

-- ---------------------------------------------------------------------------
-- Cody WFH 等人手工時
-- ---------------------------------------------------------------------------

create table if not exists public.payroll_manual_hours (
  id uuid primary key default gen_random_uuid(),
  month_key text not null
    check (month_key ~ '^\d{4}-\d{2}$'),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  hours numeric(10, 2) not null default 0
    check (hours >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected')),
  note text,
  submitted_by text,
  submitted_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_manual_hours_month_teacher_unique unique (month_key, teacher_id)
);

comment on table public.payroll_manual_hours is
  '人手申報工時（本期：Cody WFH）。approved 後才計入薪酬。';

-- ---------------------------------------------------------------------------
-- 人手調整（財務申請 → manager 核准）
-- ---------------------------------------------------------------------------

create table if not exists public.payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payroll_runs (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  from_amount numeric(12, 2) not null,
  to_amount numeric(12, 2) not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_by text not null,
  created_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz
);

create index if not exists payroll_adjustments_run_idx
  on public.payroll_adjustments (run_id);

-- ---------------------------------------------------------------------------
-- RLS：mgmt staff 可讀寫；教師本人不可見費率／糧單
-- ---------------------------------------------------------------------------

alter table public.payroll_rates enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_teacher_states enable row level security;
alter table public.payroll_manual_hours enable row level security;
alter table public.payroll_adjustments enable row level security;

drop policy if exists payroll_rates_mgmt_all on public.payroll_rates;
create policy payroll_rates_mgmt_all
  on public.payroll_rates
  for all
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

drop policy if exists payroll_runs_mgmt_all on public.payroll_runs;
create policy payroll_runs_mgmt_all
  on public.payroll_runs
  for all
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

drop policy if exists payroll_teacher_states_mgmt_all on public.payroll_teacher_states;
create policy payroll_teacher_states_mgmt_all
  on public.payroll_teacher_states
  for all
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

drop policy if exists payroll_manual_hours_mgmt_all on public.payroll_manual_hours;
create policy payroll_manual_hours_mgmt_all
  on public.payroll_manual_hours
  for all
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

drop policy if exists payroll_adjustments_mgmt_all on public.payroll_adjustments;
create policy payroll_adjustments_mgmt_all
  on public.payroll_adjustments
  for all
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

grant select, insert, update, delete on public.payroll_rates to authenticated;
grant select, insert, update, delete on public.payroll_runs to authenticated;
grant select, insert, update, delete on public.payroll_teacher_states to authenticated;
grant select, insert, update, delete on public.payroll_manual_hours to authenticated;
grant select, insert, update, delete on public.payroll_adjustments to authenticated;

-- ---------------------------------------------------------------------------
-- Seed 費率（按 teachers.full_name 對應；缺老師則跳過）
-- effective_from = 2026-03-01（營運慣例提前約三個月；涵蓋現行計糧月）
-- ---------------------------------------------------------------------------

do $$
declare
  v_from date := date '2026-03-01';
  tid uuid;
begin
  -- Mark Yu：分成制 MATH/M1/M2
  select id into tid from public.teachers where full_name = 'Mark Yu' limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '分成制', v_from,
      jsonb_build_object(
        'personal_pct', 0.6,
        'commission_pct', 0.1,
        'commission_subject_codes', jsonb_build_array('MATH', 'M1', 'M2'),
        'mpf', true
      ),
      'Mark：本人授課 60% + 他人 MATH/M1/M2 10%'
    )
    on conflict do nothing;
  end if;

  -- Christine Fan：分成制 CHI
  select id into tid from public.teachers where full_name = 'Christine Fan' limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '分成制', v_from,
      jsonb_build_object(
        'personal_pct', 0.6,
        'commission_pct', 0.1,
        'commission_subject_codes', jsonb_build_array('CHI'),
        'mpf', true
      ),
      'Christine：本人授課 60% + 他人 CHI 10%（功課班佣金本期暫緩）'
    )
    on conflict do nothing;
  end if;

  -- Sophie Yu：固定月薪
  select id into tid from public.teachers where full_name = 'Sophie Yu' limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '固定月薪', v_from,
      jsonb_build_object('monthly_salary', 16000, 'mpf', true),
      'Sophie 固定月薪'
    )
    on conflict do nothing;
  end if;

  -- Katie Lee：固定月薪
  select id into tid from public.teachers where full_name = 'Katie Lee' limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '固定月薪', v_from,
      jsonb_build_object('monthly_salary', 20000, 'mpf', true),
      'Katie 固定月薪'
    )
    on conflict do nothing;
  end if;

  -- Judy Chu：特別 HC
  select id into tid from public.teachers where full_name = 'Judy Chu' limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '特別 HC', v_from,
      jsonb_build_object(
        'junior', jsonb_build_object('base', 120, 'per_extra', 70),
        'senior', jsonb_build_object('base', 160, 'per_extra', 80),
        'one_to_one_hc', 3,
        'one_to_two_hc', 4
      ),
      'Judy 特別 HC 費率'
    )
    on conflict do nothing;
  end if;

  -- Jackson Lau（Sum）／Jackson Lau：獨立定價
  select id into tid from public.teachers
   where full_name in ('Jackson Lau（Sum）', 'Jackson Lau (Sum)', 'Jackson Lau')
   order by case full_name when 'Jackson Lau（Sum）' then 0 when 'Jackson Lau (Sum)' then 1 else 2 end
   limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '獨立定價', v_from,
      jsonb_build_object(
        'group_per_hc', 110,
        'one_to_one', 454,
        'one_to_two', 550
      ),
      'Sum 獨立定價'
    )
    on conflict do nothing;
  end if;

  -- Cyndi Ng：獨立定價（小組 50%）
  select id into tid from public.teachers where full_name = 'Cyndi Ng' limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '獨立定價', v_from,
      jsonb_build_object(
        'group_pct', 0.5,
        'one_to_one', 400,
        'one_to_two', 550
      ),
      'Cyndi：專科班已扣堂價值 50%；一對一／一對二固定價'
    )
    on conflict do nothing;
  end if;

  -- Cody Cheong：WFH 時薪（可能尚未入 teachers；有則 seed）
  select id into tid from public.teachers
   where full_name in ('Cody Cheong', 'Cody')
   limit 1;
  if tid is not null then
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, 'WFH 時薪', v_from,
      jsonb_build_object('hourly_rate', 60),
      'Cody WFH $60/hr；須已核准工時'
    )
    on conflict do nothing;
  end if;

  -- 其餘在職老師預設兼職 HC（一般初中／高中）；已有費率者跳過
  for tid in
    select t.id
      from public.teachers t
     where coalesce(t.status, '在職') = '在職'
       and not exists (
         select 1 from public.payroll_rates r where r.teacher_id = t.id
       )
  loop
    insert into public.payroll_rates (teacher_id, mode, effective_from, config, notes)
    values (
      tid, '兼職 HC', v_from,
      jsonb_build_object(
        'junior', jsonb_build_object('base', 120, 'per_extra', 60),
        'senior', jsonb_build_object('base', 150, 'per_extra', 70),
        'one_to_one_hc', 3,
        'one_to_two_hc', 4
      ),
      '預設兼職 HC（可於費率表覆寫）'
    );
  end loop;
end $$;

commit;
