import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { evaluateDiscountAvailability } from "@/lib/paymentDiscountEligibility"
import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { computeDiscountApplicationsForSave } from "@/lib/paymentAmountBreakdown"
import {
 normalizeSpecialDiscountAmount,
 SPECIAL_DISCOUNT_LABEL,
} from "@/lib/paymentSpecialDiscount"
import { createPaymentBatch } from "@/services/paymentBatchQueries"
import { insertReferralRecord } from "@/services/referralQueries"
import { formatClassLabel, classDisplayName } from "@/lib/courseLabel"
import { LATE_FEE_AMOUNT } from "@/lib/tuitionLateFee"
import { supabase } from "@/lib/supabaseClient"
import type { TableUpdate } from "@/types/db"
import { forEachIdChunk } from "@/lib/supabaseInChunks"
import { isSoftArchiveQueriesEnabled } from "@/lib/softArchiveFlag"
import { paymentOpsListOrFilter } from "@/lib/softArchiveListScope"
import { fetchOpsAcademicYearWindow, headCountOrNull } from "@/services/softArchiveQueries"
import { pickStudentContactFromDbRow } from "@/lib/whatsappReminder"
import {
 applyDiscountsToSubtotal,
 applyFixedDiscountAmount,
 fetchActivePaymentDiscounts,
 fetchPaymentEligibilityContextFromDetails,
 filterTuitionDiscounts,
 isDiscountInEffect,
 mapPaymentDiscountRow,
 resolveDiscountIdsFromCatalog,
 validateDiscountSelection,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"
import {
 clawbackEntitlementsForPayment,
 topUpEntitlementsForPayment,
} from "@/services/entitlementQueries"

const METHOD_OPTIONS = [
 "現金",
 "轉數快",
 "信用卡",
 "支票",
 "PayMe",
 "八達通",
 "易辦事",
 "銀聯",
 "銀行轉帳",
 "內地支付寶",
 "香港支付寶",
 "微信支付",
 "其他",
] as const
export const PAYMENT_METHOD_PRESETS = [...METHOD_OPTIONS]

export const PAYMENT_STATUS = {
 received: "已收款",
 pendingPay: "待繳費",
 pendingReceive: "待收款",
 voided: "作廢",
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
 /** null＝Special discount（無目錄列） */
 discountId: string | null
 name: string
 percentOff: number | null
 amountOff: number | null
 amountDeducted: number | null
}

export type PaymentLateFeeFullRow = {
 id: string
 classId: string
 classLabel: string
 amount: number
 billingMonth: string
 waived: boolean
 waiverReason: string | null
}

export type PaymentFull = PaymentListRow & {
 subtotalAmount: number | null
 studentGrade: string | null
 details: PaymentDetailRow[]
 discountApplications: PaymentDiscountApplicationRow[]
 lateFeeItems: PaymentLateFeeFullRow[]
 /** @deprecated 請改用 discountApplications */
 discountPercentOff: number | null
 /** @deprecated 請改用 discountApplications */
 discountAmountOff: number | null
}

type DiscountCatalogMeta = {
 name: string
 percentOff: number | null
 amountOff: number | null
}

/** PostgREST embed 有時回 object、有時回單元素 array */
function embedOne(rel: unknown): Record<string, unknown> | null {
 if (rel == null) return null
 if (Array.isArray(rel)) {
  const first = rel[0]
  return first && typeof first === "object" ? (first as Record<string, unknown>) : null
 }
 if (typeof rel === "object") return rel as Record<string, unknown>
 return null
}

function mapDiscountApplicationRow(
 r: Record<string, unknown>,
 catalogById?: Map<string, DiscountCatalogMeta>
): PaymentDiscountApplicationRow | null {
 const disc = embedOne(r.payment_discounts)
 const amountDeducted = r.amount_deducted != null ? Number(r.amount_deducted) : null
 const rawDiscountId = r.payment_discount_id
 const catalogIdFromRow =
  rawDiscountId != null && String(rawDiscountId).trim() !== "" ? String(rawDiscountId) : null
 const catalogId = disc?.id != null ? String(disc.id) : catalogIdFromRow
 const catalogMeta = catalogId ? catalogById?.get(catalogId) : undefined

 // 目錄優惠：有 payment_discount_id → 一律用目錄原名，不可標成 Special discount
 if (catalogId) {
  const name =
   disc?.name != null
    ? String(disc.name)
    : catalogMeta?.name != null
      ? catalogMeta.name
      : "（目錄優惠）"
  return {
   sortOrder: Number(r.sort_order ?? 0),
   discountId: catalogId,
   name,
   percentOff:
    disc?.percent_off != null
     ? Number(disc.percent_off)
     : (catalogMeta?.percentOff ?? null),
   amountOff:
    disc?.amount_off != null ? Number(disc.amount_off) : (catalogMeta?.amountOff ?? null),
   amountDeducted,
  }
 }

 // Special discount：僅 payment_discount_id 為 null 的臨時減免
 if (amountDeducted != null && Number.isFinite(amountDeducted) && amountDeducted > 0) {
  return {
   sortOrder: Number(r.sort_order ?? 0),
   discountId: null,
   name: SPECIAL_DISCOUNT_LABEL,
   percentOff: null,
   amountOff: null,
   amountDeducted,
  }
 }
 return null
}

function discountNamesFromApplications(apps: PaymentDiscountApplicationRow[]): string | null {
 if (apps.length === 0) return null
 return [...apps]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((a) => a.name)
  .join("；")
}

function collectCatalogDiscountIdsFromPaymentRow(r: Record<string, unknown>): string[] {
 const ids: string[] = []
 if (r.payment_discount_id != null && String(r.payment_discount_id).trim() !== "") {
  ids.push(String(r.payment_discount_id))
 }
 const appRows = r.payment_discount_applications
 if (Array.isArray(appRows)) {
  for (const row of appRows) {
   if (!row || typeof row !== "object") continue
   const app = row as Record<string, unknown>
   if (app.payment_discount_id != null && String(app.payment_discount_id).trim() !== "") {
    ids.push(String(app.payment_discount_id))
    continue
   }
   const disc = embedOne(app.payment_discounts)
   if (disc?.id != null) ids.push(String(disc.id))
  }
 }
 return ids
}

async function fetchDiscountCatalogMetaByIds(
 ids: string[]
): Promise<Map<string, DiscountCatalogMeta>> {
 const map = new Map<string, DiscountCatalogMeta>()
 const unique = [...new Set(ids.filter((id) => id.trim() !== ""))]
 if (!supabase || unique.length === 0) return map
 const client = supabase
 const chunks = await forEachIdChunk(unique, 80, async (slice) => {
  const { data, error } = await client
   .from("payment_discounts")
   .select("id, name, percent_off, amount_off")
   .in("id", slice)
  if (error) throw error
  return data ?? []
 })
 for (const rows of chunks) {
  for (const row of rows) {
   const r = row as Record<string, unknown>
   const id = r.id != null ? String(r.id) : ""
   if (!id) continue
   map.set(id, {
    name: r.name != null ? String(r.name) : "（目錄優惠）",
    percentOff: r.percent_off != null ? Number(r.percent_off) : null,
    amountOff: r.amount_off != null ? Number(r.amount_off) : null,
   })
  }
 }
 return map
}

function mapListRow(
 r: Record<string, unknown>,
 catalogById?: Map<string, DiscountCatalogMeta>
): PaymentListRow {
 const st = embedOne(r.students) ?? (r.students as Record<string, unknown> | null)
 const disc = embedOne(r.payment_discounts)
 const appRows = r.payment_discount_applications as unknown
 const apps = Array.isArray(appRows)
  ? appRows
     .map((row) => mapDiscountApplicationRow(row as Record<string, unknown>, catalogById))
     .filter((x): x is PaymentDiscountApplicationRow => x != null)
  : []
 const fallbackId =
  r.payment_discount_id != null && String(r.payment_discount_id).trim() !== ""
   ? String(r.payment_discount_id)
   : null
 const fallbackName =
  disc?.name != null
   ? String(disc.name)
   : fallbackId
     ? (catalogById?.get(fallbackId)?.name ?? null)
     : null
 const discountName = discountNamesFromApplications(apps) ?? fallbackName
 const discountId = apps[0]?.discountId ?? fallbackId
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
 status?: "all" | "received" | "pending" | "pendingPay" | "pendingReceive" | "voided"
 fromYmd?: string
 toYmd?: string
 search?: string
 studentId?: string
 limit?: number
 offset?: number
 includeOlderYears?: boolean
 includeVoided?: boolean
}

export const PAYMENTS_PAGE_SIZE = 50

export type PaymentsPageResult = {
 rows: PaymentListRow[]
 hasMore: boolean
 hiddenOlderCount: number
 appliedFromYmd: string | null
}

/** 紀錄列表（含學生、優惠名稱） */
export async function fetchPaymentsList(filters: PaymentListFilters = {}): Promise<PaymentListRow[]> {
 const page = await fetchPaymentsPage(filters)
 return page.rows
}

/** 分頁紀錄列表 */
export async function fetchPaymentsPage(filters: PaymentListFilters = {}): Promise<PaymentsPageResult> {
 if (!supabase) return { rows: [], hasMore: false, hiddenOlderCount: 0, appliedFromYmd: null }
 const limit = Math.min(Math.max(filters.limit ?? PAYMENTS_PAGE_SIZE, 1), 800)
 const offset = Math.max(filters.offset ?? 0, 0)
 const includeOlder = Boolean(filters.includeOlderYears) || !isSoftArchiveQueriesEnabled()
 const includeVoided = Boolean(filters.includeVoided) || filters.status === "voided"
 const userFrom = (filters.fromYmd ?? "").trim().slice(0, 10) || null
 const userTo = (filters.toYmd ?? "").trim().slice(0, 10) || null
 const studentId = (filters.studentId ?? "").trim() || null
 const status = filters.status ?? "all"

 let appliedFromYmd: string | null = userFrom
 let opsDateOr: string | null = null
 let hiddenOlderCount = 0

 const applyOpsDefault =
  !includeOlder && !userFrom && !studentId && (status === "all" || status === "received")

 if (applyOpsDefault) {
  const window = await fetchOpsAcademicYearWindow()
  if (window?.startYmd) {
   appliedFromYmd = window.startYmd
   if (status === "all") {
    opsDateOr = paymentOpsListOrFilter({
     startYmd: window.startYmd,
     pendingPayStatus: PAYMENT_STATUS.pendingPay,
     pendingReceiveStatus: PAYMENT_STATUS.pendingReceive,
    })
   }
   if (offset === 0) {
    const olderQ = supabase
     .from("payments")
     .select("id", { count: "exact", head: true })
     .lt("payment_date", window.startYmd)
     .not(
      "status",
      "in",
      `(${PAYMENT_STATUS.pendingPay},${PAYMENT_STATUS.pendingReceive},${PAYMENT_STATUS.voided})`
     )
    const voidedQ = includeVoided
     ? null
     : supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", PAYMENT_STATUS.voided)
    const [olderCount, voidedCount] = await Promise.all([
     headCountOrNull(olderQ),
     voidedQ ? headCountOrNull(voidedQ) : Promise.resolve(0),
    ])
    if (olderCount == null || voidedCount == null) hiddenOlderCount = 0
    else hiddenOlderCount = olderCount + voidedCount
   }
  }
 } else if (!includeVoided && status === "all" && offset === 0) {
  const voidedCount = await headCountOrNull(
   supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", PAYMENT_STATUS.voided)
  )
  hiddenOlderCount = voidedCount ?? 0
 }

 let q = supabase
  .from("payments")
  .select(
   "id, student_id, receipt_number, payment_date, total_amount, payment_method, status, remarks, created_at, payment_discount_id, students ( full_name, student_code, whatsapp, student_phone, parent_phone, student_phone_country_code, parent_phone_country_code, primary_contact_person, student_preferred_contact_method, parent_preferred_contact_method, preferred_contact_method, student_wechat_id, parent_wechat_id ), payment_discounts ( name ), payment_discount_applications ( sort_order, amount_deducted, payment_discount_id, payment_discounts ( id, name, percent_off, amount_off ) )"
  )
  .order("payment_date", { ascending: false })
  .order("created_at", { ascending: false })
  .range(offset, offset + limit - 1)

 if (studentId) q = q.eq("student_id", studentId)
 if (opsDateOr && appliedFromYmd) {
  q = q.or(opsDateOr)
 } else if (appliedFromYmd) {
  q = q.gte("payment_date", appliedFromYmd)
 }
 if (userTo) q = q.lte("payment_date", userTo)

 if (status === "received") {
  q = q.eq("status", PAYMENT_STATUS.received)
 } else if (status === "pending") {
  q = q.in("status", [PAYMENT_STATUS.pendingPay, PAYMENT_STATUS.pendingReceive])
 } else if (status === "pendingPay") {
  q = q.eq("status", PAYMENT_STATUS.pendingPay)
 } else if (status === "pendingReceive") {
  q = q.eq("status", PAYMENT_STATUS.pendingReceive)
 } else if (status === "voided") {
  q = q.eq("status", PAYMENT_STATUS.voided)
 } else if (!includeVoided) {
  q = q.neq("status", PAYMENT_STATUS.voided)
 }

 const { data, error } = await q
 if (error) throw error
 const rawRows = (data ?? []) as Record<string, unknown>[]
 const catalogIds = rawRows.flatMap((row) => collectCatalogDiscountIdsFromPaymentRow(row))
 const catalogById = await fetchDiscountCatalogMetaByIds(catalogIds)
 let rows = rawRows.map((x) => mapListRow(x, catalogById))
 const s = filters.search?.trim().toLowerCase() ?? ""
 if (s) {
  rows = rows.filter((r) => {
   const hay =
    `${r.studentName} ${r.studentCode ?? ""} ${r.receiptNumber ?? ""} ${r.remarks ?? ""} ${r.discountName ?? ""}`.toLowerCase()
   return hay.includes(s)
  })
 }
 return { rows, hasMore: rows.length >= limit, hiddenOlderCount, appliedFromYmd }
}

/** 匯出用：逐頁拉至盡（核數可傳 includeOlderYears／includeVoided）。 */
export async function fetchPaymentsForExport(
 filters: PaymentListFilters
): Promise<PaymentListRow[]> {
 const all: PaymentListRow[] = []
 const limit = 800
 let offset = 0
 for (let i = 0; i < 40; i += 1) {
  const page = await fetchPaymentsPage({ ...filters, limit, offset })
  all.push(...page.rows)
  if (!page.hasMore) break
  offset += page.rows.length
 }
 return all
}

export async function fetchPaymentFull(id: string): Promise<PaymentFull | null> {
 if (!supabase) return null
 const { data: pay, error: e1 } = await supabase
  .from("payments")
  .select(
   "id, student_id, receipt_number, payment_date, total_amount, subtotal_amount, payment_method, status, remarks, created_at, payment_discount_id, students ( full_name, student_code, grade, whatsapp, student_phone, parent_phone, student_phone_country_code, parent_phone_country_code, primary_contact_person, student_preferred_contact_method, parent_preferred_contact_method, preferred_contact_method, student_wechat_id, parent_wechat_id ), payment_discounts ( name, percent_off, amount_off ), payment_discount_applications ( sort_order, amount_deducted, payment_discount_id, payment_discounts ( id, name, percent_off, amount_off ) )"
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

 const payRow = pay as Record<string, unknown>
 const catalogById = await fetchDiscountCatalogMetaByIds(
  collectCatalogDiscountIdsFromPaymentRow(payRow)
 )
 const base = mapListRow(payRow, catalogById)
 const st = embedOne(payRow.students) ?? (payRow.students as Record<string, unknown> | null)
 const studentGrade = st?.grade != null ? String(st.grade) : null
 const disc = embedOne(payRow.payment_discounts)
 const appRows = payRow.payment_discount_applications as unknown
 let discountApplications = Array.isArray(appRows)
  ? appRows
     .map((row) => mapDiscountApplicationRow(row as Record<string, unknown>, catalogById))
     .filter((x): x is PaymentDiscountApplicationRow => x != null)
  : []
 if (discountApplications.length === 0 && base.discountId) {
  const meta = catalogById.get(base.discountId)
  discountApplications = [
   {
    sortOrder: 0,
    discountId: base.discountId,
    name: disc?.name != null ? String(disc.name) : (meta?.name ?? "—"),
    percentOff:
     disc?.percent_off != null ? Number(disc.percent_off) : (meta?.percentOff ?? null),
    amountOff:
     disc?.amount_off != null ? Number(disc.amount_off) : (meta?.amountOff ?? null),
    amountDeducted: null,
   },
  ]
 }
 const subtotalAmount =
  payRow.subtotal_amount != null ? Number(payRow.subtotal_amount) : null
 const firstApp = discountApplications[0]

 let lateFeeItems: PaymentLateFeeFullRow[] = []
 try {
  const { data: lfRows, error: lfErr } = await supabase
   .from("payment_late_fee_items")
   .select(
    "id, class_id, amount, billing_month, waived, waiver_reason, classes ( subject, course_code_full, courses ( course_name ) )"
   )
   .eq("payment_id", id)
  if (lfErr) throw lfErr
  lateFeeItems = (lfRows ?? []).map((row) => {
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
    amount: Number(r.amount ?? 50),
    billingMonth: String(r.billing_month ?? ""),
    waived: Boolean(r.waived),
    waiverReason: r.waiver_reason != null ? String(r.waiver_reason) : null,
   }
  })
 } catch (e) {
  // 表未套用 migration 時唔阻舊單讀取
  console.warn("[fetchPaymentFull] late fee items", e)
  lateFeeItems = []
 }

 return {
  ...base,
  subtotalAmount,
  studentGrade,
  details,
  discountApplications,
  lateFeeItems,
  discountPercentOff: firstApp?.percentOff ?? (disc?.percent_off != null ? Number(disc.percent_off) : null),
  discountAmountOff: firstApp?.amountOff ?? (disc?.amount_off != null ? Number(disc.amount_off) : null),
 }
}

export type PaymentDetailInput = {
 classId: string | null
 lessonCount: number | null
 amount: number | null
 description: string | null
 monthlyTuitionChargeId?: string | null
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
 /** Special discount 減免定金額（HKD）；不寫入優惠目錄 */
 specialDiscountAmount?: number | null
 /** 逾期罰款列（獨立表；唔入折扣基數） */
 lateFeeItems?: Array<{
  classId: string
  amount?: number
  billingMonth: string
  waived: boolean
  waiverReason?: string | null
 }>
}): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (params.status === PAYMENT_STATUS.pendingPay) {
  throw new Error(
   "已停用「待繳費」出單；請改用已收款或待收款，或以文字提醒家長繳付下期學費。"
  )
 }
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
 const specialAmount = normalizeSpecialDiscountAmount(params.specialDiscountAmount ?? 0)

 let orderedDiscounts: PaymentDiscountRow[] = []
 let discountApplications: Array<{
  discountId: string | null
  sortOrder: number
  amountDeducted: number
 }> = []
 let afterCatalog = subtotalAmount

 if (discountIds.length > 0) {
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
  afterCatalog = applyDiscountsToSubtotal(subtotalAmount, orderedDiscounts, eligibilityCtx)
 }

 if (specialAmount > 0) {
  if (specialAmount > afterCatalog + 0.01) {
   throw new Error(`${SPECIAL_DISCOUNT_LABEL} 不可大於剩餘應收金額`)
  }
  discountApplications.push({
   discountId: null,
   sortOrder: discountApplications.length,
   amountDeducted: specialAmount,
  })
 }

 const lateFeeItems = params.lateFeeItems ?? []
 for (const lf of lateFeeItems) {
  if (!lf.classId?.trim()) throw new Error("逾期罰款缺少班別")
  if (!/^\d{4}-\d{2}$/.test(lf.billingMonth.trim())) {
   throw new Error("逾期罰款 billing_month 格式無效")
  }
  if (lf.waived) {
   const reason = String(lf.waiverReason ?? "").trim()
   if (!reason) throw new Error("豁免逾期罰款必須填寫原因")
  }
 }
 const lateFeeTotal = lateFeeItems.reduce((sum, lf) => {
  if (lf.waived) return sum
  const amt = lf.amount != null && Number.isFinite(lf.amount) ? Number(lf.amount) : LATE_FEE_AMOUNT
  return sum + (amt > 0 ? amt : 0)
 }, 0)
 const tuitionAfterDiscounts = applyFixedDiscountAmount(afterCatalog, specialAmount)
 const expectedTotal = Math.round((tuitionAfterDiscounts + lateFeeTotal) * 100) / 100
 if (Math.abs(expectedTotal - totalAmount) > 0.01) {
  if (discountIds.length === 0 && specialAmount <= 0 && lateFeeItems.length === 0) {
   throw new Error("應繳總額與項目小計不一致")
  }
  throw new Error("應繳總額與優惠／罰款試算結果不一致，請重新整理後再試")
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
    monthly_tuition_charge_id: d.monthlyTuitionChargeId ?? null,
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

 if (lateFeeItems.length > 0) {
  const { error: eLf } = await supabase.from("payment_late_fee_items").insert(
   lateFeeItems.map((lf) => ({
    payment_id: paymentId,
    class_id: lf.classId,
    amount: lf.amount != null && Number.isFinite(lf.amount) ? Number(lf.amount) : LATE_FEE_AMOUNT,
    billing_month: lf.billingMonth.trim(),
    waived: lf.waived,
    waiver_reason: lf.waived ? String(lf.waiverReason ?? "").trim() : null,
   }))
  )
  if (eLf) throw eLf
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

 if (params.status === PAYMENT_STATUS.received) {
  await topUpEntitlementsForPayment({
   paymentId,
   studentId: params.studentId,
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
  .select("payment_date, status")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!row) throw new Error("找不到繳費紀錄")
 const currentStatus = String((row as { status?: string }).status ?? "")
 if (currentStatus === PAYMENT_STATUS.voided) {
  throw new Error("已作廢單據不可修改。")
 }
 if (patch.status === PAYMENT_STATUS.voided) {
  throw new Error("請使用「作廢」流程，不可直接將狀態改為作廢。")
 }
 assertAcademicYearEditableForDate(String((row as { payment_date?: string }).payment_date ?? ""))
 if (patch.paymentDate !== undefined) assertAcademicYearEditableForDate(patch.paymentDate)
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if (patch.status !== undefined) payload.status = patch.status
 if (patch.paymentMethod !== undefined) payload.payment_method = patch.paymentMethod
 if (patch.paymentDate !== undefined) payload.payment_date = patch.paymentDate
 if (patch.receiptNumber !== undefined) payload.receipt_number = patch.receiptNumber
 if (patch.remarks !== undefined) payload.remarks = patch.remarks
 if (patch.totalAmount !== undefined) payload.total_amount = patch.totalAmount
 const { error } = await supabase.from("payments").update(payload as TableUpdate<"payments">).eq("id", id).neq("status", PAYMENT_STATUS.voided)
 if (error) throw error
}

/** @deprecated 已禁止硬刪；請改用 voidPaymentRecord */
export async function deletePaymentRecord(_id: string): Promise<void> {
 throw new Error("已禁止刪除單據；請使用「作廢」流程保留操作紀錄。")
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
  .select("payment_date, status, student_id")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!row) throw new Error("找不到繳費紀錄")
 const status = String((row as { status?: string }).status ?? "")
 if (status === PAYMENT_STATUS.voided) {
  throw new Error("已作廢單據不可標記為已收款。")
 }
 if (status !== PAYMENT_STATUS.pendingPay && status !== PAYMENT_STATUS.pendingReceive) {
  throw new Error("僅待繳費／待收款單據可標記為已收款。")
 }
 assertAcademicYearEditableForDate(String((row as { payment_date?: string }).payment_date ?? ""))
 let updated = false
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
   .in("status", [PAYMENT_STATUS.pendingPay, PAYMENT_STATUS.pendingReceive])
  if (!error) {
   updated = true
   break
  }
  if (isReceiptNumberUniqueViolation(error) && attempt < RECEIPT_REF_ATTEMPTS - 1) continue
  throw error
 }
 if (!updated) throw new Error("無法產生唯一單據編號，請稍後再試")

 const studentId = String((row as { student_id?: string }).student_id ?? "")
 if (studentId) {
  await topUpEntitlementsForPayment({ paymentId: id, studentId })
 }
}

export type VoidPaymentResult =
 | {
    ok: true
    alreadyVoided: boolean
    emailSent: boolean
    emailError: string | null
    receiptNumber: string | null
    previousStatus: string
    notifySkipped?: boolean
   }
 | { ok: false; message: string }

async function readVoidPaymentError(error: unknown, response?: Response): Promise<string | null> {
 const res = response ?? (error as { context?: Response } | null)?.context
 if (!res || typeof res.json !== "function") return null
 try {
  const body = (await res.clone().json()) as { error?: unknown }
  if (typeof body.error === "string" && body.error.trim()) return body.error.trim()
 } catch {
  // ignore
 }
 return null
}

/** 作廢單據（密碼二次確認 + 伺服端連動轉介／月費；已收款會電郵通知管理層） */
export async function voidPaymentRecord(input: {
 paymentId: string
 reason: string
 password: string
 secondConfirmerEmail?: string
 secondConfirmerPassword?: string
}): Promise<VoidPaymentResult> {
 if (!supabase) return { ok: false, message: "尚未設定 Supabase，暫時無法作廢。" }

 const { data: row, error: fetchErr } = await supabase
  .from("payments")
  .select("payment_date, status, student_id")
  .eq("id", input.paymentId)
  .maybeSingle()
 if (fetchErr) return { ok: false, message: fetchErr.message }
 if (!row) return { ok: false, message: "找不到繳費紀錄。" }
 const paymentDate = String((row as { payment_date?: string }).payment_date ?? "")
 try {
  assertAcademicYearEditableForDate(paymentDate)
 } catch (e) {
  return { ok: false, message: e instanceof Error ? e.message : String(e) }
 }
 if (String((row as { status?: string }).status ?? "") === PAYMENT_STATUS.voided) {
  return {
   ok: true,
   alreadyVoided: true,
   emailSent: false,
   emailError: null,
   receiptNumber: null,
   previousStatus: PAYMENT_STATUS.voided,
  }
 }

 const { data, error, response } = await supabase.functions.invoke("void-payment", {
  body: {
   paymentId: input.paymentId,
   reason: input.reason.trim(),
   password: input.password,
   ...(input.secondConfirmerEmail
    ? {
       secondConfirmerEmail: input.secondConfirmerEmail.trim(),
       secondConfirmerPassword: input.secondConfirmerPassword ?? "",
      }
    : {}),
  },
 })

 if (error) {
  const detail = await readVoidPaymentError(error, response)
  return { ok: false, message: detail ?? (error instanceof Error ? error.message : String(error)) }
 }
 if (!data || typeof data !== "object") {
  return { ok: false, message: "作廢失敗：伺服器回覆格式異常。" }
 }
 const payload = data as Record<string, unknown>
 if (payload.ok !== true) {
  const message =
   typeof payload.error === "string" && payload.error.trim()
    ? payload.error.trim()
    : "作廢失敗，請稍後再試。"
  return { ok: false, message }
 }

 const studentId = String((row as { student_id?: string }).student_id ?? "")
 if (studentId && !payload.alreadyVoided) {
  try {
   await clawbackEntitlementsForPayment({
    paymentId: input.paymentId,
    studentId,
   })
  } catch (e) {
   console.error("[voidPaymentRecord] entitlement clawback failed", e)
   return {
    ok: false,
    message:
     e instanceof Error
      ? `單據已作廢，但已繳堂數收回失敗：${e.message}`
      : "單據已作廢，但已繳堂數收回失敗。",
   }
  }
 }

 return {
  ok: true,
  alreadyVoided: Boolean(payload.alreadyVoided),
  emailSent: Boolean(payload.emailSent),
  emailError: typeof payload.emailError === "string" ? payload.emailError : null,
  receiptNumber: payload.receiptNumber != null ? String(payload.receiptNumber) : null,
  previousStatus: payload.previousStatus != null ? String(payload.previousStatus) : "",
  notifySkipped: Boolean(payload.notifySkipped),
 }
}
