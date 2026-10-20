import { describe, expect, it } from "vitest"

import { filterSearchableOptions } from "@/components/ui/searchable-select"
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

  it("搜尋字串含學生與家長電話", () => {
  expect(
   studentSearchText({
    ...student,
    student_phone: "91234567",
    parent_phone: "98765432",
   })
  ).toBe("陳大文 STU001 Chan Tai Man 91234567 98765432")
 })

 it("搜尋字串含年級中文與代碼", () => {
  expect(studentSearchText({ ...student, grade: "S1" })).toBe(
   "陳大文 STU001 Chan Tai Man 中一 S1"
  )
  expect(studentSearchText({ ...student, grade: "中一" })).toContain("中一")
  expect(studentSearchText({ ...student, grade: "中一" })).toContain("S1")
 })

 it("共用下拉可用中一或 S1 命中", () => {
  const options = [
   {
    value: student.id,
    label: student.full_name,
    searchText: studentSearchText({ ...student, grade: "S1" }),
    displayText: studentDisplayText(student),
   },
  ]
  expect(filterSearchableOptions(options, "中一").map((o) => o.value)).toEqual([student.id])
  expect(filterSearchableOptions(options, "S1").map((o) => o.value)).toEqual([student.id])
 })
})
