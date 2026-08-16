import { resolveClassGradeLabels } from "@/lib/classGrade"
import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { formatClassLabel } from "@/lib/courseLabel"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import {
  findJuly2026LaborByTeacherName,
  laborEmployerCost,
  STAFF_LABOR_JULY_2026_MONTH,
} from "@/data/staffLaborJuly2026"
import type { KpiCardModel, KpiStatus } from "@/lib/mgmtDashboardTypes"
import type {
  StaffAnomalyCard,
  StaffHeatCell,
  StaffMonthlyPoint,
  StaffPerformanceFilters,
  StaffPerformancePayload,
  StaffPerformanceRow,
  StaffTeacherTrend,
} from "@/lib/staffPerformanceTypes"
import {
  coursePricesFromClassEmbed,
  fetchPaidUnitPriceMaps,
  pickEnrollmentForAttendance,
  unitPriceForConsumedLesson,
} from "@/services/mgmtDashboardQueries"
import { normalizeEnrollmentPeriod, type EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import { isStaffPerformanceOwner } from "@/lib/staffPerformanceOwners"
import { fetchAllTeachers } from "@/services/teacherQueries"

function localYmd(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function monthKeyFromParts(year: number, month1to12: number): string {
  return `${year}-${pad2(month1to12)}`
}

function lastDayOfMonth(year: number, month1to12: number): string {
  const d = new Date(year, month1to12, 0)
  return localYmd(d)
}

function previousCalendarMonthKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return monthKeyFromParts(d.getFullYear(), d.getMonth() + 1)
}

export function defaultStaffPerformanceFilters(): StaffPerformanceFilters {
  const monthKey = previousCalendarMonthKey()
  const [y] = monthKey.split("-").map(Number)
  const q = Math.floor((Number(monthKey.slice(5, 7)) - 1) / 3) + 1
  return {
    periodMode: "month",
    monthKey,
    year: y,
    quarter: q,
    subjectIds: [],
    teacherIds: [],
    classKind: "all",
    gradeIds: [],
    studentType: "all",
    classIds: [],
    excludeOwners: true,
  }
}

function applyOwnerExclusion<T extends { teacherName: string; teacherAbbr?: string | null; teacherId?: string }>(
  items: T[],
  excludeOwners: boolean
): T[] {
  if (!excludeOwners) return items
  return items.filter(
    (item) =>
      !isStaffPerformanceOwner({
        fullName: item.teacherName,
        abbr: item.teacherAbbr ?? null,
      })
  )
}

export function resolveStaffPeriodRange(filters: StaffPerformanceFilters): {
  dateFrom: string
  dateTo: string
  periodLabel: string
  monthKeys: string[]
} {
  if (filters.periodMode === "quarter") {
    const startMonth = (filters.quarter - 1) * 3 + 1
    const monthKeys = [0, 1, 2].map((i) => monthKeyFromParts(filters.year, startMonth + i))
    const dateFrom = `${monthKeys[0]}-01`
    const dateTo = lastDayOfMonth(filters.year, startMonth + 2)
    return {
      dateFrom,
      dateTo,
      periodLabel: `${filters.year} Q${filters.quarter}`,
      monthKeys,
    }
  }
  const [y, m] = filters.monthKey.split("-").map(Number)
  const dateFrom = `${filters.monthKey}-01`
  const dateTo = lastDayOfMonth(y, m)
  return {
    dateFrom,
    dateTo,
    periodLabel: `${y}年${m}月`,
    monthKeys: [filters.monthKey],
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function enrollmentPairKey(studentId: string, classId: string): string {
  return `${studentId}::${classId}`
}

type EnrollmentForConsumedPrice = {
  studentId: string
  classId: string
  enrollmentPeriod: EnrollmentFormValue | null
  enrollDate: string | null
  withdrawEffectiveDate: string | null
  status: string
}

function mapEnrollmentRow(row: Record<string, unknown>): EnrollmentForConsumedPrice {
  return {
    studentId: String(row.student_id),
    classId: String(row.class_id),
    enrollmentPeriod: normalizeEnrollmentPeriod(
      row.enrollment_period != null ? String(row.enrollment_period) : null
    ),
    enrollDate: row.enroll_date != null ? String(row.enroll_date).slice(0, 10) : null,
    withdrawEffectiveDate:
      row.withdraw_effective_date != null
        ? String(row.withdraw_effective_date).slice(0, 10)
        : null,
    status: String(row.status ?? ""),
  }
}

async function fetchEnrollmentsForPricing(
  studentIds: string[],
  classIds: string[]
): Promise<Map<string, EnrollmentForConsumedPrice[]>> {
  const map = new Map<string, EnrollmentForConsumedPrice[]>()
  if (!supabase || studentIds.length === 0 || classIds.length === 0) return map

  const selectWithWithdraw =
    "student_id, class_id, enrollment_period, enroll_date, withdraw_effective_date, status"
  const selectWithoutWithdraw = "student_id, class_id, enrollment_period, enroll_date, status"

  await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (studentSlice) => {
    await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (classSlice) => {
      let rows: Record<string, unknown>[] = []
      const first = await supabase!
        .from("student_class_enrollments")
        .select(selectWithWithdraw)
        .in("student_id", studentSlice)
        .in("class_id", classSlice)
      if (first.error) {
        const second = await supabase!
          .from("student_class_enrollments")
          .select(selectWithoutWithdraw)
          .in("student_id", studentSlice)
          .in("class_id", classSlice)
        if (second.error) {
          console.warn("[staffPerformance.fetchEnrollments]", second.error.message)
          return
        }
        rows = (second.data ?? []) as Record<string, unknown>[]
      } else {
        rows = (first.data ?? []) as Record<string, unknown>[]
      }
      for (const row of rows) {
        const mapped = mapEnrollmentRow(row)
        const key = enrollmentPairKey(mapped.studentId, mapped.classId)
        const list = map.get(key) ?? []
        list.push(mapped)
        map.set(key, list)
      }
    })
  })

  return map
}

type AccTeacher = {
  teacherId: string
  teacherName: string
  teacherAbbr: string | null
  revenue: number
  teachingHours: number
  attendanceTotal: number
  absenceCount: number
  studentIds: Set<string>
  classIds: Set<string>
  byMonth: Map<string, { revenue: number; teachingHours: number }>
}

function ensureTeacher(
  map: Map<string, AccTeacher>,
  teacherId: string,
  teacherName: string,
  teacherAbbr: string | null
): AccTeacher {
  let t = map.get(teacherId)
  if (!t) {
    t = {
      teacherId,
      teacherName,
      teacherAbbr,
      revenue: 0,
      teachingHours: 0,
      attendanceTotal: 0,
      absenceCount: 0,
      studentIds: new Set(),
      classIds: new Set(),
      byMonth: new Map(),
    }
    map.set(teacherId, t)
  }
  return t
}

function isAbsenceStatus(status: string): boolean {
  const s = status.trim()
  if (/no\s*show/i.test(s)) return true
  if (s.includes("請假") || s === "事假" || s === "病假") return true
  return false
}

function isHomeworkClass(subject: string | null, courseName: string | null): boolean {
  const blob = `${subject ?? ""} ${courseName ?? ""}`
  return /功課|HWK|homework/i.test(blob)
}

/**
 * 按 schedules.teacher_id 彙總區間內扣堂收入（一次掃 attendance）。
 */
async function aggregateRevenueByTeacher(
  dateFrom: string,
  dateTo: string,
  filters: StaffPerformanceFilters
): Promise<{
  byTeacher: Map<string, AccTeacher>
  classOptions: { value: string; label: string }[]
}> {
  const byTeacher = new Map<string, AccTeacher>()
  const classOptionsMap = new Map<string, string>()
  if (!supabase) return { byTeacher, classOptions: [] }

  const pageSize = 1000
  type RawRow = Record<string, unknown>
  const rawRows: RawRow[] = []

  for (let offset = 0; ; offset += pageSize) {
    let q = supabase
      .from("attendance_details")
      .select(
        "id, status, student_id, class_id, schedule_id, attendance_date, classes!inner ( id, class_kind, teacher_id, price_per_lesson, grade, subject, course_code_full, courses ( id, grade_code, course_name, price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods, subjects ( id ) ), teachers ( full_name, abbr ) ), schedules ( teacher_id, teachers!schedules_teacher_id_fkey ( full_name, abbr ) )"
      )
      .gte("attendance_date", dateFrom)
      .lte("attendance_date", dateTo)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (filters.classKind === "group" || filters.classKind === "private") {
      q = q.eq("classes.class_kind", filters.classKind)
    }
    if (filters.classIds.length > 0) {
      q = q.in("class_id", filters.classIds)
    }

    const { data, error } = await q
    if (error) {
      console.warn("[staffPerformance.aggregateRevenue]", error.message)
      break
    }
    const chunk = (data ?? []) as RawRow[]
    rawRows.push(...chunk)
    if (chunk.length < pageSize) break
  }

  // 先收集需計價的 billable 列
  type PricedCandidate = {
    studentId: string
    classId: string
    attendanceYmd: string
    status: string
    teacherId: string
    teacherName: string
    teacherAbbr: string | null
    classEmbed: Record<string, unknown>
    monthKey: string
    scheduleId: string | null
  }

  const candidates: PricedCandidate[] = []

  for (const row of rawRows) {
    const cls = asRecord(row.classes)
    if (!cls) continue
    const course = asRecord(cls.courses)
    const subject = cls.subject != null ? String(cls.subject) : null
    const courseName = course?.course_name != null ? String(course.course_name) : null
    if (isHomeworkClass(subject, courseName)) continue

    if (filters.subjectIds.length > 0) {
      const subj = asRecord(course?.subjects)
      const sid = subj?.id != null ? String(subj.id) : null
      if (!sid || !filters.subjectIds.includes(sid)) continue
    }

    if (filters.gradeIds.length > 0) {
      const gradeRaw = Array.isArray(cls.grade)
        ? (cls.grade as string[])
        : cls.grade != null
          ? [String(cls.grade)]
          : null
      const grades = resolveClassGradeLabels(
        gradeRaw,
        course?.grade_code != null ? String(course.grade_code) : null
      )
      if (!grades.some((g) => filters.gradeIds.includes(g))) continue
    }

    const sched = asRecord(row.schedules)
    const schedTeacher = asRecord(sched?.teachers)
    const classTeacher = asRecord(cls.teachers)
    const teacherId =
      (sched?.teacher_id != null ? String(sched.teacher_id) : null) ||
      (cls.teacher_id != null ? String(cls.teacher_id) : null)
    if (!teacherId) continue
    if (filters.teacherIds.length > 0 && !filters.teacherIds.includes(teacherId)) continue

    const teacherName =
      (schedTeacher?.full_name != null ? String(schedTeacher.full_name) : null) ||
      (classTeacher?.full_name != null ? String(classTeacher.full_name) : null) ||
      "—"
    const teacherAbbr =
      (schedTeacher?.abbr != null ? String(schedTeacher.abbr) : null) ||
      (classTeacher?.abbr != null ? String(classTeacher.abbr) : null)

    const classId = String(row.class_id)
    const label = formatClassLabel({
      subject: subject ?? "—",
      courseCode: cls.course_code_full != null ? String(cls.course_code_full) : "",
      courseName,
    })
    classOptionsMap.set(classId, label)

    const attendanceYmd = String(row.attendance_date ?? "").slice(0, 10)
    const monthKey = attendanceYmd.slice(0, 7)
    const status = String(row.status ?? "")
    const studentId = String(row.student_id)
    const scheduleId = row.schedule_id != null ? String(row.schedule_id) : null

    const t = ensureTeacher(byTeacher, teacherId, teacherName, teacherAbbr)
    t.attendanceTotal += 1
    if (isAbsenceStatus(status)) t.absenceCount += 1
    t.studentIds.add(studentId)
    t.classIds.add(classId)

    if (!isBillableAttendanceStatus(status)) continue

    candidates.push({
      studentId,
      classId,
      attendanceYmd,
      status,
      teacherId,
      teacherName,
      teacherAbbr,
      classEmbed: cls,
      monthKey,
      scheduleId,
    })
  }

  // 新生／舊生：以該生最早 enroll_date 判斷
  let firstEnrollByStudent = new Map<string, string>()
  if (filters.studentType !== "all" && candidates.length > 0) {
    const studentIds = [...new Set(candidates.map((c) => c.studentId))]
    firstEnrollByStudent = await fetchFirstEnrollDates(studentIds)
  }

  const filteredCandidates =
    filters.studentType === "all"
      ? candidates
      : candidates.filter((c) => {
          const first = firstEnrollByStudent.get(c.studentId)
          if (!first) return filters.studentType === "new"
          if (filters.studentType === "new") return first >= dateFrom
          return first < dateFrom
        })

  if (filteredCandidates.length > 0) {
    const studentIds = [...new Set(filteredCandidates.map((c) => c.studentId))]
    const classIds = [...new Set(filteredCandidates.map((c) => c.classId))]
    const [enrollmentsByPair, paidMaps] = await Promise.all([
      fetchEnrollmentsForPricing(studentIds, classIds),
      fetchPaidUnitPriceMaps(studentIds, classIds),
    ])

    const lessonsAttributed = new Set<string>()

    for (const c of filteredCandidates) {
      const enr = pickEnrollmentForAttendance(
        enrollmentsByPair.get(enrollmentPairKey(c.studentId, c.classId)) ?? [],
        c.attendanceYmd
      )
      const prices = coursePricesFromClassEmbed(c.classEmbed)
      const pairKey = enrollmentPairKey(c.studentId, c.classId)
      const paidUnitFallback =
        paidMaps.byPair.get(pairKey) ?? paidMaps.byClass.get(c.classId) ?? null
      const unit = unitPriceForConsumedLesson({
        enrollmentPeriod: enr?.enrollmentPeriod ?? null,
        classPriceOverride: prices.classPriceOverride,
        coursePrices: prices.coursePrices,
        paidUnitFallback,
      })

      const t = ensureTeacher(byTeacher, c.teacherId, c.teacherName, c.teacherAbbr)
      t.revenue += unit

      const monthBucket = t.byMonth.get(c.monthKey) ?? { revenue: 0, teachingHours: 0 }
      monthBucket.revenue += unit

      // 授課堂數：每個 schedule 計 1（無 schedule_id 則用 class+date）
      const lessonKey = c.scheduleId
        ? `${c.teacherId}::${c.scheduleId}`
        : `${c.teacherId}::${c.classId}::${c.attendanceYmd}`
      if (!lessonsAttributed.has(lessonKey)) {
        lessonsAttributed.add(lessonKey)
        t.teachingHours += 1
        monthBucket.teachingHours += 1
      }
      t.byMonth.set(c.monthKey, monthBucket)
    }
  }

  // 固定月薪等可能有人工但無點名收入：稍後由 labor 名單補入

  return {
    byTeacher,
    classOptions: [...classOptionsMap.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant")),
  }
}

async function fetchFirstEnrollDates(studentIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (!supabase || studentIds.length === 0) return map
  await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("student_class_enrollments")
      .select("student_id, enroll_date")
      .in("student_id", slice)
    if (error) {
      console.warn("[staffPerformance.firstEnroll]", error.message)
      return
    }
    for (const row of data ?? []) {
      const sid = String((row as { student_id: string }).student_id)
      const ed = String((row as { enroll_date?: string }).enroll_date ?? "").slice(0, 10)
      if (!ed) continue
      const prev = map.get(sid)
      if (!prev || ed < prev) map.set(sid, ed)
    }
  })
  return map
}

