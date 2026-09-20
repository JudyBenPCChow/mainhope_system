-- 試堂邀請：批量設定排程是否從公開名單剔除

begin;

create or replace function public.trial_invite_set_schedules_excluded(
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
    raise exception '僅專科班與功課輔導班排程可設定試堂邀請';
  end if;

  update public.schedules
  set trial_invite_excluded = coalesce(p_excluded, false)
  where id = any (v_ids);

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.trial_invite_set_schedules_excluded(uuid[], boolean) from public;
revoke all on function public.trial_invite_set_schedules_excluded(uuid[], boolean) from anon;
grant execute on function public.trial_invite_set_schedules_excluded(uuid[], boolean) to authenticated;

comment on function public.trial_invite_set_schedules_excluded(uuid[], boolean) is
  '試堂邀請：批量設定專科班／功課輔導班排程是否從公開名單剔除。';

notify pgrst, 'reload schema';

commit;
