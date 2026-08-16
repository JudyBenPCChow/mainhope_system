import { formatClassLabel } from "@/lib/courseLabel"
import { resolveLessonReminderTimes } from "@/lib/consecutiveLesson"
import { supabase } from "@/lib/supabaseClient"
import { fetchRosterForRollCall } from "@/services/attendanceQueries"
import {
 activeTrialsForSchedules,
 attendanceForSchedule,
 fetchScheduleRosterContext,
 leavesForSchedule,
 makeupsForSchedules,
 singleSessionNotOnSchedule,
 type ScheduleRosterContext,
} from "@/services/scheduleRosterQueries"

export type ScheduleDetailRecord = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 cancel_reason: string | null
 is_extra_lesson: boolean
 remarks: string | null
 /** 老師填寫的教學紀錄 */
 teaching_notes: string | null
 class_id: string | null
 class_subject: string
 course_code_full: string | null
 teacher_id: string | null
 teacher_name: string | null
 original_teacher_id: string | null
 original_teacher_name: string | null
 consecutive_group_id: string | null
 classroom_id: string | null
 classroom_name: string | null
 /** 課室是否標為線上（網課） */
 classroom_is_online: boolean
 /** WhatsApp 提醒用（連堂已合併首末節時間） */
 reminder_start_time: string | null
 reminder_end_time: string | null
 is_consecutive_lesson: boolean
}

export type ScheduleDetailStudent = {
 studentId: string
 fullName: string
 englishName: string | null
 /** 就讀中優先；其餘為當日紀錄中出現的學生 */
 source: "就讀" | "試堂" | "當日紀錄"
 contactPhone: string | null
 /** 班內就讀且為單堂報讀（本堂有選） */
 isSingleSession?: boolean
}

export type ScheduleDetailLeaveRow = {
 id: string
 studentId: string
 studentName: string
 leaveReason: string | null
 makeupType: string | null
 makeupScheduleId: string | null
 status: string
 linkedToThisSchedule: boolean
}

export type ScheduleDetailMakeupHereRow = {
 leaveId: string
 studentId: string
 studentName: string
 leaveDate: string
 makeupType: string | null
 status: string
}

export type ScheduleDetailAttendanceRow = {
 studentId: string
 studentName: string
 status: string
 remarks: string | null
}

export type ScheduleDetailNotEnrolledRow = {
 studentId: string
 fullName: string
}

export type ScheduleDetailContext = {
 students: ScheduleDetailStudent[]
 leaves: ScheduleDetailLeaveRow[]
 makeupsHere: ScheduleDetailMakeupHereRow[]
 attendance: ScheduleDetailAttendanceRow[]
 /** 單堂報讀但本堂未選（提醒用，非請假） */
 notEnrolledSingleSession: ScheduleDetailNotEnrolledRow[]
}

export const EMPTY_SCHEDULE_DETAIL_CONTEXT: ScheduleDetailContext = {
 students: [],
 leaves: [],
 makeupsHere: [],
 attendance: [],
 notEnrolledSingleSession: [],
}

/** 排程詳情頁：學生、請假、來此補堂、當日出勤列 */
export async function fetchScheduleDetailContext(
 scheduleId: string,
 classId: string,
 lessonDate: string,
 providedRosterContext?: ScheduleRosterContext
): Promise<ScheduleDetailContext> {
 const empty: ScheduleDetailContext = {
  students: [],
  leaves: [],
  makeupsHere: [],
  attendance: [],
  notEnrolledSingleSession: [],
 }
 if (!supabase) return empty

 const rosterContext = providedRosterContext ?? await fetchScheduleRosterContext([scheduleId])
 const roster = await fetchRosterForRollCall(
  classId,
  lessonDate,
  scheduleId,
  rosterContext
 )
 const trials = activeTrialsForSchedules(rosterContext, [scheduleId])
 const leaveRows = leavesForSchedule(rosterContext, scheduleId)
 const makeupRows = makeupsForSchedules(rosterContext, [scheduleId])
 const attendanceRows = attendanceForSchedule(rosterContext, scheduleId)
 const notEnrolledSingle = singleSessionNotOnSchedule(rosterContext, scheduleId)

 type Src = ScheduleDetailStudent["source"]
 const rank = (s: Src) => (s === "就讀" ? 0 : s === "試堂" ? 1 : 2)

 const byId = new Map<string, ScheduleDetailStudent>()

 const upsertStudent = (
  studentId: string,
  fullName: string,
  englishName: string | null,
  source: Src,
  contactPhone: string | null = null,
  isSingleSession = false
 ) => {
  const prev = byId.get(studentId)
  if (!prev) {
   byId.set(studentId, {
    studentId,
    fullName,
    englishName,
    source,
    contactPhone,
    isSingleSession,
   })
   return
  }
  const phone = contactPhone || prev.contactPhone || null
  if (rank(source) < rank(prev.source)) {
   byId.set(studentId, {
    studentId,
    fullName,
    englishName,
    source,
    contactPhone: phone,
    isSingleSession: source === "就讀" ? isSingleSession : prev.isSingleSession,
   })
  } else {
   byId.set(studentId, {
    ...prev,
    contactPhone: phone,
    isSingleSession: prev.isSingleSession || isSingleSession,
   })
  }
 }

 for (const r of roster) {
  upsertStudent(
   r.studentId,
   r.fullName,
   r.englishName,
   "就讀",
   r.contactPhone,
   r.isSingleSession
  )
 }
 for (const t of trials) {
  upsertStudent(t.studentId, t.fullName, t.englishName, "試堂", t.contactPhone)
 }

 const leaves = leaveRows.map((row) => {
  const sid = row.studentId
  const name = row.fullName
  const en = row.englishName
  upsertStudent(sid, name, en, "當日紀錄", null)
  return {
   id: row.id,
   studentId: sid,
   studentName: name,
   leaveReason: row.leaveReason,
   makeupType: row.makeupType,
   makeupScheduleId: row.makeupScheduleId,
   status: row.status,
   linkedToThisSchedule: row.scheduleId === scheduleId,
  }
 })

 const makeupsHere = makeupRows.map((row) => {
  const sid = row.studentId
  const name = row.fullName
  const en = row.englishName
  upsertStudent(sid, name, en, "當日紀錄", null)
  return {
   leaveId: row.id,
   studentId: sid,
   studentName: name,
   leaveDate: row.leaveDate,
   makeupType: row.makeupType,
   status: row.status,
  }
 })

 const attendance = attendanceRows.map((row) => {
  const sid = row.studentId
  const name = row.fullName
  const en = row.englishName
  upsertStudent(sid, name, en, "當日紀錄", null)
  return {
   studentId: sid,
   studentName: name,
   status: row.status,
   remarks: row.remarks,
  }
 })

 const students = [...byId.values()].sort((a, b) =>
  a.fullName.localeCompare(b.fullName, "zh-Hant")
 )

 return {
  students,
  leaves,
  makeupsHere,
  attendance,
  notEnrolledSingleSession: notEnrolledSingle.map((r) => ({
   studentId: r.studentId,
   fullName: r.fullName,
  })),
 }
}

