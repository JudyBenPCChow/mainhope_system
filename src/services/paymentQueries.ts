import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { evaluateDiscountAvailability } from "@/lib/paymentDiscountEligibility"
import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { computeDiscountApplicationsForSave } from "@/lib/paymentAmountBreakdown"
import { createPaymentBatch } from "@/services/paymentBatchQueries"
import { insertReferralRecord } from "@/services/referralQueries"
import { formatClassLabel, classDisplayName } from "@/lib/courseLabel"
import { supabase } from "@/lib/supabaseClient"
import { pickStudentContactFromDbRow } from "@/lib/whatsappReminder"
import {
 applyDiscountsToSubtotal,
 fetchActivePaymentDiscounts,
 fetchPaymentEligibilityContextFromDetails,
 filterTuitionDiscounts,
 isDiscountInEffect,
 mapPaymentDiscountRow,
 resolveDiscountIdsFromCatalog,
 validateDiscountSelection,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"

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

const RECEIPT_REF_ATTEMPTS = 8

function receiptRefPrefix(kind: "RC" | "INV", d = new Date()) {
 return `MX-${kind}-${ymdCompact(d)}-`
}

function formatReceiptRefSuffix(seq: number): string {
 const width = seq > 9999 ? 5 : 4
 return String(seq).padStart(width, "0")
}

function isReceiptNumberUniqueViolation(error: unknown): boolean {
 if (!error || typeof error !== "object") return false
 const e = error as { code?: string }
 return e.code === "23505"
}

/** 依當日既有單號遞增序號，格式 MX-{RC|INV}-YYYYMMDD-0001 */
async function allocateReceiptRef(kind: "RC" | "INV"): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const prefix = receiptRefPrefix(kind)
 const { data, error } = await supabase
  .from("payments")
  .select("receipt_number")
  .like("receipt_number", `${prefix}%`)
  .order("receipt_number", { ascending: false })
  .limit(1)
 if (error) throw error
 let next = 1
 const latest = data?.[0]?.receipt_number
 if (typeof latest === "string" && latest.startsWith(prefix)) {
  const n = parseInt(latest.slice(prefix.length), 10)
  if (Number.isFinite(n) && n >= 0) next = n + 1
 }
 return `${prefix}${formatReceiptRefSuffix(next)}`
}

export type PaymentListRow = {
 id: string
 studentId: string
 studentName: string
 studentCode: string | null
 /** WhatsApp／學生電話／家長電話（優先序與 pickStudentContactRaw 一致） */
 contactPhone: string | null
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
 courseName: string
 courseCode: string | null
 lessonCount: number | null
 amount: number | null
 description: string | null
}

export type PaymentDiscountApplicationRow = {
 sortOrder: number
 discountId: string
 name: string
 percentOff: number | null
 amountOff: number | null
 amountDeducted: number | null
}

export type PaymentFull = PaymentListRow & {
 subtotalAmount: number | null
 studentGrade: string | null
 details: PaymentDetailRow[]
 discountApplications: PaymentDiscountApplicationRow[]
 /** @deprecated 請改用 discountApplications */
 discountPercentOff: number | null
 /** @deprecated 請改用 discountApplications */
 discountAmountOff: number | null
}

function mapDiscountApplicationRow(r: Record<string, unknown>): PaymentDiscountApplicationRow | null {
 const disc = r.payment_discounts as Record<string, unknown> | null
 if (!disc?.id) return null
 return {
  sortOrder: Number(r.sort_order ?? 0),
  discountId: String(disc.id),
  name: disc.name != null ? String(disc.name) : "—",
  percentOff: disc.percent_off != null ? Number(disc.percent_off) : null,
  amountOff: disc.amount_off != null ? Number(disc.amount_off) : null,
  amountDeducted: r.amount_deducted != null ? Number(r.amount_deducted) : null,
 }
}

function discountNamesFromApplications(apps: PaymentDiscountApplicationRow[]): string | null {
 if (apps.length === 0) return null
 return [...apps]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((a) => a.name)
  .join("；")
}

