-- FK-safe import reject tables
create schema if not exists staging;

create table if not exists staging.rejected_enrollments (
  student_id uuid,
  class_id uuid,
  status text,
  enroll_date date,
  remarks text,
  reject_reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists staging.rejected_schedules (
  class_id uuid,
  teacher_id uuid,
  classroom_id uuid,
  scheduled_date date,
  start_time text,
  end_time text,
  status text,
  remarks text,
  reject_reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists staging.rejected_attendance (
  student_id uuid,
  class_id uuid,
  attendance_date date,
  status text,
  remarks text,
  reject_reason text not null,
  created_at timestamptz not null default now()
);
