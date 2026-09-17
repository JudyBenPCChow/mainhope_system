import { isUnassignedTeachingTeacherIssue } from "@/lib/privateClassKind"
import {
 aggregateStudentDayLessons,
 type AggregatedStudentDayLesson,
 type StudentDayLessonInput,
 type StudentDayLessonKind,
} from "@/lib/studentDayReminders"
import {
 aggregateTeacherDayLessons,
 type AggregatedTeacherDayLesson,
 type TeacherDayLessonInput,
} from "@/lib/teacherDayReminders"
import { compareTeachersByEnglishName } from "@/lib/teacherDisplaySort"
import { forEachIdChunk, DEFAULT_ID_CHUNK } from "@/lib/supabaseInChunks"
import { trimTimeHm } from "@/lib/consecutiveLesson"
import { pickStudentContactFromDbRow } from "@/lib/whatsappReminder"
import { supabase } from "@/lib/supabaseClient"
import { fetchLeaveStudentIdsForSchedules } from "@/services/attendanceQueries"
import {
 fetchDayViewRosterBySchedules,
 fetchSchedulesInRange,
 type ScheduleManageRow,
} from "@/services/scheduleQueries"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

export type StudentDayReminderRow = {
 studentId: string
 fullName: string
 studentCode: string | null
 contactPhone: string | null
 lessons: AggregatedStudentDayLesson[]
 lessonCount: number
 hasMakeup: boolean
 hasTrial: boolean
 canMessage: boolean
 remindedAt: string | null
 remindedBy: string | null
}

export type LessonReminderLogRow = {
 studentId: string
 reminderDate: string
 remindedAt: string
 remindedBy: string | null
 channel: string
}

export type TeacherDayReminderRow = {
 teacherId: string
 fullName: string
 englishName: string | null
 contactPhone: string | null
 lessons: AggregatedTeacherDayLesson[]
 lessonCount: number
 hasSubstitute: boolean
 hasExtra: boolean
 canMessage: boolean
 remindedAt: string | null
 remindedBy: string | null
}

export type TeacherDayReminderLoad = {
 rows: TeacherDayReminderRow[]
 unassignedCount: number
}

export type TeacherLessonReminderLogRow = {
 teacherId: string
 reminderDate: string
 remindedAt: string
 remindedBy: string | null
 channel: string
}

function isCancelledSchedule(status: string): boolean {
 return status.includes("取消")
}

function formatMakeupNote(params: {
 leaveDate: string | null
 courseCode: string | null
 subject: string | null
 makeupType: string | null
}): string | null {
 const parts: string[] = []
 if (params.leaveDate) {
  const code = params.courseCode?.trim() || params.subject?.trim() || ""
  parts.push(code ? `原請假 ${params.leaveDate} ${code}` : `原請假 ${params.leaveDate}`)
 }
 const mt = params.makeupType?.trim()
 if (mt === "調堂") parts.push("調堂至此")
 else if (mt && mt !== "待安排") parts.push(mt)
 if (parts.length === 0) return "補堂／調堂"
 return parts.join(" · ")
}

async function fetchMakeupLinksByScheduleIds(scheduleIds: string[]): Promise<
 Map<
  string,
  Map<
   string,
   {
    makeupNote: string | null
   }
  >
 >
> {
 const out = new Map<string, Map<string, { makeupNote: string | null }>>()
 for (const id of scheduleIds) out.set(id, new Map())
 if (!supabase || scheduleIds.length === 0) return out

 const chunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("leave_makeup_records")
   .select(
    "makeup_schedule_id, student_id, leave_date, makeup_type, classes ( subject, course_code_full )"
   )
   .in("makeup_schedule_id", slice)
  if (error) throw error
  return data ?? []
 })

 for (const data of chunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const scheduleId = r.makeup_schedule_id != null ? String(r.makeup_schedule_id) : ""
   const studentId = r.student_id != null ? String(r.student_id) : ""
   if (!scheduleId || !studentId || !out.has(scheduleId)) continue
   const cls = r.classes as Record<string, unknown> | null
   const note = formatMakeupNote({
    leaveDate: r.leave_date != null ? String(r.leave_date) : null,
    courseCode: cls?.course_code_full != null ? String(cls.course_code_full) : null,
    subject: cls?.subject != null ? String(cls.subject) : null,
    makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
   })
   out.get(scheduleId)!.set(studentId, { makeupNote: note })
  }
 }
 return out
}

