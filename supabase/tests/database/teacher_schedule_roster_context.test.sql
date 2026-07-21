begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

select has_function(
  'public',
  'get_teacher_schedule_roster_context',
  array['uuid[]'],
  'schedule roster context RPC exists'
);

select is_definer(
  'public',
  'get_teacher_schedule_roster_context',
  array['uuid[]'],
  'schedule roster context RPC is security definer'
);

insert into public.teachers (id, full_name, email) values
  ('10000000-0000-4000-8000-000000000001', 'Roster Owner', 'roster-owner@test.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'Roster Substitute', 'roster-sub@test.invalid'),
  ('10000000-0000-4000-8000-000000000003', 'Roster Other', 'roster-other@test.invalid');

insert into public.app_users (id, email, display_name, role, teacher_id) values
  ('20000000-0000-4000-8000-000000000001', 'roster-owner@test.invalid', 'Roster Owner', 'teacher', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'roster-sub@test.invalid', 'Roster Substitute', 'teacher', '10000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000003', 'roster-other@test.invalid', 'Roster Other', 'teacher', '10000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000004', 'roster-admin@test.invalid', 'Roster Admin', 'admin', null);

insert into public.classes (id, subject, grade, teacher_id, status) values
  ('30000000-0000-4000-8000-000000000001', '排程限定測試班', array['中三'], '10000000-0000-4000-8000-000000000001', '進行中'),
  ('30000000-0000-4000-8000-000000000002', '其他老師測試班', array['中三'], '10000000-0000-4000-8000-000000000003', '進行中');

insert into public.schedules (
  id,
  class_id,
  teacher_id,
  original_teacher_id,
  scheduled_date,
  start_time,
  end_time,
  status
) values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '2026-07-22',
    '10:00',
    '11:15',
    '正常'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    null,
    '2026-07-22',
    '12:00',
    '13:15',
    '正常'
  );

insert into public.students (
  id,
  student_code,
  full_name,
  english_name,
  grade,
  student_phone_country_code,
  parent_phone_country_code
) values
  ('50000000-0000-4000-8000-000000000001', '20269991', '正式報讀測試生', 'Enrolled', 'S3', '+852', '+852'),
  ('50000000-0000-4000-8000-000000000002', '20269992', '試堂測試生', 'Trial', 'S3', '+852', '+852'),
  ('50000000-0000-4000-8000-000000000003', '20269993', '其他班測試生', 'Foreign', 'S3', '+852', '+852');

insert into public.student_class_enrollments (
  id,
  student_id,
  class_id,
  status,
  enroll_date
) values
  (
    '60000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '就讀中',
    '2026-07-01'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000002',
    '就讀中',
    '2026-07-01'
  );

insert into public.trial_sessions (
  id,
  student_id,
  schedule_id,
  class_id,
  trial_date,
  trial_type,
  status
) values (
  '70000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '2026-07-22',
  '實體',
  '已預約'
);

insert into public.leave_makeup_records (
  id,
  student_id,
  class_id,
  schedule_id,
  leave_date,
  leave_reason,
  status
) values (
  '80000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  null,
  '2026-07-22',
  '病假',
  '已確認'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"email":"roster-sub@test.invalid","role":"authenticated"}',
  true
);

select is(
  jsonb_array_length(
    public.get_teacher_schedule_roster_context(
      array['40000000-0000-4000-8000-000000000001'::uuid]
    ) -> 'enrollments'
  ),
  1,
  'actual substitute reads the assigned schedule enrollment'
);

select is(
  public.get_teacher_schedule_roster_context(
    array['40000000-0000-4000-8000-000000000001'::uuid]
  ) #>> '{enrollments,0,full_name}',
  '正式報讀測試生',
  'actual substitute receives the minimal student display name'
);

select is(
  jsonb_array_length(
    public.get_teacher_schedule_roster_context(
      array['40000000-0000-4000-8000-000000000001'::uuid]
    ) -> 'trials'
  ),
  1,
  'actual substitute reads the assigned schedule trial'
);

select is(
  jsonb_array_length(
    public.get_teacher_schedule_roster_context(
      array['40000000-0000-4000-8000-000000000001'::uuid]
    ) -> 'leaves'
  ),
  1,
  'actual substitute reads an unlinked same-class same-day leave'
);

select results_eq(
  'select count(*) from public.students',
  array[0::bigint],
  'substitute still cannot enumerate base students table'
);

select throws_ok(
  $$select public.get_teacher_schedule_roster_context(
    array['40000000-0000-4000-8000-000000000002'::uuid]
  )$$,
  null,
  null,
  'unrelated schedule is denied'
);

select lives_ok(
  $$insert into public.attendance_details (
    student_id,
    class_id,
    attendance_date,
    schedule_id,
    status
  ) values (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '2026-07-22',
    '40000000-0000-4000-8000-000000000001',
    '現場'
  )$$,
  'actual substitute can write attendance for the assigned schedule'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"email":"roster-owner@test.invalid","role":"authenticated"}',
  true
);

select throws_ok(
  $$insert into public.attendance_details (
    student_id,
    class_id,
    attendance_date,
    schedule_id,
    status
  ) values (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '2026-07-22',
    '40000000-0000-4000-8000-000000000001',
    '現場'
  )$$,
  null,
  null,
  'original teacher cannot write after substitution'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"email":"roster-admin@test.invalid","role":"authenticated"}',
  true
);

select is(
  jsonb_array_length(
    public.get_teacher_schedule_roster_context(
      array[
        '40000000-0000-4000-8000-000000000001'::uuid,
        '40000000-0000-4000-8000-000000000002'::uuid
      ]
    ) -> 'schedules'
  ),
  2,
  'admin can read both requested schedules'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$select public.get_teacher_schedule_roster_context(
    array['40000000-0000-4000-8000-000000000001'::uuid]
  )$$,
  null,
  null,
  'anonymous caller cannot execute roster RPC'
);

select * from finish();
rollback;
