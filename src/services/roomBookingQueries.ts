import { formatUnknownError } from "@/lib/formatUnknownError"
import { supabase } from "@/lib/supabaseClient"
import { classroomsActiveOnDate, UNASSIGNED_ROOM_ID } from "@/lib/classroomEligibility"
import {
 intervalsOverlapMinutes,
 lessonSlotEndMinute,
 lessonSlotStartMinute,
 parseHm,
 LESSON_FIRST_START_MIN,
 LESSON_SLOT_DURATION_MIN,
} from "@/lib/lessonSlots"
import { insertScheduleRow } from "@/services/classQueries"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import { formatClassLabel } from "@/lib/courseLabel"

export type RoomOccupant = {
 kind: "schedule" | "pending"
 id: string
 label: string
 teacherName: string | null
 statusNote: string | null
}

export type RoomBookingRequestAdminRow = {
 id: string
 requesting_teacher_id: string
 teacher_name: string | null
 classroom_id: string
 classroom_name: string
 scheduled_date: string
 start_time: string
 end_time: string
 target_class_id: string | null
 target_class_label: string | null
 is_other: boolean
 reason: string | null
 status: string
 created_at: string
}

function intervalForYmdTime(
 ymd: string,
 scheduledDate: string,
 start: string | null,
 end: string | null
): { a: number; b: number } | null {
 if (scheduledDate !== ymd) return null
 const a = parseHm(start)
 const b = parseHm(end)
 if (a == null || b == null) return null
 if (b <= a) return { a, b: a + LESSON_SLOT_DURATION_MIN }
 return { a, b }
}

export function occupiersForSlot(
 ymd: string,
 roomId: string,
 slotStart: number,
 slotEnd: number,
 schedules: Array<{
  id: string
  classroom_id: string | null
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
  subject: string
  course_code_full: string | null
 course_name?: string | null
  teacher_name: string | null
 }>,
 pending: Array<{
  id: string
  classroom_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  teacher_name: string | null
  is_other: boolean
  target_label: string | null
 }>
): RoomOccupant[] {
 const out: RoomOccupant[] = []
 for (const s of schedules) {
  if (roomId === UNASSIGNED_ROOM_ID) {
   if (s.classroom_id != null && s.classroom_id !== "") continue
  } else if ((s.classroom_id ?? "") !== roomId) {
   continue
  }
  if (s.status.includes("取消")) continue
  const iv = intervalForYmdTime(ymd, s.scheduled_date, s.start_time, s.end_time)
  if (!iv) continue
  if (!intervalsOverlapMinutes(iv.a, iv.b, slotStart, slotEnd)) continue
  const sub = s.subject
  const code = s.course_code_full
  const courseName = s.course_name ?? null
  out.push({
   kind: "schedule",
   id: s.id,
   label: formatClassLabel({ subject: sub, courseCode: code, courseName }),
   teacherName: s.teacher_name,
   statusNote: s.status,
  })
 }
 for (const p of pending) {
  if (p.classroom_id !== roomId) continue
  const iv = intervalForYmdTime(ymd, p.scheduled_date, p.start_time, p.end_time)
  if (!iv) continue
  if (!intervalsOverlapMinutes(iv.a, iv.b, slotStart, slotEnd)) continue
  const tail = p.is_other ? "（其他）" : p.target_label ? `（${p.target_label}）` : ""
  out.push({
   kind: "pending",
   id: p.id,
   label: `待審約房${tail}`,
   teacherName: p.teacher_name,
   statusNote: "待審批",
  })
 }
 return out
}

export async function fetchSchedulesForRoomCalendar(
 roomIds: string[],
 fromYmd: string,
 toYmd: string
): Promise<
 Array<{
  id: string
  classroom_id: string | null
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
  subject: string
  course_code_full: string | null
 course_name?: string | null
  teacher_name: string | null
 }>
