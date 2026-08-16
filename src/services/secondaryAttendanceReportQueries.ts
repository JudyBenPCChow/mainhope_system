import { isAbsentAttendanceStatus, isActualPresentStatus } from "@/lib/attendancePresence"
import { resolveClassGradeLabels } from "@/lib/classGrade"
import { formatClassLabel } from "@/lib/courseLabel"
import { billingMonthBounds, normalizeBillingMonth } from "@/lib/monthlyTuition"
import { resolveClassKind, type ClassKind } from "@/lib/privateClassKind"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"

export const SECONDARY_GRADE_LABELS = ["中一", "中二", "中三", "中四", "中五", "中六"] as const
const SECONDARY_GRADE_SET = new Set<string>(SECONDARY_GRADE_LABELS)

export type SecondaryLessonRow = {
  id: string
  date: string
  startTime: string
  endTime: string
  presentStudents: string[]
  absentStudents: string[]
  notRolled: boolean
  makeupOrTrialNote?: string
}

export type SecondaryClassBlock = {
  id: string
  name: string
  classKind: ClassKind
  lessons: SecondaryLessonRow[]
}

export type SecondaryGradeUnderTeacher = {
  gradeLabel: string
  classes: SecondaryClassBlock[]
}

export type SecondaryTeacherBlock = {
  id: string
  name: string
  grades: SecondaryGradeUnderTeacher[]
}

export type SecondaryAttendanceReportPayload = {
  yearMonth: string
  fromYmd: string
  toYmd: string
  teachers: SecondaryTeacherBlock[]
}

export type SecondaryBand = "junior" | "senior"

export type CategoryKey =
  | "juniorGroup"
  | "seniorGroup"
  | "juniorPrivate"
  | "seniorPrivate"

export type CategoryTotals = {
  key: CategoryKey
  label: string
  band: SecondaryBand
  classKind: ClassKind
  classCount: number
  lessonCount: number
  presentVisits: number
  absentVisits: number
  gradeIds: Set<string>
}

export type GradeKindSummaryRow = {
  gradeLabel: string
  classKind: ClassKind
  classCount: number
  lessonCount: number
  presentVisits: number
  absentVisits: number
}

const JUNIOR_GRADES = new Set(["中一", "中二", "中三"])
const SENIOR_GRADES = new Set(["中四", "中五", "中六"])

const CATEGORY_META: {
  key: CategoryKey
  label: string
  band: SecondaryBand
  classKind: ClassKind
}[] = [
  { key: "juniorGroup", label: "初中專科班", band: "junior", classKind: "group" },
  { key: "seniorGroup", label: "高中專科班", band: "senior", classKind: "group" },
  { key: "juniorPrivate", label: "初中私人課程", band: "junior", classKind: "private" },
  { key: "seniorPrivate", label: "高中私人課程", band: "senior", classKind: "private" },
]

export { classKindLabel } from "@/lib/privateClassKind"

export function secondaryBandOfGrade(gradeLabel: string): SecondaryBand | null {
  if (JUNIOR_GRADES.has(gradeLabel)) return "junior"
  if (SENIOR_GRADES.has(gradeLabel)) return "senior"
  return null
}

export function categoryKeyOf(band: SecondaryBand, classKind: ClassKind): CategoryKey {
  if (band === "junior") return classKind === "group" ? "juniorGroup" : "juniorPrivate"
  return classKind === "group" ? "seniorGroup" : "seniorPrivate"
}

/** 跨多個中學年級時取排序後第一個，避免人次重複計算 */
export function primarySecondaryGrade(labels: string[]): string | null {
  for (const g of SECONDARY_GRADE_LABELS) {
    if (labels.includes(g)) return g
  }
  return null
}

export function lessonPresentCount(l: SecondaryLessonRow): number {
  return l.notRolled ? 0 : l.presentStudents.length
}

export function lessonAbsentCount(l: SecondaryLessonRow): number {
  return l.notRolled ? 0 : l.absentStudents.length
}

export function classPresentTotal(c: SecondaryClassBlock): number {
  return c.lessons.reduce((s, l) => s + lessonPresentCount(l), 0)
}

export function classAbsentTotal(c: SecondaryClassBlock): number {
  return c.lessons.reduce((s, l) => s + lessonAbsentCount(l), 0)
}

