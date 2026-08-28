-- 2627 學年轉換：刷新 is_current、2627 常規優惠

begin;

-- 依 current_date 重算唯一 is_current（26SM 暑期 / 2627 常規自動切換）
create or replace function public.refresh_academic_year_is_current()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.academic_years set is_current = false;
  update public.academic_years
  set is_current = true
  where current_date between start_date and end_date;
end;
$$;

comment on function public.refresh_academic_year_is_current() is
  'Recalculate academic_years.is_current from current_date. Call after calendar rollover or ad hoc.';

select public.refresh_academic_year_is_current();

-- 2627 常規學年優惠（與 26SM 暑期分開）
insert into public.payment_discounts (name, amount_off, academic_year, is_active, sort_order)
select '主副科', 100, '2627', true, 52
where not exists (
  select 1 from public.payment_discounts
  where name = '主副科' and academic_year = '2627'
);

insert into public.payment_discounts (name, amount_off, academic_year, is_active, sort_order)
select '三科同報', 100, '2627', true, 53
where not exists (
  select 1 from public.payment_discounts
  where name = '三科同報' and academic_year = '2627'
);

commit;
