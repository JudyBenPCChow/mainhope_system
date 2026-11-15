import { beforeEach, describe, expect, it, vi } from "vitest"

const rpc = vi.fn()
const maybeSingle = vi.fn()

function paymentsFrom() {
 return {
  select: () => ({
   eq: () => ({ maybeSingle }),
  }),
 }
}

function detailsFrom() {
 return {
  select: () => ({
   eq: () => Promise.resolve({ data: [], error: null }),
  }),
 }
}

vi.mock("@/lib/supabaseClient", () => ({
 supabase: {
  rpc,
  from: (table: string) => {
   if (table === "payments") return paymentsFrom()
   if (table === "payment_details") return detailsFrom()
   const row = {
    id: "pool-1",
    student_id: "stu-1",
    class_id: "class-1",
    package_type: "regular_full",
    remaining_lessons: 3,
    initial_lessons: 8,
    source_enrollment_id: null,
    course_group: "group_specialist",
    namespace_key: "S4",
    classes: null,
   }
   const q: Record<string, unknown> = {}
   const self = () => q
   q.select = self
   q.eq = self
   q.in = self
   q.order = self
   q.maybeSingle = () => Promise.resolve({ data: row, error: null })
   q.then = (
    onFulfilled: (v: { data: unknown; error: null }) => unknown,
    onRejected?: (e: unknown) => unknown
   ) => Promise.resolve({ data: [row], error: null }).then(onFulfilled, onRejected)
   return q
  },
 },
}))

vi.mock("@/lib/academicYearSoftGuard", () => ({
 academicYearLabelsForPaymentGuard: () => [],
 noteNonCurrentAcademicYearWrite: vi.fn(),
}))

describe("entitlement ledger commands", () => {
 beforeEach(() => {
  rpc.mockReset()
  maybeSingle.mockReset()
  rpc.mockResolvedValue({ data: { ok: true }, error: null })
  maybeSingle.mockResolvedValue({
   data: { payment_date: "2026-11-16", status: "待收款", student_id: "stu-1" },
   error: null,
  })
 })

 it("確認收款只呼叫 command", async () => {
  const { markPaymentReceived } = await import("./paymentQueries")
  await markPaymentReceived("pay-1", { paymentMethod: "現金" })
  expect(rpc).toHaveBeenCalledWith("mark_payment_received_command", {
   p_payment_id: "pay-1",
   p_payment_method: "現金",
  })
 })

 it("單池調動只送差額", async () => {
  const { adjustEntitlementPool } = await import("./entitlementAdjustmentQueries")
  await adjustEntitlementPool({
   poolId: "pool-1",
   deltaLessons: -2,
   reasonCode: "g2a_lesson_count_fix",
   notes: "收據多填兩堂",
  })
  expect(rpc).toHaveBeenCalledWith("adjust_entitlement_pool", {
   p_pool_id: "pool-1",
   p_delta_lessons: -2,
   p_reason_code: "g2a_lesson_count_fix",
   p_notes: "收據多填兩堂",
   p_related_payment_id: undefined,
  })
 })
})
