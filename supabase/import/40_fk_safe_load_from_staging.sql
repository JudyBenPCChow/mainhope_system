-- FK-safe loader from staging tables.
-- Strategy:
-- - valid rows insert into production tables
-- - invalid FK rows are captured into staging.rejected_* tables
-- - no FK exception should stop the batch

begin;

-- reset reject queues for this run
delete from staging.rejected_enrollments;
delete from staging.rejected_schedules;
delete from staging.rejected_attendance;

-- 1) enrollments
insert into public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
select
  e.student_id,
  e.class_id,
  coalesce(nullif(trim(e.status), ''), '就讀中'),
  e.enroll_date,
  e.remarks
from staging.enrollments_import e
join public.students s on s.id = e.student_id
join public.classes c on c.id = e.class_id
where not exists (
  select 1 from public.student_class_enrollments x
  where x.student_id = e.student_id and x.class_id = e.class_id
);

insert into staging.rejected_enrollments (student_id, class_id, status, enroll_date, remarks, reject_reason)
select
  e.student_id,
  e.class_id,
  e.status,
  e.enroll_date,
  e.remarks,
  case
    when s.id is null and c.id is null then 'missing_student_and_class'
    when s.id is null then 'missing_student'
    when c.id is null then 'missing_class'
    else 'duplicate_or_filtered'
  end
from staging.enrollments_import e
left join public.students s on s.id = e.student_id
left join public.classes c on c.id = e.class_id
where s.id is null or c.id is null;

-- 2) schedules
insert into public.schedules (
  class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks
)
select
  s.class_id,
  case when s.teacher_id is not null and t.id is not null then s.teacher_id else null end,
  case when s.classroom_id is not null and r.id is not null then s.classroom_id else null end,
  s.scheduled_date,
  nullif(trim(s.start_time), ''),
  nullif(trim(s.end_time), ''),
  coalesce(nullif(trim(s.status), ''), '預定'),
  s.remarks
from staging.schedules_import s
join public.classes c on c.id = s.class_id
left join public.teachers t on t.id = s.teacher_id
left join public.classrooms r on r.id = s.classroom_id
where not exists (
  select 1
  from public.schedules x
  where x.class_id = s.class_id
    and x.scheduled_date = s.scheduled_date
    and coalesce(x.start_time, '') = coalesce(nullif(trim(s.start_time), ''), '')
    and coalesce(x.end_time, '') = coalesce(nullif(trim(s.end_time), ''), '')
);

insert into staging.rejected_schedules (
  class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks, reject_reason
)
select
  s.class_id,
  s.teacher_id,
  s.classroom_id,
  s.scheduled_date,
  s.start_time,
  s.end_time,
  s.status,
  s.remarks,
  case
    when c.id is null then 'missing_class'
    when s.scheduled_date is null then 'missing_date'
    else 'duplicate_or_filtered'
  end
from staging.schedules_import s
left join public.classes c on c.id = s.class_id
where c.id is null or s.scheduled_date is null;

-- 3) attendance
insert into public.attendance_details (
  student_id, class_id, attendance_date, status, remarks
)
select
  a.student_id,
  a.class_id,
  a.attendance_date,
  coalesce(nullif(trim(a.status), ''), '出席'),
  a.remarks
from staging.attendance_import a
join public.students s on s.id = a.student_id
join public.classes c on c.id = a.class_id
where a.attendance_date is not null
  and not exists (
    select 1
    from public.attendance_details x
    where x.student_id = a.student_id
      and x.class_id = a.class_id
      and x.attendance_date = a.attendance_date
  );

insert into staging.rejected_attendance (
  student_id, class_id, attendance_date, status, remarks, reject_reason
)
select
  a.student_id,
  a.class_id,
  a.attendance_date,
  a.status,
  a.remarks,
  case
    when s.id is null and c.id is null then 'missing_student_and_class'
    when s.id is null then 'missing_student'
    when c.id is null then 'missing_class'
    when a.attendance_date is null then 'missing_attendance_date'
    else 'duplicate_or_filtered'
  end
from staging.attendance_import a
left join public.students s on s.id = a.student_id
left join public.classes c on c.id = a.class_id
where s.id is null or c.id is null or a.attendance_date is null;

commit;
