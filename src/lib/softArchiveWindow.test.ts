import { describe, expect, it } from "vitest"

import {
 listRetainedAcademicYearLabels,
 opsWindowDateBounds,
 resolveCurrentAcademicYearLabel,
} from "@/lib/softArchiveWindow"

const SEED = [
 { label: "2425", start_date: "2024-09-01", end_date: "2025-06-30", is_current: false },
 { label: "25SM", start_date: "2025-07-01", end_date: "2025-08-31", is_current: false },
 { label: "2526", start_date: "2025-09-01", end_date: "2026-06-30", is_current: false },
 { label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31", is_current: false },
 { label: "2627", start_date: "2026-09-01", end_date: "2027-06-30", is_current: true },
 { label: "27SM", start_date: "2027-07-01", end_date: "2027-08-31", is_current: false },
] as const

describe("resolveCurrentAcademicYearLabel", () => {
 it("asOf 落在學年日期內優先於 is_current", () => {
  expect(resolveCurrentAcademicYearLabel([...SEED], "2026-07-15")).toBe("26SM")
  expect(resolveCurrentAcademicYearLabel([...SEED], "2026-10-01")).toBe("2627")
 })
})

describe("listRetainedAcademicYearLabels", () => {
 it("ops：目前 2627 覆蓋兩個常規學年＋其前一個暑期", () => {
  expect(listRetainedAcademicYearLabels([...SEED], "ops", "2026-10-01")).toEqual([
   "25SM",
   "2526",
   "26SM",
   "2627",
  ])
 })

 it("ops：目前 26SM 往前兩個常規，並含下一常規 2627；種子無 24SM 則從 2425 起", () => {
  expect(listRetainedAcademicYearLabels([...SEED], "ops", "2026-07-20")).toEqual([
   "2425",
   "25SM",
   "2526",
   "26SM",
   "2627",
  ])
 })

 it("ops：常規學年目前時不含其後暑期", () => {
  const labels = listRetainedAcademicYearLabels([...SEED], "ops", "2026-10-01")
  expect(labels).not.toContain("27SM")
  expect(labels).not.toContain("2425")
 })

 it("opsWindowDateBounds：取保留窗最早起、最晚迄", () => {
  const labels = listRetainedAcademicYearLabels([...SEED], "ops", "2026-10-01")
  expect(opsWindowDateBounds([...SEED], labels)).toEqual({
   startYmd: "2025-07-01",
   endYmd: "2027-06-30",
  })
 })

 it("compliance：全部仍在傳入清單（含未來）", () => {
  expect(listRetainedAcademicYearLabels([...SEED], "compliance", "2026-10-01")).toEqual([
   "2425",
   "25SM",
   "2526",
   "26SM",
   "2627",
   "27SM",
  ])
 })

 it("空清單", () => {
  expect(listRetainedAcademicYearLabels([], "ops")).toEqual([])
  expect(listRetainedAcademicYearLabels([], "compliance")).toEqual([])
 })

 it("歷史少於兩個常規學年時不捏造 label", () => {
  const thin = [
   { label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31", is_current: false },
   { label: "2627", start_date: "2026-09-01", end_date: "2027-06-30", is_current: true },
  ]
  expect(listRetainedAcademicYearLabels(thin, "ops", "2026-10-01")).toEqual(["26SM", "2627"])
 })

 it("ops：暑期目前但清單無下一常規時不捏造", () => {
  const thin = [
   { label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31", is_current: true },
  ]
  expect(listRetainedAcademicYearLabels(thin, "ops", "2026-07-20")).toEqual(["26SM"])
 })
})
