import { describe, expect, it } from "vitest"

import { usesSharedAppShell } from "@/lib/mgmtRole"

describe("usesSharedAppShell", () => {
 it("全角色跟共用殼", () => {
  expect(usesSharedAppShell("admin")).toBe(true)
  expect(usesSharedAppShell("manager")).toBe(true)
  expect(usesSharedAppShell("finance")).toBe(true)
  expect(usesSharedAppShell("teacher")).toBe(true)
  expect(usesSharedAppShell("alien")).toBe(true)
 })

 it("未登入不跟殼", () => {
  expect(usesSharedAppShell(null)).toBe(false)
  expect(usesSharedAppShell(undefined)).toBe(false)
 })
})
