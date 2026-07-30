#!/usr/bin/env node
/**
 * 生命週期孤兒 A1 煙霧測試（只建立／刪除帶標記的測試學生，不碰真學生）
 *
 * 執行：node scripts/lifecycle-orphan-a1-smoke.mjs
 *
 * 標記：remarks / full_name 含 __LIFECYCLE_A1_SMOKE__
 * 失敗時仍會盡力清掉本腳本建立的 student（cascade 清 leave／attendance）
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

const MARKER = "__LIFECYCLE_A1_SMOKE__"
const TEST_NAME = `【測試】生命週期孤兒 ${MARKER}`

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8")
  const get = (k) =>
    (raw.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]
      ?.trim()
      .replace(/^["']|["']$/g, "")
  return {
    url: get("VITE_SUPABASE_URL") || get("SUPABASE_URL") || "",
    key:
      get("SUPABASE_SERVICE_ROLE_KEY") ||
      get("VITE_SUPABASE_ANON_KEY") ||
      get("SUPABASE_ANON_KEY") ||
      "",
    usingServiceRole: Boolean(get("SUPABASE_SERVICE_ROLE_KEY")),
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function expandPeers(supabase, scheduleId) {
  const { data: row, error } = await supabase
    .from("schedules")
    .select("id, consecutive_group_id")
    .eq("id", scheduleId)
    .maybeSingle()
  if (error) throw error
  const gid = row?.consecutive_group_id
  if (!gid) return [scheduleId]
  const { data, error: e2 } = await supabase
    .from("schedules")
    .select("id")
    .eq("consecutive_group_id", gid)
    .order("consecutive_slot_index", { ascending: true })
  if (e2) throw e2
  const ids = (data ?? []).map((r) => String(r.id))
  return ids.length > 0 ? ids : [scheduleId]
}

async function nextStudentCode(supabase) {
  const { data, error } = await supabase.from("students").select("student_code")
  if (error) throw error
  let max = 0
  for (const r of data ?? []) {
    const c = String(r.student_code ?? "").trim()
    if (/^\d+$/.test(c)) max = Math.max(max, Number(c))
  }
  return String(max + 1).padStart(8, "0")
}

async function cleanupByStudentId(supabase, studentId, label) {
  if (!studentId) return
  // 先刪下游（即使 cascade 也明示），再刪學生
  await supabase.from("attendance_details").delete().eq("student_id", studentId)
  await supabase.from("leave_makeup_records").delete().eq("student_id", studentId)
  const { error } = await supabase.from("students").delete().eq("id", studentId)
  if (error) console.error(`[cleanup ${label}]`, error.message)
  else console.log(`[cleanup ${label}] student ${studentId.slice(0, 8)}… removed`)
}

async function main() {
  const { url, key, usingServiceRole } = loadEnv()
  assert(url && key, "缺少 VITE_SUPABASE_URL 與 anon／service role key")
  const supabase = createClient(url, key)
  console.log("host:", new URL(url).host)
  console.log("auth:", usingServiceRole ? "service_role" : "anon")
  console.log("marker:", MARKER)
  if (!usingServiceRole) {
    console.warn(
      "提示：anon 若遇 permission denied，請暫時在 .env 加 SUPABASE_SERVICE_ROLE_KEY 再跑（測完刪掉）。"
    )
  }

  // 清掉上次殘留測試生
  const { data: leftovers } = await supabase
    .from("students")
    .select("id, full_name")
    .ilike("full_name", `%${MARKER}%`)
  for (const row of leftovers ?? []) {
    console.log("removing leftover", row.full_name)
    await cleanupByStudentId(supabase, row.id, "leftover")
  }

  // 找暑期／近期可編排程（優先連堂）
  const { data: schedules, error: schedErr } = await supabase
    .from("schedules")
    .select(
      "id, class_id, scheduled_date, start_time, consecutive_group_id, consecutive_slot_index, status"
    )
    .gte("scheduled_date", "2026-07-01")
    .lte("scheduled_date", "2026-08-31")
    .not("class_id", "is", null)
    .order("scheduled_date", { ascending: false })
    .limit(80)
  if (schedErr) throw schedErr
  assert((schedules ?? []).length > 0, "找不到 2026-07～08 排程作宿主")

  const withGroup = (schedules ?? []).filter(
    (s) => s.consecutive_group_id && String(s.status ?? "") !== "取消"
  )
  const host = withGroup[0] ?? (schedules ?? []).find((s) => String(s.status ?? "") !== "取消")
  assert(host, "找不到未取消排程")
  const peers = await expandPeers(supabase, host.id)
  console.log("host schedule", {
    id: host.id.slice(0, 8),
    date: host.scheduled_date,
    class_id: String(host.class_id).slice(0, 8),
    peers: peers.length,
    year: "(n/a)",
  })

  let studentId = null
  try {
    const code = await nextStudentCode(supabase)
    const { data: student, error: stErr } = await supabase
      .from("students")
      .insert({
        student_code: code,
        full_name: TEST_NAME,
        grade: "測試",
        status: "就讀中",
        remarks: MARKER,
      })
      .select("id, student_code")
      .single()
    if (stErr) throw stErr
    studentId = student.id
    console.log("created test student", student.student_code, studentId.slice(0, 8))

    const leaveDate = String(host.scheduled_date).slice(0, 10)
    const { data: leave, error: leaveErr } = await supabase
      .from("leave_makeup_records")
      .insert({
        student_id: studentId,
        class_id: host.class_id,
        leave_date: leaveDate,
        leave_reason: "事假",
        makeup_type: "調堂",
        makeup_date: leaveDate,
        makeup_schedule_id: host.id,
        status: "已批核",
        remarks: MARKER,
      })
      .select("id, makeup_schedule_id")
      .single()
    if (leaveErr) throw leaveErr
    console.log("created leave", leave.id.slice(0, 8))

    const attRows = peers.map((sid) => ({
      student_id: studentId,
      class_id: host.class_id,
      schedule_id: sid,
      attendance_date: leaveDate,
      status: "現場",
      remarks: MARKER,
    }))
    const { data: atts, error: attErr } = await supabase
      .from("attendance_details")
      .insert(attRows)
      .select("id, schedule_id, status, updated_at, attendance_date")
    if (attErr) throw attErr
    console.log("created attendance rows", atts.length)

    // —— 模擬 A1 掃描：候選＝peers 出席；無 enrollment／otherMakeup → 全可刪
    const { data: candidates, error: candErr } = await supabase
      .from("attendance_details")
      .select("id, schedule_id, status, updated_at, attendance_date")
      .eq("student_id", studentId)
      .in("schedule_id", peers)
    if (candErr) throw candErr
    assert(candidates.length === peers.length, `候選列應＝peers（${peers.length}），得 ${candidates.length}`)

    // 確認測試生不在該堂報讀（不應誤刪真報讀；此生本來無報讀）
    const { data: enrolls } = await supabase
      .from("student_class_enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("class_id", host.class_id)
    assert((enrolls ?? []).length === 0, "測試生不應已有報讀")

    // —— 模擬一併刪：audit（可失敗只 warn）→ delete att → delete leave
    const { error: auditErr } = await supabase.from("mgmt_audit_log").insert({
      actor_label: "A1 smoke script",
      role: "admin",
      action: "刪除出席紀錄（生命週期）",
      path: "/scripts/lifecycle-orphan-a1-smoke",
      detail: `reason=leave_cancel_smoke; student=${studentId}; count=${candidates.length}`,
    })
    if (auditErr) console.warn("audit insert:", auditErr.message)

    for (const hit of candidates) {
      let q = supabase
        .from("attendance_details")
        .delete()
        .eq("id", hit.id)
        .eq("status", hit.status)
      if (hit.updated_at != null) q = q.eq("updated_at", hit.updated_at)
      const { error } = await q
      if (error) throw error
    }

    const { data: afterAtt } = await supabase
      .from("attendance_details")
      .select("id")
      .eq("student_id", studentId)
    assert((afterAtt ?? []).length === 0, "一併刪後出席應為 0")

    const { error: delLeaveErr } = await supabase
      .from("leave_makeup_records")
      .delete()
      .eq("id", leave.id)
    if (delLeaveErr) throw delLeaveErr

    const { data: afterLeave } = await supabase
      .from("leave_makeup_records")
      .select("id")
      .eq("id", leave.id)
    assert((afterLeave ?? []).length === 0, "請假應已刪")

    console.log("\nPASS: A1 林藝涵型（取消已點名補堂＋一併刪）在測試生上成功")
    console.log(`  peers=${peers.length}, deleted_attendance=${candidates.length}`)
  } finally {
    await cleanupByStudentId(supabase, studentId, "finally")
  }
}

main().catch((e) => {
  console.error("\nFAIL:", e.message || e)
  process.exit(1)
})
