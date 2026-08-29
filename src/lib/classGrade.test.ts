import { describe, expect, it } from "vitest"

import {
 classGradeDisplayText,
 eligibleGradeDisplayText,
 gradeLabelsAlignedFromCourse,
 normalizeEligibleGradeCodes,
 resolveClassGradeLabels,
} from "@/lib/classGrade"

describe("normalizeEligibleGradeCodes", () => {
 it("keeps a single grade", () => {
  expect(normalizeEligibleGradeCodes(["S4"], "S4")).toEqual(["S4"])
 })

 it("orders senior mixed grades and includes the code grade", () => {
  expect(normalizeEligibleGradeCodes(["S6", "S4"], "S5")).toEqual(["S4", "S5", "S6"])
 })

 it("drops unknown tokens", () => {
  expect(normalizeEligibleGradeCodes(["S4", "XX", ""], "S4")).toEqual(["S4"])
 })
})

describe("gradeLabelsAlignedFromCourse", () => {
 it("maps one grade_code to one label", () => {
  expect(gradeLabelsAlignedFromCourse("S4")).toEqual(["中四"])
 })

 it("maps mixed eligible codes to 中四、中五、中六", () => {
  expect(gradeLabelsAlignedFromCourse("S4", ["S4", "S5", "S6"])).toEqual([
   "中四",
   "中五",
   "中六",
  ])
 })
})

describe("resolveClassGradeLabels", () => {
 it("follows eligible grades when the course lists them", () => {
  expect(resolveClassGradeLabels(["中四"], "S4", ["S4", "S5", "S6"])).toEqual([
   "中四",
   "中五",
   "中六",
  ])
 })

 it("keeps stored mixed grades when eligible is omitted", () => {
  expect(resolveClassGradeLabels(["中四", "中五", "中六"], "S4")).toEqual(
   expect.arrayContaining(["中四", "中五", "中六"])
  )
  expect(resolveClassGradeLabels(["中四", "中五", "中六"], "S4")).toHaveLength(3)
 })
})

describe("display helpers", () => {
 it("joins mixed grades for course and class screens", () => {
  expect(eligibleGradeDisplayText(["S4", "S5", "S6"], "S4")).toBe("中四、中五、中六")
  expect(classGradeDisplayText(["中四"], "S4", ["S4", "S5", "S6"])).toBe("中四、中五、中六")
 })
})
