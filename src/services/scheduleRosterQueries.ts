import {
 enrollmentVisibleOnSchedule,
 isSingleSessionEnrollment,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
 type AcademicYearPeriodRow,
 type EnrollmentFormValue,
} from "@/lib/enrollmentPeriod"
import { parseMakeupOfScheduleId } from "@/lib/scheduleMakeupMarkers"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"

const MAX_SCHEDULE_IDS = 100

export type ScheduleRosterSchedule = {
 id: string
 classId: string | null
 scheduledDate: string
 /**
  * 暑期期數判定用日期。補回加堂若跨期（如第一期取消堂補到第二期日），
  * 應沿用原取消堂日期，否則只報第一期的學生會被濾走。
  */
 enrollmentEligibilityDate?: string | null
 sessionNumber: number | null
 academicYearId: string | null
 academicYearLabel: string | null
 courseMode: "regular" | "summer_two_period"
 subject: string | null
 classKind: string | null
 courseCodeFull: string | null
 courseName: string | null
 dayOfWeek: string | null
 timeSlot: string | null
 lessonSlotsPerSession: number
}

export type ScheduleRosterEnrollment = {
 id: string
 classId: string
 studentId: string
 status: string
 enrollDate: string | null
 withdrawEffectiveDate: string | null
 enrollmentPeriod: EnrollmentFormValue | null
 createdAt: string
 fullName: string
 englishName: string | null
 grade: string | null
 school: string | null
 contactPhone: string | null
}

export type ScheduleRosterTrial = {
 id: string
 scheduleId: string
 classId: string
 studentId: string
 status: string
 fullName: string
 englishName: string | null
 grade: string | null
 contactPhone: string | null
}

export type ScheduleRosterLeave = {
 id: string
 studentId: string
 classId: string
 scheduleId: string | null
 leaveDate: string
 leaveReason: string | null
 makeupType: string | null
 makeupScheduleId: string | null
 status: string
 createdAt: string
 fullName: string
 englishName: string | null
 grade: string | null
 contactPhone: string | null
}

export type ScheduleRosterAttendance = {
 id: string
 studentId: string
 classId: string
 attendanceDate: string
 scheduleId: string | null
 status: string
 remarks: string | null
 createdAt: string
 fullName: string
 englishName: string | null
}

export type ScheduleRosterContext = {
 schedules: ScheduleRosterSchedule[]
 periods: AcademicYearPeriodRow[]
 enrollments: ScheduleRosterEnrollment[]
 enrollmentScheduleIds: Map<string, Set<string>>
 enrollmentSessionNumbers: Map<string, number[]>
 trials: ScheduleRosterTrial[]
 leaves: ScheduleRosterLeave[]
 attendance: ScheduleRosterAttendance[]
}

function record(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" ? value as Record<string, unknown> : {}
}

function array(value: unknown): Record<string, unknown>[] {
 return Array.isArray(value) ? value.map(record) : []
}

function nullableString(value: unknown): string | null {
 return value == null || String(value).trim() === "" ? null : String(value)
}

function numberOrNull(value: unknown): number | null {
 if (value == null || value === "") return null
 const n = Number(value)
 return Number.isFinite(n) ? n : null
}

