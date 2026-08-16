import { formatUnknownError } from "@/lib/formatUnknownError"

export type ScheduleStatsSnapshot = {
 todayLessonCount: number
 pendingCancelledCount: number
 todayStudentHeadcount: number
}

export type ScheduleStatsLoad = { ok: ScheduleStatsSnapshot } | { error: string }

/** 任一必要 query `.error` → 整組未知，唔好用 count??0 冒充真 0 */
export function assembleScheduleStatsSnapshot(input: {
 todayLessonsError: unknown
 todayLessonsCount: number | null
 pendingCancelError: unknown
 pendingCancelCount: number | null
 todaySchedError: unknown
 headcountError?: unknown
 todayStudentHeadcount: number
}): ScheduleStatsLoad {
 const first =
  input.todayLessonsError ??
  input.pendingCancelError ??
  input.todaySchedError ??
  input.headcountError ??
  null
 if (first) return { error: formatUnknownError(first) }
 return {
  ok: {
   todayLessonCount: input.todayLessonsCount ?? 0,
   pendingCancelledCount: input.pendingCancelCount ?? 0,
   todayStudentHeadcount: input.todayStudentHeadcount,
  },
 }
}
