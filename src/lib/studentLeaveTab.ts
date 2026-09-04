import { isCurrentEnrollmentYear } from "@/lib/enrollmentYearDisplay"

export type LeaveTabRow = {
 id: string
 status: string
}

export type MakeupCandidateRow = {
 id: string
 classLabel: string
 course_name: string | null
 subject: string
 course_code_full: string | null
 teacher_name: string | null
 scheduled_date: string
}

export type LeaveTabLoad<T> =
 | { status: "loading" }
 | { status: "ready"; rows: T[] }
 | { status: "error"; message: string }

export function leaveTabKind<T>(load: LeaveTabLoad<T>): "loading" | "error" | "empty" | "rows" {
 if (load.status === "loading") return "loading"
 if (load.status === "error") return "error"
 return load.rows.length === 0 ? "empty" : "rows"
}

export function countPendingLeaveRows(rows: LeaveTabRow[]): number {
 return rows.filter((x) => x.status.includes("待")).length
}

export function filterMakeupCandidates<T extends MakeupCandidateRow>(
 rows: T[],
 query: string
): T[] {
 const q = query.trim().toLowerCase()
 if (!q) return rows
 return rows.filter((s) => {
  const hay = `${s.classLabel} ${s.course_name ?? ""} ${s.subject} ${s.course_code_full ?? ""} ${s.teacher_name ?? ""} ${s.scheduled_date}`.toLowerCase()
  return hay.includes(q)
 })
}

export type LeaveYearFields = {
 academicYearLabel?: string | null
}

export type LeaveYearPartition<T> = {
 current: T[]
 past: T[]
}

export function partitionLeaveByAcademicYear<T extends LeaveYearFields>(
 rows: T[],
 asOfYmd?: string | null
): LeaveYearPartition<T> {
 const current: T[] = []
 const past: T[] = []
 for (const row of rows) {
  if (isCurrentEnrollmentYear(row.academicYearLabel, asOfYmd)) current.push(row)
  else past.push(row)
 }
 return { current, past }
}
