import { describe, expect, it } from "vitest"

import {
 planOneClickRoomAssign,
 type OneClickAssignRow,
} from "@/lib/scheduleDayView"

function row(partial: Partial<OneClickAssignRow> & Pick<OneClickAssignRow, "id">): OneClickAssignRow {
 return {
  classroom_id: null,
  start_time: "15:15",
  end_time: "16:30",
  status: "正常",
  ...partial,
 }
}

describe("planOneClickRoomAssign", () => {
 const rooms = new Set(["room-a", "room-b"])

 it("clears idle schedules that occupy a room", () => {
  const plan = planOneClickRoomAssign({
   dayRows: [
    row({ id: "idle-in-room", classroom_id: "room-a", start_time: "15:15" }),
    row({ id: "busy-unassigned", classroom_id: null, start_time: "15:15" }),
   ],
   activeRoomIds: rooms,
   idleScheduleIds: new Set(["idle-in-room"]),
   isLocked: () => false,
   isOccupancy: () => false,
  })
  expect(plan.clearClassroomIds).toEqual(["idle-in-room"])
  expect(plan.assignCandidateIds).toEqual(["busy-unassigned"])
 })

 it("does not assign idle unassigned schedules", () => {
  const plan = planOneClickRoomAssign({
   dayRows: [row({ id: "idle-free", classroom_id: null })],
   activeRoomIds: rooms,
   idleScheduleIds: new Set(["idle-free"]),
   isLocked: () => false,
   isOccupancy: () => false,
  })
  expect(plan.clearClassroomIds).toEqual([])
  expect(plan.assignCandidateIds).toEqual([])
 })

 it("skips cancelled, occupancy, locked, and already-assigned active classes", () => {
  const plan = planOneClickRoomAssign({
   dayRows: [
    row({ id: "cancelled", status: "取消", classroom_id: "room-a" }),
    row({ id: "occupancy", classroom_id: "room-a" }),
    row({ id: "locked", classroom_id: null }),
    row({ id: "already", classroom_id: "room-b", start_time: "16:30" }),
    row({ id: "need-room", classroom_id: null, start_time: "17:45" }),
   ],
   activeRoomIds: rooms,
   idleScheduleIds: new Set(["cancelled"]),
   isLocked: (s) => s.id === "locked",
   isOccupancy: (s) => s.id === "occupancy",
  })
  expect(plan.clearClassroomIds).toEqual([])
  expect(plan.assignCandidateIds).toEqual(["need-room"])
 })

 it("orders assign candidates by start time", () => {
  const plan = planOneClickRoomAssign({
   dayRows: [
    row({ id: "later", classroom_id: null, start_time: "17:45" }),
    row({ id: "earlier", classroom_id: null, start_time: "15:15" }),
   ],
   activeRoomIds: rooms,
   idleScheduleIds: new Set(),
   isLocked: () => false,
   isOccupancy: () => false,
  })
  expect(plan.assignCandidateIds).toEqual(["earlier", "later"])
 })

 it("treats inactive-room classroom_id as unassigned", () => {
  const plan = planOneClickRoomAssign({
   dayRows: [row({ id: "stale-room", classroom_id: "closed-room", start_time: "15:15" })],
   activeRoomIds: rooms,
   idleScheduleIds: new Set(),
   isLocked: () => false,
   isOccupancy: () => false,
  })
  expect(plan.clearClassroomIds).toEqual([])
  expect(plan.assignCandidateIds).toEqual(["stale-room"])
 })
})
