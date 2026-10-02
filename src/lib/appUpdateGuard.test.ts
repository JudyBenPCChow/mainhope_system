import { describe, expect, it } from "vitest"

import { shouldEnforceAppUpdate } from "./appUpdateGuard"

describe("shouldEnforceAppUpdate", () => {
  it("does not force-reload the public ad host", () => {
    expect(shouldEnforceAppUpdate("ad.mainhope.edu.hk")).toBe(false)
    expect(shouldEnforceAppUpdate("AD.MAINHOPE.EDU.HK")).toBe(false)
  })

  it("still force-reloads the management system", () => {
    expect(shouldEnforceAppUpdate("system.mainhope.edu.hk")).toBe(true)
    expect(shouldEnforceAppUpdate("localhost")).toBe(true)
  })
})
