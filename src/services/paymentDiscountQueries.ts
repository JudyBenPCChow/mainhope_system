import { supabase } from "@/lib/supabaseClient"

export type PaymentDiscountRow = {
 id: string
 name: string
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

export function mapPaymentDiscountRow(r: Record<string, unknown>): PaymentDiscountRow {
 const percentOff = r.percent_off != null ? Number(r.percent_off) : null
 const amountOff = r.amount_off != null ? Number(r.amount_off) : null
 const explicitLabelOnly = Boolean(r.is_label_only ?? false)
 const isLabelOnly =
  explicitLabelOnly ||
  ((percentOff == null || percentOff === 0) && (amountOff == null || amountOff === 0))
 return {
  id: String(r.id),
  name: String(r.name ?? ""),
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
 if (d.academicYear && opts?.academicYear && d.academicYear !== opts.academicYear) return false
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
  if (d.stackGroup) {
   if (seenGroups.has(d.stackGroup)) {
    return `互斥群組「${d.stackGroup}」只能選一項優惠`
   }
   seenGroups.add(d.stackGroup)
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
}

function writePayload(row: PaymentDiscountWriteInput): Record<string, unknown> {
 const percentOff = row.percentOff
 const amountOff = row.amountOff
 const isLabelOnly =
  row.isLabelOnly ??
  ((percentOff == null || percentOff === 0) && (amountOff == null || amountOff === 0))
 return {
  name: row.name.trim(),
  percent_off: percentOff,
  amount_off: amountOff,
  is_active: row.isActive,
  sort_order: row.sortOrder,
  valid_from: row.validFrom?.trim() || null,
  valid_to: row.validTo?.trim() || null,
  academic_year: row.academicYear?.trim() || null,
  stack_group: row.stackGroup?.trim() || null,
  max_stack_count: row.maxStackCount ?? null,
  is_label_only: isLabelOnly,
 }
}

function filterActiveDiscountRows(
 rows: PaymentDiscountRow[],
 opts?: FetchActivePaymentDiscountsOptions
): PaymentDiscountRow[] {
 const asOf = opts?.asOfDate ?? todayYmd()
 const academicYear = opts?.academicYear ?? null
 return rows.filter((d) => d.isActive && isDiscountInEffect(d, { asOfDate: asOf, academicYear }))
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
 const { error } = await supabase.from("payment_discounts").insert(writePayload(row))
 if (error) throw error
}

export async function updatePaymentDiscount(
 id: string,
 patch: Partial<PaymentDiscountWriteInput>
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if (patch.name !== undefined) payload.name = patch.name.trim()
 if (patch.percentOff !== undefined) payload.percent_off = patch.percentOff
 if (patch.amountOff !== undefined) payload.amount_off = patch.amountOff
 if (patch.isActive !== undefined) payload.is_active = patch.isActive
 if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder
 if (patch.validFrom !== undefined) payload.valid_from = patch.validFrom?.trim() || null
 if (patch.validTo !== undefined) payload.valid_to = patch.validTo?.trim() || null
 if (patch.academicYear !== undefined) payload.academic_year = patch.academicYear?.trim() || null
 if (patch.stackGroup !== undefined) payload.stack_group = patch.stackGroup?.trim() || null
 if (patch.maxStackCount !== undefined) payload.max_stack_count = patch.maxStackCount
 if (patch.isLabelOnly !== undefined) payload.is_label_only = patch.isLabelOnly
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
 const { count, error } = await supabase
  .from("payment_discount_applications")
  .select("id", { count: "exact", head: true })
  .eq("payment_discount_id", discountId)
 if (error) throw error
 return count ?? 0
}

/** 各優惠引用次數與累計減免 */
export async function fetchDiscountUsageStats(): Promise<PaymentDiscountUsageStats[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payment_discount_applications")
  .select("payment_discount_id, amount_deducted")
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
 app: { discountId: string; name: string; percentOff: number | null; amountOff: number | null },
 sortOrder = 0
): PaymentDiscountRow {
 const percentOff = app.percentOff
 const amountOff = app.amountOff
 return {
  id: app.discountId,
  name: app.name,
  percentOff,
  amountOff,
  isActive: true,
  sortOrder,
  validFrom: null,
  validTo: null,
  academicYear: null,
  stackGroup: null,
  maxStackCount: null,
  isLabelOnly:
   (percentOff == null || percentOff === 0) && (amountOff == null || amountOff === 0),
  createdAt: "",
  updatedAt: "",
 }
}

/** 套用優惠：先百分比再固定減免；四捨五入至 2 位小數 */
export function applyDiscountToSubtotal(subtotal: number, d: PaymentDiscountRow | null): number {
 if (!d || subtotal <= 0 || d.isLabelOnly) return Math.round(subtotal * 100) / 100
 let t = subtotal
 if (d.percentOff != null && d.percentOff > 0) {
  t = t * (1 - Math.min(100, d.percentOff) / 100)
 }
 if (d.amountOff != null && d.amountOff > 0) {
  t = Math.max(0, t - d.amountOff)
 }
 return Math.round(t * 100) / 100
}

/** 依序套用多項優惠（各項內先百分比再固定減免；順序依 sort_order） */
export function applyDiscountsToSubtotal(
 subtotal: number,
 discounts: PaymentDiscountRow[]
): number {
 let t = subtotal
 for (const d of orderDiscountsBySortOrder(discounts)) {
  t = applyDiscountToSubtotal(t, d)
 }
 return Math.round(t * 100) / 100
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
 if (d.stackGroup) {
  return selected.some((s) => s.stackGroup === d.stackGroup)
 }
 return false
}
