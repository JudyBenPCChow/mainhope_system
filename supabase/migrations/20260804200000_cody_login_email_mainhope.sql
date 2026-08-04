-- Cody Cheong：登入電郵 carolfanwl@gmail.com → cody@mainhope.edu.hk
-- app_users 已是新電郵；本檔同步 auth.users／auth.identities，令實際登入可用新電郵。
-- 套用：npm run db:apply -- supabase/migrations/20260804200000_cody_login_email_mainhope.sql
--
-- rollback（手動）：
--   update auth.users
--      set email = 'carolfanwl@gmail.com',
--          updated_at = now()
--    where id = (
--      select auth_user_id from public.app_users
--       where lower(email) = 'cody@mainhope.edu.hk' limit 1
--    );
--   update auth.identities
--      set identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb('carolfanwl@gmail.com'::text))
--    where user_id = (
--      select auth_user_id from public.app_users
--       where lower(email) = 'cody@mainhope.edu.hk' limit 1
--    )
--      and provider = 'email';
--   update public.app_users
--      set email = 'carolfanwl@gmail.com', updated_at = now()
--    where lower(email) = 'cody@mainhope.edu.hk';

begin;

-- 確保 app_users 電郵為機構帳號（若已是則 no-op）
update public.app_users
   set email = 'cody@mainhope.edu.hk',
       display_name = coalesce(nullif(trim(display_name), ''), 'Cody Cheong'),
       updated_at = now()
 where auth_user_id in (
         select id from auth.users where lower(trim(email)) = 'carolfanwl@gmail.com'
       )
    or lower(trim(email)) in ('carolfanwl@gmail.com', 'cody@mainhope.edu.hk');

-- Auth 登入電郵
update auth.users u
   set email = 'cody@mainhope.edu.hk',
       email_change = '',
       email_change_token_new = '',
       email_change_token_current = '',
       updated_at = now()
 where lower(trim(u.email)) = 'carolfanwl@gmail.com'
   and not exists (
     select 1 from auth.users x
      where lower(trim(x.email)) = 'cody@mainhope.edu.hk'
        and x.id <> u.id
   );

-- Email identity 一併更新（email 欄為 generated，只改 identity_data）
update auth.identities i
   set identity_data = jsonb_set(
         coalesce(i.identity_data, '{}'::jsonb),
         '{email}',
         to_jsonb('cody@mainhope.edu.hk'::text)
       ),
       updated_at = now()
 where i.provider = 'email'
   and i.user_id in (
     select id from auth.users where lower(trim(email)) = 'cody@mainhope.edu.hk'
   );

commit;
