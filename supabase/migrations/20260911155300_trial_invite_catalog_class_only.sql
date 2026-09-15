-- 試堂邀請公開目錄：不再以老師參與旗標過濾；只看班別 listed

begin;

comment on column public.teachers.trial_invite_participating is
  '已停用（控管改為只剔選班別）。欄位保留；公開目錄不再讀取。';

comment on column public.classes.trial_invite_listed is
  '試堂邀請公開名單：false＝此班不出現。預設 true。';

create or replace function public.trial_invite_catalog_allows_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and coalesce(c.trial_invite_listed, true)
  );
$$;

comment on function public.trial_invite_catalog_allows_class(uuid) is
  '試堂邀請：班別是否納入公開目錄（只看 classes.trial_invite_listed）。';

update public.teachers
set trial_invite_participating = true
where trial_invite_participating is distinct from true;

notify pgrst, 'reload schema';

commit;
