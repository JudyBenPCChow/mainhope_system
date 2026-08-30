/** 活躍生＝在讀，或近三個月有報讀事件，或近三個月有退讀生效。 */

export const ACTIVITY_LOOKBACK_MONTHS = 3

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

export function enrollmentEventYmdFromRow(row: Pick<EnrollmentActivityRow, "enroll_date" | "created_at">): string {
 const enroll = (row.enroll_date ?? "").trim()
 if (enroll) return enroll.slice(0, 10)
 return (row.created_at ?? "").slice(0, 10)
}

export function deriveActivityStatus(opts: {
 hasActiveEnrollment: boolean
 enrollments: EnrollmentActivityRow[]
 asOf?: Date
}): "活躍生" | "非活躍生" {
 if (opts.hasActiveEnrollment) return "活躍生"
 const cutoff = activityLookbackStartYmd(opts.asOf)
 const recentEnroll = opts.enrollments.some((row) => enrollmentEventYmdFromRow(row) >= cutoff)
 if (recentEnroll) return "活躍生"
 const recentWithdraw = opts.enrollments.some((row) => {
  const w = (row.withdraw_effective_date ?? "").trim().slice(0, 10)
  return Boolean(w) && w >= cutoff
 })
 return recentWithdraw ? "活躍生" : "非活躍生"
}
