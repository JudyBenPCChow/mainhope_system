-- Mark Yu 專用雙身份：行政／專科老師。
-- 角色切換必須經 RPC 驗證；localStorage 只作前端快取，不是授權來源。

begin;

alter table public.app_users
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists app_users_auth_user_id_unique
  on public.app_users (auth_user_id)
  where auth_user_id is not null;

update public.app_users au
set auth_user_id = u.id
from auth.users u
where au.auth_user_id is null
  and lower(trim(coalesce(au.email, ''))) = lower(trim(coalesce(u.email, '')));

create table if not exists public.app_user_roles (
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'alien')),
  teacher_id uuid references public.teachers (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (app_user_id, role),
  constraint app_user_roles_teacher_link_check check (
    (role = 'teacher' and teacher_id is not null)
    or (role <> 'teacher' and teacher_id is null)
  )
);

create table if not exists public.mgmt_active_roles (
  app_user_id uuid primary key references public.app_users (id) on delete cascade,
  active_role text not null check (active_role in ('admin', 'teacher', 'alien')),
  switched_at timestamptz not null default now()
);

alter table public.app_user_roles enable row level security;
alter table public.mgmt_active_roles enable row level security;

revoke all on public.app_user_roles from anon, authenticated;
revoke all on public.mgmt_active_roles from anon, authenticated;

-- 為現有管理帳戶建立單一角色授權；student portal 不屬於管理角色切換。
insert into public.app_user_roles (app_user_id, role, teacher_id)
select
  au.id,
  au.role,
  case when au.role = 'teacher' then au.teacher_id else null end
from public.app_users au
where au.role in ('admin', 'teacher', 'alien')
  and (au.role <> 'teacher' or au.teacher_id is not null)
on conflict (app_user_id, role) do update
set teacher_id = excluded.teacher_id;

-- 只有 Mark Yu 額外取得行政身份；其 teacher 身份沿用既有 teacher_id。
insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'admin', null
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and au.role = 'teacher'
  and au.teacher_id is not null
on conflict (app_user_id, role) do nothing;

-- 預設維持 Mark Yu 原有的老師視角，避免部署後權限突然擴大。
insert into public.mgmt_active_roles (app_user_id, active_role)
select au.id, 'teacher'
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and exists (
    select 1
    from public.app_user_roles aur
    where aur.app_user_id = au.id
      and aur.role = 'teacher'
  )
on conflict (app_user_id) do nothing;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select au.id
  from public.app_users au
  where au.auth_user_id = auth.uid()
     or (
       au.auth_user_id is null
       and lower(trim(coalesce(au.email, ''))) =
         lower(trim(coalesce(auth.jwt() ->> 'email', '')))
     )
  order by (au.auth_user_id = auth.uid()) desc
  limit 1;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select mar.active_role
      from public.mgmt_active_roles mar
      join public.app_user_roles aur
        on aur.app_user_id = mar.app_user_id
       and aur.role = mar.active_role
      where mar.app_user_id = au.id
      limit 1
    ),
    au.role
  )
  from public.app_users au
  where au.id = public.current_app_user_id()
  limit 1;
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(aur.teacher_id, au.teacher_id)
  from public.app_users au
  left join public.app_user_roles aur
    on aur.app_user_id = au.id
   and aur.role = 'teacher'
  where au.id = public.current_app_user_id()
    and public.current_app_role() = 'teacher'
  limit 1;
$$;

create or replace function public.get_my_mgmt_profile()
returns table (
  email text,
  display_name text,
  active_role text,
  teacher_id uuid,
  available_roles text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    au.email,
    au.display_name,
    public.current_app_role(),
    public.current_teacher_id(),
    coalesce(
      (
        select array_agg(aur.role order by
          case aur.role
            when 'teacher' then 1
            when 'admin' then 2
            when 'alien' then 3
            else 4
          end
        )
        from public.app_user_roles aur
        where aur.app_user_id = au.id
      ),
      array[au.role]::text[]
    )
  from public.app_users au
  where au.id = public.current_app_user_id()
    and public.current_app_role() in ('admin', 'teacher', 'alien')
  limit 1;
$$;

create or replace function public.switch_my_mgmt_role(p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_user_id uuid := public.current_app_user_id();
  v_role text := lower(trim(coalesce(p_role, '')));
begin
  if v_app_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not exists (
    select 1
    from public.app_user_roles aur
    where aur.app_user_id = v_app_user_id
      and aur.role = v_role
  ) then
    raise exception 'ROLE_NOT_ASSIGNED';
  end if;

  insert into public.mgmt_active_roles (app_user_id, active_role, switched_at)
  values (v_app_user_id, v_role, now())
  on conflict (app_user_id) do update
    set active_role = excluded.active_role,
        switched_at = excluded.switched_at;
end;
$$;

revoke all on function public.current_app_user_id() from public, anon;
revoke all on function public.current_app_role() from public, anon;
revoke all on function public.current_teacher_id() from public, anon;
revoke all on function public.get_my_mgmt_profile() from public, anon;
revoke all on function public.switch_my_mgmt_role(text) from public, anon;

grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_teacher_id() to authenticated;
grant execute on function public.get_my_mgmt_profile() to authenticated;
grant execute on function public.switch_my_mgmt_role(text) to authenticated;

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色；目前只有 Mark Yu 同時擁有 teacher 與 admin。';
comment on table public.mgmt_active_roles is
  '管理帳戶目前操作角色；切換必須經 switch_my_mgmt_role 驗證。';
comment on function public.switch_my_mgmt_role(text) is
  '切換目前管理角色；只接受呼叫者已獲授予的角色。';

commit;
