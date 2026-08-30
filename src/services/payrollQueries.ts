/**
 * 計糧：讀點名／排程／費率 → 純引擎計算；月結 run／調整／WFH CRUD。
 */
import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { formatClassLabel } from "@/lib/courseLabel"
import { resolveClassKind, classKindLabel } from "@/lib/privateClassKind"
import {
  isScheduleCancelled,
  resolvePayrollGradeBand,
  resolvePrivateSlotKind,
  roundMoney,
} from "@/lib/payroll/gradeBand"
import { computePayrollMonth } from "@/lib/payroll/computeMonth"
import { attendanceStatusToHc, isActualPresentHc } from "@/lib/payroll/hcStatus"
import { teacherNeedsMpf, withMpf } from "@/lib/payroll/mpf"
import { parsePayrollMode, parseRateConfig, pickRateForMonth } from "@/lib/payroll/rates"
import type {
  ComputedTeacherResult,
  PayrollLessonInput,
  PayrollRateRow,
  PayrollTeacherInput,
} from "@/lib/payroll/types"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import { normalizeEnrollmentPeriod, type EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import {
  coursePricesFromClassEmbed,
  unitPriceForConsumedLesson,
} from "@/services/mgmtDashboardQueries"
import {
  fetchScheduleRosterContext,
  rosterHeadcountForSchedule,
} from "@/services/scheduleRosterQueries"
import { fetchAllTeachers, normalizeTeacherEmploymentStatus } from "@/services/teacherQueries"
import { recordInboxEventOrThrow } from "@/services/inboxEventWrite"
import type {
  ManualAdjustment,
  PayrollClassBlock,
  PayrollGradeBlock,
  PayrollLesson,
  PayrollLineItem,
  PayrollMode,
  PayrollMonthMock,
  PayrollRunStatus,
  PayrollTeacherRow,
  StudentHcRow,
  TeacherSubmitState,
  WfhMockState,
} from "@/lib/payroll/viewTypes"

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function monthBounds(monthKey: string): { from: string; to: string; label: string } {
  const [y, m] = monthKey.split("-").map(Number)
  const last = new Date(y, m, 0).getDate()
  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(last).padStart(2, "0")}`,
    label: `${y}年${m}月`,
  }
}

function prevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export const PAYROLL_DEFAULT_MONTH_LOOKBACK_DAYS = 10

/** 開頁預設月份：今天往前 10 日所屬曆月（月初仍睇上月糧）。 */
export function defaultPayrollMonthKey(now = new Date()): string {
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - PAYROLL_DEFAULT_MONTH_LOOKBACK_DAYS
  )
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function listPayrollMonthOptions(now = new Date()): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    out.push({ value, label: `${d.getFullYear()}年${d.getMonth() + 1}月` })
  }
  return out
}

function mapRateRow(row: Record<string, unknown>): PayrollRateRow {
  const mode = parsePayrollMode(String(row.mode ?? "")) ?? "兼職 HC"
  return {
    id: String(row.id),
    teacherId: String(row.teacher_id),
    mode,
    effectiveFrom: String(row.effective_from).slice(0, 10),
    effectiveTo: row.effective_to != null ? String(row.effective_to).slice(0, 10) : null,
    config: parseRateConfig(row.config),
    notes: row.notes != null ? String(row.notes) : null,
  }
}

async function fetchAllRates(): Promise<PayrollRateRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from("payroll_rates").select("*")
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map(mapRateRow)
}

type AttRow = {
  studentId: string
  studentName: string
  scheduleId: string | null
  classId: string
  status: string
  attendanceDate: string
}

async function fetchAttendanceInRange(from: string, to: string): Promise<AttRow[]> {
  if (!supabase) return []
  const out: AttRow[] = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("attendance_details")
      .select(
        "student_id, class_id, schedule_id, attendance_date, status, students ( full_name, english_name )"
      )
      .gte("attendance_date", from)
      .lte("attendance_date", to)
      .range(offset, offset + pageSize - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Record<string, unknown>[]
    for (const row of rows) {
      const stu = asRecord(row.students)
      const cn = stu?.full_name != null ? String(stu.full_name) : ""
      const en = stu?.english_name != null ? String(stu.english_name) : ""
      out.push({
        studentId: String(row.student_id),
        studentName: cn || en || "—",
        scheduleId: row.schedule_id != null ? String(row.schedule_id) : null,
        classId: String(row.class_id),
        status: String(row.status ?? ""),
        attendanceDate: String(row.attendance_date).slice(0, 10),
      })
    }
    if (rows.length < pageSize) break
  }
  return out
}

type ScheduleRaw = {
  id: string
  classId: string
  scheduledDate: string
  startTime: string | null
  endTime: string | null
  status: string
  teacherId: string | null
  teacherName: string | null
  originalTeacherId: string | null
  originalTeacherName: string | null
  classOwnerTeacherId: string | null
  subject: string | null
  classKind: string | null
  grade: string[] | null
  courseCodeFull: string | null
  courseName: string | null
  gradeCode: string | null
  subjectCode: string | null
  pricePerLesson: number | null
  coursePrices: ReturnType<typeof coursePricesFromClassEmbed>
}

async function fetchSchedulesInRange(from: string, to: string): Promise<ScheduleRaw[]> {
  if (!supabase) return []
  const out: ScheduleRaw[] = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("schedules")
      .select(
        `id, scheduled_date, start_time, end_time, status, class_id, teacher_id, original_teacher_id,
         teachers!schedules_teacher_id_fkey ( full_name ),
         original_teacher:teachers!schedules_original_teacher_id_fkey ( full_name ),
         classes (
           id, subject, class_kind, teacher_id, grade, course_code_full, price_per_lesson,
           courses (
             course_name, grade_code, price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods,
             subjects ( code )
           )
         )`
      )
      .gte("scheduled_date", from)
      .lte("scheduled_date", to)
      .range(offset, offset + pageSize - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Record<string, unknown>[]
    for (const row of rows) {
      const cls = asRecord(row.classes)
      const course = asRecord(cls?.courses)
      const subj = asRecord(course?.subjects)
      const t = asRecord(row.teachers)
      const ot = asRecord(row.original_teacher)
      const prices = coursePricesFromClassEmbed(cls)
      const gradeRaw = cls?.grade
      out.push({
        id: String(row.id),
        classId: String(row.class_id),
        scheduledDate: String(row.scheduled_date).slice(0, 10),
        startTime: row.start_time != null ? String(row.start_time).slice(0, 5) : null,
        endTime: row.end_time != null ? String(row.end_time).slice(0, 5) : null,
        status: String(row.status ?? ""),
        teacherId: row.teacher_id != null ? String(row.teacher_id) : null,
        teacherName: t?.full_name != null ? String(t.full_name) : null,
        originalTeacherId: row.original_teacher_id != null ? String(row.original_teacher_id) : null,
        originalTeacherName: ot?.full_name != null ? String(ot.full_name) : null,
        classOwnerTeacherId: cls?.teacher_id != null ? String(cls.teacher_id) : null,
        subject: cls?.subject != null ? String(cls.subject) : null,
        classKind: cls?.class_kind != null ? String(cls.class_kind) : null,
        grade: Array.isArray(gradeRaw) ? (gradeRaw as string[]) : null,
        courseCodeFull: cls?.course_code_full != null ? String(cls.course_code_full) : null,
        courseName: course?.course_name != null ? String(course.course_name) : null,
        gradeCode: course?.grade_code != null ? String(course.grade_code) : null,
        subjectCode: subj?.code != null ? String(subj.code).toUpperCase() : null,
        pricePerLesson: prices.classPriceOverride,
        coursePrices: prices,
      })
    }
    if (rows.length < pageSize) break
  }
  return out
}

async function fetchEnrollmentPeriods(
  pairs: { studentId: string; classId: string }[]
): Promise<Map<string, EnrollmentFormValue | null>> {
  const map = new Map<string, EnrollmentFormValue | null>()
  if (!supabase || pairs.length === 0) return map
  const studentIds = [...new Set(pairs.map((p) => p.studentId))]
  const classIds = [...new Set(pairs.map((p) => p.classId))]
  await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (studentSlice) => {
    await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (classSlice) => {
      const { data, error } = await supabase!
        .from("student_class_enrollments")
        .select("student_id, class_id, enrollment_period, status")
        .in("student_id", studentSlice)
        .in("class_id", classSlice)
      if (error) {
        console.warn("[payroll.fetchEnrollmentPeriods]", error.message)
        return
      }
      for (const row of (data ?? []) as Record<string, unknown>[]) {
        const key = `${row.student_id}::${row.class_id}`
        if (map.has(key)) continue
        map.set(
          key,
          normalizeEnrollmentPeriod(
            row.enrollment_period != null ? String(row.enrollment_period) : null
          )
        )
      }
    })
  })
  return map
}

function isHomeworkClass(subject: string | null, courseName: string | null): boolean {
  return /功課|HWK|homework/i.test(`${subject ?? ""} ${courseName ?? ""}`)
}

function statusToHc(status: string): StudentHcRow["status"] {
  return attendanceStatusToHc(status)
}

export async function buildLessonInputsForMonth(monthKey: string): Promise<PayrollLessonInput[]> {
  const { from, to } = monthBounds(monthKey)
  const [schedules, attendance] = await Promise.all([
    fetchSchedulesInRange(from, to),
    fetchAttendanceInRange(from, to),
  ])

  const bySchedule = new Map<string, AttRow[]>()
  for (const a of attendance) {
    if (!a.scheduleId) continue
    const list = bySchedule.get(a.scheduleId) ?? []
    list.push(a)
    bySchedule.set(a.scheduleId, list)
  }

  const pricePairs: { studentId: string; classId: string }[] = []
  for (const a of attendance) {
    pricePairs.push({ studentId: a.studentId, classId: a.classId })
  }
  // 未點名判定必須跟點名紙一致：該堂日期可見報讀（期數／報讀日／退讀日）＋試堂＋補堂；
  // 不可只用班別「而家就讀中」人數（會把第二期生誤判成七月未點名）。
  const [enrMap, rosterContext] = await Promise.all([
    fetchEnrollmentPeriods(pricePairs),
    fetchScheduleRosterContext(schedules.map((s) => s.id)),
  ])

  const lessons: PayrollLessonInput[] = []
  for (const s of schedules) {
    if (isHomeworkClass(s.subject, s.courseName)) continue
    const cancelled = isScheduleCancelled(s.status)
    const att = bySchedule.get(s.id) ?? []
    const expectedRosterCount = rosterHeadcountForSchedule(rosterContext, s.id)
    // 該堂點名紙無人 → 不會有點名，不計入、不標異常
    if (!cancelled && att.length === 0 && expectedRosterCount === 0) continue
    const missingRollCall = !cancelled && att.length === 0 && expectedRosterCount > 0
    const { labels, band } = resolvePayrollGradeBand(s.grade, s.gradeCode)
    const classKind = resolveClassKind(s.classKind, s.subject)
    const privateSlot = resolvePrivateSlotKind(s.classKind, s.subject)
    const classLabel = formatClassLabel({
      subject: s.subject ?? "",
      courseCode: s.courseCodeFull,
      courseName: s.courseName,
    })

    const students = att.map((a) => {
      const period = enrMap.get(`${a.studentId}::${a.classId}`) ?? null
      const listPrice = unitPriceForConsumedLesson({
        enrollmentPeriod: period,
        classPriceOverride: s.coursePrices.classPriceOverride,
        coursePrices: s.coursePrices.coursePrices,
        paidUnitFallback: null,
      })
      return {
        studentId: a.studentId,
        studentName: a.studentName,
        status: a.status,
        billable: isBillableAttendanceStatus(a.status),
        listPrice,
      }
    })

    lessons.push({
      scheduleId: s.id,
      classId: s.classId,
      classLabel,
      classKind,
      privateSlot,
      gradeLabels: labels,
      gradeBand: band,
      subjectCode: s.subjectCode,
      scheduledDate: s.scheduledDate,
      startTime: s.startTime,
      endTime: s.endTime,
      cancelled,
      teacherId: s.teacherId,
      teacherName: s.teacherName,
      originalTeacherId: s.originalTeacherId,
      originalTeacherName: s.originalTeacherName,
      classOwnerTeacherId: s.classOwnerTeacherId,
      listPricePerLesson: s.pricePerLesson ?? 0,
      students,
      expectedRosterCount,
      missingRollCall,
    })
  }
  return lessons
}

function mapComputedToUiRow(
  computed: ComputedTeacherResult,
  opts: {
    previousGross: number | null
    approvedHours: number
    hoursStatus: WfhMockState["status"]
  }
): PayrollTeacherRow {
  const needsMpf = teacherNeedsMpf({
    teacherName: computed.teacherName,
    rateMpfFlag: computed.mode === "分成制" || computed.mode === "固定月薪" ? true : undefined,
  })
  // 更準：用名字名單
  const mpfOn = needsMpf
  const gross = computed.grossBeforeAdj
  const mpf = mpfOn
    ? withMpf(gross)
    : { gross, employeeMpf: 0, employerMpf: 0, net: gross }

  const gradeMap = new Map<string, Map<string, PayrollLesson[]>>()
  for (const l of computed.lessons) {
    const src = computed.lessons.find((x) => x.scheduleId === l.scheduleId)
    const gradeLabel =
      (src &&
        // reuse band via classKind grouping label
        classKindLabel(l.classKind)) ||
      "課堂"
    if (!gradeMap.has(gradeLabel)) gradeMap.set(gradeLabel, new Map())
    const classMap = gradeMap.get(gradeLabel)!
    if (!classMap.has(l.classId)) classMap.set(l.classId, [])
    const studentRows: StudentHcRow[] = l.students.map((s) => ({
      name: s.studentName,
      status: statusToHc(s.status),
      countsTowardHc: s.billable,
    }))
    const presentStudents = studentRows
      .filter((r) => isActualPresentHc(r.status))
      .map((r) => r.name)
    const absentStudents = studentRows
      .filter((r) => !isActualPresentHc(r.status))
      .map((r) => r.name)
    classMap.get(l.classId)!.push({
      id: l.scheduleId,
      date: l.date,
      startTime: l.startTime ?? "",
      endTime: l.endTime ?? "",
      billableHc: l.billableHc,
      amount: l.amount,
      presentStudents,
      absentStudents,
      studentRows,
      notRolled: l.missingRollCall,
      note: l.note ?? undefined,
      formula: l.formula,
      substitute: l.substitute ? "received" : undefined,
      substitutePeer: l.substitute ? (l.originalTeacherName ?? undefined) : undefined,
      listPrice: l.listPriceTotal || undefined,
      scheduleId: l.scheduleId,
      classId: l.classId,
      rosterCount: Math.max(l.expectedRosterCount, l.students.length),
    })
  }

  const grades: PayrollGradeBlock[] = []
  for (const [gradeLabel, classMap] of gradeMap) {
    const classes: PayrollClassBlock[] = []
    for (const [classId, lessons] of classMap) {
      const label =
        computed.lessons.find((x) => x.classId === classId)?.classLabel ?? classId
      classes.push({
        id: classId,
        name: label,
        classKind: computed.lessons.find((x) => x.classId === classId)?.classKind ?? "group",
        lessons: lessons.sort((a, b) => a.date.localeCompare(b.date)),
      })
    }
    grades.push({ gradeLabel, classes })
  }

  const lines: PayrollLineItem[] = computed.lines.map((l) => ({
    label: l.label,
    amount: l.amount,
  }))

  const mode: PayrollMode =
    computed.mode === "未設定" ? "兼職 HC" : (computed.mode as PayrollMode)

  const row: PayrollTeacherRow = {
    id: computed.teacherId,
    name: computed.teacherName,
    mode,
    gross: mpf.gross,
    employeeMpf: mpf.employeeMpf,
    employerMpf: mpf.employerMpf,
    net: mpf.net,
    previousGross: opts.previousGross,
    anomalies: computed.anomalies,
    lines,
    grades,
    missingRate: computed.missingRate,
  }

  if (computed.mode === "分成制") {
    const listPersonal = roundMoney(
      computed.lessons.reduce((s, l) => s + l.personalSplitBase, 0)
    )
    row.personalSplit = {
      listPriceTotal: listPersonal,
      rate: 0.6,
      amount: computed.personalSplit,
    }
    const poolList = roundMoney(
      computed.commissionPoolItems.reduce((s, i) => s + i.amount / 0.1, 0)
    )
    row.commissionPool = {
      label: "他人授課佣金",
      listPriceTotal: poolList,
      rate: 0.1,
      amount: computed.commissionPool,
      items: computed.commissionPoolItems.map((i) => ({
        teacherName: i.teacherName,
        className: i.classLabel,
        date: i.date,
        listPrice: roundMoney(i.amount / 0.1),
        included: true,
        reason: "指定科目他人授課",
      })),
    }
  }

  if (computed.mode === "WFH 時薪") {
    row.wfh = {
      hours: opts.approvedHours || null,
      status: opts.hoursStatus,
      ratePerHour: 60,
    }
  }

  if (computed.mode === "固定月薪") {
    row.salaryEvidence = {
      amount: computed.grossBeforeAdj,
      effectiveFrom: "—",
      monthStatus: "當月有效固定月薪",
    }
  }

  return row
}

export type PayrollRunRecord = {
  id: string
  monthKey: string
  status: PayrollRunStatus
  calcVersion: number
  calcAt: string | null
  submittedBy: string | null
  submittedAt: string | null
  settledBy: string | null
  settledAt: string | null
  returnReason: string | null
  snapshot: unknown
}

export type PayrollTeacherStateRecord = {
  teacherId: string
  financeReviewed: boolean
  excluded: boolean
  excludeReason: string | null
  submitStatus: TeacherSubmitState["status"]
  submitNote: string | null
  managerSpotChecked: boolean
  rollCallWaiting: boolean
}

export type PayrollWorkbench = {
  month: PayrollMonthMock
  run: PayrollRunRecord
  teacherStates: PayrollTeacherStateRecord[]
  adjustments: ManualAdjustment[]
  manualHours: {
    teacherId: string
    hours: number
    status: WfhMockState["status"]
  }[]
  hardBlockAnomalies: string[]
  loadingError?: string
}

function mapRun(row: Record<string, unknown>): PayrollRunRecord {
  return {
    id: String(row.id),
    monthKey: String(row.month_key),
    status: String(row.status) as PayrollRunStatus,
    calcVersion: Number(row.calc_version) || 1,
    calcAt: row.calc_at != null ? String(row.calc_at) : null,
    submittedBy: row.submitted_by != null ? String(row.submitted_by) : null,
    submittedAt: row.submitted_at != null ? String(row.submitted_at) : null,
    settledBy: row.settled_by != null ? String(row.settled_by) : null,
    settledAt: row.settled_at != null ? String(row.settled_at) : null,
    returnReason: row.return_reason != null ? String(row.return_reason) : null,
    snapshot: row.snapshot,
  }
}

export async function ensurePayrollRun(monthKey: string): Promise<PayrollRunRecord> {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase 未設定")
  const existing = await supabase.from("payroll_runs").select("*").eq("month_key", monthKey).maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) return mapRun(existing.data as Record<string, unknown>)
  const inserted = await supabase
    .from("payroll_runs")
    .insert({ month_key: monthKey, status: "財務審閱中", calc_version: 1 })
    .select("*")
    .single()
  if (inserted.error) throw new Error(inserted.error.message)
  return mapRun(inserted.data as Record<string, unknown>)
}

async function fetchTeacherStates(runId: string): Promise<PayrollTeacherStateRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from("payroll_teacher_states").select("*").eq("run_id", runId)
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    teacherId: String(row.teacher_id),
    financeReviewed: Boolean(row.finance_reviewed),
    excluded: Boolean(row.excluded),
    excludeReason: row.exclude_reason != null ? String(row.exclude_reason) : null,
    submitStatus: (String(row.submit_status ?? "none") === "none"
      ? "not_submitted"
      : String(row.submit_status)) as TeacherSubmitState["status"],
    submitNote: row.submit_note != null ? String(row.submit_note) : null,
    managerSpotChecked: Boolean(row.manager_spot_checked),
    rollCallWaiting: Boolean(row.roll_call_waiting),
  }))
}

async function fetchAdjustments(runId: string): Promise<ManualAdjustment[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from("payroll_adjustments").select("*").eq("run_id", runId)
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    teacherId: String(row.teacher_id),
    teacherName: "",
    fromAmount: Number(row.from_amount),
    toAmount: Number(row.to_amount),
    reason: String(row.reason ?? ""),
    createdBy: String(row.created_by ?? ""),
    createdAt: String(row.created_at ?? ""),
    status: String(row.status) as ManualAdjustment["status"],
  }))
}

async function fetchManualHours(monthKey: string): Promise<
  { teacherId: string; hours: number; status: WfhMockState["status"] }[]
> {
  if (!supabase) return []
  const { data, error } = await supabase.from("payroll_manual_hours").select("*").eq("month_key", monthKey)
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const st = String(row.status)
    const uiStatus: WfhMockState["status"] =
      st === "approved" ? "approved" : st === "submitted" ? "submitted" : "missing"
    return {
      teacherId: String(row.teacher_id),
      hours: Number(row.hours) || 0,
      status: uiStatus,
    }
  })
}

async function computeUiTeachers(
  monthKey: string,
  rates: PayrollRateRow[],
  hoursByTeacher: Map<string, { hours: number; status: WfhMockState["status"] }>
): Promise<{ teachers: PayrollTeacherRow[]; hardBlockAnomalies: string[] }> {
  const allTeachers = await fetchAllTeachers()
  const active = allTeachers.filter((t) => normalizeTeacherEmploymentStatus(t.status) === "在職")
  const lessons = await buildLessonInputsForMonth(monthKey)

  // 上月 snapshot gross（若有）
  const prevKey = prevMonthKey(monthKey)
  const prevGross: Record<string, number> = {}
  if (supabase) {
    const prev = await supabase.from("payroll_runs").select("snapshot").eq("month_key", prevKey).maybeSingle()
    const snap = asRecord(prev.data?.snapshot)
    const prevTeachers = Array.isArray(snap?.teachers) ? (snap!.teachers as Record<string, unknown>[]) : []
    for (const t of prevTeachers) {
      if (t.id && t.gross != null) prevGross[String(t.id)] = Number(t.gross)
    }
  }

  const teacherInputs: PayrollTeacherInput[] = active.map((t) => {
    const h = hoursByTeacher.get(t.id)
    return {
      teacherId: t.id,
      teacherName: t.full_name,
      rate: pickRateForMonth(rates, t.id, monthKey),
      approvedHours: h?.status === "approved" ? h.hours : 0,
    }
  })

  // 亦納入本月有上堂但不在「在職」清單的老師（罕見）
  const activeIds = new Set(teacherInputs.map((t) => t.teacherId))
  for (const l of lessons) {
    if (!l.teacherId || activeIds.has(l.teacherId)) continue
    activeIds.add(l.teacherId)
    teacherInputs.push({
      teacherId: l.teacherId,
      teacherName: l.teacherName ?? "—",
      rate: pickRateForMonth(rates, l.teacherId, monthKey),
      approvedHours: 0,
    })
  }

  const computed = computePayrollMonth({
    monthKey,
    teachers: teacherInputs,
    lessons,
    previousGrossByTeacherId: prevGross,
  })

  const teachers = computed.teachers
    .map((c) => {
      const h = hoursByTeacher.get(c.teacherId)
      return mapComputedToUiRow(c, {
        previousGross: prevGross[c.teacherId] ?? null,
        approvedHours: h?.hours ?? 0,
        hoursStatus: h?.status ?? "missing",
      })
    })
    // 只顯示：有金額、有堂、有異常、或固定月薪／WFH
    .filter(
      (t) =>
        (t.gross != null && t.gross > 0) ||
        t.anomalies.length > 0 ||
        t.mode === "固定月薪" ||
        t.mode === "WFH 時薪" ||
        t.missingRate
    )
    .sort((a, b) => {
      const ah = a.anomalies.length > 0 ? 0 : 1
      const bh = b.anomalies.length > 0 ? 0 : 1
      if (ah !== bh) return ah - bh
      return (b.gross ?? 0) - (a.gross ?? 0)
    })

  return { teachers, hardBlockAnomalies: computed.hardBlockAnomalies }
}

export async function loadPayrollWorkbench(monthKey: string): Promise<PayrollWorkbench> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase 未設定")
  }
  const run = await ensurePayrollRun(monthKey)
  const { label } = monthBounds(monthKey)

  if (run.status === "已結算" && run.snapshot) {
    const snap = asRecord(run.snapshot)
    const teachers = (Array.isArray(snap?.teachers) ? snap!.teachers : []) as PayrollTeacherRow[]
    const [teacherStates, adjustments, manualHours] = await Promise.all([
      fetchTeacherStates(run.id),
      fetchAdjustments(run.id),
      fetchManualHours(monthKey),
    ])
    return {
      month: {
        monthKey,
        monthLabel: label,
        status: run.status,
        teachers,
        submittedBy: run.submittedBy ?? undefined,
        submittedAt: run.submittedAt ?? undefined,
        returnReason: run.returnReason ?? undefined,
        calc: {
          version: run.calcVersion,
          computedAt: run.calcAt ?? "—",
          dataCutoffAt: run.calcAt ?? "—",
        },
      },
      run,
      teacherStates,
      adjustments: adjustments.map((a) => ({
        ...a,
        teacherName: teachers.find((t) => t.id === a.teacherId)?.name ?? a.teacherName,
      })),
      manualHours,
      hardBlockAnomalies: [],
    }
  }

  const [rates, teacherStates, adjustments, manualHours] = await Promise.all([
    fetchAllRates(),
    fetchTeacherStates(run.id),
    fetchAdjustments(run.id),
    fetchManualHours(monthKey),
  ])

  const hoursMap = new Map(manualHours.map((h) => [h.teacherId, h]))
  const { teachers, hardBlockAnomalies } = await computeUiTeachers(monthKey, rates, hoursMap)

  // 套用已核准調整
  const withAdj = teachers.map((t) => {
    const approved = adjustments.filter((a) => a.teacherId === t.id && a.status === "approved")
    if (approved.length === 0) return t
    const latest = approved.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!
    const mpfOn = teacherNeedsMpf({ teacherName: t.name })
    const m = mpfOn
      ? withMpf(latest.toAmount)
      : { gross: latest.toAmount, employeeMpf: 0, employerMpf: 0, net: latest.toAmount }
    return { ...t, gross: m.gross, employeeMpf: m.employeeMpf, employerMpf: m.employerMpf, net: m.net }
  })

  const nameById = new Map(withAdj.map((t) => [t.id, t.name]))

  // bump calc_at
  const nowIso = new Date().toISOString()
  await supabase
    .from("payroll_runs")
    .update({ calc_at: nowIso, updated_at: nowIso })
    .eq("id", run.id)

  return {
    month: {
      monthKey,
      monthLabel: label,
      status: run.status,
      teachers: withAdj,
      submittedBy: run.submittedBy ?? undefined,
      submittedAt: run.submittedAt ?? undefined,
      returnReason: run.returnReason ?? undefined,
      calc: {
        version: run.calcVersion,
        computedAt: nowIso.replace("T", " ").slice(0, 16),
        dataCutoffAt: nowIso.replace("T", " ").slice(0, 16),
      },
    },
    run: { ...run, calcAt: nowIso },
    teacherStates,
    adjustments: adjustments.map((a) => ({
      ...a,
      teacherName: nameById.get(a.teacherId) ?? a.teacherName,
    })),
    manualHours,
    hardBlockAnomalies,
  }
}

export async function recalcPayrollRun(monthKey: string): Promise<PayrollWorkbench> {
  if (!supabase) throw new Error("Supabase 未設定")
  const run = await ensurePayrollRun(monthKey)
  if (run.status === "已結算") throw new Error("已結算月份不可重算")
  const nextVersion = run.calcVersion + 1
  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from("payroll_runs")
    .update({ calc_version: nextVersion, calc_at: nowIso, updated_at: nowIso })
    .eq("id", run.id)
  if (error) throw new Error(error.message)
  return loadPayrollWorkbench(monthKey)
}

async function upsertTeacherState(
  runId: string,
  teacherId: string,
  patch: Partial<{
    finance_reviewed: boolean
    excluded: boolean
    exclude_reason: string | null
    submit_status: string
    submit_note: string | null
    manager_spot_checked: boolean
    roll_call_waiting: boolean
  }>
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data: existing } = await supabase
    .from("payroll_teacher_states")
    .select("id")
    .eq("run_id", runId)
    .eq("teacher_id", teacherId)
    .maybeSingle()
  if (existing?.id) {
    const { error } = await supabase
      .from("payroll_teacher_states")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from("payroll_teacher_states").insert({
      run_id: runId,
      teacher_id: teacherId,
      ...patch,
    })
    if (error) throw new Error(error.message)
  }
}

export async function setFinanceReviewed(
  runId: string,
  teacherId: string,
  reviewed: boolean
): Promise<void> {
  await upsertTeacherState(runId, teacherId, { finance_reviewed: reviewed })
}

export async function setTeacherExcluded(
  runId: string,
  teacherId: string,
  excluded: boolean,
  reason?: string
): Promise<void> {
  await upsertTeacherState(runId, teacherId, {
    excluded,
    exclude_reason: excluded ? reason ?? "財務排除" : null,
  })
}

export async function setTeacherRollCallWaiting(
  runId: string,
  teacherId: string,
  waiting: boolean
): Promise<void> {
  await upsertTeacherState(runId, teacherId, { roll_call_waiting: waiting })
}

export async function sendPayrollRollCallReminder(input: {
  runId: string
  teacherId: string
  teacherName: string
  className: string
  classId?: string | null
  scheduleId: string
  date: string
  startTime?: string
  endTime?: string
}): Promise<void> {
  const time =
    input.startTime && input.endTime ? ` ${input.startTime}–${input.endTime}` : ""
  await recordInboxEventOrThrow({
    eventType: "attendance_reminder",
    title: `請補點名：${input.className}`,
    body: `財務請你補點 ${input.date}${time} ${input.className}。未點名不能計入該月薪酬。`,
    actionPath: `/Schedule/${input.scheduleId}?rollcall=1`,
    classId: input.classId ?? null,
    scheduleId: input.scheduleId,
    audienceTeacherIds: [input.teacherId],
    audienceRoles: ["teacher"],
    category: "ops",
    payload: { source: "payroll", teacherName: input.teacherName, date: input.date },
  })
  await setTeacherRollCallWaiting(input.runId, input.teacherId, true)
}

export async function submitTeacherForReview(
  runId: string,
  teacherId: string
): Promise<void> {
  await upsertTeacherState(runId, teacherId, { submit_status: "submitted" })
}

export async function acceptTeacherSubmit(runId: string, teacherId: string): Promise<void> {
  await upsertTeacherState(runId, teacherId, { submit_status: "accepted" })
}

export async function returnTeacherSubmit(
  runId: string,
  teacherId: string,
  note: string
): Promise<void> {
  await upsertTeacherState(runId, teacherId, { submit_status: "returned", submit_note: note })
}

export async function setManagerSpotChecked(
  runId: string,
  teacherId: string,
  checked: boolean
): Promise<void> {
  await upsertTeacherState(runId, teacherId, { manager_spot_checked: checked })
}

export async function submitPayrollMonth(
  runId: string,
  submittedBy: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from("payroll_runs")
    .update({
      status: "待管理層核實",
      submitted_by: submittedBy,
      submitted_at: nowIso,
      return_reason: null,
      updated_at: nowIso,
    })
    .eq("id", runId)
    .in("status", ["草稿", "財務審閱中"])
  if (error) throw new Error(error.message)
}

export async function returnPayrollMonth(
  runId: string,
  reason: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from("payroll_runs")
    .update({
      status: "財務審閱中",
      return_reason: reason,
      submitted_by: null,
      submitted_at: null,
      updated_at: nowIso,
    })
    .eq("id", runId)
    .eq("status", "待管理層核實")
  if (error) throw new Error(error.message)
}

export async function settlePayrollMonth(
  runId: string,
  settledBy: string,
  teachers: PayrollTeacherRow[]
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const nowIso = new Date().toISOString()
  const { data: run, error: fetchErr } = await supabase
    .from("payroll_runs")
    .select("calc_version, status, month_key")
    .eq("id", runId)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)
  if (String(run.status) !== "待管理層核實") throw new Error("只有待核實狀態可結算")
  const { error } = await supabase
    .from("payroll_runs")
    .update({
      status: "已結算",
      settled_by: settledBy,
      settled_at: nowIso,
      snapshot: {
        teachers,
        calcVersion: run.calc_version,
        settledAt: nowIso,
      },
      updated_at: nowIso,
    })
    .eq("id", runId)
  if (error) throw new Error(error.message)

  // 成本帳過帳（老師粒度；排除老師跟 teacher_states；origin_key 冪等）
  const monthKey = String(run.month_key ?? "")
  if (monthKey) {
    try {
      const states = await fetchTeacherStates(runId)
      const excludedTeacherIds = new Set(
        states.filter((s) => s.excluded).map((s) => s.teacherId)
      )
      const { postPayrollSettleToExpenseLedger } = await import(
        "@/services/expenseQueries"
      )
      await postPayrollSettleToExpenseLedger({
        monthKey,
        settledBy,
        teachers,
        excludedTeacherIds,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`計糧已結算，但成本帳過帳失敗：${msg}`)
    }
  }
}

export async function createPayrollAdjustment(input: {
  runId: string
  teacherId: string
  fromAmount: number
  toAmount: number
  reason: string
  createdBy: string
}): Promise<string> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("payroll_adjustments")
    .insert({
      run_id: input.runId,
      teacher_id: input.teacherId,
      from_amount: input.fromAmount,
      to_amount: input.toAmount,
      reason: input.reason,
      created_by: input.createdBy,
      status: "pending",
    })
    .select("id")
    .single()
  if (error) throw new Error(error.message)
  return String(data.id)
}

export async function reviewPayrollAdjustment(
  adjustmentId: string,
  status: "approved" | "rejected",
  reviewedBy: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase
    .from("payroll_adjustments")
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", adjustmentId)
  if (error) throw new Error(error.message)
}

export async function upsertManualHours(input: {
  monthKey: string
  teacherId: string
  hours: number
  status: "draft" | "submitted" | "approved"
  actor: string
}): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const nowIso = new Date().toISOString()
  const payload: Record<string, unknown> = {
    month_key: input.monthKey,
    teacher_id: input.teacherId,
    hours: input.hours,
    status: input.status,
    updated_at: nowIso,
  }
  if (input.status === "submitted") {
    payload.submitted_by = input.actor
    payload.submitted_at = nowIso
  }
  if (input.status === "approved") {
    payload.reviewed_by = input.actor
    payload.reviewed_at = nowIso
  }
  const { error } = await supabase.from("payroll_manual_hours").upsert(payload, {
    onConflict: "month_key,teacher_id",
  })
  if (error) throw new Error(error.message)
}
