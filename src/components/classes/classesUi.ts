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

export const GRADE_CHIPS = [
  "全部",
  "小四",
  "小五",
  "小六",
  "中一",
  "中二",
  "中三",
  "中四",
  "中五",
] as const

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
