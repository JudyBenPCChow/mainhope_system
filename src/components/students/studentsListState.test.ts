import { afterEach, describe, expect, it } from "vitest"

import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import {
 dropStaleEnrollmentYearTags,
 isStudentsListCacheFresh,
 setStudentsListDataCache,
 studentsListCacheKey,
 type StudentsListDataCache,
} from "@/components/students/studentsListState"
import type { StudentRecord } from "@/services/studentQueries"

function cacheWith(
 partial: Partial<StudentsListDataCache> & Pick<StudentsListDataCache, "key">
): StudentsListDataCache {
 return {
  rows: [{ id: "s1" } as StudentRecord],
  tags: new Map([["s1", ["英國語文（26SM-ENGS1001-A）"]]]),
  recentEnrollments: [],
  hiddenGraduatedCount: 0,
  ...partial,
 }
}

afterEach(() => {
 setStudentsListDataCache(
  cacheWith({
   key: { isActiveScope: true, showGraduated: false, enrollmentYear: "" },
   rows: [],
   tags: new Map(),
  }),
  0
 )
})

describe("studentsListCacheKey", () => {
 it("含日曆目前學年", () => {
  const key = studentsListCacheKey({ isActiveScope: true, showGraduated: false })
  expect(key.enrollmentYear).toBe(academicYearLabelFromStartDate(null))
 })
})

describe("dropStaleEnrollmentYearTags", () => {
 it("學年相同則沿用 tags", () => {
  const cached = cacheWith({
   key: { isActiveScope: true, showGraduated: false, enrollmentYear: "2627" },
  })
  expect(dropStaleEnrollmentYearTags(cached, "2627")).toBe(cached)
 })

 it("學年不同則清空 tags", () => {
  const cached = cacheWith({
   key: { isActiveScope: true, showGraduated: false, enrollmentYear: "26SM" },
  })
  const next = dropStaleEnrollmentYearTags(cached, "2627")
  expect(next.tags.size).toBe(0)
  expect(next.key.enrollmentYear).toBe("2627")
  expect(next.rows).toBe(cached.rows)
  expect(cached.tags.size).toBe(1)
 })
})

describe("isStudentsListCacheFresh", () => {
 it("學年不符則不算新鮮", () => {
  setStudentsListDataCache(
   cacheWith({
    key: { isActiveScope: true, showGraduated: false, enrollmentYear: "26SM" },
   })
  )
  expect(
   isStudentsListCacheFresh({
    isActiveScope: true,
    showGraduated: false,
    enrollmentYear: "2627",
   })
  ).toBe(false)
  expect(
   isStudentsListCacheFresh({
    isActiveScope: true,
    showGraduated: false,
    enrollmentYear: "26SM",
   })
  ).toBe(true)
 })
})
