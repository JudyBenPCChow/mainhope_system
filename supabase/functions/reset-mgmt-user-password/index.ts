import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import {
  assertAlienCaller,
  createServiceRoleClient,
  findAuthUserIdByEmail,
  generateTemporaryPassword,
  resolveCallerFromRequest,
} from "../_shared/mgmtUserAuth.ts"
import { jsonResponse } from "../_shared/cors.ts"

type RequestBody = {
  email?: unknown
  appUserId?: unknown
}

function normalizeEmail(raw: unknown): string | null {
  const value = String(raw ?? "").trim().toLowerCase()
  if (!value) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null
  return value
}

function normalizeAppUserId(raw: unknown): string | null {
  const value = String(raw ?? "").trim()
  if (!/^[0-9a-f-]{36}$/i.test(value)) return null
  return value
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "僅支援 POST" }, 405)
  }

  const authResult = await resolveCallerFromRequest(req)
  if (!authResult.ok) {
    return jsonResponse({ error: authResult.error }, authResult.status)
  }

  const roleCheck = assertAlienCaller(authResult.caller)
  if (!roleCheck.ok) {
    return jsonResponse({ error: roleCheck.error }, roleCheck.status)
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse({ error: "請求格式不正確" }, 400)
  }

  const appUserId = normalizeAppUserId(body.appUserId)
  let email = normalizeEmail(body.email)

  const admin = createServiceRoleClient()

  if (appUserId) {
    const { data: appUser, error: appUserError } = await admin
      .from("app_users")
      .select("id, email, display_name, role")
      .eq("id", appUserId)
      .maybeSingle()
    if (appUserError) {
      console.error("reset-mgmt-user-password app_users lookup failed", appUserError.message)
      return jsonResponse({ error: "無法讀取系統用戶，請稍後再試。" }, 503)
    }
    if (!appUser) {
      return jsonResponse({ error: "找不到此系統用戶。" }, 404)
    }
    const role = String(appUser.role ?? "").trim().toLowerCase()
    if (role === "student") {
      return jsonResponse({ error: "學生入口帳號請走家長／學生入口流程，不可在此重設。" }, 400)
    }
    const rowEmail = normalizeEmail(appUser.email)
    if (!rowEmail) {
      return jsonResponse({ error: "此用戶沒有電郵，無法重設密碼。" }, 400)
    }
    email = rowEmail
  }

  if (!email) {
    return jsonResponse({ error: "請提供有效電郵或用戶編號。" }, 400)
  }

  const { data: appUsersByEmail, error: emailLookupError } = await admin
    .from("app_users")
    .select("id, email, display_name, role")
    .ilike("email", email)
    .limit(5)
  if (emailLookupError) {
    console.error("reset-mgmt-user-password email lookup failed", emailLookupError.message)
    return jsonResponse({ error: "無法檢查系統用戶，請稍後再試。" }, 503)
  }
  if (!appUsersByEmail?.length) {
    return jsonResponse({ error: "此電郵不在系統用戶名單中。" }, 404)
  }
  const primary = appUsersByEmail[0] as Record<string, unknown>
  const role = String(primary.role ?? "").trim().toLowerCase()
  if (role === "student") {
    return jsonResponse({ error: "學生入口帳號請走家長／學生入口流程，不可在此重設。" }, 400)
  }

  const authLookup = await findAuthUserIdByEmail(admin, email)
  if (!authLookup.ok) {
    return jsonResponse({ error: authLookup.error }, authLookup.status)
  }

  const temporaryPassword = generateTemporaryPassword()
  const { error: updateError } = await admin.auth.admin.updateUserById(authLookup.userId, {
    password: temporaryPassword,
  })
  if (updateError) {
    console.error("reset-mgmt-user-password update password failed", updateError.message)
    return jsonResponse({ error: "重設密碼失敗，請稍後再試。" }, 502)
  }

  const displayName = String(primary.display_name ?? "").trim()

  await admin.from("mgmt_audit_log").insert({
    actor_label: authResult.caller.email,
    role: authResult.caller.userRole,
    action: "reset_user_password",
    path: "/Users",
    detail: JSON.stringify({
      app_user_id: String(primary.id ?? ""),
      auth_user_id: authLookup.userId,
      email,
      display_name: displayName || null,
    }),
  })

  return jsonResponse({
    ok: true,
    email,
    displayName,
    temporaryPassword,
  })
})
