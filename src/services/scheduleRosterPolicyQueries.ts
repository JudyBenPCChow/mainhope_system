import { isSingleSessionEnrollment } from "@/lib/enrollmentPeriod"
import {
 canConvertExtraLessonToSelectedRoster,
 canPickEnrolledRoster,
 ROSTER_POLICY_SELECTED,
 type RosterPolicy,
 normalizeRosterPolicy,
} from "@/lib/scheduleRosterPolicy"
import { supabase } from "@/lib/supabaseClient"
import { fetchCurrentAuthzProfile } from "@/services/authzProfileQueries"
import { fetchClassStudents, type ClassStudentRow } from "@/services/classQueries"
import {
 fetchActiveDeclarationsForSchedules,
 mintDeclarationsForScheduleStudents,
 voidActiveDeclarationsForSchedules,
} from "@/services/entitlementQueries"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"

export type ExtraLessonRosterCandidate = {
 studentId: string
 enrollmentId: string
 fullName: string
 enrollmentPeriod: ClassStudentRow["enrollmentPeriod"]
 enrollDate: string | null
}

export class RosterSelectionLockedError extends Error {
 readonly lockedNames: string[]
 constructor(lockedNames: string[]) {
  super(
   lockedNames.length === 1
    ? `${lockedNames[0]} 已有點名紀錄，不可從此堂剔除`
    : `以下學生已有點名紀錄，不可從此堂剔除：${lockedNames.join("、")}`
  )
  this.name = "RosterSelectionLockedError"
  this.lockedNames = lockedNames
 }
}

async function currentActorAppUserId(): Promise<string | null> {
 try {
  const profile = await fetchCurrentAuthzProfile()
  return profile?.appUserId ?? null
 } catch {
  return null
 }
}

export async function listExtraLessonRosterCandidates(opts: {
 classId: string
 scheduleDate?: string
}): Promise<ExtraLessonRosterCandidate[]> {
 const rows = await fetchClassStudents(opts.classId, {
  activeOnly: true,
  scheduleDate: opts.scheduleDate,
 })
 return rows
  .filter((row) => !isSingleSessionEnrollment(row.enrollmentPeriod))
  .map((row) => ({
   studentId: row.studentId,
   enrollmentId: row.enrollmentId,
   fullName: row.fullName,
   enrollmentPeriod: row.enrollmentPeriod,
   enrollDate: row.enrollDate,
  }))
}

export async function fetchAttendanceStudentIdsForSchedule(
 scheduleId: string
): Promise<Set<string>> {
 if (!supabase || !scheduleId) return new Set()
 const { data, error } = await supabase
  .from("attendance_details")
  .select("student_id")
  .eq("schedule_id", scheduleId)
 if (error) throw error
 const out = new Set<string>()
 for (const raw of data ?? []) {
  const id = (raw as { student_id?: string | null }).student_id
  if (id) out.add(String(id))
 }
 return out
}

async function stampRosterConfirmation(opts: {
 scheduleId: string
 policy: RosterPolicy
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const actorId = await currentActorAppUserId()
 const { error } = await supabase
  .from("schedules")
  .update({
   roster_policy: opts.policy,
   roster_confirmed_at: new Date().toISOString(),
   roster_confirmed_by: actorId,
   updated_at: new Date().toISOString(),
  })
  .eq("id", opts.scheduleId)
 if (error) throw error
}

export async function mintSelectedRosterDeclarations(opts: {
 classId: string
 scheduleId: string
 studentIds: string[]
 candidates?: ExtraLessonRosterCandidate[]
}): Promise<void> {
 const candidates =
  opts.candidates ??
  (await listExtraLessonRosterCandidates({ classId: opts.classId }))
 const wanted = new Set(opts.studentIds)
 const selected = candidates.filter((row) => wanted.has(row.studentId))
 await mintDeclarationsForScheduleStudents({
  classId: opts.classId,
  scheduleId: opts.scheduleId,
  students: selected,
  sourceEventType: "manual_roster_add",
 })
}

export async function convertExtraLessonToSelectedRoster(opts: {
 scheduleId: string
 classId: string
 isExtraLesson: boolean
 remarks?: string | null
 rosterPolicy?: string | null
}): Promise<void> {
 if (
  !canConvertExtraLessonToSelectedRoster({
   isExtraLesson: opts.isExtraLesson,
   rosterPolicy: opts.rosterPolicy,
   remarks: opts.remarks,
  })
 ) {
  throw new Error("此堂不可改為挑選學生上紙")
 }
 await stampRosterConfirmation({ scheduleId: opts.scheduleId, policy: ROSTER_POLICY_SELECTED })
 void logMgmtAuditAction({
  action: "加堂改為挑選名單",
  detail: `schedule_id=${opts.scheduleId}; class_id=${opts.classId}`,
 })
}

export async function saveSelectedRoster(opts: {
 scheduleId: string
 classId: string
 studentIds: string[]
 isExtraLesson: boolean
 remarks?: string | null
 rosterPolicy?: string | null
}): Promise<void> {
 if (
  !canPickEnrolledRoster({ rosterPolicy: opts.rosterPolicy, remarks: opts.remarks }) &&
  !canConvertExtraLessonToSelectedRoster({
   isExtraLesson: opts.isExtraLesson,
   rosterPolicy: opts.rosterPolicy,
   remarks: opts.remarks,
  })
 ) {
  throw new Error("此堂不可挑選就讀生")
 }

 const candidates = await listExtraLessonRosterCandidates({ classId: opts.classId })
 const byId = new Map(candidates.map((row) => [row.studentId, row]))
 const wanted = [...new Set(opts.studentIds.filter((id) => byId.has(id)))]
 const wantedSet = new Set(wanted)

 const [locked, declarations] = await Promise.all([
  fetchAttendanceStudentIdsForSchedule(opts.scheduleId),
  fetchActiveDeclarationsForSchedules([opts.scheduleId]),
 ])
 const current = new Set(
  declarations.filter((d) => d.scheduleId === opts.scheduleId).map((d) => d.studentId)
 )

 const lockedNames: string[] = []
 for (const studentId of locked) {
  if (!wantedSet.has(studentId) && current.has(studentId)) {
   lockedNames.push(byId.get(studentId)?.fullName ?? studentId)
  }
 }
 if (lockedNames.length > 0) {
  throw new RosterSelectionLockedError(lockedNames)
 }

 const toVoid = [...current].filter((id) => !wantedSet.has(id) && !locked.has(id))
 if (toVoid.length > 0) {
  await voidActiveDeclarationsForSchedules([opts.scheduleId], { studentIds: toVoid })
 }

 await mintSelectedRosterDeclarations({
  classId: opts.classId,
  scheduleId: opts.scheduleId,
  studentIds: wanted,
  candidates,
 })
 await stampRosterConfirmation({ scheduleId: opts.scheduleId, policy: ROSTER_POLICY_SELECTED })
 void logMgmtAuditAction({
  action: "確認加堂名單",
  detail: `schedule_id=${opts.scheduleId}; class_id=${opts.classId}; selected=${wanted.length}`,
 })
}

export function selectedIdsFromDeclarations(
 scheduleId: string,
 declarations: { scheduleId: string; studentId: string }[],
 candidates: ExtraLessonRosterCandidate[]
): string[] {
 const declared = new Set(
  declarations.filter((d) => d.scheduleId === scheduleId).map((d) => d.studentId)
 )
 return candidates.filter((row) => declared.has(row.studentId)).map((row) => row.studentId)
}

export { normalizeRosterPolicy }
