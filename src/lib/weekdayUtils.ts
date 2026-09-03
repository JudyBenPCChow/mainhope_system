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

function canonicalWeekdayToken(token: string): (typeof KANBAN_DAY_COLUMNS)[number] | null {
 const t = token.trim()
 if (!t) return null
 const upper = t.toUpperCase()
 if (upper.length <= 4 && DAY_ALIASES[upper]) {
  return DAY_ALIASES[upper] as (typeof KANBAN_DAY_COLUMNS)[number]
 }
 if (DAY_ALIASES[t]) return DAY_ALIASES[t] as (typeof KANBAN_DAY_COLUMNS)[number]
 const k = kanbanDayKey(t)
 return k === "其他" ? null : k
}

/** 解析資料庫 day_of_week（支援逗號分隔多選）→ 標準 weekday 陣列 */
export function weekdaysFromStored(raw: string | null | undefined): string[] {
 if (!raw?.trim()) return []
 const seen = new Set<string>()
 const out: string[] = []
 for (const part of raw.split(/[,，]/)) {
  const canonical = canonicalWeekdayToken(part)
  if (canonical && !seen.has(canonical)) {
   seen.add(canonical)
   out.push(canonical)
  }
 }
 return out.sort(
  (a, b) =>
   KANBAN_DAY_COLUMNS.indexOf(a as (typeof KANBAN_DAY_COLUMNS)[number]) -
   KANBAN_DAY_COLUMNS.indexOf(b as (typeof KANBAN_DAY_COLUMNS)[number])
 )
}

/** 表單多選 → 寫回資料庫（英文逗號分隔）或 null */
export function weekdaysToStored(days: string[]): string | null {
 const canonical = days
  .map((d) => canonicalWeekdayToken(d))
  .filter((d): d is (typeof KANBAN_DAY_COLUMNS)[number] => d != null)
 const unique = [...new Set(canonical)].sort(
  (a, b) =>
   KANBAN_DAY_COLUMNS.indexOf(a) - KANBAN_DAY_COLUMNS.indexOf(b)
 )
 return unique.length > 0 ? unique.join(",") : null
}

/** 顯示用：星期一,星期三 → 星期一、星期三 */
export function formatWeekdaysDisplay(raw: string | null | undefined): string {
 const days = weekdaysFromStored(raw)
 if (days.length > 0) return days.join("、")
 return raw?.trim() ?? ""
}

export function weekdaysEqual(
 a: string[] | string | null | undefined,
 b: string[] | string | null | undefined
): boolean {
 const toArr = (v: string[] | string | null | undefined) =>
  Array.isArray(v) ? weekdaysToStored(v)?.split(",") ?? [] : weekdaysFromStored(v)
 const sa = toArr(a)
 const sb = toArr(b)
 return sa.length === sb.length && sa.every((v, i) => v === sb[i])
}

/** 表單「逢星期」下拉：取第一個逗號片段，對應到「星期一」…「星期日」，否則空字串 */
export function weekdaySelectValueFromStored(raw: string | null | undefined): string {
 if (!raw?.trim()) return ""
 const first = raw.split(/[,，]/)[0]!.trim()
 const canonical = canonicalWeekdayToken(first)
 return canonical ?? ""
}

/** 寫回資料庫前收斂為標準「星期一」…「星期日」或 null（支援多選逗號字串） */
export function toCanonicalWeekdayForStore(raw: string | null | undefined): string | null {
 if (!raw?.trim()) return null
 return weekdaysToStored(weekdaysFromStored(raw))
}

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

/** 星期一至五（本機日曆） */
export function isWeekdayYmd(ymd: string): boolean {
 const [y, m, d] = ymd.split("-").map(Number)
 if (!y || !m || !d) return false
 const dow = new Date(y, m - 1, d).getDay()
 return dow >= 1 && dow <= 5
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

/** 本機日曆日 `YYYY-MM-DD`（與排程 `scheduled_date` 對齊） */
export function isYmd(s: string | null | undefined): s is string {
 return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

/** 本機日曆今日 `YYYY-MM-DD`（與排程 `scheduled_date` 對齊） */
export function todayYmdLocal(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

function addDaysYmdLocal(ymd: string, days: number): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 dt.setDate(dt.getDate() + days)
 return todayYmdLocal(dt)
}

/** 顯示用：2026-07-05 → 7/5 */
export function formatScheduleDateShort(ymd: string): string {
 const [, m, d] = ymd.split("-").map(Number)
 if (!m || !d) return ymd
 return `${m}/${d}`
}

export function addDaysYmd(ymd: string, days: number): string {
 return addDaysYmdLocal(ymd, days)
}

/** 含 ymd 的該週週一（YYYY-MM-DD） */
export function mondayYmdOfWeekContaining(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 const dow = dt.getDay()
 const diff = dow === 0 ? -6 : 1 - dow
 dt.setDate(dt.getDate() + diff)
 const yy = dt.getFullYear()
 const mm = String(dt.getMonth() + 1).padStart(2, "0")
 const dd = String(dt.getDate()).padStart(2, "0")
 return `${yy}-${mm}-${dd}`
}
