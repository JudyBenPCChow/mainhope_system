/**
 * 對指定測試生跑 A1 煙霧（需 LIFECYCLE_A1_SMOKE=1 + SUPABASE_SERVICE_ROLE_KEY）
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

const RUN = process.env.LIFECYCLE_A1_SMOKE === "1"
const STUDENT_CODE = process.env.LIFECYCLE_SMOKE_STUDENT_CODE ?? "20261973"
const MARKER = "__LIFECYCLE_A1_SMOKE__"

vi.mock("@/lib/supabaseClient", () => {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  return {
    isSupabaseConfigured: Boolean(url && key),
    supabase: url && key ? createClient(url, key) : null,
  }
})

vi.mock("@/lib/mgmtRole", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mgmtRole")>("@/lib/mgmtRole")
  return {
    ...actual,
    getMgmtRole: () => "admin" as const,
  }
})

describe.runIf(RUN)("lifecycle orphan A1 smoke (student 20261973)", () => {
  let studentId = ""
  let classId = ""
  let leaveScheduleId = ""
  let makeupScheduleId = ""
  let peerScheduleIds: string[] = []
  let leaveId = ""
  let enrollmentId = ""
  let admin: SupabaseClient
  let leaveQueries: typeof import("@/services/leaveQueries")

  beforeAll(async () => {
    const mod = await import("@/lib/supabaseClient")
    if (!mod.supabase) throw new Error("supabase mock client missing")
    admin = mod.supabase
    leaveQueries = await import("@/services/leaveQueries")

    const { data: student, error: stErr } = await admin
      .from("students")
      .select("id, full_name, student_code")
      .eq("student_code", STUDENT_CODE)
      .maybeSingle()
    if (stErr) throw stErr
    if (!student) throw new Error(`找不到學生 ${STUDENT_CODE}`)
    studentId = student.id
    console.log("student", student.student_code, student.full_name)

    await admin.from("attendance_details").delete().eq("student_id", studentId)
    await admin.from("leave_makeup_records").delete().eq("student_id", studentId)
    await admin
      .from("student_class_enrollments")
      .delete()
      .eq("student_id", studentId)
      .eq("remarks", MARKER)

    await admin.from("students").update({ status: "就讀中" }).eq("id", studentId)

    // 原班報讀（請假班）≠ 補堂宿主班 → 取消請假後補堂出席應可刪
    const { data: leaveHost, error: leaveHostErr } = await admin
      .from("schedules")
      .select("id, class_id, scheduled_date")
      .gte("scheduled_date", "2026-08-01")
      .lte("scheduled_date", "2026-08-10")
      .eq("status", "正常")
      .order("scheduled_date", { ascending: true })
      .limit(1)
      .maybeSingle()
    if (leaveHostErr) throw leaveHostErr
    if (!leaveHost) throw new Error("找不到請假班排程")
    leaveScheduleId = leaveHost.id
    classId = String(leaveHost.class_id)

    const { data: makeupHost, error: hostErr } = await admin
      .from("schedules")
      .select("id, class_id, scheduled_date, consecutive_group_id")
      .gte("scheduled_date", "2026-08-20")
      .lte("scheduled_date", "2026-08-31")
      .not("consecutive_group_id", "is", null)
      .eq("status", "正常")
      .neq("class_id", classId)
      .order("scheduled_date", { ascending: true })
      .limit(1)
      .maybeSingle()
    if (hostErr) throw hostErr
    if (!makeupHost) throw new Error("找不到跨班連堂補堂宿主")
    makeupScheduleId = makeupHost.id
    const makeupClassId = String(makeupHost.class_id)

    const { data: peers, error: peerErr } = await admin
      .from("schedules")
      .select("id")
      .eq("consecutive_group_id", makeupHost.consecutive_group_id)
      .order("consecutive_slot_index", { ascending: true })
    if (peerErr) throw peerErr
    peerScheduleIds = (peers ?? []).map((p) => String(p.id))
    if (peerScheduleIds.length < 1) peerScheduleIds = [makeupScheduleId]

    const { data: enr, error: enrErr } = await admin
      .from("student_class_enrollments")
      .insert({
        student_id: studentId,
        class_id: classId,
        status: "就讀中",
        enroll_date: "2026-07-01",
        remarks: MARKER,
      })
      .select("id")
      .single()
    if (enrErr) throw enrErr
    enrollmentId = enr.id

    const leaveDate = String(leaveHost.scheduled_date).slice(0, 10)
    const makeupDate = String(makeupHost.scheduled_date).slice(0, 10)

    const { data: leave, error: leaveErr } = await admin
      .from("leave_makeup_records")
      .insert({
        student_id: studentId,
        class_id: classId,
        schedule_id: leaveScheduleId,
        leave_date: leaveDate,
        leave_reason: "事假",
        makeup_type: "調堂",
        makeup_date: makeupDate,
        makeup_schedule_id: makeupScheduleId,
        status: "已批核",
        remarks: MARKER,
      })
      .select("id")
      .single()
    if (leaveErr) throw leaveErr
    leaveId = leave.id

    const { error: attErr } = await admin.from("attendance_details").insert(
      peerScheduleIds.map((sid) => ({
        student_id: studentId,
        class_id: makeupClassId,
        schedule_id: sid,
        attendance_date: makeupDate,
        status: "現場",
        remarks: MARKER,
      }))
    )
    if (attErr) throw attErr

    console.log({
      leaveId: leaveId.slice(0, 8),
      leaveClass: classId.slice(0, 8),
      makeupClass: makeupClassId.slice(0, 8),
      makeupDate,
      peers: peerScheduleIds.length,
    })
  }, 120_000)

  afterAll(async () => {
    if (!admin || !studentId) return
    await admin.from("attendance_details").delete().eq("student_id", studentId)
    await admin.from("leave_makeup_records").delete().eq("student_id", studentId)
    if (enrollmentId) {
      await admin.from("student_class_enrollments").delete().eq("id", enrollmentId)
    }
    await admin.from("students").update({ status: "非在讀" }).eq("id", studentId)
  }, 60_000)

  it("掃描可刪列＝連堂 peers 出席", async () => {
    const hits = await leaveQueries.previewLeaveMakeupAttendanceImpact(leaveId, {
      forDelete: true,
    })
    expect(hits.length).toBe(peerScheduleIds.length)
    expect(hits.every((h) => h.status === "現場")).toBe(true)
  }, 60_000)

  it("一併刪：出席刪光、請假刪掉", async () => {
    const hits = await leaveQueries.previewLeaveMakeupAttendanceImpact(leaveId, {
      forDelete: true,
    })
    await leaveQueries.deleteLeaveMakeupRecord(leaveId, {
      attendanceAction: "delete",
      deleteAttendanceIds: hits.map((h) => h.id),
    })

    const { data: att } = await admin
      .from("attendance_details")
      .select("id")
      .eq("student_id", studentId)
    expect(att ?? []).toEqual([])

    const { data: leave } = await admin
      .from("leave_makeup_records")
      .select("id")
      .eq("id", leaveId)
    expect(leave ?? []).toEqual([])
  }, 60_000)
})

describe.runIf(!RUN)("lifecycle orphan A1 smoke (skipped)", () => {
  it("set LIFECYCLE_A1_SMOKE=1 and SUPABASE_SERVICE_ROLE_KEY to run", () => {
    expect(true).toBe(true)
  })
})
