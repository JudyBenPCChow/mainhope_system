import { supabase } from "@/lib/supabaseClient"

export type ReferralRecordRow = {
 id: string
 referrerStudentId: string
 referrerName: string
 refereeStudentId: string
 refereeName: string
 paymentId: string
 refereeDiscountAmount: number
 referrerRebateAmount: number
 rebateStatus: "pending" | "paid" | "cancelled"
 rebatePaidAt: string | null
 createdAt: string
}

export async function isStudentNewToMingXue(studentId: string): Promise<boolean> {
 if (!supabase) return false
 const { count: enrollCount, error: e1 } = await supabase
  .from("student_class_enrollments")
  .select("id", { count: "exact", head: true })
  .eq("student_id", studentId)
 if (e1) throw e1
 if ((enrollCount ?? 0) > 0) return false
 const { count: payCount, error: e2 } = await supabase
  .from("payments")
  .select("id", { count: "exact", head: true })
  .eq("student_id", studentId)
  .neq("status", "作廢")
 if (e2) throw e2
 return (payCount ?? 0) === 0
}

export async function insertReferralRecord(row: {
 referrerStudentId: string
 refereeStudentId: string
 paymentId: string
 refereeDiscountAmount: number
 referrerRebateAmount: number
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("referral_records").insert({
  referrer_student_id: row.referrerStudentId,
  referee_student_id: row.refereeStudentId,
  payment_id: row.paymentId,
  referee_discount_amount: row.refereeDiscountAmount,
  referrer_rebate_amount: row.referrerRebateAmount,
  rebate_status: "pending",
 })
 if (error) throw error
}

export async function fetchPendingReferralRebates(): Promise<ReferralRecordRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("referral_records")
  .select(
   "id, referrer_student_id, referee_student_id, payment_id, referee_discount_amount, referrer_rebate_amount, rebate_status, rebate_paid_at, created_at, referrer:referrer_student_id ( full_name ), referee:referee_student_id ( full_name )"
  )
  .eq("rebate_status", "pending")
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const referrer = r.referrer as Record<string, unknown> | null
  const referee = r.referee as Record<string, unknown> | null
  return {
   id: String(r.id),
   referrerStudentId: String(r.referrer_student_id),
   referrerName: referrer?.full_name != null ? String(referrer.full_name) : "—",
   refereeStudentId: String(r.referee_student_id),
   refereeName: referee?.full_name != null ? String(referee.full_name) : "—",
   paymentId: String(r.payment_id),
   refereeDiscountAmount: Number(r.referee_discount_amount ?? 0),
   referrerRebateAmount: Number(r.referrer_rebate_amount ?? 0),
   rebateStatus: String(r.rebate_status ?? "pending") as ReferralRecordRow["rebateStatus"],
   rebatePaidAt: r.rebate_paid_at != null ? String(r.rebate_paid_at) : null,
   createdAt: String(r.created_at ?? ""),
  }
 })
}

export async function markReferralRebatePaid(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("referral_records")
  .update({
   rebate_status: "paid",
   rebate_paid_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
  })
  .eq("id", id)
 if (error) throw error
}
