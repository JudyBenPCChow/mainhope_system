import { describe, expect, it } from "vitest"

import { academicYearLabelForClass } from "@/lib/academicYearEditGuard"

describe("academicYearLabelForClass", () => {
 it("私人班無學年、無開始日時唔用今日推成目前學年", () => {
  expect(
   academicYearLabelForClass({
    class_kind: "private",
    academic_year_label: null,
    start_date: null,
   })
  ).toBe("")
 })

 it("專科班無 label 時仍由開始日推學年", () => {
  expect(
   academicYearLabelForClass({
    class_kind: "group",
    academic_year_label: null,
    start_date: "2026-09-01",
   })
  ).toBe("2627")
 })

 it("有 academic_year_label 就照用", () => {
  expect(
   academicYearLabelForClass({
    class_kind: "private",
    academic_year_label: "2526",
    start_date: null,
   })
  ).toBe("2526")
 })
})
