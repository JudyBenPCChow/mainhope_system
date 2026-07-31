-- 廢除行政後台「待辦看板」：清空歷史列。
-- 表結構保留（家長 Portal 通告 schema／老師 RLS helper 仍引用 calendar_event_*）；
-- 後台已無 UI 再寫入；Portal getNotices 若無列則為空。

delete from public.calendar_events;
delete from public.admin_todos;
