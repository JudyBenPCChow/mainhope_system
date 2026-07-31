-- 系統通知：試堂／前台收費收斂至收款登記（僅行政／外星人可見）
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
  '試堂與前台：收費統一改去「收款登記」',
  E'試堂同前台精靈唔再喺頁面入面收款，統一去「收款登記」開單。\n\n【點樣做】\n1. 試堂紀錄 → 新增試堂（選免費／半價／原價）→ 半價／原價會帶你去收款登記\n2. 前台指引精靈到「收費」步 → 去收款登記（可新分頁）\n3. 對帳／收據：繳費紀錄；單據同試堂會自動掛勾（有未結試堂先）\n\n【請留意】\n· 取消／刪除／改期試堂：若已有點名，要先確認清除出席先至得\n· 作廢收據後，試堂會唔再掛該收據，可再去收款登記重收\n· 舊通知「試堂頁直接選金額收款」已唔適用',
  '/Payments',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '試堂與前台：收費統一改去「收款登記」'
);
