import { describe, expect, it } from "vitest"

import {
  billedHomeworkHours,
  christineHomeworkCommission,
  homeworkHourlyPay,
  hoursBetweenHm,
  isHomeworkHourlyExempt,
  rosterHoursByTeacher,
} from "@/lib/payroll/homeworkHours"

describe("homeworkHours", () => {
  it("computes shift length from clock times", () => {
    expect(hoursBetweenHm("15:30", "19:30")).toBe(4)
    expect(hoursBetweenHm("16:15", "19:00")).toBe(2.75)
    expect(hoursBetweenHm("15:40", "20:15")).toBe(4.58)
  })

  it("skips holidays and calendar closures", () => {
    const hours = rosterHoursByTeacher(
      [
        { teacherId: "r", date: "2026-09-01", start: "15:30", end: "19:30", holiday: false },
        { teacherId: "r", date: "2026-09-02", start: "15:30", end: "19:30", holiday: true },
        { teacherId: "r", date: "2026-09-03", start: "15:30", end: "19:30", holiday: false },
      ],
      new Set(["2026-09-03"])
    )
    expect(hours.get("r")).toBe(4)
  })

  it("uses finance override when set", () => {
    expect(billedHomeworkHours(12.5, null)).toBe(12.5)
    expect(billedHomeworkHours(12.5, 11)).toBe(11)
    expect(billedHomeworkHours(12.5, 0)).toBe(0)
  })

  it("pays hourly with no daily subsidy", () => {
    expect(homeworkHourlyPay(4, 100)).toBe(400)
    expect(homeworkHourlyPay(4, 70)).toBe(280)
    expect(homeworkHourlyPay(0, 100)).toBe(0)
  })

  it("Christine commission gates at 15 enrolled on full original price", () => {
    expect(christineHomeworkCommission({ enrolledCount: 14, originalPriceTotal: 40000 })).toEqual({
      eligible: false,
      enrolledCount: 14,
      originalPriceTotal: 40000,
      amount: 0,
    })
    expect(christineHomeworkCommission({ enrolledCount: 15, originalPriceTotal: 40000 }).amount).toBe(4000)
    expect(isHomeworkHourlyExempt("Katie Lee")).toBe(true)
    expect(isHomeworkHourlyExempt("Rain Kwok")).toBe(false)
  })
})