async function fetchWithdrawalsByTeacher(
  dateFrom: string,
  dateTo: string,
  teacherIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (!supabase || teacherIds.length === 0) return map
  await forEachIdChunk(teacherIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("enrollment_change_events")
      .select("id, classes!inner ( teacher_id )")
      .eq("action", "withdraw")
      .gte("effective_date", dateFrom)
      .lte("effective_date", dateTo)
      .in("classes.teacher_id", slice)
    if (error) {
      console.warn("[staffPerformance.withdrawals]", error.message)
      return
    }
    for (const row of data ?? []) {
      const cls = asRecord((row as { classes?: unknown }).classes)
      const tid = cls?.teacher_id != null ? String(cls.teacher_id) : null
      if (!tid) continue
      map.set(tid, (map.get(tid) ?? 0) + 1)
    }
  })
  return map
}

async function fetchRetentionByTeacher(
  dateFrom: string,
  dateTo: string,
  teacherIds: string[]
): Promise<Map<string, number | null>> {
  /** 簡化：期內 enroll 次數 ÷（期內 enroll + withdraw）；無事件則 null */
  const map = new Map<string, number | null>()
  if (!supabase || teacherIds.length === 0) return map

  const enroll = new Map<string, number>()
  const withdraw = new Map<string, number>()

  await forEachIdChunk(teacherIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("enrollment_change_events")
      .select("action, classes!inner ( teacher_id )")
      .in("action", ["enroll", "withdraw"])
      .gte("effective_date", dateFrom)
      .lte("effective_date", dateTo)
      .in("classes.teacher_id", slice)
    if (error) {
      console.warn("[staffPerformance.retention]", error.message)
      return
    }
    for (const row of data ?? []) {
      const cls = asRecord((row as { classes?: unknown }).classes)
      const tid = cls?.teacher_id != null ? String(cls.teacher_id) : null
      if (!tid) continue
      const action = String((row as { action?: string }).action ?? "")
      if (action === "enroll") enroll.set(tid, (enroll.get(tid) ?? 0) + 1)
      if (action === "withdraw") withdraw.set(tid, (withdraw.get(tid) ?? 0) + 1)
    }
  })

  for (const tid of teacherIds) {
    const e = enroll.get(tid) ?? 0
    const w = withdraw.get(tid) ?? 0
    const denom = e + w
    if (denom === 0) map.set(tid, null)
    else map.set(tid, Math.round((e / denom) * 1000) / 10)
  }
  return map
}

