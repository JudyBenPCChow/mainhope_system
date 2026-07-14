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
    return { ok: false, error: "只有外星人可管理登入帳號。", status: 403 }
  }
  return { ok: true }
}

export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("")
}

/** Resolve Auth user id by email (case-insensitive). Paginated — fine for small mgmt user sets. */
export async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string; status: number }> {
  const target = email.trim().toLowerCase()
  if (!target) {
    return { ok: false, error: "請輸入有效電郵。", status: 400 }
  }

  const perPage = 200
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error("findAuthUserIdByEmail listUsers failed", error.message)
      return { ok: false, error: "無法讀取登入帳號，請稍後再試。", status: 503 }
    }
    const users = data?.users ?? []
    const match = users.find((u) => String(u.email ?? "").trim().toLowerCase() === target)
    if (match?.id) {
      return { ok: true, userId: match.id }
    }
    if (users.length < perPage) break
  }

  return { ok: false, error: "找不到對應的登入帳號。此用戶可能尚未建立 Auth，請先建立登入帳號。", status: 404 }
}
