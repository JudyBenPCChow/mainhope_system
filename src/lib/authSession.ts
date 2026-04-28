import type { Session } from "@supabase/supabase-js"

import type { MgmtRole } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"

export type MgmtProfile = {
  role: MgmtRole
  teacherId: string | null
  displayName: string | null
  email: string
}

function normalizeRole(raw: string | null | undefined): MgmtRole | null {
  if (!raw) return null
  const role = raw.trim().toLowerCase()
  if (role === "admin" || role === "teacher" || role === "alien") return role
  return null
}

function clearRoleStorage() {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem("mgmt_role")
  localStorage.removeItem("teacher_id")
  localStorage.removeItem("mgmt_display_name")
  localStorage.removeItem("mgmt_email")
}

export function applyProfileToStorage(profile: MgmtProfile) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem("mgmt_role", profile.role)
  localStorage.setItem("mgmt_email", profile.email)
  if (profile.displayName) localStorage.setItem("mgmt_display_name", profile.displayName)
  else localStorage.removeItem("mgmt_display_name")
  if (profile.role === "teacher" && profile.teacherId) localStorage.setItem("teacher_id", profile.teacherId)
  else localStorage.removeItem("teacher_id")
}

export function clearAuthState() {
  clearRoleStorage()
}

export async function fetchMgmtProfileByEmail(email: string): Promise<MgmtProfile | null> {
  if (!supabase) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const { data, error } = await supabase
    .from("app_users")
    .select("email, display_name, role, teacher_id")
    .ilike("email", normalized)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data?.email) return null

  const role = normalizeRole(typeof data.role === "string" ? data.role : null)
  if (!role) return null

  return {
    role,
    teacherId: data.teacher_id ? String(data.teacher_id) : null,
    displayName: data.display_name ? String(data.display_name) : null,
    email: String(data.email).toLowerCase(),
  }
}

export async function bootstrapRoleFromSession(session: Session | null): Promise<MgmtProfile | null> {
  if (!session?.user?.email) {
    clearRoleStorage()
    return null
  }
  const profile = await fetchMgmtProfileByEmail(session.user.email)
  if (!profile) {
    clearRoleStorage()
    return null
  }
  applyProfileToStorage(profile)
  return profile
}