function laborForMonth(
  monthKey: string,
  teacherName: string
): { cost: number; missing: boolean } {
  if (monthKey !== STAFF_LABOR_JULY_2026_MONTH) return { cost: 0, missing: true }
  const snap = findJuly2026LaborByTeacherName(teacherName)
  if (!snap) return { cost: 0, missing: true }
  return { cost: laborEmployerCost(snap), missing: false }
}

function laborForPeriod(
  monthKeys: string[],
  teacherName: string
): { cost: number | null; missing: boolean } {
  let total = 0
  let any = false
  let allMissing = true
  for (const mk of monthKeys) {
    const { cost, missing } = laborForMonth(mk, teacherName)
    if (!missing) {
      total += cost
      any = true
      allMissing = false
    }
  }
  if (allMissing) return { cost: null, missing: true }
  return { cost: any ? Math.round(total * 100) / 100 : null, missing: false }
}

function kpiStatus(tone: KpiCardModel["tone"]): KpiStatus {
  if (tone === "destructive") return "警示"
  if (tone === "warning") return "注意"
  return "正常"
}

function buildKpis(rows: StaffPerformanceRow[], teachingHoursTotal: number): KpiCardModel[] {
  const withLabor = rows.filter((r) => !r.laborMissing && r.laborCost != null)
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)
  const totalLabor = withLabor.reduce((s, r) => s + (r.laborCost ?? 0), 0)
  const totalProfit = totalRevenue - totalLabor
  const laborRatio = totalRevenue > 0 ? Math.round((totalLabor / totalRevenue) * 1000) / 10 : 0
  const staffCount = Math.max(1, rows.length)
  const retentionVals = rows.map((r) => r.retentionRate).filter((v): v is number => v != null)
  const retentionAvg =
    retentionVals.length > 0
      ? Math.round((retentionVals.reduce((a, b) => a + b, 0) / retentionVals.length) * 10) / 10
      : 0

  const laborMissingHint =
    withLabor.length < rows.length ? "部分老師未有月結人工" : "人工＝離線計糧 gross＋僱主MPF"

  const mk = (
    id: string,
    label: string,
    value: number,
    format: KpiCardModel["format"],
    tone: KpiCardModel["tone"],
    hint?: string
  ): KpiCardModel => ({
    id,
    label,
    value,
    format,
    deltaPct: null,
    yoyPct: null,
    targetGap: null,
    targetGapUnit: null,
    status: kpiStatus(tone),
    tone,
    hint: hint ?? null,
  })

  return [
    mk("totalRevenue", "總收入", Math.round(totalRevenue), "hkd", "success", "已完成課堂扣堂價值"),
    mk("totalLaborCost", "總人工成本", Math.round(totalLabor), "hkd", "default", laborMissingHint),
    mk(
      "totalGrossProfit",
      "總毛利",
      Math.round(totalProfit),
      "hkd",
      totalProfit >= 0 ? "success" : "destructive"
    ),
    mk(
      "laborCostRatio",
      "人工佔收入比",
      laborRatio,
      "percent",
      laborRatio > 60 ? "destructive" : laborRatio > 40 ? "warning" : "success"
    ),
    mk("avgRevenuePerStaff", "每人平均收入", Math.round(totalRevenue / staffCount), "hkd", "default"),
    mk("avgProfitPerStaff", "每人平均毛利", Math.round(totalProfit / staffCount), "hkd", "default"),
    mk("teachingHours", "總授課時數", teachingHoursTotal, "count", "default", "計薪堂次（按排程）"),
    mk(
      "retentionRate",
      "續報率",
      retentionAvg,
      "percent",
      retentionAvg > 0 && retentionAvg < 50 ? "warning" : "default",
      "簡化：期內報讀÷（報讀＋退讀）"
    ),
  ]
}

