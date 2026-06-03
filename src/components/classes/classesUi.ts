import { LESSON_SLOT_INDICES, lessonSlotLabel } from "@/lib/lessonSlots"

/** 班別固定時段選項（與課表／課室 75 分鐘格一致） */
export const CLASS_TIME_SLOT_OPTIONS = LESSON_SLOT_INDICES.map((i) => lessonSlotLabel(i))

function timeSlotsEqual(a: string, b: string): boolean {
 return a === b || a.replace(/\u2013/g, "-") === b.replace(/\u2013/g, "-")
}

/** 表單下拉：對齊標準選項；舊資料（連字號等）保留原值供選取 */
export function timeSlotSelectValueFromStored(raw: string | null | undefined): string {
 if (!raw?.trim()) return ""
 const t = raw.trim()
 const hit = CLASS_TIME_SLOT_OPTIONS.find((opt) => timeSlotsEqual(opt, t))
 return hit ?? t
}

export function isKnownClassTimeSlot(raw: string | null | undefined): boolean {
 if (!raw?.trim()) return true
 return CLASS_TIME_SLOT_OPTIONS.some((opt) => timeSlotsEqual(opt, raw.trim()))
}

/** 將資料庫的星期字串對到看板欄「星期一」…「星期日」 */
const DAY_ALIASES: Record<string, string> = {
 星期一: "星期一",
 星期二: "星期二",
 星期三: "星期三",
 星期四: "星期四",
 星期五: "星期五",
 星期六: "星期六",
 星期日: "星期日",
 週一: "星期一",
 週二: "星期二",
 週三: "星期三",
 週四: "星期四",
 週五: "星期五",
 週六: "星期六",
 週日: "星期日",
 MON: "星期一",
 TUE: "星期二",
 WED: "星期三",
 THU: "星期四",
 FRI: "星期五",
 SAT: "星期六",
 SUN: "星期日",
}

export const KANBAN_DAY_COLUMNS = [
 "星期一",
 "星期二",
 "星期三",
 "星期四",
 "星期五",
 "星期六",
 "星期日",
] as const

export function kanbanDayKey(raw: string | null | undefined): (typeof KANBAN_DAY_COLUMNS)[number] | "其他" {
 if (!raw) return "其他"
 const t = raw.trim()
 const mapped = DAY_ALIASES[t]
 if (mapped && (KANBAN_DAY_COLUMNS as readonly string[]).includes(mapped)) {
  return mapped as (typeof KANBAN_DAY_COLUMNS)[number]
 }
 for (const col of KANBAN_DAY_COLUMNS) {
  if (t.includes(col.replace("星期", "")) || t === col) return col
 }
 return "其他"
}

/** 表單「逢星期」下拉：取第一個逗號片段，對應到「星期一」…「星期日」，否則空字串 */
export function weekdaySelectValueFromStored(raw: string | null | undefined): string {
 if (!raw?.trim()) return ""
 const first = raw.split(/[,，]/)[0]!.trim()
 const upper = first.toUpperCase()
 if (upper.length <= 4 && DAY_ALIASES[upper]) return DAY_ALIASES[upper]
 if (DAY_ALIASES[first]) return DAY_ALIASES[first]
 const k = kanbanDayKey(first)
 return k === "其他" ? "" : k
}

/** 寫回資料庫前收斂為標準「星期一」…「星期日」或 null */
export function toCanonicalWeekdayForStore(raw: string | null | undefined): string | null {
 const v = weekdaySelectValueFromStored(raw)
 return v === "" ? null : v
}

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

const GRADE_OPTION_SET = new Set<string>(CLASS_GRADE_FORM_OPTIONS)

/** 將資料庫年級字串對到表單選項；無法辨識時回傳 null（不勾選） */
export function normalizeClassGradeForForm(g: string): string | null {
 const t = g.trim()
 if (!t) return null
 if (GRADE_OPTION_SET.has(t)) return t
 const noSuffix = t.replace(/級$/, "").trim()
 if (GRADE_OPTION_SET.has(noSuffix)) return noSuffix
 const m = t.match(/^(小|中)([一二三四五六])/)
 if (m) {
  const mapped = `${m[1]}${m[2]}`
  if (GRADE_OPTION_SET.has(mapped)) return mapped
 }
 return null
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

export const STATUS_CHIPS = ["全部", "招生中", "進行中", "已結束", "已滿班"] as const

export function classMatchesGrade(c: { grade: string[] | null }, key: string): boolean {
 if (key === "全部") return true
 const arr = c.grade ?? []
 return arr.some((g) => g === key || g.includes(key))
}

export function classMatchesSubject(c: { subject: string }, key: string): boolean {
 if (key === "全部") return true
 return c.subject.includes(key)
}

export function classMatchesStatus(c: { status: string }, key: string): boolean {
 if (key === "全部") return true
 return c.status === key || c.status.includes(key)
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
 return kanbanDayKey(c.day_of_week) === key
}