async function fetchTrialStudentIdsByScheduleIds(
 scheduleIds: string[]
): Promise<Map<string, Set<string>>> {
 const out = new Map<string, Set<string>>()
 for (const id of scheduleIds) out.set(id, new Set())
 if (!supabase || scheduleIds.length === 0) return out

 const chunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("trial_sessions")
   .select("schedule_id, student_id, status")
   .in("schedule_id", slice)
  if (error) throw error
  return data ?? []
 })

 for (const data of chunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const scheduleId = r.schedule_id != null ? String(r.schedule_id) : ""
   const studentId = r.student_id != null ? String(r.student_id) : ""
   const status = String(r.status ?? "")
   if (!scheduleId || !studentId || !out.has(scheduleId)) continue
   if (status.includes("完成") || status.includes("取消")) continue
   out.get(scheduleId)!.add(studentId)
  }
 }
 return out
}

async function fetchStudentsContactByIds(studentIds: string[]): Promise<
 Map<
  string,
  {
   fullName: string
   studentCode: string | null
   contactPhone: string | null
  }
 >
> {
 const map = new Map<
  string,
  { fullName: string; studentCode: string | null; contactPhone: string | null }
 >()
 if (!supabase || studentIds.length === 0) return map

 const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("students")
   .select("id, full_name, student_code, whatsapp, student_phone, parent_phone, student_phone_country_code, parent_phone_country_code, primary_contact_person, student_preferred_contact_method, parent_preferred_contact_method, preferred_contact_method, student_wechat_id, parent_wechat_id")
   .in("id", slice)
  if (error) throw error
  return data ?? []
 })

 for (const data of chunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const id = String(r.id)
   map.set(id, {
    fullName: r.full_name != null ? String(r.full_name).trim() || "—" : "—",
    studentCode: r.student_code != null ? String(r.student_code) : null,
    contactPhone: pickStudentContactFromDbRow(r),
   })
  }
 }
 return map
}

export async function fetchLessonReminderLogsForDate(
 reminderDate: string
): Promise<Map<string, LessonReminderLogRow>> {
 const map = new Map<string, LessonReminderLogRow>()
 if (!supabase) return map
 const { data, error } = await supabase
  .from("lesson_reminder_logs")
  .select("student_id, reminder_date, reminded_at, reminded_by, channel")
  .eq("reminder_date", reminderDate)
 if (error) throw error
 for (const row of data ?? []) {
  const r = row as Record<string, unknown>
  const studentId = String(r.student_id)
  map.set(studentId, {
   studentId,
   reminderDate: String(r.reminder_date),
   remindedAt: String(r.reminded_at),
   remindedBy: r.reminded_by != null ? String(r.reminded_by) : null,
   channel: r.channel != null ? String(r.channel) : "whatsapp",
  })
 }
 return map
}

function scheduleToLessonFields(s: ScheduleManageRow): Omit<
 StudentDayLessonInput,
 "scheduleId" | "kind" | "makeupNote"
> {
 return {
  subject: s.subject,
  courseCode: s.course_code_full,
  courseName: s.course_name,
  startTime: trimTimeHm(s.start_time),
  endTime: trimTimeHm(s.end_time),
  classroomName: s.classroom_name,
  teacherName: s.teacher_name,
  consecutiveGroupId: s.consecutive_group_id,
  consecutiveSlotIndex: s.consecutive_slot_index,
 }
}

/**
 * 載入指定上課日「應提醒」學生清單（就讀＋補堂／調堂＋試堂；排除該堂請假；連堂合併）。
 */