function mapListRow(r: Record<string, unknown>): PaymentListRow {
 const st = r.students as Record<string, unknown> | null
 const disc = r.payment_discounts as Record<string, unknown> | null
 const appRows = r.payment_discount_applications as unknown
 const apps = Array.isArray(appRows)
  ? appRows
     .map((row) => mapDiscountApplicationRow(row as Record<string, unknown>))
     .filter((x): x is PaymentDiscountApplicationRow => x != null)
  : []
 const discountName =
  discountNamesFromApplications(apps) ?? (disc?.name != null ? String(disc.name) : null)
 const discountId =
  apps[0]?.discountId ?? (r.payment_discount_id != null ? String(r.payment_discount_id) : null)
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  studentName: st?.full_name != null ? String(st.full_name) : "—",
  studentCode: st?.student_code != null ? String(st.student_code) : null,
  contactPhone: pickStudentContactFromDbRow(st),
  receiptNumber: r.receipt_number != null ? String(r.receipt_number) : null,
  paymentDate: String(r.payment_date ?? "").slice(0, 10),
  totalAmount: Number(r.total_amount ?? 0),
  paymentMethod: r.payment_method != null ? String(r.payment_method) : null,
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  createdAt: String(r.created_at ?? ""),
  discountId,
  discountName,
 }
}

export type PaymentListFilters = {
 status?: "all" | "received" | "pending" | "pendingPay"
 fromYmd?: string
 toYmd?: string
 search?: string
 studentId?: string
 limit?: number
}

