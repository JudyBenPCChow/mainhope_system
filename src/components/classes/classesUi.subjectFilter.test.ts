import { describe, expect, it } from "vitest"

import {
 buildSubjectFilterChips,
 isSpecialtySubjectFilterLabel,
} from "@/components/classes/classesUi"

describe("班別管理科目篩選", () => {
 it("排除功輔與私人課程科目標籤", () => {
  expect(isSpecialtySubjectFilterLabel("中文")).toBe(true)
  expect(isSpecialtySubjectFilterLabel("功課輔導")).toBe(false)
  expect(isSpecialtySubjectFilterLabel("HWK")).toBe(false)
  expect(isSpecialtySubjectFilterLabel("一對一")).toBe(false)
  expect(isSpecialtySubjectFilterLabel("一對二數學")).toBe(false)
 })

 it("buildSubjectFilterChips 唔會列出功輔／私人科目", () => {
  const chips = buildSubjectFilterChips([
   { subject: "中文", subject_code: "CHI" },
   { subject: "功課輔導", subject_code: "HWK" },
   { subject: "一對一", subject_code: null },
   { subject: "數學", subject_code: "MATH" },
  ])
  expect(chips).toEqual(["全部", "中文", "數學"])
 })
})