function buildAnomalies(rows: StaffPerformanceRow[]): StaffAnomalyCard[] {
  const out: StaffAnomalyCard[] = []
  for (const r of rows) {
    if (r.laborMissing) {
      out.push({
        id: `labor-missing-${r.teacherId}`,
        severity: "注意",
        title: `${r.teacherName} 未有月結人工`,
        detail: "目前僅 2026-07 有離線計糧快照；其他月份待補。",
        teacherId: r.teacherId,
        href: `/Teachers/${r.teacherId}`,
      })
    }
    if (r.laborCostRatio != null && r.laborCostRatio > 60) {
      out.push({
        id: `labor-high-${r.teacherId}`,
        severity: "警示",
        title: `${r.teacherName} 人工佔比 ${r.laborCostRatio.toFixed(1)}%`,
        detail: "人工佔收入超過 60%。",
        teacherId: r.teacherId,
        href: `/Teachers/${r.teacherId}`,
      })
    }
    if (r.grossMargin != null && r.revenue > 0 && r.grossMargin < 30) {
      out.push({
        id: `margin-low-${r.teacherId}`,
        severity: "警示",
        title: `${r.teacherName} 毛利率 ${r.grossMargin.toFixed(1)}%`,
        detail: "毛利率低於 30%。",
        teacherId: r.teacherId,
        href: `/Teachers/${r.teacherId}`,
      })
    }
    if (r.retentionRate != null && r.retentionRate < 50) {
      out.push({
        id: `retention-${r.teacherId}`,
        severity: "注意",
        title: `${r.teacherName} 續報率 ${r.retentionRate.toFixed(1)}%`,
        detail: "續報率低於 50%（簡化口徑）。",
        teacherId: r.teacherId,
        href: `/Teachers/${r.teacherId}`,
      })
    }
    if (r.absenceRate != null && r.absenceRate > 20) {
      out.push({
        id: `absence-${r.teacherId}`,
        severity: "注意",
        title: `${r.teacherName} 缺課率 ${r.absenceRate.toFixed(1)}%`,
        detail: "缺課／請假佔點名比例高於 20%。",
        teacherId: r.teacherId,
        href: `/Teachers/${r.teacherId}`,
      })
    }
  }
  return out.slice(0, 40)
}

