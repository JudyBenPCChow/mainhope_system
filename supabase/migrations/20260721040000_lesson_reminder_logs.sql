-- 前台「明日課堂提醒」：以學生 × 上課日記錄已提醒狀態

create table if not exists public.lesson_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  reminder_date date not null,
  reminded_at timestamptz not null default now(),
  reminded_by text,
  channel text not null default 'whatsapp',
  detail text,
  constraint lesson_reminder_logs_student_date_unique unique (student_id, reminder_date)
);

create index if not exists lesson_reminder_logs_reminder_date_idx
  on public.lesson_reminder_logs (reminder_date desc);

create index if not exists lesson_reminder_logs_student_id_idx
  on public.lesson_reminder_logs (student_id);

comment on table public.lesson_reminder_logs is
  '前台上課提醒紀錄：同一學生同一上課日最多一筆（已提醒）';

comment on column public.lesson_reminder_logs.reminder_date is
  '被提醒的上課日期（通常為翌日）';

comment on column public.lesson_reminder_logs.reminded_by is
  '操作者標籤（formatMgmtActorLabel）';

comment on column public.lesson_reminder_logs.channel is
  '提醒渠道：whatsapp／manual 等';

alter table public.lesson_reminder_logs enable row level security;

drop policy if exists rls_mgmt_all_lesson_reminder_logs on public.lesson_reminder_logs;
create policy rls_mgmt_all_lesson_reminder_logs
on public.lesson_reminder_logs
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

grant select, insert, update, delete on public.lesson_reminder_logs to authenticated;
