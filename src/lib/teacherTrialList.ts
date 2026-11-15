import { isYmdInRange, type TeacherHomeSemesterRange } from "@/lib/teacherHomeScope"
import { trialIsAwaitingReschedule, trialIsCancelled } from "@/lib/trialFollowupAction"

export const TEACHER_TRIAL_STUDENTS_PATH = "/TeacherTrialStudents"

export type TeacherTrialStatusFilter = "all" | "booked" | "reschedule" | "done" | "cancel"

export type TeacherTrialListFilter = {
 classId: string
 dateFrom: string
 dateTo: string
 status: TeacherTrialStatusFilter
}

export function teacherCanWriteTrialComment(
 scheduleTeacherId: string | null,
 teacherId: string
): boolean {
 return scheduleTeacherId != null && scheduleTeacherId === teacherId
}

export function matchesTeacherTrialStatus(status: string, filter: TeacherTrialStatusFilter): boolean {
 if (filter === "all") return true
 if (filter === "reschedule") return trialIsAwaitingReschedule(status)
 if (filter === "cancel") return trialIsCancelled(status)
 if (filter === "done") return status.includes("完成")
 return !trialIsCancelled(status) && !trialIsAwaitingReschedule(status) && !status.includes("完成")
}

/** 沒有學期範圍時不回傳任何列，避免把其他學期一併列出。 */
export function filterTeacherTrialsBySemester<T extends { trial_date: string }>(
 rows: T[],
 range: TeacherHomeSemesterRange | null
): T[] {
 if (!range) return []
 return rows.filter((row) => isYmdInRange(row.trial_date, range))
}

export function filterTeacherTrialRows<T extends { class_id: string; trial_date: string; status: string }>(
 rows: T[],
 filter: TeacherTrialListFilter
): T[] {
 const from = filter.dateFrom.trim()
 const to = filter.dateTo.trim()
 return rows.filter((row) => {
  if (filter.classId !== "all" && row.class_id !== filter.classId) return false
  const date = row.trial_date.slice(0, 10)
  if (from && date < from) return false
  if (to && date > to) return false
  return matchesTeacherTrialStatus(row.status, filter.status)
 })
}
