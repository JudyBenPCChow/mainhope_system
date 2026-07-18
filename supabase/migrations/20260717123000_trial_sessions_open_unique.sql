-- 未結案試堂：同一學生不可對同一排程重複新增
create unique index if not exists trial_sessions_student_schedule_open_uidx
  on public.trial_sessions (student_id, schedule_id)
  where coalesce(status, '') not like '%完成%'
    and coalesce(status, '') not like '%取消%';
