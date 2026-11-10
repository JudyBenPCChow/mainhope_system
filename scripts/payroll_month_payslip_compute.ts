/**
 * 用計糧引擎純函數，把 production 匯出的原始列算成工資單。
 * 不寫 payroll_runs。組裝規則對齊 payrollQueries.computeUiTeachers／mapComputedToUiRow。
 */
import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { formatClassLabel } from "@/lib/courseLabel"
import { normalizeEnrollmentPeriod } from "@/lib/enrollmentPeriod"
import { attendanceStatusToHc, isActualPresentHc, isNonBillableLeaveHc } from "@/lib/payroll/hcStatus"
import type { PayrollGradeBlock, PayrollLesson, PayrollMonthMock, PayrollTeacherRow } from "@/lib/payroll/viewTypes"
import { computePayrollMonth } from "@/lib/payroll/computeMonth"
import { isScheduleCancelled, resolvePayrollGradeBand, resolvePrivateSlotKind, roundMoney } from "@/lib/payroll/gradeBand"
import {
  CHRISTINE_HOMEWORK_COMMISSION_NAME,
  rosterHoursByTeacher,
  type HomeworkDutyShift,
} from "@/lib/payroll/homeworkHours"
import { teacherNeedsMpf, withMpf } from "@/lib/payroll/mpf"
import { parseExtraWfhHourlyRate, parsePayrollMode, parseRateConfig, pickRateForMonth } from "@/lib/payroll/rates"
import type { ComputedLessonLine, PayrollLessonInput, PayrollMode, PayrollRateRow, PayrollTeacherInput } from "@/lib/payroll/types"
import { homeworkCommissionFallbackFromEnrollments, sumInProgressHomeworkCommission } from "@/services/payrollHomeworkQueries"
import { coursePricesFromClassEmbed, unitPriceForConsumedLesson } from "@/services/mgmtDashboardQueries"
import { classKindLabel, resolveClassKind } from "@/lib/privateClassKind"
import { parseMakeupOfScheduleId, parseMakeupOriginalDate } from "@/lib/scheduleMakeupMarkers"
import {
  rosterHeadcountForSchedule,
  type ScheduleRosterContext,
  type ScheduleRosterSchedule,
} from "@/services/scheduleRosterQueries"
import type { AttendanceDeclarationRow } from "@/services/entitlementQueries"
import { normalizeTeacherEmploymentStatus } from "@/services/teacherQueries"

export type PayslipLesson = {
  date: string
  start: string
  end: string
  classLabel: string
  formula: string
  amount: number
  billableHc: number
  rosterCount: number
  missingRollCall: boolean
  substituteNote: string | null
  present: string
  noShow: string
  nonBill: string
}

export type PayslipTeacher = {
  id: string
  name: string
  mode: string
  gross: number
  employeeMpf: number
  employerMpf: number
  net: number
  previousGross: number | null
  lessonCount: number
  billableHc: number
  anomalies: string[]
  hardBlock: boolean
  lines: { label: string; amount: number }[]
  lessons: PayslipLesson[]
  commissionItems: { teacherName: string; classLabel: string; date: string; amount: number }[]
  adjustment: { fromAmount: number; toAmount: number; reason: string } | null
}

export type PayslipPack = {
  monthKey: string
  monthLabel: string
  generatedAt: string
  runStatus: string
  note: string
  teachers: PayslipTeacher[]
  excluded: { name: string; reason: string }[]
  totals: { count: number; gross: number; employeeMpf: number; employerMpf: number; net: number }
  pdfMonth: PayrollMonthMock
  pdfTeachers: PayrollTeacherRow[]
}

type Row = Record<string, unknown>

function rows(value: unknown): Row[] {
  if (!Array.isArray(value)) return []
  return value.filter((row): row is Row => row != null && typeof row === "object" && !Array.isArray(row))
}

function str(value: unknown): string {
  return value == null ? "" : String(value)
}

function ymd(value: unknown): string {
  return str(value).slice(0, 10)
}

