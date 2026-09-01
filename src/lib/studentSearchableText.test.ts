import { describe, expect, it } from "vitest"

import { studentDisplayText, studentSearchText } from "@/lib/studentSearchableText"

describe("studentDisplayText / studentSearchText", () => {
 const student = {
  id: "1",
  full_name: "陳大文",
  student_code: "STU001",
  english_name: "Chan Tai Man",
 }

 it("輸入框顯示姓名與學號", () => {
  expect(studentDisplayText(student)).toBe("陳大文（STU001）")
  expect(studentDisplayText({ ...student, student_code: null })).toBe("陳大文")
 })

 it("搜尋字串含姓名、學號與英文名", () => {
  expect(studentSearchText(student)).toBe("陳大文 STU001 Chan Tai Man")
 })
})
