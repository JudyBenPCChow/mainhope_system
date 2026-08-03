import { describe, expect, it } from "vitest"
import {
 parseMakeupOfScheduleId,
 parseMakeupOriginalDate,
 remarksIndicateMakeupOf,
} from "@/lib/scheduleMakeupMarkers"

describe("scheduleMakeupMarkers", () => {
 it("解析 makeup_of uuid", () => {
  const remarks =
   "makeup_of=65a5091f-036d-46a6-ae33-1a69d0b2ac66；補回 2026-07-26；原因：天氣原因"
  expect(parseMakeupOfScheduleId(remarks)).toBe("65a5091f-036d-46a6-ae33-1a69d0b2ac66")
  expect(
   remarksIndicateMakeupOf(remarks, "65a5091f-036d-46a6-ae33-1a69d0b2ac66")
  ).toBe(true)
 })

 it("解析補回日期作期數後備", () => {
  expect(
   parseMakeupOriginalDate(
    "makeup_of=65a5091f-036d-46a6-ae33-1a69d0b2ac66；補回 2026-07-26；原因：天氣原因"
   )
  ).toBe("2026-07-26")
  expect(parseMakeupOriginalDate("補回2026-08-02")).toBe("2026-08-02")
  expect(parseMakeupOriginalDate(null)).toBeNull()
  expect(parseMakeupOriginalDate("無日期")).toBeNull()
 })
})
