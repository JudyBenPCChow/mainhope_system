/** 一對一／一對二／單對單班別：subject 慣用命名（migration 回填前後皆可用） */
export const PRIVATE_CLASS_SUBJECT_RE = /一對一|一對二|單對單/

export type ClassKind = "group" | "private" | "homework"

/** 畫面班型。一對一／一對二只作私人課程子類（班名），唔當產品線總稱。 */
export function classKindLabel(kind: string): string {
 if (kind === "private") return "私人課程"
 if (kind === "homework") return "功課輔導班"
 return "專科班"
}

export function isPrivateClassSubject(subject: string | null | undefined): boolean {
 if (!subject) return false
 return PRIVATE_CLASS_SUBJECT_RE.test(subject)
}

export function isHomeworkClassKind(kind: string | null | undefined): boolean {
 return kind === "homework"
}

type ScheduleTeacherFields = {
 teacher_id: string | null
 teacher_name?: string | null
 status: string
 class_kind?: string | null
}

/**
 * 專科／私人缺實際授課老師才要警告。
 * 功輔佔室可無當值（第二房不開／暫時空缺屬正常；跟當值編更，唔跟班別任教老師）。
 */
export function isUnassignedTeachingTeacherIssue(row: ScheduleTeacherFields): boolean {
 if (row.teacher_id) return false
 if (row.status.includes("取消")) return false
 if (isHomeworkClassKind(row.class_kind)) return false
 return true
}

/** 列表／詳情老師欄：功輔無當值顯示暫時空缺，唔當未指定老師。 */
export function scheduleTeacherDisplayName(
 row: ScheduleTeacherFields,
 opts: { warnIfUnassigned: boolean }
): string {
 const name = row.teacher_name?.trim()
 if (name) return name
 if (isHomeworkClassKind(row.class_kind) && !row.status.includes("取消")) return "暫時空缺"
 if (opts.warnIfUnassigned && !row.teacher_id) return "未指定老師"
 return "—"
}

export function resolveClassKind(
 classKind: string | null | undefined,
 subject: string | null | undefined
): ClassKind {
 if (classKind === "private") return "private"
 if (classKind === "homework") return "homework"
 if (classKind === "group") return "group"
 return isPrivateClassSubject(subject) ? "private" : "group"
}
