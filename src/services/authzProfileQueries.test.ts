import { describe, expect, it } from "vitest"

import { mapAuthzProfile } from "@/services/authzProfileQueries"

describe("mapAuthzProfile", () => {
  it("maps v2 json and fails closed without identity", () => {
    expect(mapAuthzProfile(null)).toBeNull()
    expect(mapAuthzProfile({ email: "a@x.com", active_role: "admin" })).toBeNull()

    const profile = mapAuthzProfile({
      app_user_id: "11111111-1111-1111-1111-111111111111",
      email: "A@X.com",
      display_name: "A",
      active_role: "admin",
      teacher_id: null,
      available_roles: ["admin", "manager"],
      active_capabilities: ["payments.void"],
      account_capabilities: ["payments.void", "payments.void.approve"],
      authz_version: 1,
    })
    expect(profile?.email).toBe("a@x.com")
    expect(profile?.activeCapabilities).toEqual(["payments.void"])
    expect(profile?.accountCapabilities).toContain("payments.void.approve")
  })
})
