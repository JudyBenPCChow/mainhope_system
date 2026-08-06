/**
 * O3：軟取消排程 — 清掛住調堂、閘開著試堂／已有出席。
 * 見 docs/plans/2026-07-31-lifecycle-orphans.md 階段 B。
 */
import { supabase } from "@/lib/supabaseClient"
import {
 deleteAttendanceHitsWithAuditOrThrow,
 fetchAttendanceHitsForSchedules,
 formatAttendanceHitsDescription,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import { voidActiveDeclarationsForSchedules } from "@/services/entitlementQueries"

export type SoftCancelScheduleOptions = {
 cancel_reason?: string | null
 /** 有未結案試堂時必填 true：一併改為取消 */
 cancelOpenTrials?: boolean
 /** 此堂已有出席時必填 */
 attendanceAction?: "delete" | "keep"
 deleteAttendanceIds?: string[]
}

export type SoftCancelMakeupLeave = {
 id: string
 studentId: string
 studentName: string | null
}

export type SoftCancelOpenTrial = {
 id: string
 studentId: string
 studentName: string | null
}

export type SoftCancelScheduleImpact = {
 scheduleIds: string[]
 makeupLeaves: SoftCancelMakeupLeave[]
 openTrials: SoftCancelOpenTrial[]
 attendanceHits: AttendanceLifecycleHit[]
}

function isTrialOpen(status: string | null | undefined): boolean {
 const s = String(status ?? "")
 return !s.includes("完成") && !s.includes("取消")
}

export function formatSoftCancelImpactSummary(impact: SoftCancelScheduleImpact): string {
 const parts: string[] = []
 if (impact.makeupLeaves.length > 0) {
  parts.push(`將把 ${impact.makeupLeaves.length} 筆調堂改回「待安排」`)
 }
 if (impact.openTrials.length > 0) {
  const names = impact.openTrials.map((t) => t.studentName ?? "學生").join("、")
  parts.push(`有 ${impact.openTrials.length} 筆未結案試堂（${names}）會一併取消`)
 }
 if (impact.attendanceHits.length > 0) {
  parts.push(formatAttendanceHitsDescription(impact.attendanceHits))
 }
 return parts.join("\n\n")
}

/** 掃描：掛此排程嘅調堂、未結案試堂、出席列 */
export async function previewSoftCancelScheduleImpact(
 scheduleIds: string[]
): Promise<SoftCancelScheduleImpact> {
 const ids = [...new Set(scheduleIds.filter(Boolean))]
 if (!supabase || ids.length === 0) {
  return { scheduleIds: ids, makeupLeaves: [], openTrials: [], attendanceHits: [] }
 }

 const [{ data: leaves, error: leaveErr }, { data: trials, error: trialErr }, attendanceHits] =
  await Promise.all([
   supabase
    .from("leave_makeup_records")
    .select("id, student_id, status, students ( full_name )")
    .in("makeup_schedule_id", ids),
   supabase
    .from("trial_sessions")
    .select("id, student_id, status, students ( full_name )")
    .in("schedule_id", ids),
   fetchAttendanceHitsForSchedules(ids),
  ])
 if (leaveErr) throw leaveErr
 if (trialErr) throw trialErr

 const makeupLeaves: SoftCancelMakeupLeave[] = []
 for (const row of leaves ?? []) {
  const r = row as Record<string, unknown>
  if (String(r.status ?? "").includes("放棄")) continue
  const st = r.students as Record<string, unknown> | null
  makeupLeaves.push({
   id: String(r.id),
   studentId: String(r.student_id),
   studentName: st?.full_name != null ? String(st.full_name) : null,
  })
 }

 const openTrials: SoftCancelOpenTrial[] = []
 for (const row of trials ?? []) {
  const r = row as Record<string, unknown>
  if (!isTrialOpen(r.status != null ? String(r.status) : "")) continue
  const st = r.students as Record<string, unknown> | null
  openTrials.push({
   id: String(r.id),
   studentId: String(r.student_id),
   studentName: st?.full_name != null ? String(st.full_name) : null,
  })
 }

 return { scheduleIds: ids, makeupLeaves, openTrials, attendanceHits }
}

function formatSoftCancelGateError(impact: SoftCancelScheduleImpact): string {
 if (impact.openTrials.length > 0) {
  return (
   `此排程有 ${impact.openTrials.length} 筆未結案試堂。` +
   `請確認後一併取消試堂再取消排程。`
  )
 }
 if (impact.attendanceHits.length > 0) {
  return (
   `此排程有 ${impact.attendanceHits.length} 筆出席紀錄。` +
   `請確認保留或一併刪除出席後再取消排程。`
  )
 }
 return "取消排程前請先確認生命週期影響"
}

/**
 * 軟取消副作用（唔改 schedules.status；由 updateSchedule／bulk 呼叫）。
 * 序：閘門 → 刪出席（若選）→ 取消試堂 → 調堂改待安排 → void 宣告。
 */
export async function applySoftCancelScheduleSideEffects(
 scheduleIds: string[],
 options?: SoftCancelScheduleOptions
): Promise<SoftCancelScheduleImpact> {
 if (!supabase) throw new Error("Supabase 未設定")
 const impact = await previewSoftCancelScheduleImpact(scheduleIds)
 if (impact.scheduleIds.length === 0) return impact

 if (impact.openTrials.length > 0 && options?.cancelOpenTrials !== true) {
  throw new Error(formatSoftCancelGateError(impact))
 }

 if (impact.attendanceHits.length > 0) {
  const action = options?.attendanceAction
  if (action !== "delete" && action !== "keep") {
   throw new Error(formatSoftCancelGateError(impact))
  }
  if (action === "delete") {
   const allow = new Set((options?.deleteAttendanceIds ?? []).filter(Boolean))
   const toDelete = impact.attendanceHits.filter((h) => allow.has(h.id))
   if (toDelete.length === 0) {
    throw new Error(formatSoftCancelGateError(impact))
   }
   await deleteAttendanceHitsWithAuditOrThrow(toDelete, "schedule_soft_cancel")
  }
 }

 if (impact.openTrials.length > 0) {
  const now = new Date().toISOString()
  for (const t of impact.openTrials) {
   const { error } = await supabase
    .from("trial_sessions")
    .update({ status: "取消", updated_at: now })
    .eq("id", t.id)
   if (error) throw error
  }
 }

 if (impact.makeupLeaves.length > 0) {
  const now = new Date().toISOString()
  for (const leave of impact.makeupLeaves) {
   const { error } = await supabase
    .from("leave_makeup_records")
    .update({
     makeup_type: "待安排",
     makeup_schedule_id: null,
     makeup_date: null,
     updated_at: now,
    })
    .eq("id", leave.id)
   if (error) throw error
  }
 }

 // Wave 2：取消原堂 → active 宣告 void；不扣池
 await voidActiveDeclarationsForSchedules(impact.scheduleIds)

 return impact
}
