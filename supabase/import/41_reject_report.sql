-- Report rejected rows after FK-safe loader

select 'rejected_enrollments' as table_name, count(*) as row_count
from staging.rejected_enrollments
union all
select 'rejected_schedules', count(*) from staging.rejected_schedules
union all
select 'rejected_attendance', count(*) from staging.rejected_attendance;

select reject_reason, count(*) as cnt
from staging.rejected_enrollments
group by reject_reason
order by cnt desc, reject_reason;

select reject_reason, count(*) as cnt
from staging.rejected_schedules
group by reject_reason
order by cnt desc, reject_reason;

select reject_reason, count(*) as cnt
from staging.rejected_attendance
group by reject_reason
order by cnt desc, reject_reason;