/** 紀錄列表（含學生、優惠名稱） */
export async function fetchPaymentsList(filters: PaymentListFilters = {}): Promise<PaymentListRow[]> {
 if (!supabase) return []
 const limit = Math.min(Math.max(filters.limit ?? 400, 1), 800)

 let q = supabase
  .from("payments")
  .select(
   "id, student_id, receipt_number, payment_date, total_amount, payment_method, status, remarks, created_at, payment_discount_id, students ( full_name, student_code, whatsapp, student_phone, parent_phone ), payment_discounts ( name ), payment_discount_applications ( sort_order, amount_deducted, payment_discounts ( id, name, percent_off, amount_off ) )"
  )
  .order("payment_date", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(limit)

 if (filters.studentId) q = q.eq("student_id", filters.studentId)
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
   "id, student_id, receipt_number, payment_date, total_amount, subtotal_amount, payment_method, status, remarks, created_at, payment_discount_id, students ( full_name, student_code, grade, whatsapp, student_phone, parent_phone ), payment_discounts ( name, percent_off, amount_off ), payment_discount_applications ( sort_order, amount_deducted, payment_discounts ( id, name, percent_off, amount_off ) )"
  )
  .eq("id", id)
  .maybeSingle()
 if (e1) throw e1
 if (!pay) return null

 const { data: det, error: e2 } = await supabase
  .from("payment_details")
  .select("id, class_id, lesson_count, amount, description, classes ( subject, course_code_full, courses ( course_name ) )")
  .eq("payment_id", id)
 if (e2) throw e2

 const details: PaymentDetailRow[] = (det ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  return {
   id: String(r.id),
   classId: r.class_id != null ? String(r.class_id) : null,
   classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
   courseName: classDisplayName({ subject: sub, courseName }),
   courseCode: code.trim() !== "" ? code : null,
   lessonCount: r.lesson_count != null ? Number(r.lesson_count) : null,
   amount: r.amount != null ? Number(r.amount) : null,
   description: r.description != null ? String(r.description) : null,
  }
 })

 const base = mapListRow(pay as Record<string, unknown>)
 const payRow = pay as Record<string, unknown>
 const st = payRow.students as Record<string, unknown> | null
 const studentGrade = st?.grade != null ? String(st.grade) : null
 const disc = payRow.payment_discounts as Record<string, unknown> | null
 const appRows = payRow.payment_discount_applications as unknown
 let discountApplications = Array.isArray(appRows)
  ? appRows
     .map((row) => mapDiscountApplicationRow(row as Record<string, unknown>))
     .filter((x): x is PaymentDiscountApplicationRow => x != null)
  : []
 if (discountApplications.length === 0 && base.discountId && disc) {
  discountApplications = [
   {
    sortOrder: 0,
    discountId: base.discountId,
    name: disc.name != null ? String(disc.name) : "—",
    percentOff: disc.percent_off != null ? Number(disc.percent_off) : null,
    amountOff: disc.amount_off != null ? Number(disc.amount_off) : null,
    amountDeducted: null,
   },
  ]
 }
 const subtotalAmount =
  payRow.subtotal_amount != null ? Number(payRow.subtotal_amount) : null
 const firstApp = discountApplications[0]
 return {
  ...base,
  subtotalAmount,
  studentGrade,
  details,
  discountApplications,
  discountPercentOff: firstApp?.percentOff ?? (disc?.percent_off != null ? Number(disc.percent_off) : null),
  discountAmountOff: firstApp?.amountOff ?? (disc?.amount_off != null ? Number(disc.amount_off) : null),
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
 subtotalAmount?: number
 paymentMethod: string
 status: string
 remarks?: string | null
 receiptKind: "RC" | "INV"
 /** 依表單勾選的優惠 ID（套用順序依目錄 sort_order） */
 discountIds?: string[]
 /** @deprecated 請改用 discountIds */
 discountId?: string | null
 details?: PaymentDetailInput[]
 /** 繳費日期 YYYY-MM-DD（驗證優惠有效期） */
 paymentDateForDiscounts?: string
 /** 學年 label（驗證優惠學年 scope） */
 academicYearForDiscounts?: string | null
 siblingExtraLessons?: number
 isNewStudent?: boolean
 paymentBatchId?: string | null
 createPaymentBatchIfNeeded?: boolean
 batchMemberCount?: number
 batchSharedClassId?: string | null
 referrerStudentId?: string | null
 createReferralRecord?: boolean
}): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 assertAcademicYearEditableForDate(params.paymentDate)

 const discountIds = (
  params.discountIds?.length
   ? params.discountIds
   : params.discountId
     ? [params.discountId]
     : []
 ).filter((id) => id.trim() !== "")
 const subtotalAmount = Math.round((params.subtotalAmount ?? params.totalAmount) * 100) / 100
 const totalAmount = Math.round(params.totalAmount * 100) / 100

 let orderedDiscounts: PaymentDiscountRow[] = []
 let discountApplications: Array<{ discountId: string; sortOrder: number; amountDeducted: number }> = []

 if (discountIds.length === 0) {
  if (Math.abs(subtotalAmount - totalAmount) > 0.01) {
   throw new Error("應繳總額與項目小計不一致")
  }
 } else {
  const { data: discRows, error: discErr } = await supabase
   .from("payment_discounts")
   .select("*")
   .in("id", discountIds)
  if (discErr) throw discErr

  const selectedCatalog = (discRows ?? []).map((row) =>
   mapPaymentDiscountRow(row as Record<string, unknown>)
  )
  orderedDiscounts = resolveDiscountIdsFromCatalog(discountIds, selectedCatalog)

  const asOfDate = params.paymentDateForDiscounts ?? params.paymentDate
  for (const d of orderedDiscounts) {
   if (
    !isDiscountInEffect(d, {
     asOfDate,
     academicYear: params.academicYearForDiscounts ?? null,
    })
   ) {
    throw new Error(`優惠「${d.name}」不在有效期或學年範圍內`)
   }
  }

  const activeCatalog = await fetchActivePaymentDiscounts({
   asOfDate,
   academicYear: params.academicYearForDiscounts ?? null,
  })
  const selectionErr = validateDiscountSelection(orderedDiscounts, activeCatalog)
  if (selectionErr) throw new Error(selectionErr)

  const eligibilityCtx = await fetchPaymentEligibilityContextFromDetails(
   params.details?.map((d) => ({ classId: d.classId, lessonCount: d.lessonCount })) ?? [],
   {
    siblingExtraLessons: params.siblingExtraLessons ?? 0,
    isNewStudent: params.isNewStudent,
    batchMemberCount: params.batchMemberCount,
    batchSharedClassId: params.batchSharedClassId ?? null,
    referrerStudentId: params.referrerStudentId ?? null,
   }
  )
  for (const d of orderedDiscounts) {
   const avail = evaluateDiscountAvailability(d, eligibilityCtx, {
    asOfDate,
    academicYear: params.academicYearForDiscounts ?? null,
   })
   if (!avail.eligible) {
    throw new Error(`優惠「${d.name}」不符合資格：${avail.reason ?? "條件未達"}`)
   }
  }

  discountApplications = computeDiscountApplicationsForSave(
   subtotalAmount,
   orderedDiscounts,
   eligibilityCtx
  )
  const expectedTotal = applyDiscountsToSubtotal(subtotalAmount, orderedDiscounts, eligibilityCtx)
  if (Math.abs(expectedTotal - totalAmount) > 0.01) {
   throw new Error("應繳總額與優惠試算結果不一致，請重新整理後再試")
  }
 }

 let batchId = params.paymentBatchId ?? null
 if (params.createPaymentBatchIfNeeded && !batchId) {
  batchId = await createPaymentBatch(params.paymentDate, params.remarks ?? null)
 }

 let paymentId: string | null = null
 for (let attempt = 0; attempt < RECEIPT_REF_ATTEMPTS; attempt++) {
  const receipt = await allocateReceiptRef(params.receiptKind)
  const { data: ins, error: e1 } = await supabase
   .from("payments")
   .insert({
    student_id: params.studentId,
    payment_date: params.paymentDate,
    total_amount: totalAmount,
    subtotal_amount: subtotalAmount,
    payment_method: params.paymentMethod,
    status: params.status,
    remarks: params.remarks?.trim() || null,
    receipt_number: receipt,
    payment_discount_id: filterTuitionDiscounts(orderedDiscounts)[0]?.id ?? null,
    payment_batch_id: batchId,
   })
   .select("id")
   .single()
  if (!e1) {
   paymentId = String((ins as { id: string }).id)
   break
  }
  if (isReceiptNumberUniqueViolation(e1) && attempt < RECEIPT_REF_ATTEMPTS - 1) continue
  throw e1
 }
 if (!paymentId) throw new Error("無法產生唯一單據編號，請稍後再試")

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

 if (discountApplications.length > 0) {
  const { error: e3 } = await supabase.from("payment_discount_applications").insert(
   discountApplications.map((app) => ({
    payment_id: paymentId,
    payment_discount_id: app.discountId,
    sort_order: app.sortOrder,
    amount_deducted: app.amountDeducted,
   }))
  )
  if (e3) throw e3
 }

 if (
  params.createReferralRecord &&
  params.referrerStudentId &&
  orderedDiscounts.some((d) => d.discountKind === "referral_referee")
 ) {
  const refereeDisc = orderedDiscounts.find((d) => d.discountKind === "referral_referee")
  const cashDisc = orderedDiscounts.find((d) => d.discountKind === "referral_referrer_cash")
  await insertReferralRecord({
   referrerStudentId: params.referrerStudentId,
   refereeStudentId: params.studentId,
   paymentId,
   refereeDiscountAmount: refereeDisc?.amountOff ?? 100,
   referrerRebateAmount: cashDisc?.amountOff ?? 100,
  })
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
 const { data: row, error: fetchErr } = await supabase
  .from("payments")
  .select("payment_date")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!row) throw new Error("找不到繳費紀錄")
 assertAcademicYearEditableForDate(String((row as { payment_date?: string }).payment_date ?? ""))
 if (patch.paymentDate !== undefined) assertAcademicYearEditableForDate(patch.paymentDate)
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
 const { data: row, error: fetchErr } = await supabase
  .from("payments")
  .select("payment_date")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!row) throw new Error("找不到繳費紀錄")
 assertAcademicYearEditableForDate(String((row as { payment_date?: string }).payment_date ?? ""))
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
  if (isBillableAttendanceStatus(s)) totalAttendedLessons += 1
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

