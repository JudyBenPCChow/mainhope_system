import { formatClassLabel } from "@/lib/courseLabel"
import {
 LESSON_SLOT_DURATION_MIN,
 intervalsOverlapMinutes,
 parseHm,
} from "@/lib/lessonSlots"
import { resolveClassKind, type ClassKind } from "@/lib/privateClassKind"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import {
 isCampusHolidayCancelReason,
 scheduleAlertsFromSummary,
 summarizeScheduleManageRows,
 type ScheduleManageRowSummary,
} from "@/lib/scheduleManageRowSummary"
import { isYmd } from "@/lib/weekdayUtils"
import {
 assembleScheduleStatsSnapshot,
 type ScheduleStatsLoad,
 type ScheduleStatsSnapshot,
} from "@/lib/scheduleStatsSnapshot"
import { supabase } from "@/lib/supabaseClient"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { recordInboxEvent } from "@/services/inboxEventWrite"
import { applySoftCancelScheduleSideEffects } from "@/services/scheduleLifecycleQueries"
import type { SoftCancelScheduleOptions } from "@/services/scheduleLifecycleQueries"
import {
 activeTrialsForSchedules,
 fetchScheduleRosterContext,
 leavesForSchedule,
 makeupsForSchedules,
 rosterHeadcountForSchedule,
 rosterStudentsForSchedule,
 type ScheduleRosterContext,
} from "@/services/scheduleRosterQueries"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

/** 排程列表／點名共用 select（含代堂原老師） */
const SCHEDULE_MANAGE_SELECT =
 "id, scheduled_date, start_time, end_time, status, cancel_reason, is_extra_lesson, roster_policy, roster_confirmed_at, remarks, teaching_notes, session_number, consecutive_group_id, consecutive_slot_index, class_id, teacher_id, original_teacher_id, classroom_id, classes ( subject, class_kind, course_code_full, day_of_week, time_slot, lesson_slots_per_session, courses ( course_name ) ), teachers!schedules_teacher_id_fkey ( full_name ), original_teacher:teachers!schedules_original_teacher_id_fkey ( full_name ), classrooms ( name )"

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
 /** 就讀生點名紙政策；缺值視為 class_all */
 roster_policy: "class_all" | "selected"
 roster_confirmed_at: string | null
 remarks: string | null
 /** 老師填寫的教學紀錄（與營運備註分開） */
 teaching_notes: string | null
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
 /** null＝點名冊人數尚未載入（勿當成 0） */
 enrollCount: number | null
}

export type ScheduleAlerts = {
 trial: boolean
 makeup: boolean
 leave: boolean
 record: boolean
}

function mapScheduleRow(
 row: Record<string, unknown>,
 enrollMap?: Map<string, number> | null
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
  roster_policy: row.roster_policy === "selected" ? "selected" : "class_all",
  roster_confirmed_at:
   row.roster_confirmed_at != null ? String(row.roster_confirmed_at) : null,
  remarks: row.remarks != null ? String(row.remarks) : null,
  teaching_notes: row.teaching_notes != null ? String(row.teaching_notes) : null,
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
  enrollCount: enrollMap == null ? null : cid ? (enrollMap.get(cid) ?? 0) : 0,
 }
}

