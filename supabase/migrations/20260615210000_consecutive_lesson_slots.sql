-- 連堂：班別每次上課可占連續 2 格（75 分鐘 × 2），計 2 節學費、2 個堂次

alter table public.classes
  add column if not exists lesson_slots_per_session smallint not null default 1;

alter table public.classes drop constraint if exists classes_lesson_slots_per_session_check;
alter table public.classes add constraint classes_lesson_slots_per_session_check
  check (lesson_slots_per_session in (1, 2));

comment on column public.classes.lesson_slots_per_session is
  '每次上課占用時間格數：1=單堂 75 分鐘；2=連堂（連續 2 格、計 2 節）';

alter table public.schedules
  add column if not exists consecutive_group_id uuid;

alter table public.schedules
  add column if not exists consecutive_slot_index smallint;

alter table public.schedules drop constraint if exists schedules_consecutive_slot_index_check;
alter table public.schedules add constraint schedules_consecutive_slot_index_check
  check (
    (consecutive_group_id is null and consecutive_slot_index is null)
    or (consecutive_group_id is not null and consecutive_slot_index in (1, 2))
  );

create index if not exists schedules_consecutive_group_id_idx
  on public.schedules (consecutive_group_id)
  where consecutive_group_id is not null;

comment on column public.schedules.consecutive_group_id is
  '連堂配對：同一上課日兩筆排程共用';
comment on column public.schedules.consecutive_slot_index is
  '連堂配對中的第幾格（1 或 2）';

alter table public.attendance_details
  add column if not exists schedule_id uuid references public.schedules (id) on delete set null;

create index if not exists attendance_details_schedule_id_idx
  on public.attendance_details (schedule_id)
  where schedule_id is not null;

create unique index if not exists attendance_details_student_schedule_unique
  on public.attendance_details (student_id, schedule_id)
  where schedule_id is not null;

create unique index if not exists attendance_details_student_class_date_legacy_unique
  on public.attendance_details (student_id, class_id, attendance_date)
  where schedule_id is null;

comment on column public.attendance_details.schedule_id is
  '綁定排程；連堂每節一筆出席紀錄';
