-- 功輔學生每日紀錄：當日列、持續項目、常設指示、附件 Storage。
-- 套用：npm run db:apply -- supabase/migrations/20260926223300_homework_student_day_logs.sql

begin;

-- ---------------------------------------------------------------------------
-- Staff access: mgmt (admin/manager/alien) or homework tutoring teachers.
-- Finance is intentionally excluded (is_mgmt_staff does not include finance).
-- ---------------------------------------------------------------------------
create or replace function public.can_access_homework_day_logs()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_mgmt_staff()
    or public.teacher_has_homework_tutoring_nav();
$$;

revoke all on function public.can_access_homework_day_logs() from public;
revoke all on function public.can_access_homework_day_logs() from anon;
grant execute on function public.can_access_homework_day_logs() to authenticated;

comment on function public.can_access_homework_day_logs() is
  '功輔每日紀錄：行政／管理層／外星人，或 homework_tutoring_nav 老師。財務不可。';

-- ---------------------------------------------------------------------------
-- Day logs（家長可見欄在本表；staff_only_note 另表，Portal 無政策）
-- ---------------------------------------------------------------------------
create table if not exists public.homework_student_day_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  log_date date not null,
  teacher_id uuid references public.teachers (id) on delete set null,
  arrived_at timestamptz,
  left_at timestamptz,
  full_two_hours boolean,
  hours_note text,
  homework_done boolean,
  homework_owed text,
  has_dictation boolean,
  revision_note text,
  handbook_status text
    check (
      handbook_status is null
      or handbook_status in ('has_photo', 'no_handbook', 'no_homework')
    ),
  parent_note text,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_student_day_logs_student_date_uq unique (student_id, log_date)
);

create index if not exists homework_student_day_logs_date_idx
  on public.homework_student_day_logs (log_date);

create index if not exists homework_student_day_logs_student_idx
  on public.homework_student_day_logs (student_id, log_date desc);

comment on table public.homework_student_day_logs is
  '功輔學生當日紀錄（家長可見欄）。唯一鍵 (student_id, log_date)。';

create table if not exists public.homework_student_day_log_staff_notes (
  log_id uuid primary key
    references public.homework_student_day_logs (id) on delete cascade,
  staff_only_note text,
  updated_at timestamptz not null default now()
);

comment on table public.homework_student_day_log_staff_notes is
  '功輔當日紀錄僅職員備註；Portal 無 SELECT。';

-- ---------------------------------------------------------------------------
-- Follow-ups（持續欠功課／默測）
-- ---------------------------------------------------------------------------
create table if not exists public.homework_student_followups (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  kind text not null check (kind in ('homework', 'dictation')),
  body text not null,
  ends_on date not null,
  completed_at timestamptz,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_student_followups_body_chk
    check (length(btrim(body)) > 0)
);

create index if not exists homework_student_followups_active_idx
  on public.homework_student_followups (student_id, ends_on)
  where completed_at is null;

comment on table public.homework_student_followups is
  '功輔持續欠項／默測；ends_on 必填；完成或過期後不再掛名冊。';

