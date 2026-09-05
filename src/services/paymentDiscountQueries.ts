import {
 groupEnrollmentRulesToDb,
 isLessonTierKind,
 isTuitionDiscountKind,
 lessonTiersToDb,
 parseDiscountKind,
 parseGroupEnrollmentRules,
 parseLessonTiers,
 type DiscountKind,
 type GroupEnrollmentRules,
 type LessonTiersConfig,
} from "@/lib/paymentDiscountKinds"
import {
 buildPaymentEligibilityContext,
 eligibilityRulesToDb,
 parseEligibilityRules,
 resolveDiscountAmountOff,
 type PaymentDiscountEligibilityRules,
 type PaymentEligibilityContext,
} from "@/lib/paymentDiscountEligibility"
import { joinMultiValueField, parseMultiValueField } from "@/lib/multiValueField"
import { supabase } from "@/lib/supabaseClient"

export { parseMultiValueField, joinMultiValueField }

export function academicYearsFromDiscount(d: Pick<PaymentDiscountRow, "academicYear">): string[] {
 return parseMultiValueField(d.academicYear)
}

export function stackGroupsFromDiscount(d: Pick<PaymentDiscountRow, "stackGroup">): string[] {
 return parseMultiValueField(d.stackGroup)
}

export type PaymentDiscountRow = {
 id: string
 name: string
 description: string | null
 discountKind: DiscountKind
 percentOff: number | null
 amountOff: number | null
 isActive: boolean
 sortOrder: number
 validFrom: string | null
 validTo: string | null
 academicYear: string | null
 stackGroup: string | null
 maxStackCount: number | null
 isLabelOnly: boolean
 lessonTiers: LessonTiersConfig | null
 groupEnrollmentRules: GroupEnrollmentRules | null
 eligibilityRules: PaymentDiscountEligibilityRules | null
 createdAt: string
 updatedAt: string
}

export type PaymentDiscountUsageStats = {
 discountId: string
 applicationCount: number
 totalDeducted: number
}

export type FetchActivePaymentDiscountsOptions = {
 /** YYYY-MM-DD；預設為今日 */
 asOfDate?: string
 /** 學年 label（如 2526）；null 表示不篩選 */
 academicYear?: string | null
}

const EXTENDED_SCHEMA_MIGRATION_HINT =
 "資料庫尚未套用優惠類型欄位（discount_kind／lesson_tiers／group_enrollment_rules）。請於 Supabase SQL Editor 執行 supabase/migrations/20260615130000_payment_discount_26sm_kinds.sql。"

const DESCRIPTION_SCHEMA_MIGRATION_HINT =
 "資料庫尚未套用優惠簡介欄位（description）。請於 Supabase SQL Editor 執行 supabase/migrations/20260613160000_payment_discount_description.sql。"

let extendedDiscountSchema: boolean | null = null
let discountDescriptionSchema: boolean | null = null

/** 遠端 DB 是否已有 discount_kind 等擴充欄位（快取） */
export async function hasExtendedDiscountSchema(): Promise<boolean> {
 if (extendedDiscountSchema != null) return extendedDiscountSchema
 if (!supabase) {
  extendedDiscountSchema = false
  return false
 }
 const { error } = await supabase.from("payment_discounts").select("discount_kind").limit(1)
 extendedDiscountSchema = !error?.message?.includes("discount_kind")
 return extendedDiscountSchema
}

/** 遠端 DB 是否已有 description 欄位（快取） */
export async function hasDiscountDescriptionSchema(): Promise<boolean> {
 if (discountDescriptionSchema != null) return discountDescriptionSchema
 if (!supabase) {
  discountDescriptionSchema = false
  return false
 }
 const { error } = await supabase.from("payment_discounts").select("description").limit(1)
 discountDescriptionSchema = !error?.message?.includes("description")
 return discountDescriptionSchema
}

function assertDescriptionSchema(description: string | null | undefined, hasSchema: boolean): void {
 if (!description?.trim() || hasSchema) return
 throw new Error(DESCRIPTION_SCHEMA_MIGRATION_HINT)
}

function descriptionPayloadValue(
 description: string | null | undefined,
 hasSchema: boolean
): string | null | undefined {
 if (!hasSchema) return undefined
 return description?.trim() || null
}