export async function getScheduleById(
 id: string,
 providedRosterContext?: ScheduleRosterContext
): Promise<ScheduleDetailRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, scheduled_date, start_time, end_time, status, cancel_reason, is_extra_lesson, remarks, teaching_notes, consecutive_group_id, consecutive_slot_index, class_id, teacher_id, original_teacher_id, classroom_id, classes ( subject, course_code_full, courses ( course_name ) ), teachers!schedules_teacher_id_fkey ( full_name ), original_teacher:teachers!schedules_original_teacher_id_fkey ( full_name ), classrooms ( id, name, is_online )"
  )
  .eq("id", id)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 const r = data as Record<string, unknown>
 const cls = r.classes as Record<string, unknown> | null
 const tch = r.teachers as Record<string, unknown> | null
 const origTch = r.original_teacher as Record<string, unknown> | null
 const crm = r.classrooms as Record<string, unknown> | null
 const cid = r.class_id != null ? String(r.class_id) : null
 const rosterContext = providedRosterContext ?? await fetchScheduleRosterContext([id])
 const rosterSchedule = rosterContext.schedules.find((schedule) => schedule.id === id)
 const sub = rosterSchedule?.subject
  ?? (cls?.subject != null ? String(cls.subject) : "—")
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = rosterSchedule?.courseName
  ?? (course?.course_name != null ? String(course.course_name) : null)
 const code = rosterSchedule?.courseCodeFull
  ?? (cls?.course_code_full != null ? String(cls.course_code_full) : null)
 const consecutiveGroupId =
  r.consecutive_group_id != null ? String(r.consecutive_group_id) : null
 const scheduleTimeRow = {
  start_time: r.start_time != null ? String(r.start_time) : null,
  end_time: r.end_time != null ? String(r.end_time) : null,
  consecutive_group_id: consecutiveGroupId,
  consecutive_slot_index:
   r.consecutive_slot_index != null && !Number.isNaN(Number(r.consecutive_slot_index))
    ? Number(r.consecutive_slot_index)
    : null,
 }
 let reminderPeers: typeof scheduleTimeRow[] = [scheduleTimeRow]
 if (consecutiveGroupId) {
  const { data: siblings, error: sibErr } = await supabase
   .from("schedules")
   .select("start_time, end_time, consecutive_group_id, consecutive_slot_index")
   .eq("consecutive_group_id", consecutiveGroupId)
   .order("consecutive_slot_index", { ascending: true })
  if (sibErr) throw sibErr
  if (siblings && siblings.length > 0) {
   reminderPeers = siblings.map((row) => {
    const s = row as Record<string, unknown>
    return {
     start_time: s.start_time != null ? String(s.start_time) : null,
     end_time: s.end_time != null ? String(s.end_time) : null,
     consecutive_group_id: consecutiveGroupId,
     consecutive_slot_index:
      s.consecutive_slot_index != null && !Number.isNaN(Number(s.consecutive_slot_index))
       ? Number(s.consecutive_slot_index)
       : null,
    }
   })
  }
 }
 const reminderTimes = resolveLessonReminderTimes(scheduleTimeRow, reminderPeers)
 return {
  id: String(r.id),
  scheduled_date: String(r.scheduled_date ?? ""),
  start_time: scheduleTimeRow.start_time,
  end_time: scheduleTimeRow.end_time,
  status: String(r.status ?? ""),
  cancel_reason: r.cancel_reason != null ? String(r.cancel_reason) : null,
  is_extra_lesson: r.is_extra_lesson === true,
  remarks: r.remarks != null ? String(r.remarks) : null,
  teaching_notes: r.teaching_notes != null ? String(r.teaching_notes) : null,
  class_id: cid,
  class_subject: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  course_code_full: code,
  teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  original_teacher_id:
   r.original_teacher_id != null ? String(r.original_teacher_id) : null,
  original_teacher_name:
   origTch?.full_name != null ? String(origTch.full_name) : null,
  consecutive_group_id: consecutiveGroupId,
  classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
  classroom_name: crm?.name != null ? String(crm.name) : null,
  classroom_is_online: Boolean(crm?.is_online),
  reminder_start_time: reminderTimes.startTime,
  reminder_end_time: reminderTimes.endTime,
  is_consecutive_lesson: reminderTimes.isConsecutive,
 }
}