function mapContext(raw: unknown): ScheduleRosterContext {
 const root = record(raw)
 const enrollmentScheduleIds = new Map<string, Set<string>>()
 const enrollmentSessionNumbers = new Map<string, number[]>()

 for (const row of array(root.enrollment_sessions)) {
  const enrollmentId = String(row.enrollment_id ?? "")
  const scheduleId = String(row.schedule_id ?? "")
  if (!enrollmentId || !scheduleId) continue
  const ids = enrollmentScheduleIds.get(enrollmentId) ?? new Set<string>()
  ids.add(scheduleId)
  enrollmentScheduleIds.set(enrollmentId, ids)
  const sessionNumber = numberOrNull(row.session_number)
  if (sessionNumber != null) {
   const numbers = enrollmentSessionNumbers.get(enrollmentId) ?? []
   if (!numbers.includes(sessionNumber)) numbers.push(sessionNumber)
   numbers.sort((a, b) => a - b)
   enrollmentSessionNumbers.set(enrollmentId, numbers)
  }
 }

 return {
  schedules: array(root.schedules).map((row) => ({
   id: String(row.id ?? ""),
   classId: nullableString(row.class_id),
   scheduledDate: String(row.scheduled_date ?? "").slice(0, 10),
   sessionNumber: numberOrNull(row.session_number),
   academicYearId: nullableString(row.academic_year_id),
   academicYearLabel: nullableString(row.academic_year_label),
   courseMode: (
    row.course_mode === "summer_two_period" ? "summer_two_period" : "regular"
   ) as ScheduleRosterSchedule["courseMode"],
   subject: nullableString(row.subject),
   classKind: nullableString(row.class_kind),
   courseCodeFull: nullableString(row.course_code_full),
   courseName: nullableString(row.course_name),
   dayOfWeek: nullableString(row.day_of_week),
   timeSlot: nullableString(row.time_slot),
   lessonSlotsPerSession: numberOrNull(row.lesson_slots_per_session) === 2 ? 2 : 1,
  })).filter((row) => row.id),
  periods: array(root.periods).map((row) => ({
   id: String(row.id ?? ""),
   academicYearId: String(row.academic_year_id ?? ""),
   periodCode: Number(row.period_code) as 1 | 2,
   label: String(row.label ?? ""),
   startDate: String(row.start_date ?? "").slice(0, 10),
   endDate: String(row.end_date ?? "").slice(0, 10),
  })).filter((row) => row.id && row.academicYearId),
  enrollments: array(root.enrollments).map((row) => ({
   id: String(row.id ?? ""),
   classId: String(row.class_id ?? ""),
   studentId: String(row.student_id ?? ""),
   status: String(row.status ?? ""),
   enrollDate: nullableString(row.enroll_date),
   withdrawEffectiveDate: nullableString(row.withdraw_effective_date),
   enrollmentPeriod: normalizeEnrollmentPeriod(nullableString(row.enrollment_period)),
   createdAt: String(row.created_at ?? ""),
   fullName: String(row.full_name ?? "—") || "—",
   englishName: nullableString(row.english_name),
   grade: nullableString(row.grade),
   school: nullableString(row.school),
   contactPhone: nullableString(row.contact_phone),
  })).filter((row) => row.id && row.classId && row.studentId),
  enrollmentScheduleIds,
  enrollmentSessionNumbers,
  trials: array(root.trials).map((row) => ({
   id: String(row.id ?? ""),
   scheduleId: String(row.schedule_id ?? ""),
   classId: String(row.class_id ?? ""),
   studentId: String(row.student_id ?? ""),
   status: String(row.status ?? ""),
   fullName: String(row.full_name ?? "—") || "—",
   englishName: nullableString(row.english_name),
   grade: nullableString(row.grade),
   contactPhone: nullableString(row.contact_phone),
  })).filter((row) => row.id && row.scheduleId && row.studentId),
  leaves: array(root.leaves).map((row) => ({
   id: String(row.id ?? ""),
   studentId: String(row.student_id ?? ""),
   classId: String(row.class_id ?? ""),
   scheduleId: nullableString(row.schedule_id),
   leaveDate: String(row.leave_date ?? "").slice(0, 10),
   leaveReason: nullableString(row.leave_reason),
   makeupType: nullableString(row.makeup_type),
   makeupScheduleId: nullableString(row.makeup_schedule_id),
   status: String(row.status ?? ""),
   createdAt: String(row.created_at ?? ""),
   fullName: String(row.full_name ?? "—") || "—",
   englishName: nullableString(row.english_name),
   grade: nullableString(row.grade),
   contactPhone: nullableString(row.contact_phone),
  })).filter((row) => row.id && row.studentId),
  attendance: array(root.attendance).map((row) => ({
   id: String(row.id ?? ""),
   studentId: String(row.student_id ?? ""),
   classId: String(row.class_id ?? ""),
   attendanceDate: String(row.attendance_date ?? "").slice(0, 10),
   scheduleId: nullableString(row.schedule_id),
   status: String(row.status ?? ""),
   remarks: nullableString(row.remarks),
   createdAt: String(row.created_at ?? ""),
   fullName: String(row.full_name ?? "—") || "—",
   englishName: nullableString(row.english_name),
  })).filter((row) => row.id && row.studentId),
 }
}

