import { describe, expect, it } from "vitest"

import { trialInviteTokenHasPublicUrl, trialInviteTokenUsable, trialInviteTokenVoidable } from "./trialInviteToken"
import { isTrialInviteType, trialInviteTypeOrDefault } from "./trialInviteTypes"
import type { TrialInviteTokenRow } from "@/services/trialInviteQueries"

function token(partial: Partial<TrialInviteTokenRow>): TrialInviteTokenRow {
  return {
    id: "id",
    token: "token-token-token",
    student_id: "sid",
    status: "open",
    trial_type: "免費試堂",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    submitted_at: null,
    approved_at: null,
    created_at: new Date().toISOString(),
    ...partial,
  }
}

describe("trialInviteTypes", () => {
  it("accepts staff-selected types", () => {
    expect(isTrialInviteType("免費試堂")).toBe(true)
    expect(isTrialInviteType("半價試堂")).toBe(true)
    expect(isTrialInviteType("原價試堂")).toBe(true)
    expect(isTrialInviteType("體驗課")).toBe(false)
    expect(trialInviteTypeOrDefault("體驗課")).toBe("免費試堂")
  })
})

describe("trialInviteToken", () => {
  it("treats open unexpired tokens as usable", () => {
    expect(trialInviteTokenUsable(token({}))).toBe(true)
    expect(trialInviteTokenVoidable(token({}))).toBe(true)
  })

  it("does not treat submitted or expired as usable, but they can be voided", () => {
    expect(trialInviteTokenUsable(token({ status: "submitted" }))).toBe(false)
    expect(trialInviteTokenHasPublicUrl(token({ status: "submitted" }))).toBe(true)
    expect(trialInviteTokenVoidable(token({ status: "submitted" }))).toBe(true)
    expect(
      trialInviteTokenUsable(
        token({ expires_at: new Date(Date.now() - 1000).toISOString() })
      )
    ).toBe(false)
    expect(
      trialInviteTokenVoidable(
        token({ expires_at: new Date(Date.now() - 1000).toISOString() })
      )
    ).toBe(true)
  })

  it("does not void approved or already voided tokens", () => {
    expect(trialInviteTokenVoidable(token({ status: "approved" }))).toBe(false)
    expect(trialInviteTokenVoidable(token({ status: "voided" }))).toBe(false)
    expect(trialInviteTokenUsable(null)).toBe(false)
  })
})
