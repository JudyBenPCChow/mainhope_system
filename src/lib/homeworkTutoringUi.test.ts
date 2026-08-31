import { describe, expect, it } from "vitest"

import { buildMonthDutyDays } from "@/lib/homeworkTutoringUi"

describe("buildMonthDutyDays", () => {
  it("merges existing ISO dates onto M/D calendar keys", () => {
    const days = buildMonthDutyDays("2026-09", [
      {
        date: "2026-09-21",
        weekday: "一",
        start: "15:30",
        end: "19:30",
        secondaryRoom: "17D",
        primaryRoom: null,
        secondaryTeacherId: "katie",
        assignments: [
          { teacherId: "katie", start: "15:30", end: "19:30", room: "17D" },
        ],
      },
    ])
    const day21 = days.find((d) => d.date === "9/21")
    expect(day21?.secondaryTeacherId).toBe("katie")
    expect(day21?.assignments).toEqual([
      { teacherId: "katie", start: "15:30", end: "19:30", room: "17D" },
    ])
  })
})
