import { describe, expect, it } from "vitest"

import {
 listSpecialistTuitionPeriods,
 resolveSpecialistTuitionPeriods,
 specialistTuitionPeriodCaption,
} from "@/lib/specialistTuitionPeriods"

describe("listSpecialistTuitionPeriods", () => {
 it("has ten periods and 28 dates each for 2627", () => {
  const periods = listSpecialistTuitionPeriods("2627")
  expect(periods).toHaveLength(10)
  for (const p of periods) {
   expect(p.dates).toHaveLength(28)
   expect(p.from <= p.to).toBe(true)
  }
  const all = new Set(periods.flatMap((p) => [...p.dates]))
  expect(all.size).toBe(280)
 })
})

describe("resolveSpecialistTuitionPeriods", () => {
 it("keeps the earliest unfinished period, not the period that contains today", () => {
  const mid = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-09-10",
   academicYearLabel: "2627",
  })
  expect(mid.current?.index).toBe(1)
  expect(mid.next?.index).toBe(2)

  const satSpill = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-10-03",
   academicYearLabel: "2627",
  })
  expect(satSpill.current?.index).toBe(1)
  expect(satSpill.next?.index).toBe(2)

  const overlapP1P2 = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-09-29",
   academicYearLabel: "2627",
  })
  expect(overlapP1P2.current?.index).toBe(1)
  expect(overlapP1P2.next?.index).toBe(2)

  const afterP1 = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-10-04",
   academicYearLabel: "2627",
  })
  expect(afterP1.current?.index).toBe(2)
  expect(afterP1.next?.index).toBe(3)

  const octChaseNov1 = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-10-27",
   academicYearLabel: "2627",
  })
  expect(octChaseNov1.current?.index).toBe(2)
  expect(octChaseNov1.next?.index).toBe(3)

  const afterNov1 = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-11-02",
   academicYearLabel: "2627",
  })
  expect(afterNov1.current?.index).toBe(3)
  expect(afterNov1.next?.index).toBe(4)
 })

 it("stays on the in-progress period during holiday windows", () => {
  const midAutumn = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-09-26",
   academicYearLabel: "2627",
  })
  expect(midAutumn.current?.index).toBe(1)
  expect(midAutumn.next?.index).toBe(2)

  const boxingDay = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-12-26",
   academicYearLabel: "2627",
  })
  expect(boxingDay.current?.index).toBe(4)
  expect(boxingDay.next?.index).toBe(5)

  const newYear = resolveSpecialistTuitionPeriods({
   todayYmd: "2027-01-01",
   academicYearLabel: "2627",
  })
  expect(newYear.current?.index).toBe(4)
  expect(newYear.next?.index).toBe(5)
 })

 it("treats dates before the first class as the upcoming first period", () => {
  const august = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-08-15",
   academicYearLabel: "2627",
  })
  expect(august.current?.index).toBe(1)
  expect(august.next?.index).toBe(2)
 })

 it("returns empty after the last class or when the year has no period table", () => {
  const afterYear = resolveSpecialistTuitionPeriods({
   todayYmd: "2027-06-29",
   academicYearLabel: "2627",
  })
  expect(afterYear.current).toBeNull()
  expect(afterYear.next).toBeNull()

  const summerYear = resolveSpecialistTuitionPeriods({
   todayYmd: "2026-07-15",
   academicYearLabel: "26SM",
  })
  expect(summerYear.current).toBeNull()
  expect(summerYear.next).toBeNull()
 })
})

describe("specialistTuitionPeriodCaption", () => {
 it("appends first and last class dates to the period label", () => {
  const p1 = listSpecialistTuitionPeriods("2627")[0]!
  expect(specialistTuitionPeriodCaption(p1)).toBe("常規第一期 · 9/1–10/3")
 })
})
