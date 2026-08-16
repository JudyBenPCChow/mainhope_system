-- 2627 權益池按課程組別共用（v3）
-- 專科小組同一級共用 remaining；私人／試堂／功輔／混級仍一班一範圍。
-- 唔改 usesEntitlementRosterModel：*SM 仍唔鑄池。空表，無資料遷移。
-- 套用：npm run db:apply -- supabase/migrations/20260815183000_entitlement_pool_course_group.sql
-- 禁套去 mainhope-staging（P0-1 用緊）。唔改 private.has_capability。

begin;

alter table public.student_entitlement_pools
  add column if not exists course_group text;

alter table public.student_entitlement_pools
  add column if not exists namespace_key text;

update public.student_entitlement_pools
set
  course_group = coalesce(course_group, 'group_specialist'),
  namespace_key = coalesce(
    nullif(namespace_key, ''),
    case when class_id is not null then 'class:' || class_id::text else id::text end
  )
where course_group is null or namespace_key is null or namespace_key = '';

alter table public.student_entitlement_pools
  alter column course_group set not null;

alter table public.student_entitlement_pools
  alter column namespace_key set not null;

alter table public.student_entitlement_pools
  drop constraint if exists student_entitlement_pools_course_group_check;

alter table public.student_entitlement_pools
  add constraint student_entitlement_pools_course_group_check
  check (course_group in ('group_specialist', 'private', 'trial', 'homework'));

alter table public.student_entitlement_pools
  drop constraint if exists student_entitlement_pools_student_id_class_id_academic_year_key;

alter table public.student_entitlement_pools
  drop constraint if exists student_entitlement_pools_namespace_key;

alter table public.student_entitlement_pools
  drop constraint if exists student_entitlement_pools_namespace_uidx;

alter table public.student_entitlement_pools
  add constraint student_entitlement_pools_namespace_uidx
  unique (student_id, academic_year_id, course_group, namespace_key);

alter table public.student_entitlement_pools
  alter column class_id drop not null;

alter table public.student_entitlement_pools
  alter column source_enrollment_id drop not null;

alter table public.student_entitlement_pools
  drop constraint if exists student_entitlement_pools_class_id_fkey;

alter table public.student_entitlement_pools
  add constraint student_entitlement_pools_class_id_fkey
  foreign key (class_id) references public.classes (id) on delete set null;

alter table public.student_entitlement_pools
  drop constraint if exists student_entitlement_pools_source_enrollment_id_fkey;

alter table public.student_entitlement_pools
  add constraint student_entitlement_pools_source_enrollment_id_fkey
  foreign key (source_enrollment_id) references public.student_class_enrollments (id)
  on delete set null;

comment on table public.student_entitlement_pools is
  '營運權益池：2627+ 按學生×學年×課程組別。專科小組同一級共用；私人／試堂／功輔唔共用。非收入認列。*SM 唔用本表。';

comment on column public.student_entitlement_pools.course_group is
  'group_specialist | private | trial | homework';

comment on column public.student_entitlement_pools.namespace_key is
  '共用：年級碼（S1）；唔共用：class:<class_id>';

comment on column public.student_entitlement_pools.class_id is
  '鑄池時嘅班（可空）。刪班 SET NULL，唔級聯刪池。';

comment on column public.student_entitlement_pools.source_enrollment_id is
  '首次鑄池嘅報讀（可空）。退讀 SET NULL，唔級聯刪池。';

drop policy if exists rls_teacher_select_student_entitlement_pools
  on public.student_entitlement_pools;

create policy rls_teacher_select_student_entitlement_pools
on public.student_entitlement_pools
for select
to authenticated
using (
  public.is_teacher_role()
  and (
    (class_id is not null and public.teacher_can_access_class(class_id))
    or exists (
      select 1
      from public.student_class_enrollments e
      join public.classes c on c.id = e.class_id
      where e.student_id = student_entitlement_pools.student_id
        and c.academic_year_id = student_entitlement_pools.academic_year_id
        and public.teacher_can_access_class(e.class_id)
    )
  )
);

commit;