function assertExtendedSchemaForKind(row: Partial<PaymentDiscountWriteInput>, extended: boolean): void {
 if (extended) return
 const kind = row.discountKind ?? "fixed_amount"
 if (kind !== "fixed_amount") {
  throw new Error(EXTENDED_SCHEMA_MIGRATION_HINT)
 }
 if (row.lessonTiers != null || row.groupEnrollmentRules != null) {
  throw new Error(EXTENDED_SCHEMA_MIGRATION_HINT)
 }
}

function appendExtendedDiscountFields(
 payload: Record<string, unknown>,
 row: Partial<PaymentDiscountWriteInput>,
 extended: boolean
): void {
 if (!extended) return
 if (row.discountKind !== undefined) payload.discount_kind = row.discountKind
 if (row.lessonTiers !== undefined) payload.lesson_tiers = lessonTiersToDb(row.lessonTiers)
 if (row.groupEnrollmentRules !== undefined) {
  payload.group_enrollment_rules = groupEnrollmentRulesToDb(row.groupEnrollmentRules)
 }
}

export function mapPaymentDiscountRow(r: Record<string, unknown>): PaymentDiscountRow {
 const percentOff = r.percent_off != null ? Number(r.percent_off) : null
 const amountOff = r.amount_off != null ? Number(r.amount_off) : null
 const discountKind = parseDiscountKind(r.discount_kind)
 const explicitLabelOnly = Boolean(r.is_label_only ?? false)
 const isLabelOnly =
  explicitLabelOnly ||
  discountKind === "referral_referrer_cash" ||
  (discountKind === "fixed_amount" &&
   (percentOff == null || percentOff === 0) &&
   (amountOff == null || amountOff === 0))
 return {
  id: String(r.id),
  name: String(r.name ?? ""),
  description: r.description != null ? String(r.description).trim() || null : null,
  discountKind,
  percentOff,
  amountOff,
  isActive: Boolean(r.is_active ?? true),
  sortOrder: Number(r.sort_order ?? 0),
  validFrom: r.valid_from != null ? String(r.valid_from).slice(0, 10) : null,
  validTo: r.valid_to != null ? String(r.valid_to).slice(0, 10) : null,
  academicYear: r.academic_year != null ? String(r.academic_year) : null,
  stackGroup: r.stack_group != null ? String(r.stack_group).trim() || null : null,
  maxStackCount: r.max_stack_count != null ? Number(r.max_stack_count) : null,
  isLabelOnly,
  lessonTiers: parseLessonTiers(r.lesson_tiers),
  groupEnrollmentRules: parseGroupEnrollmentRules(r.group_enrollment_rules),
  eligibilityRules: parseEligibilityRules(r.eligibility_rules),
  createdAt: String(r.created_at ?? ""),
  updatedAt: String(r.updated_at ?? ""),
 }
}

function todayYmd(): string {
 return new Date().toISOString().slice(0, 10)
}

/** 優惠是否在指定日期／學年有效（不含 is_active） */
export function isDiscountInEffect(
 d: PaymentDiscountRow,
 opts?: { asOfDate?: string; academicYear?: string | null }
): boolean {
 const asOf = opts?.asOfDate ?? todayYmd()
 if (d.validFrom && asOf < d.validFrom) return false
 if (d.validTo && asOf > d.validTo) return false
 const years = academicYearsFromDiscount(d)
 if (years.length > 0 && opts?.academicYear && !years.includes(opts.academicYear)) return false
 return true
}

