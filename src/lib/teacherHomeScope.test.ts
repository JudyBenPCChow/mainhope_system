import { describe, expect, it } from "vitest"

import {
 classAcademicYearLabel,
 filterClassesForCurrentAcademicYear,
 isYmdInRange,
 resolveSemesterDateRange,
} from "@/lib/teacherHomeScope"
import { academicYearLabelFromCourseCode } from "@/lib/courseCode"

describe("academicYearLabelFromCourseCode", () => {
 it("reads regular and summer prefixes", () => {
  expect(academicYearLabelFromCourseCode("2627-CHEMS4001-A")).toBe("2627")
  expect(academicYearLabelFromCourseCode("26SM-CHEMS4008-A")).toBe("26SM")
  expect(academicYearLabelFromCourseCode("bad")).toBeNull()
 })
})

describe("filterClassesForCurrentAcademicYear", () => {
 const rows = [
  { id: "a", academic_year_label: "2627", course_code_full: "2627-CHEMS4001-A" },
  { id: "b", academic_year_label: "26SM", course_code_full: "26SM-CHEMS4008-A" },
  { id: "c", academic_year_label: null, course_code_full: "2627-CHEMS5001-A" },
 ]

 it("prefers academic_year_label then course code", () => {
  expect(classAcademicYearLabel(rows[2]!)).toBe("2627")
 })

 it("keeps only the current year", () => {
  expect(filterClassesForCurrentAcademicYear(rows, "2627").map((c) => c.id)).toEqual(["a", "c"])
 })
})

describe("resolveSemesterDateRange", () => {
 const years = [
  { label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31", is_current: false },
  { label: "2627", start_date: "2026-09-01", end_date: "2027-06-30", is_current: true },
 ]
 const periods = [
  {
   id: "p1",
   academicYearId: "y-2627",
   periodCode: 1 as const,
   label: "上學期",
   startDate: "2026-09-01",
   endDate: "2027-01-31",
  },
  {
   id: "p2",
   academicYearId: "y-2627",
   periodCode: 2 as const,
   label: "下學期",
   startDate: "2027-02-01",
   endDate: "2027-06-30",
  },
 ]

 it("uses the period containing asOf", () => {
  expect(resolveSemesterDateRange({ asOfYmd: "2026-09-08", years, periods })).toEqual({
   startYmd: "2026-09-01",
   endYmd: "2027-01-31",
  })
  expect(resolveSemesterDateRange({ asOfYmd: "2027-03-01", years, periods })).toEqual({
   startYmd: "2027-02-01",
   endYmd: "2027-06-30",
  })
 })

 it("filters leave dates to that range", () => {
  const range = resolveSemesterDateRange({ asOfYmd: "2026-09-08", years, periods })
  expect(isYmdInRange("2026-08-07", range)).toBe(false)
  expect(isYmdInRange("2026-09-08", range)).toBe(true)
 })
})
