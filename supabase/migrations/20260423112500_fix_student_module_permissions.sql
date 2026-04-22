-- 學生模組權限基線（開發用）：
-- 避免學生頁各子功能因單表缺 policy/grant 而 permission denied

do $$
declare
  t text;
  tables text[] := array[
    'students',
    'student_class_enrollments',
    'enrollment_change_events',
    'student_relationships',
    'student_status_history',
    'leave_makeup_records',
    'payments',
    'payment_details',
    'attendance_details',
    'classes'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists dev_anon_all_%I on public.%I;', t, t);
    execute format('drop policy if exists dev_auth_all_%I on public.%I;', t, t);
    execute format('create policy dev_anon_all_%I on public.%I for all to anon using (true) with check (true);', t, t);
    execute format('create policy dev_auth_all_%I on public.%I for all to authenticated using (true) with check (true);', t, t);
    execute format('grant select, insert, update, delete on table public.%I to anon, authenticated;', t);
  end loop;
end $$;

