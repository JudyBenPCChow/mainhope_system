import { formatClassLabel } from "@/lib/courseLabel"
import {
 LESSON_SLOT_DURATION_MIN,
 intervalsOverlapMinutes,
 parseHm,
} from "@/lib/lessonSlots"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

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
 teacher_id: string | null
 teacher_name: string | null
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
  course_name: courseName,
  classLabel: formatClassLabel({ subject: sub, courseCode, courseName }),
  course_code_full: courseCode,
  class_day_of_week: cls?.day_of_week != null ? String(cls.day_of_week) : null,
  class_time_slot: cls?.time_slot != null ? String(cls.time_slot) : null,
  class_lesson_slots_per_session:
   cls?.lesson_slots_per_session != null && Number(cls.lesson_slots_per_session) === 2 ? 2 : 1,
  teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  classroom_id: row.classroom_id != null ? String(row.classroom_id) : null,
  classroom_name: rm?.name != null ? String(rm.name) : null,
  enrollCount: cid ? enrollMap.get(cid) ?? 0 : 0,
 }
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

export async function fetchSchedulesInRange(
 fromYmd: string,
 toYmd: string,
 opts?: { teacherId?: string | null }
): Promise<ScheduleManageRow[]> {
 if (!supabase) return []
 let q = supabase
  .from("schedules")
  .select(
   "id, scheduled_date, start_time, end_time, status, cancel_reason, is_extra_lesson, remarks, session_number, consecutive_group_id, consecutive_slot_index, class_id, teacher_id, classroom_id, classes ( subject, course_code_full, day_of_week, time_slot, lesson_slots_per_session, courses ( course_name ) ), teachers ( full_name ), classrooms ( name )"
  )
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
 if (opts?.teacherId) q = q.eq("teacher_id", opts.teacherId)
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
 schedules: { id: string; class_id: string | null; scheduled_date: string }[]
): Promise<Map<string, ScheduleAlerts>> {
 const map = new Map<string, ScheduleAlerts>()
 for (const s of schedules) {
  map.set(s.id, { trial: false, makeup: false, leave: false, record: false })
 }
 if (!supabase || schedules.length === 0) return map

 const ids = schedules.map((s) => s.id)
 const dates = [...new Set(schedules.map((s) => s.scheduled_date))]
 const classIds = [...new Set(schedules.map((s) => s.class_id).filter((x): x is string => x != null))]

 const [trialsRes, leavesLinkedRes, leavesOrphanRes, remarksRes] = await Promise.all([
  supabase.from("trial_sessions").select("schedule_id").in("schedule_id", ids),
  supabase
   .from("leave_makeup_records")
   .select("schedule_id, makeup_type, status, leave_reason")
   .in("schedule_id", ids),
  classIds.length
   ? supabase
     .from("leave_makeup_records")
     .select("class_id, leave_date, leave_reason, makeup_type, schedule_id, status")
     .in("leave_date", dates)
     .in("class_id", classIds)
   : Promise.resolve({ data: [] as Record<string, unknown>[], error: null as null }),
  supabase.from("schedules").select("id, remarks").in("id", ids),
 ])

 for (const row of trialsRes.data ?? []) {
  const sid = String((row as { schedule_id: string }).schedule_id)
  const a = map.get(sid)
  if (a) a.trial = true
 }

 for (const row of leavesLinkedRes.data ?? []) {
  const sid = String((row as { schedule_id: string }).schedule_id)
  const a = map.get(sid)
  if (!a) continue
  a.leave = true
  const makeupType = String((row as { makeup_type?: string }).makeup_type ?? "")
  const st = String((row as { status?: string }).status ?? "")
  const reason = String((row as { leave_reason?: string }).leave_reason ?? "")
  if (makeupType.includes("補") || st.includes("補") || reason.includes("補堂")) a.makeup = true
 }

 for (const row of leavesOrphanRes.data ?? []) {
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

 for (const row of remarksRes.data ?? []) {
  const r = row as { id: string; remarks: string | null }
  const rem = r.remarks ?? ""
  if (rem.includes("錄影") || rem.includes("錄像") || rem.includes("錄音")) {
   const a = map.get(String(r.id))
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
   if (teacherId) q = q.eq("teacher_id", teacherId)
   return q
  })(),
  (() => {
   let q = supabase
    .from("schedules")
    .select("id", { count: "exact", head: true })
    .gte("scheduled_date", today)
    .ilike("status", "%取消%")
   if (teacherId) q = q.eq("teacher_id", teacherId)
   return q
  })(),
  (() => {
   let q = supabase
    .from("schedules")
    .select("class_id")
    .eq("scheduled_date", today)
    .not("status", "ilike", "%取消%")
   if (teacherId) q = q.eq("teacher_id", teacherId)
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
 const { data, error } = await supabase
  .from("schedules")
  .select("class_id, scheduled_date, status")
  .in("class_id", classIds)
  .order("scheduled_date", { ascending: true })
 if (error) throw error
 for (const row of data ?? []) {
  const r = row as { class_id: string; scheduled_date: string; status: string }
  const cid = String(r.class_id)
  const entry = out.get(cid)
  if (!entry) continue
  if (!r.status.includes("取消")) {
   entry.hasActive = true
   entry.dates.push(String(r.scheduled_date))
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
}): Promise<TeacherScheduleConflict[]> {
 if (!supabase || !params.teacherId) return []
 const dateYmd = params.scheduledDate.slice(0, 10)
 const newStart = parseHm((params.startTime ?? "").slice(0, 5))
 if (newStart == null) return []
 const newEnd = parseHm((params.endTime ?? "").slice(0, 5)) ?? newStart + LESSON_SLOT_DURATION_MIN

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
  if (params.excludeScheduleId && id === params.excludeScheduleId) continue
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
 if (opts?.teacherId) q = q.eq("teacher_id", opts.teacherId)

 const { data, error } = await q
 if (error) throw error
 if (data && data.length > 0) {
  return String((data[0] as { scheduled_date: string }).scheduled_date)
 }
 return null
}

export { localYmd }
