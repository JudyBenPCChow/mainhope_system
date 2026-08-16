/** 一對一／一對二／單對單班別：subject 慣用命名（migration 回填前後皆可用） */
export const PRIVATE_CLASS_SUBJECT_RE = /一對一|一對二|單對單/

export type ClassKind = "group" | "private"

/** 畫面班型。一對一／一對二只作私人課程子類（班名），唔當產品線總稱。 */
export function classKindLabel(kind: string): string {
 return kind === "private" ? "私人課程" : "專科班"
}

export function isPrivateClassSubject(subject: string | null | undefined): boolean {
 if (!subject) return false
 return PRIVATE_CLASS_SUBJECT_RE.test(subject)
}

export function resolveClassKind(
 classKind: string | null | undefined,
 subject: string | null | undefined
): ClassKind {
 if (classKind === "private") return "private"
 if (classKind === "group") return "group"
 return isPrivateClassSubject(subject) ? "private" : "group"
}
