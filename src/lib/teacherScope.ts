import { getMgmtRole } from "@/lib/mgmtRole"

/** 演示用：與 `supabase/seed.sql` 中 Judy Chu 列 id 一致 */
export const JUDY_CHU_TEACHER_ID = "f1ee1000-0000-4000-8000-000000001001"

/** 目前為專班老師登入時，`localStorage.teacher_id` 所代表的教師 uuid */
export function getTeacherScopeTeacherId(): string | null {
 if (getMgmtRole() !== "teacher") return null
 const id = localStorage.getItem("teacher_id")
 return id && id.trim().length > 0 ? id.trim() : null
}

export function isTeacherPortal(): boolean {
 return getTeacherScopeTeacherId() != null
}
