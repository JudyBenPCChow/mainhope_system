import { formatUnknownError } from "@/lib/formatUnknownError"
import { buildPortalActivateUrl } from "@/lib/portalConfig"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export type PortalInviteRow = {
 id: string
 studentId: string
 token: string
 expiresAt: string
 usedAt: string | null
 usedByEmail: string | null
 createdAt: string
 activateUrl: string | null
 /** unused + not expired */
 isActive: boolean
}

export type PortalBinding = {
 email: string
 updatedAt: string | null
} | null

function throwQueryError(err: unknown): never {
 throw new Error(formatUnknownError(err))
}

function mapInvite(row: Record<string, unknown>): PortalInviteRow {
 const token = String(row.token ?? "")
 const expiresAt = String(row.expires_at ?? "")
 const usedAt = row.used_at != null ? String(row.used_at) : null
 const expiresMs = Date.parse(expiresAt)
 const isExpired = Number.isFinite(expiresMs) ? expiresMs < Date.now() : true
 return {
  id: String(row.id),
  studentId: String(row.student_id),
  token,
  expiresAt,
  usedAt,
  usedByEmail: row.used_by_email != null ? String(row.used_by_email) : null,
  createdAt: String(row.created_at ?? ""),
  activateUrl: buildPortalActivateUrl(token),
  isActive: usedAt == null && !isExpired,
 }
}

async function resolveCurrentAppUserId(): Promise<string | null> {
 if (!supabase) return null
 const { data: sessionData } = await supabase.auth.getSession()
 const email = sessionData.session?.user?.email?.trim().toLowerCase()
 if (!email) return null
 const { data, error } = await supabase
  .from("app_users")
  .select("id")
  .ilike("email", email)
  .limit(1)
  .maybeSingle()
 if (error) throwQueryError(error)
 return data?.id != null ? String(data.id) : null
}

/** 查家長是否已綁定 portal（alien 可直接讀 app_users；admin 可能被 RLS 擋，回 null 時改看邀請紀錄） */
export async function fetchPortalBindingForStudent(
 studentId: string
): Promise<PortalBinding> {
 if (!isSupabaseConfigured || !supabase) return null
 const { data, error } = await supabase
  .from("app_users")
  .select("email, updated_at")
  .eq("student_id", studentId)
  .eq("role", "student")
  .limit(1)
  .maybeSingle()
 if (error) {
  // admin 無全表讀權限時常見；改由邀請 used_by_email 推斷
  return null
 }
 if (!data?.email) return null
 return {
  email: String(data.email).toLowerCase(),
  updatedAt: data.updated_at != null ? String(data.updated_at) : null,
 }
}

export async function fetchPortalInvitesForStudent(
 studentId: string
): Promise<PortalInviteRow[]> {
 if (!isSupabaseConfigured || !supabase) return []
 const { data, error } = await supabase
  .from("student_portal_invites")
  .select("id, student_id, token, expires_at, used_at, used_by_email, created_at")
  .eq("student_id", studentId)
  .order("created_at", { ascending: false })
  .limit(20)
 if (error) throwQueryError(error)
 return (data ?? []).map((r) => mapInvite(r as Record<string, unknown>))
}

function newInviteToken(): string {
 if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
  return crypto.randomUUID().replace(/-/g, "")
 }
 return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`
}

/**
 * 產生新邀請：先讓該生既有未使用邀請立即過期，再 insert 一筆（預設 14 天）。
 * 回傳含 activateUrl 的邀請列。
 */
export async function createPortalInviteForStudent(
 studentId: string
): Promise<PortalInviteRow> {
 if (!isSupabaseConfigured || !supabase) {
  throw new Error("尚未設定 Supabase，無法產生邀請連結。")
 }

 const createdBy = await resolveCurrentAppUserId()
 const token = newInviteToken()
 const nowIso = new Date().toISOString()

 const { error: expireErr } = await supabase
  .from("student_portal_invites")
  .update({ expires_at: nowIso })
  .eq("student_id", studentId)
  .is("used_at", null)
  .gt("expires_at", nowIso)
 if (expireErr) throwQueryError(expireErr)

 const { data, error } = await supabase
  .from("student_portal_invites")
  .insert({
   student_id: studentId,
   token,
   created_by: createdBy,
  })
  .select("id, student_id, token, expires_at, used_at, used_by_email, created_at")
  .single()
 if (error) throwQueryError(error)
 return mapInvite(data as Record<string, unknown>)
}

export function buildPortalInviteWhatsAppMessage(opts: {
 studentName: string
 activateUrl: string
 expiresAt: string
}): string {
 const who = opts.studentName.trim() || "同學"
 let expiryLabel = opts.expiresAt
 try {
  expiryLabel = new Date(opts.expiresAt).toLocaleString("zh-Hant", {
   year: "numeric",
   month: "2-digit",
   day: "2-digit",
   hour: "2-digit",
   minute: "2-digit",
   hour12: false,
  })
 } catch {
  // keep raw
 }
 return [
  "您好，這裡是明學教育。",
  "",
  `請使用以下連結為 ${who} 開通家長查閱系統（設定電郵與密碼）：`,
  opts.activateUrl,
  "",
  `連結有效期至：${expiryLabel}`,
  "開通後即可查閱課堂時間表、出席與繳費資料。如有疑問請回覆此訊息，謝謝！",
 ].join("\n")
}

/** 從邀請列表推斷已啟用電郵（當 app_users 讀不到時） */
export function inferBoundEmailFromInvites(invites: PortalInviteRow[]): string | null {
 const used = invites.find((i) => i.usedAt && i.usedByEmail)
 return used?.usedByEmail?.trim().toLowerCase() || null
}
