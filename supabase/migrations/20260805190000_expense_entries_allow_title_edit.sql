-- 已確認成本列：允許改標題（仍鎖金額／日期／科目／老師／支付；改科目須 reopen）

create or replace function public.expense_entries_guard_update()
returns trigger
language plpgsql
as $$
begin
  -- 已 void：禁止救回或改金額／日期／科目／來源
  if old.voided_at is not null then
    if new.voided_at is distinct from old.voided_at
       or new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.ledger_account_id is distinct from old.ledger_account_id
       or new.ledger_status is distinct from old.ledger_status
       or new.teacher_id is distinct from old.teacher_id
       or new.origin is distinct from old.origin
       or new.origin_key is distinct from old.origin_key
       or new.title is distinct from old.title
       or new.pay_method is distinct from old.pay_method
    then
      raise exception '已作廢成本列不可修改關鍵欄；請另開新單。';
    end if;
    return new;
  end if;

  -- 來源／冪等鍵永遠不可改
  if new.origin is distinct from old.origin
     or new.origin_key is distinct from old.origin_key
  then
    raise exception '成本列來源（origin／origin_key）不可修改。';
  end if;

  -- confirmed：鎖金額／日期／老師／支付／科目；標題可改；科目須先 reopen
  if old.ledger_status = 'confirmed' and new.ledger_status = 'confirmed' then
    if new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.teacher_id is distinct from old.teacher_id
       or new.class_id is distinct from old.class_id
       or new.subject_code is distinct from old.subject_code
       or new.pay_method is distinct from old.pay_method
       or new.ledger_account_id is distinct from old.ledger_account_id
    then
      raise exception '已確認成本列鎖金額／日期／科目；請先 reopen（改為待覆核）再改科目。';
    end if;
  end if;

  -- reopen：只准 pending_review，其餘關鍵欄仍鎖（payroll／已確認金額）
  if old.ledger_status = 'confirmed' and new.ledger_status = 'pending_review' then
    if new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.teacher_id is distinct from old.teacher_id
       or new.origin is distinct from old.origin
       or new.origin_key is distinct from old.origin_key
    then
      raise exception 'reopen 只准改科目分類，不可改金額／日期／老師／來源。';
    end if;
    -- reopen 當下唔改科目；之後 pending 再改
    if new.ledger_account_id is distinct from old.ledger_account_id then
      raise exception '請先 reopen，再於待覆核狀態改科目。';
    end if;
  end if;

  -- 計糧過帳列：即使 pending 亦鎖金額／老師／日期
  if old.origin = 'payroll_settle' then
    if new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.teacher_id is distinct from old.teacher_id
    then
      raise exception '計糧過帳列不可改金額／日期／老師。';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;
