import { addDaysYmd, todayYmdLocal } from "@/lib/weekdayUtils"

/** 下一個功輔上課日：自 fromYmd 翌日起，跳過 closure 集合內日期。 */
export function nextHomeworkSchoolDay(
  fromYmd: string,
  closureDates: ReadonlySet<string>,
  maxLookaheadDays = 60
): string {
  let cur = addDaysYmd(fromYmd, 1)
  for (let i = 0; i < maxLookaheadDays; i += 1) {
    if (!closureDates.has(cur)) return cur
    cur = addDaysYmd(cur, 1)
  }
  return addDaysYmd(fromYmd, 1)
}

/** 假期列可能是 `YYYY-MM-DD` 或功輔月曆用的 `M/D`；統一成 YMD 供日期推算。 */
export function homeworkClosureYmdSet(
  holidays: Array<{ date: string }>,
  academicYearLabel: string
): Set<string> {
  const startYear = 2000 + (Number.parseInt(academicYearLabel.slice(0, 2), 10) || 26)
  const out = new Set<string>()
  for (const h of holidays) {
    const d = String(h.date ?? "").trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      out.add(d)
      continue
    }
    const m = /^(\d{1,2})\/(\d{1,2})$/.exec(d)
    if (!m) continue
    const month = Number(m[1])
    const day = Number(m[2])
    if (!month || !day) continue
    const year = month >= 8 ? startYear : startYear + 1
    out.add(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    )
  }
  return out
}

/** @deprecated 改用 homeworkClosureYmdSet（需學年以還原 M/D）。 */
export function homeworkClosureDateSet(
  holidays: Array<{ date: string }>
): Set<string> {
  return new Set(holidays.map((h) => h.date).filter(Boolean))
}

export { todayYmdLocal }

/** 今日名冊：由 afterId 起往後找下一位尚未建檔者（可環繞）。 */
export function nextUnwrittenStudentId(
  coming: { id: string }[],
  afterId: string,
  writtenIds: ReadonlySet<string>
): string | null {
  const start = coming.findIndex((s) => s.id === afterId)
  if (start < 0 || coming.length === 0) return null
  for (let i = 1; i < coming.length; i++) {
    const s = coming[(start + i) % coming.length]!
    if (s.id === afterId) continue
    if (!writtenIds.has(s.id)) return s.id
  }
  return null
}

/** 當日紀錄進度（漸進填寫：先到→再填→最後離）。 */
export type HwDayLogPhase = "none" | "open" | "left"

export function homeworkDayLogPhase(log: {
  arrivedAt: string | null
  leftAt: string | null
} | null | undefined): HwDayLogPhase {
  if (!log) return "none"
  if (log.leftAt) return "left"
  return "open"
}

export function homeworkDayLogPhaseLabel(phase: HwDayLogPhase): string {
  if (phase === "none") return "未建檔"
  if (phase === "left") return "已離開"
  return "進行中"
}

/** 核心日結欄是否大致齊（不含到離；供名冊提示）。 */
export function homeworkDayLogCoreFilled(log: {
  fullTwoHours: boolean | null
  homeworkDone: boolean | null
  handbookStatus: string | null
} | null | undefined): boolean {
  if (!log) return false
  return log.fullTwoHours != null && log.homeworkDone != null && Boolean(log.handbookStatus)
}
