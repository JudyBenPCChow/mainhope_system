import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

import { resolveCallerFromRequest, type ResolveCallerResult, type ResolvedCaller } from "./apoAuth.ts"

export { resolveCallerFromRequest, type ResolveCallerResult, type ResolvedCaller }

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未設定。")
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function assertAlienCaller(caller: ResolvedCaller): { ok: true } | { ok: false; error: string; status: number } {
  if (caller.userRole !== "alien") {
    return { ok: false, error: "只有外星人可建立老師登入帳號。", status: 403 }
  }
  return { ok: true }
}