> {
 if (!supabase || roomIds.length === 0) return []
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, classroom_id, scheduled_date, start_time, end_time, status, class_id, classes ( subject, course_code_full, courses ( course_name ) ), teachers ( full_name )"
  )
  .in("classroom_id", roomIds)
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw new Error(formatUnknownError(error))
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const tch = r.teachers as Record<string, unknown> | null
  return {
   id: String(r.id),
   classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
   scheduled_date: String(r.scheduled_date ?? ""),
   start_time: r.start_time != null ? String(r.start_time) : null,
   end_time: r.end_time != null ? String(r.end_time) : null,
   status: String(r.status ?? ""),
   subject: cls?.subject != null ? String(cls.subject) : "（無班別）",
   course_code_full: cls?.course_code_full != null ? String(cls.course_code_full) : null,
   course_name:
    (cls?.courses as Record<string, unknown> | null)?.course_name != null
     ? String((cls?.courses as Record<string, unknown>).course_name)
     : null,
   teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  }
 })
}

export async function fetchSchedulesWithoutClassroom(
 fromYmd: string,
 toYmd: string
): Promise<
 Array<{
  id: string
  classroom_id: string | null
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
  subject: string
  course_code_full: string | null
  course_name?: string | null
  teacher_name: string | null
 }>
> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, classroom_id, scheduled_date, start_time, end_time, status, class_id, classes ( subject, course_code_full, courses ( course_name ) ), teachers ( full_name )"
  )
  .is("classroom_id", null)
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw new Error(formatUnknownError(error))
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const tch = r.teachers as Record<string, unknown> | null
  return {
   id: String(r.id),
   classroom_id: null,
   scheduled_date: String(r.scheduled_date ?? ""),
   start_time: r.start_time != null ? String(r.start_time) : null,
   end_time: r.end_time != null ? String(r.end_time) : null,
   status: String(r.status ?? ""),
   subject: cls?.subject != null ? String(cls.subject) : "（無班別）",
   course_code_full: cls?.course_code_full != null ? String(cls.course_code_full) : null,
   course_name:
    (cls?.courses as Record<string, unknown> | null)?.course_name != null
     ? String((cls?.courses as Record<string, unknown>).course_name)
     : null,
   teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  }
 })
}

export async function fetchPendingBookingRequestsDetailed(
 fromYmd: string,
 toYmd: string
): Promise<
 Array<{
  id: string
  classroom_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  is_other: boolean
  teacher_name: string | null
  target_label: string | null
 }>
> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("classroom_booking_requests")
  .select(
   "id, classroom_id, scheduled_date, start_time, end_time, is_other, teachers ( full_name ), classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .eq("status", "待審批")
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
 if (error) throw new Error(formatUnknownError(error))
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const tch = r.teachers as Record<string, unknown> | null
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : ""
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const targetLabel = sub ? formatClassLabel({ subject: sub, courseCode: code, courseName }) : null
  return {
   id: String(r.id),
   classroom_id: String(r.classroom_id ?? ""),
   scheduled_date: String(r.scheduled_date ?? ""),
   start_time: String(r.start_time ?? ""),
   end_time: String(r.end_time ?? ""),
   is_other: Boolean(r.is_other),
   teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
   target_label: targetLabel,
  }
 })
}

export type RoomCalendarScheduleRow = Awaited<ReturnType<typeof fetchSchedulesForRoomCalendar>>[number]
export type RoomCalendarPendingRow = Awaited<ReturnType<typeof fetchPendingBookingRequestsDetailed>>[number]

export async function fetchRoomCalendarBundle(fromYmd: string, toYmd: string): Promise<{
 rooms: RoomRecord[]
 schedules: RoomCalendarScheduleRow[]
 pending: RoomCalendarPendingRow[]
}> {
 const rooms = (await fetchClassrooms()).filter((r) => !r.is_online)
 const ids = rooms.map((r) => r.id)
 const [assigned, unassigned, pending] = await Promise.all([
  fetchSchedulesForRoomCalendar(ids, fromYmd, toYmd),
  fetchSchedulesWithoutClassroom(fromYmd, toYmd),
  fetchPendingBookingRequestsDetailed(fromYmd, toYmd),
 ])
 return { rooms, schedules: [...assigned, ...unassigned], pending }
}