export async function fetchStudentDayReminderRows(
 reminderDate: string
): Promise<StudentDayReminderRow[]> {
 if (!supabase) return []

 const schedulesAll = await fetchSchedulesInRange(reminderDate, reminderDate)
 const schedules = schedulesAll.filter((s) => !isCancelledSchedule(s.status))
 if (schedules.length === 0) return []

 const scheduleIds = schedules.map((s) => s.id)

 const [rosterBySchedule, leaveBySchedule, makeupBySchedule, trialBySchedule, logsByStudent] =
  await Promise.all([
   fetchDayViewRosterBySchedules(schedules),
   fetchLeaveStudentIdsForSchedules(schedules),
   fetchMakeupLinksByScheduleIds(scheduleIds),
   fetchTrialStudentIdsByScheduleIds(scheduleIds),
   fetchLessonReminderLogsForDate(reminderDate),
  ])

 const lessonsByStudent = new Map<string, StudentDayLessonInput[]>()
 const nameHintByStudent = new Map<string, string>()

 for (const schedule of schedules) {
  const roster = rosterBySchedule.get(schedule.id) ?? []
  const leaveIds = leaveBySchedule.get(schedule.id) ?? new Set<string>()
  const makeupMap = makeupBySchedule.get(schedule.id) ?? new Map()
  const trialIds = trialBySchedule.get(schedule.id) ?? new Set<string>()
  const base = scheduleToLessonFields(schedule)

  for (const st of roster) {
   if (leaveIds.has(st.studentId)) continue
   nameHintByStudent.set(st.studentId, st.fullName)

   let kind: StudentDayLessonKind = "enrolled"
   let makeupNote: string | null = null
   const makeup = makeupMap.get(st.studentId)
   if (makeup) {
    kind = "makeup"
    makeupNote = makeup.makeupNote
   } else if (trialIds.has(st.studentId)) {
    kind = "trial"
   }

   const list = lessonsByStudent.get(st.studentId) ?? []
   list.push({
    scheduleId: schedule.id,
    ...base,
    kind,
    makeupNote,
   })
   lessonsByStudent.set(st.studentId, list)
  }
 }

 const studentIds = [...lessonsByStudent.keys()]
 const contactById = await fetchStudentsContactByIds(studentIds)

 const rows: StudentDayReminderRow[] = []
 for (const studentId of studentIds) {
  const lessons = aggregateStudentDayLessons(lessonsByStudent.get(studentId) ?? [])
  if (lessons.length === 0) continue
  const contact = contactById.get(studentId)
  const log = logsByStudent.get(studentId)
  const fullName = contact?.fullName ?? nameHintByStudent.get(studentId) ?? "—"
  const contactPhone = contact?.contactPhone ?? null
  rows.push({
   studentId,
   fullName,
   studentCode: contact?.studentCode ?? null,
   contactPhone,
   lessons,
   lessonCount: lessons.length,
   hasMakeup: lessons.some((l) => l.kind === "makeup"),
   hasTrial: lessons.some((l) => l.kind === "trial"),
   canMessage: Boolean(contactPhone?.trim()),
   remindedAt: log?.remindedAt ?? null,
   remindedBy: log?.remindedBy ?? null,
  })
 }

 return rows.sort((a, b) => {
  const tA = a.lessons[0]?.startTime ?? ""
  const tB = b.lessons[0]?.startTime ?? ""
  if (tA !== tB) return tA.localeCompare(tB)
  return a.fullName.localeCompare(b.fullName, "zh-Hant")
 })
}

function scheduleToTeacherLessonFields(s: ScheduleManageRow): TeacherDayLessonInput {
 return {
  scheduleId: s.id,
  subject: s.subject,
  courseCode: s.course_code_full,
  courseName: s.course_name,
  startTime: trimTimeHm(s.start_time),
  endTime: trimTimeHm(s.end_time),
  classroomName: s.classroom_name,
  consecutiveGroupId: s.consecutive_group_id,
  consecutiveSlotIndex: s.consecutive_slot_index,
  isExtraLesson: s.is_extra_lesson,
  originalTeacherName: s.original_teacher_id
   ? s.original_teacher_name?.trim() || "—"
   : null,
 }
}

