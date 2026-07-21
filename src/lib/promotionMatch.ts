import { weekdaysFromStored } from "@/components/classes/classesUi"
import { consecutivePairFromFirstTimeSlot, isConsecutiveClass } from "@/lib/consecutiveLesson"
import { normalizeEnrollmentPeriod, type EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import { intervalsOverlapMinutes, parseHm } from "@/lib/lessonSlots"
import { parseTimeSlotBounds } from "@/services/batchScheduleHelpers"

/** 全期報讀：常規「報足全期」寫入 null；暑期為「兩期全報」。單堂／單期不算。 */
export function isFullTermEnrollment(period: string | null | undefined): boolean {
  const p = normalizeEnrollmentPeriod(period)
  return p == null || p === "兩期全報"
}

export type ScheduleLike = {
  dayOfWeek: string | null
  timeSlot: string | null
  lessonSlotsPerSession?: number | null
}

/** 取得班別實際占用時段（連堂則跨兩格） */
export function resolveScheduleBoundsMinutes(slot: ScheduleLike): { start: number; end: number } | null {
  const raw = (slot.timeSlot ?? "").trim()
  if (!raw) return null

  if (isConsecutiveClass(slot.lessonSlotsPerSession)) {
    const pair = consecutivePairFromFirstTimeSlot(raw)
    if (pair) {
      const a = parseHm(pair.slot1.start)
      const b = parseHm(pair.slot2.end)
      if (a != null && b != null && b > a) return { start: a, end: b }
    }
  }

  const bounds = parseTimeSlotBounds(raw)
  const a = parseHm(bounds.start)
  const b = parseHm(bounds.end)
  if (a == null || b == null || b <= a) return null
  return { start: a, end: b }
}

/** 星期交集 + 時段重疊（列表用輕量檢查；正式報讀仍走排程堂次衝突） */
export function classSchedulesConflict(a: ScheduleLike, b: ScheduleLike): boolean {
  const daysA = weekdaysFromStored(a.dayOfWeek)
  const daysB = weekdaysFromStored(b.dayOfWeek)
  if (daysA.length === 0 || daysB.length === 0) return false
  if (!daysA.some((d) => daysB.includes(d))) return false

  const ba = resolveScheduleBoundsMinutes(a)
  const bb = resolveScheduleBoundsMinutes(b)
  if (!ba || !bb) {
    // 時段無法解析時，同日視為潛在衝突（保守）
    return true
  }
  return intervalsOverlapMinutes(ba.start, ba.end, bb.start, bb.end)
}

export type PromotionExclusionReason =
  | "非注冊"
  | "年級不合"
  | "時間衝突"
  | "已報讀本班"
  | "已報讀同課程"
  | "已退讀本班"

export type PromotionClassRow = {
  id: string
  courseId: string | null
  subjectId: string | null
  label: string
  subject: string
  grades: string[]
  dayOfWeek: string | null
  timeSlot: string | null
  lessonSlotsPerSession: number
  teacherName: string | null
  capacity: number | null
  status: string
}

export type PromotionStudentRow = {
  id: string
  studentCode: string | null
  fullName: string
  englishName: string | null
  /** 中文年級標籤，如「中三」 */
  gradeLabel: string
  contactPhone: string | null
  registrationStatus: "已註冊" | "非注冊"
}

export type PromotionEnrollmentRow = {
  id: string
  studentId: string
  classId: string
  courseId: string | null
  subjectId: string | null
  period: EnrollmentFormValue | null
  status: string
  classLabel: string
  dayOfWeek: string | null
  timeSlot: string | null
  lessonSlotsPerSession: number
}

export type PromotionHistoricalSubjectRow = {
  studentId: string
  subjectId: string
}

export type EligibleCandidate = {
  student: PromotionStudentRow
  previouslyStudiedTargetSubject: boolean
  currentlyStudiesTargetSubject: boolean
  currentClasses: Array<{
    classId: string
    label: string
    dayOfWeek: string | null
    timeSlot: string | null
    period: EnrollmentFormValue | null
  }>
}

export type ExcludedCandidate = {
  student: PromotionStudentRow
  reasons: PromotionExclusionReason[]
  conflictWith?: string
}

export type ClassMatchBundle = {
  cls: PromotionClassRow
  fullTermCount: number
  fullTermStudents: PromotionStudentRow[]
  eligible: EligibleCandidate[]
  excluded: ExcludedCandidate[]
}

export type EligibleClassForStudent = {
  cls: PromotionClassRow
  fullTermCount: number
  isHotFullTerm: boolean
}

export type BlockedClassForStudent = {
  cls: PromotionClassRow
  fullTermCount: number
  isHotFullTerm: boolean
  reasons: PromotionExclusionReason[]
  conflictWith?: string
}

export type StudentMatchBundle = {
  student: PromotionStudentRow
  currentClasses: EligibleCandidate["currentClasses"]
  eligible: EligibleClassForStudent[]
  blocked: BlockedClassForStudent[]
}

function formatConflictLabel(en: PromotionEnrollmentRow): string {
  const when = [en.dayOfWeek, en.timeSlot].filter(Boolean).join(" ")
  return when ? `${en.classLabel}（${when}）` : en.classLabel
}

function currentClassesOf(
  studentId: string,
  enrollments: PromotionEnrollmentRow[]
): EligibleCandidate["currentClasses"] {
  return enrollments
    .filter((e) => e.studentId === studentId && e.status === "就讀中")
    .map((e) => ({
      classId: e.classId,
      label: e.classLabel,
      dayOfWeek: e.dayOfWeek,
      timeSlot: e.timeSlot,
      period: e.period,
    }))
}

function hasHistoricalSubject(
  studentId: string,
  subjectId: string | null,
  historicalSubjects: PromotionHistoricalSubjectRow[]
): boolean {
  return Boolean(
    subjectId &&
      historicalSubjects.some(
        (row) => row.studentId === studentId && row.subjectId === subjectId
      )
  )
}

function hasCurrentSubject(
  studentId: string,
  subjectId: string | null,
  enrollments: PromotionEnrollmentRow[]
): boolean {
  return Boolean(
    subjectId &&
      enrollments.some(
        (row) =>
          row.studentId === studentId &&
          row.status === "就讀中" &&
          row.subjectId === subjectId
      )
  )
}

export function evaluateStudentForClass(opts: {
  student: PromotionStudentRow
  cls: PromotionClassRow
  enrollments: PromotionEnrollmentRow[]
}): { reasons: PromotionExclusionReason[]; conflictWith?: string } {
  const { student, cls, enrollments } = opts
  const reasons: PromotionExclusionReason[] = []
  let conflictWith: string | undefined

  if (student.registrationStatus !== "已註冊") {
    reasons.push("非注冊")
  }

  if (!cls.grades.includes(student.gradeLabel)) {
    reasons.push("年級不合")
  }

  const ens = enrollments.filter((e) => e.studentId === student.id && e.status === "就讀中")
  const already = ens.find((e) => e.classId === cls.id)
  if (already) {
    reasons.push("已報讀本班")
  } else if (cls.courseId && ens.some((e) => e.courseId === cls.courseId)) {
    reasons.push("已報讀同課程")
  }

  for (const en of ens) {
    if (en.classId === cls.id) continue
    if (
      classSchedulesConflict(
        {
          dayOfWeek: cls.dayOfWeek,
          timeSlot: cls.timeSlot,
          lessonSlotsPerSession: cls.lessonSlotsPerSession,
        },
        {
          dayOfWeek: en.dayOfWeek,
          timeSlot: en.timeSlot,
          lessonSlotsPerSession: en.lessonSlotsPerSession,
        }
      )
    ) {
      reasons.push("時間衝突")
      conflictWith = formatConflictLabel(en)
      break
    }
  }

  return { reasons: [...new Set(reasons)], conflictWith }
}

export function buildClassMatchBundles(opts: {
  classes: PromotionClassRow[]
  students: PromotionStudentRow[]
  enrollments: PromotionEnrollmentRow[]
  historicalSubjects?: PromotionHistoricalSubjectRow[]
  minFullTerm?: number
}): ClassMatchBundle[] {
  const { classes, students, enrollments, historicalSubjects = [], minFullTerm = 1 } = opts
  const studentById = new Map(students.map((s) => [s.id, s]))
  const bundles: ClassMatchBundle[] = []

  for (const cls of classes) {
    const fullTermEns = enrollments.filter(
      (e) => e.classId === cls.id && e.status === "就讀中" && isFullTermEnrollment(e.period)
    )
    if (fullTermEns.length < minFullTerm) continue

    const fullTermStudents = fullTermEns
      .map((e) => studentById.get(e.studentId))
      .filter((s): s is PromotionStudentRow => s != null)

    const eligible: EligibleCandidate[] = []
    const excluded: ExcludedCandidate[] = []

    for (const student of students) {
      const { reasons, conflictWith } = evaluateStudentForClass({ student, cls, enrollments })
      if (reasons.length === 0) {
        eligible.push({
          student,
          previouslyStudiedTargetSubject: hasHistoricalSubject(
            student.id,
            cls.subjectId,
            historicalSubjects
          ),
          currentlyStudiesTargetSubject: hasCurrentSubject(
            student.id,
            cls.subjectId,
            enrollments
          ),
          currentClasses: currentClassesOf(student.id, enrollments),
        })
      } else {
        const gradeOk = cls.grades.includes(student.gradeLabel)
        const related = gradeOk || reasons.includes("已報讀本班")
        if (related) {
          excluded.push({ student, reasons, conflictWith })
        }
      }
    }

    eligible.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, "zh-Hant"))
    excluded.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, "zh-Hant"))

    bundles.push({
      cls,
      fullTermCount: fullTermEns.length,
      fullTermStudents,
      eligible,
      excluded,
    })
  }

  return bundles.sort(
    (a, b) =>
      b.fullTermCount - a.fullTermCount || a.cls.label.localeCompare(b.cls.label, "zh-Hant")
  )
}