/** 單一學生：attendance_details 中計為「計費出席」之堂數 */
export async function fetchTotalAttendedLessonsForStudent(studentId: string): Promise<number> {
 if (!supabase) return 0
 const { data, error } = await supabase.from("attendance_details").select("status").eq("student_id", studentId)
 if (error) throw error
 let total = 0
 for (const row of data ?? []) {
  const s = String((row as { status: unknown }).status ?? "")
  if (isBillableAttendanceStatus(s)) total += 1
 }
 return total
}

/** 單一學生最近繳費（依日期／建立時間；預設最多 3 筆） */
export async function fetchRecentPaymentsForStudent(
 studentId: string,
 limit = 3
): Promise<PaymentListRow[]> {
 const n = Math.min(Math.max(limit, 1), 10)
 return fetchPaymentsList({ studentId, limit: n })
}

/** 將待繳／待收款改為已收款；收據編號一律由系統產生 */
export async function markPaymentReceived(id: string, opts?: { paymentMethod?: string }): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: row, error: fetchErr } = await supabase
  .from("payments")
  .select("payment_date")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!row) throw new Error("找不到繳費紀錄")
 assertAcademicYearEditableForDate(String((row as { payment_date?: string }).payment_date ?? ""))
 for (let attempt = 0; attempt < RECEIPT_REF_ATTEMPTS; attempt++) {
  const receipt = await allocateReceiptRef("RC")
  const { error } = await supabase
   .from("payments")
   .update({
    status: PAYMENT_STATUS.received,
    receipt_number: receipt,
    ...(opts?.paymentMethod ? { payment_method: opts.paymentMethod } : {}),
    updated_at: new Date().toISOString(),
   })
   .eq("id", id)
  if (!error) return
  if (isReceiptNumberUniqueViolation(error) && attempt < RECEIPT_REF_ATTEMPTS - 1) continue
  throw error
 }
 throw new Error("無法產生唯一單據編號，請稍後再試")
}
