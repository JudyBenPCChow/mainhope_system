-- P0 關帳收尾：登出／過期清 session 帽；inbox ops／已讀／portal view-as 收 capability；
-- student_code_counters 補政策（空白學號 autocode）。
-- 阿Po／側欄（IA1）唔改。

-- ---------------------------------------------------------------------------
-- 1. Session 帽：登出刪本列；過期／已刪 auth.sessions 一併清
-- ---------------------------------------------------------------------------

create or replace function private.purge_stale_mgmt_session_roles()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.mgmt_session_roles msr
  where not exists (
    select 1
    from auth.sessions s
    where s.id = msr.session_id
      and (s.not_after is null or s.not_after > now())
  );
end;
$$;

revoke all on function private.purge_stale_mgmt_session_roles() from public, anon, authenticated;

create or replace function public.clear_my_mgmt_session_role()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.current_app_user_id();
  v_session uuid := private.current_jwt_session_id();
begin
  if v_uid is not null and v_session is not null then
    delete from private.mgmt_session_roles
    where app_user_id = v_uid
      and session_id = v_session;
  end if;
  perform private.purge_stale_mgmt_session_roles();
end;
$$;

comment on function public.clear_my_mgmt_session_role() is
  '登出前刪本 JWT session 的 mgmt_session_roles，並清已失效 session 列。';

revoke all on function public.clear_my_mgmt_session_role() from public, anon;
grant execute on function public.clear_my_mgmt_session_role() to authenticated;

create or replace function private.trg_auth_session_delete_mgmt_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.mgmt_session_roles where session_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_auth_session_delete_mgmt_role on auth.sessions;
create trigger trg_auth_session_delete_mgmt_role
  after delete on auth.sessions
  for each row
  execute function private.trg_auth_session_delete_mgmt_role();

create or replace function private.ensure_mgmt_session_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_user_id uuid := public.current_app_user_id();
  v_session_id uuid := private.current_jwt_session_id();
  v_role text;
begin
  perform private.purge_stale_mgmt_session_roles();

  if v_app_user_id is null or v_session_id is null then
    return public.current_app_role();
  end if;

  select msr.active_role
    into v_role
    from private.mgmt_session_roles msr
    join public.app_user_roles aur
      on aur.app_user_id = msr.app_user_id
     and aur.role = msr.active_role
   where msr.app_user_id = v_app_user_id
     and msr.session_id = v_session_id
   limit 1;

  if v_role is not null then
    return v_role;
  end if;

  v_role := private.default_mgmt_role(v_app_user_id);
  if v_role is null then
    return public.current_app_role();
  end if;

  insert into private.mgmt_session_roles (app_user_id, session_id, active_role, switched_at)
  values (v_app_user_id, v_session_id, v_role, now())
  on conflict (app_user_id, session_id) do nothing;

  select msr.active_role
    into v_role
    from private.mgmt_session_roles msr
    join public.app_user_roles aur
      on aur.app_user_id = msr.app_user_id
     and aur.role = msr.active_role
   where msr.app_user_id = v_app_user_id
     and msr.session_id = v_session_id
   limit 1;

  return coalesce(v_role, public.current_app_role());
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. student_code_counters：空白學號 autocode；Data API 不可亂改序號
-- ---------------------------------------------------------------------------

drop policy if exists rls_cap_select_student_code_counters on public.student_code_counters;
drop policy if exists rls_cap_insert_student_code_counters on public.student_code_counters;
drop policy if exists rls_cap_update_student_code_counters on public.student_code_counters;

create policy rls_cap_select_student_code_counters
on public.student_code_counters
for select
to authenticated
using (private.has_capability('students.create'));

create policy rls_cap_insert_student_code_counters
on public.student_code_counters
for insert
to authenticated
with check (private.has_capability('students.create'));

create policy rls_cap_update_student_code_counters
on public.student_code_counters
for update
to authenticated
using (private.has_capability('students.create'))
with check (private.has_capability('students.create'));

revoke delete, truncate on public.student_code_counters from authenticated;

comment on table public.student_code_counters is
  '學號序號。RLS：students.create 可 SELECT／INSERT／UPDATE；空白學號由 trg_students_autocode 呼叫 next_student_code_current_year。';

-- ---------------------------------------------------------------------------
-- 3. inbox_events：職員讀改 inbox.read；ops 寫入跟營運寫入 capability
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_select_inbox_events on public.inbox_events;
create policy rls_mgmt_select_inbox_events
on public.inbox_events
for select
to authenticated
using (
  private.has_capability('inbox.read')
  and not public.is_teacher_role()
);

