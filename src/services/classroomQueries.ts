import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"

export type RoomRecord = {
 id: string
 name: string
 capacity: number | null
 is_online: boolean
 remarks: string | null
}

export async function fetchClassrooms(): Promise<RoomRecord[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("classrooms")
  .select("id, name, capacity, is_online, remarks")
  .order("is_online", { ascending: true })
  .order("name")
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  return {
   id: String(row.id),
   name: String(row.name ?? ""),
   capacity: row.capacity != null ? Number(row.capacity) : null,
   is_online: Boolean(row.is_online),
   remarks: row.remarks != null ? String(row.remarks) : null,
  }
 })
}

export type RoomScheduleRow = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 class_id: string | null
 subject: string
 course_code_full: string | null
 course_name: string | null
 classLabel: string
 teacher_id: string | null
 teacher_name: string | null
}

export async function fetchSchedulesForRoomRange(
 roomId: string,
 fromYmd: string,
 toYmd: string
): Promise<RoomScheduleRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, scheduled_date, start_time, end_time, status, class_id, teacher_id, classes ( subject, course_code_full, courses ( course_name ) ), teachers ( full_name )"
  )
  .eq("classroom_id", roomId)
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const tch = r.teachers as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "（無班別）"
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
  return {
   id: String(r.id),
   scheduled_date: String(r.scheduled_date ?? ""),
   start_time: r.start_time != null ? String(r.start_time) : null,
   end_time: r.end_time != null ? String(r.end_time) : null,
   status: String(r.status ?? ""),
   class_id: r.class_id != null ? String(r.class_id) : null,
   subject: sub,
   course_code_full: courseCode,
   course_name: courseName,
   classLabel: formatClassLabel({ subject: sub, courseCode, courseName }),
   teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
   teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  }
 })
}

export async function fetchClassesUsingRoom(roomId: string): Promise<{ id: string; label: string }[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("classes")
  .select("id, subject, course_code_full, courses ( course_name )")
  .eq("classroom_id", roomId)
  .order("subject")
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  const sub = String(row.subject ?? "")
  const code = row.course_code_full != null ? String(row.course_code_full) : ""
  const course = row.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  return {
   id: String(row.id),
   label: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  }
 })
}
