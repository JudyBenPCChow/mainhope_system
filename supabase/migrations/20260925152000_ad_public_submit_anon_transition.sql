-- 過渡期：舊 production 前端仍直呼 submit RPC。
-- 新前端改走 Edge `ad-public-submit`；限速已在 RPC 內。
-- 待 Vercel 發佈含 Edge 呼叫的前端後，可另開 migration 撤銷 anon execute。

begin;

grant execute on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text, text, text, text, text)
  to anon, authenticated, service_role;

grant execute on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text, text, text, text, text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
