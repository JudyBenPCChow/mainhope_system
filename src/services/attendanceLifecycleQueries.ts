/**
 * 生命週期孤兒 A1：出席掃描／eligibility／稽核刪除。
 * 方案見 docs/product/plans/2026-07-31-lifecycle-orphans.md
 */
import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import {
 enrollmentVisibleOnSchedule,
 isSingleSessionEnrollment,
 normalizeEnrollmentPeriod,
} from "@/lib/enrollmentPeriod"
import { usesEntitlementRosterModel } from "@/lib/rosterEligibilityGate"
import { isAdminOrAlien } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { fetchConsecutiveScheduleIds } from "@/services/classQueries"
import { fetchActiveDeclarationsForSchedules } from "@/services/entitlementQueries"
import { logMgmtAuditActionOrThrow } from "@/services/mgmtGodViewQueries"
import { fetchEnrolledScheduleIdsByEnrollmentIds } from "@/services/enrollmentSessionQueries"

export type AttendanceLifecycleHit = {
 id: string
 studentId: string
 classId: string
 scheduleId: string | null
 attendanceDate: string
 status: string
 /** DB 回傳原字串；樂觀鎖用，禁 JS 重 format */
 updatedAt: string | null
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
  updatedAt: r.updated_at != null ? String(r.updated_at) : null,
  studentName: st?.full_name != null ? String(st.full_name) : null,
 }
}

/** 展開連堂 peers（含自身） */
export async function expandScheduleIdsWithPeers(scheduleIds: string[]): Promise<string[]> {
 const out = new Set<string>()
 for (const id of [...new Set(scheduleIds.filter(Boolean))]) {
  for (const peer of await fetchConsecutiveScheduleIds(id)) out.add(peer)
 }
 return [...out]
}

 /** 學生在指定 schedule_id 上的出席列 */
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
   .select(
    "id, student_id, class_id, schedule_id, attendance_date, status, updated_at, students ( full_name )"
   )
   .eq("student_id", studentId)
   .in("schedule_id", chunk)
  if (error) throw error
  for (const row of data ?? []) out.push(mapHit(row as Record<string, unknown>))
 })
 return out
}

/** 指定排程上所有學生的出席列（O3 軟取消掃描） */
export async function fetchAttendanceHitsForSchedules(
 scheduleIds: string[]
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase || scheduleIds.length === 0) return []
 const uniq = [...new Set(scheduleIds.filter(Boolean))]
 const out: AttendanceLifecycleHit[] = []
 await forEachIdChunk(uniq, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("attendance_details")
   .select(
    "id, student_id, class_id, schedule_id, attendance_date, status, updated_at, students ( full_name )"
   )
   .in("schedule_id", chunk)
  if (error) throw error
  for (const row of data ?? []) out.push(mapHit(row as Record<string, unknown>))
 })
 return out
}

/** 學生在某班的全部出席列（O4 退讀／清報讀掃描） */
export async function fetchAttendanceHitsForStudentClass(
 studentId: string,
 classId: string
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase || !studentId || !classId) return []
 const { data, error } = await supabase
  .from("attendance_details")
  .select(
   "id, student_id, class_id, schedule_id, attendance_date, status, updated_at, students ( full_name )"
  )
  .eq("student_id", studentId)
  .eq("class_id", classId)
  .order("attendance_date", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => mapHit(row as Record<string, unknown>))
}

/**
 * 變更後仍應保留的 schedule（enrollment ∪ active trial ∪ otherMakeup±peers）。
 * 必須排除正在取消／清調堂的本筆 leave。
 * 用直接查表（不走老師名冊 RPC），請假管理／腳本／service_role 皆可用。
 */
function scheduleStatusEndsMakeupRetain(status: string | null | undefined): boolean {
 const st = String(status ?? "")
 return st.includes("取消") || st.includes("完成")
}

