-- 系統通知：暑期跨期補堂點名紙已補正（行政可見）
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
  '點名紙已更新：黃渲棋可點 Jackson Lau 今日補回堂',
  E'【班別】26SM-ENGS5009-A（Jackson Lau）\n【原取消】2026-07-15、2026-07-16（老師請假）\n【補回】2026-08-02 14:00–15:15、15:15–16:30\n\n【發生咩事】\n補回日落在暑期第二期，點名紙按「補堂日期」判期數，只報第一期的黃渲棋本來唔會出現在名單。\n\n【已即時處理】\n已為黃渲棋補上兩筆「老師請假 → 調堂」綁定今日兩節補回堂；重新開啟／重新整理點名紙後應可見（標為補堂）。請為她完成點名。\n\n【注意】\n暑期「第一期／第二期／單堂」跟堂邏輯唔同，跨期補堂易再出事；已列入工程 backlog 統一整理。',
  '/Attendance?date=2026-08-02',
  '{}'::uuid[],
  array['admin', 'manager', 'alien']::text[],
  jsonb_build_object(
    'class_id', 'd726067c-01bf-4c84-ba62-38159bac8ff7',
    'student_id', '5534256c-6c15-41d5-b4c0-56d55a08df87',
    'makeup_schedule_ids', jsonb_build_array(
      '66487806-2cfb-4b3e-9874-7b3677f931f5',
      '9f8e8f04-9a5e-4996-ad40-7022cb4d5412'
    ),
    'incident_date', '2026-08-02'
  )
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '點名紙已更新：黃渲棋可點 Jackson Lau 今日補回堂'
);