export function freeRoomNamesForSlot(params: {
 ymd: string
 slotIndex: number
 rooms: RoomRecord[]
 schedules: RoomCalendarScheduleRow[]
 pending: RoomCalendarPendingRow[]
}): string[] {
 const { ymd, slotIndex, rooms, schedules, pending } = params
 const slotStart = lessonSlotStartMinute(slotIndex)
 const slotEnd = lessonSlotEndMinute(slotIndex)
 return classroomsActiveOnDate(rooms, ymd)
  .filter(
   (room) =>
    occupiersForSlot(ymd, room.id, slotStart, slotEnd, schedules, pending).length === 0
  )
  .map((r) => r.name)
}

export type GridSlotScheduleItem = {
 id: string
 kind: "schedule" | "pending"
 label: string
 teacherName: string | null
 roomName: string | null
}

function roomNameById(rooms: RoomRecord[], id: string | null): string | null {
 if (!id) return null
 return rooms.find((r) => r.id === id)?.name ?? null
}

export function slotScheduleItemsForCell(params: {
 ymd: string
 slotIndex: number
 rooms: RoomRecord[]
 schedules: RoomCalendarScheduleRow[]
 pending: RoomCalendarPendingRow[]
}): GridSlotScheduleItem[] {
 const { ymd, slotIndex, rooms, schedules, pending } = params
 const slotStart = lessonSlotStartMinute(slotIndex)
 const slotEnd = lessonSlotEndMinute(slotIndex)
 const out: GridSlotScheduleItem[] = []
 const seen = new Set<string>()

 for (const s of schedules) {
  if (s.status.includes("取消")) continue
  const iv = intervalForYmdTime(ymd, s.scheduled_date, s.start_time, s.end_time)
  if (!iv) continue
  if (!intervalsOverlapMinutes(iv.a, iv.b, slotStart, slotEnd)) continue
  if (seen.has(s.id)) continue
  seen.add(s.id)
  out.push({
   id: s.id,
   kind: "schedule",
   label: formatClassLabel({
    subject: s.subject,
    courseCode: s.course_code_full,
    courseName: s.course_name,
   }),
   teacherName: s.teacher_name,
   roomName: roomNameById(rooms, s.classroom_id),
  })
 }

 for (const p of pending) {
  const iv = intervalForYmdTime(ymd, p.scheduled_date, p.start_time, p.end_time)
  if (!iv) continue
  if (!intervalsOverlapMinutes(iv.a, iv.b, slotStart, slotEnd)) continue
  const tail = p.is_other ? "（其他）" : p.target_label ? `（${p.target_label}）` : ""
  out.push({
   id: p.id,
   kind: "pending",
   label: `待審約房${tail}`,
   teacherName: p.teacher_name,
   roomName: roomNameById(rooms, p.classroom_id),
  })
 }

 return out
}

export async function createRoomBookingRequest(params: {
 teacherId: string
 classroomId: string
 scheduledDate: string
 startTime: string
 endTime: string
 targetClassId: string | null
 isOther: boolean
 reason: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("classroom_booking_requests").insert({
  requesting_teacher_id: params.teacherId,
  classroom_id: params.classroomId,
  scheduled_date: params.scheduledDate,
  start_time: params.startTime,
  end_time: params.endTime,
  target_class_id: params.targetClassId,
  is_other: params.isOther,
  reason: params.reason,
  status: "待審批",
 })
 if (error) throw new Error(formatUnknownError(error))
}

export async function fetchAllPendingRoomBookingRequests(): Promise<RoomBookingRequestAdminRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("classroom_booking_requests")
  .select(
   "id, requesting_teacher_id, classroom_id, scheduled_date, start_time, end_time, target_class_id, is_other, reason, status, created_at, teachers ( full_name ), classrooms ( name ), classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .eq("status", "待審批")
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw new Error(formatUnknownError(error))
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const tch = r.teachers as Record<string, unknown> | null
  const crm = r.classrooms as Record<string, unknown> | null
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : ""
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const targetLabel = sub ? formatClassLabel({ subject: sub, courseCode: code, courseName }) : null
  const tid = r.target_class_id != null ? String(r.target_class_id) : null
  return {
   id: String(r.id),
   requesting_teacher_id: String(r.requesting_teacher_id ?? ""),
   teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
   classroom_id: String(r.classroom_id ?? ""),
   classroom_name: crm?.name != null ? String(crm.name) : "—",
   scheduled_date: String(r.scheduled_date ?? ""),
   start_time: String(r.start_time ?? ""),
   end_time: String(r.end_time ?? ""),
   target_class_id: tid,
   target_class_label: targetLabel,
   is_other: Boolean(r.is_other),
   reason: r.reason != null ? String(r.reason) : null,
   status: String(r.status ?? ""),
   created_at: String(r.created_at ?? ""),
  }
 })
}