function hm(value: unknown): string {
  const s = str(value).slice(0, 5)
  return /^\d{2}:\d{2}$/.test(s) ? s : ""
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function nullable(value: unknown): string | null {
  const s = str(value).trim()
  return s === "" || s === "null" ? null : s
}

function boolOrNull(value: unknown): boolean | null {
  if (value === true || value === "true" || value === "t") return true
  if (value === false || value === "false" || value === "f") return false
  return null
}

function gradeLabels(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((item) => str(item)).filter(Boolean)
  if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^"|"$/g, ""))
      .filter(Boolean)
  }
  return null
}

function isHomeworkClass(subject: string | null, courseName: string | null): boolean {
  return /功課|HWK|homework/i.test(`${subject ?? ""} ${courseName ?? ""}`)
}

function statusLabel(status: string): string {
  switch (attendanceStatusToHc(status)) {
    case "in_person":
      return "現場"
    case "zoom":
      return "Zoom"
    case "recording":
      return "錄影"
    case "no_show":
      return "no show"
    case "sick":
      return "病假"
    case "personal":
      return "事假"
    case "leave_billable":
      return "請假而不需補回"
  }
}

function joinNames(names: string[]): string {
  return names.length > 0 ? names.join("、") : "—"
}

function lessonStudents(lesson: PayrollLessonInput): Pick<PayslipLesson, "present" | "noShow" | "nonBill"> {
  const present: string[] = []
  const noShow: string[] = []
  const nonBill: string[] = []
  for (const student of lesson.students) {
    const bucket = attendanceStatusToHc(student.status)
    const name = student.studentName || "—"
    if (bucket === "no_show") noShow.push(name)
    else if (isNonBillableLeaveHc(bucket) || !student.billable) nonBill.push(`${name}（${statusLabel(student.status)}）`)
    else if (isActualPresentHc(bucket)) present.push(`${statusLabel(student.status)} ${name}`)
    else present.push(`${name}（${statusLabel(student.status)}）`)
  }
  return { present: joinNames(present), noShow: joinNames(noShow), nonBill: joinNames(nonBill) }
}

function mapRoster(raw: unknown, declarations: AttendanceDeclarationRow[]): ScheduleRosterContext {
  const root = raw != null && typeof raw === "object" && !Array.isArray(raw) ? (raw as Row) : {}
  const enrollmentScheduleIds = new Map<string, Set<string>>()
  const enrollmentSessionNumbers = new Map<string, number[]>()
  for (const row of rows(root.enrollment_sessions)) {
    const enrollmentId = str(row.enrollment_id)
    const scheduleId = str(row.schedule_id)
    if (!enrollmentId || !scheduleId) continue
    const ids = enrollmentScheduleIds.get(enrollmentId) ?? new Set<string>()
    ids.add(scheduleId)
    enrollmentScheduleIds.set(enrollmentId, ids)
    const sessionNumber = Number(row.session_number)
    if (Number.isFinite(sessionNumber)) {
      const numbers = enrollmentSessionNumbers.get(enrollmentId) ?? []
      if (!numbers.includes(sessionNumber)) numbers.push(sessionNumber)
      numbers.sort((a, b) => a - b)
      enrollmentSessionNumbers.set(enrollmentId, numbers)
    }
  }

  const schedules: ScheduleRosterSchedule[] = rows(root.schedules)
    .map((row) => ({
      id: str(row.id),
      classId: nullable(row.class_id),
      scheduledDate: ymd(row.scheduled_date),
      sessionNumber: Number.isFinite(Number(row.session_number)) ? Number(row.session_number) : null,
      academicYearId: nullable(row.academic_year_id),
      academicYearLabel: nullable(row.academic_year_label),
      courseMode: (row.course_mode === "summer_two_period" ? "summer_two_period" : "regular") as ScheduleRosterSchedule["courseMode"],
      subject: nullable(row.subject),
      classKind: nullable(row.class_kind),
      courseCodeFull: nullable(row.course_code_full),
      courseName: nullable(row.course_name),
      dayOfWeek: nullable(row.day_of_week),
      timeSlot: nullable(row.time_slot),
      lessonSlotsPerSession: Number(row.lesson_slots_per_session) === 2 ? 2 : 1,
    }))
    .filter((row) => row.id)

  return {
    schedules,
    periods: rows(root.periods)
      .map((row) => ({
        id: str(row.id),
        academicYearId: str(row.academic_year_id),
        periodCode: Number(row.period_code) as 1 | 2,
        label: str(row.label),
        startDate: ymd(row.start_date),
        endDate: ymd(row.end_date),
      }))
      .filter((row) => row.id && row.academicYearId),
    enrollments: rows(root.enrollments)
      .map((row) => ({
        id: str(row.id),
        classId: str(row.class_id),
        studentId: str(row.student_id),
        status: str(row.status),
        enrollDate: nullable(row.enroll_date) ? ymd(row.enroll_date) : null,
        withdrawEffectiveDate: nullable(row.withdraw_effective_date) ? ymd(row.withdraw_effective_date) : null,
        enrollmentPeriod: normalizeEnrollmentPeriod(nullable(row.enrollment_period)),
        createdAt: str(row.created_at),
        fullName: str(row.full_name) || "—",
        englishName: null,
        grade: null,
        school: null,
        contactPhone: null,
      }))
      .filter((row) => row.id && row.classId && row.studentId),
    enrollmentScheduleIds,
    enrollmentSessionNumbers,
    trials: rows(root.trials)
      .map((row) => ({
        id: str(row.id),
        scheduleId: str(row.schedule_id),
        classId: str(row.class_id),
        studentId: str(row.student_id),
        status: str(row.status),
        paymentId: nullable(row.payment_id),
        countsTowardHeadcount: boolOrNull(row.counts_toward_headcount),
        fullName: str(row.full_name) || "—",
        englishName: null,
        grade: null,
        contactPhone: null,
      }))
      .filter((row) => row.id && row.scheduleId && row.studentId),
    leaves: rows(root.leaves)
      .map((row) => ({
        id: str(row.id),
        studentId: str(row.student_id),
        classId: str(row.class_id),
        scheduleId: nullable(row.schedule_id),
        leaveDate: ymd(row.leave_date),
        leaveReason: null,
        makeupType: nullable(row.makeup_type),
        makeupScheduleId: nullable(row.makeup_schedule_id),
        status: str(row.status),
        createdAt: str(row.created_at),
        fullName: str(row.full_name) || "—",
        englishName: null,
        grade: null,
        contactPhone: null,
      }))
      .filter((row) => row.id && row.studentId),
    attendance: [],
    activeDeclarations: declarations,
  }
}

