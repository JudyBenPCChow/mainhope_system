-- 試堂可關聯已收款收據（半價／原價精靈完成後回寫）

begin;

alter table public.trial_sessions
  add column if not exists payment_id uuid references public.payments (id) on delete set null;

create index if not exists idx_trial_sessions_payment_id on public.trial_sessions (payment_id);

comment on column public.trial_sessions.payment_id is
  '半價／原價試堂對應之繳費單；免費試堂可為 null';

commit;
