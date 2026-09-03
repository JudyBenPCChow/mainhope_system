import { describe, expect, it } from "vitest"

import { isYmd, isWeekdayYmd } from "@/lib/weekdayUtils"

describe("isYmd", () => {
 it("accepts calendar dates", () => {
  expect(isYmd("2026-08-18")).toBe(true)
 })

 it("rejects empty or incomplete values from date inputs", () => {
  expect(isYmd("")).toBe(false)
  expect(isYmd("  ")).toBe(false)
  expect(isYmd("2026-08")).toBe(false)
  expect(isYmd(null)).toBe(false)
  expect(isYmd(undefined)).toBe(false)
 })
})

describe("isWeekdayYmd", () => {
 it("treats Mon–Fri as weekdays", () => {
  expect(isWeekdayYmd("2026-09-01")).toBe(true) // Tue
  expect(isWeekdayYmd("2026-09-04")).toBe(true) // Fri
  expect(isWeekdayYmd("2026-09-07")).toBe(true) // Mon
 })

 it("treats Sat–Sun as weekend", () => {
  expect(isWeekdayYmd("2026-09-05")).toBe(false) // Sat
  expect(isWeekdayYmd("2026-09-06")).toBe(false) // Sun
 })
})
