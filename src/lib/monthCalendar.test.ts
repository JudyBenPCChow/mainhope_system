import { describe, expect, it } from "vitest"

import { padMonthCalendarDays } from "@/lib/monthCalendar"

describe("padMonthCalendarDays", () => {
  it("does not pad a month that starts on Sunday", () => {
    const days = [
      { key: "8/1", weekdayIndex: 0 },
      { key: "8/2", weekdayIndex: 1 },
    ]
    expect(padMonthCalendarDays(days)[0]).toEqual(days[0])
    expect(padMonthCalendarDays(days)).toHaveLength(2)
  })

  it("pads three empty cells when the month starts on Wednesday", () => {
    const days = [
      { key: "9/1", weekdayIndex: 3 },
      { key: "9/2", weekdayIndex: 4 },
    ]
    const cells = padMonthCalendarDays(days)
    expect(cells.slice(0, 3)).toEqual([null, null, null])
    expect(cells[3]).toEqual(days[0])
    expect(cells[4]).toEqual(days[1])
  })

  it("returns an empty list when there are no days", () => {
    expect(padMonthCalendarDays([])).toEqual([])
  })
})
