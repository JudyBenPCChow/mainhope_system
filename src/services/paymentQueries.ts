import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"

const METHOD_OPTIONS = ["現金", "轉數快", "信用卡", "支票", "其他"] as const
export const PAYMENT_METHOD_PRESETS = [...METHOD_OPTIONS]

export const PAYMENT_STATUS = {
 received: "已收款",
 pendingPay: "待繳費",
 pendingReceive: "待收款",
} as const

function pad2(n: number) {
 return String(n).padStart(2, "0")
}

function ymdCompact(d = new Date()) {
 return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
}

/** 產生單據編號：RC=收據、INV=通知單／待繳（僅由系統呼叫） */
export function generateReceiptRef(kind: "RC" | "INV"): string {
 const r = Math.floor(Math.random() * 9000) + 1000
 return `MX-${kind}-${ymdCompact()}-${r}`
}

export type PaymentListRow = {
 id: string
 studentId: string
 studentName: string
 studentCode: string | null
 receiptNumber: string | null
 paymentDate: string
 totalAmount: number
 paymentMethod: string | null
 status: string
 remarks: string | null
 createdAt: string
 discountId: string | null
 discountName: string | null
}

export type PaymentDetailRow = {
 id: string
 classId: string | null
 classLabel: string
 lessonCount: number | null
 amount: number | null
 description: string | null
}

export type PaymentFull = PaymentListRow & {
 details: PaymentDetailRow[]
 discountPercentOff: number | null
 discountAmountOff: number | null
}

function mapListRow(r: Record<string, unknown>): PaymentListRow {
 const st = r.students as Record<string, unknown> | null
 const disc = r.payment_discounts as Record<string, unknown> | null
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  studentName: st?.full_name != null ? String(st.full_name) : "—",
  studentCode: st?.student_code != null ? String(st.student_code) : null,
  receiptNumber: r.receipt_number != null ? String(r.receipt_number) : null,
  paymentDate: String(r.payment_date ?? "").slice(0, 10),
  totalAmount: Number(r.total_amount ?? 0),
  paymentMethod: r.payment_method != null ? String(r.payment_method) : null,
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  createdAt: String(r.created_at ?? ""),
  discountId: r.payment_discount_id != null ? String(r.payment_discount_id) : null,
  discountName: disc?.name != null ? String(disc.name) : null,
 }
}

export type PaymentListFilters = {
 status?: "all" | "received" | "pending" | "pendingPay"
 fromYmd?: string
 toYmd?: string
 search?: string
 limit?: number
}

/** 紀錄列表（含學生、優惠名稱） */
export async function fetchPaymentsList(filters: PaymentListFilters = {}): Promise<PaymentListRow[]> {
 if (!supabase) return []
 const limit = Math.min(Math.max(filters.limit ?? 400, 1), 800)

 let q = supabase
  .from("payments")
  .select(
   "id, student_id, receipt_number, payment_date, total_amount, payment_method, status, remarks, created_at, payment_discount_id, students ( full_name, student_code ), payment_discounts ( name )"
  )
  .order("payment_date", { ascending: false })
  .limit(limit)

 if (filters.fromYmd) q = q.gte("payment_date", filters.fromYmd)
 if (filters.toYmd) q = q.lte("payment_date", filters.toYmd)

 if (filters.status === "received") {
  q = q.eq("status", PAYMENT_STATUS.received)
 } else if (filters.status === "pending") {
  q = q.in("status", [PAYMENT_STATUS.pendingPay, PAYMENT_STATUS.pendingReceive])
 } else if (filters.status === "pendingPay") {
  q = q.eq("status", PAYMENT_STATUS.pendingPay)
 }

 const { data, error } = await q
 if (error) throw error
 let rows = (data ?? []).map((x) => mapListRow(x as Record<string, unknown>))
 const s = filters.search?.trim().toLowerCase() ?? ""
 if (s) {
  rows = rows.filter((r) => {
   const hay =
    `${r.studentName} ${r.studentCode ?? ""} ${r.receiptNumber ?? ""} ${r.remarks ?? ""} ${r.discountName ?? ""}`.toLowerCase()
   return hay.includes(s)
  })
 }
 return rows
}

export async function fetchPaymentFull(id: string): Promise<PaymentFull | null> {
 if (!supabase) return null
 const { data: pay, error: e1 } = await supabase
  .from("payments")
  .select(
   "id, student_id, receipt_number, payment_date, total_amount, payment_method, status, remarks, created_at, payment_discount_id, students ( full_name, student_code ), payment_discounts ( name, percent_off, amount_off )"
  )
  .eq("id", id)
  .maybeSingle()
 if (e1) throw e1
 if (!pay) return null

 const { data: det, error: e2 } = await supabase
  .from("payment_details")
  .select("id, class_id, lesson_count, amount, description, classes ( subject, course_code, courses ( course_name ) )")
  .eq("payment_id", id)
 if (e2) throw e2

 const details: PaymentDetailRow[] = (det ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const code = cls?.course_code != null ? String(cls.course_code) : ""
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  return {
   id: String(r.id),
   classId: r.class_id != null ? String(r.class_id) : null,
   classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
   lessonCount: r.lesson_count != null ? Number(r.lesson_count) : null,
   amount: r.amount != null ? Number(r.amount) : null,
   description: r.description != null ? String(r.description) : null,
  }
 })

 const base = mapListRow(pay as Record<string, unknown>)
 const disc = (pay as Record<string, unknown>).payment_discounts as Record<string, unknown> | null
 return {
  ...base,
  details,
  discountPercentOff: disc?.percent_off != null ? Number(disc.percent_off) : null,
  discountAmountOff: disc?.amount_off != null ? Number(disc.amount_off) : null,
 }
}

