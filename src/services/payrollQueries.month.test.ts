import { describe, expect, it } from "vitest"

import { defaultPayrollMonthKey, listPayrollMonthOptions } from "@/services/payrollQueries"

describe("defaultPayrollMonthKey", () => {
  it("uses July when 10 days before 9 Aug is still July", () => {
    expect(defaultPayrollMonthKey(new Date(2026, 7, 9))).toBe("2026-07")
  })

  it("uses August when 10 days before 30 Aug is still August", () => {
    expect(defaultPayrollMonthKey(new Date(2026, 7, 30))).toBe("2026-08")
  })

  it("switches to the current month from the 11th", () => {
    expect(defaultPayrollMonthKey(new Date(2026, 7, 10))).toBe("2026-07")
    expect(defaultPayrollMonthKey(new Date(2026, 7, 11))).toBe("2026-08")
  })

  it("crosses the year boundary in early January", () => {
    expect(defaultPayrollMonthKey(new Date(2027, 0, 5))).toBe("2026-12")
  })

  it("is included in the payroll month dropdown", () => {
    const now = new Date(2026, 7, 9)
    const options = listPayrollMonthOptions(now)
    expect(options.map((o) => o.value)).toContain(defaultPayrollMonthKey(now))
  })
})
