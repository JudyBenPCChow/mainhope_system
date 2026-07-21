begin;

create table public.legacy_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_system text not null default 'notion',
  source_filename text not null,
  period_start date not null,
  period_end date not null,
  total_source_rows integer not null default 0 check (total_source_rows >= 0),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  unmatched_count integer not null default 0 check (unmatched_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

comment on table public.legacy_import_batches is
  '一次性舊報讀匯入批次；供核對、封存及按批次退場。';

create table public.legacy_student_subject_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  source_system text not null default 'notion',
  source_student_ref text,
  source_student_name text not null,
  source_subject_label text not null,
  import_batch_id uuid not null references public.legacy_import_batches(id) on delete cascade,
  imported_at timestamptz not null default now(),
  check (period_end >= period_start),
  constraint legacy_student_subject_period_unique
    unique (student_id, subject_id, period_start, period_end)
);

comment on table public.legacy_student_subject_enrollments is
  '只供宣傳配對的舊學生科目事實；不代表現行班別報讀或在讀狀態。';
comment on column public.legacy_student_subject_enrollments.source_student_ref is
  'Notion 學生 page ID 等穩定來源識別，用於匯入核對。';

create index legacy_student_subject_subject_student_idx
  on public.legacy_student_subject_enrollments (subject_id, student_id);
create index legacy_student_subject_batch_idx
  on public.legacy_student_subject_enrollments (import_batch_id);

alter table public.legacy_import_batches enable row level security;
alter table public.legacy_student_subject_enrollments enable row level security;

revoke all on table public.legacy_import_batches from anon;
revoke all on table public.legacy_student_subject_enrollments from anon;
grant select, insert, update, delete on table public.legacy_import_batches to authenticated;
grant select, insert, update, delete on table public.legacy_student_subject_enrollments to authenticated;

create policy legacy_import_batches_mgmt_all
on public.legacy_import_batches
for all
to authenticated
using (public.is_admin() or public.is_alien())
with check (public.is_admin() or public.is_alien());

create policy legacy_student_subject_enrollments_mgmt_all
on public.legacy_student_subject_enrollments
for all
to authenticated
using (public.is_admin() or public.is_alien())
with check (public.is_admin() or public.is_alien());

commit;
