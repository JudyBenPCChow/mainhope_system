import { describe, expect, it } from "vitest"

import {
  homeworkCommissionFallbackFromEnrollments,
  sumInProgressHomeworkCommission,
} from "@/services/payrollHomeworkQueries"

describe("sumInProgressHomeworkCommission", () => {
  it("adds every in-progress homework class, using charge rows when present", () => {
    const total = sumInProgressHomeworkCommission([
      {
        charges: [
          { studentId: "ms-1", amountHkd: 1800 },
          { studentId: "ms-2", amountHkd: 1800 },
        ],
        enrollmentFallback: { enrolledCount: 99, originalPriceTotal: 1 },
      },
      {
        charges: [],
        enrollmentFallback: { enrolledCount: 8, originalPriceTotal: 9600 },
      },
    ])
    expect(total).toEqual({ enrolledCount: 10, originalPriceTotal: 13200 })
  })

  it("counts a student once inside one class and again on another class", () => {
    const total = sumInProgressHomeworkCommission([
      {
        charges: [
          { studentId: "s1", amountHkd: 1000 },
          { studentId: "s1", amountHkd: 500 },
        ],
        enrollmentFallback: { enrolledCount: 0, originalPriceTotal: 0 },
      },
      {
        charges: [{ studentId: "s1", amountHkd: 800 }],
        enrollmentFallback: { enrolledCount: 0, originalPriceTotal: 0 },
      },
    ])
    expect(total).toEqual({ enrolledCount: 2, originalPriceTotal: 2300 })
  })
})

describe("homeworkCommissionFallbackFromEnrollments", () => {
  it("未設定日數檔不計入", () => {
    const total = homeworkCommissionFallbackFromEnrollments(
      [
        {
          student_id: "unset",
          enroll_date: "2026-09-01",
          homework_day_plan: null,
          students: { grade: "S1" },
        },
        {
          student_id: "blank",
          enroll_date: "2026-09-01",
          homework_day_plan: "",
          students: { grade: "S1" },
        },
        {
          student_id: "set",
          enroll_date: "2026-09-01",
          homework_day_plan: "四日",
          students: { grade: "S1" },
        },
      ],
      "2026-09"
    )
    expect(total).toEqual({ enrolledCount: 1, originalPriceTotal: 3100 })
  })
})
