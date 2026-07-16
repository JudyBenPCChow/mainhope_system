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

/**
 * NFKC 正規化可把全形字元（如全形＠ U+FF20）轉為半形，避免人手輸入誤植的
 * 「liam＠mainhope.edu.hk」被判為無效電郵而擋下重設／建立流程。
 */
function normalizeEmail(raw: unknown): string | null {
  const value = String(raw ?? "").normalize("NFKC").trim().toLowerCase()
  if (!value) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null
  return value
}

function normalizeAppUserId(raw: unknown): string | null {
  const value = String(raw ?? "").trim()
  if (!/^[0-9a-f-]{36}$/i.test(value)) return null
  return value
}

type AppUserRow = {
  id: string
  email: string | null
  display_name: string | null
  role: string | null
  teacher_id: string | null
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

  // 1) 先鎖定目標 app_users 資料列（優先用 appUserId，其次用電郵）
  let appUser: AppUserRow | null = null

  if (appUserId) {
    const { data, error } = await admin
      .from("app_users")
      .select("id, email, display_name, role, teacher_id")
      .eq("id", appUserId)
      .maybeSingle()
    if (error) {
      console.error("reset-mgmt-user-password app_users lookup failed", error.message)
      return jsonResponse({ error: "無法讀取系統用戶，請稍後再試。" }, 503)
    }
    if (!data) {
      return jsonResponse({ error: "找不到此系統用戶。" }, 404)
    }
    appUser = data as AppUserRow
  }

  if (!appUser && email) {
    const { data, error } = await admin
      .from("app_users")
      .select("id, email, display_name, role, teacher_id")
      .ilike("email", email)
      .limit(5)
    if (error) {
      console.error("reset-mgmt-user-password email lookup failed", error.message)
      return jsonResponse({ error: "無法檢查系統用戶，請稍後再試。" }, 503)
    }
    if (!data?.length) {
      return jsonResponse({ error: "此電郵不在系統用戶名單中。" }, 404)
    }
    appUser = data[0] as AppUserRow
  }

  if (!appUser) {
    return jsonResponse({ error: "請提供有效電郵或用戶編號。" }, 400)
  }

  const role = String(appUser.role ?? "").trim().toLowerCase()
  if (role === "student") {
    return jsonResponse({ error: "學生入口帳號請走家長／學生入口流程，不可在此重設。" }, 400)
  }

  // 2) 以 app_users 上的電郵為準（正規化全形＠等），並在需要時回寫自我修復
  const storedEmail = String(appUser.email ?? "")
  const normalizedEmail = normalizeEmail(appUser.email) ?? email
  if (!normalizedEmail) {
    return jsonResponse({ error: "此用戶沒有有效電郵，無法重設或建立登入。" }, 400)
  }
  email = normalizedEmail

  if (storedEmail !== normalizedEmail) {
    const { error: healError } = await admin
      .from("app_users")
      .update({ email: normalizedEmail })
      .eq("id", appUser.id)
    if (healError) {
      // 自我修復失敗不阻擋主流程，只記錄
      console.error("reset-mgmt-user-password email self-heal failed", healError.message)
    }
  }

  const displayName = String(appUser.display_name ?? "").trim()
  const teacherId = appUser.teacher_id != null ? String(appUser.teacher_id) : null
  const temporaryPassword = generateTemporaryPassword()

  // 3) 找 Auth 帳號：有 → 重設密碼；沒有（404）→ 直接補建並設定臨時密碼
  const authLookup = await findAuthUserIdByEmail(admin, email)

  let authUserId: string
  let provisioned = false

  if (authLookup.ok) {
    const { error: updateError } = await admin.auth.admin.updateUserById(authLookup.userId, {
      password: temporaryPassword,
      user_metadata: { must_change_password: true },
    })
    if (updateError) {
      console.error("reset-mgmt-user-password update password failed", updateError.message)
      return jsonResponse({ error: "重設密碼失敗，請稍後再試。" }, 502)
    }
    authUserId = authLookup.userId
  } else if (authLookup.status === 404) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || email,
        source: "reset-mgmt-user-password",
        teacher_id: teacherId,
        must_change_password: true,
      },
      app_metadata: {
        mgmt_role: role || "teacher",
      },
    })
    if (!createError && created.user?.id) {
      authUserId = created.user.id
    } else {
      const detail = String(createError?.message ?? "").toLowerCase()
      const looksExisting =
        detail.includes("already") || detail.includes("exists") || detail.includes("registered")
      const retry = looksExisting ? await findAuthUserIdByEmail(admin, email) : null
      if (retry?.ok) {
        const { error: retryUpdateError } = await admin.auth.admin.updateUserById(retry.userId, {
          password: temporaryPassword,
          user_metadata: { must_change_password: true },
        })
        if (retryUpdateError) {
          console.error("reset-mgmt-user-password retry update failed", retryUpdateError.message)
          return jsonResponse({ error: "建立登入帳號失敗，請稍後再試。" }, 502)
        }
        authUserId = retry.userId
      } else {
        console.error("reset-mgmt-user-password provision auth failed", createError?.message)
        return jsonResponse({ error: "建立登入帳號失敗，請稍後再試。" }, 502)
      }
    }
    provisioned = true
  } else {
    return jsonResponse({ error: authLookup.error }, authLookup.status)
  }

  await admin.from("mgmt_audit_log").insert({
    actor_label: authResult.caller.email,
    role: authResult.caller.userRole,
    action: provisioned ? "provision_user_login" : "reset_user_password",
    path: "/Users",
    detail: JSON.stringify({
      app_user_id: appUser.id,
      auth_user_id: authUserId,
      email,
      display_name: displayName || null,
      provisioned,
    }),
  })

  return jsonResponse({
    ok: true,
    email,
    displayName,
    temporaryPassword,
    provisioned,
  })
})
