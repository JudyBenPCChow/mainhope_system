-- 防止 schedules.teacher_id 空白：老師時間表／點名紙依排程老師篩選，
-- 若先建排程、後填班別主責，或 bulk 寫入漏帶 teacher_id，老師端會看不到有學生的堂。
--
-- 1) 回填既有「班別有主責、排程無老師、非代堂」列
-- 2) INSERT 時若未指定 teacher_id，自動取 classes.teacher_id
-- 3) 班別主責變更／首次指定時，回填該班仍空白的非代堂排程

begin;

-- ── 1) one-time backfill（idempotent）────────────────────────────────────
update public.schedules s
set teacher_id = c.teacher_id,
    updated_at = now()
from public.classes c
where s.class_id = c.id
  and s.teacher_id is null
  and s.original_teacher_id is null
  and c.teacher_id is not null;

-- ── 2) INSERT default from class ─────────────────────────────────────────
create or replace function public.schedules_default_teacher_from_class()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.teacher_id is null
     and new.class_id is not null
     and new.original_teacher_id is null then
    select c.teacher_id
      into new.teacher_id
    from public.classes c
    where c.id = new.class_id;
  end if;
  return new;
end;
$$;

comment on function public.schedules_default_teacher_from_class() is
  'BEFORE INSERT：未指定 schedules.teacher_id 時，複製 classes.teacher_id（代堂列不處理）。';

drop trigger if exists trg_schedules_default_teacher_from_class on public.schedules;
create trigger trg_schedules_default_teacher_from_class
  before insert on public.schedules
  for each row
  execute function public.schedules_default_teacher_from_class();

-- ── 3) class teacher assigned / changed → fill null schedule teachers ────
create or replace function public.classes_backfill_null_schedule_teachers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.teacher_id is not null
     and (tg_op = 'INSERT' or new.teacher_id is distinct from old.teacher_id) then
    update public.schedules s
    set teacher_id = new.teacher_id,
        updated_at = now()
    where s.class_id = new.id
      and s.teacher_id is null
      and s.original_teacher_id is null;
  end if;
  return new;
end;
$$;

comment on function public.classes_backfill_null_schedule_teachers() is
  '班別指定／更換主責老師時，回填該班仍空白且非代堂的 schedules.teacher_id。'
  '不覆寫已有老師或代堂列（永久換主責仍依產品規則手動處理有值排程）。';

drop trigger if exists trg_classes_backfill_null_schedule_teachers on public.classes;
create trigger trg_classes_backfill_null_schedule_teachers
  after insert or update of teacher_id on public.classes
  for each row
  execute function public.classes_backfill_null_schedule_teachers();

commit;
