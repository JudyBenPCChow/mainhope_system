import { formatClassLabel } from "@/lib/courseLabel"
import {
 enrollmentCoversPeriod,
 enrollmentVisibleOnSchedule,
 fetchAcademicYearPeriods,
 fetchClassEnrollmentConfigsByIds,
 isSingleSessionEnrollment,
 isSummerTwoPeriodMode,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
} from "@/lib/enrollmentPeriod"
import { fetchEnrolledScheduleIdsByEnrollmentIds } from "@/services/enrollmentSessionQueries"
import {
 LESSON_SLOT_DURATION_MIN,
 intervalsOverlapMinutes,
 parseHm,
} from "@/lib/lessonSlots"
import { resolveClassKind, type ClassKind } from "@/lib/privateClassKind"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

/** 排程列表／點名共用 select（含代堂原老師） */
const SCHEDULE_MANAGE_SELECT =
 "id, scheduled_date, start_time, end_time, status, cancel_reason, is_extra_lesson, remarks, session_number, consecutive_group_id, consecutive_slot_index, class_id, teacher_id, original_teacher_id, classroom_id, classes ( subject, class_kind, course_code_full, day_of_week, time_slot, lesson_slots_per_session, courses ( course_name ) ), teachers!schedules_teacher_id_fkey ( full_name ), original_teacher:teachers!schedules_original_teacher_id_fkey ( full_name ), classrooms ( name )"

export type ScheduleManageRow = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 /** 取消原因（狀態為「取消」時使用） */
 cancel_reason: string | null
 /** 加堂（額外加開課堂）標記，可與狀態並存 */
 is_extra_lesson: boolean
 remarks: string | null
 session_number: number | null
 consecutive_group_id: string | null
 consecutive_slot_index: number | null
 class_id: string | null
 subject: string
 /** 小組／一對一（由 classes.class_kind 或 subject 推斷） */
 class_kind: ClassKind
 course_name: string | null
 /** 班別顯示標籤（課程名稱 + 代碼） */
 classLabel: string
 course_code_full: string | null
 /** 班別固定上課日（來自 classes.day_of_week） */
 class_day_of_week: string | null
 /** 班別固定時段（來自 classes.time_slot） */
 class_time_slot: string | null
 /** 班別每次上課格數（1 或 2） */
 class_lesson_slots_per_session: number
 /** 實際上課老師（代堂時為代堂老師） */
 teacher_id: string | null
 teacher_name: string | null
 /** 代堂前原任老師；非空表示已指派代堂 */
 original_teacher_id: string | null
 original_teacher_name: string | null
 classroom_id: string | null
 classroom_name: string | null
 enrollCount: number
}

export type ScheduleAlerts = {
 trial: boolean
 makeup: boolean
 leave: boolean
 record: boolean
}

function mapScheduleRow(
 row: Record<string, unknown>,
 enrollMap: Map<string, number>
): ScheduleManageRow {
 const cls = row.classes as Record<string, unknown> | null
 const tch = row.teachers as Record<string, unknown> | null
 const origTch = row.original_teacher as Record<string, unknown> | null
 const rm = row.classrooms as Record<string, unknown> | null
 const cidRaw = row.class_id
 const cid = cidRaw != null ? String(cidRaw) : null
 const sub = cls?.subject != null ? String(cls.subject) : "（無班別）"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
 return {
  id: String(row.id),
  scheduled_date: String(row.scheduled_date ?? ""),
  start_time: row.start_time != null ? String(row.start_time) : null,
  end_time: row.end_time != null ? String(row.end_time) : null,
  status: String(row.status ?? "正常"),
  cancel_reason: row.cancel_reason != null ? String(row.cancel_reason) : null,
  is_extra_lesson: row.is_extra_lesson === true,
  remarks: row.remarks != null ? String(row.remarks) : null,
  session_number:
   row.session_number != null && !Number.isNaN(Number(row.session_number))
    ? Number(row.session_number)
    : null,
  consecutive_group_id:
   row.consecutive_group_id != null ? String(row.consecutive_group_id) : null,
  consecutive_slot_index:
   row.consecutive_slot_index != null && !Number.isNaN(Number(row.consecutive_slot_index))
    ? Number(row.consecutive_slot_index)
    : null,
  class_id: cid,
  subject: sub,
  class_kind: resolveClassKind(
   cls?.class_kind != null ? String(cls.class_kind) : null,
   sub
  ),
  course_name: courseName,
  classLabel: formatClassLabel({ subject: sub, courseCode, courseName }),
  course_code_full: courseCode,
  class_day_of_week: cls?.day_of_week != null ? String(cls.day_of_week) : null,
  class_time_slot: cls?.time_slot != null ? String(cls.time_slot) : null,
  class_lesson_slots_per_session:
   cls?.lesson_slots_per_session != null && Number(cls.lesson_slots_per_session) === 2 ? 2 : 1,
  teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  original_teacher_id:
   row.original_teacher_id != null ? String(row.original_teacher_id) : null,
  original_teacher_name:
   origTch?.full_name != null ? String(origTch.full_name) : null,
  classroom_id: row.classroom_id != null ? String(row.classroom_id) : null,
  classroom_name: rm?.name != null ? String(rm.name) : null,
  enrollCount: cid ? enrollMap.get(cid) ?? 0 : 0,
 }
}

