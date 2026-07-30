-- P1-2: inbox_reads 老師僅可讀寫自己的 actor_key（對齊前端 getInboxActorKey：teacher:{id}）。
-- 行政／外星人維持 rls_mgmt_all_inbox_reads（全表），不影響日常支援。

create or replace function public.current_inbox_actor_key()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select case
    when public.is_teacher_role() and public.current_teacher_id() is not null
      then 'teacher:' || public.current_teacher_id()::text
    else null
  end;
$$;

comment on function public.current_inbox_actor_key() is
  '收件匣已讀身分：老師 = teacher:{current_teacher_id}，對齊 src getInboxActorKey；mgmt 仍走 staff 政策。';

revoke all on function public.current_inbox_actor_key() from public;
revoke all on function public.current_inbox_actor_key() from anon;
grant execute on function public.current_inbox_actor_key() to authenticated;

drop policy if exists rls_teacher_all_inbox_reads on public.inbox_reads;
drop policy if exists rls_teacher_own_inbox_reads on public.inbox_reads;

create policy rls_teacher_own_inbox_reads
on public.inbox_reads
for all
to authenticated
using (
  public.is_teacher_role()
  and actor_key = public.current_inbox_actor_key()
)
with check (
  public.is_teacher_role()
  and actor_key = public.current_inbox_actor_key()
);