comment on policy rls_mgmt_select_inbox_events on public.inbox_events is
  'P0：職員收件匣 SELECT 跟 inbox.read；老師仍走 scoped 政策。';

drop policy if exists rls_mgmt_insert_ops_inbox_events on public.inbox_events;
create policy rls_mgmt_insert_ops_inbox_events
on public.inbox_events
for insert
to authenticated
with check (
  coalesce(category, 'ops') = 'ops'
  and (
    private.has_capability('schedule.create')
    or private.has_capability('schedule.reschedule')
    or private.has_capability('schedule.cancel')
    or private.has_capability('schedule.substitute')
    or private.has_capability('classes.update')
    or private.has_capability('leaves.manage')
    or private.has_capability('students.enroll')
  )
);

comment on policy rls_mgmt_insert_ops_inbox_events on public.inbox_events is
  'P0：營運通知 INSERT 要對應寫入 capability；財務／老師不可塞 ops。';

drop policy if exists rls_mgmt_update_ops_inbox_events on public.inbox_events;
drop policy if exists rls_mgmt_delete_ops_inbox_events on public.inbox_events;

-- ---------------------------------------------------------------------------
-- 4. inbox_reads：只准自己的 actor_key（stamp trigger 仍蓋印）
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_inbox_reads on public.inbox_reads;
drop policy if exists rls_teacher_own_inbox_reads on public.inbox_reads;

create policy rls_own_inbox_reads
on public.inbox_reads
for all
to authenticated
using (
  private.has_capability('inbox.read')
  and actor_key = public.current_inbox_actor_key()
)
with check (
  private.has_capability('inbox.read')
  and actor_key = public.current_inbox_actor_key()
);

comment on policy rls_own_inbox_reads on public.inbox_reads is
  'P0：已讀只准自己的 actor_key；唔再用 is_mgmt_staff 全表。';

-- ---------------------------------------------------------------------------
-- 5. portal view-as：收窄到 portal.invite（行政／管理層／外星人；財務不可）
-- ---------------------------------------------------------------------------

drop policy if exists portal_staff_view_as_own on public.portal_staff_view_as;
create policy portal_staff_view_as_own
on public.portal_staff_view_as
for all
to authenticated
using (
  private.has_capability('portal.invite')
  and staff_app_user_id = public.current_app_user_id()
)
with check (
  private.has_capability('portal.invite')
  and staff_app_user_id = public.current_app_user_id()
);

create or replace function public.get_portal_view_as()
returns table (student_id uuid, student_name text)
language sql
stable
security definer
set search_path = public
as $$
  select v.student_id, s.full_name::text
  from public.portal_staff_view_as v
  join public.students s on s.id = v.student_id
  where v.staff_app_user_id = public.current_app_user_id()
    and private.has_capability('portal.invite')
  limit 1;
$$;

create or replace function public.current_portal_view_as_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select v.student_id
  from public.portal_staff_view_as v
  where v.staff_app_user_id = public.current_app_user_id()
    and private.has_capability('portal.invite')
  limit 1;
$$;

create or replace function public.start_portal_view_as(p_student_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid := public.current_app_user_id();
begin
  if not private.has_capability('portal.invite') then
    raise exception '沒有家長 Portal 視角權限';
  end if;
  if v_staff_id is null then
    raise exception '找不到行政帳號';
  end if;
  if p_student_id is null then
    raise exception '請選擇學生';
  end if;
  if not exists (select 1 from public.students s where s.id = p_student_id) then
    raise exception '找不到學生';
  end if;

  insert into public.portal_staff_view_as (staff_app_user_id, student_id, started_at)
  values (v_staff_id, p_student_id, now())
  on conflict (staff_app_user_id) do update
    set student_id = excluded.student_id,
        started_at = excluded.started_at;

  return p_student_id;
end;
$$;

create or replace function public.stop_portal_view_as()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid := public.current_app_user_id();
begin
  if v_staff_id is null then
    return;
  end if;
  if not private.has_capability('portal.invite') then
    raise exception '沒有家長 Portal 視角權限';
  end if;
  delete from public.portal_staff_view_as where staff_app_user_id = v_staff_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. 版本
-- ---------------------------------------------------------------------------

update private.authz_meta
set authz_version = 11,
    updated_at = now()
where id = 1;
