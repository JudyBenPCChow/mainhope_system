/**
 * HK 成本帳：科目／建議／入帳／儀表板彙總；計糧結算過帳。
 * 計劃：docs/product/plans/2026-08-05-hk-expense-cost-stats.md
 */
import {
  expensePayMethodLabel,
  isExpensePayMethod,
  type ExpensePayMethod,
} from "@/lib/expensePayMethods"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import type { PayrollTeacherRow } from "@/components/payroll/mockData"

export type ExpenseAccountGroup = "direct" | "overhead"
export type ExpenseLedgerStatus = "pending_review" | "confirmed"
export type ExpenseOrigin = "manual" | "payroll_settle" | "history_import"

export type ExpenseLedgerAccount = {
  id: string
  code: string
  label: string
  accountGroup: ExpenseAccountGroup
  subject: string | null
  sortOrder: number
  active: boolean
}

export type ExpenseCategoryRule = {
  id: string
  pattern: string
  ledgerAccountId: string | null
  forcePending: boolean
  hint: string | null
  priority: number
  active: boolean
}

export type ExpenseEntry = {
  id: string
  spentOn: string
  title: string
  amountHkd: number
  payMethod: ExpensePayMethod
  payMethodLabel: string
  ownerLabel: string | null
  ledgerAccountId: string | null
  ledgerAccountCode: string | null
  ledgerAccountLabel: string | null
  accountGroup: ExpenseAccountGroup | null
  ledgerStatus: ExpenseLedgerStatus
  suggestedAccountId: string | null
  suggestionHint: string | null
  notes: string | null
  voidedAt: string | null
  voidReason: string | null
  voidedByLabel: string | null
  teacherId: string | null
  teacherName: string | null
  classId: string | null
  subjectCode: string | null
  origin: ExpenseOrigin
  originKey: string | null
  createdByLabel: string | null
  createdAt: string
  updatedAt: string
}

export type ExpenseSuggestResult = {
  ledgerAccountId: string | null
  forcePending: boolean
  hint: string | null
  matchedPattern: string | null
}

export type CreateExpenseEntryInput = {
  spentOn: string
  title: string
  amountHkd: number
  payMethod: ExpensePayMethod
  ownerLabel?: string | null
  ledgerAccountId?: string | null
  notes?: string | null
  teacherId?: string | null
  subjectCode?: string | null
  /** 若 true（預設），依規則預填建議並強制 pending */
  applySuggest?: boolean
}

export type ExpenseEntryFilters = {
  monthKey?: string
  ledgerStatus?: ExpenseLedgerStatus | "all"
  accountId?: string | "all"
  origin?: ExpenseOrigin | "all"
  includeVoided?: boolean
  q?: string
}

export type ExpenseMonthDashboard = {
  monthKey: string
  totalConfirmed: number
  totalDirect: number
  totalOverhead: number
  laborTotal: number
  pendingCount: number
  pendingAmount: number
  byAccount: {
    accountId: string
    code: string
    label: string
    accountGroup: ExpenseAccountGroup
    amount: number
  }[]
  byTeacher: {
    teacherId: string
    teacherName: string
    laborTutor: number
    employerMpf: number
    total: number
  }[]
  monthlyTrend: {
    monthKey: string
    totalConfirmed: number
    laborTotal: number
    pendingAmount: number
  }[]
}

type RawRow = Record<string, unknown>

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("尚未設定 Supabase")
  }
  return supabase
}

function asAccount(row: RawRow): ExpenseLedgerAccount {
  const group = String(row.account_group ?? "")
  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? ""),
    label: String(row.label ?? ""),
    accountGroup: group === "overhead" ? "overhead" : "direct",
    subject: row.subject != null ? String(row.subject) : null,
    sortOrder: Number(row.sort_order ?? 0),
    active: Boolean(row.active),
  }
}

function asRule(row: RawRow): ExpenseCategoryRule {
  return {
    id: String(row.id ?? ""),
    pattern: String(row.pattern ?? ""),
    ledgerAccountId: row.ledger_account_id != null ? String(row.ledger_account_id) : null,
    forcePending: Boolean(row.force_pending),
    hint: row.hint != null ? String(row.hint) : null,
    priority: Number(row.priority ?? 100),
    active: Boolean(row.active),
  }
}