export async function approveRoomBookingRequest(requestId: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: req, error: fetchErr } = await supabase
  .from("classroom_booking_requests")
  .select("*, teachers ( full_name )")
  .eq("id", requestId)
  .maybeSingle()
 if (fetchErr) throw new Error(formatUnknownError(fetchErr))
 if (!req) throw new Error("找不到申請")
 const r = req as Record<string, unknown>
 if (String(r.status ?? "") !== "待審批") throw new Error("此申請已處理")
 const tch = r.teachers as Record<string, unknown> | null
 const teacherName = tch?.full_name != null ? String(tch.full_name) : "老師"
 const isOther = Boolean(r.is_other)
 const targetClassId = r.target_class_id != null ? String(r.target_class_id) : null
 const reason = r.reason != null ? String(r.reason).trim() : ""

 let remarks: string | null = null
 if (isOther || !targetClassId) {
  remarks = `${teacherName}預約${reason ? `：${reason}` : ""}`
 } else if (reason.length > 0) {
  remarks = reason
 }

 const newScheduleId = await insertScheduleRow({
  class_id: isOther || !targetClassId ? null : targetClassId,
  teacher_id: String(r.requesting_teacher_id ?? ""),
  scheduled_date: String(r.scheduled_date ?? ""),
  start_time: String(r.start_time ?? ""),
  end_time: String(r.end_time ?? ""),
  classroom_id: String(r.classroom_id ?? ""),
  remarks,
  status: "正常",
 })

 const { error: upErr } = await supabase
  .from("classroom_booking_requests")
  .update({
   status: "已批准",
   created_schedule_id: newScheduleId,
   reviewed_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
  })
  .eq("id", requestId)
 if (upErr) throw new Error(formatUnknownError(upErr))
}

export async function rejectRoomBookingRequest(requestId: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("classroom_booking_requests")
  .update({
   status: "已拒絕",
   reviewed_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
  })
  .eq("id", requestId)
  .eq("status", "待審批")
 if (error) throw new Error(formatUnknownError(error))
}

/** 送出前檢查（同格是否已有排程或待審申請） */
export async function slotIsFreeForBooking(params: {
 classroomId: string
 scheduledDate: string
 startTime: string
 endTime: string
 /** 調整既有排程時排除自身 */
 excludeScheduleId?: string
}): Promise<boolean> {
 if (!supabase) return false
 const slotA = parseHm(params.startTime) ?? LESSON_FIRST_START_MIN
 const slotB = parseHm(params.endTime) ?? slotA + LESSON_SLOT_DURATION_MIN

 const { data: sched } = await supabase
  .from("schedules")
  .select("id, start_time, end_time, status")
  .eq("classroom_id", params.classroomId)
  .eq("scheduled_date", params.scheduledDate)
 for (const row of sched ?? []) {
  const s = row as { id: string; start_time: string | null; end_time: string | null; status: string }
  if (params.excludeScheduleId && s.id === params.excludeScheduleId) continue
  if (s.status.includes("取消")) continue
  const a = parseHm(s.start_time)
  const b = parseHm(s.end_time)
  if (a == null || b == null) continue
  const bEff = b <= a ? a + LESSON_SLOT_DURATION_MIN : b
  if (intervalsOverlapMinutes(slotA, slotB, a, bEff)) return false
 }

 const { data: pend } = await supabase
  .from("classroom_booking_requests")
  .select("start_time, end_time")
  .eq("classroom_id", params.classroomId)
  .eq("scheduled_date", params.scheduledDate)
  .eq("status", "待審批")
 for (const row of pend ?? []) {
  const p = row as { start_time: string; end_time: string }
  const a = parseHm(p.start_time)
  const b = parseHm(p.end_time)
  if (a == null || b == null) continue
  const bEff = b <= a ? a + LESSON_SLOT_DURATION_MIN : b
  if (intervalsOverlapMinutes(slotA, slotB, a, bEff)) return false
 }

 return true
}
