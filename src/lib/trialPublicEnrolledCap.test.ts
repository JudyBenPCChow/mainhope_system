import { describe, expect, it } from "vitest"

import { trialPublicEnrolledCapHidesClass } from "@/lib/trialPublicEnrolledCap"

describe("trialPublicEnrolledCapHidesClass", () => {
  it("專科班就讀中超過 5 人隱藏", () => {
    expect(trialPublicEnrolledCapHidesClass("group", 5)).toBe(false)
    expect(trialPublicEnrolledCapHidesClass("group", 6)).toBe(true)
  })

  it("功課輔導班不因人數隱藏", () => {
    expect(trialPublicEnrolledCapHidesClass("homework", 6)).toBe(false)
    expect(trialPublicEnrolledCapHidesClass("homework", 20)).toBe(false)
  })
})
