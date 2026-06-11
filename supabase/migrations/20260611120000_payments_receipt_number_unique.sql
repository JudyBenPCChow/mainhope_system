-- 單據編號唯一性：非空 receipt_number 不得重複

create unique index if not exists payments_receipt_number_unique_idx
on public.payments (receipt_number)
where receipt_number is not null;
