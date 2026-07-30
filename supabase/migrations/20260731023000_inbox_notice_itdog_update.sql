-- 系統通知：明學IT狗答問與行政用法知識更新（僅行政／外星人可見）
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
  '明學IT狗：答問與用法說明已更新',
  E'明學IT狗已更新，行政／外星人可直接問系統用法或查資料。\n\n【今次更新】\n· 加強行政功能說明（收件匣、試堂轉正式報讀／流失復盤、點名與出席等）\n· 修正查學生堂次等問題（例如「某某今日有冇堂」）\n· 修正「如何刪除出席紀錄」等用法問題，唔會再誤判成搵學生\n\n【點試】\n側欄進入「明學IT狗」，可問：「收件匣邊度入？」「試堂點轉正式報讀？」「如何改出席紀錄？」',
  '/Apo',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '明學IT狗：答問與用法說明已更新'
);
