import { describe, expect, it } from "vitest"

import { isArchivedStudent } from "@/services/studentQueries"

describe("isArchivedStudent", () => {
 it("已畢業", () => {
  expect(isArchivedStudent({ academic_stage: "已畢業", grade: "S6" })).toBe(true)
 })

 it("舊 GD 年級", () => {
  expect(isArchivedStudent({ academic_stage: "中學階段", grade: "GD" })).toBe(true)
 })

 it("中學階段非活躍仍非封存", () => {
  expect(isArchivedStudent({ academic_stage: "中學階段", grade: "S1" })).toBe(false)
 })
})
