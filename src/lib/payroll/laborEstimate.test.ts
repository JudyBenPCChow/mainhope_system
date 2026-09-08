import { describe, expect, it } from "vitest"

import {
  applyApprovedPayrollAdjustments,
  employerLaborCost,
  foldPeriodTutorLabor,
  resolveMonthTutorLabor,
  sumEstimatedTutorLabor,
} from "@/lib/payroll/laborEstimate"
import type { ManualAdjustment, PayrollTeacherRow } from "@/lib/payroll/viewTypes"

function teacher(partial: Partial<PayrollTeacherRow> & { id: string; name: string }): PayrollTeacherRow {
  return {
    mode: "兼職 HC",
    gross: null,
    employeeMpf: 0,
    employerMpf: 0,
    net: null,
    previousGross: null,
    anomalies: [],
    lines: [],
    grades: [],
    ...partial,
  }
}

describe("employerLaborCost", () => {
  it("sums gross and employer MPF", () => {
    expect(employerLaborCost({ gross: 10000, employerMpf: 500 })).toBe(10500)
  })

  it("skips null or zero gross like settle posting", () => {
    expect(employerLaborCost({ gross: null, employerMpf: 100 })).toBe(0)
    expect(employerLaborCost({ gross: 0, employerMpf: 100 })).toBe(0)
  })
})

describe("sumEstimatedTutorLabor", () => {
  it("skips excluded teachers", () => {
    const teachers = [
      teacher({ id: "a", name: "A", gross: 8000, employerMpf: 400 }),
      teacher({ id: "b", name: "B", gross: 5000, employerMpf: 0 }),
    ]
    expect(sumEstimatedTutorLabor({ teachers, excludedTeacherIds: new Set(["b"]) })).toBe(8400)
  })
})

describe("applyApprovedPayrollAdjustments", () => {
  it("uses the latest approved adjustment", () => {
    const teachers = [teacher({ id: "t1", name: "Jackson Lau", gross: 3000, employerMpf: 0 })]
    const adjustments: ManualAdjustment[] = [
      {
        id: "1",
        teacherId: "t1",
        teacherName: "Jackson Lau",
        fromAmount: 3000,
        toAmount: 4000,
        reason: "舊",
        createdBy: "f",
        createdAt: "2026-09-01T00:00:00.000Z",
        status: "approved",
      },
      {
        id: "2",
        teacherId: "t1",
        teacherName: "Jackson Lau",
        fromAmount: 4000,
        toAmount: 4500,
        reason: "新",
        createdBy: "f",
        createdAt: "2026-09-02T00:00:00.000Z",
        status: "approved",
      },
      {
        id: "3",
        teacherId: "t1",
        teacherName: "Jackson Lau",
        fromAmount: 4500,
        toAmount: 9999,
        reason: "未批",
        createdBy: "f",
        createdAt: "2026-09-03T00:00:00.000Z",
        status: "pending",
      },
    ]
    expect(applyApprovedPayrollAdjustments(teachers, adjustments)[0]?.gross).toBe(4500)
  })
})

describe("resolveMonthTutorLabor", () => {
  it("prefers posted ledger over estimate", () => {
    expect(
      resolveMonthTutorLabor({ posted: true, postedAmount: 8000, estimatedAmount: 9000 })
    ).toEqual({ amount: 8000, source: "posted" })
  })

  it("uses estimate when not posted", () => {
    expect(
      resolveMonthTutorLabor({ posted: false, postedAmount: 0, estimatedAmount: 7200 })
    ).toEqual({ amount: 7200, source: "estimated" })
  })

  it("treats zero estimate as present", () => {
    expect(
      resolveMonthTutorLabor({ posted: false, postedAmount: 0, estimatedAmount: 0 })
    ).toEqual({ amount: 0, source: "estimated" })
  })
})

describe("foldPeriodTutorLabor", () => {
  it("all posted", () => {
    expect(
      foldPeriodTutorLabor([
        { amount: 8000, source: "posted", consumedValue: 20000 },
        { amount: 9000, source: "posted", consumedValue: 21000 },
      ])
    ).toEqual({ amount: 17000, posted: true, estimated: false, unpostedAmount: 0 })
  })

  it("mix posted and estimated without blocking", () => {
    expect(
      foldPeriodTutorLabor([
        { amount: 8000, source: "posted", consumedValue: 20000 },
        { amount: 9000, source: "estimated", consumedValue: 21000 },
      ])
    ).toEqual({ amount: 17000, posted: false, estimated: true, unpostedAmount: 9000 })
  })

  it("blocks gross when a month with consumed lessons has no labor", () => {
    expect(
      foldPeriodTutorLabor([
        { amount: 8000, source: "posted", consumedValue: 20000 },
        { amount: 0, source: "missing", consumedValue: 5000 },
      ])
    ).toEqual({ amount: 8000, posted: false, estimated: false, unpostedAmount: 0 })
  })

  it("does not block empty months without labor", () => {
    expect(
      foldPeriodTutorLabor([
        { amount: 8000, source: "posted", consumedValue: 20000 },
        { amount: 0, source: "missing", consumedValue: 0 },
      ])
    ).toEqual({ amount: 8000, posted: true, estimated: false, unpostedAmount: 0 })
  })

  it("all missing stays pending", () => {
    expect(
      foldPeriodTutorLabor([{ amount: 0, source: "missing", consumedValue: 0 }])
    ).toEqual({ amount: 0, posted: false, estimated: false, unpostedAmount: 0 })
  })
})
