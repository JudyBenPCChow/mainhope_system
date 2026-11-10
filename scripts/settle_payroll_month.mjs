/**
 * 把即時計算的工資單 JSON 記為已結算並過帳成本帳。
 * 須先跑：node scripts/export_payroll_month_payslips.mjs YYYY-MM --json-only
 * 用法：node scripts/settle_payroll_month.mjs 2026-11
 *       node scripts/settle_payroll_month.mjs 2026-11 --dry-run
 */
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const monthKey = process.argv[2]
const dryRun = process.argv.includes("--dry-run")
const jsonArg = process.argv.find((arg, i, arr) => arr[i - 1] === "--json")
if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
  console.error("用法：node scripts/settle_payroll_month.mjs YYYY-MM [--json 路徑] [--dry-run]")
  process.exit(1)
}

const jsonPath = jsonArg ?? join(root, "docs", "generated", "payroll", monthKey, `${monthKey}_工資單.json`)
if (!existsSync(jsonPath)) {
  console.error(`找不到工資單 JSON：${jsonPath}\n請先：node scripts/export_payroll_month_payslips.mjs ${monthKey} --json-only`)
  process.exit(1)
}

const pack = JSON.parse(await readFile(jsonPath, "utf8"))
const teachers = Array.isArray(pack.teachers) ? pack.teachers : []
const snapshotTeachers = Array.isArray(pack.pdfTeachers) ? pack.pdfTeachers : teachers
const postable = teachers.filter((t) => !t.hardBlock && Number(t.gross) > 0)
const skipped = teachers.filter((t) => t.hardBlock || !(Number(t.gross) > 0))
const [year, month] = monthKey.split("-").map(Number)
const spentOn = `${monthKey}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`
const nowIso = new Date().toISOString()
const settledBy = "agent／對話結算"
const calcVersion = Number(pack.calcVersion ?? pack.pdfMonth?.calc?.version) || 1
const snapshot = {
  teachers: snapshotTeachers,
  calcVersion,
  settledAt: nowIso,
  hardBlockAnomalies: teachers
    .filter((t) => t.hardBlock)
    .map((t) => `${t.name}：${(t.anomalies ?? []).join("；")}`),
}

console.log(`月份 ${monthKey}　過帳 ${postable.length} 人　略過 ${skipped.length} 人`)
for (const t of postable) {
  console.log(`- ${t.name}　薪酬 ${t.gross}　僱主強積金 ${t.employerMpf ?? 0}`)
}
for (const t of skipped) {
  console.log(`略過 ${t.name}（${t.hardBlock ? "硬阻擋" : "金額 0"}）`)
}

if (dryRun) {
  console.log("dry-run：未寫庫")
  process.exit(0)
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function money(value) {
  return (Math.round(Number(value) * 100) / 100).toFixed(2)
}

function expenseTuple(teacher, kind) {
  const isLabor = kind === "labor"
  const title = isLabor
    ? `${teacher.name}｜計糧 ${monthKey} 薪酬`
    : `${teacher.name}｜計糧 ${monthKey} 僱主強積金`
  const amount = isLabor ? teacher.gross : teacher.employerMpf
  const code = isLabor ? "labor_tutor" : "labor_employer_mpf"
  const originKey = `payroll|${monthKey}|${teacher.id}|${code}`
  return `(
    ${sqlLiteral(spentOn)}::date,
    ${sqlLiteral(title)},
    ${money(amount)},
    ${sqlLiteral(teacher.id)}::uuid,
    ${sqlLiteral(originKey)},
    ${sqlLiteral(code)}
  )`
}

const expenseTuples = [
  ...postable.map((t) => expenseTuple(t, "labor")),
  ...postable.filter((t) => Number(t.employerMpf) > 0).map((t) => expenseTuple(t, "mpf")),
]

const expenseSql =
  expenseTuples.length === 0
    ? ""
    : `
insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label, ledger_account_id,
  ledger_status, teacher_id, origin, origin_key, created_by_label, notes
)
select
  v.spent_on,
  v.title,
  v.amount_hkd,
  'other',
  ${sqlLiteral(settledBy)},
  a.id,
  'confirmed',
  v.teacher_id,
  'payroll_settle',
  v.origin_key,
  ${sqlLiteral(settledBy)},
  '計糧結算自動過帳'
from (values
  ${expenseTuples.join(",\n  ")}
) as v(spent_on, title, amount_hkd, teacher_id, origin_key, account_code)
join public.expense_ledger_accounts a on a.code = v.account_code
on conflict (origin_key) do nothing;
`

const sql = `
begin;

do $$
declare
  st text;
begin
  select status into st from public.payroll_runs where month_key = ${sqlLiteral(monthKey)};
  if st = '已結算' then
    raise exception 'PAYROLL_ALREADY_SETTLED'
      using hint = ${sqlLiteral(`${monthKey} 已結算，拒絕覆寫`)};
  end if;
end $$;

insert into public.payroll_runs (
  month_key, status, snapshot, calc_version, calc_at, settled_by, settled_at, updated_at
) values (
  ${sqlLiteral(monthKey)},
  '已結算',
  ${sqlLiteral(JSON.stringify(snapshot))}::jsonb,
  ${calcVersion},
  ${sqlLiteral(nowIso)}::timestamptz,
  ${sqlLiteral(settledBy)},
  ${sqlLiteral(nowIso)}::timestamptz,
  ${sqlLiteral(nowIso)}::timestamptz
)
on conflict (month_key) do update
set status = '已結算',
    snapshot = excluded.snapshot,
    calc_version = excluded.calc_version,
    calc_at = excluded.calc_at,
    settled_by = excluded.settled_by,
    settled_at = excluded.settled_at,
    updated_at = excluded.updated_at
where public.payroll_runs.status is distinct from '已結算';

${expenseSql}

select jsonb_build_object(
  'monthKey', ${sqlLiteral(monthKey)},
  'posted', ${postable.length},
  'skipped', ${skipped.length},
  'status', (select status from public.payroll_runs where month_key = ${sqlLiteral(monthKey)})
) as payload;

commit;
`

function supabaseBin() {
  const home = process.env.HOME ?? ""
  const candidates = [join(home, ".local/bin/supabase"), "/tmp/supabase-cli/supabase"]
  return candidates.find((path) => existsSync(path)) ?? "supabase"
}

const dir = await mkdtemp(join(tmpdir(), "payroll-settle-"))
const file = join(dir, "settle.sql")
await writeFile(file, sql)
await new Promise((resolve, reject) => {
  execFile(
    supabaseBin(),
    ["db", "query", "--linked", "-o", "json", "-f", file],
    { cwd: root, maxBuffer: 20 * 1024 * 1024, timeout: 180000 },
    (error, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout)
      if (error) reject(new Error(stderr || error.message))
      else resolve()
    }
  )
})
