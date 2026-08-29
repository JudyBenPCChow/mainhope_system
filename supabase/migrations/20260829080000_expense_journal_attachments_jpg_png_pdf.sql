-- 日記帳附件只准 JPG／PNG／PDF。
-- 套用：npm run db:apply -- supabase/migrations/20260829080000_expense_journal_attachments_jpg_png_pdf.sql

begin;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']::text[]
where id = 'expense-journal-attachments';

commit;
