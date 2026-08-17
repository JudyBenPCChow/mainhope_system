import { beforeAll, describe, expect, it } from "vitest"

import {
 countUniqueScheduledDates,
 dismissChickenGentlemanNudge,
 isChickenGentlemanNudgeDismissed,
 PAST_PENDING_ROLLCALL_NUDGE_MIN_DAYS,
 shouldShowChickenGentlemanNudge,
} from "@/lib/teacherRollCallNudge"

beforeAll(() => {
 if (typeof localStorage !== "undefined") return
 const store = new Map<string, string>()
 Object.defineProperty(globalThis, "localStorage", {
  value: {
   getItem: (key: string) => store.get(key) ?? null,
   setItem: (key: string, value: string) => {
    store.set(key, value)
   },
   removeItem: (key: string) => {
    store.delete(key)
   },
   clear: () => store.clear(),
  },
  configurable: true,
 })
})

describe("teacherRollCallNudge", () => {
 it("以不重複上課日計算", () => {
  expect(
   countUniqueScheduledDates([
    { scheduledDate: "2026-08-14" },
    { scheduledDate: "2026-08-14" },
    { scheduledDate: "2026-08-13" },
    { scheduledDate: "2026-08-12" },
   ])
  ).toBe(3)
 })

 it("昨天或更早仍有未點名即提醒", () => {
  expect(shouldShowChickenGentlemanNudge(0)).toBe(false)
  expect(shouldShowChickenGentlemanNudge(PAST_PENDING_ROLLCALL_NUDGE_MIN_DAYS)).toBe(true)
  expect(shouldShowChickenGentlemanNudge(2)).toBe(true)
 })

 it("關閉後同一老師當日不再顯示", () => {
  const teacherId = "teacher-nudge-test"
  const today = "2026-08-18"
  dismissChickenGentlemanNudge(teacherId, today)
  expect(isChickenGentlemanNudgeDismissed(teacherId, today)).toBe(true)
  expect(isChickenGentlemanNudgeDismissed(teacherId, "2026-08-19")).toBe(false)
  expect(isChickenGentlemanNudgeDismissed("other-teacher", today)).toBe(false)
 })
})