/** 老師範圍：現任或原任（代堂後雙方都看得到） */
function applyTeacherScheduleScope<T extends { or: (filter: string) => T }>(
 q: T,
 teacherId: string
): T {
 return q.or(`teacher_id.eq.${teacherId},original_teacher_id.eq.${teacherId}`)
}

export async function fetchEnrollmentCountByClass(classIds: string[]): Promise<Map<string, number>> {
 const m = new Map<string, number>()
 if (!supabase || classIds.length === 0) return m
 const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("student_class_enrollments")
   .select("class_id")
   .in("class_id", slice)
   .eq("status", "就讀中")
  if (error) throw error
  return data ?? []
 })
 for (const data of chunks) {
  for (const row of data) {
   const cid = String((row as { class_id: string }).class_id)
   m.set(cid, (m.get(cid) ?? 0) + 1)
  }
 }
 return m
}

/** 各班「就讀中」人數與姓名（班別列表用） */
export async function fetchEnrollmentRosterByClassIds(
 classIds: string[]
): Promise<Map<string, { count: number; names: string[] }>> {
 const m = new Map<string, { count: number; names: string[] }>()
 if (!supabase || classIds.length === 0) return m
 const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("student_class_enrollments")
   .select("class_id, students ( full_name )")
   .in("class_id", slice)
   .eq("status", "就讀中")
  if (error) throw error
  return data ?? []
 })
 for (const data of chunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const cid = String(r.class_id ?? "")
   if (!cid) continue
   const st = r.students as Record<string, unknown> | null
   const name = st?.full_name != null ? String(st.full_name).trim() : ""
   const label = name || "—"
   const cur = m.get(cid) ?? { count: 0, names: [] as string[] }
   cur.count += 1
   cur.names.push(label)
   m.set(cid, cur)
  }
 }
 for (const v of m.values()) {
  v.names.sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }
 return m
}

export type DayViewRosterStudent = { studentId: string; fullName: string }

type DayViewEnrollmentRow = {
 enrollmentId: string
 classId: string
 studentId: string
 fullName: string
 enrollmentPeriod: ReturnType<typeof normalizeEnrollmentPeriod>
}

/** 日視圖：各排程未完成／未取消的試堂生（依 schedule_id） */
async function fetchDayViewTrialStudentsByScheduleIds(
 scheduleIds: string[]
): Promise<Map<string, DayViewRosterStudent[]>> {
 const map = new Map<string, DayViewRosterStudent[]>()
 for (const id of scheduleIds) map.set(id, [])
 if (!supabase || scheduleIds.length === 0) return map

 const chunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("trial_sessions")
   .select("schedule_id, student_id, status, students ( full_name )")
   .in("schedule_id", slice)
  if (error) throw error
  return data ?? []
 })

 for (const data of chunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const status = String(r.status ?? "")
   if (status.includes("完成") || status.includes("取消")) continue
   const scheduleId = r.schedule_id != null ? String(r.schedule_id) : ""
   if (!scheduleId || !map.has(scheduleId)) continue
   const st = r.students as Record<string, unknown> | null
   const fullName = st?.full_name != null ? String(st.full_name).trim() : "—"
   map.get(scheduleId)!.push({
    studentId: String(r.student_id),
    fullName: fullName || "—",
   })
  }
 }
 return map
}

