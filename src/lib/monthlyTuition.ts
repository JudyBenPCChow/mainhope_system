export function normalizeBillingMonth(value: string): string {
 const match = /^(\d{4})-(\d{2})/.exec(value.trim())
 if (!match) throw new Error("帳期格式必須為 YYYY-MM")
 const month = Number(match[2])
 if (month < 1 || month > 12) throw new Error("帳期月份無效")
 return `${match[1]}-${match[2]}`
}

export function billingMonthDate(value: string): string {
 return `${normalizeBillingMonth(value)}-01`
}

export function billingMonthBounds(value: string): { start: string; end: string } {
 const month = normalizeBillingMonth(value)
 const [year, monthNumber] = month.split("-").map(Number)
 const end = new Date(Date.UTC(year!, monthNumber!, 0)).toISOString().slice(0, 10)
 return { start: `${month}-01`, end }
}

export function addBillingMonths(value: string, count: number): string {
 const month = normalizeBillingMonth(value)
 const [year, monthNumber] = month.split("-").map(Number)
 const date = new Date(Date.UTC(year!, monthNumber! - 1 + count, 1))
 return date.toISOString().slice(0, 7)
}

export function enumerateBillingMonths(firstMonth: string, count: number): string[] {
 const safeCount = Math.min(Math.max(Math.trunc(count), 1), 12)
 return Array.from({ length: safeCount }, (_, index) => addBillingMonths(firstMonth, index))
}

export function formatBillingMonth(value: string): string {
 const month = normalizeBillingMonth(value)
 const [year, monthNumber] = month.split("-")
 return `${year} 年 ${Number(monthNumber)} 月`
}

export function calculateMonthlyTuition(input: {
 calendarLessonCount: number
 leaveDeductionCount: number
 unitPrice: number
 creditApplied?: number
}): {
 chargeableLessonCount: number
 grossAmount: number
 creditApplied: number
 netAmount: number
} {
 const calendarLessonCount = Math.max(0, Math.trunc(input.calendarLessonCount))
 const leaveDeductionCount = Math.min(
  calendarLessonCount,
  Math.max(0, Math.trunc(input.leaveDeductionCount))
 )
 const chargeableLessonCount = calendarLessonCount - leaveDeductionCount
 const unitPrice = Math.max(0, Number(input.unitPrice) || 0)
 const grossAmount = Math.round(chargeableLessonCount * unitPrice * 100) / 100
 const requestedCredit = Math.max(0, Number(input.creditApplied) || 0)
 const creditApplied = Math.min(grossAmount, Math.round(requestedCredit * 100) / 100)
 return {
  chargeableLessonCount,
  grossAmount,
  creditApplied,
  netAmount: Math.round((grossAmount - creditApplied) * 100) / 100,
 }
}
