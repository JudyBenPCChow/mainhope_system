/**
 * 常規學年專科班「常規第 N 期」上課日（附件甲）。
 * 學費追收以期為單位；日期集合為真源（各星期幾各自四堂，曆日可交錯）。
 * 來源：docs/year/2627/ops-guide.md 附件甲；docs/policies/academic/ACADEMIC_CALENDAR.md
 */

export type SpecialistTuitionPeriod = {
 /** 1–10 */
 index: number
 /** 如「常規第一期」 */
 label: string
 /** 該期全部上課日（YYYY-MM-DD），已排序 */
 dates: readonly string[]
 /** dates 最早／最晚，供排程範圍查詢 */
 from: string
 to: string
}

const ORDINAL = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"] as const

function ymd(year: number, month: number, day: number): string {
 return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** [day, month, year] */
type Dmy = readonly [number, number, number]

function buildPeriod(index: number, rows: readonly Dmy[]): SpecialistTuitionPeriod {
 const dates = [...new Set(rows.map(([d, m, y]) => ymd(y, m, d)))].sort()
 return {
  index,
  label: `常規第${ORDINAL[index]}期`,
  dates,
  from: dates[0]!,
  to: dates[dates.length - 1]!,
 }
}

/**
 * 2627 附件甲十期上課日（日一二三四五六各四堂）。
 * 欄序與附件一致：日、一、二、三、四、五、六。
 */
const PERIODS_2627: readonly SpecialistTuitionPeriod[] = [
 buildPeriod(1, [
  [6, 9, 2026], [7, 9, 2026], [1, 9, 2026], [2, 9, 2026], [3, 9, 2026], [4, 9, 2026], [5, 9, 2026],
  [13, 9, 2026], [14, 9, 2026], [8, 9, 2026], [9, 9, 2026], [10, 9, 2026], [11, 9, 2026], [12, 9, 2026],
  [20, 9, 2026], [21, 9, 2026], [15, 9, 2026], [16, 9, 2026], [17, 9, 2026], [18, 9, 2026], [19, 9, 2026],
  [27, 9, 2026], [28, 9, 2026], [22, 9, 2026], [23, 9, 2026], [24, 9, 2026], [25, 9, 2026], [3, 10, 2026],
 ]),
 buildPeriod(2, [
  [4, 10, 2026], [5, 10, 2026], [29, 9, 2026], [30, 9, 2026], [8, 10, 2026], [2, 10, 2026], [10, 10, 2026],
  [11, 10, 2026], [12, 10, 2026], [6, 10, 2026], [7, 10, 2026], [15, 10, 2026], [9, 10, 2026], [17, 10, 2026],
  [25, 10, 2026], [19, 10, 2026], [13, 10, 2026], [14, 10, 2026], [22, 10, 2026], [16, 10, 2026], [24, 10, 2026],
  [1, 11, 2026], [26, 10, 2026], [20, 10, 2026], [21, 10, 2026], [29, 10, 2026], [23, 10, 2026], [31, 10, 2026],
 ]),
 buildPeriod(3, [
  [8, 11, 2026], [2, 11, 2026], [27, 10, 2026], [28, 10, 2026], [5, 11, 2026], [30, 10, 2026], [7, 11, 2026],
  [15, 11, 2026], [9, 11, 2026], [3, 11, 2026], [4, 11, 2026], [12, 11, 2026], [6, 11, 2026], [14, 11, 2026],
  [22, 11, 2026], [16, 11, 2026], [10, 11, 2026], [11, 11, 2026], [19, 11, 2026], [13, 11, 2026], [21, 11, 2026],
  [29, 11, 2026], [23, 11, 2026], [17, 11, 2026], [18, 11, 2026], [26, 11, 2026], [20, 11, 2026], [28, 11, 2026],
 ]),
 buildPeriod(4, [
  [6, 12, 2026], [30, 11, 2026], [24, 11, 2026], [25, 11, 2026], [3, 12, 2026], [27, 11, 2026], [5, 12, 2026],
  [13, 12, 2026], [7, 12, 2026], [1, 12, 2026], [2, 12, 2026], [10, 12, 2026], [4, 12, 2026], [12, 12, 2026],
  [20, 12, 2026], [14, 12, 2026], [8, 12, 2026], [9, 12, 2026], [17, 12, 2026], [11, 12, 2026], [19, 12, 2026],
  [3, 1, 2027], [21, 12, 2026], [15, 12, 2026], [16, 12, 2026], [24, 12, 2026], [18, 12, 2026], [2, 1, 2027],
 ]),
 buildPeriod(5, [
  [10, 1, 2027], [4, 1, 2027], [22, 12, 2026], [23, 12, 2026], [7, 1, 2027], [8, 1, 2027], [9, 1, 2027],
  [17, 1, 2027], [11, 1, 2027], [5, 1, 2027], [6, 1, 2027], [14, 1, 2027], [15, 1, 2027], [16, 1, 2027],
  [24, 1, 2027], [18, 1, 2027], [12, 1, 2027], [13, 1, 2027], [21, 1, 2027], [22, 1, 2027], [23, 1, 2027],
  [31, 1, 2027], [25, 1, 2027], [19, 1, 2027], [20, 1, 2027], [28, 1, 2027], [29, 1, 2027], [30, 1, 2027],
 ]),
 buildPeriod(6, [
  [14, 2, 2027], [1, 2, 2027], [26, 1, 2027], [27, 1, 2027], [11, 2, 2027], [12, 2, 2027], [13, 2, 2027],
  [21, 2, 2027], [15, 2, 2027], [2, 2, 2027], [3, 2, 2027], [18, 2, 2027], [19, 2, 2027], [20, 2, 2027],
  [28, 2, 2027], [22, 2, 2027], [16, 2, 2027], [17, 2, 2027], [25, 2, 2027], [26, 2, 2027], [27, 2, 2027],
  [7, 3, 2027], [1, 3, 2027], [23, 2, 2027], [24, 2, 2027], [4, 3, 2027], [5, 3, 2027], [6, 3, 2027],
 ]),
 buildPeriod(7, [
  [14, 3, 2027], [8, 3, 2027], [2, 3, 2027], [3, 3, 2027], [11, 3, 2027], [12, 3, 2027], [13, 3, 2027],
  [21, 3, 2027], [15, 3, 2027], [9, 3, 2027], [10, 3, 2027], [18, 3, 2027], [19, 3, 2027], [20, 3, 2027],
  [28, 3, 2027], [22, 3, 2027], [16, 3, 2027], [17, 3, 2027], [25, 3, 2027], [26, 3, 2027], [27, 3, 2027],
  [4, 4, 2027], [5, 4, 2027], [23, 3, 2027], [24, 3, 2027], [1, 4, 2027], [2, 4, 2027], [3, 4, 2027],
 ]),
 buildPeriod(8, [
  [11, 4, 2027], [12, 4, 2027], [6, 4, 2027], [31, 3, 2027], [8, 4, 2027], [9, 4, 2027], [10, 4, 2027],
  [18, 4, 2027], [19, 4, 2027], [13, 4, 2027], [7, 4, 2027], [15, 4, 2027], [16, 4, 2027], [17, 4, 2027],
  [25, 4, 2027], [26, 4, 2027], [20, 4, 2027], [14, 4, 2027], [22, 4, 2027], [23, 4, 2027], [24, 4, 2027],
  [2, 5, 2027], [3, 5, 2027], [27, 4, 2027], [21, 4, 2027], [29, 4, 2027], [30, 4, 2027], [1, 5, 2027],
 ]),
 buildPeriod(9, [
  [9, 5, 2027], [10, 5, 2027], [4, 5, 2027], [28, 4, 2027], [6, 5, 2027], [7, 5, 2027], [8, 5, 2027],
  [16, 5, 2027], [17, 5, 2027], [11, 5, 2027], [5, 5, 2027], [13, 5, 2027], [14, 5, 2027], [15, 5, 2027],
  [23, 5, 2027], [24, 5, 2027], [18, 5, 2027], [12, 5, 2027], [20, 5, 2027], [21, 5, 2027], [22, 5, 2027],
  [30, 5, 2027], [31, 5, 2027], [25, 5, 2027], [19, 5, 2027], [27, 5, 2027], [28, 5, 2027], [29, 5, 2027],
 ]),
 buildPeriod(10, [
  [6, 6, 2027], [7, 6, 2027], [1, 6, 2027], [26, 5, 2027], [3, 6, 2027], [4, 6, 2027], [5, 6, 2027],
  [13, 6, 2027], [14, 6, 2027], [8, 6, 2027], [2, 6, 2027], [10, 6, 2027], [11, 6, 2027], [12, 6, 2027],
  [20, 6, 2027], [21, 6, 2027], [15, 6, 2027], [16, 6, 2027], [17, 6, 2027], [18, 6, 2027], [19, 6, 2027],
  [27, 6, 2027], [28, 6, 2027], [22, 6, 2027], [23, 6, 2027], [24, 6, 2027], [25, 6, 2027], [26, 6, 2027],
 ]),
]

const BY_YEAR: Record<string, readonly SpecialistTuitionPeriod[]> = {
 "2627": PERIODS_2627,
}

export function listSpecialistTuitionPeriods(
 academicYearLabel: string
): readonly SpecialistTuitionPeriod[] {
 return BY_YEAR[academicYearLabel.trim()] ?? []
}

export function getSpecialistTuitionPeriod(
 academicYearLabel: string,
 index: number
): SpecialistTuitionPeriod | null {
 return listSpecialistTuitionPeriods(academicYearLabel).find((p) => p.index === index) ?? null
}

export function specialistTuitionPeriodDateSet(
 period: SpecialistTuitionPeriod | null | undefined
): ReadonlySet<string> {
 if (!period) return new Set()
 return new Set(period.dates)
}

function formatMd(ymd: string): string {
 const parts = ymd.slice(0, 10).split("-")
 const m = parts[1]
 const d = parts[2]
 if (!m || !d) return ymd
 return `${Number(m)}/${Number(d)}`
}

/** 期名＋首尾上課日，例如「常規第一期 · 9/1–10/3」。 */
export function specialistTuitionPeriodCaption(
 period: Pick<SpecialistTuitionPeriod, "label" | "from" | "to"> | null | undefined
): string {
 if (!period) return ""
 return `${period.label} · ${formatMd(period.from)}–${formatMd(period.to)}`
}

/**
 * 依「仍未上完的最早一期」決定本期／下期。
 * 本期＝仍有上課日 ≥ 今日的最早一期（不是「今日落在哪一期的日期集合」）。
 * 期與期上課日交錯時（例如第二期星期二已開始、第一期星期六尚未完），本期留在尚未上完的那一期；
 * 下期才是剛開始的下一期。假期窗、學年尚未開始，同一條規則已涵蓋。
 * 已無任何上課日 ≥ 今日，或本學年無期數表 → 兩者皆 null。
 */
export function resolveSpecialistTuitionPeriods(opts: {
 todayYmd: string
 academicYearLabel: string
}): {
 current: SpecialistTuitionPeriod | null
 next: SpecialistTuitionPeriod | null
} {
 const periods = listSpecialistTuitionPeriods(opts.academicYearLabel)
 if (periods.length === 0) return { current: null, next: null }
 const idx = indexOfEarliestUnfinishedPeriod(periods, opts.todayYmd.slice(0, 10))
 if (idx < 0) return { current: null, next: null }
 return {
  current: periods[idx] ?? null,
  next: periods[idx + 1] ?? null,
 }
}

function indexOfEarliestUnfinishedPeriod(
 periods: readonly SpecialistTuitionPeriod[],
 todayYmd: string
): number {
 for (let i = 0; i < periods.length; i++) {
  if (periods[i]!.dates.some((date) => date >= todayYmd)) return i
 }
 return -1
}
