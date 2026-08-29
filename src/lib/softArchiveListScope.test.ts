import { describe, expect, it } from "vitest"

import {
 leaveStatusExemptFromOpsYearWindow,
 rowPassesOpsYearWindow,
 trialStatusExemptFromOpsYearWindow,
} from "@/lib/softArchiveListScope"

describe("leaveStatusExemptFromOpsYearWindow", () => {
 it("待處理／待補豁免年份窗", () => {
  expect(leaveStatusExemptFromOpsYearWindow("待補課")).toBe(true)
  expect(leaveStatusExemptFromOpsYearWindow("待安排")).toBe(true)
  expect(leaveStatusExemptFromOpsYearWindow("")).toBe(true)
 })

 it("已完成／放棄跟窗", () => {
  expect(leaveStatusExemptFromOpsYearWindow("已補課")).toBe(false)
  expect(leaveStatusExemptFromOpsYearWindow("已完成")).toBe(false)
  expect(leaveStatusExemptFromOpsYearWindow("放棄補課")).toBe(false)
 })
})

describe("trialStatusExemptFromOpsYearWindow", () => {
 it("未完成試堂豁免", () => {
  expect(trialStatusExemptFromOpsYearWindow("已預約")).toBe(true)
  expect(trialStatusExemptFromOpsYearWindow("待上課")).toBe(true)
 })

 it("已完成／取消跟窗", () => {
  expect(trialStatusExemptFromOpsYearWindow("已完成")).toBe(false)
  expect(trialStatusExemptFromOpsYearWindow("取消")).toBe(false)
 })
})

describe("rowPassesOpsYearWindow", () => {
 const ops = new Set(["year-ops"])

 it("豁免列即使舊年仍可見", () => {
  expect(
   rowPassesOpsYearWindow({ exempt: true, classAcademicYearId: "year-old", opsYearIds: ops })
  ).toBe(true)
 })

 it("非豁免且學年在窗內", () => {
  expect(
   rowPassesOpsYearWindow({ exempt: false, classAcademicYearId: "year-ops", opsYearIds: ops })
  ).toBe(true)
 })

 it("非豁免且學年在窗外則隱藏", () => {
  expect(
   rowPassesOpsYearWindow({ exempt: false, classAcademicYearId: "year-old", opsYearIds: ops })
  ).toBe(false)
 })

 it("缺學年 id 不隱藏（避免誤藏）", () => {
  expect(rowPassesOpsYearWindow({ exempt: false, classAcademicYearId: null, opsYearIds: ops })).toBe(
   true
  )
 })
})
