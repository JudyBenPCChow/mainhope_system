-- 試堂確認收款後寫入老師收件匣（出單先上紙）

alter table public.inbox_events
  drop constraint if exists inbox_events_event_type_check;

alter table public.inbox_events
  add constraint inbox_events_event_type_check check (
    event_type in (
      'schedule_created',
      'schedule_updated',
      'schedule_cancelled',
      'schedule_substitute',
      'class_updated',
      'class_teacher_changed',
      'leave_created',
      'system_update',
      'trial_confirmed'
    )
  );
