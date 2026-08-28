-- 功課輔導班正式產品：class_kind=homework、報讀日數檔、月費應收、報更／月工作表。
-- 唔另建報讀主表；沿用 student_class_enrollments。佔室寫入 schedules 另波。

begin;

-- ---------------------------------------------------------------------------
-- 1) classes.class_kind 加 homework
-- ---------------------------------------------------------------------------
alter table public.classes drop constraint if exists classes_class_kind_check;
alter table public.classes
  add constraint classes_class_kind_check
  check (class_kind = any (array['group'::text, 'private'::text, 'homework'::text]));

comment on column public.classes.class_kind is
  '班別類型：group=專科班；private=私人課程；homework=功課輔導班';

-- ---------------------------------------------------------------------------
-- 2) 報讀：日數檔＋慣常到校星期（僅功輔使用）
-- ---------------------------------------------------------------------------
alter table public.student_class_enrollments
  add column if not exists homework_day_plan text,
  add column if not exists homework_weekdays text[];

alter table public.student_class_enrollments
  drop constraint if exists student_class_enrollments_homework_day_plan_check;

alter table public.student_class_enrollments
  add constraint student_class_enrollments_homework_day_plan_check
  check (
    homework_day_plan is null
    or homework_day_plan = any (array['三日'::text, '四日'::text, '五日'::text, '七日'::text])
  );

comment on column public.student_class_enrollments.homework_day_plan is
  '功輔每週日數檔（三日／四日／五日／七日）；非功輔班為 null';
comment on column public.student_class_enrollments.homework_weekdays is
  '功輔慣常到校星期（一–五字元陣列）；作紀錄用，不扣堂';

-- ---------------------------------------------------------------------------
-- 3) Seed：混級功輔課程模板＋2627 一班（預設 17D）
-- ---------------------------------------------------------------------------
-- 混級一班：課程模板沿用 S1 碼位（grade_code check 只允 P/S）；班名／報讀唔跟單一學生年級。
insert into public.courses (
  subject_id, grade_code, course_seq, course_code_base, course_name, course_mode
)
select
  'eeb155be-f117-43ff-b5db-60e8aba86286'::uuid,
  'S1',
  99,
  'HWKS1099',
  '常規功課輔導班',
  'regular'
where not exists (
  select 1 from public.courses where course_code_base = 'HWKS1099'
);

insert into public.classes (
  subject,
  class_kind,
  course_id,
  academic_year_id,
  academic_year_label,
  section_code,
  course_code_full,
  classroom_id,
  day_of_week,
  time_slot,
  lesson_slots_per_session,
  capacity,
  start_date,
  end_date,
  status
)
select
  '功課輔導',
  'homework',
  c.id,
  '978d2726-efdd-48db-aae7-3598c463e5d8'::uuid,
  '2627',
  'A',
  '2627-HWKS1099-A',
  '9eb454d5-f7d4-41a0-8d00-c943d46a5dcf'::uuid,
  '一至五',
  '15:30-19:30',
  1,
  40,
  date '2026-09-01',
  date '2027-06-30',
  '進行中'
from public.courses c
where c.course_code_base = 'HWKS1099'
  and not exists (
    select 1 from public.classes cl
    where cl.course_code_full = '2627-HWKS1099-A'
       or (cl.class_kind = 'homework' and cl.academic_year_label = '2627')
  );

-- ---------------------------------------------------------------------------
-- 4) 月費應收（flat；唔用專科 lesson-count monthly_tuition_charges）
-- ---------------------------------------------------------------------------
create table if not exists public.homework_tutoring_monthly_charges (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  class_id uuid not null references public.classes (id) on delete restrict,
  enrollment_id uuid not null references public.student_class_enrollments (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete restrict,
  billing_month date not null,
  day_plan text not null,
  grade_label text not null,
  amount_hkd numeric(10, 2) not null check (amount_hkd >= 0),
  is_quarter_rate boolean not null default false,
  status text not null default '未收款'
    check (status = any (array['未收款'::text, '已收款'::text, '作廢'::text])),
  payment_id uuid references public.payments (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_tutoring_monthly_charges_month_chk
    check (billing_month = date_trunc('month', billing_month)::date),
  constraint homework_tutoring_monthly_charges_day_plan_chk
    check (day_plan = any (array['三日'::text, '四日'::text, '五日'::text, '七日'::text])),
  constraint homework_tutoring_monthly_charges_unique
    unique (enrollment_id, billing_month)
);

create index if not exists homework_tutoring_monthly_charges_month_idx
  on public.homework_tutoring_monthly_charges (billing_month, status);
create index if not exists homework_tutoring_monthly_charges_student_idx
  on public.homework_tutoring_monthly_charges (student_id);

comment on table public.homework_tutoring_monthly_charges is
  '功課輔導班月費應收（按日數檔×年級；12／2 月四分三）。唔用專科堂數計費表。';

alter table public.homework_tutoring_monthly_charges enable row level security;

drop policy if exists rls_cap_select_homework_tutoring_monthly_charges
  on public.homework_tutoring_monthly_charges;
drop policy if exists rls_cap_write_homework_tutoring_monthly_charges
  on public.homework_tutoring_monthly_charges;

create policy rls_cap_select_homework_tutoring_monthly_charges
on public.homework_tutoring_monthly_charges for select to authenticated
using (
  private.has_capability('payments.read')
  or private.has_capability('classes.read')
  or public.is_mgmt_staff()
);

create policy rls_cap_write_homework_tutoring_monthly_charges
on public.homework_tutoring_monthly_charges for all to authenticated
using (
  private.has_capability('payments.write')
  or private.has_capability('students.enroll')
)
with check (
  private.has_capability('payments.write')
  or private.has_capability('students.enroll')
);

grant select, insert, update, delete
  on public.homework_tutoring_monthly_charges
  to authenticated;

-- ---------------------------------------------------------------------------
-- 5) 老師報更（按目標月；entries jsonb）
-- ---------------------------------------------------------------------------
create table if not exists public.homework_tutoring_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  target_month date not null,
  status text not null default '未交'
    check (status = any (array['未交'::text, '草稿'::text, '已提交'::text])),
  entries jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_tutoring_availability_month_chk
    check (target_month = date_trunc('month', target_month)::date),
  constraint homework_tutoring_availability_unique
    unique (teacher_id, target_month)
);

