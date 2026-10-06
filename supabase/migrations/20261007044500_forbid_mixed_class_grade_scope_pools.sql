-- 混級專科班不可再鑄年級碼權益池（S4／S5）。
-- 判定：classes.grade 多於一級，或課程 eligible_grade_codes 多於一級。
-- 單級專科仍可用年級碼共用池。不改既有列；production 混級班已全是 class:<uuid>。

begin;

create or replace function public.forbid_grade_scope_pool_on_mixed_class()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade text[];
  v_eligible text[];
begin
  if new.course_group is distinct from 'group_specialist' then
    return new;
  end if;
  if new.namespace_key is null or new.namespace_key !~ '^[PS][1-6]$' then
    return new;
  end if;
  if new.class_id is null then
    return new;
  end if;

  select c.grade, co.eligible_grade_codes
    into v_grade, v_eligible
  from public.classes c
  left join public.courses co on co.id = c.course_id
  where c.id = new.class_id;

  if not found then
    return new;
  end if;

  if cardinality(coalesce(v_grade, array[]::text[])) > 1
     or cardinality(coalesce(v_eligible, array[]::text[])) > 1 then
    raise exception 'MIXED_CLASS_GRADE_SCOPE_POOL_DENIED'
      using errcode = '23514',
        hint = '混級專科班權益池必須用 class:<班別id>，不可用年級碼';
  end if;

  return new;
end;
$$;

comment on function public.forbid_grade_scope_pool_on_mixed_class() is
  'Prevent inserting or renaming a grade-scope (S4) entitlement pool onto a mixed-grade specialist class.';

drop trigger if exists trg_forbid_grade_scope_pool_on_mixed_class
  on public.student_entitlement_pools;

create trigger trg_forbid_grade_scope_pool_on_mixed_class
  before insert or update of course_group, namespace_key, class_id
  on public.student_entitlement_pools
  for each row
  execute function public.forbid_grade_scope_pool_on_mixed_class();

commit;
