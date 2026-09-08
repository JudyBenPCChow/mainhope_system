/**
 * 未結算計糧草稿 → 導師人工預估（僱主總負擔）。
 * 與結算過帳同一口徑：gross + employerMpf；已排除老師不計。
 */

import { roundMoney } from "@/lib/payroll/gradeBand"
import { teacherNeedsMpf, withMpf } from "@/lib/payroll/mpf"
import type { ManualAdjustment, PayrollTeacherRow } from "@/lib/payroll/viewTypes"

export type PayrollLaborSource = "posted" | "estimated" | "missing"

export type MonthTutorLabor = {
  amount: number
  source: PayrollLaborSource
}

export type PeriodTutorLabor = {
  amount: number
  posted: boolean
  estimated: boolean
  unpostedAmount: number
}

export function employerLaborCost(teacher: {
  gross: number | null
  employerMpf?: number
}): number {
  const gross = teacher.gross
  if (gross == null || !Number.isFinite(gross) || gross === 0) return 0
  return roundMoney(gross + Number(teacher.employerMpf ?? 0))
}

export function applyApprovedPayrollAdjustments(
  teachers: PayrollTeacherRow[],
  adjustments: ManualAdjustment[]
): PayrollTeacherRow[] {
  return teachers.map((t) => {
    const approved = adjustments.filter((a) => a.teacherId === t.id && a.status === "approved")
    if (approved.length === 0) return t
    const latest = approved.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!
    const mpfOn = teacherNeedsMpf({ teacherName: t.name })
    const m = mpfOn
      ? withMpf(latest.toAmount)
      : { gross: latest.toAmount, employeeMpf: 0, employerMpf: 0, net: latest.toAmount }
    return { ...t, gross: m.gross, employeeMpf: m.employeeMpf, employerMpf: m.employerMpf, net: m.net }
  })
}

export function sumEstimatedTutorLabor(args: {
  teachers: PayrollTeacherRow[]
  excludedTeacherIds: Set<string>
}): number {
  let sum = 0
  for (const t of args.teachers) {
    if (args.excludedTeacherIds.has(t.id)) continue
    sum += employerLaborCost(t)
  }
  return roundMoney(sum)
}

export function resolveMonthTutorLabor(args: {
  posted: boolean
  postedAmount: number
  estimatedAmount: number | null
}): MonthTutorLabor {
  if (args.posted) {
    return { amount: roundMoney(args.postedAmount), source: "posted" }
  }
  if (args.estimatedAmount != null) {
    return { amount: roundMoney(args.estimatedAmount), source: "estimated" }
  }
  return { amount: 0, source: "missing" }
}

export function foldPeriodTutorLabor(
  months: Array<MonthTutorLabor & { consumedValue: number }>
): PeriodTutorLabor {
 let amount = 0
 let unpostedAmount = 0
 let blocksGross = false
 let anyEstimated = false
 let anyPosted = false

 for (const m of months) {
  amount += m.amount
  if (m.source === "posted") {
   anyPosted = true
   continue
  }
  if (m.source === "estimated") {
   anyEstimated = true
   unpostedAmount += m.amount
   continue
  }
  if (m.consumedValue > 0) blocksGross = true
 }

 amount = roundMoney(amount)
 unpostedAmount = roundMoney(unpostedAmount)
 if (blocksGross || (!anyPosted && !anyEstimated)) {
  return { amount, posted: false, estimated: false, unpostedAmount: 0 }
 }
 if (anyEstimated) {
  return { amount, posted: false, estimated: true, unpostedAmount }
 }
 return { amount, posted: true, estimated: false, unpostedAmount: 0 }
}
