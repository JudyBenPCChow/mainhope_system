-- ad_trial_catalog_get 會 INSERT 限速事件，不可標 STABLE（會落 read-only txn）。

begin;

alter function public.ad_trial_catalog_get(text) volatile;

notify pgrst, 'reload schema';

commit;
