import { formatClassLabel } from "@/lib/courseLabel"
import { supabase } from "@/lib/supabaseClient"
import {
 LATE_FEE_AMOUNT,
 billingMonthFromYmd,
 localTodayYmd,
 type LateFeePoolRow,
} from "@/lib/tuitionLateFee"

export type PaymentLateFeeItemInput = {
 classId: string
 amount?: number
 billingMonth: string
 waived: boolean
 waiverReason?: string | null
}

export type PaymentLateFeeItemRow = {
 id: string
 classId: string
 classLabel: string
 amount: number
 billingMonth: string
 waived: boolean
 waiverReason: string | null
}

function mapPoolRow(row: Record<string, unknown>): LateFeePoolRow {
 return {
  classId: String(row.class_id ?? ""),
  courseMode: String(row.course_mode ?? "regular"),
  classKind: String(row.class_kind ?? "group"),
  paidLessons: Number(row.paid_lessons ?? 0),
  billableBefore: Number(row.billable_before ?? 0),
  billableAfter: Number(row.billable_after ?? 0),
  coveredForNew: Number(row.covered_for_new ?? 0),
  triggerLateFee: Boolean(row.trigger_late_fee),
  alreadyHandledMonth: Boolean(row.already_handled_month),
 }
}

/** 載入該生各班逾期罰款池（含本月是否已處理） */
export async function fetchStudentClassLateFeePools(
 studentId: string,
 opts?: { billingMonth?: string; cutoff?: string }
): Promise<LateFeePoolRow[]> {
 if (!supabase || !studentId) return []
 const billingMonth = opts?.billingMonth ?? billingMonthFromYmd(localTodayYmd())
 const { data, error } = await supabase.rpc("student_class_late_fee_pools", {
  p_student_id: studentId,
  p_billing_month: billingMonth,
  ...(opts?.cutoff ? { p_cutoff: opts.cutoff } : {}),
 })
 if (error) {
  console.warn("[fetchStudentClassLateFeePools]", error.message)
  throw error
 }
 return ((data ?? []) as Record<string, unknown>[])
  .map((row) => mapPoolRow(row))
  .filter((r: LateFeePoolRow) => r.classId !== "")
}

export async function fetchLateFeeItemsForPayment(
 paymentId: string
): Promise<PaymentLateFeeItemRow[]> {
 if (!supabase || !paymentId) return []
 const { data, error } = await supabase
  .from("payment_late_fee_items")
  .select(
   "id, class_id, amount, billing_month, waived, waiver_reason, classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .eq("payment_id", paymentId)
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  const subject = cls?.subject != null ? String(cls.subject) : "—"
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  const courseName = course?.course_name != null ? String(course.course_name) : null
  return {
   id: String(r.id),
   classId: String(r.class_id),
   classLabel: formatClassLabel({ subject, courseCode: code, courseName }),
   amount: Number(r.amount ?? LATE_FEE_AMOUNT),
   billingMonth: String(r.billing_month ?? ""),
   waived: Boolean(r.waived),
   waiverReason: r.waiver_reason != null ? String(r.waiver_reason) : null,
  }
 })
}
