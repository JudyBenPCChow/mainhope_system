import { emptyGraduationBlockers, type GraduationBlockers } from "@/lib/graduationGuard"
import { supabase } from "@/lib/supabaseClient"
import { fetchLeavesAwaitingMakeupDateForStudent } from "@/services/leaveQueries"
import { PAYMENT_STATUS } from "@/services/paymentQueries"

/** 標已畢業前檢查：未清繳費、待補／已安排補堂、未處理請假、就讀中報讀。 */
export async function fetchGraduationBlockers(studentId: string): Promise<GraduationBlockers> {
 const empty = emptyGraduationBlockers()
 if (!supabase || !studentId) return empty

 const pendingPayQ = supabase
  .from("payments")
  .select("id", { count: "exact", head: true })
  .eq("student_id", studentId)
  .in("status", [PAYMENT_STATUS.pendingPay, PAYMENT_STATUS.pendingReceive])

 const pendingLessonQ = supabase
  .from("student_pending_lessons")
  .select("id", { count: "exact", head: true })
  .eq("student_id", studentId)
  .in("status", ["待補", "已安排"])

 const enrollQ = supabase
  .from("student_class_enrollments")
  .select("id", { count: "exact", head: true })
  .eq("student_id", studentId)
  .eq("status", "就讀中")

 const [pay, lesson, enroll, leaves] = await Promise.all([
  pendingPayQ,
  pendingLessonQ,
  enrollQ,
  fetchLeavesAwaitingMakeupDateForStudent(studentId),
 ])
 if (pay.error) throw pay.error
 if (lesson.error) throw lesson.error
 if (enroll.error) throw enroll.error

 return {
  pendingPaymentCount: pay.count ?? 0,
  openPendingLessonCount: lesson.count ?? 0,
  leaveAwaitingMakeupCount: leaves.length,
  activeEnrollmentCount: enroll.count ?? 0,
 }
}
