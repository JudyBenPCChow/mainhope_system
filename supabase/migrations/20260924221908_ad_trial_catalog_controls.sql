-- 廣告試堂班別控管：職員批量開關（students.enroll）

begin;

create or replace function public.ad_trial_set_classes_listed(
  p_class_ids uuid[],
  p_listed boolean
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_bad integer;
  v_n integer;
begin
  perform public.trial_invite_require_enroll();
  v_ids := (
    select coalesce(array_agg(distinct x), '{}'::uuid[])
    from unnest(coalesce(p_class_ids, '{}'::uuid[])) as x
    where x is not null
  );
  if cardinality(v_ids) = 0 then
    return 0;
  end if;

  select count(*)::integer into v_bad
  from unnest(v_ids) as x
  where not exists (
    select 1
    from public.classes c
    where c.id = x
      and c.class_kind in ('group', 'homework')
  );
  if v_bad > 0 then
    raise exception '僅專科班與功課輔導班可納入廣告試堂';
  end if;

  update public.classes
  set ad_trial_listed = coalesce(p_listed, false)
  where id = any (v_ids);

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.ad_trial_set_classes_listed(uuid[], boolean) from public, anon;
grant execute on function public.ad_trial_set_classes_listed(uuid[], boolean) to authenticated;

comment on function public.ad_trial_set_classes_listed(uuid[], boolean) is
  '廣告試堂：批量設定專科班／功課輔導班是否納入公開目錄。預設不納入。';

create or replace function public.ad_trial_set_schedules_excluded(
  p_schedule_ids uuid[],
  p_excluded boolean
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_bad integer;
  v_n integer;
begin
  perform public.trial_invite_require_enroll();
  v_ids := (
    select coalesce(array_agg(distinct x), '{}'::uuid[])
    from unnest(coalesce(p_schedule_ids, '{}'::uuid[])) as x
    where x is not null
  );
  if cardinality(v_ids) = 0 then
    return 0;
  end if;

  select count(*)::integer into v_bad
  from unnest(v_ids) as x
  where not exists (
    select 1
    from public.schedules sch
    join public.classes c on c.id = sch.class_id
    where sch.id = x
      and c.class_kind in ('group', 'homework')
  );
  if v_bad > 0 then
    raise exception '僅專科班與功課輔導班排程可設定廣告試堂';
  end if;

  update public.schedules
  set ad_trial_excluded = coalesce(p_excluded, false)
  where id = any (v_ids);

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.ad_trial_set_schedules_excluded(uuid[], boolean) from public, anon;
grant execute on function public.ad_trial_set_schedules_excluded(uuid[], boolean) to authenticated;

comment on function public.ad_trial_set_schedules_excluded(uuid[], boolean) is
  '廣告試堂：批量設定堂次是否從公開目錄剔除。不以已有試堂鎖定。';

notify pgrst, 'reload schema';

commit;
