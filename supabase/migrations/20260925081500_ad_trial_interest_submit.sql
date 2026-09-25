-- 廣告查詢頁：只寫潛在客戶與有興趣科目，不建試堂意向堂次。

begin;

alter table public.leads
  add column if not exists interested_subjects text[] not null default '{}';

comment on column public.leads.interested_subjects is
  '廣告查詢頁勾選的科目名稱。試堂登記頁仍以 lead_trial_intentions 記錄想試堂次。';

create or replace function public.ad_trial_interest_submit(
  p_full_name text,
  p_school text,
  p_grade text,
  p_phone text,
  p_note text default null,
  p_subjects text[] default null,
  p_company text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade text;
  v_phone text;
  v_name text;
  v_school text;
  v_note text;
  v_subjects text[] := '{}'::text[];
begin
  if nullif(btrim(coalesce(p_company, '')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;

  v_name := btrim(coalesce(p_full_name, ''));
  v_school := btrim(coalesce(p_school, ''));
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  v_grade := public.ad_trial_normalize_grade(p_grade);
  v_phone := public.ad_trial_normalize_phone(p_phone);

  if v_name = '' or char_length(v_name) > 80 then
    raise exception '請填寫姓名';
  end if;
  if v_school = '' or char_length(v_school) > 120 then
    raise exception '請填寫學校';
  end if;
  if v_grade is null then
    raise exception '請選擇年級';
  end if;
  if v_phone is null then
    raise exception '請填寫 8 位聯絡電話';
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception '備註過長';
  end if;

  select coalesce(array_agg(distinct s), '{}'::text[])
  into v_subjects
  from (
    select btrim(x) as s
    from unnest(coalesce(p_subjects, '{}'::text[])) as x
    where nullif(btrim(x), '') is not null
  ) cleaned
  where char_length(s) <= 40;

  if cardinality(v_subjects) < 1 then
    raise exception '請至少選擇一科';
  end if;
  if cardinality(v_subjects) > 20 then
    raise exception '一次最多選 20 科';
  end if;

  if exists (
    select 1
    from public.leads l
    where l.phone_normalized = v_phone
      and l.source = 'ad_trial'
      and l.created_at > now() - interval '24 hours'
  ) then
    return jsonb_build_object('accepted', true);
  end if;

  insert into public.leads (
    full_name,
    school,
    grade,
    phone,
    phone_normalized,
    note,
    source,
    status,
    interested_subjects
  ) values (
    v_name,
    v_school,
    v_grade,
    v_phone,
    v_phone,
    v_note,
    'ad_trial',
    'new',
    v_subjects
  );

  return jsonb_build_object('accepted', true);
end;
$$;

comment on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text) is
  '廣告查詢公開提交：只寫潛在客戶與有興趣科目。不寫堂次。p_company 為蜜罐。';

revoke all on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text) from public;
grant execute on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
