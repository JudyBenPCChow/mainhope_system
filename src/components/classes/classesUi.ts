import { normalizeStoredClassGradeLabel, resolveClassGradeLabels } from "@/lib/classGrade"
import { SUBJECT_TO_COURSE_ABBR, academicYearLabelFromStartDate, subjectChineseToAbbr } from "@/lib/courseCode"
import { isPrivateClassSubject } from "@/lib/privateClassKind"
import { KANBAN_DAY_COLUMNS, weekdaysFromStored } from "@/lib/weekdayUtils"

export {
 CLASS_TIME_SLOT_OPTIONS,
 isKnownClassTimeSlot,
 timeSlotSelectValueFromStored,
} from "@/lib/classTimeSlot"
export {
 formatWeekdaysDisplay,
 KANBAN_DAY_COLUMNS,
 kanbanDayKey,
 toCanonicalWeekdayForStore,
 weekdaySelectValueFromStored,
 weekdaysEqual,
 weekdaysFromStored,
 weekdaysToStored,
} from "@/lib/weekdayUtils"

/** 班別適用年級：表單多選選項（與篩選／匯入資料相容） */
export const CLASS_GRADE_FORM_OPTIONS = [
 "小一",
 "小二",
 "小三",
 "小四",
 "小五",
 "小六",
 "中一",
 "中二",
 "中三",
 "中四",
 "中五",
 "中六",
 "其他",
] as const

/** 將資料庫年級字串對到表單選項；無法辨識時回傳 null（不勾選） */
export function normalizeClassGradeForForm(g: string): string | null {
 const mapped = normalizeStoredClassGradeLabel(g)
 if (mapped) return mapped
 const t = g.trim()
 return t === "其他" ? "其他" : null
}

/** 班別列表篩選用年級（中學；不含小學） */
export const GRADE_CHIPS = [
 "全部",
 "中一",
 "中二",
 "中三",
 "中四",
 "中五",
 "中六",
] as const

const PRIMARY_GRADE_LABELS = new Set(["小一", "小二", "小三", "小四", "小五", "小六"])

export function isPrimaryGradeLabel(label: string): boolean {
 return PRIMARY_GRADE_LABELS.has(label.trim())
}

export const DAY_FILTER_CHIPS = ["全部", ...KANBAN_DAY_COLUMNS] as const

export const SUBJECT_CHIPS = ["全部", "中文", "英文", "數學", "化學"] as const

/** 列表篩選 chip → 科目代碼（與 SUBJECT_TO_COURSE_ABBR 簡名一致） */
const SUBJECT_CHIP_TO_ABBR: Record<string, string> = {
 中文: "CHI",
 英文: "ENG",
 數學: "MATH",
 化學: "CHEM",
}

export function subjectAbbrForClass(c: {
 subject: string
 subject_code?: string | null
}): string | null {
 const code = (c.subject_code ?? "").trim().toUpperCase()
 if (code) return code
 return subjectChineseToAbbr(c.subject)
}

/** 將班別科目對應到篩選 chip 標籤（若無對應 chip 則回傳原科目名） */
export function subjectChipLabelForClass(c: {
 subject: string
 subject_code?: string | null
}): string {
 const subj = c.subject.trim()
 const abbr = subjectAbbrForClass(c)
 if (abbr) {
  for (const [chip, chipAbbr] of Object.entries(SUBJECT_CHIP_TO_ABBR)) {
   if (chipAbbr === abbr) return chip
  }
 }
 return subj || "—"
}

/** 班別管理科目篩選：排除功輔／私人課程等非專科科目標籤 */
export function isSpecialtySubjectFilterLabel(label: string): boolean {
 const t = label.trim()
 if (!t || t === "—" || t === "全部") return false
 if (t.toUpperCase() === "HWK") return false
 if (/功課輔導|homework/i.test(t)) return false
 if (isPrivateClassSubject(t)) return false
 return true
}

export function buildSubjectFilterChips(
 rows: { subject: string; subject_code?: string | null }[],
 options?: { includeCommonWhenEmpty?: boolean }
): string[] {
 const labels = new Set<string>()
 for (const c of rows) {
  const label = subjectChipLabelForClass(c)
  if (label && isSpecialtySubjectFilterLabel(label)) labels.add(label)
 }
 if (labels.size === 0 && options?.includeCommonWhenEmpty) {
  return [...SUBJECT_CHIPS]
 }
 const ordered = ["全部"]
 for (const chip of SUBJECT_CHIPS) {
  if (chip !== "全部" && labels.has(chip)) ordered.push(chip)
 }
 for (const label of [...labels].sort((a, b) => a.localeCompare(b, "zh-Hant"))) {
  if (!ordered.includes(label)) ordered.push(label)
 }
 return ordered
}

export const STATUS_CHIPS = ["全部", "招生中", "進行中", "已結束", "已滿班"] as const

export function classAcademicYearLabel(c: {
 academic_year_label?: string | null
 start_date?: string | null
}): string {
 const fromDb = (c.academic_year_label ?? "").trim()
 if (fromDb) return fromDb
 return academicYearLabelFromStartDate(c.start_date)
}

export function academicYearLabelsMatch(a: string, b: string): boolean {
 return a.trim().toUpperCase() === b.trim().toUpperCase()
}

export function classMatchesGrade(
 c: { grade: string[] | null; grade_code?: string | null },
 key: string
): boolean {
 if (key === "全部") return true
 const arr = resolveClassGradeLabels(c.grade, c.grade_code)
 return arr.some((g) => {
  const t = g.trim()
  return t === key || t.includes(key)
 })
}

export function classMatchesSubject(
 c: { subject: string; subject_code?: string | null },
 key: string
): boolean {
 if (key === "全部") return true
 const subj = c.subject.trim()
 if (subj === key || subj.includes(key)) return true

 const classAbbr = subjectAbbrForClass(c)
 const chipAbbr = SUBJECT_CHIP_TO_ABBR[key] ?? subjectChineseToAbbr(key)?.toUpperCase() ?? null
 if (classAbbr && chipAbbr && classAbbr === chipAbbr) return true

 if (chipAbbr && subj.toUpperCase() === chipAbbr) return true

 for (const [name, abbr] of Object.entries(SUBJECT_TO_COURSE_ABBR)) {
  if (abbr === chipAbbr && (subj === name || subj.includes(name) || name.includes(subj))) return true
 }

 return false
}

export function classMatchesStatus(c: { status: string }, key: string): boolean {
 if (key === "全部") return true
 const status = c.status.trim()
 return status === key || status.includes(key)
}

export function classMatchesTeacher(
 c: { teacher_id: string | null; teacher_name: string | null },
 key: string
): boolean {
 if (key === "全部") return true
 const name = (c.teacher_name ?? "").trim()
 return name === key || name.includes(key)
}

export function classMatchesDay(c: { day_of_week: string | null }, key: string): boolean {
 if (key === "全部") return true
 return weekdaysFromStored(c.day_of_week).includes(key)
}
