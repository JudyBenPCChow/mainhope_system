import { describe, expect, it } from "vitest"

import {
 buildRollCallScheduleEntries,
 type ScheduleRollCallSource,
} from "@/lib/consecutiveLesson"

function source(
 overrides: Partial<ScheduleRollCallSource> & Pick<ScheduleRollCallSource, "id">,
): ScheduleRollCallSource {
 return {
  scheduled_date: "2026-10-10",
  start_time: "15:15:00",
  end_time: "16:30:00",
  class_id: "class-1",
  classLabel: "中一英文",
  course_code_full: "ENG-S1-SAT",
  teacher_name: "陳老師",
  session_number: 3,
  consecutive_group_id: null,
  consecutive_slot_index: null,
  ...overrides,
 }
}

describe("buildRollCallScheduleEntries", () => {
 it("同一 group id 的兩列合成一項，scheduleIds 含兩節，end_time 取排序後最後一節", () => {
  const entries = buildRollCallScheduleEntries([
   source({
    id: "slot-2",
    start_time: "16:30:00",
    end_time: "17:00:00",
    session_number: 4,
    consecutive_group_id: "group-a",
    consecutive_slot_index: 2,
   }),
   source({
    id: "slot-1",
    start_time: "15:15:00",
    end_time: "18:00:00",
    session_number: 3,
    consecutive_group_id: "group-a",
    consecutive_slot_index: 1,
   }),
  ])

  expect(entries).toHaveLength(1)
  expect(entries[0]?.key).toBe("group-a")
  expect(entries[0]?.scheduleIds).toEqual(["slot-1", "slot-2"])
  expect(entries[0]?.start_time).toBe("15:15:00")
  expect(entries[0]?.end_time).toBe("17:00:00")
  expect(entries[0]?.isConsecutive).toBe(true)
  expect(entries[0]?.slotDetails.map((slot) => slot.id)).toEqual(["slot-1", "slot-2"])
 })

 it("沒有 group id 的單列保持獨立，不與另一列合併", () => {
  const entries = buildRollCallScheduleEntries([
   source({
    id: "solo-1",
    consecutive_group_id: null,
    start_time: "15:15:00",
    end_time: "16:30:00",
   }),
   source({
    id: "solo-2",
    consecutive_group_id: null,
    start_time: "16:30:00",
    end_time: "17:45:00",
    session_number: 4,
   }),
   source({
    id: "grouped-1",
    consecutive_group_id: "group-a",
    consecutive_slot_index: 1,
    start_time: "09:00:00",
    end_time: "10:15:00",
   }),
   source({
    id: "grouped-2",
    consecutive_group_id: "group-a",
    consecutive_slot_index: 2,
    start_time: "10:15:00",
    end_time: "11:30:00",
   }),
  ])

  const byKey = new Map(entries.map((entry) => [entry.key, entry]))
  expect(byKey.get("solo-1")?.scheduleIds).toEqual(["solo-1"])
  expect(byKey.get("solo-1")?.end_time).toBe("16:30:00")
  expect(byKey.get("solo-1")?.isConsecutive).toBe(false)
  expect(byKey.get("solo-2")?.scheduleIds).toEqual(["solo-2"])
  expect(byKey.get("solo-2")?.end_time).toBe("17:45:00")
  expect(byKey.get("solo-2")?.isConsecutive).toBe(false)
  expect(byKey.get("group-a")?.scheduleIds).toEqual(["grouped-1", "grouped-2"])
  expect(entries).toHaveLength(3)
 })

 it("兩個不同 group id 不會合成一項", () => {
  const entries = buildRollCallScheduleEntries([
   source({
    id: "a-2",
    consecutive_group_id: "group-a",
    consecutive_slot_index: 2,
    start_time: "16:30:00",
    end_time: "17:45:00",
   }),
   source({
    id: "b-1",
    consecutive_group_id: "group-b",
    consecutive_slot_index: 1,
    start_time: "09:00:00",
    end_time: "10:15:00",
    class_id: "class-2",
    classLabel: "中二數學",
   }),
   source({
    id: "a-1",
    consecutive_group_id: "group-a",
    consecutive_slot_index: 1,
    start_time: "15:15:00",
    end_time: "16:30:00",
   }),
   source({
    id: "b-2",
    consecutive_group_id: "group-b",
    consecutive_slot_index: 2,
    start_time: "10:15:00",
    end_time: "11:30:00",
    class_id: "class-2",
    classLabel: "中二數學",
   }),
  ])

  expect(entries).toHaveLength(2)
  const byKey = new Map(entries.map((entry) => [entry.key, entry]))
  expect(byKey.get("group-a")?.scheduleIds).toEqual(["a-1", "a-2"])
  expect(byKey.get("group-a")?.end_time).toBe("17:45:00")
  expect(byKey.get("group-b")?.scheduleIds).toEqual(["b-1", "b-2"])
  expect(byKey.get("group-b")?.start_time).toBe("09:00:00")
  expect(byKey.get("group-b")?.end_time).toBe("11:30:00")
 })

 it("沒有 class_id 的列略過", () => {
  const entries = buildRollCallScheduleEntries([
   source({ id: "kept", class_id: "class-1" }),
   source({ id: "dropped-single", class_id: null }),
   source({
    id: "dropped-head",
    class_id: null,
    consecutive_group_id: "group-empty",
    consecutive_slot_index: 1,
   }),
   source({
    id: "dropped-tail",
    class_id: "class-9",
    consecutive_group_id: "group-empty",
    consecutive_slot_index: 2,
    end_time: "17:45:00",
   }),
  ])

  expect(entries.map((entry) => entry.scheduleIds)).toEqual([["kept"]])
 })
})
