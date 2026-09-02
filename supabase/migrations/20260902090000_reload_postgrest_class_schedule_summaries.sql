-- 20260901214000 已套用但該檔沒有 NOTIFY pgrst。
-- 其後 20260902040000 已 reload 過一次；本檔可重播，確保 Data API schema cache
-- 含 get_class_schedule_summaries。驗收必須走 PostgREST，不可只查 pg_proc。

begin;

notify pgrst, 'reload schema';

commit;
