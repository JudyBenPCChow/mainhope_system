import { describe, expect, it } from "vitest"

import { deriveActivityStatus } from "@/lib/studentActivityStatus"

const asOf = new Date("2026-08-30T12:00:00+08:00")

describe("deriveActivityStatus", () => {
 it("在讀 ⇒ 活躍，即使報讀事件早過三個月", () => {
  expect(
   deriveActivityStatus({
    hasActiveEnrollment: true,
    enrollments: [
     {
      status: "就讀中",
      enroll_date: "2026-02-01",
      created_at: "2026-02-01T00:00:00Z",
     },
    ],
    asOf,
   })
  ).toBe("活躍生")
 })

 it("非在讀但近三個月有報讀事件 ⇒ 活躍", () => {
  expect(
   deriveActivityStatus({
    hasActiveEnrollment: false,
    enrollments: [
     {
      status: "已退讀",
      enroll_date: "2026-07-15",
      created_at: "2026-07-15T00:00:00Z",
     },
    ],
    asOf,
   })
  ).toBe("活躍生")
 })

 it("非在讀但近三個月有退讀生效 ⇒ 活躍", () => {
  expect(
   deriveActivityStatus({
    hasActiveEnrollment: false,
    enrollments: [
     {
      status: "已退讀",
      enroll_date: "2026-02-01",
      created_at: "2026-02-01T00:00:00Z",
      withdraw_effective_date: "2026-08-01",
     },
    ],
    asOf,
   })
  ).toBe("活躍生")
 })

 it("兩年前報讀且已退讀、無近期退讀 ⇒ 非活躍", () => {
  expect(
   deriveActivityStatus({
    hasActiveEnrollment: false,
    enrollments: [
     {
      status: "已退讀",
      enroll_date: "2024-09-01",
      created_at: "2024-09-01T00:00:00Z",
      withdraw_effective_date: "2025-01-01",
     },
    ],
    asOf,
   })
  ).toBe("非活躍生")
 })
})