function buildMockPayload(filters: StaffPerformanceFilters): StaffPerformancePayload {
  const { dateFrom, dateTo, periodLabel, monthKeys } = resolveStaffPeriodRange(filters)
  const rows: StaffPerformanceRow[] = [
    {
      teacherId: "t1",
      teacherName: "陳老師",
      teacherAbbr: "C",
      revenue: 42000,
      laborCost: 18000,
      laborMissing: false,
      grossProfit: 24000,
      grossMargin: 57.1,
      laborCostRatio: 42.9,
      teachingHours: 28,
      revenuePerHour: 1500,
      profitPerHour: 857,
      studentCount: 40,
      retentionRate: 72,
      absenceRate: 8,
      withdrawalCount: 1,
      anomalyTags: [],
    },
    {
      teacherId: "t2",
      teacherName: "李老師",
      teacherAbbr: "L",
      revenue: 28000,
      laborCost: 20000,
      laborMissing: false,
      grossProfit: 8000,
      grossMargin: 28.6,
      laborCostRatio: 71.4,
      teachingHours: 22,
      revenuePerHour: 1273,
      profitPerHour: 364,
      studentCount: 25,
      retentionRate: 45,
      absenceRate: 22,
      withdrawalCount: 3,
      anomalyTags: ["人工佔比過高", "毛利率偏低", "續報偏低"],
    },
  ]
  const heatCells: StaffHeatCell[] = rows.flatMap((r) =>
    monthKeys.map((month) => ({
      teacherId: r.teacherId,
      teacherName: r.teacherName,
      month,
      laborCostRatio: r.laborCostRatio,
      revenue: r.revenue / monthKeys.length,
      laborCost: r.laborCost != null ? r.laborCost / monthKeys.length : null,
    }))
  )
  const monthlyTrend: StaffTeacherTrend[] = rows.map((r) => ({
    teacherId: r.teacherId,
    teacherName: r.teacherName,
    months: monthKeys.map((month) => ({
      month,
      revenue: r.revenue / monthKeys.length,
      laborCost: r.laborCost,
      profit: r.grossProfit,
    })),
  }))
  return {
    asOf: localYmd(),
    dateFrom,
    dateTo,
    periodLabel,
    laborSourceNote: "示範資料（未接 Supabase）",
    kpis: buildKpis(rows, rows.reduce((s, r) => s + r.teachingHours, 0)),
    rows,
    monthlyTrend,
    heatCells,
    anomalies: buildAnomalies(rows),
    classOptions: [],
  }
}

