-- 已於 production 套用（20260925140000）；補入 repo 以對齊遠端歷史。
-- 廣告表單電話國碼：+852／+86；normalize_phone 雙參數。

begin;

alter table public.leads
  add column if not exists phone_country_code text not null default '+852';

alter table public.leads
  drop constraint if exists leads_phone_country_code_check;

alter table public.leads
  add constraint leads_phone_country_code_check
  check (phone_country_code in ('+852', '+86'));

comment on column public.leads.phone_country_code is
  'WhatsApp 電話國碼：+852 或 +86。WeChat 列可維持 +852 預設。';

drop function if exists public.ad_trial_normalize_phone(text);

create or replace function public.ad_trial_normalize_phone(
  p_raw text,
  p_country_code text default '+852'
)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  digits text;
  cc text;
begin
  cc := case
    when btrim(coalesce(p_country_code, '')) in ('+86', '86') then '+86'
    else '+852'
  end;
  digits := regexp_replace(coalesce(p_raw, ''), '\D', '', 'g');
  if cc = '+86' then
    if digits ~ '^86[0-9]{11}$' then
      digits := substring(digits from 3);
    end if;
    if digits ~ '^[0-9]{11}$' then
      return digits;
    end if;
    return null;
  end if;
  if digits ~ '^852[0-9]{8}$' then
    digits := substring(digits from 4);
  end if;
  if digits ~ '^[0-9]{8}$' then
    return digits;
  end if;
  return null;
end;
$$;

revoke all on function public.ad_trial_normalize_phone(text, text) from public, anon, authenticated;

-- 函式本體已在 production；此檔僅對齊 schema／歷史。submit 簽名見後續 hardening。

notify pgrst, 'reload schema';

commit;
