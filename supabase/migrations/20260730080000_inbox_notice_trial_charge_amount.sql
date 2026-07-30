-- 系統通知：試堂收費改為前台選金額（僅行政／外星人可見）
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
  '試堂收費：改為前台選最終金額',
  E'「試堂紀錄 → 新增試堂」流程已更新，方便前台即場給予優惠。\n\n【怎麼用】\n1. 選學生、班別、排程（不再先選試堂類型）\n2. 按「下一步：收費」\n3. 選每堂金額：免費（$0）、$250、$275、$300，或「其他金額」自填\n4. 付費試堂再選付款方式 →「確認收款並建立試堂」；免費則直接建立\n\n【請留意】\n· 連堂仍按節數以每堂金額加總入帳\n· 列表類型標籤會依金額推斷（免費／半價／原價）',
  '/TrialSessions',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '試堂收費：改為前台選最終金額'
);
