-- 系統通知：行政手機週曆／課室使用（僅行政／外星人可見）
insert into public.inbox_events (
  event_type,
  category,
  title,
  body,
  action_path,
  audience_teacher_ids,
  audience_roles,
  payload
)
select
  'system_update',
  'system',
  '手機可查看課室週曆',
  E'行政／外星人可在手機查看各課室使用情況。\n\n【怎麼用】\n1. 底部選「排程」\n2. 切換「週曆」\n3. 用一至日切換日期；預設顯示朝 9–晚 6，需要時可「顯示晚間」\n\n【其他】\n課室管理的單課室週曆，手機上亦改為較易閱讀（預設朝 9–晚 6）。',
  '/Schedule',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '手機可查看課室週曆'
);
