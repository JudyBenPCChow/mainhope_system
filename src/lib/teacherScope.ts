import type { AuthzProfile } from "@/lib/authzProfile"

type TeacherScopeProfile = Pick<AuthzProfile, "activeRole" | "teacherId">

/** 目前 Auth profile 為專科班老師時，回傳該帳戶對應的教師 uuid。 */
export function getTeacherScopeTeacherId(
 profile: TeacherScopeProfile | null | undefined
): string | null {
 if (profile?.activeRole !== "teacher") return null
 const id = profile.teacherId
 return id && id.trim().length > 0 ? id.trim() : null
}

export function isTeacherPortal(profile: TeacherScopeProfile | null | undefined): boolean {
 return getTeacherScopeTeacherId(profile) != null
}
