import type { MgmtRole } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"

export type MgmtProfile = {
 role: MgmtRole
 availableRoles: MgmtRole[]
 teacherId: string | null
 displayName: string | null
 email: string
}

function normalizeRole(raw: unknown): MgmtRole | null {
 if (typeof raw !== "string") return null
 const role = raw.trim().toLowerCase()
 if (role === "admin" || role === "manager" || role === "teacher" || role === "alien") return role
 return null
}

function mapProfileRow(raw: unknown): MgmtProfile | null {
 if (!raw || typeof raw !== "object") return null
 const row = raw as Record<string, unknown>
 const role = normalizeRole(row.active_role)
 if (!role || typeof row.email !== "string" || !row.email.trim()) return null

 const availableRoles = Array.isArray(row.available_roles)
  ? row.available_roles
     .map(normalizeRole)
     .filter((item): item is MgmtRole => item !== null)
  : [role]

 return {
  role,
  availableRoles: availableRoles.includes(role)
   ? [...new Set(availableRoles)]
   : [role, ...new Set(availableRoles)],
  teacherId: row.teacher_id ? String(row.teacher_id) : null,
  displayName: typeof row.display_name === "string" && row.display_name.trim()
   ? row.display_name
   : null,
  email: row.email.trim().toLowerCase(),
 }
}

export async function fetchCurrentMgmtProfile(): Promise<MgmtProfile | null> {
 if (!supabase) return null
 const { data, error } = await supabase.rpc("get_my_mgmt_profile").maybeSingle()
 if (error) throw new Error(error.message || "無法讀取用戶角色")
 return mapProfileRow(data)
}

export async function switchCurrentMgmtRole(role: MgmtRole): Promise<void> {
 if (!supabase) throw new Error("尚未設定 Supabase，暫時無法切換身份。")
 const { error } = await supabase.rpc("switch_my_mgmt_role", { p_role: role })
 if (error) {
  if (error.message.includes("ROLE_NOT_ASSIGNED")) {
   throw new Error("此帳戶沒有獲授予所選身份。")
  }
  throw new Error(error.message || "切換身份失敗")
 }
}
