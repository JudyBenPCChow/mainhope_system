-- Mark Yu：在既有 teacher＋manager 之外，授予財務身份。
-- 切換至 finance 後可審閱並提交工資單（P1–P6），與財務同等；結算仍用 manager。
-- 不改目前作用中角色，避免部署後突然換成財務視角。

begin;

insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'finance', null
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
on conflict (app_user_id, role) do nothing;

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色；Christine Fan 同時擁有 teacher 與 admin；Mark Yu 同時擁有 teacher、manager 與 finance。';

commit;