export function orderDiscountsBySortOrder(discounts: PaymentDiscountRow[]): PaymentDiscountRow[] {
 return [...discounts].sort(
  (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-Hant")
 )
}

/** 依目錄 sort_order 排序已選優惠（非勾選順序） */
export function resolveSelectedDiscounts(
 discountIds: string[],
 catalog: PaymentDiscountRow[]
): PaymentDiscountRow[] {
 const byId = new Map(catalog.map((d) => [d.id, d]))
 const selected = discountIds
  .map((id) => byId.get(id))
  .filter((d): d is PaymentDiscountRow => d != null)
 return orderDiscountsBySortOrder(selected)
}

/** 從啟用目錄取得每單最多可選優惠數（取各項 max_stack_count 最小值；皆空則不限） */
export function getGlobalMaxStackCount(catalog: PaymentDiscountRow[]): number | null {
 const limits = catalog
  .map((d) => d.maxStackCount)
  .filter((n): n is number => n != null && Number.isFinite(n) && n > 0)
 if (limits.length === 0) return null
 return Math.min(...limits)
}

/** 驗證優惠選取是否符合互斥／疊加上限 */
export function validateDiscountSelection(
 selected: PaymentDiscountRow[],
 catalog: PaymentDiscountRow[]
): string | null {
 const seenGroups = new Set<string>()
 for (const d of selected) {
  for (const group of stackGroupsFromDiscount(d)) {
   if (seenGroups.has(group)) {
    return `互斥群組「${group}」只能選一項優惠`
   }
   seenGroups.add(group)
  }
 }
 const maxStack = getGlobalMaxStackCount(catalog)
 if (maxStack != null && selected.length > maxStack) {
  return `每單最多可選 ${maxStack} 項優惠`
 }
 return null
}

export type PaymentDiscountWriteInput = {
 name: string
 description?: string | null
 discountKind?: DiscountKind
 percentOff: number | null
 amountOff: number | null
 isActive: boolean
 sortOrder: number
 validFrom?: string | null
 validTo?: string | null
 academicYear?: string | null
 stackGroup?: string | null
 maxStackCount?: number | null
 isLabelOnly?: boolean
 lessonTiers?: LessonTiersConfig | null
 groupEnrollmentRules?: GroupEnrollmentRules | null
 eligibilityRules?: PaymentDiscountEligibilityRules | null
}

function writePayload(
 row: PaymentDiscountWriteInput,
 extended: boolean,
 hasDescription: boolean
): Record<string, unknown> {
 const percentOff = row.percentOff
 const amountOff = row.amountOff
 const discountKind = row.discountKind ?? "fixed_amount"
 const isLabelOnly =
  row.isLabelOnly ??
  (discountKind === "referral_referrer_cash" ||
   (discountKind === "fixed_amount" &&
    (percentOff == null || percentOff === 0) &&
    (amountOff == null || amountOff === 0)))
 const payload: Record<string, unknown> = {
  name: row.name.trim(),
  percent_off: percentOff,
  amount_off: amountOff,
  is_active: row.isActive,
  sort_order: row.sortOrder,
  valid_from: row.validFrom?.trim() || null,
  valid_to: row.validTo?.trim() || null,
  academic_year: joinMultiValueField(parseMultiValueField(row.academicYear)),
  stack_group: joinMultiValueField(parseMultiValueField(row.stackGroup)),
  max_stack_count: row.maxStackCount ?? null,
  is_label_only: isLabelOnly,
  eligibility_rules: eligibilityRulesToDb(row.eligibilityRules),
 }
 const description = descriptionPayloadValue(row.description, hasDescription)
 if (description !== undefined) payload.description = description
 appendExtendedDiscountFields(
  payload,
  {
   discountKind,
   lessonTiers: row.lessonTiers,
   groupEnrollmentRules: row.groupEnrollmentRules,
  },
  extended
 )
 return payload
}

function filterActiveDiscountRows(
 rows: PaymentDiscountRow[],
 opts?: FetchActivePaymentDiscountsOptions
): PaymentDiscountRow[] {
 const asOf = opts?.asOfDate ?? todayYmd()
 const academicYear = opts?.academicYear ?? null
 return rows.filter((d) => d.isActive && isDiscountInEffect(d, { asOfDate: asOf, academicYear }))
}

/** 繳費表單載入：啟用中優惠；有效期／學年由 UI 再過濾，不在範圍者不顯示 */
export async function fetchPaymentFormDiscounts(): Promise<PaymentDiscountRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payment_discounts")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true })
  .order("name", { ascending: true })
 if (error) throw error
 return (data ?? []).map((x) => mapPaymentDiscountRow(x as Record<string, unknown>))
}

