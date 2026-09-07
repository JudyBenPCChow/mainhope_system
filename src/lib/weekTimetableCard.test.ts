import { describe, expect, it } from "vitest"

import {
 formatWeekTimetableStudentLine,
 weekTimetableCardClassName,
 weekTimetableCardKind,
} from "@/lib/weekTimetableCard"

describe("weekTimetableCardKind", () => {
 it("cancelled beats extra and roster", () => {
  expect(
   weekTimetableCardKind({ status: "取消", isExtraLesson: true, enrollCount: 3 })
  ).toBe("cancelled")
 })

 it("extra beats empty and enrolled", () => {
  expect(
   weekTimetableCardKind({ status: "正常", isExtraLesson: true, enrollCount: 0 })
  ).toBe("extra")
  expect(
   weekTimetableCardKind({ status: "正常", isExtraLesson: true, enrollCount: 2 })
  ).toBe("extra")
 })

 it("empty only after roster loaded as zero", () => {
  expect(
   weekTimetableCardKind({ status: "正常", isExtraLesson: false, enrollCount: 0 })
  ).toBe("empty")
  expect(
   weekTimetableCardKind({ status: "正常", isExtraLesson: false, enrollCount: null })
  ).toBe("pending")
 })

 it("enrolled when roster has students", () => {
  expect(
   weekTimetableCardKind({ status: "正常", isExtraLesson: false, enrollCount: 1 })
  ).toBe("enrolled")
 })
})

describe("formatWeekTimetableStudentLine", () => {
 it("returns null while roster is loading", () => {
  expect(formatWeekTimetableStudentLine(null, true)).toBeNull()
 })

 it("labels empty roster", () => {
  expect(formatWeekTimetableStudentLine([], false)).toBe("尚無學生")
 })

 it("joins names and abbreviates compact overflow", () => {
  expect(formatWeekTimetableStudentLine(["陳一", "李二"], false)).toBe("陳一、李二")
  expect(formatWeekTimetableStudentLine(["陳一", "李二", "張三", "黃四"], true)).toBe(
   "陳一、李二 等 4 人"
  )
  expect(formatWeekTimetableStudentLine(["陳一", "李二", "張三", "黃四"], false)).toBe(
   "陳一、李二、張三、黃四"
  )
 })
})

describe("weekTimetableCardClassName", () => {
 it("uses light semantic fills without foreground-on-tint", () => {
  expect(weekTimetableCardClassName("enrolled", true)).toContain("bg-success/15")
  expect(weekTimetableCardClassName("empty", true)).toContain("bg-muted/70")
  expect(weekTimetableCardClassName("cancelled", true)).toContain("bg-destructive/10")
  expect(weekTimetableCardClassName("extra", true)).toContain("bg-warning/15")
  expect(weekTimetableCardClassName("enrolled", true)).not.toContain("success-foreground")
  expect(weekTimetableCardClassName("extra", true)).not.toContain("warning-foreground")
  expect(weekTimetableCardClassName("cancelled", true)).not.toContain("destructive-foreground")
 })
})
