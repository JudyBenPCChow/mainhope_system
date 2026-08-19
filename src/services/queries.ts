import { supabase } from "@/lib/supabaseClient"

/** 依表名讀取全表（依 `created_at` 新到舊）。未設定 Supabase 時回傳空陣列。 */
export async function listTable(table: string): Promise<unknown[]> {
 if (!supabase) {
  console.warn(`[api] 未設定 VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY，${table} 回傳 []`)
  return []
 }

 const { data, error } = await supabase
  .from(table)
  .select("*")
  .order("created_at", { ascending: false })

 if (error) {
  console.error(`[api] ${table}:`, error.message)
  throw error
 }

 return data ?? []
}

export const listTeachers = () => listTable("teachers")
export const listStudents = () => listTable("students")
export const listClassrooms = () => listTable("classrooms")
export const listClasses = () => listTable("classes")
export const listStudentClassEnrollment = () =>
 listTable("student_class_enrollments")
export const listSchedule = () => listTable("schedules")
export const listAttendanceDetail = () => listTable("attendance_details")
export const listPayments = () => listTable("payments")
export const listPaymentDetails = () => listTable("payment_details")
export const listStudentStatusHistory = () =>
 listTable("student_status_history")
export const listLeaveMakeupRecord = () => listTable("leave_makeup_records")
export const listTrialSession = () => listTable("trial_sessions")
export const listAppUsers = () => listTable("app_users")

/** 對應 UserManagement 的 `User.update`（表：`app_users`）。寫入成敗由 RLS（`users.manage`）決定。 */
export async function updateAppUser(
 id: string,
 patch: Record<string, unknown>
): Promise<unknown> {
 if (!supabase) {
  console.warn("[api] Supabase 未設定，略過 User.update")
  return null
 }
 const { data, error } = await supabase
  .from("app_users")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
  .select("*")
  .maybeSingle()

 if (error) {
  console.error("[api] app_users update:", error.message)
  throw error
 }

 return data
}