export async function fetchStaffPerformance(
  filters: StaffPerformanceFilters
): Promise<StaffPerformancePayload> {
  if (!isSupabaseConfigured || !supabase) {
    return buildMockPayload(filters)
  }

  const { dateFrom, dateTo, periodLabel, monthKeys } = resolveStaffPeriodRange(filters)
  const now = new Date()
  const asOf = `${localYmd(now)} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`

  const { byTeacher, classOptions } = await aggregateRevenueByTeacher(dateFrom, dateTo, filters)

  // 補入七月有人工但無收入的老師（固定月薪等）
  if (monthKeys.includes(STAFF_LABOR_JULY_2026_MONTH)) {
    const teachers = await fetchAllTeachers()
    for (const t of teachers) {
      if (t.status === "非在職") continue
      if (filters.teacherIds.length > 0 && !filters.teacherIds.includes(t.id)) continue
      const snap = findJuly2026LaborByTeacherName(t.full_name)
      if (!snap) continue
      if (!byTeacher.has(t.id)) {
        ensureTeacher(byTeacher, t.id, t.full_name, t.abbr)
      }
    }
  }

  const teacherIds = [...byTeacher.keys()]
  const [withdrawals, retention] = await Promise.all([
    fetchWithdrawalsByTeacher(dateFrom, dateTo, teacherIds),
    fetchRetentionByTeacher(dateFrom, dateTo, teacherIds),
  ])

  const rows: StaffPerformanceRow[] = []
  for (const t of byTeacher.values()) {
    const labor = laborForPeriod(monthKeys, t.teacherName)
    const revenue = Math.round(t.revenue * 100) / 100
    const laborCost = labor.cost
    const laborMissing = labor.missing
    const grossProfit =
      laborCost != null ? Math.round((revenue - laborCost) * 100) / 100 : null
    const grossMargin =
      laborCost != null && revenue > 0
        ? Math.round(((revenue - laborCost) / revenue) * 1000) / 10
        : null
    const laborCostRatio =
      laborCost != null && revenue > 0
        ? Math.round((laborCost / revenue) * 1000) / 10
        : null
    const teachingHours = t.teachingHours
    const revenuePerHour =
      teachingHours > 0 ? Math.round((revenue / teachingHours) * 100) / 100 : null
    const profitPerHour =
      grossProfit != null && teachingHours > 0
        ? Math.round((grossProfit / teachingHours) * 100) / 100
        : null
    const absenceRate =
      t.attendanceTotal > 0
        ? Math.round((t.absenceCount / t.attendanceTotal) * 1000) / 10
        : null
    const retentionRate = retention.get(t.teacherId) ?? null
    const withdrawalCount = withdrawals.get(t.teacherId) ?? 0

    const anomalyTags: string[] = []
    if (laborMissing) anomalyTags.push("未有月結")
    if (laborCostRatio != null && laborCostRatio > 60) anomalyTags.push("人工佔比過高")
    if (grossMargin != null && revenue > 0 && grossMargin < 30) anomalyTags.push("毛利率偏低")
    if (retentionRate != null && retentionRate < 50) anomalyTags.push("續報偏低")
    if (absenceRate != null && absenceRate > 20) anomalyTags.push("缺課偏高")

    rows.push({
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      teacherAbbr: t.teacherAbbr,
      revenue,
      laborCost,
      laborMissing,
      grossProfit,
      grossMargin,
      laborCostRatio,
      teachingHours,
      revenuePerHour,
      profitPerHour,
      studentCount: t.studentIds.size,
      retentionRate,
      absenceRate,
      withdrawalCount,
      anomalyTags,
    })
  }

  rows.sort((a, b) => b.revenue - a.revenue)

  const heatCells: StaffHeatCell[] = []
  const monthlyTrend: StaffTeacherTrend[] = []

  for (const t of byTeacher.values()) {
    if (
      filters.excludeOwners &&
      isStaffPerformanceOwner({ fullName: t.teacherName, abbr: t.teacherAbbr })
    ) {
      continue
    }
    const months: StaffMonthlyPoint[] = []
    for (const mk of monthKeys) {
      const bucket = t.byMonth.get(mk) ?? { revenue: 0, teachingHours: 0 }
      const labor = laborForMonth(mk, t.teacherName)
      const rev = Math.round(bucket.revenue * 100) / 100
      const laborCost = labor.missing ? null : labor.cost
      const profit =
        laborCost != null ? Math.round((rev - laborCost) * 100) / 100 : null
      months.push({ month: mk, revenue: rev, laborCost, profit })
      heatCells.push({
        teacherId: t.teacherId,
        teacherName: t.teacherName,
        month: mk,
        laborCostRatio:
          laborCost != null && rev > 0
            ? Math.round((laborCost / rev) * 1000) / 10
            : laborCost != null && rev === 0
              ? null
              : null,
        revenue: rev,
        laborCost,
      })
    }
    monthlyTrend.push({
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      months,
    })
  }

  const visibleRows = applyOwnerExclusion(rows, filters.excludeOwners)

  const hasJuly = monthKeys.includes(STAFF_LABOR_JULY_2026_MONTH)
  const laborParts = [
    hasJuly
      ? "人工來自 2026-07 離線計糧快照（gross＋僱主MPF）；其他月份未有月結"
      : "所選期間未有離線計糧快照（目前僅 2026-07）",
  ]
  if (filters.excludeOwners) {
    laborParts.push("已排除老闆（Mark Yu、Christine Fan）")
  }
  const laborSourceNote = laborParts.join(" · ")

  const teachingHoursTotal = visibleRows.reduce((s, r) => s + r.teachingHours, 0)

  return {
    asOf,
    dateFrom,
    dateTo,
    periodLabel,
    laborSourceNote,
    kpis: buildKpis(visibleRows, teachingHoursTotal),
    rows: visibleRows,
    monthlyTrend,
    heatCells,
    anomalies: buildAnomalies(visibleRows),
    classOptions,
  }
}