/** 日視圖：以本排程為補堂目標的學生（makeup_schedule_id） */
async function fetchDayViewMakeupStudentsByScheduleIds(
 scheduleIds: string[]
): Promise<Map<string, DayViewRosterStudent[]>> {
 const map = new Map<string, DayViewRosterStudent[]>()
 for (const id of scheduleIds) map.set(id, [])
 if (!supabase || scheduleIds.length === 0) return map

 const chunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("leave_makeup_records")
   .select("makeup_schedule_id, student_id, students ( full_name )")
   .in("makeup_schedule_id", slice)
  if (error) throw error
  return data ?? []
 })

 for (const data of chunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const scheduleId = r.makeup_schedule_id != null ? String(r.makeup_schedule_id) : ""
   if (!scheduleId || !map.has(scheduleId)) continue
   const st = r.students as Record<string, unknown> | null
   const fullName = st?.full_name != null ? String(st.full_name).trim() : "—"
   map.get(scheduleId)!.push({
    studentId: String(r.student_id),
    fullName: fullName || "—",
   })
  }
 }
 return map
}

function mergeDayViewRosterStudents(
 base: DayViewRosterStudent[],
 extras: DayViewRosterStudent[]
): DayViewRosterStudent[] {
 const seen = new Set(base.map((s) => s.studentId))
 const out = [...base]
 for (const s of extras) {
  if (seen.has(s.studentId)) continue
  seen.add(s.studentId)
  out.push(s)
 }
 out.sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
 return out
}

/**
 * 日視圖專用：各排程「上堂名單」＝就讀報讀（暑期期數＋單堂選堂）＋試堂生＋補堂生。
 * 報讀語意對齊 fetchClassStudents(classId, { scheduleDate, scheduleId, activeOnly: true })；
 * 試堂／補堂對齊點名紙（未完成／未取消試堂；makeup_schedule_id＝本堂）。
 * 回傳 Map 以 schedule id 為鍵。
 */
