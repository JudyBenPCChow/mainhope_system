-- 系統通知：連堂單項補堂（僅行政／外星人可見）
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
  '連堂可單項請假／補堂（只計 1 堂）',
  E'已支援「連堂只欠／只補一堂」，並確保點名日時正確、老師可點名、又不會因連堂多計一堂。\n\n【請假】\n請假管理、學生詳情、前台請假：連堂可選「兩節一併」或「只請本節」。前台勾選排程時：只勾一節＝只請該節；兩節都勾＝整組請假。\n\n【安排補堂】\n調堂可綁定連堂的第一節或第二節（選單會標「連堂第 N 節」）。請選學生實際坐入的那一節。\n\n【點名】\n該補堂生仍出現在該班連堂點名紙，標示「補堂·僅第 N 節」。儲存後只計 1 堂；原班連堂生仍一次點名計 2 堂。若曾誤計兩堂，重存點名會清掉多餘那一節。\n\n【提醒】\n單項補堂生的 WhatsApp 課堂提醒只顯示所綁那一節時間，不會寫成兩堂連堂。\n\n【注意】\n原班生「同一日連堂半節出席、半節請假」的分節點名仍未支援；連堂原班點名仍為整組同一狀態。',
  '/LeaveManagement',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '連堂可單項請假／補堂（只計 1 堂）'
);
