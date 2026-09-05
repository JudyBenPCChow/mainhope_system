export const ENROLLMENT_START_MODES = ["next", "schedule"] as const
export type EnrollmentStartMode = (typeof ENROLLMENT_START_MODES)[number]

export type EnrollmentStartScheduleLike = {
 scheduled_date: string
 status: string
 start_time?: string | null
 session_number?: number | null
}

export function isCancelledScheduleStatus(status: string): boolean {
 return status.includes("取消")
}

export function formatClassScheduleLabel(row: {
 session_number?: number | null
 scheduled_date: string
 start_time?: string | null
}): string {
 return [
  row.session_number != null ? `第${row.session_number}堂` : "堂次未編號",
  row.scheduled_date.slice(0, 10),
  row.start_time ? String(row.start_time).slice(0, 5) : null,
 ]
  .filter(Boolean)
  .join(" · ")
}

function sortSchedulesByDateTime<T extends EnrollmentStartScheduleLike>(rows: T[]): T[] {
 return [...rows].sort((a, b) => {
  const byDate = a.scheduled_date.slice(0, 10).localeCompare(b.scheduled_date.slice(0, 10))
  if (byDate !== 0) return byDate
  return String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
 })
}

/** 指定排程開始可選：未取消即可（含過去）。 */
export function listEnrollmentStartScheduleOptions<T extends EnrollmentStartScheduleLike>(
 rows: T[],
 _todayYmd?: string
): T[] {
 return sortSchedulesByDateTime(rows.filter((row) => !isCancelledScheduleStatus(row.status)))
}

/**
 * 過去首堂報讀需自動請假的排程：未取消、首堂日（含）起至今天前（不含今天）。
 */
export function listPastSchedulesNeedingAutoLeave<T extends EnrollmentStartScheduleLike>(
 rows: T[],
 enrollYmd: string,
 todayYmd: string
): T[] {
 const enroll = enrollYmd.slice(0, 10)
 const today = todayYmd.slice(0, 10)
 if (!/^\d{4}-\d{2}-\d{2}$/.test(enroll) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return []
 if (enroll >= today) return []
 return sortSchedulesByDateTime(
  rows.filter((row) => {
   if (isCancelledScheduleStatus(row.status)) return false
   const ymd = row.scheduled_date.slice(0, 10)
   return ymd >= enroll && ymd < today
  })
 )
}

/** 下一堂＝今天起、未取消、日期最早的一堂（同日依開始時間）。 */
export function resolveNextClassSchedule<T extends EnrollmentStartScheduleLike>(
 rows: T[],
 todayYmd: string
): T | null {
 const today = todayYmd.slice(0, 10)
 const eligible = rows.filter(
  (row) => !isCancelledScheduleStatus(row.status) && row.scheduled_date.slice(0, 10) >= today
 )
 return sortSchedulesByDateTime(eligible)[0] ?? null
}

export function resolveEnrollmentStartDate(opts: {
 mode: EnrollmentStartMode
 todayYmd: string
 nextScheduleDate: string | null | undefined
 specifiedScheduleDate: string | null | undefined
}): string {
 const today = opts.todayYmd.slice(0, 10)
 if (opts.mode === "schedule") {
  const specified = (opts.specifiedScheduleDate ?? "").slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(specified)) return specified
  throw new Error("請選擇開始報讀的排程")
 }
 const next = (opts.nextScheduleDate ?? "").slice(0, 10)
 if (/^\d{4}-\d{2}-\d{2}$/.test(next)) return next
 return today
}
