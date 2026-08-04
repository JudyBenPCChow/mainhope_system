import type { RosterEligibilityReasonCode } from "@/lib/entitlementPackage"
import { usesEntitlementRosterModel } from "@/lib/rosterEligibilityGate"
import {
 fetchActiveDeclarationsForSchedules,
 type AttendanceDeclarationRow,
} from "@/services/entitlementQueries"
import {
 activeTrialsForSchedules,
 enrollmentsForSchedules,
 legacyRosterStudentsForSchedule,
 makeupsForSchedules,
 type ScheduleRosterContext,
} from "@/services/scheduleRosterQueries"

export type RosterStudentWithReason = {
 studentId: string
 fullName: string
 reasonCode: RosterEligibilityReasonCode
}

export type RosterShadowDiff = {
 scheduleId: string
 academicYearLabel: string | null
 usesNewModel: boolean
 oldRosterCount: number
 newRosterCount: number
 missingInNew: RosterStudentWithReason[]
 extraInNew: RosterStudentWithReason[]
 oldNames: string[]
 newNames: string[]
}

function sortByName<T extends { fullName: string }>(rows: T[]): T[] {
 return [...rows].sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
}

/** 新路徑：active 宣告 ∪ 試堂 ∪（過渡）leave makeup */
export function rosterStudentsFromDeclarations(
 context: ScheduleRosterContext,
 scheduleId: string,
 declarations: AttendanceDeclarationRow[]
): RosterStudentWithReason[] {
 const byId = new Map<string, RosterStudentWithReason>()
 const nameByStudent = new Map<string, string>()
 for (const e of context.enrollments) {
  nameByStudent.set(e.studentId, e.fullName)
 }
 for (const t of context.trials) {
  if (!nameByStudent.has(t.studentId)) nameByStudent.set(t.studentId, t.fullName)
 }
 for (const l of context.leaves) {
  if (!nameByStudent.has(l.studentId)) nameByStudent.set(l.studentId, l.fullName)
 }

 for (const d of declarations.filter((row) => row.scheduleId === scheduleId && row.status === "active")) {
  byId.set(d.studentId, {
   studentId: d.studentId,
   fullName: nameByStudent.get(d.studentId) ?? "—",
   reasonCode: "eligible_declared",
  })
 }
 for (const row of activeTrialsForSchedules(context, [scheduleId])) {
  if (!byId.has(row.studentId)) {
   byId.set(row.studentId, {
    studentId: row.studentId,
    fullName: row.fullName,
    reasonCode: "trial_session",
   })
  }
 }
 for (const row of makeupsForSchedules(context, [scheduleId])) {
  if (!byId.has(row.studentId)) {
   byId.set(row.studentId, {
    studentId: row.studentId,
    fullName: row.fullName,
    reasonCode: "leave_makeup_guest",
   })
  }
 }
 return sortByName([...byId.values()])
}

function legacyRosterWithReasons(
 context: ScheduleRosterContext,
 scheduleId: string
): RosterStudentWithReason[] {
 const byId = new Map<string, RosterStudentWithReason>()
 for (const row of enrollmentsForSchedules(context, [scheduleId])) {
  byId.set(row.studentId, {
   studentId: row.studentId,
   fullName: row.fullName,
   reasonCode: "legacy_path",
  })
 }
 for (const row of activeTrialsForSchedules(context, [scheduleId])) {
  if (!byId.has(row.studentId)) {
   byId.set(row.studentId, {
    studentId: row.studentId,
    fullName: row.fullName,
    reasonCode: "trial_session",
   })
  }
 }
 for (const row of makeupsForSchedules(context, [scheduleId])) {
  if (!byId.has(row.studentId)) {
   byId.set(row.studentId, {
    studentId: row.studentId,
    fullName: row.fullName,
    reasonCode: "leave_makeup_guest",
   })
  }
 }
 return sortByName([...byId.values()])
}

/**
 * 正式點名名單：依學年硬閘選舊／新路徑。
 * 呼叫端須先把 declarations 載入 context（見 enrichRosterContextWithDeclarations）。
 */
export function resolveRosterStudentsForSchedule(
 context: ScheduleRosterContext,
 scheduleId: string
): RosterStudentWithReason[] {
 const schedule = context.schedules.find((s) => s.id === scheduleId)
 if (!schedule) return []
 if (usesEntitlementRosterModel(schedule.academicYearLabel)) {
  return rosterStudentsFromDeclarations(
   context,
   scheduleId,
   context.activeDeclarations ?? []
  )
 }
 return legacyRosterWithReasons(context, scheduleId)
}

/** Shadow：舊規則 vs 宣告路徑對照（不影響正式名單） */
export async function compareRosterShadow(
 context: ScheduleRosterContext,
 scheduleId: string
): Promise<RosterShadowDiff> {
 const schedule = context.schedules.find((s) => s.id === scheduleId)
 const academicYearLabel = schedule?.academicYearLabel ?? null
 const usesNewModel = usesEntitlementRosterModel(academicYearLabel)

 const oldRows = legacyRosterWithReasons(context, scheduleId)
 const declarations =
  context.activeDeclarations
  ?? (await fetchActiveDeclarationsForSchedules([scheduleId]))
 const newRows = rosterStudentsFromDeclarations(context, scheduleId, declarations)

 const oldIds = new Set(oldRows.map((r) => r.studentId))
 const newIds = new Set(newRows.map((r) => r.studentId))

 return {
  scheduleId,
  academicYearLabel,
  usesNewModel,
  oldRosterCount: oldRows.length,
  newRosterCount: newRows.length,
  missingInNew: oldRows.filter((r) => !newIds.has(r.studentId)),
  extraInNew: newRows.filter((r) => !oldIds.has(r.studentId)),
  oldNames: oldRows.map((r) => r.fullName),
  newNames: newRows.map((r) => r.fullName),
 }
}

/** 兼容：僅回傳 id／名（與舊 rosterStudentsForSchedule 形狀相同） */
export function rosterStudentIdsForSchedule(
 context: ScheduleRosterContext,
 scheduleId: string
): { studentId: string; fullName: string }[] {
 return resolveRosterStudentsForSchedule(context, scheduleId).map((r) => ({
  studentId: r.studentId,
  fullName: r.fullName,
 }))
}

/** 測試／對照用：強制舊路徑 */
export function legacyRosterStudentsForScheduleExport(
 context: ScheduleRosterContext,
 scheduleId: string
): { studentId: string; fullName: string }[] {
 return legacyRosterStudentsForSchedule(context, scheduleId)
}
