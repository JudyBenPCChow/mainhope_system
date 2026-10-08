import { beforeEach, describe, expect, it, vi } from "vitest"

const rpc = vi.fn()

vi.mock("@/lib/supabaseClient", () => ({
 supabase: { rpc },
}))

describe("applyEntitlementConsumptionDelta", () => {
 beforeEach(() => {
  rpc.mockReset()
  rpc.mockResolvedValue({ data: null, error: null })
 })

 it("把扣堂交給系統函式，不在瀏覽器改池", async () => {
  const { applyEntitlementConsumptionDelta } = await import("./entitlementQueries")
  await applyEntitlementConsumptionDelta({
   studentId: "student-1",
   scheduleId: "sched-1",
   classId: "class-1",
   attendanceDetailId: "att-1",
   previousStatus: null,
   nextStatus: "現場",
  })
  expect(rpc).toHaveBeenCalledWith("apply_attendance_entitlement_delta", {
   p_student_id: "student-1",
   p_schedule_id: "sched-1",
   p_class_id: "class-1",
   p_attendance_detail_id: "att-1",
   p_previous_status: null,
   p_next_status: "現場",
   p_lesson_units: 1,
  })
 })

 it("函式失敗時拋錯給呼叫端", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "NOT_AUTHORIZED" } })
  const { applyEntitlementConsumptionDelta } = await import("./entitlementQueries")
  await expect(
   applyEntitlementConsumptionDelta({
    studentId: "student-1",
    scheduleId: "sched-1",
    classId: "class-1",
    previousStatus: null,
    nextStatus: "現場",
   })
  ).rejects.toMatchObject({ message: "NOT_AUTHORIZED" })
 })
})
