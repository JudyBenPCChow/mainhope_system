import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL ?? ""
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""

/** 供 UI 顯示提示：未設定時 Vite 不會建立 Supabase 客戶端（常見原因：只有 `.env.rtf` 而沒有純文字 `.env`） */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null =
  isSupabaseConfigured ? createClient(url, anonKey) : null