export type PaymentDetailInput = {
 classId: string | null
 lessonCount: number | null
 amount: number | null
 description: string | null
}

export async function insertPaymentRecord(params: {
 studentId: string
 paymentDate: string
 totalAmount: number
 paymentMethod: string
 status: string
 remarks?: string | null
 receiptKind: "RC" | "INV"
 discountId?: string | null
 details?: PaymentDetailInput[]
}): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")

 const receipt = generateReceiptRef(params.receiptKind)

 const { data: ins, error: e1 } = await supabase
  .from("payments")
  .insert({
   student_id: params.studentId,
   payment_date: params.paymentDate,
   total_amount: params.totalAmount,
   payment_method: params.paymentMethod,
   status: params.status,
   remarks: params.remarks?.trim() || null,
   receipt_number: receipt,
   payment_discount_id: params.discountId != null && params.discountId !== "" ? params.discountId.trim() : null,
  })
  .select("id")
  .single()
 if (e1) throw e1
 const paymentId = String((ins as { id: string }).id)

 const details = params.details?.filter((d) => d.classId || d.amount != null || d.description) ?? []
 if (details.length > 0) {
  const { error: e2 } = await supabase.from("payment_details").insert(
   details.map((d) => ({
    payment_id: paymentId,
    class_id: d.classId,
    lesson_count: d.lessonCount,
    amount: d.amount,
    description: d.description?.trim() || null,
   }))
  )
  if (e2) throw e2
 }

 return paymentId
}

export async function updatePaymentRecord(
 id: string,
 patch: {
  status?: string
  paymentMethod?: string | null
  paymentDate?: string
  receiptNumber?: string | null
  remarks?: string | null
  totalAmount?: number
 }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if (patch.status !== undefined) payload.status = patch.status
 if (patch.paymentMethod !== undefined) payload.payment_method = patch.paymentMethod
 if (patch.paymentDate !== undefined) payload.payment_date = patch.paymentDate
 if (patch.receiptNumber !== undefined) payload.receipt_number = patch.receiptNumber
 if (patch.remarks !== undefined) payload.remarks = patch.remarks
 if (patch.totalAmount !== undefined) payload.total_amount = patch.totalAmount
 const { error } = await supabase.from("payments").update(payload).eq("id", id)
 if (error) throw error
}

export async function deletePaymentRecord(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("payments").delete().eq("id", id)
 if (error) throw error
}

/** 繳費頁儀表板：已收款明細之堂數加總、全庫「出席類」上課紀錄筆數 */
export type PaymentDashboardStats = {
 /** 學生總交堂數（已收款繳費單之 payment_details.lesson_count 加總） */
 totalPaidLessons: number
 /** 學生總上堂數（attendance_details 中計為出席之筆數） */
 totalAttendedLessons: number
}

export async function fetchPaymentDashboardStats(): Promise<PaymentDashboardStats> {
 if (!supabase) return { totalPaidLessons: 0, totalAttendedLessons: 0 }

 const { data: paidPayments, error: e1 } = await supabase.from("payments").select("id").eq("status", PAYMENT_STATUS.received)
 if (e1) throw e1
 const pids = (paidPayments ?? []).map((r) => String((r as { id: unknown }).id))
 let totalPaidLessons = 0
 if (pids.length > 0) {
  const { data: det, error: e2 } = await supabase.from("payment_details").select("lesson_count").in("payment_id", pids)
  if (e2) throw e2
  for (const row of det ?? []) {
   const n = Number((row as { lesson_count: unknown }).lesson_count)
   if (Number.isFinite(n) && n > 0) totalPaidLessons += n
  }
 }

 const { data: attRows, error: e3 } = await supabase.from("attendance_details").select("status")
 if (e3) throw e3
 let totalAttendedLessons = 0
 for (const row of attRows ?? []) {
  const s = String((row as { status: unknown }).status ?? "")
  if (s.includes("出席") && !s.includes("缺席")) totalAttendedLessons += 1
 }

 return { totalPaidLessons, totalAttendedLessons }
}

/** 單一學生：已收款繳費單之 payment_details.lesson_count 加總（總繳堂數） */
export async function fetchTotalPaidLessonsForStudent(studentId: string): Promise<number> {
 if (!supabase) return 0
 const { data: pays, error: e1 } = await supabase
  .from("payments")
  .select("id")
  .eq("student_id", studentId)
  .eq("status", PAYMENT_STATUS.received)
 if (e1) throw e1
 const pids = (pays ?? []).map((r) => String((r as { id: unknown }).id))
 if (pids.length === 0) return 0
 const { data: det, error: e2 } = await supabase.from("payment_details").select("lesson_count").in("payment_id", pids)
 if (e2) throw e2
 let sum = 0
 for (const row of det ?? []) {
  const n = Number((row as { lesson_count: unknown }).lesson_count)
  if (Number.isFinite(n) && n > 0) sum += n
 }
 return sum
}

/** 將待繳／待收款改為已收款；收據編號一律由系統產生 */
export async function markPaymentReceived(id: string, opts?: { paymentMethod?: string }): Promise<void> {
 const receipt = generateReceiptRef("RC")
 await updatePaymentRecord(id, {
  status: PAYMENT_STATUS.received,
  receiptNumber: receipt,
  ...(opts?.paymentMethod ? { paymentMethod: opts.paymentMethod } : {}),
 })
}
