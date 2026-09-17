-- 前台「明日課堂提醒」老師角度：以老師 × 上課日記錄已提醒狀態

create table if not exists public.teacher_lesson_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  reminder_date date not null,
  reminded_at timestamptz not null default now(),
  reminded_by text,
  channel text not null default 'whatsapp',
  detail text,
  constraint teacher_lesson_reminder_logs_teacher_date_unique unique (teacher_id, reminder_date)
);

create index if not exists teacher_lesson_reminder_logs_reminder_date_idx
  on public.teacher_lesson_reminder_logs (reminder_date desc);

create index if not exists teacher_lesson_reminder_logs_teacher_id_idx
  on public.teacher_lesson_reminder_logs (teacher_id);

comment on table public.teacher_lesson_reminder_logs is
  '前台老師課堂提醒紀錄：同一老師同一上課日最多一筆（已提醒）';

comment on column public.teacher_lesson_reminder_logs.reminder_date is
  '被提醒的上課日期（通常為翌日）';

comment on column public.teacher_lesson_reminder_logs.reminded_by is
  '操作者標籤（formatMgmtActorLabel）';

comment on column public.teacher_lesson_reminder_logs.channel is
  '提醒渠道：whatsapp／manual 等';

alter table public.teacher_lesson_reminder_logs enable row level security;

-- 與 lesson_reminder_logs 同一頁：讀 students.read；寫 students.update
drop policy if exists rls_cap_select_teacher_lesson_reminder_logs
  on public.teacher_lesson_reminder_logs;
drop policy if exists rls_cap_write_teacher_lesson_reminder_logs
  on public.teacher_lesson_reminder_logs;

create policy rls_cap_select_teacher_lesson_reminder_logs
on public.teacher_lesson_reminder_logs for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_teacher_lesson_reminder_logs
on public.teacher_lesson_reminder_logs for all to authenticated
using (private.has_capability('students.update'))
with check (private.has_capability('students.update'));

grant select, insert, update, delete on public.teacher_lesson_reminder_logs to authenticated;

drop trigger if exists trg_stamp_teacher_lesson_reminder_by
  on public.teacher_lesson_reminder_logs;
create trigger trg_stamp_teacher_lesson_reminder_by
  before insert or update on public.teacher_lesson_reminder_logs
  for each row
  execute function private.trg_stamp_lesson_reminder_by();
