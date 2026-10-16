-- 到課宣告作廢原因（稽核／清理用；不取代補回日名冊繼承）
-- 產品：enrollment-declaration-transfer-and-purge.md D8

alter table public.attendance_declarations
  add column if not exists void_reason text;

comment on column public.attendance_declarations.void_reason is
  '作廢原因：enrollment_withdrawn（退讀／轉時間）、enrollment_purged（手誤清除）、class_cancelled（堂取消／軟取消）。僅 status=void 有意義；不作繼承日閘真源。';
