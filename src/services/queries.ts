import { type SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { PublicTable, TableUpdate } from "@/types/db"

/** 依表名讀取全表（依 `created_at` 新到舊）。未設定 Supabase 時回傳空陣列。 */
export async function listTable(table: PublicTable): Promise<unknown[]> {
 if (!supabase) {
  console.warn(`[api] 未設定 VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY，${table} 回傳 []`)
  return []
 }

 /** 動態表名會把 70+ Relationships 展開到 TS2589；此 helper 回 unknown[]，用未泛型 client。 */
 const { data, error } = await (supabase as SupabaseClient)
  .from(table)
  .select("*")
  .order("created_at", { ascending: false })

 if (error) {
  console.error(`[api] ${table}:`, error.message)
  throw error
 }

 return data ?? []
}

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
  .update({ ...patch, updated_at: new Date().toISOString() } as TableUpdate<"app_users">)
  .eq("id", id)
  .select("*")
  .maybeSingle()

 if (error) {
  console.error("[api] app_users update:", error.message)
  throw error
 }

 return data
}