export async function fetchDayViewRosterBySchedules(
 schedules: { id: string; class_id: string | null; scheduled_date: string }[]
): Promise<Map<string, DayViewRosterStudent[]>> {
 const m = new Map<string, DayViewRosterStudent[]>()
 for (const s of schedules) m.set(s.id, [])
 if (!supabase || schedules.length === 0) return m

 const scheduleIds = schedules.map((s) => s.id)
 const classIds = [
  ...new Set(
   schedules
    .map((s) => s.class_id)
    .filter((id): id is string => id != null && id !== "")
  ),
 ]

 const [enrollmentChunks, configByClass, trialBySchedule, makeupBySchedule] = await Promise.all([
  classIds.length > 0
   ? forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
      const { data, error } = await supabase!
       .from("student_class_enrollments")
       .select("id, class_id, student_id, enrollment_period, students ( full_name )")
       .in("class_id", slice)
       .eq("status", "就讀中")
      if (error) throw error
      return data ?? []
     })
   : Promise.resolve([] as Record<string, unknown>[][]),
  classIds.length > 0
   ? fetchClassEnrollmentConfigsByIds(classIds)
   : Promise.resolve(new Map() as Awaited<ReturnType<typeof fetchClassEnrollmentConfigsByIds>>),
  fetchDayViewTrialStudentsByScheduleIds(scheduleIds),
  fetchDayViewMakeupStudentsByScheduleIds(scheduleIds),
 ])

 const enrollments: DayViewEnrollmentRow[] = []
 for (const data of enrollmentChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const classId = String(r.class_id ?? "")
   if (!classId) continue
   const st = r.students as Record<string, unknown> | null
   const fullName = st?.full_name != null ? String(st.full_name).trim() : "—"
   enrollments.push({
    enrollmentId: String(r.id),
    classId,
    studentId: String(r.student_id),
    fullName: fullName || "—",
    enrollmentPeriod: normalizeEnrollmentPeriod(
     r.enrollment_period != null ? String(r.enrollment_period) : null
    ),
   })
  }
 }

 const singleIds = enrollments
  .filter((row) => isSingleSessionEnrollment(row.enrollmentPeriod))
  .map((row) => row.enrollmentId)
 const scheduleIdByEnrollment = await fetchEnrolledScheduleIdsByEnrollmentIds(singleIds)

 const yearIds = [
  ...new Set(
   [...configByClass.values()]
    .filter((c) => isSummerTwoPeriodMode(c.courseMode) && c.academicYearId)
    .map((c) => c.academicYearId as string)
  ),
 ]
 const periodsByYear = new Map<
  string,
  Awaited<ReturnType<typeof fetchAcademicYearPeriods>>
 >()
 await Promise.all(
  yearIds.map(async (yid) => {
   periodsByYear.set(yid, await fetchAcademicYearPeriods(yid))
  })
 )

 const enrollmentsByClass = new Map<string, DayViewEnrollmentRow[]>()
 for (const row of enrollments) {
  const list = enrollmentsByClass.get(row.classId) ?? []
  list.push(row)
  enrollmentsByClass.set(row.classId, list)
 }

 for (const s of schedules) {
  const enrolledList: DayViewRosterStudent[] = []
  if (s.class_id) {
   const config = configByClass.get(s.class_id)
   let periodCode: 1 | 2 | null = null
   if (config && isSummerTwoPeriodMode(config.courseMode) && config.academicYearId) {
    const periods = periodsByYear.get(config.academicYearId) ?? []
    periodCode = resolvePeriodCodeFromDate(s.scheduled_date, periods)
   }

   for (const row of enrollmentsByClass.get(s.class_id) ?? []) {
    if (isSingleSessionEnrollment(row.enrollmentPeriod)) {
     const enrolled = scheduleIdByEnrollment.get(row.enrollmentId) ?? new Set<string>()
     if (
      !enrollmentVisibleOnSchedule({
       enrollmentPeriod: row.enrollmentPeriod,
       periodCode,
       scheduleId: s.id,
       enrolledScheduleIds: enrolled,
      })
     ) {
      continue
     }
    } else if (periodCode != null && !enrollmentCoversPeriod(row.enrollmentPeriod, periodCode)) {
     continue
    }
    enrolledList.push({ studentId: row.studentId, fullName: row.fullName })
   }
  }

  const withTrials = mergeDayViewRosterStudents(
   enrolledList,
   trialBySchedule.get(s.id) ?? []
  )
  m.set(
   s.id,
   mergeDayViewRosterStudents(withTrials, makeupBySchedule.get(s.id) ?? [])
  )
 }

 return m
}

export async function fetchSchedulesInRange(
 fromYmd: string,
 toYmd: string,
 opts?: { teacherId?: string | null }
): Promise<ScheduleManageRow[]> {
 if (!supabase) return []
 let q = supabase
  .from("schedules")
  .select(SCHEDULE_MANAGE_SELECT)
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
 if (opts?.teacherId) q = applyTeacherScheduleScope(q, opts.teacherId)
 const { data, error } = await q.order("scheduled_date", { ascending: true }).order("start_time", { ascending: true })
 if (error) throw error
 const rows = (data ?? []) as Record<string, unknown>[]
 const classIds = [
  ...new Set(
   rows
    .map((r) => (r.class_id != null ? String(r.class_id) : null))
    .filter((x): x is string => x != null)
  ),
 ]
 const enrollMap = await fetchEnrollmentCountByClass(classIds)
 return rows.map((r) => mapScheduleRow(r, enrollMap))
}

