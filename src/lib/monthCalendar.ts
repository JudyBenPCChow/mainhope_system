/** 月視格：純排版資料（不含 React／業務） */

export const MONTH_CALENDAR_WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"] as const

export type MonthCalendarDayBase = {
  key: string
  day: number
  weekdayIndex: number
  weekdayChar: string
}

/** 依該月首日星期，在月曆格前方補空位（星期日＝0） */
export function padMonthCalendarDays<T extends { weekdayIndex: number }>(
  days: readonly T[]
): Array<T | null> {
  const first = days[0]
  if (!first) return []
  return [...Array.from({ length: first.weekdayIndex }, () => null), ...days]
}
