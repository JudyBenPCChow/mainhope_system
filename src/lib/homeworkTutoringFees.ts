/** 功輔月費價目（對齊 HOMEWORK_TUTORING_MONTHLY_FEE.md） */

import { formatStudentGrade, isPrimaryStudentGrade } from "@/lib/studentGrade"

export type HomeworkDayPlan = "三日" | "四日" | "五日" | "七日"
export type HomeworkWeekday = "一" | "二" | "三" | "四" | "五"

const FEE_TABLE: Record<HomeworkDayPlan, Record<string, number>> = {
  三日: { 中一: 2800, 中二: 2900, 中三: 3000 },
  四日: { 中一: 3100, 中二: 3200, 中三: 3300 },
  五日: { 中一: 3200, 中二: 3300, 中三: 3400 },
  七日: { 中一: 3400, 中二: 3500, 中三: 3600 },
}

export const HOMEWORK_FEE_GRADES = ["中一", "中二", "中三"] as const
export const HOMEWORK_FEE_PLANS: HomeworkDayPlan[] = ["三日", "四日", "五日", "七日"]

/** 全額月費（不含 12／2 月四分三）；設定頁價目表用 */
export function homeworkFeeBaseHkd(
  dayPlan: HomeworkDayPlan,
  gradeLabel: string
): number | null {
  return FEE_TABLE[dayPlan]?.[feeGradeKey(gradeLabel)] ?? null
}

export function isHomeworkQuarterRateMonth(billingMonth: string): boolean {
  const m = billingMonth.slice(0, 7)
  return m.endsWith("-12") || m.endsWith("-02")
}

/** 價目年級：小學跟中一；S1／中一等寫法都對到表 */
function feeGradeKey(gradeLabel: string): string {
  if (isPrimaryStudentGrade(gradeLabel)) return "中一"
  return formatStudentGrade(gradeLabel)
}

export function isHomeworkDayPlan(raw: unknown): raw is HomeworkDayPlan {
  return raw === "三日" || raw === "四日" || raw === "五日" || raw === "七日"
}

/** YYYY-MM；無效則空字串 */
export function normalizeYearMonth(raw: string | null | undefined): string {
  const ym = String(raw ?? "").slice(0, 7)
  return /^\d{4}-\d{2}$/.test(ym) ? ym : ""
}

export function addYearMonth(yearMonth: string, delta: number): string {
  const ym = normalizeYearMonth(yearMonth)
  if (!ym) return ""
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5, 7))
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** 由起始月起連續 N 個曆月（含起始） */
export function homeworkCoverageMonths(
  startYm: string | null | undefined,
  monthCount: number | null | undefined
): string[] {
  const start = normalizeYearMonth(startYm)
  const n = Math.floor(Number(monthCount))
  if (!start || !Number.isFinite(n) || n < 1) return []
  return Array.from({ length: n }, (_, i) => addYearMonth(start, i)).filter(Boolean)
}

export function homeworkCoverageLabel(
  startYm: string | null | undefined,
  monthCount: number | null | undefined
): string {
  const months = homeworkCoverageMonths(startYm, monthCount)
  if (months.length === 0) return ""
  if (months.length === 1) return formatYearMonthLabel(months[0]!)
  return `${formatYearMonthLabel(months[0]!)}至${formatYearMonthLabel(months[months.length - 1]!)}`
}

export function homeworkPaymentCoversMonth(opts: {
  coverageStartMonth: string | null | undefined
  monthCount: number | null | undefined
  billingMonth: string
}): boolean {
  const ym = normalizeYearMonth(opts.billingMonth)
  if (!ym) return false
  return homeworkCoverageMonths(opts.coverageStartMonth, opts.monthCount).includes(ym)
}

export function homeworkFeeLineDescription(
  classLabel: string | null | undefined,
  startYm: string,
  monthCount: number
): string {
  const name = String(classLabel ?? "").trim() || "功課輔導班"
  const span = homeworkCoverageLabel(startYm, monthCount)
  return span ? `${name} · ${span}月費` : `${name} · 月費`
}

/** 收款明細：覆蓋月份各自按檔計價後加總（12／2 月四分三逐月計） */
export function homeworkPaymentLineAmount(opts: {
  dayPlan: HomeworkDayPlan | null | undefined
  grade: string | null | undefined
  /** 覆蓋起始月 YYYY-MM；可與 coverageStartMonth 擇一 */
  billingMonth?: string
  coverageStartMonth?: string | null
  monthCount?: number
}): string {
  if (!opts.dayPlan || !opts.grade) return ""
  const start = opts.coverageStartMonth || opts.billingMonth || ""
  const months = homeworkCoverageMonths(start, opts.monthCount ?? 1)
  if (months.length === 0) return ""
  let sum = 0
  for (const m of months) {
    const unit = homeworkMonthlyFeeHkd(opts.dayPlan, opts.grade, m)
    if (unit == null) return ""
    sum += unit
  }
  return String(Math.round(sum * 100) / 100)
}

/** 收款明細備註帶「月費」＝功輔月費行（舊暑期單據無此字，仍當堂數） */
export function isHomeworkMonthlyFeeDescription(description: string | null | undefined): boolean {
  return /月費/.test(String(description ?? ""))
}

/** 回傳應繳港元；年級未列價則 null */
export function homeworkMonthlyFeeHkd(
  dayPlan: HomeworkDayPlan,
  gradeLabel: string,
  billingMonth: string
): number | null {
  const base = FEE_TABLE[dayPlan]?.[feeGradeKey(gradeLabel)]
  if (base == null) return null
  if (isHomeworkQuarterRateMonth(billingMonth)) {
    return Math.round((base * 3) / 4)
  }
  return base
}

export function planDayCount(plan: HomeworkDayPlan): number {
  if (plan === "三日") return 3
  if (plan === "四日") return 4
  if (plan === "五日") return 5
  return 7
}

export function monthFirstDay(yearMonth: string): string {
  const ym = yearMonth.slice(0, 7)
  return `${ym}-01`
}

export function formatYearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.slice(0, 7).split("-")
  const month = Number(m)
  if (!y || !month) return yearMonth
  return `${y}年${month}月`
}
