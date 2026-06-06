import { KANBAN_DAY_COLUMNS } from "@/components/classes/classesUi"

const JS_DOW_TO_LABEL: Record<number, (typeof KANBAN_DAY_COLUMNS)[number]> = {
 0: "星期日",
 1: "星期一",
 2: "星期二",
 3: "星期三",
 4: "星期四",
 5: "星期五",
 6: "星期六",
}

/** YYYY-MM-DD → 「星期一」…「星期日」 */
export function weekdayLabelFromYmd(ymd: string): (typeof KANBAN_DAY_COLUMNS)[number] | null {
 const [y, m, d] = ymd.split("-").map(Number)
 if (!y || !m || !d) return null
 const dt = new Date(y, m - 1, d)
 return JS_DOW_TO_LABEL[dt.getDay()] ?? null
}

/** 列舉 fromYmd..toYmd 內符合 weekday 標籤的所有日期 */
export function enumerateDatesForWeekday(
 fromYmd: string,
 toYmd: string,
 weekdayLabel: string
): string[] {
 const canonical = weekdayLabel.trim()
 if (!canonical) return []
 const out: string[] = []
 let cur = fromYmd
 while (cur <= toYmd) {
  if (weekdayLabelFromYmd(cur) === canonical) out.push(cur)
  cur = addDaysYmdLocal(cur, 1)
 }
 return out
}

function addDaysYmdLocal(ymd: string, days: number): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 dt.setDate(dt.getDate() + days)
 const yy = dt.getFullYear()
 const mm = String(dt.getMonth() + 1).padStart(2, "0")
 const dd = String(dt.getDate()).padStart(2, "0")
 return `${yy}-${mm}-${dd}`
}

/** 顯示用：2026-07-05 → 7/5 */
export function formatScheduleDateShort(ymd: string): string {
 const [, m, d] = ymd.split("-").map(Number)
 if (!m || !d) return ymd
 return `${m}/${d}`
}
