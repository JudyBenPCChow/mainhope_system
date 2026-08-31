import { describe, expect, it } from "vitest"

import { parseStudentDetailTab } from "./studentDetailTabs"

describe("parseStudentDetailTab", () => {
 it("defaults missing and invalid values to basic", () => {
  expect(parseStudentDetailTab(null, { canViewMoney: true, capsReady: true })).toBe("basic")
  expect(parseStudentDetailTab("nope", { canViewMoney: true, capsReady: true })).toBe("basic")
 })

 it("keeps a valid tab", () => {
  expect(parseStudentDetailTab("leave", { canViewMoney: true, capsReady: true })).toBe("leave")
 })

 it("corrects payments when money is not readable", () => {
  expect(parseStudentDetailTab("payments", { canViewMoney: false, capsReady: true })).toBe("basic")
 })

 it("does not correct payments before capabilities load", () => {
  expect(parseStudentDetailTab("payments", { canViewMoney: false, capsReady: false })).toBe("payments")
 })
})
