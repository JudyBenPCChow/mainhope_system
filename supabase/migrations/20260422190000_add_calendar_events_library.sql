-- 行政行事曆資料庫（與 schedules 分離）
-- 事件主表 + 老師/同事/學生關聯表

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  start_time text,
  end_time text,
  all_day boolean not null default false,
  status text not null default 'planned',
  visibility text not null default 'private',
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_status_check check (status in ('planned', 'done', 'cancelled')),
  constraint calendar_events_visibility_check check (visibility in ('private', 'teachers'))
);

create index if not exists calendar_events_event_date_idx on public.calendar_events (event_date);
create index if not exists calendar_events_status_idx on public.calendar_events (status);

create table if not exists public.calendar_event_teachers (
  event_id uuid not null references public.calendar_events (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, teacher_id)
);

create table if not exists public.calendar_event_users (
  event_id uuid not null references public.calendar_events (id) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.calendar_event_students (
  event_id uuid not null references public.calendar_events (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, student_id)
);

create index if not exists calendar_event_teachers_teacher_id_idx on public.calendar_event_teachers (teacher_id);
create index if not exists calendar_event_users_user_id_idx on public.calendar_event_users (user_id);
create index if not exists calendar_event_students_student_id_idx on public.calendar_event_students (student_id);

alter table public.calendar_events enable row level security;
alter table public.calendar_event_teachers enable row level security;
alter table public.calendar_event_users enable row level security;
alter table public.calendar_event_students enable row level security;

drop policy if exists dev_anon_all_calendar_events on public.calendar_events;
drop policy if exists dev_auth_all_calendar_events on public.calendar_events;
drop policy if exists dev_anon_all_calendar_event_teachers on public.calendar_event_teachers;
drop policy if exists dev_auth_all_calendar_event_teachers on public.calendar_event_teachers;
drop policy if exists dev_anon_all_calendar_event_users on public.calendar_event_users;
drop policy if exists dev_auth_all_calendar_event_users on public.calendar_event_users;
drop policy if exists dev_anon_all_calendar_event_students on public.calendar_event_students;
drop policy if exists dev_auth_all_calendar_event_students on public.calendar_event_students;

create policy dev_anon_all_calendar_events
on public.calendar_events
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_calendar_events
on public.calendar_events
for all
to authenticated
using (true)
with check (true);

create policy dev_anon_all_calendar_event_teachers
on public.calendar_event_teachers
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_calendar_event_teachers
on public.calendar_event_teachers
for all
to authenticated
using (true)
with check (true);

create policy dev_anon_all_calendar_event_users
on public.calendar_event_users
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_calendar_event_users
on public.calendar_event_users
for all
to authenticated
using (true)
with check (true);

create policy dev_anon_all_calendar_event_students
on public.calendar_event_students
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_calendar_event_students
on public.calendar_event_students
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.calendar_events to anon, authenticated;
grant select, insert, update, delete on table public.calendar_event_teachers to anon, authenticated;
grant select, insert, update, delete on table public.calendar_event_users to anon, authenticated;
grant select, insert, update, delete on table public.calendar_event_students to anon, authenticated;