export async function fetchRetainScheduleIdsForStudent(params: {
 studentId: string
 excludeLeaveId: string
 candidateScheduleIds: string[]
 /** 試堂取消／刪／改期：唔因本筆試堂而 retain */
 excludeTrialId?: string
}): Promise<Set<string>> {
 const retain = new Set<string>()
 const candidates = [...new Set(params.candidateScheduleIds.filter(Boolean))]
 if (!supabase || !params.studentId || candidates.length === 0) return retain

 const { data: schedRows, error: schedErr } = await supabase
  .from("schedules")
  .select("id, class_id, scheduled_date, session_number")
  .in("id", candidates)
 if (schedErr) throw schedErr

 const classIds = [
  ...new Set(
   (schedRows ?? [])
    .map((r) => (r as { class_id?: string | null }).class_id)
    .filter((id): id is string => Boolean(id))
  ),
 ]

 const classYear = new Map<string, string | null>()
 const classYearLabel = new Map<string, string | null>()
 if (classIds.length > 0) {
  const { data: classes, error: classErr } = await supabase
   .from("classes")
   .select("id, academic_year_id, academic_years ( label )")
   .in("id", classIds)
  if (classErr) throw classErr
  for (const c of classes ?? []) {
   const row = c as {
    id: string
    academic_year_id?: string | null
    academic_years?: { label?: string } | null
   }
   classYear.set(String(row.id), row.academic_year_id != null ? String(row.academic_year_id) : null)
   classYearLabel.set(
    String(row.id),
    row.academic_years?.label != null ? String(row.academic_years.label) : null
   )
  }
 }

 // active trials
 if (candidates.length > 0) {
  const { data: trials, error: trialErr } = await supabase
   .from("trial_sessions")
   .select("id, schedule_id, status")
   .eq("student_id", params.studentId)
   .in("schedule_id", candidates)
  if (trialErr) throw trialErr
  for (const row of trials ?? []) {
   const tid = String((row as { id?: string }).id ?? "")
   if (params.excludeTrialId && tid === params.excludeTrialId) continue
   const st = String((row as { status?: string }).status ?? "")
   if (st.includes("完成") || st.includes("取消")) continue
   const sid = (row as { schedule_id?: string }).schedule_id
   if (sid) retain.add(String(sid))
  }
 }

 // enrollments on candidate classes
 if (classIds.length > 0) {
  const { data: enrolls, error: enrErr } = await supabase
   .from("student_class_enrollments")
   .select("id, class_id, status, enrollment_period, withdraw_effective_date")
   .eq("student_id", params.studentId)
   .in("class_id", classIds)
  if (enrErr) throw enrErr

  const activeEnrolls = (enrolls ?? []).filter((row) => {
   const r = row as Record<string, unknown>
   const st = String(r.status ?? "")
   if (st.includes("退") || st.includes("取消")) return false
   return true
  })

  const singleIds = activeEnrolls
   .filter((row) =>
    isSingleSessionEnrollment(
     normalizeEnrollmentPeriod(String((row as { enrollment_period?: string | null }).enrollment_period ?? ""))
    )
   )
   .map((row) => String((row as { id: string }).id))
  const enrolledScheduleIds = await fetchEnrolledScheduleIdsByEnrollmentIds(singleIds)

  // Wave 2：gated 學年以宣告決定 retain，禁止日期推期數
  const gatedCandidateIds = (schedRows ?? [])
   .filter((s) => {
    const classId = (s as { class_id?: string | null }).class_id
    if (!classId) return false
    return usesEntitlementRosterModel(classYearLabel.get(String(classId)) ?? null)
   })
   .map((s) => String((s as { id: string }).id))
  if (gatedCandidateIds.length > 0) {
   const decls = await fetchActiveDeclarationsForSchedules(gatedCandidateIds)
   for (const d of decls) {
    if (d.studentId === params.studentId) retain.add(d.scheduleId)
   }
  }

  // periods for period-code visibility（僅 legacy／非 gated）
  const yearIds = [...new Set([...classYear.values()].filter((id): id is string => Boolean(id)))]
  const periodByYearDate = new Map<string, string>()
  if (yearIds.length > 0) {
   const { data: periods, error: pErr } = await supabase
    .from("academic_year_periods")
    .select("academic_year_id, period_code, start_date, end_date")
    .in("academic_year_id", yearIds)
   if (pErr) throw pErr
   for (const p of periods ?? []) {
    const row = p as Record<string, unknown>
    const y = String(row.academic_year_id ?? "")
    const start = String(row.start_date ?? "").slice(0, 10)
    const end = String(row.end_date ?? "").slice(0, 10)
    const code = String(row.period_code ?? "")
    if (!y || !code) continue
    periodByYearDate.set(`${y}|${start}|${end}`, code)
   }
  }

  for (const s of schedRows ?? []) {
   const sid = String((s as { id: string }).id)
   const classId = (s as { class_id?: string | null }).class_id
   const ymd = String((s as { scheduled_date?: string }).scheduled_date ?? "").slice(0, 10)
   const yearId = classId ? classYear.get(String(classId)) : null
   if (!classId) continue
   if (usesEntitlementRosterModel(classYearLabel.get(String(classId)) ?? null)) continue

   let periodCode: 1 | 2 | null = null
   if (yearId) {
    for (const [key, code] of periodByYearDate) {
     if (!key.startsWith(`${yearId}|`)) continue
     const parts = key.split("|")
     const start = parts[1]
     const end = parts[2]
     if (start && end && ymd >= start && ymd <= end) {
      const n = Number(code)
      periodCode = n === 1 || n === 2 ? n : null
      break
     }
    }
   }

   for (const en of activeEnrolls) {
    const e = en as Record<string, unknown>
    if (String(e.class_id) !== String(classId)) continue
    const withdraw = e.withdraw_effective_date != null ? String(e.withdraw_effective_date).slice(0, 10) : null
    if (withdraw && ymd >= withdraw) continue
    const period = normalizeEnrollmentPeriod(String(e.enrollment_period ?? ""))
    const enrId = String(e.id)
    if (
     enrollmentVisibleOnSchedule({
      enrollmentPeriod: period,
      periodCode,
      scheduleId: sid,
      enrolledScheduleIds: enrolledScheduleIds.get(enrId) ?? new Set<string>(),
     })
    ) {
     retain.add(sid)
     break
    }
   }
  }
 }

 const { data: otherLeaves, error } = await supabase
  .from("leave_makeup_records")
  .select("id, makeup_schedule_id, status")
  .eq("student_id", params.studentId)
  .neq("id", params.excludeLeaveId)
  .not("makeup_schedule_id", "is", null)
 if (error) throw error

 const otherMakeupIds: string[] = []
 for (const row of otherLeaves ?? []) {
  const r = row as Record<string, unknown>
  if (String(r.status ?? "").includes("放棄")) continue
  const mid = r.makeup_schedule_id != null ? String(r.makeup_schedule_id) : ""
  if (mid) otherMakeupIds.push(mid)
 }
 // GAP-P0-1：目標 schedule 已取消／完成 → 唔因 otherMakeup retain
 if (otherMakeupIds.length > 0) {
  const expanded = (await expandScheduleIdsWithPeers(otherMakeupIds)).filter((sid) =>
   candidates.includes(sid)
  )
  if (expanded.length > 0) {
   const { data: makeupScheds, error: msErr } = await supabase
    .from("schedules")
    .select("id, status")
    .in("id", expanded)
   if (msErr) throw msErr
   for (const s of makeupScheds ?? []) {
    const row = s as { id: string; status?: string | null }
    if (scheduleStatusEndsMakeupRetain(row.status)) continue
    retain.add(String(row.id))
   }
  }
 }

 return retain
}

