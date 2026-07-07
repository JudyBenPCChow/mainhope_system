/** 學生年級碼（public.students.grade） */
export const STUDENT_GRADE_CODES = [
 "P1",
 "P2",
 "P3",
 "P4",
 "P5",
 "P6",
 "S1",
 "S2",
 "S3",
 "S4",
 "S5",
 "S6",
 "GD",
 "NA",
] as const

export type StudentGradeCode = (typeof STUDENT_GRADE_CODES)[number]

export const PRIMARY_STUDENT_GRADE_CODES = ["P1", "P2", "P3", "P4", "P5", "P6"] as const

export const STUDENT_GRADE_LABELS: Record<StudentGradeCode, string> = {
 P1: "小一",
 P2: "小二",
 P3: "小三",
 P4: "小四",
 P5: "小五",
 P6: "小六",
 S1: "中一",
 S2: "中二",
 S3: "中三",
 S4: "中四",
 S5: "中五",
 S6: "中六",
 GD: "已畢業",
 NA: "不適用",
}

const ZH_TO_CODE: Record<string, StudentGradeCode> = {
 小一: "P1",
 小二: "P2",
 小三: "P3",
 小四: "P4",
 小五: "P5",
 小六: "P6",
 中一: "S1",
 中二: "S2",
 中三: "S3",
 中四: "S4",
 中五: "S5",
 中六: "S6",
 已畢業: "GD",
 畢業: "GD",
 不適用: "NA",
 NA: "NA",
 GD: "GD",
}

export function isStudentGradeCode(value: string): value is StudentGradeCode {
 return (STUDENT_GRADE_CODES as readonly string[]).includes(value)
}

export function isPrimaryStudentGrade(raw: string | null | undefined): boolean {
 const code = normalizeStudentGrade(raw)
 return code != null && (PRIMARY_STUDENT_GRADE_CODES as readonly string[]).includes(code)
}

/** 匯入／舊資料 → 標準年級碼；無法辨識則回傳 null */
export function normalizeStudentGrade(raw: string | null | undefined): StudentGradeCode | null {
 if (raw == null) return null
 const t = raw.trim()
 if (!t || t === "—" || t === "-") return null
 const upper = t.toUpperCase()
 if (isStudentGradeCode(upper)) return upper
 const fMatch = /^F([1-6])$/i.exec(upper)
 if (fMatch) return `S${fMatch[1]}` as StudentGradeCode
 if (upper === "N/A") return "NA"
 const zh = ZH_TO_CODE[t] ?? ZH_TO_CODE[upper]
 if (zh) return zh
 return null
}

/** 單據等需顯示年級代碼（如 S6） */
export function formatStudentGradeCode(raw: string | null | undefined): string {
 const code = normalizeStudentGrade(raw)
 if (code) return code
 const t = raw?.trim()
 return t && t !== "—" ? t.toUpperCase() : "—"
}

/** 顯示用：僅中文標籤（如「中一」），不含代碼 */
export function formatStudentGrade(raw: string | null | undefined): string {
 if (raw == null || !String(raw).trim()) return "—"
 const code = normalizeStudentGrade(raw)
 if (!code) return String(raw).trim()
 return STUDENT_GRADE_LABELS[code]
}
