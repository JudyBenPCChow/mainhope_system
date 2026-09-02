import { describe, expect, it, vi } from "vitest"

import { applyHomeworkRosterStatusChange } from "@/lib/homeworkTutoringRosterPersist"

describe("applyHomeworkRosterStatusChange", () => {
 it("改為未編更時先清佔室再寫狀態", async () => {
  const order: string[] = []
  const next = await applyHomeworkRosterStatusChange({
   previous: { "2026-09": "已編更" },
   yearMonth: "2026-09",
   nextState: "未編更",
   classId: "class-1",
   rosterMonthId: "roster-1",
   sheetMonth: "2026-09",
   clearOccupancy: async () => {
    order.push("clear")
   },
   setRosterStatus: async () => {
    order.push("status")
   },
  })
  expect(order).toEqual(["clear", "status"])
  expect(next["2026-09"]).toBe("未編更")
 })

 it("清佔室失敗則不寫狀態、不回傳新畫面狀態", async () => {
  const setRosterStatus = vi.fn()
  await expect(
   applyHomeworkRosterStatusChange({
    previous: { "2026-09": "已編更" },
    yearMonth: "2026-09",
    nextState: "未編更",
    classId: "class-1",
    rosterMonthId: "roster-1",
    sheetMonth: "2026-09",
    clearOccupancy: async () => {
     throw new Error("佔室失敗")
    },
    setRosterStatus,
   })
  ).rejects.toThrow("佔室失敗")
  expect(setRosterStatus).not.toHaveBeenCalled()
 })

 it("狀態相同則不打庫", async () => {
  const clearOccupancy = vi.fn()
  const setRosterStatus = vi.fn()
  const previous = { "2026-09": "已編更" as const }
  const next = await applyHomeworkRosterStatusChange({
   previous,
   yearMonth: "2026-09",
   nextState: "已編更",
   classId: "class-1",
   rosterMonthId: "roster-1",
   sheetMonth: "2026-09",
   clearOccupancy,
   setRosterStatus,
  })
  expect(next).toBe(previous)
  expect(clearOccupancy).not.toHaveBeenCalled()
  expect(setRosterStatus).not.toHaveBeenCalled()
 })
})
