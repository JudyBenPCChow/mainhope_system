import { supabase } from "@/lib/supabaseClient"

export type PaymentDiscountRow = {
 id: string
 name: string
 percentOff: number | null
 amountOff: number | null
 isActive: boolean
 sortOrder: number
 createdAt: string
 updatedAt: string
}

function mapRow(r: Record<string, unknown>): PaymentDiscountRow {
 return {
  id: String(r.id),
  name: String(r.name ?? ""),
  percentOff: r.percent_off != null ? Number(r.percent_off) : null,
  amountOff: r.amount_off != null ? Number(r.amount_off) : null,
  isActive: Boolean(r.is_active ?? true),
  sortOrder: Number(r.sort_order ?? 0),
  createdAt: String(r.created_at ?? ""),
  updatedAt: String(r.updated_at ?? ""),
 }
}

/** 繳費表單用：啟用中的優惠，依 sort_order */
export async function fetchActivePaymentDiscounts(): Promise<PaymentDiscountRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payment_discounts")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true })
  .order("name", { ascending: true })
 if (error) throw error
 return (data ?? []).map((x) => mapRow(x as Record<string, unknown>))
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
 return (data ?? []).map((x) => mapRow(x as Record<string, unknown>))
}

export async function insertPaymentDiscount(row: {
 name: string
 percentOff: number | null
 amountOff: number | null
 isActive: boolean
 sortOrder: number
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("payment_discounts").insert({
  name: row.name.trim(),
  percent_off: row.percentOff,
  amount_off: row.amountOff,
  is_active: row.isActive,
  sort_order: row.sortOrder,
 })
 if (error) throw error
}

export async function updatePaymentDiscount(
 id: string,
 patch: Partial<{
  name: string
  percentOff: number | null
  amountOff: number | null
  isActive: boolean
  sortOrder: number
 }>
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if (patch.name !== undefined) payload.name = patch.name.trim()
 if (patch.percentOff !== undefined) payload.percent_off = patch.percentOff
 if (patch.amountOff !== undefined) payload.amount_off = patch.amountOff
 if (patch.isActive !== undefined) payload.is_active = patch.isActive
 if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder
 const { error } = await supabase.from("payment_discounts").update(payload).eq("id", id)
 if (error) throw error
}

export async function deletePaymentDiscount(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("payment_discounts").delete().eq("id", id)
 if (error) throw error
}

/** 套用優惠：先百分比再固定減免；四捨五入至 2 位小數 */
export function applyDiscountToSubtotal(subtotal: number, d: PaymentDiscountRow | null): number {
 if (!d || subtotal <= 0) return Math.round(subtotal * 100) / 100
 let t = subtotal
 if (d.percentOff != null && d.percentOff > 0) {
  t = t * (1 - Math.min(100, d.percentOff) / 100)
 }
 if (d.amountOff != null && d.amountOff > 0) {
  t = Math.max(0, t - d.amountOff)
 }
 return Math.round(t * 100) / 100
}