async function fetchTeacherContactsByIds(teacherIds: string[]): Promise<
 Map<string, { fullName: string; englishName: string | null; contactPhone: string | null }>
> {
 const map = new Map<
  string,
  { fullName: string; englishName: string | null; contactPhone: string | null }
 >()
 if (!supabase || teacherIds.length === 0) return map

 const [nameChunks, phoneChunks] = await Promise.all([
  forEachIdChunk(teacherIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("teachers")
    .select("id, full_name, english_name")
    .in("id", slice)
   if (error) throw error
   return data ?? []
  }),
  forEachIdChunk(teacherIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("teachers_private")
    .select("teacher_id, phone")
    .in("teacher_id", slice)
   if (error) throw error
   return data ?? []
  }),
 ])

 const phoneById = new Map<string, string | null>()
 for (const data of phoneChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const id = r.teacher_id != null ? String(r.teacher_id) : ""
   if (!id) continue
   phoneById.set(id, r.phone != null ? String(r.phone).trim() || null : null)
  }
 }

 for (const data of nameChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const id = String(r.id)
   map.set(id, {
    fullName: r.full_name != null ? String(r.full_name).trim() || "—" : "—",
    englishName: r.english_name != null ? String(r.english_name).trim() || null : null,
    contactPhone: phoneById.get(id) ?? null,
   })
  }
 }
 return map
}

export async function fetchTeacherLessonReminderLogsForDate(
 reminderDate: string
): Promise<Map<string, TeacherLessonReminderLogRow>> {
 const map = new Map<string, TeacherLessonReminderLogRow>()
 if (!supabase) return map
 const { data, error } = await supabase
  .from("teacher_lesson_reminder_logs")
  .select("teacher_id, reminder_date, reminded_at, reminded_by, channel")
  .eq("reminder_date", reminderDate)
 if (error) throw error
 for (const row of data ?? []) {
  const r = row as Record<string, unknown>
  const teacherId = String(r.teacher_id)
  map.set(teacherId, {
   teacherId,
   reminderDate: String(r.reminder_date),
   remindedAt: String(r.reminded_at),
   remindedBy: r.reminded_by != null ? String(r.reminded_by) : null,
   channel: r.channel != null ? String(r.channel) : "whatsapp",
  })
 }
 return map
}

/**
 * 載入指定上課日「應提醒」老師清單（當日實際授課老師；含代堂／加堂；排除取消堂）。
 * 無 teacher_id 的專科／私人排程計入 unassignedCount；功輔未指定任教者不列入、亦不計缺口。
 */
