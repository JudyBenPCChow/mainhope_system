/** 活躍生＝在讀，或近三個月有報讀事件，或近三個月有退讀生效，或近一個月新登記。 */

export const ACTIVITY_LOOKBACK_MONTHS = 3
export const NEW_STUDENT_ACTIVITY_LOOKBACK_MONTHS = 1

export type EnrollmentActivityRow = {
 status: string
 enroll_date: string | null
 created_at: string
 withdraw_effective_date?: string | null
}

function localYmd(d: Date): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export function activityLookbackStartYmd(asOf = new Date()): string {
 const d = new Date(asOf)
 d.setMonth(d.getMonth() - ACTIVITY_LOOKBACK_MONTHS)
 return localYmd(d)
}

/** 香港曆日。學生主檔建立日與「近一個月新登記」以此為準。 */
export function hongKongCalendarYmd(iso: string): string {
 const d = new Date(iso)
 if (Number.isNaN(d.getTime())) return ""
 return new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Hong_Kong",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
 }).format(d)
}

/** 由 YYYY-MM-DD 減曆月，月末不足則截到該月最後一日（與 PostgreSQL `date - interval` 相同）。 */
export function subtractCalendarMonthsYmd(ymd: string, months: number): string {
 const [y, m, day] = ymd.split("-").map(Number)
 if (!y || !m || !day) return ""
 const total = y * 12 + (m - 1) - months
 const ty = Math.floor(total / 12)
 const tm = total - ty * 12
 const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate()
 const td = Math.min(day, lastDay)
 return `${ty}-${String(tm + 1).padStart(2, "0")}-${String(td).padStart(2, "0")}`
}

export function newStudentActivityLookbackStartYmd(asOf = new Date()): string {
 return subtractCalendarMonthsYmd(hongKongCalendarYmd(asOf.toISOString()), NEW_STUDENT_ACTIVITY_LOOKBACK_MONTHS)
}

export function enrollmentEventYmdFromRow(row: Pick<EnrollmentActivityRow, "enroll_date" | "created_at">): string {
 const enroll = (row.enroll_date ?? "").trim()
 if (enroll) return enroll.slice(0, 10)
 return (row.created_at ?? "").slice(0, 10)
}

export function deriveActivityStatus(opts: {
 hasActiveEnrollment: boolean
 enrollments: EnrollmentActivityRow[]
 /** 學生主檔建立時間。近一個月新登記（即使尚未報讀）視為活躍。 */
 studentCreatedAt?: string | null
 asOf?: Date
}): "活躍生" | "非活躍生" {
 if (opts.hasActiveEnrollment) return "活躍生"
 const asOf = opts.asOf ?? new Date()
 const cutoff = activityLookbackStartYmd(asOf)
 const recentEnroll = opts.enrollments.some((row) => enrollmentEventYmdFromRow(row) >= cutoff)
 if (recentEnroll) return "活躍生"
 const recentWithdraw = opts.enrollments.some((row) => {
  const w = (row.withdraw_effective_date ?? "").trim().slice(0, 10)
  return Boolean(w) && w >= cutoff
 })
 if (recentWithdraw) return "活躍生"
 const created = (opts.studentCreatedAt ?? "").trim()
 if (!created) return "非活躍生"
 const createdYmd = hongKongCalendarYmd(created)
 const newStudentCutoff = newStudentActivityLookbackStartYmd(asOf)
 return createdYmd && createdYmd >= newStudentCutoff ? "活躍生" : "非活躍生"
}
