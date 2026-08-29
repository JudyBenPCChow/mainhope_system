import { describe, expect, it } from "vitest"

import {
 academicYearIdOpsOrFilter,
 classYearFilterRequiresOlderYears,
 formatOpsYearScopeCaption,
 hiddenOlderCountFromParts,
 leaveStatusExemptFromOpsYearWindow,
 lessonBalancePassesOpsWindow,
 paymentOpsListOrFilter,
 rowPassesOpsYearWindow,
 trialStatusExemptFromOpsYearWindow,
 enrollmentOpsEffectiveDateOrFilter,
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

describe("hiddenOlderCountFromParts", () => {
 it("正常相減，下限 0", () => {
  expect(hiddenOlderCountFromParts(10, 6, 1)).toBe(3)
  expect(hiddenOlderCountFromParts(2, 6, 0)).toBe(0)
 })

 it("任一 count 失敗則 0", () => {
  expect(hiddenOlderCountFromParts(null, 6, 1)).toBe(0)
  expect(hiddenOlderCountFromParts(10, null, 1)).toBe(0)
  expect(hiddenOlderCountFromParts(10, 6, null)).toBe(0)
 })
})

describe("enrollmentOpsEffectiveDateOrFilter", () => {
 it("含空白生效日", () => {
  expect(enrollmentOpsEffectiveDateOrFilter("2025-07-01")).toBe(
   "effective_date.gte.2025-07-01,effective_date.is.null"
  )
 })
})

describe("academicYearIdOpsOrFilter", () => {
 it("窗內學年或空白", () => {
  expect(academicYearIdOpsOrFilter(["year-a", "year-b"])).toBe(
   "academic_year_id.in.(year-a,year-b),academic_year_id.is.null"
  )
 })

 it("無 id 只保留空白學年", () => {
  expect(academicYearIdOpsOrFilter([])).toBe("academic_year_id.is.null")
 })
})

describe("classYearFilterRequiresOlderYears", () => {
 const ops = ["2425", "25SM", "2526", "26SM", "2627"]

 it("目前／已載入唔觸發全量", () => {
  expect(classYearFilterRequiresOlderYears("current", ops)).toBe(false)
  expect(classYearFilterRequiresOlderYears("all", ops)).toBe(false)
 })

 it("窗內學年唔觸發全量", () => {
  expect(classYearFilterRequiresOlderYears("2627", ops)).toBe(false)
  expect(classYearFilterRequiresOlderYears("26SM", ops)).toBe(false)
 })

 it("窗外學年要載入更舊", () => {
  expect(classYearFilterRequiresOlderYears("2324", ops)).toBe(true)
 })

 it("尚未取得 ops 窗時唔搶載", () => {
  expect(classYearFilterRequiresOlderYears("2324", [])).toBe(false)
 })
})

describe("lessonBalancePassesOpsWindow", () => {
 const ops = new Set(["year-ops"])

 it("待補／請假待安排即使舊年仍可見", () => {
  expect(
   lessonBalancePassesOpsWindow({
    pendingLessons: 1,
    leaveAwaitingMakeupCount: 0,
    classAcademicYearId: "year-old",
    opsYearIds: ops,
    studentArchived: true,
   })
  ).toBe(true)
  expect(
   lessonBalancePassesOpsWindow({
    pendingLessons: 0,
    leaveAwaitingMakeupCount: 2,
    classAcademicYearId: "year-old",
    opsYearIds: ops,
   })
  ).toBe(true)
 })

 it("已畢業且無待辦則隱藏", () => {
  expect(
   lessonBalancePassesOpsWindow({
    pendingLessons: 0,
    leaveAwaitingMakeupCount: 0,
    classAcademicYearId: "year-ops",
    opsYearIds: ops,
    studentArchived: true,
   })
  ).toBe(false)
 })

 it("非豁免跟班別學年窗", () => {
  expect(
   lessonBalancePassesOpsWindow({
    pendingLessons: 0,
    leaveAwaitingMakeupCount: 0,
    classAcademicYearId: "year-ops",
    opsYearIds: ops,
   })
  ).toBe(true)
  expect(
   lessonBalancePassesOpsWindow({
    pendingLessons: 0,
    leaveAwaitingMakeupCount: 0,
    classAcademicYearId: "year-old",
    opsYearIds: ops,
   })
  ).toBe(false)
 })
})

describe("paymentOpsListOrFilter", () => {
 it("含空白收款日同待辦狀態", () => {
  expect(
   paymentOpsListOrFilter({
    startYmd: "2025-07-01",
    pendingPayStatus: "待繳費",
    pendingReceiveStatus: "待收款",
   })
  ).toBe("payment_date.gte.2025-07-01,payment_date.is.null,status.eq.待繳費,status.eq.待收款")
 })
})

describe("formatOpsYearScopeCaption", () => {
 it("列出窗內學年", () => {
  expect(formatOpsYearScopeCaption(["26SM", "2627"])).toBe("日常營運窗（26SM、2627）")
 })

 it("空白則只寫日常營運窗", () => {
  expect(formatOpsYearScopeCaption([])).toBe("日常營運窗")
 })
})
