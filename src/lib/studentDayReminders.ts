import type { DayLessonReminderItem } from "@/lib/whatsappReminder"

export type StudentDayLessonKind = "enrolled" | "makeup" | "trial"

export type StudentDayLessonInput = {
 scheduleId: string
 subject: string
 courseCode: string | null
 courseName: string | null
 startTime: string | null
 endTime: string | null
 classroomName: string | null
 teacherName: string | null
 consecutiveGroupId: string | null
 consecutiveSlotIndex: number | null
 kind: StudentDayLessonKind
 makeupNote?: string | null
}

export type AggregatedStudentDayLesson = DayLessonReminderItem & {
 key: string
 scheduleIds: string[]
 teacherName: string | null
 kind: StudentDayLessonKind
}

export type StudentDayReminderStudent = {
 id: string
 fullName: string
 studentCode: string | null
 contactPhone: string | null
}

/**
 * 以學生為單位彙整某日課堂：
 * - 連堂合併為一項（首節開始～末節結束）
 * - 含就讀／補堂／試堂
 */
export function aggregateStudentDayLessons(
 lessons: StudentDayLessonInput[]
): AggregatedStudentDayLesson[] {
 type Acc = {
  schedules: StudentDayLessonInput[]
  kind: StudentDayLessonKind
  makeupNote: string | null
 }

 const groups = new Map<string, Acc>()

 for (const lesson of lessons) {
  const gid = lesson.consecutiveGroupId?.trim()
  const groupKey = gid ? `cg:${gid}` : `s:${lesson.scheduleId}`
  const existing = groups.get(groupKey)
  if (!existing) {
   groups.set(groupKey, {
    schedules: [lesson],
    kind: lesson.kind,
    makeupNote: lesson.makeupNote?.trim() || null,
   })
   continue
  }
  if (!existing.schedules.some((s) => s.scheduleId === lesson.scheduleId)) {
   existing.schedules.push(lesson)
  }
  if (lesson.kind === "makeup") {
   existing.kind = "makeup"
   existing.makeupNote = lesson.makeupNote?.trim() || existing.makeupNote
  } else if (lesson.kind === "trial" && existing.kind !== "makeup") {
   existing.kind = "trial"
  }
 }

 const out: AggregatedStudentDayLesson[] = []
 for (const [groupKey, group] of groups) {
  const sorted = [...group.schedules].sort(
   (a, b) => (a.consecutiveSlotIndex ?? 0) - (b.consecutiveSlotIndex ?? 0)
  )
  const head = sorted[0]
  if (!head) continue
  const tail = sorted[sorted.length - 1] ?? head
  const isConsecutive = Boolean(head.consecutiveGroupId?.trim()) && sorted.length > 1

  out.push({
   key: groupKey,
   scheduleIds: sorted.map((s) => s.scheduleId),
   subject: head.subject,
   courseCode: head.courseCode,
   courseName: head.courseName,
   startTime: head.startTime,
   endTime: tail.endTime,
   classroomName: head.classroomName,
   teacherName: head.teacherName,
   isConsecutive,
   kind: group.kind,
   makeupNote: group.makeupNote,
   isTrial: group.kind === "trial",
  })
 }

 return out.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
}
