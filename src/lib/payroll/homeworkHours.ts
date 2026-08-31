/** 功輔時薪／Christine 功輔佣金（純計算） */

import { roundMoney } from "@/lib/payroll/gradeBand"

export const HOMEWORK_COMMISSION_MIN_ENROLLED = 15
export const HOMEWORK_COMMISSION_PCT = 0.1
export const HOMEWORK_HOURLY_EXEMPT_NAMES = ["Katie Lee"] as const
export const CHRISTINE_HOMEWORK_COMMISSION_NAME = "Christine Fan"

export type HomeworkDutyShift = {
  teacherId: string
  date: string
  start: string
  end: string
  holiday: boolean
}

function parseHm(raw: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(raw ?? "").trim())
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh > 23 || mm > 59) return null
  return hh * 60 + mm
}

/** 上下班時段相差小時（兩位小數）。結束早於開始則當跨日。 */
export function hoursBetweenHm(start: string, end: string): number {
  const a = parseHm(start)
  const b = parseHm(end)
  if (a == null || b == null) return 0
  let mins = b - a
  if (mins < 0) mins += 24 * 60
  return roundMoney(mins / 60)
}

export function isHomeworkHourlyExempt(teacherName: string): boolean {
  return (HOMEWORK_HOURLY_EXEMPT_NAMES as readonly string[]).includes(teacherName)
}

export function billedHomeworkHours(rosterHours: number, overrideHours: number | null | undefined): number {
  if (overrideHours != null && Number.isFinite(overrideHours)) return roundMoney(Math.max(0, overrideHours))
  return roundMoney(Math.max(0, rosterHours))
}

export function homeworkHourlyPay(hours: number, rate: number): number {
  if (hours <= 0 || rate <= 0) return 0
  return roundMoney(hours * rate)
}

export function rosterHoursByTeacher(
  shifts: HomeworkDutyShift[],
  closureDates: ReadonlySet<string>
): Map<string, number> {
  const out = new Map<string, number>()
  for (const s of shifts) {
    if (!s.teacherId) continue
    if (s.holiday) continue
    if (closureDates.has(s.date)) continue
    const h = hoursBetweenHm(s.start, s.end)
    if (h <= 0) continue
    out.set(s.teacherId, roundMoney((out.get(s.teacherId) ?? 0) + h))
  }
  return out
}

export function christineHomeworkCommission(opts: {
  enrolledCount: number
  originalPriceTotal: number
}): {
  eligible: boolean
  enrolledCount: number
  originalPriceTotal: number
  amount: number
} {
  const enrolledCount = Math.max(0, Math.floor(opts.enrolledCount))
  const originalPriceTotal = roundMoney(Math.max(0, opts.originalPriceTotal))
  const eligible = enrolledCount >= HOMEWORK_COMMISSION_MIN_ENROLLED
  return {
    eligible,
    enrolledCount,
    originalPriceTotal,
    amount: eligible ? roundMoney(originalPriceTotal * HOMEWORK_COMMISSION_PCT) : 0,
  }
}
