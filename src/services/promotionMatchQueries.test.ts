import { describe, expect, it } from "vitest"

import {
  buildHistoricalSubjectsFromSourceEnrollments,
  buildStudentIdsEnrolledInSourceYear,
  isPromotableTargetGroupClass,
  isPromotionMatchStudentCandidate,
} from "./promotionMatchQueries"

describe("isPromotionMatchStudentCandidate", () => {
  it("includes registered secondary students still in school", () => {
    expect(
      isPromotionMatchStudentCandidate({
        registration_status: "已註冊",
        academic_stage: "中學階段",
        grade: "S5",
      })
    ).toBe(true)
  })

  it("excludes graduated students by academic stage", () => {
    expect(
      isPromotionMatchStudentCandidate({
        registration_status: "已註冊",
        academic_stage: "已畢業",
        grade: "S6",
      })
    ).toBe(false)
  })

  it("excludes graduated students by grade code GD", () => {
    expect(
      isPromotionMatchStudentCandidate({
        registration_status: "已註冊",
        academic_stage: "中學階段",
        grade: "GD",
      })
    ).toBe(false)
  })

  it("excludes non-registered students", () => {
    expect(
      isPromotionMatchStudentCandidate({
        registration_status: "非注冊",
        academic_stage: "中學階段",
        grade: "S4",
      })
    ).toBe(false)
  })
})

describe("isPromotableTargetGroupClass", () => {
  it("keeps 2627 group classes that are in progress or recruiting", () => {
    expect(
      isPromotableTargetGroupClass({
        status: "進行中",
        class_kind: "group",
        academic_year_label: "2627",
      })
    ).toBe(true)
    expect(
      isPromotableTargetGroupClass({
        status: "招生中",
        class_kind: "group",
        academic_year_label: "2627",
      })
    ).toBe(true)
  })

  it("excludes summer, ended, and private classes", () => {
    expect(
      isPromotableTargetGroupClass({
        status: "進行中",
        class_kind: "group",
        academic_year_label: "26SM",
      })
    ).toBe(false)
    expect(
      isPromotableTargetGroupClass({
        status: "已結束",
        class_kind: "group",
        academic_year_label: "2627",
      })
    ).toBe(false)
    expect(
      isPromotableTargetGroupClass({
        status: "進行中",
        class_kind: "private",
        academic_year_label: "2627",
      })
    ).toBe(false)
  })
})

describe("26SM source-year activity", () => {
  it("marks students with 26SM 就讀中 enrollments as active", () => {
    const ids = buildStudentIdsEnrolledInSourceYear([
      { studentId: "a", academicYearLabel: "26SM", status: "就讀中" },
      { studentId: "b", academicYearLabel: "2627", status: "就讀中" },
      { studentId: "c", academicYearLabel: "26SM", status: "已退讀" },
    ])
    expect([...ids]).toEqual(["a"])
  })

  it("builds historical subjects only from 26SM 就讀中", () => {
    const rows = buildHistoricalSubjectsFromSourceEnrollments([
      {
        studentId: "a",
        subjectId: "eng",
        academicYearLabel: "26SM",
        status: "就讀中",
      },
      {
        studentId: "a",
        subjectId: "eng",
        academicYearLabel: "26SM",
        status: "就讀中",
      },
      {
        studentId: "a",
        subjectId: "chi",
        academicYearLabel: "2627",
        status: "就讀中",
      },
      {
        studentId: "b",
        subjectId: "math",
        academicYearLabel: "26SM",
        status: "已退讀",
      },
    ])
    expect(rows).toEqual([{ studentId: "a", subjectId: "eng" }])
  })
})
