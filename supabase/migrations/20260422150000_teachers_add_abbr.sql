-- 老師內部簡稱／代碼（ABBR）；寫入權限由前端依 mgmt_role=alien 限制（本專案 RLS 仍為開發用全開）

alter table public.teachers
  add column if not exists abbr text;

comment on column public.teachers.abbr is '內部簡稱或代碼（ABBR），供報表／介面辨識；僅應由「外星人」角色於前端修改。';
