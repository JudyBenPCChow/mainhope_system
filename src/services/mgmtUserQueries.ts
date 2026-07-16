import { formatUnknownError } from "@/lib/formatUnknownError"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export type CreateTeacherMgmtUserInput = {
  email: string
  displayName?: string | null
  teacherId: string
}

export type CreateTeacherMgmtUserResult =
  | {
      ok: true
      email: string
      displayName: string
      teacherId: string
      teacherName: string
      temporaryPassword: string
    }
  | { ok: false; message: string }

async function readFunctionErrorBody(error: unknown, response?: Response): Promise<string | null> {
  const res = response ?? (error as { context?: Response } | null)?.context
  if (!res || typeof res.json !== "function") return null
  try {
    const body = (await res.clone().json()) as { error?: unknown }
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim()
  } catch {
    // ignore
  }
  return null
}

export async function createTeacherMgmtUser(
  input: CreateTeacherMgmtUserInput
): Promise<CreateTeacherMgmtUserResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: "尚未設定 Supabase，暫時無法建立老師登入帳號。" }
  }

  const { data, error, response } = await supabase.functions.invoke("create-mgmt-user", {
    body: {
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName?.trim() || null,
      teacherId: input.teacherId,
    },
  })

  if (error) {
    const detail = await readFunctionErrorBody(error, response)
    return { ok: false, message: detail ?? formatUnknownError(error) }
  }

  if (!data || typeof data !== "object") {
    return { ok: false, message: "建立老師用戶失敗：伺服器回覆格式異常。" }
  }

  const payload = data as Record<string, unknown>
  if (payload.ok !== true) {
    const message =
      typeof payload.error === "string" && payload.error.trim()
        ? payload.error.trim()
        : "建立老師用戶失敗，請稍後再試。"
    return { ok: false, message }
  }

  return {
    ok: true,
    email: String(payload.email ?? "").trim().toLowerCase(),
    displayName: String(payload.displayName ?? "").trim(),
    teacherId: String(payload.teacherId ?? "").trim(),
    teacherName: String(payload.teacherName ?? "").trim(),
    temporaryPassword: String(payload.temporaryPassword ?? ""),
  }
}

export type ResetMgmtUserPasswordInput = {
  appUserId: string
  email?: string | null
}

export type ResetMgmtUserPasswordResult =
  | {
      ok: true
      email: string
      displayName: string
      temporaryPassword: string
      /** true 代表此用戶原本沒有登入帳號，這次一併補建 */
      provisioned: boolean
    }
  | { ok: false; message: string }

export async function resetMgmtUserPassword(
  input: ResetMgmtUserPasswordInput
): Promise<ResetMgmtUserPasswordResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: "尚未設定 Supabase，暫時無法重設密碼。" }
  }

  const { data, error, response } = await supabase.functions.invoke("reset-mgmt-user-password", {
    body: {
      appUserId: input.appUserId,
      email: input.email?.trim().toLowerCase() || null,
    },
  })

  if (error) {
    const detail = await readFunctionErrorBody(error, response)
    return { ok: false, message: detail ?? formatUnknownError(error) }
  }

  if (!data || typeof data !== "object") {
    return { ok: false, message: "重設密碼失敗：伺服器回覆格式異常。" }
  }

  const payload = data as Record<string, unknown>
  if (payload.ok !== true) {
    const message =
      typeof payload.error === "string" && payload.error.trim()
        ? payload.error.trim()
        : "重設密碼失敗，請稍後再試。"
    return { ok: false, message }
  }

  return {
    ok: true,
    email: String(payload.email ?? "").trim().toLowerCase(),
    displayName: String(payload.displayName ?? "").trim(),
    temporaryPassword: String(payload.temporaryPassword ?? ""),
    provisioned: payload.provisioned === true,
  }
}
