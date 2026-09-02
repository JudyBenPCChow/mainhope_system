import { describe, expect, it } from "vitest"

import {
  homeworkCoverageLabel,
  homeworkCoverageMonths,
  homeworkFeeLineDescription,
  homeworkMonthlyFeeHkd,
  homeworkPaymentCoversMonth,
  homeworkPaymentLineAmount,
  isHomeworkMonthlyFeeDescription,
} from "@/lib/homeworkTutoringFees"
import { composeHomeworkFeeDisplays } from "@/lib/homeworkTutoringUi"

describe("功輔月費價目年級", () => {
  it("S1／S3 對到中一／中三", () => {
    expect(homeworkMonthlyFeeHkd("五日", "S3", "2026-09")).toBe(3400)
    expect(homeworkMonthlyFeeHkd("五日", "中三", "2026-09")).toBe(3400)
    expect(homeworkMonthlyFeeHkd("三日", "S1", "2026-09")).toBe(2800)
  })

  it("小學跟中一", () => {
    expect(homeworkMonthlyFeeHkd("四日", "P4", "2026-09")).toBe(3100)
    expect(homeworkMonthlyFeeHkd("四日", "小四", "2026-09")).toBe(3100)
  })

  it("中四未列價", () => {
    expect(homeworkMonthlyFeeHkd("五日", "S4", "2026-09")).toBeNull()
  })

  it("收款行按月數 × 月費", () => {
    expect(
      homeworkPaymentLineAmount({
        dayPlan: "四日",
        grade: "P4",
        billingMonth: "2026-09",
        monthCount: 1,
      })
    ).toBe("3100")
  })

  it("明細備註帶月費先當功輔月費行", () => {
    expect(isHomeworkMonthlyFeeDescription("功課輔導班 · 2026年9月月費")).toBe(true)
    expect(isHomeworkMonthlyFeeDescription("中三英文")).toBe(false)
  })

  it("跨 12 月預繳逐月計四分三", () => {
    expect(
      homeworkPaymentLineAmount({
        dayPlan: "三日",
        grade: "S1",
        coverageStartMonth: "2026-11",
        monthCount: 2,
      })
    ).toBe("4900")
  })

  it("覆蓋月份連續展開", () => {
    expect(homeworkCoverageMonths("2026-09", 3)).toEqual(["2026-09", "2026-10", "2026-11"])
    expect(homeworkCoverageLabel("2026-09", 1)).toBe("2026年9月")
    expect(homeworkCoverageLabel("2026-09", 3)).toBe("2026年9月至2026年11月")
    expect(
      homeworkPaymentCoversMonth({
        coverageStartMonth: "2026-09",
        monthCount: 3,
        billingMonth: "2026-11",
      })
    ).toBe(true)
    expect(
      homeworkPaymentCoversMonth({
        coverageStartMonth: "2026-09",
        monthCount: 3,
        billingMonth: "2026-12",
      })
    ).toBe(false)
    expect(homeworkFeeLineDescription("功課輔導班", "2026-09", 2)).toBe(
      "功課輔導班 · 2026年9月至2026年10月月費"
    )
  })
})

describe("功輔月費板由繳費紀錄合成", () => {
  it("已收款學生標已收款，其餘未收款", () => {
    const rows = composeHomeworkFeeDisplays({
      classId: "hw-class",
      billingMonth: "2026-08",
      enrollments: [
        { studentId: "a", status: "在籍", plan: "四日", grade: "P4" },
        { studentId: "b", status: "在籍", plan: "五日", grade: "S3" },
      ],
      paidByStudentId: new Map([["a", { receiptNumber: "MX-RC-1" }]]),
    })
    expect(rows).toEqual([
      {
        studentId: "a",
        amountLabel: "$3,100",
        status: "已收款",
        receiptNumber: "MX-RC-1",
        classId: "hw-class",
      },
      {
        studentId: "b",
        amountLabel: "$3,400",
        status: "未收款",
        receiptNumber: null,
        classId: "hw-class",
      },
    ])
  })

  it("excludes paused enrollments from this month's fees", () => {
    const rows = composeHomeworkFeeDisplays({
      classId: "hw-class",
      billingMonth: "2026-09",
      enrollments: [
        { studentId: "a", status: "在籍", plan: "四日", grade: "P4" },
        { studentId: "b", status: "暫停", plan: "五日", grade: "S3" },
      ],
      paidByStudentId: new Map(),
    })
    expect(rows.map((r) => r.studentId)).toEqual(["a"])
  })

  it("shows dash when day plan is unset", () => {
    const rows = composeHomeworkFeeDisplays({
      classId: "hw-class",
      billingMonth: "2026-09",
      enrollments: [{ studentId: "a", status: "在籍", plan: null, grade: "P4" }],
      paidByStudentId: new Map(),
    })
    expect(rows).toEqual([
      {
        studentId: "a",
        amountLabel: "—",
        status: "未收款",
        receiptNumber: null,
        classId: "hw-class",
      },
    ])
  })
})