create index if not exists homework_tutoring_availability_month_idx
  on public.homework_tutoring_availability (target_month, status);

comment on table public.homework_tutoring_availability is
  '功輔老師報更：target_month＝報更目標月；entries 鍵為 M/D，值為 {kind:full|custom,start?,end?}';
comment on column public.homework_tutoring_availability.entries is
  '例：{"10/2":{"kind":"full"},"10/3":{"kind":"custom","start":"15:30","end":"17:00"}}';

alter table public.homework_tutoring_availability enable row level security;

drop policy if exists rls_cap_select_homework_tutoring_availability
  on public.homework_tutoring_availability;
drop policy if exists rls_cap_write_homework_tutoring_availability
  on public.homework_tutoring_availability;

create policy rls_cap_select_homework_tutoring_availability
on public.homework_tutoring_availability for select to authenticated
using (
  private.has_capability('classes.read')
  or private.has_capability('schedule.read')
  or public.is_mgmt_staff()
  or (public.is_teacher_role() and teacher_id = public.current_teacher_id())
);

create policy rls_cap_write_homework_tutoring_availability
on public.homework_tutoring_availability for all to authenticated
using (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
  or (public.is_teacher_role() and teacher_id = public.current_teacher_id())
)
with check (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
  or (public.is_teacher_role() and teacher_id = public.current_teacher_id())
);

grant select, insert, update, delete
  on public.homework_tutoring_availability
  to authenticated;

-- ---------------------------------------------------------------------------
-- 6) 月工作表＋當值日
-- ---------------------------------------------------------------------------
create table if not exists public.homework_tutoring_roster_months (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  class_id uuid not null references public.classes (id) on delete restrict,
  roster_month date not null,
  status text not null default '未編更'
    check (status = any (array['未編更'::text, '已編更'::text])),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_tutoring_roster_months_month_chk
    check (roster_month = date_trunc('month', roster_month)::date),
  constraint homework_tutoring_roster_months_unique
    unique (class_id, roster_month)
);

create table if not exists public.homework_tutoring_duty_days (
  id uuid primary key default gen_random_uuid(),
  roster_month_id uuid not null
    references public.homework_tutoring_roster_months (id) on delete cascade,
  duty_date date not null,
  session_start time not null default time '15:30',
  session_end time not null default time '19:30',
  holiday_label text,
  secondary_room text,
  primary_room text,
  secondary_teacher_id uuid references public.teachers (id) on delete set null,
  primary_teacher_id uuid references public.teachers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_tutoring_duty_days_unique unique (roster_month_id, duty_date),
  constraint homework_tutoring_duty_days_time_chk check (session_end > session_start)
);

create index if not exists homework_tutoring_duty_days_date_idx
  on public.homework_tutoring_duty_days (duty_date);

comment on table public.homework_tutoring_roster_months is
  '功輔月工作表狀態；已編更＝老師該月報更鎖定';
comment on table public.homework_tutoring_duty_days is
  '功輔當值日（中／小學部導師＋課室）；放假日可只填 holiday_label';

alter table public.homework_tutoring_roster_months enable row level security;
alter table public.homework_tutoring_duty_days enable row level security;

drop policy if exists rls_cap_select_homework_tutoring_roster_months
  on public.homework_tutoring_roster_months;
drop policy if exists rls_cap_write_homework_tutoring_roster_months
  on public.homework_tutoring_roster_months;
drop policy if exists rls_cap_select_homework_tutoring_duty_days
  on public.homework_tutoring_duty_days;
drop policy if exists rls_cap_write_homework_tutoring_duty_days
  on public.homework_tutoring_duty_days;

create policy rls_cap_select_homework_tutoring_roster_months
on public.homework_tutoring_roster_months for select to authenticated
using (
  private.has_capability('classes.read')
  or private.has_capability('schedule.read')
  or public.is_mgmt_staff()
  or public.is_teacher_role()
);

create policy rls_cap_write_homework_tutoring_roster_months
on public.homework_tutoring_roster_months for all to authenticated
using (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
)
with check (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
);

create policy rls_cap_select_homework_tutoring_duty_days
on public.homework_tutoring_duty_days for select to authenticated
using (
  private.has_capability('classes.read')
  or private.has_capability('schedule.read')
  or public.is_mgmt_staff()
  or public.is_teacher_role()
);

create policy rls_cap_write_homework_tutoring_duty_days
on public.homework_tutoring_duty_days for all to authenticated
using (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
)
with check (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
);

grant select, insert, update, delete
  on public.homework_tutoring_roster_months
  to authenticated;
grant select, insert, update, delete
  on public.homework_tutoring_duty_days
  to authenticated;

commit;
