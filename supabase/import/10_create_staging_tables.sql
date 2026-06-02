-- Create CSV staging tables (run once, can be re-run safely)

create schema if not exists staging;

create table if not exists staging.students_import (
  id uuid,
  old_student_id text,
  student_code text,
  full_name text not null,
  english_name text,
  gender text,
  date_of_birth date,
  grade text,
  school text,
  status text,
  registration_status text,
  enrollment_status text,
  academic_stage text,
  parent_name text,
  parent_relationship text,
  parent_phone text,
  whatsapp text,
  address text,
  remarks text,
  created_at timestamptz,
  updated_at timestamptz,
  preferred_contact_method text,
  parent_phone_country_code text,
  student_phone text,
  student_phone_country_code text,
  primary_contact_person text
);

create table if not exists staging.classes_import (
  class_id uuid primary key,
  academic_year_label text not null,
  subject_name text not null,
  grade_code text not null,
  course_seq integer not null,
  section_code text,
  day_of_week text,
  time_slot text,
  teacher_id uuid,
  classroom_id uuid,
  capacity integer,
  price_per_lesson numeric,
  start_date date,
  end_date date,
  status text
);

create table if not exists staging.enrollments_import (
  student_id uuid not null,
  class_id uuid not null,
  status text,
  enroll_date date,
  remarks text
);

create table if not exists staging.schedules_import (
  class_id uuid not null,
  teacher_id uuid,
  classroom_id uuid,
  scheduled_date date not null,
  start_time text,
  end_time text,
  status text,
  remarks text
);

create table if not exists staging.attendance_import (
  student_id uuid not null,
  class_id uuid not null,
  attendance_date date not null,
  status text,
  remarks text
);
