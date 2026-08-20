/** 計糧 ↔ 排程／出席紀錄 round-trip */

export function payrollWorkbenchPath(opts: {
  month: string
  teacherId?: string | null
  lessonId?: string | null
}): string {
  const p = new URLSearchParams()
  p.set("month", opts.month)
  if (opts.teacherId) p.set("teacher", opts.teacherId)
  if (opts.lessonId) p.set("lesson", opts.lessonId)
  return `/Payroll?${p.toString()}`
}

export function payrollScheduleVerifyPath(opts: {
  scheduleId: string
  month: string
  teacherId: string
  lessonId: string
}): string {
  const p = new URLSearchParams({
    from: "payroll",
    month: opts.month,
    teacher: opts.teacherId,
    lesson: opts.lessonId,
  })
  return `/Schedule/${opts.scheduleId}?${p.toString()}`
}

export function payrollAttendanceRecordsPath(opts: {
  month: string
  teacherId?: string | null
}): string {
  const p = new URLSearchParams({ from: "payroll", month: opts.month })
  if (opts.teacherId) p.set("teacher", opts.teacherId)
  return `/AttendanceRecords?${p.toString()}`
}

export function monthKeyToRange(monthKey: string): { from: string; to: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!y || mo < 1 || mo > 12) return null
  const last = new Date(y, mo, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, "0")
  return { from: `${y}-${pad(mo)}-01`, to: `${y}-${pad(mo)}-${pad(last)}` }
}
