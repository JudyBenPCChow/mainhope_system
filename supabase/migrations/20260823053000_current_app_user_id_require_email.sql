-- current_app_user_id 電郵後備：空 JWT email 唔好配到 app_users.email 空／null。
-- 否則無登入／service_role 會誤認成 Jackson Lau（teacher），觸發 TEACHER_*_DENIED。

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
       and nullif(btrim(coalesce(au.email, '')), '') is not null
       and nullif(btrim(coalesce(auth.jwt() ->> 'email', '')), '') is not null
       and lower(btrim(au.email)) = lower(btrim(auth.jwt() ->> 'email'))
     )
  order by (au.auth_user_id = auth.uid()) desc
  limit 1;
$$;

comment on function public.current_app_user_id() is
  'JWT auth.uid() → app_users；電郵後備只在雙方 email 都非空時匹配。';
