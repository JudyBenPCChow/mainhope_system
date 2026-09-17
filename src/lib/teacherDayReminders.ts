/**
 * 以任教老師為單位彙整某日排程（連堂合併；含代堂／加堂）。
 */

export type TeacherDayLessonInput = {
  scheduleId: string
  subject: string
  courseCode: string | null
  courseName: string | null
  startTime: string | null
  endTime: string | null
  classroomName: string | null
  consecutiveGroupId: string | null
  consecutiveSlotIndex: number | null
  isExtraLesson: boolean
  originalTeacherName: string | null
}

export type AggregatedTeacherDayLesson = {
  key: string
  scheduleIds: string[]
  subject: string
  courseCode: string | null
  courseName: string | null
  startTime: string | null
  endTime: string | null
  classroomName: string | null
  isConsecutive: boolean
  isExtraLesson: boolean
  originalTeacherName: string | null
}

export function teacherAddressName(fullName: string): string {
  const n = fullName.trim() || "老師"
  if (/老師$/.test(n)) return n
  return `${n}老師`
}

export function teacherSubstituteNote(originalTeacherName: string | null | undefined): string | null {
  const original = originalTeacherName?.trim()
  if (!original) return null
  return `代堂（原：${original}）`
}

/**
 * 以老師為單位彙整某日課堂：
 * - 連堂合併為一項（首節開始～末節結束）
 * - 代堂／加堂標記保留
 */
export function aggregateTeacherDayLessons(
  lessons: TeacherDayLessonInput[]
): AggregatedTeacherDayLesson[] {
  type Acc = {
    schedules: TeacherDayLessonInput[]
    isExtraLesson: boolean
    originalTeacherName: string | null
  }

  const groups = new Map<string, Acc>()

  for (const lesson of lessons) {
    const gid = lesson.consecutiveGroupId?.trim()
    const groupKey = gid ? `cg:${gid}` : `s:${lesson.scheduleId}`
    const existing = groups.get(groupKey)
    if (!existing) {
      groups.set(groupKey, {
        schedules: [lesson],
        isExtraLesson: lesson.isExtraLesson,
        originalTeacherName: lesson.originalTeacherName?.trim() || null,
      })
      continue
    }
    if (!existing.schedules.some((s) => s.scheduleId === lesson.scheduleId)) {
      existing.schedules.push(lesson)
    }
    if (lesson.isExtraLesson) existing.isExtraLesson = true
    if (!existing.originalTeacherName && lesson.originalTeacherName?.trim()) {
      existing.originalTeacherName = lesson.originalTeacherName.trim()
    }
  }

  const out: AggregatedTeacherDayLesson[] = []
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
      isConsecutive,
      isExtraLesson: group.isExtraLesson,
      originalTeacherName: group.originalTeacherName,
    })
  }

  return out.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
}