export function gradePresentTotal(g: SecondaryGradeUnderTeacher): number {
  return g.classes.reduce((s, c) => s + classPresentTotal(c), 0)
}

export function gradeAbsentTotal(g: SecondaryGradeUnderTeacher): number {
  return g.classes.reduce((s, c) => s + classAbsentTotal(c), 0)
}

export function gradeLessonCount(g: SecondaryGradeUnderTeacher): number {
  return g.classes.reduce((s, c) => s + c.lessons.length, 0)
}

export function teacherPresentTotal(t: SecondaryTeacherBlock): number {
  return t.grades.reduce((s, g) => s + gradePresentTotal(g), 0)
}

export function teacherAbsentTotal(t: SecondaryTeacherBlock): number {
  return t.grades.reduce((s, g) => s + gradeAbsentTotal(g), 0)
}

export function teacherLessonCount(t: SecondaryTeacherBlock): number {
  return t.grades.reduce((s, g) => s + gradeLessonCount(g), 0)
}

export function teacherClassCount(t: SecondaryTeacherBlock): number {
  return t.grades.reduce((s, g) => s + g.classes.length, 0)
}

function emptyCategory(meta: (typeof CATEGORY_META)[number]): CategoryTotals {
  return {
    key: meta.key,
    label: meta.label,
    band: meta.band,
    classKind: meta.classKind,
    classCount: 0,
    lessonCount: 0,
    presentVisits: 0,
    absentVisits: 0,
    gradeIds: new Set(),
  }
}

export function teacherCategoryTotals(t: SecondaryTeacherBlock): CategoryTotals[] {
  const map = new Map<CategoryKey, CategoryTotals>()
  for (const meta of CATEGORY_META) map.set(meta.key, emptyCategory(meta))

  for (const g of t.grades) {
    const band = secondaryBandOfGrade(g.gradeLabel)
    if (!band) continue
    for (const c of g.classes) {
      const key = categoryKeyOf(band, c.classKind)
      const target = map.get(key)!
      target.gradeIds.add(g.gradeLabel)
      target.classCount += 1
      target.lessonCount += c.lessons.length
      target.presentVisits += classPresentTotal(c)
      target.absentVisits += classAbsentTotal(c)
    }
  }
  return CATEGORY_META.map((m) => map.get(m.key)!)
}

export function teacherGradeKindRows(t: SecondaryTeacherBlock): GradeKindSummaryRow[] {
  const rows: GradeKindSummaryRow[] = []
  for (const g of t.grades) {
    for (const kind of ["group", "private"] as const) {
      const classes = g.classes.filter((c) => c.classKind === kind)
      if (classes.length === 0) continue
      rows.push({
        gradeLabel: g.gradeLabel,
        classKind: kind,
        classCount: classes.length,
        lessonCount: classes.reduce((s, c) => s + c.lessons.length, 0),
        presentVisits: classes.reduce((s, c) => s + classPresentTotal(c), 0),
        absentVisits: classes.reduce((s, c) => s + classAbsentTotal(c), 0),
      })
    }
  }
  return rows
}

export function currentBillingMonthYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

type AttRow = { scheduleId: string; status: string; studentName: string }

type SchedRaw = {
  id: string
  scheduledDate: string
  startTime: string
  endTime: string
  teacherId: string
  teacherName: string
  classId: string
  className: string
  classKind: ClassKind
  gradeLabel: string
}

function isCancelledStatus(status: string): boolean {
  return status.includes("取消")
}

async function fetchAttendanceByScheduleIds(scheduleIds: string[]): Promise<Map<string, AttRow[]>> {
  const bySchedule = new Map<string, AttRow[]>()
  if (!supabase || scheduleIds.length === 0) return bySchedule

  const chunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("attendance_details")
      .select("id, schedule_id, status, students ( full_name )")
      .in("schedule_id", slice)
    if (error) throw error
    return (data ?? []) as Record<string, unknown>[]
  })

  for (const rows of chunks) {
    for (const row of rows) {
      const scheduleId = row.schedule_id != null ? String(row.schedule_id) : ""
      if (!scheduleId) continue
      const st = row.students as Record<string, unknown> | null
      const name =
        st?.full_name != null && String(st.full_name).trim() !== ""
          ? String(st.full_name).trim()
          : "—"
      const list = bySchedule.get(scheduleId) ?? []
      list.push({
        scheduleId,
        status: String(row.status ?? ""),
        studentName: name,
      })
      bySchedule.set(scheduleId, list)
    }
  }
  return bySchedule
}

