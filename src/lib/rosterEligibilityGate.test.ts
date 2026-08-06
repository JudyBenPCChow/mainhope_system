import { describe, expect, it } from "vitest"

import { usesEntitlementRosterModel } from "@/lib/rosterEligibilityGate"

describe("usesEntitlementRosterModel", () => {
 it("gates regular 2627+ to new model", () => {
  expect(usesEntitlementRosterModel("2627")).toBe(true)
  expect(usesEntitlementRosterModel("2728")).toBe(true)
 })

 it("keeps summer *SM on legacy path", () => {
  expect(usesEntitlementRosterModel("26SM")).toBe(false)
  expect(usesEntitlementRosterModel("25SM")).toBe(false)
 })

 it("keeps older regular years on legacy path", () => {
  expect(usesEntitlementRosterModel("2526")).toBe(false)
  expect(usesEntitlementRosterModel("2425")).toBe(false)
 })

 it("defaults missing/blank label to legacy", () => {
  expect(usesEntitlementRosterModel(null)).toBe(false)
  expect(usesEntitlementRosterModel(undefined)).toBe(false)
  expect(usesEntitlementRosterModel("")).toBe(false)
  expect(usesEntitlementRosterModel("   ")).toBe(false)
 })
})
