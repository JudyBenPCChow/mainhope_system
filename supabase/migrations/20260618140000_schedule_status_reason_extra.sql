-- 排程狀態擴充：取消原因、加堂標記，並把舊狀態「預定」改名為「正常」。
-- 「加堂」為獨立布林標記，可與 正常／完成／取消 並存；取消時於 cancel_reason 記錄原因。

alter table public.schedules add column if not exists cancel_reason text;
alter table public.schedules add column if not exists is_extra_lesson boolean not null default false;

-- 預設狀態由「預定」改為「正常」
alter table public.schedules alter column status set default '正常';

-- 既有資料遷移：預定 → 正常
update public.schedules set status = '正常' where status = '預定';