async function fetchTrialMakeupNotes(
  scheduleIds: string[]
): Promise<Map<string, { trialNames: string[]; makeupNames: string[] }>> {
  const out = new Map<string, { trialNames: string[]; makeupNames: string[] }>()
  if (!supabase || scheduleIds.length === 0) return out

  const trialChunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("trial_sessions")
      .select("schedule_id, status, students ( full_name )")
      .in("schedule_id", slice)
    if (error) throw error
    return (data ?? []) as Record<string, unknown>[]
  })

  for (const rows of trialChunks) {
    for (const row of rows) {
      const status = String(row.status ?? "")
      if (status.includes("取消") || status.includes("完成")) continue
      const sid = row.schedule_id != null ? String(row.schedule_id) : ""
      if (!sid) continue
      const st = row.students as Record<string, unknown> | null
      const name = st?.full_name != null ? String(st.full_name).trim() : ""
      if (!name) continue
      const entry = out.get(sid) ?? { trialNames: [], makeupNames: [] }
      entry.trialNames.push(name)
      out.set(sid, entry)
    }
  }

  const makeupChunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("leave_makeup_records")
      .select("makeup_schedule_id, students ( full_name )")
      .in("makeup_schedule_id", slice)
    if (error) throw error
    return (data ?? []) as Record<string, unknown>[]
  })

  for (const rows of makeupChunks) {
    for (const row of rows) {
      const sid = row.makeup_schedule_id != null ? String(row.makeup_schedule_id) : ""
      if (!sid) continue
      const st = row.students as Record<string, unknown> | null
      const name = st?.full_name != null ? String(st.full_name).trim() : ""
      if (!name) continue
      const entry = out.get(sid) ?? { trialNames: [], makeupNames: [] }
      entry.makeupNames.push(name)
      out.set(sid, entry)
    }
  }

  return out
}

function buildMakeupOrTrialNote(
  presentNames: string[],
  notes: { trialNames: string[]; makeupNames: string[] } | undefined
): string | undefined {
  if (!notes) return undefined
  const present = new Set(presentNames)
  const trials = [...new Set(notes.trialNames.filter((n) => present.has(n)))]
  const makeups = [...new Set(notes.makeupNames.filter((n) => present.has(n)))]
  const parts: string[] = []
  if (trials.length > 0) parts.push(`含試堂：${trials.join("、")}`)
  if (makeups.length > 0) parts.push(`含補堂：${makeups.join("、")}`)
  return parts.length > 0 ? parts.join("；") : undefined
}

/**
 * 中學出席報表：以 schedules.teacher_id 歸屬；僅中一～中六；取消堂次排除。
 */