function applyMakeupDates(context: ScheduleRosterContext, remarks: Row[], originalDates: Row[]): ScheduleRosterContext {
  const remarkById = new Map(remarks.map((row) => [str(row.id), nullable(row.remarks)]))
  const originalDateById = new Map(originalDates.map((row) => [str(row.id), ymd(row.scheduled_date)]))
  return {
    ...context,
    schedules: context.schedules.map((schedule) => {
      const remarksText = remarkById.get(schedule.id)
      const originalId = parseMakeupOfScheduleId(remarksText)
      const eligibilityDate =
        (originalId ? originalDateById.get(originalId) : null) ?? parseMakeupOriginalDate(remarksText) ?? null
      if (!eligibilityDate) return schedule
      return { ...schedule, enrollmentEligibilityDate: eligibilityDate }
    }),
  }
}

function homeworkShifts(dump: Row): { shifts: HomeworkDutyShift[]; closureDates: Set<string> } {
  const monthKey = str(dump.monthKey)
  const monthStart = `${monthKey}-01`
  const rosterIds = new Set(
    rows(dump.homeworkRosters)
      .filter((row) => ymd(row.roster_month) === monthStart && str(row.status) === "已編更")
      .map((row) => str(row.id))
  )
  const yearIds = new Set(
    rows(dump.homeworkRosters)
      .filter((row) => rosterIds.has(str(row.id)))
      .map((row) => str(row.academic_year_id))
      .filter(Boolean)
  )
  const days = rows(dump.homeworkDays).filter((row) => rosterIds.has(str(row.roster_month_id)))
  const dayById = new Map(days.map((row) => [str(row.id), row]))
  const assignments = rows(dump.homeworkAssignments).filter((row) => dayById.has(str(row.duty_day_id)))
  const daysWithAssignment = new Set(assignments.map((row) => str(row.duty_day_id)))
  const shifts: HomeworkDutyShift[] = []
  for (const assignment of assignments) {
    const day = dayById.get(str(assignment.duty_day_id))
    if (!day) continue
    shifts.push({
      teacherId: str(assignment.teacher_id),
      date: ymd(day.duty_date),
      start: hm(assignment.session_start) || hm(day.session_start) || "15:30",
      end: hm(assignment.session_end) || hm(day.session_end) || "19:30",
      holiday: Boolean(day.holiday_label),
    })
  }
  for (const day of days) {
    if (daysWithAssignment.has(str(day.id))) continue
    for (const key of ["primary_teacher_id", "secondary_teacher_id"] as const) {
      if (day[key] == null) continue
      shifts.push({
        teacherId: str(day[key]),
        date: ymd(day.duty_date),
        start: hm(day.session_start) || "15:30",
        end: hm(day.session_end) || "19:30",
        holiday: Boolean(day.holiday_label),
      })
    }
  }
  const closures = new Set(
    rows(dump.homeworkClosures)
      .filter((row) => yearIds.has(str(row.academic_year_id)))
      .map((row) => ymd(row.closure_date))
      .filter((date) => date.slice(0, 7) === monthKey)
  )
  return { shifts, closureDates: closures }
}

