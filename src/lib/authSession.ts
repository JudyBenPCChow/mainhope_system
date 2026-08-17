import type { Session } from "@supabase/supabase-js"

import type { AuthzProfile } from "@/lib/authzProfile"
import { fetchCurrentAuthzProfile } from "@/services/authzProfileQueries"

export type { AuthzProfile } from "@/lib/authzProfile"

function clearRoleStorage() {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem("mgmt_role")
  localStorage.removeItem("teacher_id")
  localStorage.removeItem("mgmt_display_name")
  localStorage.removeItem("mgmt_email")
}

/** 顯示名／過渡期舊讀取點用；授權以 AuthContext 的 DB profile 為準。 */
export function applyProfileToStorage(profile: AuthzProfile) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem("mgmt_role", profile.activeRole)
  localStorage.setItem("mgmt_email", profile.email)
  if (profile.displayName) localStorage.setItem("mgmt_display_name", profile.displayName)
  else localStorage.removeItem("mgmt_display_name")
  if (profile.activeRole === "teacher" && profile.teacherId) localStorage.setItem("teacher_id", profile.teacherId)
  else localStorage.removeItem("teacher_id")
}

export function clearAuthState() {
  clearRoleStorage()
}

export async function bootstrapRoleFromSession(session: Session | null): Promise<AuthzProfile | null> {
  if (!session?.user?.email) {
    clearRoleStorage()
    return null
  }
  const profile = await fetchCurrentAuthzProfile()
  if (!profile) {
    clearRoleStorage()
    return null
  }
  applyProfileToStorage(profile)
  return profile
}
