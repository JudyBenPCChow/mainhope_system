import { describe, expect, it } from "vitest"

import { enrollmentPeriodToPackageType } from "@/lib/entitlementPackage"

describe("enrollmentPeriodToPackageType", () => {
 it("報讀形式對應既有包裝", () => {
  expect(enrollmentPeriodToPackageType("單堂")).toBe("single_lesson")
  expect(enrollmentPeriodToPackageType("第一期")).toBe("summer_phase_1")
  expect(enrollmentPeriodToPackageType("第二期")).toBe("summer_phase_2")
  expect(enrollmentPeriodToPackageType("兩期全報")).toBe("summer_full")
 })

 it("期數空白對應常規報讀包裝", () => {
  expect(enrollmentPeriodToPackageType(null)).toBe("regular_full")
  expect(enrollmentPeriodToPackageType(undefined)).toBe("regular_full")
 })
})