/** 可刪列＝候選 − 仍應到 schedule */
export function filterDeletableHits(
 candidates: AttendanceLifecycleHit[],
 retainScheduleIds: Set<string>
): AttendanceLifecycleHit[] {
 return candidates.filter((h) => {
  if (!h.scheduleId) return false
  return !retainScheduleIds.has(h.scheduleId)
 })
}

/** 掃描：舊 makeup 宿主＋peers → eligibility → 可刪列 */
export async function scanDeletableAttendanceForMakeupSchedule(params: {
 studentId: string
 leaveId: string
 oldMakeupScheduleId: string | null | undefined
}): Promise<AttendanceLifecycleHit[]> {
 const old = params.oldMakeupScheduleId?.trim()
 if (!old || !params.studentId) return []
 const peers = await expandScheduleIdsWithPeers([old])
 const candidates = await fetchAttendanceHitsForStudentSchedules(params.studentId, peers)
 if (candidates.length === 0) return []
 const retain = await fetchRetainScheduleIdsForStudent({
  studentId: params.studentId,
  excludeLeaveId: params.leaveId,
  candidateScheduleIds: peers,
 })
 return filterDeletableHits(candidates, retain)
}

/** 試堂：舊 schedule＋peers → eligibility（可 exclude 本筆試堂）→ 可刪列 */
export async function scanDeletableAttendanceForTrialSchedule(params: {
 studentId: string
 scheduleId: string | null | undefined
 excludeTrialId: string
}): Promise<AttendanceLifecycleHit[]> {
 const old = params.scheduleId?.trim()
 if (!old || !params.studentId) return []
 const peers = await expandScheduleIdsWithPeers([old])
 const candidates = await fetchAttendanceHitsForStudentSchedules(params.studentId, peers)
 if (candidates.length === 0) return []
 const retain = await fetchRetainScheduleIdsForStudent({
  studentId: params.studentId,
  excludeLeaveId: "",
  excludeTrialId: params.excludeTrialId,
  candidateScheduleIds: peers,
 })
 return filterDeletableHits(candidates, retain)
}

/** 供單測：已取消／完成 schedule 唔應因 makeup 連結而 retain */
export function shouldRetainOtherMakeupSchedule(status: string | null | undefined): boolean {
 return !scheduleStatusEndsMakeupRetain(status)
}

