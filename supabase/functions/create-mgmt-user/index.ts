import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import {
  assertAlienCaller,
  createServiceRoleClient,
  generateTemporaryPassword,
  resolveCallerFromRequest,
} from "../_shared/mgmtUserAuth.ts"
import { jsonResponse } from "../_shared/cors.ts"

type RequestBody = {
  email?: unknown
  displayName?: unknown
  teacherId?: unknown
}

function normalizeEmail(raw: unknown): string | null {
  // NFKC 把全形字元（如全形＠ U+FF20）轉半形，避免誤植電郵被判為無效。
  const value = String(raw ?? "").normalize("NFKC").trim().toLowerCase()
  if (!value) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null
  return value
}

function normalizeDisplayName(raw: unknown): string | null {
  const value = String(raw ?? "").trim()
  return value ? value.slice(0, 120) : null
}

function normalizeTeacherId(raw: unknown): string | null {
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

  const email = normalizeEmail(body.email)
  const teacherId = normalizeTeacherId(body.teacherId)
  const displayName = normalizeDisplayName(body.displayName)
  if (!email) {
    return jsonResponse({ error: "請輸入有效電郵。" }, 400)
  }
  if (!teacherId) {
    return jsonResponse({ error: "請選擇要綁定的老師。" }, 400)
  }

  const admin = createServiceRoleClient()

  const { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .select("id, full_name, english_name, email")
    .eq("id", teacherId)
    .maybeSingle()
  if (teacherError) {
    console.error("create-mgmt-user teacher lookup failed", teacherError.message)
    return jsonResponse({ error: "無法讀取老師資料，請稍後再試。" }, 503)
  }
  if (!teacher) {
    return jsonResponse({ error: "找不到所選老師，請重新整理後再試。" }, 404)
  }

  const { data: existingAppUser, error: existingAppUserError } = await admin
    .from("app_users")
    .select("id, role, teacher_id")
    .or(`email.ilike.${email},teacher_id.eq.${teacherId}`)
    .limit(10)
  if (existingAppUserError) {
    console.error("create-mgmt-user app_users lookup failed", existingAppUserError.message)
    return jsonResponse({ error: "無法檢查現有用戶，請稍後再試。" }, 503)
  }

  for (const row of existingAppUser ?? []) {
    const item = row as Record<string, unknown>
    const rowTeacherId = item.teacher_id != null ? String(item.teacher_id) : null
    const rowRole = String(item.role ?? "").trim().toLowerCase()
    if (rowTeacherId === teacherId && rowRole === "teacher") {
      return jsonResponse({ error: "此老師已綁定一個老師用戶，請改用編輯流程。" }, 409)
    }
    if (String(item.id ?? "").trim() && rowTeacherId !== teacherId) {
      return jsonResponse({ error: "此電郵已存在於系統用戶，請改用其他電郵或編輯既有用戶。" }, 409)
    }
  }

  const teacherFullName = String(teacher.full_name ?? "").trim()
  const teacherEnglishName = String(teacher.english_name ?? "").trim()
  const effectiveDisplayName = displayName || teacherFullName || teacherEnglishName || email
  const temporaryPassword = generateTemporaryPassword()

  const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      display_name: effectiveDisplayName,
      source: "create-mgmt-user",
      teacher_id: teacherId,
    },
    app_metadata: {
      mgmt_role: "teacher",
    },
  })
  if (createAuthError || !createdAuth.user?.id) {
    console.error("create-mgmt-user create auth failed", createAuthError?.message)
    const detail = String(createAuthError?.message ?? "").toLowerCase()
    if (detail.includes("already") || detail.includes("exists") || detail.includes("registered")) {
      return jsonResponse({ error: "此電郵已存在登入帳號，請改用其他電郵或改走重設／編輯流程。" }, 409)
    }
    return jsonResponse({ error: "建立登入帳號失敗，請稍後再試。" }, 502)
  }

  const authUserId = createdAuth.user.id

  const { error: insertAppUserError } = await admin.from("app_users").insert({
    email,
    display_name: effectiveDisplayName,
    role: "teacher",
    teacher_id: teacherId,
  })

  if (insertAppUserError) {
    console.error("create-mgmt-user insert app_user failed", insertAppUserError.message)
    const { error: rollbackError } = await admin.auth.admin.deleteUser(authUserId)
    if (rollbackError) {
      console.error("create-mgmt-user rollback auth delete failed", rollbackError.message)
    }
    return jsonResponse({ error: "系統用戶建立失敗，已取消登入帳號建立。請稍後再試。" }, 502)
  }

  await admin.from("mgmt_audit_log").insert({
    actor_label: authResult.caller.email,
    role: authResult.caller.userRole,
    action: "create_teacher_login",
    path: "/Users",
    detail: JSON.stringify({
      teacher_id: teacherId,
      teacher_name: teacher.full_name ?? null,
      created_auth_user_id: authUserId,
      created_email: email,
      display_name: effectiveDisplayName,
    }),
  })

  return jsonResponse({
    ok: true,
    email,
    displayName: effectiveDisplayName,
    teacherId,
    teacherName: String(teacher.full_name ?? ""),
    temporaryPassword,
  })
})
