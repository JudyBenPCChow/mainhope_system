import { type AuthzProfile } from "@/lib/authzProfile"
import type { MgmtRole } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"

function normalizeRole(raw: unknown): MgmtRole | null {
  if (typeof raw !== "string") return null
  const role = raw.trim().toLowerCase()
  if (role === "admin" || role === "manager" || role === "finance" || role === "teacher" || role === "alien") {
    return role
  }
  return null
}

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((item): item is string => typeof item === "string" && item.trim() !== ""))]
}

export function mapAuthzProfile(raw: unknown): AuthzProfile | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const activeRole = normalizeRole(row.active_role)
  const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : ""
  const appUserId = row.app_user_id != null ? String(row.app_user_id) : ""
  if (!activeRole || !email || !appUserId) return null

  const availableRoles = asStringArray(row.available_roles)
    .map(normalizeRole)
    .filter((item): item is MgmtRole => item !== null)

  return {
    appUserId,
    email,
    displayName:
      typeof row.display_name === "string" && row.display_name.trim() ? row.display_name.trim() : null,
    activeRole,
    availableRoles: availableRoles.includes(activeRole)
      ? [...new Set(availableRoles)]
      : [activeRole, ...new Set(availableRoles)],
    teacherId: row.teacher_id ? String(row.teacher_id) : null,
    activeCapabilities: asStringArray(row.active_capabilities),
    accountCapabilities: asStringArray(row.account_capabilities),
    authzVersion: typeof row.authz_version === "number" ? row.authz_version : Number(row.authz_version) || 0,
  }
}

export async function fetchCurrentAuthzProfile(): Promise<AuthzProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc("get_my_mgmt_profile_v2")
  if (error) throw new Error(error.message || "無法讀取授權資料")
  return mapAuthzProfile(data)
}

export async function switchCurrentMgmtRoleV2(role: MgmtRole): Promise<AuthzProfile> {
  if (!supabase) throw new Error("尚未設定 Supabase，暫時無法切換身份。")
  const { data, error } = await supabase.rpc("switch_my_mgmt_role_v2", { p_role: role })
  if (error) {
    if (error.message.includes("ROLE_NOT_ASSIGNED")) {
      throw new Error("此帳戶沒有獲授予所選身份。")
    }
    throw new Error(error.message || "切換身份失敗")
  }
  const profile = mapAuthzProfile(data)
  if (!profile) throw new Error("切換身份後未能讀取授權資料")
  return profile
}
