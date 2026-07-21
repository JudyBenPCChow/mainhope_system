import { describe, expect, it } from "vitest"

import {
  buildStudentIdsWithCalendarYearEnrollment,
  buildStudentIdsWithLegacyCalendarYearEnrollment,
  isEnrollmentInCalendarYear,
  isLegacyPeriodInCalendarYear,
  isPromotionMatchStudentCandidate,
  mergeStudentIdsActiveInCalendarYear,
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

describe("calendar year enrollment activity", () => {
  it("uses enroll_date when present", () => {
    expect(
      isEnrollmentInCalendarYear(
        { enroll_date: "2026-03-15", created_at: "2025-01-01T00:00:00Z" },
        2026
      )
    ).toBe(true)
    expect(
      isEnrollmentInCalendarYear(
        { enroll_date: "2025-12-31", created_at: "2026-01-01T00:00:00Z" },
        2026
      )
    ).toBe(false)
  })

  it("falls back to created_at when enroll_date is empty", () => {
    expect(
      isEnrollmentInCalendarYear(
        { enroll_date: null, created_at: "2026-08-01T12:00:00+08:00" },
        2026
      )
    ).toBe(true)
    expect(
      isEnrollmentInCalendarYear(
        { enroll_date: "", created_at: "2027-01-02T00:00:00Z" },
        2026
      )
    ).toBe(false)
  })

  it("collects unique student ids with any enrollment in the calendar year", () => {
    const ids = buildStudentIdsWithCalendarYearEnrollment(
      [
        { student_id: "a", enroll_date: "2026-01-01", created_at: "2026-01-01T00:00:00Z" },
        { student_id: "a", enroll_date: "2026-06-01", created_at: "2026-06-01T00:00:00Z" },
        { student_id: "b", enroll_date: "2025-09-01", created_at: "2025-09-01T00:00:00Z" },
        { student_id: "c", enroll_date: null, created_at: "2026-12-31T16:00:00Z" },
      ],
      2026
    )
    expect([...ids].sort()).toEqual(["a", "c"])
  })

  it("includes Notion legacy subject periods overlapping the calendar year", () => {
    expect(isLegacyPeriodInCalendarYear("2026-01-01", "2026-06-30", 2026)).toBe(true)
    expect(isLegacyPeriodInCalendarYear("2025-09-01", "2025-12-31", 2026)).toBe(false)

    const legacyIds = buildStudentIdsWithLegacyCalendarYearEnrollment(
      [
        { student_id: "legacy-a", period_start: "2026-01-01", period_end: "2026-06-30" },
        { student_id: "legacy-b", period_start: "2025-07-01", period_end: "2025-12-31" },
      ],
      2026
    )
    expect([...legacyIds]).toEqual(["legacy-a"])
  })

  it("merges current enrollments with Notion legacy records", () => {
    const ids = mergeStudentIdsActiveInCalendarYear(
      [{ student_id: "sys", enroll_date: "2026-08-01", created_at: "2026-08-01T00:00:00Z" }],
      [{ student_id: "notion", period_start: "2026-01-01", period_end: "2026-06-30" }],
      2026
    )
    expect([...ids].sort()).toEqual(["notion", "sys"])
  })
})