export function buildStudentMatchBundles(opts: {
  classes: PromotionClassRow[]
  students: PromotionStudentRow[]
  enrollments: PromotionEnrollmentRow[]
  minFullTermHot?: number
}): StudentMatchBundle[] {
  const { classes, students, enrollments, minFullTermHot = 2 } = opts
  const fullTermCountByClass = new Map<string, number>()
  for (const cls of classes) {
    const n = enrollments.filter(
      (e) => e.classId === cls.id && e.status === "就讀中" && isFullTermEnrollment(e.period)
    ).length
    fullTermCountByClass.set(cls.id, n)
  }

  const bundles: StudentMatchBundle[] = []

  for (const student of students) {
    if (student.registrationStatus !== "已註冊") continue

    const eligible: EligibleClassForStudent[] = []
    const blocked: BlockedClassForStudent[] = []

    for (const cls of classes) {
      if (!cls.grades.includes(student.gradeLabel)) continue
      const fullTermCount = fullTermCountByClass.get(cls.id) ?? 0
      const isHotFullTerm = fullTermCount >= minFullTermHot
      const { reasons, conflictWith } = evaluateStudentForClass({ student, cls, enrollments })
      if (reasons.length === 0) {
        eligible.push({ cls, fullTermCount, isHotFullTerm })
      } else {
        blocked.push({ cls, fullTermCount, isHotFullTerm, reasons, conflictWith })
      }
    }

    eligible.sort(
      (a, b) =>
        Number(b.isHotFullTerm) - Number(a.isHotFullTerm) ||
        b.fullTermCount - a.fullTermCount ||
        a.cls.label.localeCompare(b.cls.label, "zh-Hant")
    )
    blocked.sort((a, b) => a.cls.label.localeCompare(b.cls.label, "zh-Hant"))

    bundles.push({
      student,
      currentClasses: currentClassesOf(student.id, enrollments),
      eligible,
      blocked,
    })
  }

  return bundles.sort(
    (a, b) =>
      b.eligible.length - a.eligible.length ||
      a.student.gradeLabel.localeCompare(b.student.gradeLabel, "zh-Hant") ||
      a.student.fullName.localeCompare(b.student.fullName, "zh-Hant")
  )
}
