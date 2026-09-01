import { describe, expect, it } from "vitest"

import { parseClassDetailTab } from "./classDetailTabs"

describe("parseClassDetailTab", () => {
 it("defaults missing and invalid values to basic", () => {
  expect(parseClassDetailTab(null)).toBe("basic")
  expect(parseClassDetailTab("nope")).toBe("basic")
 })

 it("keeps a valid tab", () => {
  expect(parseClassDetailTab("schedule")).toBe("schedule")
  expect(parseClassDetailTab("students")).toBe("students")
 })
})
