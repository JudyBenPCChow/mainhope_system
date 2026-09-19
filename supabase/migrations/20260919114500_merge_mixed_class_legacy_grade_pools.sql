-- 混級專科班：舊鑄年級碼池（S4／S5）與現行 class:<uuid> 池雙軌。
-- 把同班年級碼池餘額／宣告／消費事件併入 class 池後刪舊列，令學費追收與扣堂同一 namespace。

begin;

do $$
declare
  r record;
  v_class_ns text;
  v_target_id uuid;
  v_legacy_id uuid;
  v_target_initial numeric;
  v_target_remaining numeric;
  v_legacy_initial numeric;
  v_legacy_remaining numeric;
begin
  for r in
    select
      ep_grade.id as legacy_id,
      ep_grade.student_id,
      ep_grade.class_id,
      ep_grade.academic_year_id,
      ep_grade.initial_lessons as legacy_initial,
      ep_grade.remaining_lessons as legacy_remaining,
      ep_class.id as class_pool_id,
      ep_class.initial_lessons as class_initial,
      ep_class.remaining_lessons as class_remaining
    from public.student_entitlement_pools ep_grade
    join public.classes c on c.id = ep_grade.class_id
    left join public.student_entitlement_pools ep_class
      on ep_class.student_id = ep_grade.student_id
     and ep_class.academic_year_id = ep_grade.academic_year_id
     and ep_class.course_group = ep_grade.course_group
     and ep_class.namespace_key = 'class:' || ep_grade.class_id::text
    where ep_grade.course_group = 'group_specialist'
      and ep_grade.namespace_key ~ '^[PS][1-6]$'
      and ep_grade.class_id is not null
      and cardinality(coalesce(c.grade, '{}'::text[])) > 1
  loop
    v_legacy_id := r.legacy_id;
    v_class_ns := 'class:' || r.class_id::text;
    v_legacy_initial := coalesce(r.legacy_initial, 0);
    v_legacy_remaining := coalesce(r.legacy_remaining, 0);

    if r.class_pool_id is null then
      update public.student_entitlement_pools
      set namespace_key = v_class_ns,
          updated_at = timezone('utc', now())
      where id = v_legacy_id;
      continue;
    end if;

    v_target_id := r.class_pool_id;
    v_target_initial := coalesce(r.class_initial, 0) + v_legacy_initial;
    v_target_remaining := coalesce(r.class_remaining, 0) + v_legacy_remaining;

    update public.student_entitlement_pools
    set initial_lessons = v_target_initial,
        remaining_lessons = v_target_remaining,
        updated_at = timezone('utc', now())
    where id = v_target_id;

    update public.attendance_declarations
    set pool_id = v_target_id,
        updated_at = timezone('utc', now())
    where pool_id = v_legacy_id;

    update public.entitlement_consumption_events
    set pool_id = v_target_id
    where pool_id = v_legacy_id;

    update public.entitlement_pool_adjustments
    set pool_id = v_target_id
    where pool_id = v_legacy_id;

    update public.entitlement_pool_adjustments
    set related_pool_id = v_target_id
    where related_pool_id = v_legacy_id;

    delete from public.student_entitlement_pools
    where id = v_legacy_id;
  end loop;
end $$;

commit;