/** 繳費表單用：啟用中且在有效期／學年內的優惠，依 sort_order */
export async function fetchActivePaymentDiscounts(
 opts?: FetchActivePaymentDiscountsOptions
): Promise<PaymentDiscountRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payment_discounts")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true })
  .order("name", { ascending: true })
 if (error) throw error
 const rows = (data ?? []).map((x) => mapPaymentDiscountRow(x as Record<string, unknown>))
 return filterActiveDiscountRows(rows, opts)
}

/** 外星人：全部（含停用） */
export async function fetchAllPaymentDiscounts(): Promise<PaymentDiscountRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payment_discounts")
  .select("*")
  .order("sort_order", { ascending: true })
  .order("name", { ascending: true })
 if (error) throw error
 return (data ?? []).map((x) => mapPaymentDiscountRow(x as Record<string, unknown>))
}

export async function insertPaymentDiscount(row: PaymentDiscountWriteInput): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const [extended, hasDescription] = await Promise.all([
  hasExtendedDiscountSchema(),
  hasDiscountDescriptionSchema(),
 ])
 assertExtendedSchemaForKind(row, extended)
 assertDescriptionSchema(row.description, hasDescription)
 const { error } = await supabase
  .from("payment_discounts")
  .insert(writePayload(row, extended, hasDescription))
 if (error) throw error
}

export async function updatePaymentDiscount(
 id: string,
 patch: Partial<PaymentDiscountWriteInput>
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const [extended, hasDescription] = await Promise.all([
  hasExtendedDiscountSchema(),
  hasDiscountDescriptionSchema(),
 ])
 assertExtendedSchemaForKind(patch, extended)
 assertDescriptionSchema(patch.description, hasDescription)
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if (patch.name !== undefined) payload.name = patch.name.trim()
 const description = descriptionPayloadValue(patch.description, hasDescription)
 if (description !== undefined) payload.description = description
 if (patch.percentOff !== undefined) payload.percent_off = patch.percentOff
 if (patch.amountOff !== undefined) payload.amount_off = patch.amountOff
 if (patch.isActive !== undefined) payload.is_active = patch.isActive
 if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder
 if (patch.validFrom !== undefined) payload.valid_from = patch.validFrom?.trim() || null
 if (patch.validTo !== undefined) payload.valid_to = patch.validTo?.trim() || null
 if (patch.academicYear !== undefined) {
  payload.academic_year = joinMultiValueField(parseMultiValueField(patch.academicYear))
 }
 if (patch.stackGroup !== undefined) {
  payload.stack_group = joinMultiValueField(parseMultiValueField(patch.stackGroup))
 }
 if (patch.maxStackCount !== undefined) payload.max_stack_count = patch.maxStackCount
 if (patch.isLabelOnly !== undefined) payload.is_label_only = patch.isLabelOnly
 appendExtendedDiscountFields(payload, patch, extended)
 if (patch.eligibilityRules !== undefined) {
  payload.eligibility_rules = eligibilityRulesToDb(patch.eligibilityRules)
 }
 if (patch.percentOff !== undefined || patch.amountOff !== undefined || patch.isLabelOnly !== undefined) {
  const percentOff = patch.percentOff
  const amountOff = patch.amountOff
  if (patch.isLabelOnly === undefined) {
   payload.is_label_only =
    (percentOff == null || percentOff === 0) && (amountOff == null || amountOff === 0)
  }
 }
 const { error } = await supabase.from("payment_discounts").update(payload).eq("id", id)
 if (error) throw error
}

export async function deletePaymentDiscount(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("payment_discounts").delete().eq("id", id)
 if (error) throw error
}

/** 優惠被繳費單引用次數 */
export async function fetchDiscountApplicationCount(discountId: string): Promise<number> {
 if (!supabase) return 0
 const { data, error } = await supabase
  .from("payment_discount_applications")
  .select("id, payments!inner ( status )")
  .eq("payment_discount_id", discountId)
  .neq("payments.status", "作廢")
 if (error) throw error
 return (data ?? []).length
}

