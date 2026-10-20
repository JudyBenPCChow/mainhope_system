-- 公開試堂滿班（就讀中 > 5）只留專科班。功課輔導班不設此上限。

create or replace function public.trial_invite_class_under_enrolled_cap(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.classes c
      where c.id = p_class_id
        and c.class_kind = 'homework'
    )
    or (
      select count(*)::int
      from public.student_class_enrollments e
      where e.class_id = p_class_id
        and e.status = '就讀中'
    ) <= 5;
$$;

comment on function public.trial_invite_class_under_enrolled_cap(uuid) is
  '試堂邀請公開目錄：專科班就讀中人數 ≤ 5 才顯示。功課輔導班不設此上限。';

revoke all on function public.trial_invite_class_under_enrolled_cap(uuid) from public;
revoke all on function public.trial_invite_class_under_enrolled_cap(uuid) from anon;
grant execute on function public.trial_invite_class_under_enrolled_cap(uuid) to authenticated;

create or replace function public.ad_trial_class_under_enrolled_cap(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.classes c
      where c.id = p_class_id
        and c.class_kind = 'homework'
    )
    or (
      select count(*)::int
      from public.student_class_enrollments e
      where e.class_id = p_class_id
        and e.status = '就讀中'
    ) <= 5;
$$;

comment on function public.ad_trial_class_under_enrolled_cap(uuid) is
  '廣告試堂公開目錄：專科班就讀中人數 ≤ 5 才顯示。功課輔導班不設此上限。不含試堂人頭。';

revoke all on function public.ad_trial_class_under_enrolled_cap(uuid) from public, anon, authenticated;

comment on function public.ad_trial_catalog_allows_class(uuid) is
  '廣告試堂：目前學年、專科或功輔、未結束、已納入廣告目錄。專科就讀中 ≤ 5；功輔不設此上限。';
