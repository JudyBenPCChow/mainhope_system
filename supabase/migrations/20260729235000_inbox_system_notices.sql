-- 收件匣：系統通知（category／audience_roles／system_update）
-- 老師可見系統通知：audience_roles 空＝全部人，或含 teacher

alter table public.inbox_events
  add column if not exists category text not null default 'ops';

alter table public.inbox_events
  add column if not exists audience_roles text[] not null default '{}'::text[];

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
      'system_update'
    )
  );

alter table public.inbox_events
  drop constraint if exists inbox_events_category_check;

alter table public.inbox_events
  add constraint inbox_events_category_check check (category in ('ops', 'system'));

create index if not exists inbox_events_category_created_at_idx
  on public.inbox_events (category, created_at desc);

comment on column public.inbox_events.category is
  'ops＝營運通知；system＝系統通知（功能更新等）';

comment on column public.inbox_events.audience_roles is
  '系統通知可見角色：空陣列＝全部人；否則為 admin／alien／teacher 子集';

drop policy if exists rls_teacher_select_inbox_events on public.inbox_events;
create policy rls_teacher_select_inbox_events
on public.inbox_events
for select
to authenticated
using (
  public.is_teacher_role()
  and (
    (
      category = 'system'
      and (
        coalesce(cardinality(audience_roles), 0) = 0
        or 'teacher' = any (audience_roles)
      )
    )
    or (
      coalesce(category, 'ops') = 'ops'
      and (
        public.current_teacher_id() = any (audience_teacher_ids)
        or (
          class_id is not null
          and public.teacher_can_access_class(class_id)
        )
      )
    )
  )
);

-- 首則：繳費方式選項更新（行政／外星人）
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
  '繳費方式選項已更新',
  E'收款登記與「標記已收款」的繳費方式選項已更新，請依實際收款方式選擇，以便單據準確反映。\n\n新增：PayMe、八達通、易辦事、銀聯、銀行轉帳。\n支付寶改為兩項：內地支付寶、香港支付寶。\n其餘維持：現金、轉數快、信用卡、支票、微信支付、其他。',
  '/Payments',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1
  from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '繳費方式選項已更新'
);