export async function fetchScheduleRosterContext(
 scheduleIds: string[]
): Promise<ScheduleRosterContext> {
 const ids = [...new Set(scheduleIds.filter(Boolean))].sort()
 if (!supabase || ids.length === 0) return mapContext({})
 const chunks: string[][] = []
 for (let i = 0; i < ids.length; i += MAX_SCHEDULE_IDS) {
  chunks.push(ids.slice(i, i + MAX_SCHEDULE_IDS))
 }
 const contexts = await Promise.all(chunks.map(async (chunk) => {
  const { data, error } = await supabase!.rpc("get_teacher_schedule_roster_context", {
   p_schedule_ids: chunk,
  })
  if (error) {
   if (error.message.includes("SCHEDULE_ACCESS_DENIED")) {
    throw new Error("你沒有權限讀取其中一個排程的學生名單。")
   }
   throw error
  }
  // enroll_date / withdraw_effective_date 已由 get_teacher_schedule_roster_context 回傳
  // （勿再呼叫 get_enrollment_effective_dates：舊實作會對每列排程跑 teacher_can_access_schedule，平均數秒）
  return mapContext(data)
 }))
 if (contexts.length === 1) {
  return enrichMakeupEnrollmentEligibilityDates(contexts[0]!)
 }

 const merged = mapContext({})
 for (const context of contexts) {
  merged.schedules.push(...context.schedules)
  merged.periods.push(...context.periods)
  merged.enrollments.push(...context.enrollments)
  merged.trials.push(...context.trials)
  merged.leaves.push(...context.leaves)
  merged.attendance.push(...context.attendance)
  for (const [enrollmentId, scheduleIdSet] of context.enrollmentScheduleIds) {
   const target = merged.enrollmentScheduleIds.get(enrollmentId) ?? new Set<string>()
   for (const scheduleId of scheduleIdSet) target.add(scheduleId)
   merged.enrollmentScheduleIds.set(enrollmentId, target)
  }
  for (const [enrollmentId, sessionNumbers] of context.enrollmentSessionNumbers) {
   const target = merged.enrollmentSessionNumbers.get(enrollmentId) ?? []
   for (const sessionNumber of sessionNumbers) {
    if (!target.includes(sessionNumber)) target.push(sessionNumber)
   }
   target.sort((a, b) => a - b)
   merged.enrollmentSessionNumbers.set(enrollmentId, target)
  }
 }
 merged.periods = [...new Map(merged.periods.map((row) => [row.id, row])).values()]
 merged.enrollments = [...new Map(merged.enrollments.map((row) => [row.id, row])).values()]
 merged.trials = [...new Map(merged.trials.map((row) => [row.id, row])).values()]
 merged.leaves = [...new Map(merged.leaves.map((row) => [row.id, row])).values()]
 merged.attendance = [...new Map(merged.attendance.map((row) => [row.id, row])).values()]
 return enrichMakeupEnrollmentEligibilityDates(merged)
}

/**
 * 補回加堂（remarks 含 makeup_of=<原堂id>）的暑期期數，沿用原取消堂日期。
 * RPC 未回傳 remarks，故另撈 schedules.remarks／原堂 scheduled_date。
 */
