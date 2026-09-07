import { describe, expect, it } from "vitest"

import {
  PAYROLL_DRAFT_SNAPSHOT_TTL_MS,
  buildUnsettledPayrollSnapshot,
  formatPayrollCalcAt,
  hardBlocksFromPayrollSnapshot,
  shouldReusePayrollDraftSnapshot,
  teachersFromPayrollSnapshot,
} from "@/lib/payroll/draftSnapshot"

const now = Date.parse("2026-09-06T04:00:00.000Z")
const fresh = "2026-09-06T03:55:00.000Z"
const stale = "2026-09-06T03:40:00.000Z"

describe("shouldReusePayrollDraftSnapshot", () => {
  it("reuses 財務審閱中 within TTL", () => {
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "財務審閱中",
        hasTeachers: true,
        calcAt: fresh,
        nowMs: now,
      })
    ).toBe(true)
  })

  it("recomputes 財務審閱中 after TTL", () => {
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "財務審閱中",
        hasTeachers: true,
        calcAt: stale,
        nowMs: now,
      })
    ).toBe(false)
  })

  it("always reuses 待管理層核實 so manager sees submitted numbers", () => {
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "待管理層核實",
        hasTeachers: true,
        calcAt: stale,
        nowMs: now,
      })
    ).toBe(true)
  })

  it("preferDraft ignores TTL for review toggles", () => {
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "財務審閱中",
        hasTeachers: true,
        calcAt: stale,
        nowMs: now,
        preferDraft: true,
      })
    ).toBe(true)
  })

  it("force never reuses", () => {
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "待管理層核實",
        hasTeachers: true,
        calcAt: fresh,
        nowMs: now,
        force: true,
        preferDraft: true,
      })
    ).toBe(false)
  })

  it("does not reuse missing teachers or calc_at on 財務審閱中", () => {
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "財務審閱中",
        hasTeachers: false,
        calcAt: fresh,
        nowMs: now,
      })
    ).toBe(false)
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "財務審閱中",
        hasTeachers: true,
        calcAt: null,
        nowMs: now,
      })
    ).toBe(false)
  })

  it("uses the documented 10 minute TTL", () => {
    expect(PAYROLL_DRAFT_SNAPSHOT_TTL_MS).toBe(10 * 60 * 1000)
    const justInside = new Date(now - PAYROLL_DRAFT_SNAPSHOT_TTL_MS + 1).toISOString()
    const justOutside = new Date(now - PAYROLL_DRAFT_SNAPSHOT_TTL_MS).toISOString()
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "財務審閱中",
        hasTeachers: true,
        calcAt: justInside,
        nowMs: now,
      })
    ).toBe(true)
    expect(
      shouldReusePayrollDraftSnapshot({
        status: "財務審閱中",
        hasTeachers: true,
        calcAt: justOutside,
        nowMs: now,
      })
    ).toBe(false)
  })
})

describe("payroll snapshot shape", () => {
  it("reads teachers from draft and settled snapshots", () => {
    expect(teachersFromPayrollSnapshot({ teachers: [{ id: "t1" }] })?.[0]?.id).toBe("t1")
    expect(
      teachersFromPayrollSnapshot({ teachers: [{ id: "t1" }], settledAt: "x", calcVersion: 2 })?.[0]
        ?.id
    ).toBe("t1")
    expect(teachersFromPayrollSnapshot({ teachers: [] })).toBeNull()
    expect(teachersFromPayrollSnapshot(null)).toBeNull()
  })

  it("reads hard-block list and formats calc_at", () => {
    expect(hardBlocksFromPayrollSnapshot({ hardBlockAnomalies: ["缺費率"] })).toEqual(["缺費率"])
    expect(hardBlocksFromPayrollSnapshot({ teachers: [] })).toEqual([])
    expect(formatPayrollCalcAt("2026-09-06T03:55:00.000Z")).toBe("2026-09-06 03:55")
    expect(formatPayrollCalcAt(null)).toBe("—")
  })

  it("marks unsettled writes as draft without settledAt", () => {
    const snap = buildUnsettledPayrollSnapshot({
      teachers: [{ id: "t1" } as never],
      hardBlockAnomalies: [],
      calcVersion: 1,
      computedAt: "2026-09-06T03:55:00.000Z",
    })
    expect(snap.kind).toBe("draft")
    expect(snap.settledAt).toBeUndefined()
  })
})
