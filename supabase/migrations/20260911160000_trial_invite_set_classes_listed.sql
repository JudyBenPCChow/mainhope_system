-- 試堂邀請：批量設定班別是否納入公開名單

begin;

create or replace function public.trial_invite_set_classes_listed(
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
    raise exception '僅專科班與功課輔導班可納入試堂邀請名單';
  end if;

  update public.classes
  set trial_invite_listed = coalesce(p_listed, true)
  where id = any (v_ids);

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.trial_invite_set_classes_listed(uuid[], boolean) from public;
revoke all on function public.trial_invite_set_classes_listed(uuid[], boolean) from anon;
grant execute on function public.trial_invite_set_classes_listed(uuid[], boolean) to authenticated;

comment on function public.trial_invite_set_classes_listed(uuid[], boolean) is
  '試堂邀請：批量設定專科班／功課輔導班是否納入公開名單。';

notify pgrst, 'reload schema';

commit;
