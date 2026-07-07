-- 明學IT狗：每則回覆滿意度（已解決／不滿意）

begin;

alter table public.apo_chat_feedback
  add column if not exists satisfaction text,
  add column if not exists escalated boolean not null default false;

alter table public.apo_chat_feedback
  drop constraint if exists apo_chat_feedback_satisfaction_check;

alter table public.apo_chat_feedback
  add constraint apo_chat_feedback_satisfaction_check
  check (satisfaction is null or satisfaction in ('solved', 'unsolved'));

comment on column public.apo_chat_feedback.satisfaction is
  '明學IT狗滿意度：solved=已解決、unsolved=不滿意';

comment on column public.apo_chat_feedback.escalated is
  '不滿意時是否已推送至 mgmt_system_errors（外星人 SystemIssues）';

commit;
