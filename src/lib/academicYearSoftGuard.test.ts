import { describe, expect, it } from "vitest"

import { academicYearLabelsForPaymentGuard } from "@/lib/academicYearSoftGuard"

describe("academicYearLabelsForPaymentGuard", () => {
 it("班別是 2627 時，不因 8 月收款日推成 26SM", () => {
  expect(
   academicYearLabelsForPaymentGuard({
    classYearLabels: ["2627", "2627"],
    coverageStartMonths: [null],
    paymentDateYmd: "2026-08-25",
    hasClassLines: true,
   })
  ).toEqual(["2627"])
 })

 it("班別學年優先於功輔覆蓋月", () => {
  expect(
   academicYearLabelsForPaymentGuard({
    classYearLabels: ["2627"],
    coverageStartMonths: ["2026-08"],
    paymentDateYmd: "2026-08-25",
    hasClassLines: true,
   })
  ).toEqual(["2627"])
 })

 it("無班別學年時，才用覆蓋起始月", () => {
  expect(
   academicYearLabelsForPaymentGuard({
    classYearLabels: [null],
    coverageStartMonths: ["2026-09"],
    paymentDateYmd: "2026-08-25",
    hasClassLines: true,
   })
  ).toEqual(["2627"])
 })

 it("私人課程無學年時，不靠收款日", () => {
  expect(
   academicYearLabelsForPaymentGuard({
    classYearLabels: [null],
    paymentDateYmd: "2026-08-25",
    hasClassLines: true,
   })
  ).toEqual([])
 })

 it("沒有明細班別時，才用收款日", () => {
  expect(
   academicYearLabelsForPaymentGuard({
    classYearLabels: [],
    paymentDateYmd: "2026-08-25",
    hasClassLines: false,
   })
  ).toEqual(["26SM"])
 })

 it("混單保留各班學年", () => {
  expect(
   academicYearLabelsForPaymentGuard({
    classYearLabels: ["2627", "26SM"],
    paymentDateYmd: "2026-08-25",
    hasClassLines: true,
   })
  ).toEqual(["2627", "26SM"])
 })
})