export async function fetchScheduleAlerts(
 schedules: {
  id: string
  class_id: string | null
  scheduled_date: string
  remarks?: string | null
 }[]
): Promise<Map<string, ScheduleAlerts>> {
 const map = new Map<string, ScheduleAlerts>()
 for (const s of schedules) {
  map.set(s.id, { trial: false, makeup: false, leave: false, record: false })
 }
 if (!supabase || schedules.length === 0) return map

 const ids = schedules.map((s) => s.id)
 const dates = [...new Set(schedules.map((s) => s.scheduled_date))]
 const classIds = [...new Set(schedules.map((s) => s.class_id).filter((x): x is string => x != null))]

 const [trialChunks, leavesLinkedChunks, leavesOrphanChunks, makeupTargetChunks] = await Promise.all([
  forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("trial_sessions")
    .select("schedule_id, status")
    .in("schedule_id", slice)
   if (error) throw error
   return data ?? []
  }),
  forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("leave_makeup_records")
    .select("schedule_id, makeup_type, status, leave_reason")
    .in("schedule_id", slice)
   if (error) throw error
   return data ?? []
  }),
  classIds.length
   ? forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
      const { data, error } = await supabase!
       .from("leave_makeup_records")
       .select("class_id, leave_date, leave_reason, makeup_type, schedule_id, status")
       .in("leave_date", dates)
       .in("class_id", slice)
      if (error) throw error
      return data ?? []
     })
   : Promise.resolve([] as Record<string, unknown>[][]),
  forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("leave_makeup_records")
    .select("makeup_schedule_id")
    .in("makeup_schedule_id", slice)
   if (error) throw error
   return data ?? []
  }),
 ])

 for (const data of makeupTargetChunks) {
  for (const row of data ?? []) {
   const mid = String((row as { makeup_schedule_id: string }).makeup_schedule_id)
   const a = map.get(mid)
   if (a) a.makeup = true
  }
 }

 for (const data of trialChunks) {
  for (const row of data) {
   const r = row as { schedule_id: string; status?: string }
   const st = String(r.status ?? "")
   if (st.includes("完成") || st.includes("取消")) continue
   const a = map.get(String(r.schedule_id))
   if (a) a.trial = true
  }
 }

 for (const data of leavesLinkedChunks) {
  for (const row of data) {
   const sid = String((row as { schedule_id: string }).schedule_id)
   const a = map.get(sid)
   if (!a) continue
   a.leave = true
   const makeupType = String((row as { makeup_type?: string }).makeup_type ?? "")
   const st = String((row as { status?: string }).status ?? "")
   const reason = String((row as { leave_reason?: string }).leave_reason ?? "")
   if (makeupType.includes("補") || st.includes("補") || reason.includes("補堂")) a.makeup = true
  }
 }

 for (const data of leavesOrphanChunks) {
  for (const row of data) {
   const r = row as {
    class_id: string
    leave_date: string
    schedule_id: string | null
    leave_reason?: string | null
    makeup_type?: string | null
    status?: string | null
   }
   if (r.schedule_id) continue
   const reason = String(r.leave_reason ?? "")
   const mk = String(r.makeup_type ?? "")
   const st = String(r.status ?? "")
   for (const s of schedules) {
    if (!s.class_id || s.class_id !== r.class_id || s.scheduled_date !== r.leave_date) continue
    const a = map.get(s.id)
    if (!a) continue
    if (reason.includes("病") || reason.includes("事假") || reason.includes("請假") || reason.includes("假")) {
     a.leave = true
    }
    if (mk.includes("補") || st.includes("補") || reason.includes("補")) a.makeup = true
   }
  }
 }

 for (const s of schedules) {
  const rem = s.remarks ?? ""
  if (rem.includes("錄影") || rem.includes("錄像") || rem.includes("錄音")) {
   const a = map.get(s.id)
   if (a) a.record = true
  }
 }

 return map
}

export type ScheduleStatsSnapshot = {
 todayLessonCount: number
 pendingCancelledCount: number
 todayStudentHeadcount: number
}