export function exportStaffPerformanceCsv(
  payload: StaffPerformancePayload,
  filters: StaffPerformanceFilters
): string {
  const header = [
    "老師",
    "收入",
    "人工",
    "毛利",
    "毛利率%",
    "人工佔比%",
    "授課時數",
    "每課時收入",
    "每課時毛利",
    "學生數",
    "續報率%",
    "缺課率%",
    "退讀",
    "異常",
  ]
  const lines = [header.join(",")]
  for (const r of payload.rows) {
    const cells = [
      r.teacherName,
      r.revenue,
      r.laborCost ?? "",
      r.grossProfit ?? "",
      r.grossMargin ?? "",
      r.laborCostRatio ?? "",
      r.teachingHours,
      r.revenuePerHour ?? "",
      r.profitPerHour ?? "",
      r.studentCount,
      r.retentionRate ?? "",
      r.absenceRate ?? "",
      r.withdrawalCount,
      r.anomalyTags.join("|"),
    ]
    lines.push(
      cells
        .map((c) => {
          const s = String(c)
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(",")
    )
  }
  lines.push("")
  lines.push(`期間,${payload.periodLabel},${payload.dateFrom},${payload.dateTo}`)
  lines.push(
    `篩選,班型=${filters.classKind},科目數=${filters.subjectIds.length},老師數=${filters.teacherIds.length},排除老闆=${filters.excludeOwners ? "是" : "否"}`
  )
  return "\uFEFF" + lines.join("\n")
}

export function downloadStaffPerformanceCsv(filename: string, csvBody: string): void {
  const blob = new Blob([csvBody], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
