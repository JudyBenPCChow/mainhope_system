import { describe, expect, it } from "vitest"

import {
 buildCourseGradeFilterChips,
 courseMatchesGrade,
 courseMatchesSearch,
} from "@/components/courses/coursesUi"
import type { CourseRecord } from "@/services/classQueries"

function course(partial: Partial<CourseRecord>): CourseRecord {
 return {
  id: "c1",
  subject_id: "eng",
  subject_code: "ENG",
  subject_name_zh: "英國語文",
  grade_code: "S4",
  eligible_grade_codes: ["S4"],
  course_seq: 1,
  course_code_base: "ENGS4001",
  course_mode: "regular",
  price_per_lesson: 380,
  price_per_lesson_period_2: null,
  price_per_lesson_both_periods: null,
  course_name: "中四級常規英文班",
  ...partial,
 }
}

describe("courseMatchesGrade", () => {
 it("matches mixed senior English on S4, S5 and S6", () => {
  const mixed = course({
   course_code_base: "ENGS4004",
   course_seq: 4,
   eligible_grade_codes: ["S4", "S5", "S6"],
   course_name: "高中常規英文班（中四至中六）",
  })
  expect(courseMatchesGrade(mixed, "S4")).toBe(true)
  expect(courseMatchesGrade(mixed, "S5")).toBe(true)
  expect(courseMatchesGrade(mixed, "S6")).toBe(true)
  expect(courseMatchesGrade(mixed, "S3")).toBe(false)
 })

 it("keeps single-grade templates on one chip", () => {
  const s4 = course({})
  expect(courseMatchesGrade(s4, "S4")).toBe(true)
  expect(courseMatchesGrade(s4, "S5")).toBe(false)
 })
})

describe("buildCourseGradeFilterChips", () => {
 it("includes S6 when only a mixed course lists it", () => {
  const chips = buildCourseGradeFilterChips([
   course({
    course_code_base: "ENGS4004",
    eligible_grade_codes: ["S4", "S5", "S6"],
   }),
  ])
  expect(chips).toEqual(["全部", "S4", "S5", "S6"])
 })
})

describe("courseMatchesSearch", () => {
 it("finds mixed templates by course code or 中六", () => {
  const mixed = course({
   course_code_base: "ENGS5004",
   grade_code: "S5",
   eligible_grade_codes: ["S4", "S5", "S6"],
   course_name: "高中常規英文班（中四至中六）",
  })
  expect(courseMatchesSearch(mixed, "ENGS5004", "英國語文（ENG）")).toBe(true)
  expect(courseMatchesSearch(mixed, "中六", "英國語文（ENG）")).toBe(true)
 })
})
