import { describe, expect, it } from "vitest"

import {
 classEmbedExemptFromStudentTimeConflict,
 isExemptFromStudentTimeConflict,
} from "@/lib/studentTimeConflict"

describe("isExemptFromStudentTimeConflict", () => {
 it("exempts homework class_kind", () => {
  expect(
   isExemptFromStudentTimeConflict({
    classKind: "homework",
    subject: "功課輔導",
    courseCode: "2627-HWKS1099-A",
   })
  ).toBe(true)
 })

 it("exempts HWKP even when class_kind is group", () => {
  expect(
   isExemptFromStudentTimeConflict({
    classKind: "group",
    subject: "功課輔導",
    courseCode: "26SM-HWKP6001-A",
   })
  ).toBe(true)
 })

 it("does not exempt specialist maths", () => {
  expect(
   isExemptFromStudentTimeConflict({
    classKind: "group",
    subject: "數學",
    courseName: "中三級常規數學班",
    courseCode: "2627-MATHS3001-D",
   })
  ).toBe(false)
 })

 it("does not exempt private tutoring", () => {
  expect(
   isExemptFromStudentTimeConflict({
    classKind: "private",
    subject: "英文 一對一",
   })
  ).toBe(false)
 })
})

describe("classEmbedExemptFromStudentTimeConflict", () => {
 it("reads nested course name", () => {
  expect(
   classEmbedExemptFromStudentTimeConflict({
    class_kind: "homework",
    subject: "功課輔導",
    course_code_full: "2627-HWKS1099-A",
    courses: { course_name: "常規功課輔導班" },
   })
  ).toBe(true)
 })

 it("unwraps PostgREST array embeds", () => {
  expect(
   classEmbedExemptFromStudentTimeConflict([
    {
     class_kind: "homework",
     subject: "功課輔導",
     course_code_full: "2627-HWKS1099-A",
     courses: [{ course_name: "常規功課輔導班" }],
    },
   ])
  ).toBe(true)
 })
})
