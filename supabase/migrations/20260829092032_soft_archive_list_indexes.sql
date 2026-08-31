-- 軟封存日常列表：學生學業階段、班別學年查找
-- 只新增索引，不改既有約束／欄位

begin;

create index if not exists students_academic_stage_idx
  on public.students (academic_stage);

create index if not exists classes_academic_year_id_idx
  on public.classes (academic_year_id);

commit;
