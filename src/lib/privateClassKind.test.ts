import { describe, expect, it } from "vitest"

import {
 isUnassignedTeachingTeacherIssue,
 scheduleTeacherDisplayName,
} from "@/lib/privateClassKind"

describe("isUnassignedTeachingTeacherIssue", () => {
 it("flags specialty schedules with no teacher", () => {
  expect(
   isUnassignedTeachingTeacherIssue({
    teacher_id: null,
    status: "正常",
    class_kind: "group",
   })
  ).toBe(true)
 })

 it("ignores homework occupancy without duty teacher", () => {
  expect(
   isUnassignedTeachingTeacherIssue({
    teacher_id: null,
    status: "正常",
    class_kind: "homework",
   })
  ).toBe(false)
 })

 it("ignores cancelled specialty schedules", () => {
  expect(
   isUnassignedTeachingTeacherIssue({
    teacher_id: null,
    status: "取消",
    class_kind: "group",
   })
  ).toBe(false)
 })
})

describe("scheduleTeacherDisplayName", () => {
 it("uses 暫時空缺 for homework without duty teacher", () => {
  expect(
   scheduleTeacherDisplayName(
    { teacher_id: null, teacher_name: null, status: "正常", class_kind: "homework" },
    { warnIfUnassigned: true }
   )
  ).toBe("暫時空缺")
 })

 it("uses 未指定老師 for specialty without teacher when warning", () => {
  expect(
   scheduleTeacherDisplayName(
    { teacher_id: null, teacher_name: null, status: "正常", class_kind: "group" },
    { warnIfUnassigned: true }
   )
  ).toBe("未指定老師")
 })
})