export async function fetchTeacherSecondaryAttendanceReport(
  yearMonthInput: string
): Promise<SecondaryAttendanceReportPayload> {
  const yearMonth = normalizeBillingMonth(yearMonthInput)
  const { start: fromYmd, end: toYmd } = billingMonthBounds(yearMonth)

  if (!supabase) {
    return { yearMonth, fromYmd, toYmd, teachers: [] }
  }

  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, scheduled_date, start_time, end_time, status, teacher_id, class_id, teachers!schedules_teacher_id_fkey ( id, full_name ), classes ( id, subject, class_kind, grade, course_code_full, courses ( course_name, grade_code ) )"
    )
    .gte("scheduled_date", fromYmd)
    .lte("scheduled_date", toYmd)
    .not("teacher_id", "is", null)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) throw error

  const rawSchedules: SchedRaw[] = []
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const status = String(row.status ?? "")
    if (isCancelledStatus(status)) continue
    const teacherId = row.teacher_id != null ? String(row.teacher_id) : ""
    if (!teacherId) continue
    const cls = row.classes as Record<string, unknown> | null
    if (!cls) continue
    const course = cls.courses as Record<string, unknown> | null
    const gradeRaw = Array.isArray(cls.grade) ? (cls.grade as string[]) : null
    const gradeCode = course?.grade_code != null ? String(course.grade_code) : null
    const labels = resolveClassGradeLabels(gradeRaw, gradeCode).filter((g) =>
      SECONDARY_GRADE_SET.has(g)
    )
    const gradeLabel = primarySecondaryGrade(labels)
    if (!gradeLabel) continue

    const subject = cls.subject != null ? String(cls.subject) : "—"
    const courseCode = cls.course_code_full != null ? String(cls.course_code_full) : null
    const courseName = course?.course_name != null ? String(course.course_name) : null
    const teacher = row.teachers as Record<string, unknown> | null
    const teacherName =
      teacher?.full_name != null && String(teacher.full_name).trim() !== ""
        ? String(teacher.full_name).trim()
        : "—"

    rawSchedules.push({
      id: String(row.id),
      scheduledDate: String(row.scheduled_date ?? ""),
      startTime: row.start_time != null ? String(row.start_time).slice(0, 5) : "",
      endTime: row.end_time != null ? String(row.end_time).slice(0, 5) : "",
      teacherId,
      teacherName,
      classId: String(cls.id ?? row.class_id ?? ""),
      className: formatClassLabel({ subject, courseCode, courseName }),
      classKind: resolveClassKind(
        cls.class_kind != null ? String(cls.class_kind) : null,
        subject
      ),
      gradeLabel,
    })
  }

  const scheduleIds = rawSchedules.map((s) => s.id)
  const [attendanceMap, noteMap] = await Promise.all([
    fetchAttendanceByScheduleIds(scheduleIds),
    fetchTrialMakeupNotes(scheduleIds).catch(() => new Map()),
  ])

  type ClassAcc = {
    id: string
    name: string
    classKind: ClassKind
    gradeLabel: string
    teacherId: string
    teacherName: string
    lessons: SecondaryLessonRow[]
  }

  const classMap = new Map<string, ClassAcc>()

  for (const s of rawSchedules) {
    const key = `${s.teacherId}::${s.gradeLabel}::${s.classId}`
    let acc = classMap.get(key)
    if (!acc) {
      acc = {
        id: s.classId,
        name: s.className,
        classKind: s.classKind,
        gradeLabel: s.gradeLabel,
        teacherId: s.teacherId,
        teacherName: s.teacherName,
        lessons: [],
      }
      classMap.set(key, acc)
    }

    const att = attendanceMap.get(s.id) ?? []
    const presentStudents: string[] = []
    const absentStudents: string[] = []
    for (const a of att) {
      if (isActualPresentStatus(a.status)) presentStudents.push(a.studentName)
      else if (isAbsentAttendanceStatus(a.status)) absentStudents.push(a.studentName)
    }
    const notRolled = att.length === 0
    const note = notRolled
      ? undefined
      : buildMakeupOrTrialNote(presentStudents, noteMap.get(s.id))

    acc.lessons.push({
      id: s.id,
      date: s.scheduledDate,
      startTime: s.startTime || "—",
      endTime: s.endTime || "—",
      presentStudents,
      absentStudents,
      notRolled,
      makeupOrTrialNote: note,
    })
  }

  const teacherMap = new Map<
    string,
    { id: string; name: string; grades: Map<string, SecondaryClassBlock[]> }
  >()

  for (const acc of classMap.values()) {
    let t = teacherMap.get(acc.teacherId)
    if (!t) {
      t = { id: acc.teacherId, name: acc.teacherName, grades: new Map() }
      teacherMap.set(acc.teacherId, t)
    }
    const list = t.grades.get(acc.gradeLabel) ?? []
    list.push({
      id: acc.id,
      name: acc.name,
      classKind: acc.classKind,
      lessons: acc.lessons,
    })
    t.grades.set(acc.gradeLabel, list)
  }

  const teachers: SecondaryTeacherBlock[] = [...teacherMap.values()]
    .map((t) => {
      const grades: SecondaryGradeUnderTeacher[] = SECONDARY_GRADE_LABELS.filter((g) =>
        t.grades.has(g)
      ).map((g) => ({
        gradeLabel: g,
        classes: (t.grades.get(g) ?? []).sort((a, b) =>
          a.name.localeCompare(b.name, "zh-Hant")
        ),
      }))
      return { id: t.id, name: t.name, grades }
    })
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))

  return { yearMonth, fromYmd, toYmd, teachers }
}
