import {
 PRIMARY_STUDENT_GRADE_CODES,
 STUDENT_GRADE_CODES,
 STUDENT_GRADE_LABELS,
} from "@/lib/studentGrade"

export const GRADE_FILTER_PRIMARY_KEY = "PRIMARY" as const

export const GRADE_FILTERS = [
 { key: "all", label: "全部" },
 { key: GRADE_FILTER_PRIMARY_KEY, label: "小學" },
 ...STUDENT_GRADE_CODES.filter(
  (code) => !(PRIMARY_STUDENT_GRADE_CODES as readonly string[]).includes(code)
 ).map((code) => ({
  key: code,
  label: STUDENT_GRADE_LABELS[code],
 })),
] as const