/** 各優惠引用次數與累計減免 */
export async function fetchDiscountUsageStats(): Promise<PaymentDiscountUsageStats[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payment_discount_applications")
  .select("payment_discount_id, amount_deducted, payments!inner ( status )")
  .neq("payments.status", "作廢")
 if (error) throw error
 const byId = new Map<string, PaymentDiscountUsageStats>()
 for (const row of data ?? []) {
  const r = row as { payment_discount_id: unknown; amount_deducted: unknown }
  const id = String(r.payment_discount_id)
  const prev = byId.get(id) ?? { discountId: id, applicationCount: 0, totalDeducted: 0 }
  prev.applicationCount += 1
  const deducted = r.amount_deducted != null ? Number(r.amount_deducted) : 0
  if (Number.isFinite(deducted) && deducted > 0) prev.totalDeducted += deducted
  byId.set(id, prev)
 }
 for (const stat of byId.values()) {
  stat.totalDeducted = Math.round(stat.totalDeducted * 100) / 100
 }
 return [...byId.values()]
}

export async function batchUpdateDiscountSortOrders(
 updates: Array<{ id: string; sortOrder: number }>
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const now = new Date().toISOString()
 for (const { id, sortOrder } of updates) {
  const { error } = await supabase
   .from("payment_discounts")
   .update({ sort_order: sortOrder, updated_at: now })
   .eq("id", id)
  if (error) throw error
 }
}

/** 從已查詢的 catalog 解析選取優惠（依 sort_order） */
export function resolveDiscountIdsFromCatalog(
 discountIds: string[],
 catalog: PaymentDiscountRow[]
): PaymentDiscountRow[] {
 const byId = new Map(catalog.map((d) => [d.id, d]))
 const missing = discountIds.filter((id) => !byId.has(id))
 if (missing.length > 0) {
  throw new Error("部分優惠不存在或已刪除，請重新整理後再試")
 }
 const ordered = orderDiscountsBySortOrder(discountIds.map((id) => byId.get(id)!))
 for (const d of ordered) {
  if (!d.isActive) throw new Error(`優惠「${d.name}」已停用，無法套用`)
 }
 return ordered
}

/** 由套用紀錄重建計算用 PaymentDiscountRow（歷史單據） */
export function discountRowFromApplication(
 app: {
  discountId: string | null
  name: string
  percentOff: number | null
  amountOff: number | null
 },
 sortOrder = 0
): PaymentDiscountRow {
 const percentOff = app.percentOff
 const amountOff = app.amountOff
 return {
  id: app.discountId ?? "special-discount",
  name: app.name,
  description: null,
  percentOff,
  amountOff,
  isActive: true,
  sortOrder,
  validFrom: null,
  validTo: null,
  academicYear: null,
  stackGroup: null,
  maxStackCount: null,
  discountKind: "fixed_amount",
  isLabelOnly:
   (percentOff == null || percentOff === 0) && (amountOff == null || amountOff === 0),
  lessonTiers: null,
  groupEnrollmentRules: null,
  eligibilityRules: null,
  createdAt: "",
  updatedAt: "",
 }
}

export function filterTuitionDiscounts(discounts: PaymentDiscountRow[]): PaymentDiscountRow[] {
 return discounts.filter((d) => isTuitionDiscountKind(d.discountKind))
}

/** 後端：由 payment_details 輸入建立資格上下文 */
export async function fetchPaymentEligibilityContextFromDetails(
 details: Array<{ classId: string | null; lessonCount: number | null }>,
 opts?: {
  siblingExtraLessons?: number
  isNewStudent?: boolean
  batchMemberCount?: number
  batchSharedClassId?: string | null
  referrerStudentId?: string | null
 }
): Promise<PaymentEligibilityContext> {
 if (!supabase) {
  return { subjectCount: 0, totalLessons: 0, tierTotalLessons: 0, subjectCodes: [], subjectCategories: [], lines: [] }
 }
 const classIds = [
  ...new Set(
   details
    .map((d) => d.classId?.trim())
    .filter((id): id is string => Boolean(id))
  ),
 ]
 if (classIds.length === 0) {
  return { subjectCount: 0, totalLessons: 0, tierTotalLessons: 0, subjectCodes: [], subjectCategories: [], lines: [] }
 }
 const { data, error } = await supabase
  .from("classes")
  .select(
   "id, teacher_id, day_of_week, time_slot, courses ( course_mode, subjects ( code ) )"
  )
  .in("id", classIds)
 if (error) throw error
 const metaByClassId = new Map<string, Record<string, unknown>>()
 for (const row of data ?? []) {
  metaByClassId.set(String((row as { id: unknown }).id), row as Record<string, unknown>)
 }
 return buildPaymentEligibilityContext(
  details.map((d) => ({
   classId: d.classId ?? "",
   lessons: d.lessonCount ?? 0,
  })),
  (classId) => {
   const r = metaByClassId.get(classId)
   if (!r) return null
   const course = r.courses as Record<string, unknown> | null
   const subject = course?.subjects as Record<string, unknown> | null
   return {
    subjectCode: subject?.code != null ? String(subject.code) : null,
    subjectCategory: subject?.category != null ? String(subject.category) : null,
    courseMode: course?.course_mode != null ? String(course.course_mode) : "regular",
    teacherId: r.teacher_id != null ? String(r.teacher_id) : null,
    timeSlot: r.time_slot != null ? String(r.time_slot) : null,
    dayOfWeek: r.day_of_week != null ? String(r.day_of_week) : null,
    enrollmentPeriod: "兩期全報",
   }
  },
  opts
 )
}