function homeworkRates(dump: Row, monthKey: string): Map<string, number> {
  const monthStart = `${monthKey}-01`
  const best = new Map<string, { from: string; rate: number }>()
  for (const row of rows(dump.homeworkRates)) {
    const from = ymd(row.effective_from)
    const to = nullable(row.effective_to) ? ymd(row.effective_to) : null
    if (from > monthStart) continue
    if (to != null && to < monthStart) continue
    const rate = num(row.hourly_rate)
    if (rate <= 0) continue
    const teacherId = str(row.teacher_id)
    const prev = best.get(teacherId)
    if (!prev || from > prev.from) best.set(teacherId, { from, rate })
  }
  return new Map([...best].map(([id, value]) => [id, value.rate]))
}

function buildLessons(dump: Row, context: ScheduleRosterContext): PayrollLessonInput[] {
  const periodByPair = new Map<string, ReturnType<typeof normalizeEnrollmentPeriod>>()
  for (const row of rows(dump.enrollmentPeriods)) {
    periodByPair.set(`${row.student_id}::${row.class_id}`, normalizeEnrollmentPeriod(nullable(row.enrollment_period)))
  }
  const attendanceBySchedule = new Map<string, Row[]>()
  for (const row of rows(dump.attendance)) {
    const scheduleId = nullable(row.schedule_id)
    if (!scheduleId) continue
    const list = attendanceBySchedule.get(scheduleId) ?? []
    list.push(row)
    attendanceBySchedule.set(scheduleId, list)
  }

  const lessons: PayrollLessonInput[] = []
  for (const row of rows(dump.schedules)) {
    const subject = nullable(row.subject)
    const courseName = nullable(row.course_name)
    if (isHomeworkClass(subject, courseName)) continue
    const scheduleId = str(row.id)
    const cancelled = isScheduleCancelled(nullable(row.status))
    const att = attendanceBySchedule.get(scheduleId) ?? []
    const expectedRosterCount = rosterHeadcountForSchedule(context, scheduleId)
    if (!cancelled && att.length === 0 && expectedRosterCount === 0) continue
    const grades = gradeLabels(row.grade)
    const { labels, band } = resolvePayrollGradeBand(grades, nullable(row.grade_code))
    const classKind = resolveClassKind(nullable(row.class_kind), subject)
    const prices = coursePricesFromClassEmbed({
      price_per_lesson: row.class_price,
      courses: {
        price_per_lesson: row.price_per_lesson,
        price_per_lesson_period_2: row.price_per_lesson_period_2,
        price_per_lesson_both_periods: row.price_per_lesson_both_periods,
      },
    })
    lessons.push({
      scheduleId,
      classId: str(row.class_id),
      classLabel: formatClassLabel({
        subject: subject ?? "",
        courseCode: nullable(row.course_code_full),
        courseName,
      }),
      classKind,
      privateSlot: resolvePrivateSlotKind(nullable(row.class_kind), subject),
      gradeLabels: labels,
      gradeBand: band,
      subjectCode: nullable(row.subject_code)?.toUpperCase() ?? null,
      scheduledDate: ymd(row.scheduled_date),
      startTime: hm(row.start_time) || null,
      endTime: hm(row.end_time) || null,
      cancelled,
      teacherId: nullable(row.teacher_id),
      teacherName: nullable(row.teacher_name),
      originalTeacherId: nullable(row.original_teacher_id),
      originalTeacherName: nullable(row.original_teacher_name),
      classOwnerTeacherId: nullable(row.class_owner_teacher_id),
      listPricePerLesson: num(row.class_price),
      expectedRosterCount,
      missingRollCall: !cancelled && att.length === 0 && expectedRosterCount > 0,
      students: att.map((item) => ({
        studentId: str(item.student_id),
        studentName: str(item.student_name) || "—",
        status: str(item.status),
        billable: isBillableAttendanceStatus(str(item.status)),
        listPrice: unitPriceForConsumedLesson({
          enrollmentPeriod: periodByPair.get(`${item.student_id}::${item.class_id}`) ?? null,
          classPriceOverride: prices.classPriceOverride,
          coursePrices: prices.coursePrices,
          paidUnitFallback: null,
        }),
      })),
    })
  }
  return lessons
}

