-- 同一學生不可對同一排程建立多筆請假紀錄
delete from public.leave_makeup_records
where id in (
 select id
 from (
  select
   id,
   row_number() over (
    partition by student_id, schedule_id
    order by created_at asc, id asc
   ) as rn
  from public.leave_makeup_records
  where schedule_id is not null
 ) ranked
 where rn > 1
);

create unique index if not exists leave_makeup_records_student_schedule_unique
 on public.leave_makeup_records (student_id, schedule_id)
 where schedule_id is not null;