/** 套用單項固定減免（含階梯解析後金額） */
export function applyFixedDiscountAmount(subtotal: number, amountOff: number): number {
 if (subtotal <= 0 || amountOff <= 0) return Math.round(subtotal * 100) / 100
 return Math.round(Math.max(0, subtotal - amountOff) * 100) / 100
}

/** 套用優惠：先百分比再固定減免；四捨五入至 2 位小數 */
export function applyDiscountToSubtotal(
 subtotal: number,
 d: PaymentDiscountRow | null,
 ctx?: PaymentEligibilityContext,
 amountOverride?: number
): number {
 if (!d || subtotal <= 0) return Math.round(subtotal * 100) / 100
 const fixedAmount =
  amountOverride ??
  (ctx != null ? resolveDiscountAmountOff(d, ctx) : d.amountOff ?? 0)
 if (d.isLabelOnly && fixedAmount <= 0) return Math.round(subtotal * 100) / 100
 let t = subtotal
 if (d.percentOff != null && d.percentOff > 0 && !isLessonTierKind(d.discountKind)) {
  t = t * (1 - Math.min(100, d.percentOff) / 100)
 }
 if (fixedAmount > 0) {
  t = Math.max(0, t - fixedAmount)
 }
 return Math.round(t * 100) / 100
}

/** 依序套用多項學費優惠（不含現金回贈類） */
export function applyDiscountsToSubtotal(
 subtotal: number,
 discounts: PaymentDiscountRow[],
 ctx?: PaymentEligibilityContext
): number {
 let t = subtotal
 const tuition = filterTuitionDiscounts(orderDiscountsBySortOrder(discounts))
 for (const d of tuition) {
  t = applyDiscountToSubtotal(t, d, ctx)
 }
 return Math.round(t * 100) / 100
}

export function computeDiscountApplicationsForContext(
 subtotal: number,
 discounts: PaymentDiscountRow[],
 ctx: PaymentEligibilityContext
): Array<{ discountId: string; sortOrder: number; amountDeducted: number }> {
 let running = subtotal
 const tuition = filterTuitionDiscounts(orderDiscountsBySortOrder(discounts))
 return tuition.map((d, sortOrder) => {
  const before = running
  const after = applyDiscountToSubtotal(before, d, ctx)
  const amountDeducted = Math.round((before - after) * 100) / 100
  running = after
  return { discountId: d.id, sortOrder, amountDeducted }
 })
}

/** 判斷優惠 checkbox 是否應禁用（互斥群組或達疊加上限） */
export function isDiscountCheckboxDisabled(
 d: PaymentDiscountRow,
 selectedIds: string[],
 catalog: PaymentDiscountRow[]
): boolean {
 if (selectedIds.includes(d.id)) return false
 const selected = resolveSelectedDiscounts(selectedIds, catalog)
 const maxStack = getGlobalMaxStackCount(catalog)
 if (maxStack != null && selected.length >= maxStack) return true
 const dGroups = stackGroupsFromDiscount(d)
 if (dGroups.length === 0) return false
 return selected.some((s) => {
  const sGroups = stackGroupsFromDiscount(s)
  return dGroups.some((g) => sGroups.includes(g))
 })
}
