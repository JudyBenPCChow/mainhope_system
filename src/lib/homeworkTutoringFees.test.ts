import { describe, expect, it } from "vitest"

import {
  homeworkMonthlyFeeHkd,
  homeworkPaymentLineAmount,
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
})
