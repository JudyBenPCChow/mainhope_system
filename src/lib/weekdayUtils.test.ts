import { describe, expect, it } from "vitest"

import { isYmd } from "@/lib/weekdayUtils"

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
