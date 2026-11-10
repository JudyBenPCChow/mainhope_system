import { describe, expect, it } from "vitest"

import { trialRecordFocusHref } from "./trialRecordHref"

describe("trialRecordFocusHref", () => {
  it("只帶 trialId，不會打開新增試堂", () => {
    expect(trialRecordFocusHref("abc")).toBe("/TrialSessions?trialId=abc")
  })

  it("沒有編號時只到試堂紀錄", () => {
    expect(trialRecordFocusHref("  ")).toBe("/TrialSessions")
  })
})
