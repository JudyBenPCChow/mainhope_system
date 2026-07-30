/**
 * 生命週期孤兒：出席掃描／稽核刪除／資格標註。
 * 方案見 docs/plans/2026-07-31-lifecycle-orphans.md
 */
import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { isAdmin } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import {
 activeTrialsForSchedules,
 enrollmentsForSchedules,
 fetchScheduleRosterContext,
 makeupsForSchedules,
} from "@/services/scheduleRosterQueries"

export type AttendanceLifecycleHit = {
 id: string
 studentId: string
 classId: string
 scheduleId: string | null
 attendanceDate: string
 status: string
 studentName?: string | null
}

function mapHit(r: Record<string, unknown>): AttendanceLifecycleHit {
 const st = r.students as Record<string, unknown> | null
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  classId: String(r.class_id),
  scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
  attendanceDate: String(r.attendance_date ?? "").slice(0, 10),
  status: String(r.status ?? ""),
  studentName: st?.full_name != null ? String(st.full_name) : null,
 }
}

/** 學生在指定 schedule_id 上的出席列（補堂宿主／試堂堂次掃描） */
export async function fetchAttendanceHitsForStudentSchedules(
 studentId: string,
 scheduleIds: string[]
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase || !studentId || scheduleIds.length === 0) return []
 const uniq = [...new Set(scheduleIds.filter(Boolean))]
 const out: AttendanceLifecycleHit[] = []
 await forEachIdChunk(uniq, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("attendance_details")
   .select("id, student_id, class_id, schedule_id, attendance_date, status, students ( full_name )")
   .eq("student_id", studentId)
   .in("schedule_id", chunk)
  if (error) throw error
  for (const row of data ?? []) out.push(mapHit(row as Record<string, unknown>))
 })
 return out
}

/** 某排程上所有出席（軟取消掃描） */
export async function fetchAttendanceHitsForSchedule(
 scheduleId: string
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase || !scheduleId) return []
 const { data, error } = await supabase
  .from("attendance_details")
  .select("id, student_id, class_id, schedule_id, attendance_date, status, students ( full_name )")
  .eq("schedule_id", scheduleId)
 if (error) throw error
 return (data ?? []).map((row) => mapHit(row as Record<string, unknown>))
}

export function formatAttendanceHitsDescription(hits: AttendanceLifecycleHit[]): string {
 if (hits.length === 0) return ""
 const lines = hits.map((h) => {
  const name = h.studentName ? `${h.studentName} · ` : ""
  return `・${name}${h.attendanceDate} · ${h.status}`
 })
 return `以下 ${hits.length} 筆出席將失去應到資格（若保留，已上堂數仍會計入）：\n${lines.join("\n")}`
}

/** 硬刪出席列並寫稽核；reason 例如 leave_cancel / admin_manual / schedule_cancel */
export async function deleteAttendanceHitsWithAudit(
 hits: AttendanceLifecycleHit[],
 reason: string
): Promise<void> {
 if (!supabase || hits.length === 0) return
 for (const hit of hits) {
  assertAcademicYearEditableForDate(hit.attendanceDate)
  const { error } = await supabase.from("attendance_details").delete().eq("id", hit.id)
  if (error) throw error
  void logMgmtAuditAction({
   action: "刪除出席紀錄",
   detail: [
    `reason=${reason}`,
    `attendance_id=${hit.id}`,
    `student_id=${hit.studentId}`,
    `class_id=${hit.classId}`,
    `schedule_id=${hit.scheduleId ?? ""}`,
    `date=${hit.attendanceDate}`,
    `status=${hit.status}`,
   ].join("; "),
  })
 }
}

/** 僅 admin：單列刪（O2） */
export async function deleteAttendanceDetailAsAdmin(
 hit: AttendanceLifecycleHit,
 reason = "admin_manual"
): Promise<void> {
 if (!isAdmin()) throw new Error("僅管理員可刪除單列出席紀錄")
 await deleteAttendanceHitsWithAudit([hit], reason)
}

export type AttendanceEligibilityFlag = "ok" | "ended"

/**
 * O0：對照當前名冊（報讀∪試堂∪補堂）。無 schedule_id 的脫鉤列標 ended。
 */
export async function flagAttendanceEligibility(
 rows: Array<{ id: string; studentId: string; scheduleId: string | null }>
): Promise<Map<string, AttendanceEligibilityFlag>> {
 const result = new Map<string, AttendanceEligibilityFlag>()
 for (const r of rows) {
  if (!r.scheduleId) {
   result.set(r.id, "ended")
   continue
  }
  result.set(r.id, "ok")
 }
 const scheduleIds = [...new Set(rows.map((r) => r.scheduleId).filter((id): id is string => Boolean(id)))]
 if (scheduleIds.length === 0 || !supabase) return result

 const ctx = await fetchScheduleRosterContext(scheduleIds)
 const eligible = new Map<string, Set<string>>()
 for (const sid of scheduleIds) {
  const set = new Set<string>()
  for (const e of enrollmentsForSchedules(ctx, [sid])) set.add(e.studentId)
  for (const t of activeTrialsForSchedules(ctx, [sid])) set.add(t.studentId)
  for (const m of makeupsForSchedules(ctx, [sid])) set.add(m.studentId)
  eligible.set(sid, set)
 }
 for (const r of rows) {
  if (!r.scheduleId) continue
  const set = eligible.get(r.scheduleId)
  result.set(r.id, set?.has(r.studentId) ? "ok" : "ended")
 }
 return result
}

/** O4：某生在某班的全部出席（退讀／清報讀掃描） */
export async function fetchAttendanceHitsForStudentClass(
 studentId: string,
 classId: string
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase || !studentId || !classId) return []
 const { data, error } = await supabase
  .from("attendance_details")
  .select("id, student_id, class_id, schedule_id, attendance_date, status, students ( full_name )")
  .eq("student_id", studentId)
  .eq("class_id", classId)
  .order("attendance_date", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => mapHit(row as Record<string, unknown>))
}
export async function fetchAttendanceOrphansInRange(
 fromYmd: string,
 toYmd: string
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("attendance_details")
  .select("id, student_id, class_id, schedule_id, attendance_date, status, students ( full_name )")
  .gte("attendance_date", fromYmd)
  .lte("attendance_date", toYmd)
  .order("attendance_date", { ascending: false })
 if (error) throw error
 const mapped = (data ?? []).map((row) => mapHit(row as Record<string, unknown>))
 const flags = await flagAttendanceEligibility(
  mapped.map((m) => ({ id: m.id, studentId: m.studentId, scheduleId: m.scheduleId }))
 )
 return mapped.filter((m) => flags.get(m.id) === "ended")
}
