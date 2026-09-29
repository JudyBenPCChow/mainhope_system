import { isHomeworkClassSubject } from "@/lib/entitlementNamespace"
import { resolveClassKind } from "@/lib/privateClassKind"

export type StudentTimeConflictClassFields = {
 classKind?: string | null
 subject?: string | null
 courseName?: string | null
 courseCode?: string | null
}

/** 功課輔導班佔室與專科並行屬正常；學生時段衝突不含功輔。課室佔室仍另檢。 */
export function isExemptFromStudentTimeConflict(cls: StudentTimeConflictClassFields): boolean {
 if (resolveClassKind(cls.classKind, cls.subject) === "homework") return true
 if (isHomeworkClassSubject(cls.subject, cls.courseName)) return true
 const code = String(cls.courseCode ?? "").toUpperCase()
 return code.includes("HWK")
}

function firstRecord(raw: unknown): Record<string, unknown> | null {
 if (raw == null) return null
 if (Array.isArray(raw)) {
  const first = raw[0]
  return first && typeof first === "object" ? (first as Record<string, unknown>) : null
 }
 if (typeof raw === "object") return raw as Record<string, unknown>
 return null
}

export function classEmbedExemptFromStudentTimeConflict(cls: unknown): boolean {
 const rec = firstRecord(cls)
 if (!rec) return false
 const course = firstRecord(rec.courses)
 return isExemptFromStudentTimeConflict({
  classKind: rec.class_kind != null ? String(rec.class_kind) : null,
  subject: rec.subject != null ? String(rec.subject) : null,
  courseName: course?.course_name != null ? String(course.course_name) : null,
  courseCode: rec.course_code_full != null ? String(rec.course_code_full) : null,
 })
}
