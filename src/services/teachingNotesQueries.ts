import { formatClassLabel } from "@/lib/courseLabel"
import { supabase } from "@/lib/supabaseClient"

const TEACHING_NOTES_SELECT =
 "id, scheduled_date, start_time, end_time, status, teaching_notes, session_number, class_id, teacher_id, classes ( subject, course_code_full, courses ( course_name ) ), classrooms ( name )"

export type TeachingNotesRow = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 teaching_notes: string | null
 session_number: number | null
 class_id: string | null
 teacher_id: string | null
 classLabel: string
 course_code_full: string | null
 classroom_name: string | null
}

export type PreviousTeachingNotes = {
 id: string
 scheduled_date: string
 start_time: string | null
 teaching_notes: string
}

function mapTeachingNotesRow(row: Record<string, unknown>): TeachingNotesRow {
 const cls = row.classes as Record<string, unknown> | null
 const rm = row.classrooms as Record<string, unknown> | null
 const course = cls?.courses as Record<string, unknown> | null
 const subject = cls?.subject != null ? String(cls.subject) : "（無班別）"
 const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 return {
  id: String(row.id),
  scheduled_date: String(row.scheduled_date ?? ""),
  start_time: row.start_time != null ? String(row.start_time) : null,
  end_time: row.end_time != null ? String(row.end_time) : null,
  status: String(row.status ?? "正常"),
  teaching_notes: row.teaching_notes != null ? String(row.teaching_notes) : null,
  session_number:
   row.session_number != null && !Number.isNaN(Number(row.session_number))
    ? Number(row.session_number)
    : null,
  class_id: row.class_id != null ? String(row.class_id) : null,
  teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
  classLabel: formatClassLabel({ subject, courseCode, courseName }),
  course_code_full: courseCode,
  classroom_name: rm?.name != null ? String(rm.name) : null,
 }
}

/** 老師範圍：現任或原任（代堂後雙方都看得到） */
function applyTeacherScope<T extends { or: (filter: string) => T }>(q: T, teacherId: string): T {
 return q.or(`teacher_id.eq.${teacherId},original_teacher_id.eq.${teacherId}`)
}

/**
 * 載入區間內排程（含尚未寫教學紀錄的堂次，供「全部堂次」檢視）。
 * 預設排除取消堂；老師登入時僅看自己範圍。
 */
export async function fetchTeachingNotesInRange(
 fromYmd: string,
 toYmd: string,
 opts?: { teacherId?: string | null; includeCancelled?: boolean }
): Promise<TeachingNotesRow[]> {
 if (!supabase) return []
 let q = supabase
  .from("schedules")
  .select(TEACHING_NOTES_SELECT)
  .gte("scheduled_date", fromYmd)
  .lte("scheduled_date", toYmd)
 if (!opts?.includeCancelled) q = q.not("status", "ilike", "%取消%")
 if (opts?.teacherId) q = applyTeacherScope(q, opts.teacherId)
 const { data, error } = await q
  .order("scheduled_date", { ascending: false })
  .order("start_time", { ascending: false })
 if (error) throw error
 return ((data ?? []) as Record<string, unknown>[]).map(mapTeachingNotesRow)
}

/** 同班別上一堂已填寫的教學紀錄（供延續進度） */
export async function fetchPreviousTeachingNotes(opts: {
 classId: string
 beforeDate: string
 beforeStartTime?: string | null
 excludeScheduleId?: string | null
}): Promise<PreviousTeachingNotes | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, start_time, teaching_notes")
  .eq("class_id", opts.classId)
  .not("status", "ilike", "%取消%")
  .not("teaching_notes", "is", null)
  .neq("teaching_notes", "")
  .lte("scheduled_date", opts.beforeDate)
  .order("scheduled_date", { ascending: false })
  .order("start_time", { ascending: false })
  .limit(8)
 if (error) throw error
 const rows = (data ?? []) as Array<{
  id: string
  scheduled_date: string
  start_time: string | null
  teaching_notes: string | null
 }>
 const beforeHm = (opts.beforeStartTime ?? "").slice(0, 5)
 for (const r of rows) {
  if (opts.excludeScheduleId && r.id === opts.excludeScheduleId) continue
  const notes = (r.teaching_notes ?? "").trim()
  if (!notes) continue
  const date = String(r.scheduled_date ?? "").slice(0, 10)
  if (date > opts.beforeDate.slice(0, 10)) continue
  if (date === opts.beforeDate.slice(0, 10)) {
   const hm = (r.start_time ?? "").slice(0, 5)
   if (!beforeHm || !hm || hm >= beforeHm) continue
  }
  return {
   id: r.id,
   scheduled_date: date,
   start_time: r.start_time != null ? String(r.start_time) : null,
   teaching_notes: notes,
  }
 }
 return null
}