async function enrichMakeupEnrollmentEligibilityDates(
 context: ScheduleRosterContext
): Promise<ScheduleRosterContext> {
 if (!supabase || context.schedules.length === 0) return context

 const scheduleIds = context.schedules.map((row) => row.id)
 const remarkById = new Map<string, string | null>()
 await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("id, remarks")
   .in("id", chunk)
  if (error) throw error
  for (const row of data ?? []) {
   const r = row as Record<string, unknown>
   remarkById.set(String(r.id), r.remarks != null ? String(r.remarks) : null)
  }
 })

 const makeupOfByScheduleId = new Map<string, string>()
 for (const [scheduleId, remarks] of remarkById) {
  const originalId = parseMakeupOfScheduleId(remarks)
  if (originalId) makeupOfByScheduleId.set(scheduleId, originalId)
 }
 if (makeupOfByScheduleId.size === 0) return context

 const originalIds = [...new Set(makeupOfByScheduleId.values())]
 const originalDateById = new Map<string, string>()
 await forEachIdChunk(originalIds, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("id, scheduled_date")
   .in("id", chunk)
  if (error) throw error
  for (const row of data ?? []) {
   const r = row as Record<string, unknown>
   const id = String(r.id ?? "")
   const date = String(r.scheduled_date ?? "").slice(0, 10)
   if (id && /^\d{4}-\d{2}-\d{2}$/.test(date)) originalDateById.set(id, date)
  }
 })

 return {
  ...context,
  schedules: context.schedules.map((schedule) => {
   const originalId = makeupOfByScheduleId.get(schedule.id)
   if (!originalId) return schedule
   const eligibilityDate = originalDateById.get(originalId)
   if (!eligibilityDate) return schedule
   return { ...schedule, enrollmentEligibilityDate: eligibilityDate }
  }),
 }
}

function periodCodeForSchedule(
 context: ScheduleRosterContext,
 schedule: ScheduleRosterSchedule
): 1 | 2 | null {
 if (schedule.courseMode !== "summer_two_period" || !schedule.academicYearId) return null
 const dateForPeriod = schedule.enrollmentEligibilityDate ?? schedule.scheduledDate
 return resolvePeriodCodeFromDate(
  dateForPeriod,
  context.periods.filter((period) => period.academicYearId === schedule.academicYearId)
 )
}

export function enrollmentIsVisibleOnRosterSchedule(
 context: ScheduleRosterContext,
 enrollment: ScheduleRosterEnrollment,
 schedule: ScheduleRosterSchedule
): boolean {
 if (schedule.classId !== enrollment.classId) return false
 if (enrollment.enrollDate && schedule.scheduledDate < enrollment.enrollDate) return false
 if (
  enrollment.withdrawEffectiveDate &&
  schedule.scheduledDate >= enrollment.withdrawEffectiveDate
 ) {
  return false
 }
 return enrollmentVisibleOnSchedule({
  enrollmentPeriod: enrollment.enrollmentPeriod,
  periodCode: periodCodeForSchedule(context, schedule),
  scheduleId: schedule.id,
  enrolledScheduleIds: context.enrollmentScheduleIds.get(enrollment.id) ?? new Set<string>(),
 })
}

export function enrollmentsForSchedules(
 context: ScheduleRosterContext,
 scheduleIds: string[]
): ScheduleRosterEnrollment[] {
 const idSet = new Set(scheduleIds)
 const schedules = context.schedules.filter((schedule) => idSet.has(schedule.id))
 return context.enrollments.filter((enrollment) =>
  schedules.some((schedule) => enrollmentIsVisibleOnRosterSchedule(context, enrollment, schedule))
 )
}

export function activeTrialsForSchedules(
 context: ScheduleRosterContext,
 scheduleIds: string[]
): ScheduleRosterTrial[] {
 const idSet = new Set(scheduleIds)
 return context.trials.filter((trial) =>
  idSet.has(trial.scheduleId)
  && !trial.status.includes("完成")
  && !trial.status.includes("取消")
 )
}

export function makeupsForSchedules(
 context: ScheduleRosterContext,
 scheduleIds: string[]
): ScheduleRosterLeave[] {
 const idSet = new Set(scheduleIds)
 return context.leaves.filter((leave) =>
  leave.makeupScheduleId != null && idSet.has(leave.makeupScheduleId)
 )
}

