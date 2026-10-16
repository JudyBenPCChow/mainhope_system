import { describe, expect, it } from "vitest"

import {
  isLateFeeEligibleCourse,
  isLateFeeSystemActive,
} from "@/lib/tuitionLateFee"

describe("逾期罰款暫不生效", () => {
  it("即使已過原定生效日亦不自動加罰", () => {
    expect(isLateFeeSystemActive("2026-10-16")).toBe(false)
    expect(isLateFeeSystemActive("2027-06-01")).toBe(false)
  })
})

describe("逾期罰款班型", () => {
  it("專科常規可罰", () => {
    expect(isLateFeeEligibleCourse({ courseMode: "regular", classKind: "group" })).toBe(true)
  })

  it("功輔同私人課程不罰", () => {
    expect(isLateFeeEligibleCourse({ courseMode: "regular", classKind: "homework" })).toBe(false)
    expect(isLateFeeEligibleCourse({ courseMode: "regular", classKind: "private" })).toBe(false)
  })
})