function modeLabel(mode: PayrollMode | "未設定"): string {
  return mode
}

function uiLesson(lesson: ComputedLessonLine): PayrollLesson {
  const studentRows = lesson.students.map((student) => ({
    name: student.studentName,
    status: attendanceStatusToHc(student.status),
    countsTowardHc: student.billable,
  }))
  return {
    id: lesson.scheduleId,
    date: lesson.date,
    startTime: lesson.startTime ?? "",
    endTime: lesson.endTime ?? "",
    billableHc: lesson.billableHc,
    amount: lesson.amount,
    presentStudents: studentRows.filter((row) => isActualPresentHc(row.status)).map((row) => row.name),
    absentStudents: studentRows.filter((row) => !isActualPresentHc(row.status)).map((row) => row.name),
    studentRows,
    notRolled: lesson.missingRollCall,
    note: lesson.note ?? undefined,
    formula: lesson.formula,
    substitute: lesson.substitute ? "received" : undefined,
    substitutePeer: lesson.substitute ? (lesson.originalTeacherName ?? undefined) : undefined,
    listPrice: lesson.listPriceTotal || undefined,
    scheduleId: lesson.scheduleId,
    classId: lesson.classId,
    rosterCount: Math.max(lesson.expectedRosterCount, lesson.students.length),
  }
}

function uiGrades(lessons: ComputedLessonLine[]): PayrollGradeBlock[] {
  const gradeMap = new Map<string, Map<string, { name: string; kind: PayrollGradeBlock["classes"][number]["classKind"]; lessons: PayrollLesson[] }>>()
  for (const lesson of lessons) {
    const gradeLabel = classKindLabel(lesson.classKind)
    if (!gradeMap.has(gradeLabel)) gradeMap.set(gradeLabel, new Map())
    const classMap = gradeMap.get(gradeLabel)!
    if (!classMap.has(lesson.classId)) {
      classMap.set(lesson.classId, { name: lesson.classLabel, kind: lesson.classKind, lessons: [] })
    }
    classMap.get(lesson.classId)!.lessons.push(uiLesson(lesson))
  }
  const grades: PayrollGradeBlock[] = []
  for (const [gradeLabel, classMap] of gradeMap) {
    grades.push({
      gradeLabel,
      classes: [...classMap].map(([classId, block]) => ({
        id: classId,
        name: block.name,
        classKind: block.kind,
        lessons: block.lessons.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
      })),
    })
  }
  return grades
}

