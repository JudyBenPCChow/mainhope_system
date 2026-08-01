-- courses：管理層（admin／manager／alien）可讀
-- 先前 SELECT 只准 is_admin()（另有 teacher／alien／portal）；
-- manager 大量頁面 embed courses.course_name，會變成空名（同 payment_discounts 誤標問題同類）。

drop policy if exists rls_phase_c_admin_select_courses on public.courses;
drop policy if exists rls_mgmt_select_courses on public.courses;

create policy rls_mgmt_select_courses
on public.courses
for select
to authenticated
using (public.is_mgmt_staff());

comment on policy rls_mgmt_select_courses on public.courses is
  'admin／manager／alien 可讀課程主檔（班別／排程／報表 embed）；寫入仍僅 alien。';
