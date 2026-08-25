/** 功輔月費價目（對齊 HOMEWORK_TUTORING_MONTHLY_FEE.md） */

import { isPrimaryStudentGrade } from "@/lib/studentGrade"

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

/** 價目年級：小學跟中一 */
function feeGradeKey(gradeLabel: string): string {
  if (isPrimaryStudentGrade(gradeLabel)) return "中一"
  return gradeLabel.trim()
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
