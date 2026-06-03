-- 待辦：標籤、跟進紀錄、狀態收斂為 in_progress / done

create table if not exists public.calendar_event_tags (
  event_id uuid not null references public.calendar_events (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, tag),
  constraint calendar_event_tags_tag_nonempty check (char_length(trim(tag)) > 0)
);

create index if not exists calendar_event_tags_tag_idx on public.calendar_event_tags (tag);

create table if not exists public.calendar_event_updates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events (id) on delete cascade,
  body text not null,
  created_by_label text,
  created_at timestamptz not null default now(),
  constraint calendar_event_updates_body_nonempty check (char_length(trim(body)) > 0)
);

create index if not exists calendar_event_updates_event_id_created_at_idx
  on public.calendar_event_updates (event_id, created_at desc);

-- 狀態遷移
update public.calendar_events
set status = 'in_progress'
where status in ('todo', 'planned', 'in_progress');

update public.calendar_events
set status = 'done'
where status in ('done', 'cancelled');

-- 既有 description 寫入跟進紀錄
insert into public.calendar_event_updates (event_id, body, created_by_label, created_at)
select
  e.id,
  trim(e.description),
  '系統遷移',
  coalesce(e.updated_at, e.created_at)
from public.calendar_events e
where e.description is not null
  and char_length(trim(e.description)) > 0
  and not exists (
    select 1
    from public.calendar_event_updates u
    where u.event_id = e.id
      and u.body = trim(e.description)
  );

alter table public.calendar_events
  drop constraint if exists calendar_events_status_check;

alter table public.calendar_events
  add constraint calendar_events_status_check
  check (status in ('in_progress', 'done'));

alter table public.calendar_events
  alter column status set default 'in_progress';

alter table public.calendar_event_tags enable row level security;
alter table public.calendar_event_updates enable row level security;

drop policy if exists dev_anon_all_calendar_event_tags on public.calendar_event_tags;
drop policy if exists dev_auth_all_calendar_event_tags on public.calendar_event_tags;
drop policy if exists dev_anon_all_calendar_event_updates on public.calendar_event_updates;
drop policy if exists dev_auth_all_calendar_event_updates on public.calendar_event_updates;

create policy dev_anon_all_calendar_event_tags
on public.calendar_event_tags
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_calendar_event_tags
on public.calendar_event_tags
for all
to authenticated
using (true)
with check (true);

create policy dev_anon_all_calendar_event_updates
on public.calendar_event_updates
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_calendar_event_updates
on public.calendar_event_updates
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.calendar_event_tags to anon, authenticated;
grant select, insert, update, delete on table public.calendar_event_updates to anon, authenticated;
