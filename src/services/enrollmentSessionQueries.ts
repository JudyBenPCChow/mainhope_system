import { supabase } from "@/lib/supabaseClient"
import {
 formatEnrollmentFormLabel,
 isSingleSessionEnrollment,
 normalizeEnrollmentPeriod,
 type EnrollmentFormValue,
} from "@/lib/enrollmentPeriod"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { pickStudentContactFromDbRow } from "@/lib/whatsappReminder"

export type EnrollmentSessionRow = {
 enrollmentId: string
 scheduleId: string
 sessionNumber: number | null
 scheduledDate: string
}

/** 批次載入多筆報讀的選堂 schedule_id */
export async function fetchEnrolledScheduleIdsByEnrollmentIds(
 enrollmentIds: string[]
): Promise<Map<string, Set<string>>> {
 const map = new Map<string, Set<string>>()
 if (!supabase || enrollmentIds.length === 0) return map
 for (const id of enrollmentIds) map.set(id, new Set())

 await forEachIdChunk(enrollmentIds, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("student_enrollment_sessions")
   .select("enrollment_id, schedule_id")
   .in("enrollment_id", chunk)
  if (error) throw error
  for (const row of data ?? []) {
   const r = row as Record<string, unknown>
   const eid = String(r.enrollment_id)
   const sid = String(r.schedule_id)
   const set = map.get(eid) ?? new Set<string>()
   set.add(sid)
   map.set(eid, set)
  }
 })
 return map
}

/** 某班所有單堂報讀的選堂（含學生姓名／堂號），供名單過濾與提醒 */
export async function fetchClassSingleSessionEnrollments(classId: string): Promise<
 {
  enrollmentId: string
  studentId: string
  fullName: string
  scheduleIds: Set<string>
  sessionNumbers: number[]
  contactPhone: string | null
 }[]
> {
 if (!supabase) return []
 const { data: enrData, error: enrErr } = await supabase
  .from("student_class_enrollments")
  .select(
   "id, student_id, enrollment_period, students ( full_name, whatsapp, student_phone, parent_phone )"
  )
  .eq("class_id", classId)
  .eq("status", "就讀中")
  .eq("enrollment_period", "單堂")
 if (enrErr) throw enrErr

 const enrollments = (enrData ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  return {
   enrollmentId: String(r.id),
   studentId: String(r.student_id),
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   contactPhone: pickStudentContactFromDbRow(st),
  }
 })
 if (enrollments.length === 0) return []

 const scheduleMap = await fetchEnrolledScheduleIdsByEnrollmentIds(
  enrollments.map((e) => e.enrollmentId)
 )

 const allScheduleIds = new Set<string>()
 for (const set of scheduleMap.values()) {
  for (const id of set) allScheduleIds.add(id)
 }

 const sessionNumberBySchedule = new Map<string, number | null>()
 if (allScheduleIds.size > 0) {
  await forEachIdChunk([...allScheduleIds], DEFAULT_ID_CHUNK, async (chunk) => {
   const { data, error } = await supabase!
    .from("schedules")
    .select("id, session_number")
    .in("id", chunk)
   if (error) throw error
   for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const sn =
     r.session_number != null && !Number.isNaN(Number(r.session_number))
      ? Number(r.session_number)
      : null
    sessionNumberBySchedule.set(String(r.id), sn)
   }
  })
 }

 return enrollments.map((e) => {
  const scheduleIds = scheduleMap.get(e.enrollmentId) ?? new Set<string>()
  const sessionNumbers = [...scheduleIds]
   .map((sid) => sessionNumberBySchedule.get(sid) ?? null)
   .filter((n): n is number => n != null)
   .sort((a, b) => a - b)
  return { ...e, scheduleIds, sessionNumbers }
 })
}

/** 單堂報讀但本堂未選的學生（提醒用，不進點名名單） */
export async function fetchSingleSessionNotOnSchedule(
 classId: string,
 scheduleId: string
): Promise<{ studentId: string; fullName: string; contactPhone: string | null }[]> {
 const rows = await fetchClassSingleSessionEnrollments(classId)
 return rows
  .filter((r) => !r.scheduleIds.has(scheduleId))
  .map(({ studentId, fullName, contactPhone }) => ({ studentId, fullName, contactPhone }))
}

/** 讀取單一報讀的選堂（含 session_number） */
export async function fetchEnrollmentSessions(
 enrollmentId: string
): Promise<EnrollmentSessionRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("student_enrollment_sessions")
  .select("enrollment_id, schedule_id, schedules ( session_number, scheduled_date )")
  .eq("enrollment_id", enrollmentId)
 if (error) throw error
 return (data ?? [])
  .map((row) => {
   const r = row as Record<string, unknown>
   const sch = r.schedules as Record<string, unknown> | null
   return {
    enrollmentId: String(r.enrollment_id),
    scheduleId: String(r.schedule_id),
    sessionNumber:
     sch?.session_number != null && !Number.isNaN(Number(sch.session_number))
      ? Number(sch.session_number)
      : null,
    scheduledDate: sch?.scheduled_date != null ? String(sch.scheduled_date).slice(0, 10) : "",
   }
  })
  .sort((a, b) => {
   const an = a.sessionNumber ?? 9999
   const bn = b.sessionNumber ?? 9999
   if (an !== bn) return an - bn
   return a.scheduledDate.localeCompare(b.scheduledDate)
  })
}

/** 批次：enrollmentId → session numbers（供列表標示） */
export async function fetchSessionNumbersByEnrollmentIds(
 enrollmentIds: string[]
): Promise<Map<string, number[]>> {
 const out = new Map<string, number[]>()
 if (!supabase || enrollmentIds.length === 0) return out
 for (const id of enrollmentIds) out.set(id, [])

 const scheduleMap = await fetchEnrolledScheduleIdsByEnrollmentIds(enrollmentIds)
 const allScheduleIds = new Set<string>()
 for (const set of scheduleMap.values()) {
  for (const id of set) allScheduleIds.add(id)
 }
 if (allScheduleIds.size === 0) return out

 const sessionNumberBySchedule = new Map<string, number | null>()
 await forEachIdChunk([...allScheduleIds], DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("id, session_number")
   .in("id", chunk)
  if (error) throw error
  for (const row of data ?? []) {
   const r = row as Record<string, unknown>
   sessionNumberBySchedule.set(
    String(r.id),
    r.session_number != null && !Number.isNaN(Number(r.session_number))
     ? Number(r.session_number)
     : null
   )
  }
 })

 for (const [eid, scheduleIds] of scheduleMap) {
  const nums = [...scheduleIds]
   .map((sid) => sessionNumberBySchedule.get(sid) ?? null)
   .filter((n): n is number => n != null)
   .sort((a, b) => a - b)
  out.set(eid, nums)
 }
 return out
}

export function enrollmentFormDisplayLabel(
 period: EnrollmentFormValue | null | undefined,
 sessionNumbers?: number[]
): string {
 return formatEnrollmentFormLabel(period, sessionNumbers)
}

export function parseEnrollmentForm(
 value: string | null | undefined
): EnrollmentFormValue | null {
 return normalizeEnrollmentPeriod(value)
}

export { isSingleSessionEnrollment, formatEnrollmentFormLabel }
