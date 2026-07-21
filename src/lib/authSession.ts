import type { Session } from "@supabase/supabase-js"

import {
 fetchCurrentMgmtProfile,
 type MgmtProfile,
} from "@/services/authRoleQueries"

export type { MgmtProfile } from "@/services/authRoleQueries"

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

export async function bootstrapRoleFromSession(session: Session | null): Promise<MgmtProfile | null> {
  if (!session?.user?.email) {
    clearRoleStorage()
    return null
  }
  const profile = await fetchCurrentMgmtProfile()
  if (!profile) {
    clearRoleStorage()
    return null
  }
  applyProfileToStorage(profile)
  return profile
}
