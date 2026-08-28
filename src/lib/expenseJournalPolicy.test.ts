import { describe, expect, it } from "vitest"

import {
  frontDeskBlockedMessage,
  isManualSelectableAccount,
  isPayrollPostedAccountCode,
  resolveManualLedgerStatus,
} from "@/lib/expenseJournalPolicy"

describe("expenseJournalPolicy", () => {
  it("hides payroll-posted accounts from all manual forms", () => {
    expect(isPayrollPostedAccountCode("labor_tutor")).toBe(true)
    expect(
      isManualSelectableAccount({
        code: "labor_tutor",
        visibility: "manager",
        canReadFullLedger: true,
      })
    ).toBe(false)
  })

  it("lets admin pick only front_desk accounts", () => {
    expect(
      isManualSelectableAccount({
        code: "supplies",
        visibility: "front_desk",
        canReadFullLedger: false,
      })
    ).toBe(true)
    expect(
      isManualSelectableAccount({
        code: "rent_mgmt",
        visibility: "manager",
        canReadFullLedger: false,
      })
    ).toBe(false)
  })

  it("lets manager pick rent but not tutor payroll", () => {
    expect(
      isManualSelectableAccount({
        code: "rent_mgmt",
        visibility: "manager",
        canReadFullLedger: true,
      })
    ).toBe(true)
  })

  it("auto-confirms classified manual rows unless force-pending", () => {
    expect(resolveManualLedgerStatus(false)).toBe("confirmed")
    expect(resolveManualLedgerStatus(true)).toBe("pending_review")
  })

  it("blocks front-desk from exception titles", () => {
    expect(frontDeskBlockedMessage("按金通常唔當成本；請覆核。")).toContain("按金")
    expect(frontDeskBlockedMessage(null)).toBe("此類開支請由管理層入帳")
  })
})
