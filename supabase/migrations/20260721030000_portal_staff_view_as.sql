-- 行政人員於家長 Portal 以學生視角檢視（view-as）。
-- 不變更 app_users.role；以 session 表覆寫 current_portal_student_id / is_portal。
-- 寫入類 RPC 仍要求真正的 student 角色，避免行政誤操作。

begin;

-- ---------------------------------------------------------------------------
-- 1. View-as session（每位行政最多一個作用中學生）
-- ---------------------------------------------------------------------------

create table if not exists public.portal_staff_view_as (
  staff_app_user_id uuid primary key references public.app_users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  started_at timestamptz not null default now()
);

create index if not exists portal_staff_view_as_student_id_idx
  on public.portal_staff_view_as (student_id);

alter table public.portal_staff_view_as enable row level security;

drop policy if exists portal_staff_view_as_mgmt_all on public.portal_staff_view_as;
drop policy if exists portal_staff_view_as_own on public.portal_staff_view_as;
create policy portal_staff_view_as_own
on public.portal_staff_view_as
for all
to authenticated
using (
  public.is_mgmt_staff()
  and staff_app_user_id = public.current_app_user_id()
)
with check (
  public.is_mgmt_staff()
  and staff_app_user_id = public.current_app_user_id()
);

comment on table public.portal_staff_view_as is
  '行政於家長 Portal 檢視中的學生；每位行政一列。';

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
    and public.is_mgmt_staff()
  limit 1;
$$;

revoke all on function public.get_portal_view_as() from public;
revoke all on function public.get_portal_view_as() from anon;
grant execute on function public.get_portal_view_as() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

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
    and public.is_mgmt_staff()
  limit 1;
$$;

revoke all on function public.current_portal_view_as_student_id() from public;
revoke all on function public.current_portal_view_as_student_id() from anon;
grant execute on function public.current_portal_view_as_student_id() to authenticated;

create or replace function public.is_portal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(public.current_app_role(), '') = 'student'
    or public.current_portal_view_as_student_id() is not null;
$$;

create or replace function public.current_portal_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select au.student_id
      from public.app_users au
      where lower(coalesce(au.email, '')) = public.current_app_user_email()
        and au.role = 'student'
      limit 1
    ),
    public.current_portal_view_as_student_id()
  );
$$;

comment on function public.is_portal() is
  'Portal: student 角色，或行政有作用中的 view-as。';
comment on function public.current_portal_student_id() is
  'Portal: 綁定學生，或行政 view-as 的學生。';
comment on function public.current_portal_view_as_student_id() is
  '行政目前 view-as 的 student_id；非行政或無 session 則 null。';

-- ---------------------------------------------------------------------------
-- 3. Start / stop RPCs
-- ---------------------------------------------------------------------------

create or replace function public.start_portal_view_as(p_student_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid := public.current_app_user_id();
begin
  if not public.is_mgmt_staff() then
    raise exception '僅行政帳號可切換學生視角';
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
  if not public.is_mgmt_staff() then
    raise exception '僅行政帳號可結束學生視角';
  end if;
  if v_staff_id is null then
    return;
  end if;
  delete from public.portal_staff_view_as where staff_app_user_id = v_staff_id;
end;
$$;

revoke all on function public.start_portal_view_as(uuid) from public;
revoke all on function public.start_portal_view_as(uuid) from anon;
grant execute on function public.start_portal_view_as(uuid) to authenticated;

revoke all on function public.stop_portal_view_as() from public;
revoke all on function public.stop_portal_view_as() from anon;
grant execute on function public.stop_portal_view_as() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. 寫入類 RPC：僅真正 student 角色可提交／取消（view-as 只讀）
-- ---------------------------------------------------------------------------

create or replace function public.submit_portal_enrollment_request(
  p_lines jsonb,
  p_parent_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := public.current_portal_student_id();
  v_quote jsonb;
  v_request_id uuid;
  v_item jsonb;
begin
  if coalesce(public.current_app_role(), '') <> 'student' or v_student_id is null then
    raise exception '僅家長帳號可提交報讀申請';
  end if;

  v_quote := public.portal_build_quote_from_lines(p_lines);

  insert into public.portal_enrollment_requests (
    student_id,
    status,
    estimated_subtotal,
    estimated_total,
    estimate_breakdown,
    parent_note
  ) values (
    v_student_id,
    'submitted',
    (v_quote->>'subtotal')::numeric,
    (v_quote->>'total')::numeric,
    coalesce(v_quote->'lines', '[]'::jsonb),
    nullif(trim(coalesce(p_parent_note, '')), '')
  )
  returning id into v_request_id;

  for v_item in
    select * from jsonb_array_elements(coalesce(v_quote->'lines', '[]'::jsonb))
  loop
    insert into public.portal_enrollment_request_lines (
      request_id,
      class_id,
      enrollment_period,
      schedule_ids,
      unit_price,
      lesson_count,
      line_subtotal,
      class_label
    ) values (
      v_request_id,
      (v_item->>'class_id')::uuid,
      nullif(v_item->>'enrollment_period', ''),
      coalesce(
        (
          select array_agg(x::uuid)
          from jsonb_array_elements_text(coalesce(v_item->'schedule_ids', '[]'::jsonb)) t(x)
          where nullif(x, '') is not null
        ),
        '{}'::uuid[]
      ),
      (v_item->>'unit_price')::numeric,
      (v_item->>'lesson_count')::integer,
      (v_item->>'line_subtotal')::numeric,
      v_item->>'class_label'
    );
  end loop;

  return v_request_id;
end;
$$;

create or replace function public.cancel_portal_enrollment_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := public.current_portal_student_id();
  v_status text;
begin
  if coalesce(public.current_app_role(), '') <> 'student' or v_student_id is null then
    raise exception '僅家長帳號可取消申請';
  end if;

  select status into v_status
  from public.portal_enrollment_requests
  where id = p_request_id
    and student_id = v_student_id
  for update;

  if not found then
    raise exception '找不到申請';
  end if;
  if v_status <> 'submitted' then
    raise exception '僅待審核的申請可取消';
  end if;

  update public.portal_enrollment_requests
  set status = 'cancelled',
      updated_at = now()
  where id = p_request_id;
end;
$$;

commit;
