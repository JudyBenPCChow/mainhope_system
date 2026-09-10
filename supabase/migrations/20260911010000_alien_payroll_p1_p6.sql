-- 外星人可做計糧財務預備 P1–P6（審閱／排除／重算／提交等），與財務同等寫入能力。
-- 產品覆寫：原定外星人只做 P7–P10；營運需要外星人可代財務完成整段審閱提交。

insert into private.authz_role_capabilities (role, capability_key)
select 'alien', k
from unnest(array[
  'payroll.prepare',
  'payroll.review',
  'payroll.exclude',
  'payroll.adjust.request',
  'payroll.hours',
  'payroll.submit'
]::text[]) as k
on conflict (role, capability_key) do nothing;

update private.authz_meta
set authz_version = 13,
    updated_at = now()
where id = 1;
