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

export function classEmbedExemptFromStudentTimeConflict(
 cls: Record<string, unknown> | null | undefined
): boolean {
 if (!cls) return false
 const course = cls.courses as Record<string, unknown> | null
 return isExemptFromStudentTimeConflict({
  classKind: cls.class_kind != null ? String(cls.class_kind) : null,
  subject: cls.subject != null ? String(cls.subject) : null,
  courseName: course?.course_name != null ? String(course.course_name) : null,
  courseCode: cls.course_code_full != null ? String(cls.course_code_full) : null,
 })
}