/** 用 roster 補各堂點名冊人數（及 roster 內較完整的班別 meta） */
export function enrichScheduleRowsWithRosterContext(
 rows: ScheduleManageRow[],
 rosterContext: ScheduleRosterContext
): ScheduleManageRow[] {
 const scheduleContextById = new Map(rosterContext.schedules.map((row) => [row.id, row]))
 return rows.map((mapped) => {
  const context = scheduleContextById.get(mapped.id)
  const enrollCount = rosterHeadcountForSchedule(rosterContext, mapped.id)
  if (!context?.classId) return { ...mapped, enrollCount }
  const subject = context.subject ?? mapped.subject
  return {
   ...mapped,
   enrollCount,
   subject,
   class_kind: resolveClassKind(context.classKind, subject),
   course_name: context.courseName ?? mapped.course_name,
   classLabel: formatClassLabel({
    subject,
    courseCode: context.courseCodeFull ?? mapped.course_code_full,
    courseName: context.courseName ?? mapped.course_name,
   }),
   course_code_full: context.courseCodeFull ?? mapped.course_code_full,
   class_day_of_week: context.dayOfWeek ?? mapped.class_day_of_week,
   class_time_slot: context.timeSlot ?? mapped.class_time_slot,
   class_lesson_slots_per_session:
    context.lessonSlotsPerSession ?? mapped.class_lesson_slots_per_session,
  }
 })
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

/**
 * 日視圖專用：各排程「上堂名單」＝點名冊（當堂可見報讀＋試堂生＋補堂生）。
 * 與點名紙／班別詳情排程名單同源（scheduleRosterQueries）。
 * 回傳 Map 以 schedule id 為鍵。
 */
export async function fetchDayViewRosterBySchedules(
 schedules: { id: string; class_id: string | null; scheduled_date: string }[],
 rosterContext?: ScheduleRosterContext
): Promise<Map<string, DayViewRosterStudent[]>> {
 const m = new Map<string, DayViewRosterStudent[]>()
 for (const s of schedules) m.set(s.id, [])
 if (!supabase || schedules.length === 0) return m

 const scheduleIds = schedules.map((s) => s.id)
 const context = rosterContext ?? await fetchScheduleRosterContext(scheduleIds)
 for (const s of schedules) {
  m.set(s.id, rosterStudentsForSchedule(context, s.id))
 }

 return m
}

/** 只撈排程列（不含 roster／報讀人數）。班名等來自 schedules↔classes join。 */
export async function fetchSchedulesInRange(
 fromYmd: string,
 toYmd: string,
 opts?: { teacherId?: string | null }
): Promise<ScheduleManageRow[]> {
 if (!supabase) return []
 if (!isYmd(fromYmd) || !isYmd(toYmd)) {
  throw new Error("請選擇有效日期")
 }
 let q = supabase
  .from("schedules")
  .select(SCHEDULE_MANAGE_SELECT)
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
 if (opts?.teacherId) q = applyTeacherScheduleScope(q, opts.teacherId)
 const { data, error } = await q.order("scheduled_date", { ascending: true }).order("start_time", { ascending: true })
 if (error) throw error
 return ((data ?? []) as Record<string, unknown>[]).map((r) => mapScheduleRow(r, null))
}

export async function fetchFutureCancelledSchedules(opts: {
 asOf: string
 teacherId?: string | null
}): Promise<ScheduleManageRow[]> {
 if (!supabase) return []
 if (!isYmd(opts.asOf)) throw new Error("請選擇有效日期")
 let q = supabase
  .from("schedules")
  .select(SCHEDULE_MANAGE_SELECT)
  .gte("scheduled_date", opts.asOf)
  .ilike("status", "%取消%")
 if (opts.teacherId) q = applyTeacherScheduleScope(q, opts.teacherId)
 const { data, error } = await q
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw error
 return ((data ?? []) as Record<string, unknown>[])
  .map((r) => mapScheduleRow(r, null))
  .filter((row) => !isCampusHolidayCancelReason(row.cancel_reason))
}

export async function fetchScheduleManageRowSummaries(
 schedules: { id: string; consecutive_group_id?: string | null }[]
): Promise<Map<string, ScheduleManageRowSummary>> {
 const ids = schedules.map((row) => row.id).filter(Boolean)
 if (ids.length === 0) return new Map()
 const context = await fetchScheduleRosterContext(ids)
 return summarizeScheduleManageRows(
  context,
  ids,
  schedules.map((row) => ({ id: row.id, consecutiveGroupId: row.consecutive_group_id ?? null }))
 )
}

export function applyScheduleRowSummaries(
 rows: ScheduleManageRow[],
 summaries: Map<string, ScheduleManageRowSummary>
): { rows: ScheduleManageRow[]; alerts: Map<string, ScheduleAlerts> } {
 const alerts = new Map<string, ScheduleAlerts>()
 const next = rows.map((row) => {
  const summary = summaries.get(row.id)
  alerts.set(row.id, scheduleAlertsFromSummary(summary, row.remarks))
  return summary ? { ...row, enrollCount: summary.rosterCount } : row
 })
 return { rows: next, alerts }
}

/** 排程列 + 全區間 roster（點名資格／badge／人數）。列表首屏請先用 fetchSchedulesInRange。 */
export async function fetchSchedulesInRangeWithRosterContext(
 fromYmd: string,
 toYmd: string,
 opts?: { teacherId?: string | null }
): Promise<{ rows: ScheduleManageRow[]; rosterContext: ScheduleRosterContext }> {
 const rows = await fetchSchedulesInRange(fromYmd, toYmd, opts)
 const rosterContext = await fetchScheduleRosterContext(rows.map((row) => row.id))
 return {
  rows: enrichScheduleRowsWithRosterContext(rows, rosterContext),
  rosterContext,
 }
}

export async function fetchScheduleAlerts(
 schedules: {
  id: string
  class_id: string | null
  scheduled_date: string
  remarks?: string | null
 }[],
 rosterContext?: ScheduleRosterContext
): Promise<Map<string, ScheduleAlerts>> {
 const map = new Map<string, ScheduleAlerts>()
 for (const s of schedules) {
  map.set(s.id, { trial: false, makeup: false, leave: false, record: false })
 }
 if (!supabase || schedules.length === 0) return map

 const ids = schedules.map((s) => s.id)
 const context = rosterContext ?? await fetchScheduleRosterContext(ids)
 for (const s of schedules) {
  const alert = map.get(s.id)
  if (!alert) continue
  alert.trial = activeTrialsForSchedules(context, [s.id]).length > 0
  alert.makeup = makeupsForSchedules(context, [s.id]).length > 0
  const leaves = leavesForSchedule(context, s.id)
  if (leaves.length > 0) alert.leave = true
  if (leaves.some((row) => {
   const reason = row.leaveReason ?? ""
   const makeupType = row.makeupType ?? ""
   return makeupType.includes("補") || row.status.includes("補") || reason.includes("補")
  })) {
   alert.makeup = true
  }
  const rem = s.remarks ?? ""
  if (rem.includes("錄影") || rem.includes("錄像") || rem.includes("錄音")) {
   alert.record = true
  }
 }

 return map
}

export type { ScheduleStatsSnapshot, ScheduleStatsLoad }

/** 儀表板數字：以「今天」為準，與目前列表日期區間無關；專班老師可傳 teacherId 僅計自己的排程 */
export async function fetchScheduleStatsSnapshot(teacherId?: string | null): Promise<ScheduleStatsLoad> {
 if (!supabase) {
  return assembleScheduleStatsSnapshot({
   todayLessonsError: new Error("尚未設定 Supabase"),
   todayLessonsCount: null,
   pendingCancelError: null,
   pendingCancelCount: null,
   todaySchedError: null,
   todayStudentHeadcount: 0,
  })
 }

 const today = localYmd()

 const [statsRes, todaySchedRows] = await Promise.all([
  supabase.rpc("get_schedule_manage_stats", {
   p_as_of: today,
   p_teacher_id: teacherId ?? null,
  }),
  (() => {
   let q = supabase
    .from("schedules")
    .select("id")
    .eq("scheduled_date", today)
    .not("status", "ilike", "%取消%")
   if (teacherId) q = applyTeacherScheduleScope(q, teacherId)
   return q
  })(),
 ])

 const statsRow = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data
 const todayLessonCount =
  statsRow != null ? Number((statsRow as { today_lesson_count?: number }).today_lesson_count ?? 0) : null
 const pendingCancelledCount =
  statsRow != null
   ? Number((statsRow as { pending_cancelled_count?: number }).pending_cancelled_count ?? 0)
   : null
 const statsError =
  statsRes.error ?? (statsRow == null && !statsRes.error ? new Error("排程統計沒有回傳列") : null)

 if (statsError || todaySchedRows.error) {
  return assembleScheduleStatsSnapshot({
   todayLessonsError: statsError,
   todayLessonsCount: todayLessonCount,
   pendingCancelError: statsError,
   pendingCancelCount: pendingCancelledCount,
   todaySchedError: todaySchedRows.error,
   todayStudentHeadcount: 0,
  })
 }

 const scheduleIds = (todaySchedRows.data ?? [])
  .map((r) => String((r as { id: string }).id))
  .filter(Boolean)
 let todayStudentHeadcount = 0
 let headcountError: unknown = null
 if (scheduleIds.length > 0) {
  try {
   const rosterContext = await fetchScheduleRosterContext(scheduleIds)
   for (const scheduleId of scheduleIds) {
    todayStudentHeadcount += rosterHeadcountForSchedule(rosterContext, scheduleId)
   }
  } catch (e) {
   headcountError = e
  }
 }

 return assembleScheduleStatsSnapshot({
  todayLessonsError: null,
  todayLessonsCount: todayLessonCount ?? 0,
  pendingCancelError: null,
  pendingCancelCount: pendingCancelledCount ?? 0,
  todaySchedError: null,
  headcountError,
  todayStudentHeadcount,
 })
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
 const { data, error } = await supabase.rpc("get_class_schedule_summaries", {
  p_class_ids: classIds,
 })
 if (error) throw error
 for (const row of (data ?? []) as {
  class_id: string
  has_active: boolean | null
  first_date: string | null
  last_date: string | null
 }[]) {
  const cid = String(row.class_id ?? "")
  if (!cid) continue
  const first = row.first_date != null ? String(row.first_date).slice(0, 10) : ""
  const last = row.last_date != null ? String(row.last_date).slice(0, 10) : ""
  const dates: string[] = []
  if (first) dates.push(first)
  if (last && last !== first) dates.push(last)
  out.set(cid, {
   classId: cid,
   dates,
   hasActive: Boolean(row.has_active),
  })
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

export async function cancelAllSchedulesForClass(
 classId: string,
 options?: SoftCancelScheduleOptions
): Promise<number> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error: fetchErr } = await supabase
  .from("schedules")
  .select("id, status, teacher_id, original_teacher_id")
  .eq("class_id", classId)
 if (fetchErr) throw fetchErr
 const active = (data ?? []).filter((r) => !(r as { status: string }).status.includes("取消"))
 if (active.length === 0) return 0
 const ids = active.map((r) => String((r as { id: string }).id))
 // O3：整批一次閘門／清調堂／試堂
 await applySoftCancelScheduleSideEffects(ids, {
  cancelOpenTrials: true,
  attendanceAction: "keep",
  ...options,
 })
 const now = new Date().toISOString()
 const audience: Array<string | null | undefined> = []
 for (const row of active) {
  const r = row as {
   id: string
   teacher_id?: string | null
   original_teacher_id?: string | null
  }
  audience.push(r.teacher_id, r.original_teacher_id)
  const { error } = await supabase
   .from("schedules")
   .update({ status: "取消", updated_at: now })
   .eq("id", r.id)
  if (error) throw error
 }
 const { data: cls } = await supabase.from("classes").select("teacher_id").eq("id", classId).maybeSingle()
 audience.push((cls as { teacher_id?: string | null } | null)?.teacher_id)
 void recordInboxEvent({
  eventType: "schedule_cancelled",
  title: `班別排程已整批取消（${active.length} 堂）`,
  body: "該班未取消之排程已全部標為取消；掛住調堂已改回待安排",
  actionPath: `/Classes/${classId}`,
  classId,
  audienceTeacherIds: audience,
  payload: { cancelledCount: active.length, bulk: true },
 })
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
  .select("id, teacher_id, original_teacher_id, scheduled_date, start_time, end_time, class_id")
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

 {
  const primary = rows[0] as {
   id: string
   teacher_id: string | null
   original_teacher_id: string | null
   class_id?: string | null
   scheduled_date?: string
  }
  const originalId = primary.original_teacher_id ?? primary.teacher_id
  void recordInboxEvent({
   eventType: "schedule_substitute",
   title: `已指派代堂（${String(primary.scheduled_date ?? "").slice(0, 10) || "排程"}）`,
   body:
    targetIds.length > 1
     ? `連堂共 ${targetIds.length} 節；原任／代堂老師請留意當日安排`
     : "原任／代堂老師請留意當日安排",
   actionPath: `/Schedule/${scheduleId}`,
   classId: primary.class_id ?? null,
   scheduleId,
   audienceTeacherIds: [originalId, substituteTeacherId],
   payload: { substituteTeacherId, originalTeacherId: originalId, affectedIds: targetIds },
  })
 }

 return { affectedIds: targetIds, conflicts }
}

const CLEAR_SUBSTITUTE_BLOCKED_MSG =
 "此堂（或連堂組）已有點名紀錄，不可取消代堂。請改用「更改代堂」修正實際授課老師。"

async function schedulesHaveAttendanceRows(scheduleIds: string[]): Promise<boolean> {
 if (!supabase || scheduleIds.length === 0) return false
 const flags = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("attendance_details")
   .select("id")
   .in("schedule_id", slice)
   .limit(1)
  if (error) throw error
  return (data ?? []).length > 0
 })
 return flags.some(Boolean)
}