function embedOne(raw: unknown): RawRow | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return (raw[0] as RawRow | undefined) ?? null
  if (typeof raw === "object") return raw as RawRow
  return null
}

function asEntry(row: RawRow): ExpenseEntry {
  const account = embedOne(row.expense_ledger_accounts)
  const teacher = embedOne(row.teachers)
  const payMethodRaw = String(row.pay_method ?? "other")
  const payMethod: ExpensePayMethod = isExpensePayMethod(payMethodRaw) ? payMethodRaw : "other"
  const group = account ? String(account.account_group ?? "") : ""
  const status = String(row.ledger_status ?? "pending_review")
  const origin = String(row.origin ?? "manual")
  return {
    id: String(row.id ?? ""),
    spentOn: String(row.spent_on ?? ""),
    title: String(row.title ?? ""),
    amountHkd: Number(row.amount_hkd ?? 0),
    payMethod,
    payMethodLabel: expensePayMethodLabel(payMethod),
    ownerLabel: row.owner_label != null ? String(row.owner_label) : null,
    ledgerAccountId: row.ledger_account_id != null ? String(row.ledger_account_id) : null,
    ledgerAccountCode: account ? String(account.code ?? "") : null,
    ledgerAccountLabel: account ? String(account.label ?? "") : null,
    accountGroup: account ? (group === "overhead" ? "overhead" : "direct") : null,
    ledgerStatus: status === "confirmed" ? "confirmed" : "pending_review",
    suggestedAccountId:
      row.suggested_account_id != null ? String(row.suggested_account_id) : null,
    suggestionHint: row.suggestion_hint != null ? String(row.suggestion_hint) : null,
    notes: row.notes != null ? String(row.notes) : null,
    voidedAt: row.voided_at != null ? String(row.voided_at) : null,
    voidReason: row.void_reason != null ? String(row.void_reason) : null,
    voidedByLabel: row.voided_by_label != null ? String(row.voided_by_label) : null,
    teacherId: row.teacher_id != null ? String(row.teacher_id) : null,
    teacherName: teacher
      ? String(teacher.full_name ?? teacher.abbr ?? "")
      : null,
    classId: row.class_id != null ? String(row.class_id) : null,
    subjectCode: row.subject_code != null ? String(row.subject_code) : null,
    origin:
      origin === "payroll_settle" || origin === "history_import" ? origin : "manual",
    originKey: row.origin_key != null ? String(row.origin_key) : null,
    createdByLabel: row.created_by_label != null ? String(row.created_by_label) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  }
}

export function monthKeyLastDay(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  if (!y || !m) throw new Error(`無效 month_key：${monthKey}`)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${monthKey}-${String(last).padStart(2, "0")}`
}

export function defaultExpenseMonthKey(now = new Date()): string {
  const y = now.getFullYear()
  const m = now.getMonth() // 0-based；預設上一個曆月
  const d = new Date(y, m - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function expenseOriginLabel(origin: ExpenseOrigin): string {
  if (origin === "payroll_settle") return "計糧過帳"
  if (origin === "history_import") return "歷史匯入"
  return "人手入帳"
}

export async function fetchExpenseAccounts(opts?: {
  activeOnly?: boolean
}): Promise<ExpenseLedgerAccount[]> {
  const client = requireClient()
  let q = client
    .from("expense_ledger_accounts")
    .select("id, code, label, account_group, subject, sort_order, active")
    .order("sort_order", { ascending: true })
  if (opts?.activeOnly !== false) q = q.eq("active", true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => asAccount(r as RawRow))
}

export async function fetchExpenseCategoryRules(): Promise<ExpenseCategoryRule[]> {
  const client = requireClient()
  const { data, error } = await client
    .from("expense_category_rules")
    .select("id, pattern, ledger_account_id, force_pending, hint, priority, active")
    .eq("active", true)
    .order("priority", { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => asRule(r as RawRow))
}

export function suggestExpenseAccount(
  title: string,
  rules: ExpenseCategoryRule[]
): ExpenseSuggestResult {
  const t = title.trim().toLowerCase()
  if (!t) {
    return { ledgerAccountId: null, forcePending: false, hint: null, matchedPattern: null }
  }
  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  for (const rule of sorted) {
    if (!rule.active) continue
    const p = rule.pattern.trim().toLowerCase()
    if (!p) continue
    if (t.includes(p)) {
      return {
        ledgerAccountId: rule.ledgerAccountId,
        forcePending: rule.forcePending,
        hint: rule.hint,
        matchedPattern: rule.pattern,
      }
    }
  }
  return { ledgerAccountId: null, forcePending: false, hint: null, matchedPattern: null }
}

const ENTRY_SELECT = `
  id, spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, voided_at, void_reason, voided_by_label,
  teacher_id, class_id, subject_code, origin, origin_key,
  created_by_label, created_at, updated_at,
  expense_ledger_accounts!expense_entries_ledger_account_id_fkey ( id, code, label, account_group ),
  teachers!expense_entries_teacher_id_fkey ( id, full_name, abbr )
`

export async function fetchExpenseEntries(
  filters: ExpenseEntryFilters = {}
): Promise<ExpenseEntry[]> {
  const client = requireClient()
  let q = client
    .from("expense_entries")
    .select(ENTRY_SELECT)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500)

  if (filters.monthKey) {
    const from = `${filters.monthKey}-01`
    const to = monthKeyLastDay(filters.monthKey)
    q = q.gte("spent_on", from).lte("spent_on", to)
  }
  if (filters.ledgerStatus && filters.ledgerStatus !== "all") {
    q = q.eq("ledger_status", filters.ledgerStatus)
  }
  if (filters.accountId && filters.accountId !== "all") {
    q = q.eq("ledger_account_id", filters.accountId)
  }
  if (filters.origin && filters.origin !== "all") {
    q = q.eq("origin", filters.origin)
  }
  if (!filters.includeVoided) {
    q = q.is("voided_at", null)
  }
  if (filters.q?.trim()) {
    q = q.ilike("title", `%${filters.q.trim()}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => asEntry(r as RawRow))
}

