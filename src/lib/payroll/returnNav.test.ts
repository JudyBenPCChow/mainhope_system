import { describe, expect, it } from "vitest"

import { monthKeyToRange, payrollWorkbenchPath } from "@/lib/payroll/returnNav"

describe("payroll returnNav", () => {
  it("builds payroll path with month teacher lesson", () => {
    expect(
      payrollWorkbenchPath({ month: "2026-08", teacherId: "t1", lessonId: "s1" })
    ).toBe("/Payroll?month=2026-08&teacher=t1&lesson=s1")
  })

  it("maps month key to first/last day", () => {
    expect(monthKeyToRange("2026-08")).toEqual({ from: "2026-08-01", to: "2026-08-31" })
    expect(monthKeyToRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" })
    expect(monthKeyToRange("bad")).toBeNull()
  })
})