export function buildPayslipPack(dump: Row): PayslipPack {
  const monthKey = str(dump.monthKey)
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error("月份格式須為 YYYY-MM")
  const [year, month] = monthKey.split("-")
  const monthLabel = `${year}年${Number(month)}月`

  const rates: PayrollRateRow[] = rows(dump.rates).map((row) => {
    const mode = parsePayrollMode(str(row.mode))
    if (!mode) throw new Error(`未知計糧模式：${str(row.mode)}`)
    let config = row.config
    if (typeof config === "string") {
      try {
        config = JSON.parse(config) as unknown
      } catch {
        config = {}
      }
    }
    return {
      id: str(row.id),
      teacherId: str(row.teacher_id),
      mode,
      effectiveFrom: ymd(row.effective_from),
      effectiveTo: nullable(row.effective_to) ? ymd(row.effective_to) : null,
      config: parseRateConfig(config),
      notes: nullable(row.notes),
    }
  })

  const hoursByTeacher = new Map(
    rows(dump.manualHours).map((row) => {
      const status = str(row.status)
      const ui = status === "approved" ? "approved" : status === "submitted" ? "submitted" : "missing"
      return [str(row.teacher_id), {
        hours: num(row.hours),
        status: ui,
        extraWfhHourlyRate: parseExtraWfhHourlyRate(nullable(row.note)),
      }] as const
    })
  )
  const hwRates = homeworkRates(dump, monthKey)
  const hwOverrides = new Map(rows(dump.homeworkOverrides).map((row) => [str(row.teacher_id), num(row.hours)]))
  const { shifts, closureDates } = homeworkShifts(dump)
  const hwRosterHours = rosterHoursByTeacher(shifts, closureDates)

  const declarations: AttendanceDeclarationRow[] = rows(dump.declarations).map((row) => ({
    id: str(row.id),
    scheduleId: str(row.schedule_id),
    studentId: str(row.student_id),
    poolId: str(row.pool_id),
    status: "active",
    supersededBy: nullable(row.superseded_by),
    sourceEventType: nullable(row.source_event_type),
    sourceEventId: nullable(row.source_event_id),
    manualReason: nullable(row.manual_reason),
    voidReason: null,
    createdAt: str(row.created_at),
  }))
  const context = applyMakeupDates(mapRoster(dump.roster, declarations), rows(dump.remarks), rows(dump.originalDates))
  const lessons = buildLessons(dump, context)

  const teachers = rows(dump.teachers).map((row) => ({
    id: str(row.id),
    name: str(row.full_name),
    status: normalizeTeacherEmploymentStatus(nullable(row.status)),
  }))
  const inputs: PayrollTeacherInput[] = teachers
    .filter((teacher) => teacher.status === "在職")
    .map((teacher) => {
      const hours = hoursByTeacher.get(teacher.id)
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        rate: pickRateForMonth(rates, teacher.id, monthKey),
        approvedHours: hours?.status === "approved" ? hours.hours : 0,
        extraWfhHourlyRate: hours?.status === "approved" ? hours.extraWfhHourlyRate : null,
        homeworkHourlyRate: hwRates.get(teacher.id) ?? null,
        homeworkRosterHours: hwRosterHours.get(teacher.id) ?? 0,
        homeworkOverrideHours: hwOverrides.has(teacher.id) ? hwOverrides.get(teacher.id)! : null,
      }
    })
  const seen = new Set(inputs.map((teacher) => teacher.teacherId))
  for (const lesson of lessons) {
    if (!lesson.teacherId || seen.has(lesson.teacherId)) continue
    seen.add(lesson.teacherId)
    inputs.push({
      teacherId: lesson.teacherId,
      teacherName: lesson.teacherName ?? "—",
      rate: pickRateForMonth(rates, lesson.teacherId, monthKey),
      approvedHours: 0,
      extraWfhHourlyRate: null,
      homeworkHourlyRate: hwRates.get(lesson.teacherId) ?? null,
      homeworkRosterHours: hwRosterHours.get(lesson.teacherId) ?? 0,
      homeworkOverrideHours: hwOverrides.has(lesson.teacherId) ? hwOverrides.get(lesson.teacherId)! : null,
    })
  }

  const previousGross: Record<string, number> = {}
  for (const row of rows(dump.previousGross)) {
    if (row.id != null && row.gross != null) previousGross[str(row.id)] = num(row.gross)
  }

  const christine = teachers.find((teacher) => teacher.name === CHRISTINE_HOMEWORK_COMMISSION_NAME)
  const classIds = [...new Set(rows(dump.homeworkClasses).map((row) => str(row.id)).filter(Boolean))]
  const chargesByClass = new Map<string, { studentId: string; amountHkd: number }[]>()
  for (const row of rows(dump.homeworkCharges)) {
    const classId = str(row.class_id)
    const list = chargesByClass.get(classId) ?? []
    list.push({ studentId: str(row.student_id), amountHkd: num(row.amount_hkd) })
    chargesByClass.set(classId, list)
  }
  const enrollsByClass = new Map<string, Row[]>()
  for (const row of rows(dump.homeworkEnrollments)) {
    const classId = str(row.class_id)
    const list = enrollsByClass.get(classId) ?? []
    list.push(row)
    enrollsByClass.set(classId, list)
  }
  const commissionTotals = sumInProgressHomeworkCommission(
    classIds.map((classId) => ({
      charges: chargesByClass.get(classId) ?? [],
      enrollmentFallback:
        (chargesByClass.get(classId)?.length ?? 0) > 0
          ? { enrolledCount: 0, originalPriceTotal: 0 }
          : homeworkCommissionFallbackFromEnrollments(
              (enrollsByClass.get(classId) ?? []).map((row) => ({
                student_id: row.student_id,
                enroll_date: row.enroll_date,
                homework_day_plan: row.homework_day_plan,
                students: { grade: row.grade },
              })),
              monthKey
            ),
    }))
  )

  const computed = computePayrollMonth({
    monthKey,
    teachers: inputs,
    lessons,
    previousGrossByTeacherId: previousGross,
    homeworkCommission: christine
      ? {
          teacherId: christine.id,
          enrolledCount: commissionTotals.enrolledCount,
          originalPriceTotal: commissionTotals.originalPriceTotal,
        }
      : null,
  })

  const approvedByTeacher = new Map<string, Row>()
  for (const row of rows(dump.adjustments)) {
    if (str(row.status) !== "approved") continue
    const prev = approvedByTeacher.get(str(row.teacher_id))
    if (!prev || str(row.created_at) > str(prev.created_at)) approvedByTeacher.set(str(row.teacher_id), row)
  }
  const excludedIds = new Map(
    rows(dump.teacherStates)
      .filter((row) => boolOrNull(row.excluded) === true)
      .map((row) => [str(row.teacher_id), str(row.exclude_reason) || "財務排除"])
  )
  const nameById = new Map(teachers.map((teacher) => [teacher.id, teacher.name]))

  const slips: PayslipTeacher[] = []
  const pdfTeachers: PayrollTeacherRow[] = []
  const excluded: { name: string; reason: string }[] = []
  for (const teacher of computed.teachers) {
    const include =
      teacher.grossBeforeAdj > 0 ||
      teacher.anomalies.length > 0 ||
      teacher.mode === "固定月薪" ||
      teacher.mode === "WFH 時薪" ||
      teacher.missingRate ||
      (teacher.homework != null && (teacher.homework.amount > 0 || teacher.homework.rosterHours > 0)) ||
      (teacher.homeworkCommission != null && teacher.homeworkCommission.amount > 0)
    if (!include) continue
    if (excludedIds.has(teacher.teacherId)) {
      excluded.push({
        name: teacher.teacherName,
        reason: excludedIds.get(teacher.teacherId) ?? "財務排除",
      })
      continue
    }
    const mpfOn = teacherNeedsMpf({
      teacherName: teacher.teacherName,
      rateMpfFlag: teacher.mode === "分成制" || teacher.mode === "固定月薪" ? true : undefined,
    })
    const adjustment = approvedByTeacher.get(teacher.teacherId)
    const grossBefore = teacher.grossBeforeAdj
    const gross = adjustment ? num(adjustment.to_amount) : grossBefore
    const mpf = mpfOn ? withMpf(gross) : { gross, employeeMpf: 0, employerMpf: 0, net: gross }
    if (!(mpf.gross > 0)) continue
    const taught = teacher.lessons.filter((lesson) => !lesson.missingRollCall)
    slips.push({
      id: teacher.teacherId,
      name: teacher.teacherName || nameById.get(teacher.teacherId) || "—",
      mode: modeLabel(teacher.mode),
      gross: mpf.gross,
      employeeMpf: mpf.employeeMpf,
      employerMpf: mpf.employerMpf,
      net: mpf.net,
      previousGross: previousGross[teacher.teacherId] ?? null,
      lessonCount: taught.length,
      billableHc: taught.reduce((sum, lesson) => sum + lesson.billableHc, 0),
      anomalies: teacher.anomalies,
      hardBlock: teacher.hardBlock,
      lines: teacher.lines.map((line) => ({ label: line.label, amount: line.amount })),
      lessons: teacher.lessons.map((lesson) => {
        const names = lessonStudents({
          ...({} as PayrollLessonInput),
          students: lesson.students,
        })
        return {
          date: lesson.date,
          start: lesson.startTime ?? "",
          end: lesson.endTime ?? "",
          classLabel: lesson.classLabel,
          formula: lesson.formula,
          amount: lesson.amount,
          billableHc: lesson.billableHc,
          rosterCount: Math.max(lesson.expectedRosterCount, lesson.students.length),
          missingRollCall: lesson.missingRollCall,
          substituteNote: lesson.substitute ? `代堂（原任 ${lesson.originalTeacherName ?? "—"}）` : null,
          present: names.present,
          noShow: names.noShow,
          nonBill: names.nonBill,
        }
      }),
      commissionItems: teacher.commissionPoolItems.map((item) => ({
        teacherName: item.teacherName,
        classLabel: item.classLabel,
        date: item.date,
        amount: item.amount,
      })),
      adjustment: adjustment
        ? {
            fromAmount: num(adjustment.from_amount) || grossBefore,
            toAmount: num(adjustment.to_amount),
            reason: str(adjustment.reason),
          }
        : null,
    })
    pdfTeachers.push({
      id: teacher.teacherId,
      name: teacher.teacherName || nameById.get(teacher.teacherId) || "—",
      mode: (teacher.mode === "未設定" ? "未設定" : teacher.mode) as PayrollTeacherRow["mode"],
      gross: mpf.gross,
      employeeMpf: mpf.employeeMpf,
      employerMpf: mpf.employerMpf,
      net: mpf.net,
      previousGross: previousGross[teacher.teacherId] ?? null,
      anomalies: teacher.anomalies,
      lines: teacher.lines.map((line) => ({ label: line.label, amount: line.amount })),
      grades: uiGrades(teacher.lessons),
      missingRate: teacher.missingRate || teacher.mode === "未設定",
    })
  }

  slips.sort((a, b) => {
    const aBlock = a.hardBlock || a.anomalies.length > 0 ? 0 : 1
    const bBlock = b.hardBlock || b.anomalies.length > 0 ? 0 : 1
    if (aBlock !== bBlock) return aBlock - bBlock
    return b.gross - a.gross
  })
  const order = new Map(slips.map((teacher, index) => [teacher.id, index]))
  pdfTeachers.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))

  const totals = slips.reduce(
    (sum, teacher) => ({
      count: sum.count + 1,
      gross: roundMoney(sum.gross + teacher.gross),
      employeeMpf: roundMoney(sum.employeeMpf + teacher.employeeMpf),
      employerMpf: roundMoney(sum.employerMpf + teacher.employerMpf),
      net: roundMoney(sum.net + teacher.net),
    }),
    { count: 0, gross: 0, employeeMpf: 0, employerMpf: 0, net: 0 }
  )

  const generatedAt = str(dump.generatedAt) || new Date().toISOString()
  const calcLabel = generatedAt.replace("T", " ").slice(0, 16)
  const calcVersion = Number(dump.calcVersion) || 1
  const runStatus = str(dump.runStatus) || "財務審閱中"
  return {
    monthKey,
    monthLabel,
    generatedAt,
    runStatus,
    note: "該月尚未結算。本單據按 production 點名、費率、人手調整與功輔編更即時計算，不是已結算凍結數。計薪跟計糧引擎：現場、錄影、網課、no show、請假而不需補回計入；事假、病假不計入。",
    teachers: slips,
    excluded,
    totals,
    pdfTeachers,
    pdfMonth: {
      monthKey,
      monthLabel,
      status: runStatus === "已結算" || runStatus === "待管理層核實" || runStatus === "草稿" ? runStatus : "財務審閱中",
      teachers: pdfTeachers,
      calc: {
        version: calcVersion,
        computedAt: calcLabel,
        dataCutoffAt: calcLabel,
      },
    },
  }
}
