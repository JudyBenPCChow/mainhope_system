/** 營運總覽毛利／純利：純計算。分析窗由 2026-07 起。 */

export const PROFIT_ANALYSIS_START = "2026-07-01"

export const TUTOR_LABOR_ACCOUNT_CODES = ["labor_tutor", "labor_employer_mpf"] as const

export type MonthProfitPoint = {
 monthKey: string
 label: string
 consumedValue: number
 tutorLabor: number
 tutorLaborPosted: boolean
 totalExpenses: number
 grossProfit: number | null
 grossMarginPct: number | null
 netProfit: number
 netMarginPct: number | null
}

export function clampFromProfitWindow(fromYmd: string): string {
 return fromYmd < PROFIT_ANALYSIS_START ? PROFIT_ANALYSIS_START : fromYmd
}

export function monthKeysInclusive(fromYmd: string, toYmd: string): string[] {
 const start = clampFromProfitWindow(fromYmd).slice(0, 7)
 const end = toYmd.slice(0, 7)
 if (end < start) return []
 const keys: string[] = []
 let [y, m] = start.split("-").map(Number)
 const [ey, em] = end.split("-").map(Number)
 while (y < ey || (y === ey && m <= em)) {
  keys.push(`${y}-${String(m).padStart(2, "0")}`)
  m += 1
  if (m > 12) {
   m = 1
   y += 1
  }
 }
 return keys
}

export function monthKeyLabel(monthKey: string): string {
 const month = Number(monthKey.slice(5, 7))
 return `${month}月`
}

export function monthLastDay(monthKey: string): string {
 const y = Number(monthKey.slice(0, 4))
 const m = Number(monthKey.slice(5, 7))
 const d = new Date(y, m, 0).getDate()
 return `${monthKey}-${String(d).padStart(2, "0")}`
}

export function roundHkd(n: number): number {
 return Math.round(n * 100) / 100
}

export function ratioPct(numer: number, denom: number): number | null {
 if (!(denom > 0)) return null
 return Math.round((numer / denom) * 1000) / 10
}

export function computeMonthProfit(input: {
 monthKey: string
 consumedValue: number
 tutorLabor: number
 tutorLaborPosted: boolean
 totalExpenses: number
}): MonthProfitPoint {
 const consumed = roundHkd(input.consumedValue)
 const labor = roundHkd(input.tutorLabor)
 const expenses = roundHkd(input.totalExpenses)
 const gross = input.tutorLaborPosted ? roundHkd(consumed - labor) : null
 const net = roundHkd(consumed - expenses)
 return {
  monthKey: input.monthKey,
  label: monthKeyLabel(input.monthKey),
  consumedValue: consumed,
  tutorLabor: labor,
  tutorLaborPosted: input.tutorLaborPosted,
  totalExpenses: expenses,
  grossProfit: gross,
  grossMarginPct: gross == null ? null : ratioPct(gross, consumed),
  netProfit: net,
  netMarginPct: ratioPct(net, consumed),
 }
}
