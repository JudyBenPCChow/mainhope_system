import { createClient } from "jsr:@supabase/supabase-js@2"

export type MgmtRole = "admin" | "teacher" | "alien"

export type ResolvedCaller = {
  userRole: MgmtRole
  teacherId: string | null
  email: string
}

export type ResolveCallerResult =
  | { ok: true; caller: ResolvedCaller }
  | { ok: false; error: string; status: number }

function normalizeRole(raw: unknown): MgmtRole | null {
  const r = String(raw ?? "").trim().toLowerCase()
  if (r === "admin" || r === "teacher" || r === "alien") return r
  return null
}

function normalizeUuid(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!/^[0-9a-f-]{36}$/i.test(s)) return null
  return s
}

/** 從 JWT 解析資料庫中的有效身份；不信任 client 傳入的 role／teacherId */
export async function resolveCallerFromRequest(req: Request): Promise<ResolveCallerResult> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.match(/^Bearer\s+/i)) {
    return { ok: false, error: "請先登入後再使用明學IT狗。", status: 401 }
  }

  const url = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !serviceKey) {
    return { ok: false, error: "明學IT狗伺服器設定不完整。", status: 503 }
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user?.email) {
    return { ok: false, error: "登入已失效，請重新登入。", status: 401 }
  }

  const email = userData.user.email.trim().toLowerCase()
  let { data, error: profileError } = await admin
    .from("app_users")
    .select("id, role, teacher_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle()

  // 過渡期兼容尚未回填 auth_user_id 的舊帳戶。
  if (!data && !profileError) {
    const fallback = await admin
      .from("app_users")
      .select("id, role, teacher_id")
      .ilike("email", email)
      .maybeSingle()
    data = fallback.data
    profileError = fallback.error
  }

  if (profileError) {
    console.error("apo-chat app_users lookup failed", profileError.message)
    return { ok: false, error: "無法驗證你的帳號權限。", status: 503 }
  }

  if (!data) {
    return { ok: false, error: "找不到你的系統帳號，請聯絡管理員。", status: 403 }
  }

  let userRole = normalizeRole(data.role)
  let teacherId = normalizeUuid(data.teacher_id)

  const { data: activeRole, error: activeRoleError } = await admin
    .from("mgmt_active_roles")
    .select("active_role")
    .eq("app_user_id", data.id)
    .maybeSingle()
  if (activeRoleError) {
    console.error("apo-chat active role lookup failed", activeRoleError.message)
    return { ok: false, error: "無法驗證你目前的操作身份。", status: 503 }
  }

  if (activeRole?.active_role) {
    const { data: assignedRole, error: assignedRoleError } = await admin
      .from("app_user_roles")
      .select("role, teacher_id")
      .eq("app_user_id", data.id)
      .eq("role", activeRole.active_role)
      .maybeSingle()
    if (assignedRoleError) {
      console.error("apo-chat assigned role lookup failed", assignedRoleError.message)
      return { ok: false, error: "無法驗證你目前的操作身份。", status: 503 }
    }
    if (assignedRole) {
      userRole = normalizeRole(assignedRole.role)
      teacherId = normalizeUuid(assignedRole.teacher_id)
    }
  }

  if (!userRole) {
    return { ok: false, error: "你沒有使用明學IT狗的權限。", status: 403 }
  }

  if (userRole === "teacher" && !teacherId) {
    return {
      ok: false,
      error: "老師帳號未連結教師檔案，請聯絡管理員設定後再試。",
      status: 403,
    }
  }

  return {
    ok: true,
    caller: { userRole, teacherId, email },
  }
}

/** 偵測 client 謊報身份（記錄用，仍以 JWT 為準） */
export function logClientRoleMismatch(
  caller: ResolvedCaller,
  clientRole: string | undefined,
  clientTeacherId: string | null
): void {
  const roleMismatch = clientRole && clientRole !== caller.userRole
  const tidMismatch =
    caller.userRole === "teacher" &&
    clientTeacherId &&
    caller.teacherId &&
    clientTeacherId !== caller.teacherId
  if (roleMismatch || tidMismatch) {
    console.warn("apo-chat client identity mismatch", {
      email: caller.email,
      jwtRole: caller.userRole,
      clientRole,
      jwtTeacherId: caller.teacherId,
      clientTeacherId,
    })
  }
}