export async function createExpenseEntry(
  input: CreateExpenseEntryInput
): Promise<ExpenseEntry> {
  const client = requireClient()
  const title = input.title.trim()
  if (!title) throw new Error("請填寫標題")
  if (!input.spentOn) throw new Error("請選擇日期")
  if (!Number.isFinite(input.amountHkd) || input.amountHkd === 0) {
    throw new Error("金額不可為 0")
  }

  let ledgerAccountId = input.ledgerAccountId ?? null
  let suggestedAccountId: string | null = null
  let suggestionHint: string | null = null
  let forcePending = false

  if (input.applySuggest !== false) {
    const rules = await fetchExpenseCategoryRules()
    const sug = suggestExpenseAccount(title, rules)
    suggestedAccountId = sug.ledgerAccountId
    suggestionHint = sug.hint
    forcePending = sug.forcePending
    if (!ledgerAccountId && sug.ledgerAccountId) ledgerAccountId = sug.ledgerAccountId
  }

  const { data, error } = await client
    .from("expense_entries")
    .insert({
      spent_on: input.spentOn,
      title,
      amount_hkd: Math.round(input.amountHkd * 100) / 100,
      pay_method: input.payMethod,
      owner_label: input.ownerLabel?.trim() || null,
      ledger_account_id: ledgerAccountId,
      ledger_status: "pending_review",
      suggested_account_id: suggestedAccountId,
      suggestion_hint: suggestionHint,
      notes: input.notes?.trim() || null,
      teacher_id: input.teacherId || null,
      subject_code: input.subjectCode?.trim() || null,
      origin: "manual",
    })
    .select(ENTRY_SELECT)
    .single()

  if (error) throw new Error(error.message)
  const entry = asEntry(data as RawRow)
  if (forcePending && suggestionHint) {
    return { ...entry, suggestionHint }
  }
  return entry
}

export async function confirmExpenseEntries(ids: string[]): Promise<void> {
  const client = requireClient()
  if (ids.length === 0) return
  const nowIso = new Date().toISOString()
  const { error } = await client
    .from("expense_entries")
    .update({ ledger_status: "confirmed", updated_at: nowIso })
    .in("id", ids)
    .is("voided_at", null)
    .eq("ledger_status", "pending_review")
    .not("ledger_account_id", "is", null)
  if (error) throw new Error(error.message)
}

