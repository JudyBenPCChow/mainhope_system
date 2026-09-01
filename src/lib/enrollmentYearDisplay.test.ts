import { describe, expect, it } from "vitest"

import {
 collectCurrentEnrollmentSubjectTags,
 groupEnrollmentsByAcademicYear,
 isCollectableEnrollment,
 isCurrentEnrollmentYear,
 listCurrentEnrollmentYearLabels,
 partitionEnrollmentsByAcademicYear,
} from "@/lib/enrollmentYearDisplay"

describe("listCurrentEnrollmentYearLabels", () => {
 it("常規學年只含目前學年，不含剛結束的暑期", () => {
  expect(listCurrentEnrollmentYearLabels("2026-09-01")).toEqual(["2627"])
  expect(listCurrentEnrollmentYearLabels("2026-10-01")).toEqual(["2627"])
 })

 it("暑期另含下一常規學年", () => {
  expect(listCurrentEnrollmentYearLabels("2026-07-20")).toEqual(["26SM", "2627"])
  expect(listCurrentEnrollmentYearLabels("2026-08-31")).toEqual(["26SM", "2627"])
 })
})

describe("isCurrentEnrollmentYear", () => {
 it("9 月起 26SM 不再算進行中", () => {
  expect(isCurrentEnrollmentYear("2627", "2026-09-01")).toBe(true)
  expect(isCurrentEnrollmentYear("26SM", "2026-09-01")).toBe(false)
  expect(isCurrentEnrollmentYear("2526", "2026-09-01")).toBe(false)
 })

 it("缺學年標籤當進行中", () => {
  expect(isCurrentEnrollmentYear(null, "2026-09-01")).toBe(true)
  expect(isCurrentEnrollmentYear("  ", "2026-09-01")).toBe(true)
 })
})

describe("isCollectableEnrollment", () => {
 it("9 月起不收 26SM 專科／功輔，私人課程仍可收", () => {
  expect(
   isCollectableEnrollment(
    { status: "就讀中", academicYearLabel: "26SM", classKind: "group" },
    "2026-09-01"
   )
  ).toBe(false)
  expect(
   isCollectableEnrollment(
    { status: "就讀中", academicYearLabel: "26SM", classKind: "homework" },
    "2026-09-01"
   )
  ).toBe(false)
  expect(
   isCollectableEnrollment(
    { status: "就讀中", academicYearLabel: "26SM", classKind: "private" },
    "2026-09-01"
   )
  ).toBe(true)
  expect(
   isCollectableEnrollment(
    { status: "就讀中", academicYearLabel: "2627", classKind: "group" },
    "2026-09-01"
   )
  ).toBe(true)
 })

 it("已退讀一律不可收", () => {
  expect(
   isCollectableEnrollment(
    { status: "已退讀", academicYearLabel: "2627", classKind: "private" },
    "2026-09-01"
   )
  ).toBe(false)
 })
})

describe("partitionEnrollmentsByAcademicYear", () => {
 it("把已結束學年的就讀中報讀歸入過往，已退讀另列", () => {
  const rows = [
   { id: "a", status: "就讀中", academicYearLabel: "2627", classKind: "group" },
   { id: "b", status: "就讀中", academicYearLabel: "26SM", classKind: "group" },
   { id: "c", status: "已退讀", academicYearLabel: "2627", classKind: "group" },
   { id: "d", status: "休學", academicYearLabel: "26SM", classKind: "homework" },
  ]
  const part = partitionEnrollmentsByAcademicYear(rows, "2026-09-01")
  expect(part.current.map((r) => r.id)).toEqual(["a"])
  expect(part.past.map((r) => r.id)).toEqual(["b", "d"])
  expect(part.withdrawn.map((r) => r.id)).toEqual(["c"])
 })

 it("過往學年的私人課程仍算進行中", () => {
  const part = partitionEnrollmentsByAcademicYear(
   [
    { id: "p", status: "就讀中", academicYearLabel: "26SM", classKind: "private" },
    { id: "g", status: "就讀中", academicYearLabel: "26SM", classKind: "group" },
   ],
   "2026-09-01"
  )
  expect(part.current.map((r) => r.id)).toEqual(["p"])
  expect(part.past.map((r) => r.id)).toEqual(["g"])
 })
})

describe("collectCurrentEnrollmentSubjectTags", () => {
 it("9 月起不含 26SM 專科／功輔，私人課程與目前學年仍列出", () => {
  const tags = collectCurrentEnrollmentSubjectTags(
   [
    {
     studentId: "s1",
     subjectLabel: "中國語文（2627-CHIS1001-A）",
     academicYearLabel: "2627",
     classKind: "group",
    },
    {
     studentId: "s1",
     subjectLabel: "英國語文（26SM-ENGS1001-A）",
     academicYearLabel: "26SM",
     classKind: "group",
    },
    {
     studentId: "s1",
     subjectLabel: "功課輔導（26SM-HWKS1001-A）",
     academicYearLabel: "26SM",
     classKind: "homework",
    },
    {
     studentId: "s1",
     subjectLabel: "一對一數學",
     academicYearLabel: null,
     classKind: "private",
    },
    {
     studentId: "s2",
     subjectLabel: "綜合科學（26SM-SCIS2001-A）",
     academicYearLabel: "26SM",
     classKind: "group",
    },
   ],
   "2026-09-02"
  )
  expect(tags.get("s1")).toEqual(["中國語文（2627-CHIS1001-A）", "一對一數學"])
  expect(tags.has("s2")).toBe(false)
 })

 it("已退讀不列入，即使學年仍是目前學年", () => {
  const tags = collectCurrentEnrollmentSubjectTags(
   [
    {
     studentId: "s1",
     subjectLabel: "中國語文（2627-CHIS1001-A）",
     academicYearLabel: "2627",
     classKind: "group",
     status: "已退讀",
    },
   ],
   "2026-09-02"
  )
  expect(tags.has("s1")).toBe(false)
 })
})

describe("groupEnrollmentsByAcademicYear", () => {
 it("按學年由新至舊分組", () => {
  const groups = groupEnrollmentsByAcademicYear([
   { id: "a", academicYearLabel: "2526" },
   { id: "b", academicYearLabel: "26SM" },
   { id: "c", academicYearLabel: "26SM" },
  ])
  expect(groups.map((g) => g.label)).toEqual(["26SM", "2526"])
  expect(groups[0].items.map((r) => r.id)).toEqual(["b", "c"])
 })
})