-- ---------------------------------------------------------------------------
-- Standing instructions（學生級常設指示）
-- ---------------------------------------------------------------------------
create table if not exists public.homework_student_profiles (
  student_id uuid primary key references public.students (id) on delete cascade,
  standing_instructions text,
  updated_by uuid references public.app_users (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.homework_student_profiles is
  '功輔學生常設指示（家長與職員可見；僅職員可寫）。';

-- ---------------------------------------------------------------------------
-- Attachments metadata + Storage
-- ---------------------------------------------------------------------------
create table if not exists public.homework_student_day_log_attachments (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null
    references public.homework_student_day_logs (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  log_date date not null,
  kind text not null check (kind in ('handbook', 'dictation', 'other')),
  storage_path text not null,
  file_name text not null,
  byte_size bigint not null check (byte_size > 0),
  content_type text,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint homework_student_day_log_attachments_path_uq unique (storage_path),
  constraint homework_student_day_log_attachments_name_chk
    check (length(btrim(file_name)) > 0 and length(btrim(storage_path)) > 0)
);

create index if not exists homework_student_day_log_attachments_log_idx
  on public.homework_student_day_log_attachments (log_id, created_at);

comment on table public.homework_student_day_log_attachments is
  '功輔當日附件元資料；檔在 bucket homework-day-log-attachments。每生日誌最多 10 張由應用層強制。';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homework-day-log-attachments',
  'homework-day-log-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_access_homework_day_log_attachment(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = public, storage, private
as $$
  select exists (
    select 1
    from public.homework_student_day_log_attachments a
    where a.storage_path = object_name
      and (
        public.can_access_homework_day_logs()
        or (
          public.is_portal()
          and a.student_id = public.current_portal_student_id()
        )
      )
  );
$$;

comment on function private.can_access_homework_day_log_attachment(text) is
  '功輔日誌附件：職員或對應學生 Portal 可讀；寫入另檢 can_access_homework_day_logs。';

grant execute on function private.can_access_homework_day_log_attachment(text) to authenticated;

drop policy if exists homework_day_log_attachments_select on storage.objects;
create policy homework_day_log_attachments_select
on storage.objects for select to authenticated
using (
  bucket_id = 'homework-day-log-attachments'
  and private.can_access_homework_day_log_attachment(name)
);

drop policy if exists homework_day_log_attachments_insert on storage.objects;
create policy homework_day_log_attachments_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'homework-day-log-attachments'
  and public.can_access_homework_day_logs()
);

drop policy if exists homework_day_log_attachments_delete on storage.objects;
create policy homework_day_log_attachments_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'homework-day-log-attachments'
  and public.can_access_homework_day_logs()
);

-- ---------------------------------------------------------------------------
-- RLS: day logs
-- ---------------------------------------------------------------------------
alter table public.homework_student_day_logs enable row level security;

drop policy if exists homework_student_day_logs_staff_select
  on public.homework_student_day_logs;
create policy homework_student_day_logs_staff_select
on public.homework_student_day_logs for select to authenticated
using (
  public.can_access_homework_day_logs()
  or (
    public.is_portal()
    and student_id = public.current_portal_student_id()
  )
);

drop policy if exists homework_student_day_logs_staff_insert
  on public.homework_student_day_logs;
create policy homework_student_day_logs_staff_insert
on public.homework_student_day_logs for insert to authenticated
with check (public.can_access_homework_day_logs());

drop policy if exists homework_student_day_logs_staff_update
  on public.homework_student_day_logs;
create policy homework_student_day_logs_staff_update
on public.homework_student_day_logs for update to authenticated
using (public.can_access_homework_day_logs())
with check (public.can_access_homework_day_logs());

drop policy if exists homework_student_day_logs_staff_delete
  on public.homework_student_day_logs;
create policy homework_student_day_logs_staff_delete
on public.homework_student_day_logs for delete to authenticated
using (public.is_mgmt_staff());

-- ---------------------------------------------------------------------------
-- RLS: staff notes（無 Portal）
-- ---------------------------------------------------------------------------
alter table public.homework_student_day_log_staff_notes enable row level security;

drop policy if exists homework_day_log_staff_notes_select
  on public.homework_student_day_log_staff_notes;
create policy homework_day_log_staff_notes_select
on public.homework_student_day_log_staff_notes for select to authenticated
using (public.can_access_homework_day_logs());

drop policy if exists homework_day_log_staff_notes_write
  on public.homework_student_day_log_staff_notes;
create policy homework_day_log_staff_notes_write
on public.homework_student_day_log_staff_notes for all to authenticated
using (public.can_access_homework_day_logs())
with check (public.can_access_homework_day_logs());

-- ---------------------------------------------------------------------------
-- RLS: followups
-- ---------------------------------------------------------------------------
alter table public.homework_student_followups enable row level security;

drop policy if exists homework_student_followups_select
  on public.homework_student_followups;
create policy homework_student_followups_select
on public.homework_student_followups for select to authenticated
using (
  public.can_access_homework_day_logs()
  or (
    public.is_portal()
    and student_id = public.current_portal_student_id()
  )
);

drop policy if exists homework_student_followups_insert
  on public.homework_student_followups;
create policy homework_student_followups_insert
on public.homework_student_followups for insert to authenticated
with check (public.can_access_homework_day_logs());

drop policy if exists homework_student_followups_update
  on public.homework_student_followups;
create policy homework_student_followups_update
on public.homework_student_followups for update to authenticated
using (public.can_access_homework_day_logs())
with check (public.can_access_homework_day_logs());

drop policy if exists homework_student_followups_delete
  on public.homework_student_followups;
create policy homework_student_followups_delete
on public.homework_student_followups for delete to authenticated
using (public.is_mgmt_staff());

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------
alter table public.homework_student_profiles enable row level security;

drop policy if exists homework_student_profiles_select
  on public.homework_student_profiles;
create policy homework_student_profiles_select
on public.homework_student_profiles for select to authenticated
using (
  public.can_access_homework_day_logs()
  or (
    public.is_portal()
    and student_id = public.current_portal_student_id()
  )
);

drop policy if exists homework_student_profiles_write
  on public.homework_student_profiles;
create policy homework_student_profiles_write
on public.homework_student_profiles for all to authenticated
using (public.can_access_homework_day_logs())
with check (public.can_access_homework_day_logs());

-- ---------------------------------------------------------------------------
-- RLS: attachment rows
-- ---------------------------------------------------------------------------
alter table public.homework_student_day_log_attachments enable row level security;

drop policy if exists homework_day_log_attachments_row_select
  on public.homework_student_day_log_attachments;
create policy homework_day_log_attachments_row_select
on public.homework_student_day_log_attachments for select to authenticated
using (
  public.can_access_homework_day_logs()
  or (
    public.is_portal()
    and student_id = public.current_portal_student_id()
  )
);

drop policy if exists homework_day_log_attachments_row_insert
  on public.homework_student_day_log_attachments;
create policy homework_day_log_attachments_row_insert
on public.homework_student_day_log_attachments for insert to authenticated
with check (public.can_access_homework_day_logs());

drop policy if exists homework_day_log_attachments_row_delete
  on public.homework_student_day_log_attachments;
create policy homework_day_log_attachments_row_delete
on public.homework_student_day_log_attachments for delete to authenticated
using (public.can_access_homework_day_logs());

commit;
