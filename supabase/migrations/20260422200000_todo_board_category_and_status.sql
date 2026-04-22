-- 待辦事項改版：加入分類，並擴充狀態集合

alter table public.calendar_events
  add column if not exists category text not null default '一般';

alter table public.calendar_events
  drop constraint if exists calendar_events_status_check;

alter table public.calendar_events
  add constraint calendar_events_status_check
  check (status in ('todo', 'in_progress', 'done', 'cancelled'));

update public.calendar_events
set status = 'todo'
where status = 'planned';
