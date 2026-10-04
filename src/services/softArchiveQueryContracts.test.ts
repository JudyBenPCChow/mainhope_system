import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function readSrc(rel: string): string {
 return readFileSync(resolve(process.cwd(), rel), "utf8")
}

function fnSlice(src: string, exportName: string): string {
 const start = src.indexOf(`export async function ${exportName}`)
 expect(start).toBeGreaterThanOrEqual(0)
 let end = src.indexOf("\nexport async function ", start + 10)
 if (end < 0) end = src.indexOf("\nexport function ", start + 10)
 if (end < 0) end = src.length
 return src.slice(start, end)
}

describe("軟封存查詢契約（列表收窄 vs id 全量）", () => {
 it("fetchAllStudents 唔用 flag、唔在 query 排除已畢業", () => {
  const fn = fnSlice(readSrc("src/services/studentQueries.ts"), "fetchAllStudents")
  expect(fn).not.toContain("isSoftArchiveQueriesEnabled")
  expect(fn).not.toContain('neq("academic_stage"')
 })

 it("getStudentById 只按 id，唔套名單窗", () => {
  const fn = fnSlice(readSrc("src/services/studentQueries.ts"), "getStudentById")
  expect(fn).not.toContain("isSoftArchiveQueriesEnabled")
  expect(fn).toContain('.eq("id", id)')
 })

 it("fetchStudentsForOpsList 預設排除已畢業且受 flag 回滾", () => {
  const fn = fnSlice(readSrc("src/services/studentQueries.ts"), "fetchStudentsForOpsList")
  expect(fn).toContain("isSoftArchiveQueriesEnabled")
  expect(fn).toContain('neq("academic_stage", "已畢業")')
 })

 it("fetchAllClasses 唔用 flag", () => {
  const fn = fnSlice(readSrc("src/services/classQueries.ts"), "fetchAllClasses")
  expect(fn).not.toContain("isSoftArchiveQueriesEnabled")
 })

 it("getClassById 只按 id", () => {
  const fn = fnSlice(readSrc("src/services/classQueries.ts"), "getClassById")
  expect(fn).not.toContain("isSoftArchiveQueriesEnabled")
  expect(fn).toContain('.eq("id", id)')
 })

 it("fetchClassesForOpsList 跟 ops 窗且受 flag 回滾", () => {
  const fn = fnSlice(readSrc("src/services/classQueries.ts"), "fetchClassesForOpsList")
  expect(fn).toContain("isSoftArchiveQueriesEnabled")
  expect(fn).toContain("academicYearIdOpsOrFilter")
 })

 it("fetchTrialsWithRelations 已完成仍回傳，並以 class_id 補上班名", () => {
  const fn = fnSlice(readSrc("src/services/trialQueries.ts"), "fetchTrialsWithRelations")
  expect(fn).toContain("TRIAL_LIST_COLUMNS_INNER_CLASS")
  expect(fn).toContain("fillTrialClassLabels")
  expect(fn).toContain("TRIAL_CLOSED_STATUS_OR")
  expect(fn).not.toContain('.select("id, classes(academic_year_id)"')
  expect((fn.match(/classes!inner/g) ?? []).length).toBeGreaterThanOrEqual(2)
 })

 it("fetchLeaveMakeupWithRelations 已完成仍回傳，並以 class_id 補上班名", () => {
  const fn = fnSlice(readSrc("src/services/leaveQueries.ts"), "fetchLeaveMakeupWithRelations")
  expect(fn).toContain("LEAVE_LIST_COLUMNS_INNER_CLASS")
  expect(fn).toContain("fillLeaveClassLabels")
  expect(fn).toContain("LEAVE_COMPLETED_STATUS_OR")
  expect(fn).not.toContain('.select("id, classes(academic_year_id)"')
  expect((fn.match(/classes!inner/g) ?? []).length).toBeGreaterThanOrEqual(2)
 })

 it("fetchClassOptions 新增報讀只跟目前學年窗，唔跟 ops 窗／flag", () => {
  const fn = fnSlice(readSrc("src/services/studentQueries.ts"), "fetchClassOptions")
  expect(fn).toContain("fetchEnrollableAcademicYearWindow")
  expect(fn).not.toContain("fetchOpsAcademicYearWindow")
  expect(fn).not.toContain("isSoftArchiveQueriesEnabled")
  expect(fn).not.toContain("academicYearIdOpsOrFilter")
 })
})