/** 已點名（含連堂組任一節）則不可取消代堂；供 UI 預先禁用按鈕 */
export async function isClearScheduleSubstituteBlocked(scheduleId: string): Promise<boolean> {
 if (!supabase) return false
 const targetIds = await resolveSubstituteTargetIds(scheduleId)
 return schedulesHaveAttendanceRows(targetIds)
}

/** 取消代堂：還原 teacher_id 為 original_teacher_id，並清空代堂標記（連堂整組） */
export async function clearScheduleSubstitute(
 scheduleId: string
): Promise<{ affectedIds: string[] }> {
 if (!supabase) throw new Error("Supabase 未設定")

 const targetIds = await resolveSubstituteTargetIds(scheduleId)
 if (await schedulesHaveAttendanceRows(targetIds)) {
  throw new Error(CLEAR_SUBSTITUTE_BLOCKED_MSG)
 }

 const { data: rows, error: fetchErr } = await supabase
  .from("schedules")
  .select("id, teacher_id, original_teacher_id, class_id, scheduled_date")
  .in("id", targetIds)
 if (fetchErr) throw fetchErr
 if (!rows || rows.length === 0) throw new Error("找不到排程")

 const primary = rows[0] as {
  id: string
  teacher_id: string | null
  original_teacher_id: string | null
  class_id?: string | null
  scheduled_date?: string
 }
 const substituteBefore = primary.teacher_id
 const originalId = primary.original_teacher_id

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

 if (originalId) {
  void recordInboxEvent({
   eventType: "schedule_substitute",
   title: `已取消代堂（${String(primary.scheduled_date ?? "").slice(0, 10) || "排程"}）`,
   body:
    targetIds.length > 1
     ? `連堂共 ${targetIds.length} 節；已還原為原任老師`
     : "已還原為原任老師",
   actionPath: `/Schedule/${scheduleId}`,
   classId: primary.class_id ?? null,
   scheduleId,
   audienceTeacherIds: [originalId, substituteBefore],
   payload: {
    cleared: true,
    originalTeacherId: originalId,
    formerSubstituteTeacherId: substituteBefore,
    affectedIds: targetIds,
   },
  })
 }

 return { affectedIds: targetIds }
}

export { localYmd }