/** 儀表板數字：以「今天」為準，與目前列表日期區間無關；專班老師可傳 teacherId 僅計自己的排程 */
export async function fetchScheduleStatsSnapshot(teacherId?: string | null): Promise<ScheduleStatsSnapshot> {
 const empty: ScheduleStatsSnapshot = {
  todayLessonCount: 0,
  pendingCancelledCount: 0,
  todayStudentHeadcount: 0,
 }
 if (!supabase) return empty

 const today = localYmd()

 const [todayLessons, pendingCancel, todaySchedRows] = await Promise.all([
  (() => {
   let q = supabase
    .from("schedules")
    .select("id", { count: "exact", head: true })
    .eq("scheduled_date", today)
    .not("status", "ilike", "%取消%")
   if (teacherId) q = applyTeacherScheduleScope(q, teacherId)
   return q
  })(),
  (() => {
   let q = supabase
    .from("schedules")
    .select("id", { count: "exact", head: true })
    .gte("scheduled_date", today)
    .ilike("status", "%取消%")
   if (teacherId) q = applyTeacherScheduleScope(q, teacherId)
   return q
  })(),
  (() => {
   let q = supabase
    .from("schedules")
    .select("class_id")
    .eq("scheduled_date", today)
    .not("status", "ilike", "%取消%")
   if (teacherId) q = applyTeacherScheduleScope(q, teacherId)
   return q
  })(),
 ])

 const classIds = [
  ...new Set(
   (todaySchedRows.data ?? [])
    .map((r) => (r as { class_id: string | null }).class_id)
    .filter((x): x is string => x != null && x !== "")
  ),
 ]
 const enrollMap = await fetchEnrollmentCountByClass(classIds)
 let todayStudentHeadcount = 0
 for (const cid of classIds) {
  todayStudentHeadcount += enrollMap.get(cid) ?? 0
 }

 return {
  todayLessonCount: todayLessons.count ?? 0,
  pendingCancelledCount: pendingCancel.count ?? 0,
  todayStudentHeadcount,
 }
}

export type ClassScheduleSummary = {
 classId: string
 dates: string[]
 hasActive: boolean
}

export async function fetchScheduleSummariesByClassIds(
 classIds: string[]
): Promise<Map<string, ClassScheduleSummary>> {
 const out = new Map<string, ClassScheduleSummary>()
 if (!supabase || classIds.length === 0) return out
 for (const id of classIds) {
  out.set(id, { classId: id, dates: [], hasActive: false })
 }
 const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("class_id, scheduled_date, status")
   .in("class_id", slice)
   .order("scheduled_date", { ascending: true })
  if (error) throw error
  return data ?? []
 })
 for (const data of chunks) {
  for (const row of data) {
   const r = row as { class_id: string; scheduled_date: string; status: string }
   const cid = String(r.class_id)
   const entry = out.get(cid)
   if (!entry) continue
   if (!r.status.includes("取消")) {
    entry.hasActive = true
    entry.dates.push(String(r.scheduled_date))
   }
  }
 }
 return out
}

export type TeacherScheduleConflict = {
 id: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 status: string
 classLabel: string
 classroomName: string | null
}

/**
 * 找出某老師在指定日期、與給定時間範圍重疊的「未取消」排程，用於新增排程時提醒。
 * 若新排程只有開始時間、沒有結束時間，預設以一格課時長推算結束。
 */
