-- 系統通知：前台指引精靈試堂排程載入提示（僅行政／外星人可見）
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
  '前台指引：試堂排程載入提示已修正',
  E'新生登記後第二步「報讀／試堂」選班別時，系統會先顯示「載入排程…」，載入完成後才列出可選堂次。\n\n此前短暫會誤顯示「沒有可用排程」，容易以為真的沒得選；現已分開載入中與真正無排程兩種狀態。',
  '/FrontDeskWizard',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '前台指引：試堂排程載入提示已修正'
);
