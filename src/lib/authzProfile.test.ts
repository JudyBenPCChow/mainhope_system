import { describe, expect, it } from "vitest"

import { can, usesAccountCapabilities, type AuthzProfile } from "@/lib/authzProfile"
import type { MgmtRole } from "@/lib/mgmtRole"

describe("can", () => {
  it("uses the server-returned list, not a role matrix", () => {
    const profileCaps = ["payments.void", "students.read"]
    expect(can(profileCaps, "payments.void")).toBe(true)
    expect(can(profileCaps, "payments.void.approve")).toBe(false)
  })

  it("fails closed on empty", () => {
    expect(can([], "students.read")).toBe(false)
    expect(can(null, "students.read")).toBe(false)
  })
})

describe("usesAccountCapabilities", () => {
  it("only names void second confirmation for now", () => {
    expect(usesAccountCapabilities("payments.void.approve")).toBe(true)
    expect(usesAccountCapabilities("payments.void")).toBe(false)
  })
})

describe("AuthzProfile shape", () => {
  it("keeps active vs account lists separate", () => {
    const profile: AuthzProfile = {
      appUserId: "u1",
      email: "a@example.com",
      displayName: "A",
      activeRole: "admin",
      availableRoles: ["admin", "manager"],
      teacherId: null,
      activeCapabilities: ["payments.void"],
      accountCapabilities: ["payments.void", "payments.void.approve"],
      authzVersion: 1,
    }
    const role: MgmtRole = profile.activeRole
    expect(role).toBe("admin")
    expect(can(profile.activeCapabilities, "payments.void.approve")).toBe(false)
    expect(can(profile.accountCapabilities, "payments.void.approve")).toBe(true)
  })
})
