import { describe, expect, it } from "vitest"

import { buildTrialPrefLines, trialTypeFromPay } from "./trialPrefLines"
import type { ClassPriceInfo } from "./paymentsUi"

const classA: ClassPriceInfo = {
 id: "c1",
 label: "中一中文",
 pricePerLesson: 400,
 subject: "中文",
 courseCode: "C1A",
 courseName: "中文",
 subjectCode: "CHI",
 teacherId: "t1",
 dayOfWeek: "一",
 timeSlot: "16:00-17:30",
 academicYearLabel: "2627",
}

describe("buildTrialPrefLines", () => {
 it("缺班價時不建列，避免畫面先出現空白試堂", () => {
  expect(
   buildTrialPrefLines([{ classId: "c1", trialPay: "half" }], [])
  ).toBeNull()
 })

 it("班價已在手時帶上班別、類型與正價金額", () => {
  const built = buildTrialPrefLines([{ classId: "c1", trialPay: "half" }], [classA])
  expect(built).toHaveLength(1)
  expect(built?.[0]?.classId).toBe("c1")
  expect(built?.[0]?.trialType).toBe("半價試堂")
  expect(built?.[0]?.lessons).toBe("1")
  expect(built?.[0]?.amount).toBe("400")
 })

 it("免費試堂金額為 0", () => {
  const built = buildTrialPrefLines([{ classId: "c1", trialPay: "free" }], [classA])
  expect(built?.[0]?.amount).toBe("0")
  expect(trialTypeFromPay("free")).toBe("免費試堂")
 })
})