export function formatAttendanceHitsDescription(hits: AttendanceLifecycleHit[]): string {
 if (hits.length === 0) return ""
 const lines = hits.map((h) => {
  const name = h.studentName ? `${h.studentName} · ` : ""
  const bill = isBillableAttendanceStatus(h.status) ? "（計費）" : ""
  const sched = h.scheduleId ? ` · ${h.scheduleId.slice(0, 8)}…` : ""
  return `・${name}${h.attendanceDate} · ${h.status}${bill}${sched}`
 })
 const hasBillable = hits.some((h) => isBillableAttendanceStatus(h.status))
 const billNote = hasBillable
  ? "\n以上含計費出席：一併刪除會減少已扣堂數。"
  : "\n以上皆非計費狀態：一併刪除不影響已扣堂數。"
 return `以下 ${hits.length} 筆出席將失去補堂資格（可刪列）：\n${lines.join("\n")}${billNote}`
}

export function hitsHaveBillable(hits: AttendanceLifecycleHit[]): boolean {
 return hits.some((h) => isBillableAttendanceStatus(h.status))
}

export class AttendanceOptimisticLockError extends Error {
 constructor(message = "出席列已變更，請重新確認後再試") {
  super(message)
  this.name = "AttendanceOptimisticLockError"
 }
}

/**
 * 逐筆：樂觀鎖 → audit（須成功）→ delete（列已不存在＝成功／idempotent）。
 */
export async function deleteAttendanceHitsWithAuditOrThrow(
 hits: AttendanceLifecycleHit[],
 reason: string
): Promise<void> {
 if (!supabase || hits.length === 0) return

 const summary = hits
  .map(
   (h) =>
    `${h.id}|${h.studentId}|${h.scheduleId ?? ""}|${h.attendanceDate}|${h.status}`
  )
  .join("; ")

 await logMgmtAuditActionOrThrow({
  action: "刪除出席紀錄（生命週期）",
  detail: `reason=${reason}; count=${hits.length}; hits=${summary}`,
 })

 for (const hit of hits) {
  assertAcademicYearEditableForDate(hit.attendanceDate)

  const { data: live, error: fetchErr } = await supabase
   .from("attendance_details")
   .select("id, status, updated_at")
   .eq("id", hit.id)
   .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!live) continue // 已不存在＝idempotent 成功

  const liveRow = live as Record<string, unknown>
  const liveStatus = String(liveRow.status ?? "")
  const liveUpdated = liveRow.updated_at != null ? String(liveRow.updated_at) : null
  if (liveStatus !== hit.status || liveUpdated !== hit.updatedAt) {
   throw new AttendanceOptimisticLockError(
    `出席列已變更（${hit.studentName ?? hit.studentId} · ${hit.attendanceDate}），請重新掃描確認`
   )
  }

  let q = supabase.from("attendance_details").delete().eq("id", hit.id).eq("status", hit.status)
  if (hit.updatedAt != null) q = q.eq("updated_at", hit.updatedAt)
  const { data: deleted, error } = await q.select("id")
  if (error) throw error
  if (!deleted || deleted.length === 0) {
   // 並發刪光＝成功；仍在則當衝突
   const { data: still } = await supabase
    .from("attendance_details")
    .select("id")
    .eq("id", hit.id)
    .maybeSingle()
   if (still) {
    throw new AttendanceOptimisticLockError(
     `無法刪除出席列（${hit.studentName ?? hit.studentId} · ${hit.attendanceDate}），請重試`
    )
   }
  }
 }
}

/** A2b O2：載入單列（弱鎖用最新 status／updated_at） */
export async function fetchAttendanceLifecycleHitById(
 id: string
): Promise<AttendanceLifecycleHit | null> {
 if (!supabase || !id) return null
 const { data, error } = await supabase
  .from("attendance_details")
  .select(
   "id, student_id, class_id, schedule_id, attendance_date, status, updated_at, students ( full_name )"
  )
  .eq("id", id)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 return mapHit(data as Record<string, unknown>)
}

function assertCanDeleteAttendanceAsMgmt(): void {
 if (!isAdminOrAlien()) {
  throw new Error("僅管理員或外星人可刪除單筆出席紀錄（過渡權限＝mgmtRole，非 Auth）")
 }
}

/**
 * A2b O2：admin／alien 刪單一出席列。
 * 會先 re-read 最新列再走 audit＋樂觀鎖刪除。
 */
export async function deleteAttendanceDetailAsMgmt(
 attendanceDetailId: string,
 reason = "mgmt_single_delete"
): Promise<void> {
 assertCanDeleteAttendanceAsMgmt()
 const hit = await fetchAttendanceLifecycleHitById(attendanceDetailId)
 if (!hit) return // 已不存在＝idempotent
 await deleteAttendanceHitsWithAuditOrThrow([hit], reason)
}
