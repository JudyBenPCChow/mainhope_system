/** 月份下拉：YYYY-MM 選項與標籤（避開原生 `input type=month`） */

export const MONTH_INPUT_LOOKBACK = 36
export const MONTH_INPUT_LOOKAHEAD = 24

const MONTH_KEY_RE = /^(\d{4})-(\d{2})/

export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function parseMonthKey(value: string | undefined | null): string | null {
  if (value == null) return null
  const match = MONTH_KEY_RE.exec(String(value).trim())
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return `${match[1]}-${match[2]}`
}

export function formatMonthInputLabel(monthKey: string): string {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) return monthKey
  const year = Number(parsed.slice(0, 4))
  const month = Number(parsed.slice(5, 7))
  return `${year}年${month}月`
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) throw new Error(`無效月份：${monthKey}`)
  const year = Number(parsed.slice(0, 4))
  const month = Number(parsed.slice(5, 7))
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export type MonthInputOption = { value: string; label: string; year: number }

export function listMonthInputOptions(opts?: {
  now?: Date
  min?: string | number
  max?: string | number
  value?: string
  lookback?: number
  lookahead?: number
}): MonthInputOption[] {
  const now = opts?.now ?? new Date()
  const lookback = opts?.lookback ?? MONTH_INPUT_LOOKBACK
  const lookahead = opts?.lookahead ?? MONTH_INPUT_LOOKAHEAD
  const center = currentMonthKey(now)
  const minKey = parseMonthKey(opts?.min != null ? String(opts.min) : null)
  const maxKey = parseMonthKey(opts?.max != null ? String(opts.max) : null)
  const extra = parseMonthKey(opts?.value)

  const keys = new Set<string>()
  for (let i = -lookback; i <= lookahead; i++) {
    keys.add(shiftMonthKey(center, i))
  }

  const out = [...keys].filter((key) => (!minKey || key >= minKey) && (!maxKey || key <= maxKey))
  if (extra && !out.includes(extra)) out.push(extra)
  out.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))

  return out.map((value) => ({
    value,
    label: formatMonthInputLabel(value),
    year: Number(value.slice(0, 4)),
  }))
}

export function groupMonthInputOptions(
  options: readonly MonthInputOption[]
): Array<{ year: number; items: MonthInputOption[] }> {
  const map = new Map<number, MonthInputOption[]>()
  for (const option of options) {
    const list = map.get(option.year)
    if (list) list.push(option)
    else map.set(option.year, [option])
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }))
}
