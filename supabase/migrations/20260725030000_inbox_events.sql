-- 收件匣：營運事件（排程／班別變動等）＋已讀狀態
-- 增退讀／請假／點名提醒由前端聚合既有資料，不強制雙寫。

create table if not exists public.inbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  title text not null,
  body text,
  action_path text,
  class_id uuid references public.classes (id) on delete set null,
  schedule_id uuid references public.schedules (id) on delete set null,
  student_id uuid references public.students (id) on delete set null,
  audience_teacher_ids uuid[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint inbox_events_event_type_check check (
    event_type in (
      'schedule_created',
      'schedule_updated',
      'schedule_cancelled',
      'schedule_substitute',
      'class_updated',
      'class_teacher_changed',
      'leave_created'
    )
  )
);

create index if not exists inbox_events_created_at_idx
  on public.inbox_events (created_at desc);

create index if not exists inbox_events_audience_teacher_ids_gin
  on public.inbox_events using gin (audience_teacher_ids);

create index if not exists inbox_events_class_id_idx
  on public.inbox_events (class_id);

create index if not exists inbox_events_event_type_idx
  on public.inbox_events (event_type);

comment on table public.inbox_events is
  '收件匣營運事件：排程／班別等寫入時點事件；老師依 audience_teacher_ids 或班別主責可見';

create table if not exists public.inbox_reads (
  id uuid primary key default gen_random_uuid(),
  actor_key text not null,
  source_key text not null,
  event_id uuid references public.inbox_events (id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint inbox_reads_actor_source_unique unique (actor_key, source_key)
);

create index if not exists inbox_reads_actor_key_idx
  on public.inbox_reads (actor_key);

comment on table public.inbox_reads is
  '收件匣已讀：source_key 統一鍵（event:uuid／enrollment:uuid／leave:uuid／rollcall:scheduleId）';

comment on column public.inbox_reads.actor_key is
  '前端穩定身分：teacher:{teacher_id} 或 staff:{role}:{display_name}';

alter table public.inbox_events enable row level security;
alter table public.inbox_reads enable row level security;

drop policy if exists rls_mgmt_all_inbox_events on public.inbox_events;
create policy rls_mgmt_all_inbox_events
on public.inbox_events
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_inbox_events on public.inbox_events;
create policy rls_teacher_select_inbox_events
on public.inbox_events
for select
to authenticated
using (
  public.is_teacher_role()
  and (
    public.current_teacher_id() = any (audience_teacher_ids)
    or (
      class_id is not null
      and public.teacher_can_access_class(class_id)
    )
  )
);

drop policy if exists rls_mgmt_all_inbox_reads on public.inbox_reads;
create policy rls_mgmt_all_inbox_reads
on public.inbox_reads
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_all_inbox_reads on public.inbox_reads;
create policy rls_teacher_all_inbox_reads
on public.inbox_reads
for all
to authenticated
using (public.is_teacher_role())
with check (public.is_teacher_role());

grant select, insert, update, delete on public.inbox_events to authenticated;
grant select, insert, update, delete on public.inbox_reads to authenticated;