export async function reopenExpenseEntry(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from("expense_entries")
    .update({
      ledger_status: "pending_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("voided_at", null)
    .eq("ledger_status", "confirmed")
  if (error) throw new Error(error.message)
}

export async function reclassifyExpenseEntry(
  id: string,
  ledgerAccountId: string
): Promise<void> {
  const client = requireClient()
  if (!ledgerAccountId) throw new Error("請選擇科目")
  const { error } = await client
    .from("expense_entries")
    .update({
      ledger_account_id: ledgerAccountId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("voided_at", null)
    .eq("ledger_status", "pending_review")
  if (error) throw new Error(error.message)
}

export async function updateExpenseEntryTitle(
  id: string,
  title: string
): Promise<void> {
  const client = requireClient()
  const t = title.trim()
  if (!t) throw new Error("請填寫標題")
  const { error } = await client
    .from("expense_entries")
    .update({
      title: t,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("voided_at", null)
  if (error) throw new Error(error.message)
}

export async function voidExpenseEntry(id: string, reason: string): Promise<void> {
  const client = requireClient()
  const r = reason.trim()
  if (!r) throw new Error("請填寫作廢原因")
  const { error } = await client
    .from("expense_entries")
    .update({
      voided_at: new Date().toISOString(),
      void_reason: r,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("voided_at", null)
  if (error) throw new Error(error.message)
}

function prevMonthKeys(monthKey: string, n: number): string[] {
  const [y0, m0] = monthKey.split("-").map(Number)
  const out: string[] = []
  let y = y0
  let m = m0
  for (let i = 0; i < n; i++) {
    out.unshift(`${y}-${String(m).padStart(2, "0")}`)
    m -= 1
    if (m < 1) {
      m = 12
      y -= 1
    }
  }
  return out
}

export async function fetchExpenseMonthDashboard(
  monthKey: string
): Promise<ExpenseMonthDashboard> {
  const client = requireClient()
  const trendKeys = prevMonthKeys(monthKey, 6)
  const from = `${trendKeys[0]}-01`
  const to = monthKeyLastDay(trendKeys[trendKeys.length - 1]!)

  const { data, error } = await client
    .from("expense_entries")
    .select(
      `
      spent_on, amount_hkd, ledger_status, voided_at, teacher_id,
      expense_ledger_accounts!expense_entries_ledger_account_id_fkey ( id, code, label, account_group ),
      teachers!expense_entries_teacher_id_fkey ( id, full_name )
    `
    )
    .gte("spent_on", from)
    .lte("spent_on", to)
    .is("voided_at", null)
    .limit(5000)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as RawRow[]
  const inMonth = (spentOn: string, mk: string) => spentOn.startsWith(mk)

  let totalConfirmed = 0
  let totalDirect = 0
  let totalOverhead = 0
  let laborTotal = 0
  let pendingCount = 0
  let pendingAmount = 0
  const byAccountMap = new Map<
    string,
    {
      accountId: string
      code: string
      label: string
      accountGroup: ExpenseAccountGroup
      amount: number
    }
  >()
  const byTeacherMap = new Map<
    string,
    {
      teacherId: string
      teacherName: string
      laborTutor: number
      employerMpf: number
      total: number
    }
  >()
  const trendMap = new Map<
    string,
    { monthKey: string; totalConfirmed: number; laborTotal: number; pendingAmount: number }
  >()
  for (const mk of trendKeys) {
    trendMap.set(mk, {
      monthKey: mk,
      totalConfirmed: 0,
      laborTotal: 0,
      pendingAmount: 0,
    })
  }

  for (const row of rows) {
    const spentOn = String(row.spent_on ?? "")
    const amount = Number(row.amount_hkd ?? 0)
    const status = String(row.ledger_status ?? "")
    const account = embedOne(row.expense_ledger_accounts)
    const code = account ? String(account.code ?? "") : ""
    const groupRaw = account ? String(account.account_group ?? "") : ""
    const group: ExpenseAccountGroup = groupRaw === "overhead" ? "overhead" : "direct"
    const isLabor = code === "labor_tutor" || code === "labor_employer_mpf"
    const mk = spentOn.slice(0, 7)
    const trend = trendMap.get(mk)

    if (status === "pending_review") {
      if (trend) trend.pendingAmount += amount
      if (inMonth(spentOn, monthKey)) {
        pendingCount += 1
        pendingAmount += amount
      }
      continue
    }
    if (status !== "confirmed") continue

    if (trend) {
      trend.totalConfirmed += amount
      if (isLabor) trend.laborTotal += amount
    }

    if (!inMonth(spentOn, monthKey)) continue

    totalConfirmed += amount
    if (group === "overhead") totalOverhead += amount
    else totalDirect += amount
    if (isLabor) laborTotal += amount

    if (account) {
      const aid = String(account.id)
      const cur = byAccountMap.get(aid) ?? {
        accountId: aid,
        code,
        label: String(account.label ?? code),
        accountGroup: group,
        amount: 0,
      }
      cur.amount += amount
      byAccountMap.set(aid, cur)
    }

    const teacherId = row.teacher_id != null ? String(row.teacher_id) : null
    if (teacherId && isLabor) {
      const teacher = embedOne(row.teachers)
      const cur = byTeacherMap.get(teacherId) ?? {
        teacherId,
        teacherName: teacher ? String(teacher.full_name ?? "—") : "—",
        laborTutor: 0,
        employerMpf: 0,
        total: 0,
      }
      if (code === "labor_tutor") cur.laborTutor += amount
      if (code === "labor_employer_mpf") cur.employerMpf += amount
      cur.total = cur.laborTutor + cur.employerMpf
      byTeacherMap.set(teacherId, cur)
    }
  }

  return {
    monthKey,
    totalConfirmed,
    totalDirect,
    totalOverhead,
    laborTotal,
    pendingCount,
    pendingAmount,
    byAccount: [...byAccountMap.values()].sort((a, b) => b.amount - a.amount),
    byTeacher: [...byTeacherMap.values()].sort((a, b) => b.total - a.total),
    monthlyTrend: trendKeys.map((k) => trendMap.get(k)!),
  }
}

/**
 * 計糧「已結算」後過帳：每位非排除老師 → labor_tutor ± labor_employer_mpf。
 * origin_key 冪等；重試唔雙倍。
 */
export async function postPayrollSettleToExpenseLedger(input: {
  monthKey: string
  settledBy: string
  teachers: PayrollTeacherRow[]
  excludedTeacherIds: Set<string>
}): Promise<{ posted: number; skipped: number }> {
  const client = requireClient()
  const accounts = await fetchExpenseAccounts()
  const laborId = accounts.find((a) => a.code === "labor_tutor")?.id
  const mpfId = accounts.find((a) => a.code === "labor_employer_mpf")?.id
  if (!laborId || !mpfId) throw new Error("成本帳缺少 labor_tutor／labor_employer_mpf 科目")

  const spentOn = monthKeyLastDay(input.monthKey)
  const rows: Record<string, unknown>[] = []
  let skipped = 0

  for (const t of input.teachers) {
    if (input.excludedTeacherIds.has(t.id)) {
      skipped += 1
      continue
    }
    const gross = t.gross
    if (gross == null || !Number.isFinite(gross) || gross === 0) {
      skipped += 1
      continue
    }
    const name = t.name || "老師"
    rows.push({
      spent_on: spentOn,
      title: `${name}｜計糧 ${input.monthKey} 薪酬`,
      amount_hkd: Math.round(gross * 100) / 100,
      pay_method: "other",
      owner_label: input.settledBy,
      ledger_account_id: laborId,
      ledger_status: "confirmed",
      teacher_id: t.id,
      origin: "payroll_settle",
      origin_key: `payroll|${input.monthKey}|${t.id}|labor_tutor`,
      created_by_label: input.settledBy,
      notes: "計糧結算自動過帳",
    })
    const empMpf = Number(t.employerMpf ?? 0)
    if (empMpf > 0) {
      rows.push({
        spent_on: spentOn,
        title: `${name}｜計糧 ${input.monthKey} 僱主強積金`,
        amount_hkd: Math.round(empMpf * 100) / 100,
        pay_method: "other",
        owner_label: input.settledBy,
        ledger_account_id: mpfId,
        ledger_status: "confirmed",
        teacher_id: t.id,
        origin: "payroll_settle",
        origin_key: `payroll|${input.monthKey}|${t.id}|labor_employer_mpf`,
        created_by_label: input.settledBy,
        notes: "計糧結算自動過帳",
      })
    }
  }

  if (rows.length === 0) return { posted: 0, skipped }

  const { error } = await client.from("expense_entries").upsert(rows, {
    onConflict: "origin_key",
    ignoreDuplicates: true,
  })
  if (error) throw new Error(error.message)
  return { posted: rows.length, skipped }
}