export async function fetchTeacherScheduleConflicts(params: {
 teacherId: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 excludeScheduleId?: string | null
 excludeScheduleIds?: string[] | null
}): Promise<TeacherScheduleConflict[]> {
 if (!supabase || !params.teacherId) return []
 const dateYmd = params.scheduledDate.slice(0, 10)
 const newStart = parseHm((params.startTime ?? "").slice(0, 5))
 if (newStart == null) return []
 const newEnd = parseHm((params.endTime ?? "").slice(0, 5)) ?? newStart + LESSON_SLOT_DURATION_MIN
 const excludeIds = new Set<string>()
 if (params.excludeScheduleId) excludeIds.add(params.excludeScheduleId)
 for (const id of params.excludeScheduleIds ?? []) {
  if (id) excludeIds.add(id)
 }

 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, scheduled_date, start_time, end_time, status, class_id, classes ( subject, course_code_full, courses ( course_name ) ), classrooms ( name )"
  )
  .eq("teacher_id", params.teacherId)
  .eq("scheduled_date", dateYmd)
 if (error) throw error

 const out: TeacherScheduleConflict[] = []
 for (const row of (data ?? []) as Record<string, unknown>[]) {
  const id = String(row.id)
  if (excludeIds.has(id)) continue
  const status = String(row.status ?? "")
  if (status.includes("取消")) continue
  const st = row.start_time != null ? String(row.start_time) : null
  const et = row.end_time != null ? String(row.end_time) : null
  const exStart = parseHm((st ?? "").slice(0, 5))
  if (exStart == null) continue
  const exEnd = parseHm((et ?? "").slice(0, 5)) ?? exStart + LESSON_SLOT_DURATION_MIN
  if (!intervalsOverlapMinutes(newStart, newEnd, exStart, exEnd)) continue
  const cls = row.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "（無班別）"
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
  const rm = row.classrooms as Record<string, unknown> | null
  out.push({
   id,
   scheduledDate: String(row.scheduled_date ?? "").slice(0, 10),
   startTime: st,
   endTime: et,
   status,
   classLabel: formatClassLabel({ subject: sub, courseCode, courseName }),
   classroomName: rm?.name != null ? String(rm.name) : null,
  })
 }
 out.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
 return out
}

export async function cancelAllSchedulesForClass(classId: string): Promise<number> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error: fetchErr } = await supabase
  .from("schedules")
  .select("id, status")
  .eq("class_id", classId)
 if (fetchErr) throw fetchErr
 const active = (data ?? []).filter((r) => !(r as { status: string }).status.includes("取消"))
 if (active.length === 0) return 0
 const now = new Date().toISOString()
 for (const row of active) {
  const { error } = await supabase
   .from("schedules")
   .update({ status: "取消", updated_at: now })
   .eq("id", (row as { id: string }).id)
  if (error) throw error
 }
 return active.length
}

export async function fetchActiveScheduleDatesForClass(classId: string): Promise<string[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("schedules")
  .select("scheduled_date, status")
  .eq("class_id", classId)
  .order("scheduled_date", { ascending: true })
 if (error) throw error
 return (data ?? [])
  .filter((r) => !(r as { status: string }).status.includes("取消"))
  .map((r) => String((r as { scheduled_date: string }).scheduled_date))
}

export function scheduleRangeEnd(startYmd: string, daysInclusive: number): string {
 return addDaysYmd(startYmd, daysInclusive - 1)
}

/**
 * 找出「未來最接近」的有課日期（含今天若今天有未取消排程）。
 * 排除「取消」狀態；若未來完全沒有排程則回傳 null（頁面可維持今天）。
 */
export async function fetchNearestScheduleDate(
 opts?: { teacherId?: string | null }
): Promise<string | null> {
 if (!supabase) return null
 const today = localYmd()

 let q = supabase
  .from("schedules")
  .select("scheduled_date")
  .gte("scheduled_date", today)
  .not("status", "ilike", "%取消%")
  .order("scheduled_date", { ascending: true })
  .limit(1)
 if (opts?.teacherId) q = applyTeacherScheduleScope(q, opts.teacherId)

 const { data, error } = await q
 if (error) throw error
 if (data && data.length > 0) {
  return String((data[0] as { scheduled_date: string }).scheduled_date)
 }
 return null
}

export type AssignScheduleSubstituteResult = {
 affectedIds: string[]
 conflicts: TeacherScheduleConflict[]
}

async function resolveSubstituteTargetIds(scheduleId: string): Promise<string[]> {
 if (!supabase) return [scheduleId]
 const { data: row, error } = await supabase
  .from("schedules")
  .select("id, consecutive_group_id")
  .eq("id", scheduleId)
  .maybeSingle()
 if (error) throw error
 if (!row) throw new Error("找不到排程")
 const gid = (row as { consecutive_group_id?: string | null }).consecutive_group_id
 if (!gid) return [scheduleId]
 const { data: siblings, error: sibErr } = await supabase
  .from("schedules")
  .select("id, consecutive_slot_index")
  .eq("consecutive_group_id", gid)
  .order("consecutive_slot_index", { ascending: true })
 if (sibErr) throw sibErr
 const ids = (siblings ?? []).map((r) => String((r as { id: string }).id))
 return ids.length > 0 ? ids : [scheduleId]
}

