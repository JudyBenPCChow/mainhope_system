import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"
import { localYmd } from "@/services/scheduleQueries"
import { addDaysYmd } from "@/services/teacherQueries"

/** 以週一為一週起始（與本地日曆一致） */
export function mondayYmdOfWeekContaining(ymd: string): string {
 const [y, mo, da] = ymd.split("-").map(Number)
 const dt = new Date(y, mo - 1, da)
 const day = dt.getDay()
 const diff = day === 0 ? -6 : 1 - day
 dt.setDate(dt.getDate() + diff)
 return localYmd(dt)
}

export type TrialManageRow = {
 id: string
 student_id: string
 class_id: string
 schedule_id: string
 trial_date: string
 trial_type: string
 status: string
 remarks: string | null
 student_name: string | null
 student_grade: string | null
 class_subject: string | null
 course_code: string | null
 teacher_id: string | null
 teacher_name: string | null
 sched_date: string | null
 sched_start: string | null
 sched_end: string | null
}

function mapRow(r: Record<string, unknown>): TrialManageRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as Record<string, unknown> | null
 const tch = cls?.teachers as Record<string, unknown> | null
 const sc = r.schedules as Record<string, unknown> | null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const code = cls?.course_code != null ? String(cls.course_code) : null
 return {
  id: String(r.id),
  student_id: String(r.student_id),
  class_id: String(r.class_id),
  schedule_id: String(r.schedule_id),
  trial_date: String(r.trial_date ?? ""),
  trial_type: String(r.trial_type ?? ""),
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  student_name: st?.full_name != null ? String(st.full_name) : null,
  student_grade: st?.grade != null ? String(st.grade) : null,
  class_subject: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  course_code: code,
  teacher_id: cls?.teacher_id != null ? String(cls.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  sched_date: sc?.scheduled_date != null ? String(sc.scheduled_date) : null,
  sched_start: sc?.start_time != null ? String(sc.start_time) : null,
  sched_end: sc?.end_time != null ? String(sc.end_time) : null,
 }
}

export async function fetchTrialsWithRelations(): Promise<TrialManageRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("trial_sessions")
  .select(
   "id, student_id, class_id, schedule_id, trial_date, trial_type, status, remarks, students ( full_name, grade ), classes ( subject, course_code, courses ( course_name ), teacher_id, teachers ( full_name ) ), schedules ( scheduled_date, start_time, end_time )"
  )
  .order("trial_date", { ascending: false })
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((x) => mapRow(x as Record<string, unknown>))
}

export type TrialDashboardStats = {
 todayCount: number
 weekCount: number
}

export async function fetchTrialDashboardStats(): Promise<TrialDashboardStats> {
 const empty: TrialDashboardStats = { todayCount: 0, weekCount: 0 }
 if (!supabase) return empty
 const today = localYmd()
 const weekStart = mondayYmdOfWeekContaining(today)
 const weekEnd = addDaysYmd(weekStart, 6)
 const [todayRes, weekRes] = await Promise.all([
  supabase.from("trial_sessions").select("id", { count: "exact", head: true }).eq("trial_date", today),
  supabase
   .from("trial_sessions")
   .select("id", { count: "exact", head: true })
   .gte("trial_date", weekStart)
   .lte("trial_date", weekEnd),
 ])
 if (todayRes.error) throw todayRes.error
 if (weekRes.error) throw weekRes.error
 return {
  todayCount: todayRes.count ?? 0,
  weekCount: weekRes.count ?? 0,
 }
}

export async function updateTrialSession(id: string, patch: { status?: string; remarks?: string | null }): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("trial_sessions")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw error
}

export async function deleteTrialSession(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("trial_sessions").delete().eq("id", id)
 if (error) throw error
}

export async function insertTrialSession(row: {
 student_id: string
 schedule_id: string
 class_id: string
 trial_date: string
 trial_type: string
 status?: string
 remarks?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("trial_sessions").insert({
  student_id: row.student_id,
  schedule_id: row.schedule_id,
  class_id: row.class_id,
  trial_date: row.trial_date,
  trial_type: row.trial_type,
  status: row.status ?? "已預約",
  remarks: row.remarks ?? null,
 })
 if (error) throw error
}

export function trialStatusCategory(status: string): "booked" | "done" | "cancel" {
 const s = status.trim()
 if (s.includes("取消")) return "cancel"
 if (s.includes("完成")) return "done"
 return "booked"
}

export function trialTypeCategory(trialType: string): "free" | "half" | "full" | "other" {
 const t = trialType.trim()
 if (t.includes("免費") || t.includes("體驗")) return "free"
 if (t.includes("半價")) return "half"
 if (t.includes("原價")) return "full"
 return "other"
}