export async function fetchTeacherDayReminderRows(
 reminderDate: string
): Promise<TeacherDayReminderLoad> {
 if (!supabase) return { rows: [], unassignedCount: 0 }

 const schedulesAll = await fetchSchedulesInRange(reminderDate, reminderDate)
 const schedules = schedulesAll.filter((s) => !isCancelledSchedule(s.status))
 if (schedules.length === 0) return { rows: [], unassignedCount: 0 }

 const unassignedCount = schedules.filter((s) => isUnassignedTeachingTeacherIssue(s)).length
 const assigned = schedules.filter((s) => Boolean(s.teacher_id))
 if (assigned.length === 0) return { rows: [], unassignedCount }

 const lessonsByTeacher = new Map<string, TeacherDayLessonInput[]>()
 const nameHintByTeacher = new Map<string, string>()

 for (const schedule of assigned) {
  const teacherId = schedule.teacher_id
  if (!teacherId) continue
  if (schedule.teacher_name?.trim()) {
   nameHintByTeacher.set(teacherId, schedule.teacher_name.trim())
  }
  const list = lessonsByTeacher.get(teacherId) ?? []
  list.push(scheduleToTeacherLessonFields(schedule))
  lessonsByTeacher.set(teacherId, list)
 }

 const teacherIds = [...lessonsByTeacher.keys()]
 const [contactById, logsByTeacher] = await Promise.all([
  fetchTeacherContactsByIds(teacherIds),
  fetchTeacherLessonReminderLogsForDate(reminderDate),
 ])

 const rows: TeacherDayReminderRow[] = []
 for (const teacherId of teacherIds) {
  const lessons = aggregateTeacherDayLessons(lessonsByTeacher.get(teacherId) ?? [])
  if (lessons.length === 0) continue
  const contact = contactById.get(teacherId)
  const log = logsByTeacher.get(teacherId)
  const fullName = contact?.fullName ?? nameHintByTeacher.get(teacherId) ?? "—"
  const contactPhone = contact?.contactPhone ?? null
  rows.push({
   teacherId,
   fullName,
   englishName: contact?.englishName ?? null,
   contactPhone,
   lessons,
   lessonCount: lessons.length,
   hasSubstitute: lessons.some((l) => Boolean(l.originalTeacherName)),
   hasExtra: lessons.some((l) => l.isExtraLesson),
   canMessage: Boolean(contactPhone?.trim()),
   remindedAt: log?.remindedAt ?? null,
   remindedBy: log?.remindedBy ?? null,
  })
 }

 rows.sort((a, b) => {
  const tA = a.lessons[0]?.startTime ?? ""
  const tB = b.lessons[0]?.startTime ?? ""
  if (tA !== tB) return tA.localeCompare(tB)
  return compareTeachersByEnglishName(
   { id: a.teacherId, name: a.fullName, englishName: a.englishName },
   { id: b.teacherId, name: b.fullName, englishName: b.englishName }
  )
 })

 return { rows, unassignedCount }
}

/** 預設提醒日＝本地日曆翌日 */
export function defaultReminderDateYmd(todayYmd = localYmd()): string {
 return addDaysYmd(todayYmd, 1)
}

export async function markStudentDayReminded(params: {
 studentId: string
 reminderDate: string
 channel?: "whatsapp" | "manual"
 detail?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("尚未設定 Supabase")
 const payload = {
  student_id: params.studentId,
  reminder_date: params.reminderDate,
  reminded_at: new Date().toISOString(),
  channel: params.channel ?? "whatsapp",
  detail: params.detail ?? null,
 }
 const { error } = await supabase.from("lesson_reminder_logs").upsert(payload, {
  onConflict: "student_id,reminder_date",
 })
 if (error) throw error
}

export async function unmarkStudentDayReminded(params: {
 studentId: string
 reminderDate: string
}): Promise<void> {
 if (!supabase) throw new Error("尚未設定 Supabase")
 const { error } = await supabase
  .from("lesson_reminder_logs")
  .delete()
  .eq("student_id", params.studentId)
  .eq("reminder_date", params.reminderDate)
 if (error) throw error
}

export async function markTeacherDayReminded(params: {
 teacherId: string
 reminderDate: string
 channel?: "whatsapp" | "manual"
 detail?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("尚未設定 Supabase")
 const payload = {
  teacher_id: params.teacherId,
  reminder_date: params.reminderDate,
  reminded_at: new Date().toISOString(),
  channel: params.channel ?? "whatsapp",
  detail: params.detail ?? null,
 }
 const { error } = await supabase.from("teacher_lesson_reminder_logs").upsert(payload, {
  onConflict: "teacher_id,reminder_date",
 })
 if (error) throw error
}

export async function unmarkTeacherDayReminded(params: {
 teacherId: string
 reminderDate: string
}): Promise<void> {
 if (!supabase) throw new Error("尚未設定 Supabase")
 const { error } = await supabase
  .from("teacher_lesson_reminder_logs")
  .delete()
  .eq("teacher_id", params.teacherId)
  .eq("reminder_date", params.reminderDate)
 if (error) throw error
}
