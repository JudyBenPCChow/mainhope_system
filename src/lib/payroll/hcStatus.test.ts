import { describe, expect, it } from "vitest"

import {
  attendanceStatusToHc,
  isActualPresentHc,
  isNonBillableLeaveHc,
} from "@/lib/payroll/hcStatus"

describe("attendanceStatusToHc", () => {
  it("maps current billable statuses", () => {
    expect(attendanceStatusToHc("現場")).toBe("in_person")
    expect(attendanceStatusToHc("錄影回放")).toBe("recording")
    expect(attendanceStatusToHc("zoom實時網課")).toBe("zoom")
    expect(attendanceStatusToHc("no show")).toBe("no_show")
    expect(attendanceStatusToHc("請假而不需補回")).toBe("leave_billable")
  })

  it("maps current non-billable leave", () => {
    expect(attendanceStatusToHc("事假")).toBe("personal")
    expect(attendanceStatusToHc("病假")).toBe("sick")
  })

  it("maps legacy 出席／請假 against payroll buckets", () => {
    expect(attendanceStatusToHc("出席")).toBe("in_person")
    expect(isActualPresentHc(attendanceStatusToHc("出席"))).toBe(true)
    expect(attendanceStatusToHc("請假")).toBe("personal")
    expect(isNonBillableLeaveHc(attendanceStatusToHc("請假"))).toBe(true)
  })

  it("does not treat 請假而不需補回 as non-billable leave", () => {
    expect(attendanceStatusToHc("請假而不需補回")).toBe("leave_billable")
    expect(isNonBillableLeaveHc("leave_billable")).toBe(false)
    expect(isActualPresentHc("leave_billable")).toBe(true)
  })
})