export function leavesForSchedule(
 context: ScheduleRosterContext,
 scheduleId: string
): ScheduleRosterLeave[] {
 const schedule = context.schedules.find((row) => row.id === scheduleId)
 if (!schedule?.classId) return []
 return context.leaves.filter((leave) =>
  leave.scheduleId === schedule.id
  || (leave.classId === schedule.classId && leave.leaveDate === schedule.scheduledDate)
 )
}

export function singleSessionNotOnSchedule(
 context: ScheduleRosterContext,
 scheduleId: string
): ScheduleRosterEnrollment[] {
 const schedule = context.schedules.find((row) => row.id === scheduleId)
 if (!schedule?.classId) return []
 return context.enrollments.filter((enrollment) =>
  enrollment.classId === schedule.classId
  && isSingleSessionEnrollment(enrollment.enrollmentPeriod)
  && !(context.enrollmentScheduleIds.get(enrollment.id) ?? new Set<string>()).has(scheduleId)
 )
}

export function attendanceForSchedule(
 context: ScheduleRosterContext,
 scheduleId: string
): ScheduleRosterAttendance[] {
 const schedule = context.schedules.find((row) => row.id === scheduleId)
 if (!schedule?.classId) return []
 return context.attendance.filter((row) =>
  row.scheduleId === scheduleId
  || (
   row.scheduleId == null
   && row.classId === schedule.classId
   && row.attendanceDate === schedule.scheduledDate
  )
 )
}

export type ScheduleRosterNameHints = {
 /** 點名冊上應到（不含當日請假） */
 attendingNames: string[]
 /** 點名冊上當日請假 */
 leaveNames: string[]
 /** 單堂報讀但本堂未選（提醒用，非請假） */
 notEnrolledNames: string[]
}

function sortRosterNames(names: string[]): string[] {
 return [...new Set(names)].sort((a, b) => a.localeCompare(b, "zh-Hant"))
}

/**
 * 該堂點名冊學生（與點名紙一致）：當堂可見報讀＋未完成試堂＋來此補堂。
 * 以 studentId 去重；就讀優先於試堂／補堂。
 */
export function rosterStudentsForSchedule(
 context: ScheduleRosterContext,
 scheduleId: string
): { studentId: string; fullName: string }[] {
 const byId = new Map<string, string>()
 for (const row of enrollmentsForSchedules(context, [scheduleId])) {
  byId.set(row.studentId, row.fullName)
 }
 for (const row of activeTrialsForSchedules(context, [scheduleId])) {
  if (!byId.has(row.studentId)) byId.set(row.studentId, row.fullName)
 }
 for (const row of makeupsForSchedules(context, [scheduleId])) {
  if (!byId.has(row.studentId)) byId.set(row.studentId, row.fullName)
 }
 return [...byId.entries()]
  .map(([studentId, fullName]) => ({ studentId, fullName }))
  .sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
}

/** 該堂點名冊人數（報讀可見＋試堂＋補堂，去重） */
export function rosterHeadcountForSchedule(
 context: ScheduleRosterContext,
 scheduleId: string
): number {
 return rosterStudentsForSchedule(context, scheduleId).length
}

/**
 * 排程列表／卡片用名單提示：對齊點名冊，請假生另列（紅字）。
 */
export function scheduleStudentHintsFromContext(
 context: ScheduleRosterContext,
 scheduleIds: string[]
): Map<string, ScheduleRosterNameHints> {
 const out = new Map<string, ScheduleRosterNameHints>()
 for (const scheduleId of scheduleIds) {
  const leaveRows = leavesForSchedule(context, scheduleId)
  const leaveIds = new Set(leaveRows.map((row) => row.studentId))
  const leaveNames = sortRosterNames(leaveRows.map((row) => row.fullName))
  const attendingNames = sortRosterNames(
   rosterStudentsForSchedule(context, scheduleId)
    .filter((row) => !leaveIds.has(row.studentId))
    .map((row) => row.fullName)
  )
  const notEnrolledNames = sortRosterNames(
   singleSessionNotOnSchedule(context, scheduleId).map((row) => row.fullName)
  )
  out.set(scheduleId, { attendingNames, leaveNames, notEnrolledNames })
 }
 return out
}

