import { describe, expect, it } from "vitest"

import { planRowRanges } from "@/lib/payroll/payslipPagination"

function layoutMeasure(rowPx: number, chrome: number, tail: number) {
  return (start: number, end: number, isLast: boolean) =>
    chrome + (end - start) * rowPx + (isLast ? tail : 0)
}

function covered(rowCount: number, ranges: { start: number; end: number }[]) {
  const seen = ranges.flatMap((range) =>
    Array.from({ length: range.end - range.start }, (_, i) => range.start + i),
  )
  expect(seen).toEqual(Array.from({ length: rowCount }, (_, i) => i))
}

describe("planRowRanges", () => {
  it("整表放得下時只一段", () => {
    const measure = layoutMeasure(40, 80, 60)
    const ranges = planRowRanges(4, measure, 400)
    expect(ranges).toEqual([{ start: 0, end: 4 }])
    expect(measure(0, 4, true)).toBeLessThanOrEqual(400)
  })

  it("超頁時按列切開，尾段才計表後合計，且不丟列", () => {
    const measure = layoutMeasure(100, 80, 90)
    const maxH = 400
    const ranges = planRowRanges(5, measure, maxH)
    covered(5, ranges)
    expect(ranges.length).toBeGreaterThan(1)
    ranges.forEach((range, index) => {
      const isLast = index === ranges.length - 1
      const height = measure(range.start, range.end, isLast)
      const singleRow = range.end - range.start === 1
      if (!singleRow) expect(height).toBeLessThanOrEqual(maxH)
      expect(range.end).toBeGreaterThan(range.start)
    })
    const last = ranges[ranges.length - 1]!
    expect(measure(last.start, last.end, true)).toBeLessThanOrEqual(maxH)
    expect(measure(last.start, last.end, false) + 90).toBe(measure(last.start, last.end, true))
  })

  it("單列高過一頁仍保留該列，其後列繼續排", () => {
    const measure = (start: number, end: number) => {
      let height = 0
      for (let i = start; i < end; i++) height += i === 1 ? 900 : 100
      return height + 20
    }
    const ranges = planRowRanges(4, measure, 300)
    expect(ranges).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 2 },
      { start: 2, end: 4 },
    ])
    covered(4, ranges)
  })
})
