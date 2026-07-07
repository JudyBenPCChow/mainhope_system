-- 雞先生對話回饋（僅儲存，暫無後台檢視 UI）
begin;

create table if not exists public.apo_chat_feedback (
  id uuid primary key default gen_random_uuid(),
  helpful boolean not null,
  user_role text,
  user_message text,
  assistant_message text,
  created_at timestamptz not null default now()
);

comment on table public.apo_chat_feedback is
  '明學IT狗 AI 助手單則回覆之有用／冇用回饋；暫無管理 UI。';

alter table public.apo_chat_feedback enable row level security;

drop policy if exists rls_phase_a_auth_all_apo_chat_feedback on public.apo_chat_feedback;
create policy rls_phase_a_auth_all_apo_chat_feedback on public.apo_chat_feedback
  for all to authenticated
  using (true)
  with check (true);

grant select, insert on public.apo_chat_feedback to authenticated;

commit;