/**
 * 將排程（連堂則整組）指派給代堂老師。
 * teacher_id → 代堂老師；original_teacher_id 保留首次指派前的原任老師。
 * 衝突僅回傳供 UI 警告，不阻擋。
 */
export async function assignScheduleSubstitute(
 scheduleId: string,
 substituteTeacherId: string
): Promise<AssignScheduleSubstituteResult> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (!substituteTeacherId) throw new Error("請選擇代堂老師")

 const targetIds = await resolveSubstituteTargetIds(scheduleId)
 const { data: rows, error: fetchErr } = await supabase
  .from("schedules")
  .select("id, teacher_id, original_teacher_id, scheduled_date, start_time, end_time")
  .in("id", targetIds)
 if (fetchErr) throw fetchErr
 if (!rows || rows.length === 0) throw new Error("找不到排程")

 for (const raw of rows) {
  const r = raw as {
   id: string
   teacher_id: string | null
   original_teacher_id: string | null
  }
  const originalId = r.original_teacher_id ?? r.teacher_id
  if (!originalId) throw new Error("此排程尚未指定老師，無法代堂")
  if (originalId === substituteTeacherId) {
   throw new Error("不可將代堂指派給原任老師；請改用「取消代堂」")
  }
 }

 const conflictsNested = await Promise.all(
  (rows as { id: string; scheduled_date: string; start_time: string | null; end_time: string | null }[]).map(
   (r) =>
    fetchTeacherScheduleConflicts({
     teacherId: substituteTeacherId,
     scheduledDate: String(r.scheduled_date).slice(0, 10),
     startTime: r.start_time,
     endTime: r.end_time,
     excludeScheduleIds: targetIds,
    })
  )
 )
 const conflictMap = new Map<string, TeacherScheduleConflict>()
 for (const list of conflictsNested) {
  for (const c of list) conflictMap.set(c.id, c)
 }
 const conflicts = [...conflictMap.values()].sort((a, b) =>
  (a.startTime ?? "").localeCompare(b.startTime ?? "")
 )

 const now = new Date().toISOString()
 for (const raw of rows) {
  const r = raw as {
   id: string
   teacher_id: string | null
   original_teacher_id: string | null
  }
  const originalId = r.original_teacher_id ?? r.teacher_id
  const { error } = await supabase
   .from("schedules")
   .update({
    teacher_id: substituteTeacherId,
    original_teacher_id: originalId,
    updated_at: now,
   })
   .eq("id", r.id)
  if (error) throw error
 }

 void logMgmtAuditAction({
  action: "指派代堂",
  detail: `schedule_ids=${targetIds.join(",")}; substitute=${substituteTeacherId}`,
 })

 return { affectedIds: targetIds, conflicts }
}

/** 取消代堂：還原 teacher_id 為 original_teacher_id，並清空代堂標記（連堂整組） */
export async function clearScheduleSubstitute(
 scheduleId: string
): Promise<{ affectedIds: string[] }> {
 if (!supabase) throw new Error("Supabase 未設定")

 const targetIds = await resolveSubstituteTargetIds(scheduleId)
 const { data: rows, error: fetchErr } = await supabase
  .from("schedules")
  .select("id, teacher_id, original_teacher_id")
  .in("id", targetIds)
 if (fetchErr) throw fetchErr
 if (!rows || rows.length === 0) throw new Error("找不到排程")

 const now = new Date().toISOString()
 for (const raw of rows) {
  const r = raw as {
   id: string
   teacher_id: string | null
   original_teacher_id: string | null
  }
  if (!r.original_teacher_id) continue
  const { error } = await supabase
   .from("schedules")
   .update({
    teacher_id: r.original_teacher_id,
    original_teacher_id: null,
    updated_at: now,
   })
   .eq("id", r.id)
  if (error) throw error
 }

 void logMgmtAuditAction({
  action: "取消代堂",
  detail: `schedule_ids=${targetIds.join(",")}`,
 })

 return { affectedIds: targetIds }
}

export { localYmd }
