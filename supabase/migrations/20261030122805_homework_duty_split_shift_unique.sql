-- 同一老師、同一課室、同一日可有多段當值（中間有空檔）。
-- 原唯一鍵 (duty_day_id, teacher_id, room) 只容一段。

alter table public.homework_tutoring_duty_assignments
  drop constraint homework_tutoring_duty_assignments_unique;

alter table public.homework_tutoring_duty_assignments
  add constraint homework_tutoring_duty_assignments_unique
  unique (duty_day_id, teacher_id, room, session_start);

comment on constraint homework_tutoring_duty_assignments_unique
  on public.homework_tutoring_duty_assignments is
  '同一日、同一老師、同一課室、同一開始時間只得一列；不同開始時間可分段。';
