-- subjects / academic_years / courses 為班別重構後新增表，需與其他業務表一致的 dev RLS 政策
-- （否則 PostgREST + anon key 會回傳 HTTP 200 但 rows=[]，SQL Editor 仍可見資料）

alter table public.subjects enable row level security;
alter table public.academic_years enable row level security;
alter table public.courses enable row level security;

drop policy if exists dev_anon_all_subjects on public.subjects;
drop policy if exists dev_auth_all_subjects on public.subjects;
create policy dev_anon_all_subjects on public.subjects for all to anon using (true) with check (true);
create policy dev_auth_all_subjects on public.subjects for all to authenticated using (true) with check (true);

drop policy if exists dev_anon_all_academic_years on public.academic_years;
drop policy if exists dev_auth_all_academic_years on public.academic_years;
create policy dev_anon_all_academic_years on public.academic_years for all to anon using (true) with check (true);
create policy dev_auth_all_academic_years on public.academic_years for all to authenticated using (true) with check (true);

drop policy if exists dev_anon_all_courses on public.courses;
drop policy if exists dev_auth_all_courses on public.courses;
create policy dev_anon_all_courses on public.courses for all to anon using (true) with check (true);
create policy dev_auth_all_courses on public.courses for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.subjects to anon, authenticated;
grant select, insert, update, delete on public.academic_years to anon, authenticated;
grant select, insert, update, delete on public.courses to anon, authenticated;
