import { describe, expect, it } from "vitest"

import { isLateFeeEligibleCourse } from "@/lib/tuitionLateFee"

describe("逾期罰款班型", () => {
  it("專科常規可罰", () => {
    expect(isLateFeeEligibleCourse({ courseMode: "regular", classKind: "group" })).toBe(true)
  })

  it("功輔同私人課程不罰", () => {
    expect(isLateFeeEligibleCourse({ courseMode: "regular", classKind: "homework" })).toBe(false)
    expect(isLateFeeEligibleCourse({ courseMode: "regular", classKind: "private" })).toBe(false)
  })
})
