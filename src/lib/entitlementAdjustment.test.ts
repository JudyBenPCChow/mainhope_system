import { describe, expect, it } from "vitest"

import { voidRequiresSecondConfirmer } from "@/lib/entitlementAdjustment"

describe("voidRequiresSecondConfirmer", () => {
 it("requires second confirmer when created_at missing", () => {
  expect(voidRequiresSecondConfirmer(null)).toBe(true)
  expect(voidRequiresSecondConfirmer("")).toBe(true)
 })

 it("allows single operator within 30 minutes", () => {
  const now = Date.parse("2026-08-10T04:00:00.000Z")
  expect(
   voidRequiresSecondConfirmer("2026-08-10T03:45:00.000Z", now)
  ).toBe(false)
 })

 it("requires second confirmer after 30 minutes", () => {
  const now = Date.parse("2026-08-10T04:00:00.000Z")
  expect(
   voidRequiresSecondConfirmer("2026-08-10T03:29:00.000Z", now)
  ).toBe(true)
 })
})
