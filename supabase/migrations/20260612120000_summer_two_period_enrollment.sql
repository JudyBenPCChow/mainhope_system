-- 暑期兩期報讀：學年期數字典、課程模式、報讀期數、差異計費

-- 1. 學年期數字典（僅 *SM 暑期學年使用）
create table if not exists public.academic_year_periods (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  period_code smallint not null check (period_code in (1, 2)),
  label text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_year_periods_date_check check (start_date <= end_date),
  constraint academic_year_periods_unique unique (academic_year_id, period_code)
);

create index if not exists academic_year_periods_year_id_idx
  on public.academic_year_periods (academic_year_id);

comment on table public.academic_year_periods is
  '暑期學年兩期日期字典。正規學年（2526 等）不使用此表。';

-- 2. 課程模式與三期價格
alter table public.courses
  add column if not exists course_mode text not null default 'regular';

alter table public.courses
  add column if not exists price_per_lesson_period_2 numeric;

alter table public.courses
  add column if not exists price_per_lesson_both_periods numeric;

alter table public.courses drop constraint if exists courses_course_mode_check;
alter table public.courses add constraint courses_course_mode_check
  check (course_mode in ('regular', 'summer_two_period'));

comment on column public.courses.course_mode is
  'regular=正規學年；summer_two_period=暑期兩期可選報';
comment on column public.courses.price_per_lesson is
  '單期（第一期）每堂單價；正規學年課程沿用此欄';
comment on column public.courses.price_per_lesson_period_2 is
  '暑期第二期每堂單價（summer_two_period）';
comment on column public.courses.price_per_lesson_both_periods is
  '暑期兩期全報每堂單價（summer_two_period）';

-- 3. 報讀期數
alter table public.student_class_enrollments
  add column if not exists enrollment_period text;

alter table public.student_class_enrollments drop constraint if exists student_class_enrollments_period_check;
alter table public.student_class_enrollments add constraint student_class_enrollments_period_check
  check (
    enrollment_period is null
    or enrollment_period in ('第一期', '第二期', '兩期全報')
  );

create unique index if not exists student_class_enrollments_student_class_unique_idx
  on public.student_class_enrollments (student_id, class_id);

comment on column public.student_class_enrollments.enrollment_period is
  '暑期兩期報讀：第一期／第二期／兩期全報；正規學年為 NULL';

-- 4. 增退紀錄加期數；允許 period_change 動作
alter table public.enrollment_change_events
  add column if not exists enrollment_period text;

alter table public.enrollment_change_events drop constraint if exists enrollment_change_events_action_check;
alter table public.enrollment_change_events add constraint enrollment_change_events_action_check
  check (action in ('enroll', 'withdraw', 'period_change'));

-- 5. Seed 各 *SM 學年兩期（7/1–7/15 第一期，7/16–學年結束 第二期）
insert into public.academic_year_periods (academic_year_id, period_code, label, start_date, end_date)
select
  ay.id,
  1,
  '第一期',
  ay.start_date,
  (ay.start_date + interval '14 days')::date
from public.academic_years ay
where ay.label ~ 'SM$'
on conflict (academic_year_id, period_code) do update
  set label = excluded.label,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      updated_at = now();

insert into public.academic_year_periods (academic_year_id, period_code, label, start_date, end_date)
select
  ay.id,
  2,
  '第二期',
  (ay.start_date + interval '15 days')::date,
  ay.end_date
from public.academic_years ay
where ay.label ~ 'SM$'
on conflict (academic_year_id, period_code) do update
  set label = excluded.label,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      updated_at = now();

-- 6. 既有暑期課程模板設為 summer_two_period
update public.courses co
set course_mode = 'summer_two_period',
    updated_at = now()
where co.id in (
  select distinct c.course_id
  from public.classes c
  join public.academic_years ay on ay.id = c.academic_year_id
  where c.course_id is not null
    and ay.label ~ 'SM$'
);

-- 7. 既有暑期報讀預設兩期全報
update public.student_class_enrollments sce
set enrollment_period = '兩期全報',
    updated_at = now()
from public.classes c
join public.courses co on co.id = c.course_id
where sce.class_id = c.id
  and co.course_mode = 'summer_two_period'
  and sce.enrollment_period is null;

-- 8. RLS / grants
alter table public.academic_year_periods enable row level security;

drop policy if exists dev_anon_all_academic_year_periods on public.academic_year_periods;
drop policy if exists dev_auth_all_academic_year_periods on public.academic_year_periods;
create policy dev_anon_all_academic_year_periods on public.academic_year_periods for all to anon using (true) with check (true);
create policy dev_auth_all_academic_year_periods on public.academic_year_periods for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.academic_year_periods to anon, authenticated;
