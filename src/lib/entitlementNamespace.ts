import { GRADE_TO_COURSE_CODE, normalizeGradeCode } from "@/lib/courseCode"
import { resolveClassGradeLabels } from "@/lib/classGrade"
import { resolveClassKind } from "@/lib/privateClassKind"
import { formatStudentGrade } from "@/lib/studentGrade"

export const ENTITLEMENT_COURSE_GROUPS = [
 "group_specialist",
 "private",
 "trial",
 "homework",
] as const

export type EntitlementCourseGroup = (typeof ENTITLEMENT_COURSE_GROUPS)[number]

export type EntitlementNamespace = {
 courseGroup: EntitlementCourseGroup
 /** 共用組別用年級碼（S1）；唔共用則 `class:<uuid>` */
 namespaceKey: string
 sharesAcrossClasses: boolean
}

export type EntitlementNamespaceClassInput = {
 classId: string
 classKind?: string | null
 subject?: string | null
 courseName?: string | null
 grade?: string[] | null
 gradeCode?: string | null
 isTrial?: boolean
}

const HOMEWORK_RE = /功課輔導|HWK|homework/i

export function classNamespaceKey(classId: string): string {
 return `class:${classId}`
}

export function isHomeworkClassSubject(
 subject: string | null | undefined,
 courseName: string | null | undefined
): boolean {
 return HOMEWORK_RE.test(`${subject ?? ""} ${courseName ?? ""}`)
}

/** 單一適用年級 → S1 等；混級／不明 → null（唔共用） */
export function specialistGradeScopeKey(
 grade: string[] | null | undefined,
 gradeCode: string | null | undefined
): string | null {
 const labels = resolveClassGradeLabels(grade, gradeCode)
 if (labels.length !== 1) return null
 const fromLabel = GRADE_TO_COURSE_CODE[labels[0]!]
 if (fromLabel) return fromLabel
 if (gradeCode?.trim()) {
  const normalized = normalizeGradeCode(gradeCode)
  if (/^[PS][1-6]$/.test(normalized)) return normalized
 }
 return null
}

/**
 * 2627 池命名空間（v3）：專科小組同一級共用；私人／試堂／功輔／混級唔共用。
 * 學年閘仍由 `usesEntitlementRosterModel` 負責；本函式唔識 26SM。
 */
export function resolveEntitlementNamespace(
 input: EntitlementNamespaceClassInput
): EntitlementNamespace {
 const classKey = classNamespaceKey(input.classId)
 if (input.isTrial) {
  return { courseGroup: "trial", namespaceKey: classKey, sharesAcrossClasses: false }
 }
 if (isHomeworkClassSubject(input.subject, input.courseName)) {
  return { courseGroup: "homework", namespaceKey: classKey, sharesAcrossClasses: false }
 }
 const kind = resolveClassKind(input.classKind, input.subject)
 if (kind === "private") {
  return { courseGroup: "private", namespaceKey: classKey, sharesAcrossClasses: false }
 }
 const gradeKey = specialistGradeScopeKey(input.grade, input.gradeCode)
 if (gradeKey) {
  return {
   courseGroup: "group_specialist",
   namespaceKey: gradeKey,
   sharesAcrossClasses: true,
  }
 }
 return {
  courseGroup: "group_specialist",
  namespaceKey: classKey,
  sharesAcrossClasses: false,
 }
}

export function namespacesEqual(
 a: EntitlementNamespace,
 b: EntitlementNamespace
): boolean {
 return a.courseGroup === b.courseGroup && a.namespaceKey === b.namespaceKey
}

export function entitlementNamespaceLabel(
 ns: Pick<EntitlementNamespace, "courseGroup" | "namespaceKey" | "sharesAcrossClasses">,
 classLabel: string
): string {
 if (ns.courseGroup === "trial") return classLabel ? `試堂 · ${classLabel}` : "試堂"
 if (ns.courseGroup === "homework") {
  return classLabel ? `功課輔導班 · ${classLabel}` : "功課輔導班"
 }
 if (ns.courseGroup === "private") {
  return classLabel ? `私人課程 · ${classLabel}` : "私人課程"
 }
 if (ns.courseGroup === "group_specialist" && ns.sharesAcrossClasses) {
  const grade = formatStudentGrade(ns.namespaceKey)
  return grade && grade !== "—" ? `專科小組（${grade}）` : "專科小組"
 }
 return classLabel || "專科小組"
}
