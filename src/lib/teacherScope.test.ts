import { describe, expect, it } from "vitest"

import { getTeacherScopeTeacherId } from "@/lib/teacherScope"

describe("getTeacherScopeTeacherId", () => {
 it("uses the Auth profile teacher id for the teacher role", () => {
  expect(
   getTeacherScopeTeacherId({
    activeRole: "teacher",
    teacherId: " teacher-1 ",
   })
  ).toBe("teacher-1")
 })

 it("fails closed for non-teacher roles or a missing teacher id", () => {
  expect(getTeacherScopeTeacherId({ activeRole: "admin", teacherId: "teacher-1" })).toBeNull()
  expect(getTeacherScopeTeacherId({ activeRole: "teacher", teacherId: null })).toBeNull()
  expect(getTeacherScopeTeacherId(null)).toBeNull()
 })
})
