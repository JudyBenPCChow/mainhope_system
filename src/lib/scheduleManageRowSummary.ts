import type { ScheduleAlerts } from "@/services/scheduleQueries"
import {
 activeTrialsForSchedules,
 leavesForSchedule,
 makeupsForSchedules,
 rosterHeadcountForSchedule,
 rosterStudentsForSchedule,
 type ScheduleRosterContext,
} from "@/services/scheduleRosterQueries"

export type ScheduleManageRowSummary = {
 scheduleId: string
 rosterCount: number
 hasTrial: boolean
 hasLeave: boolean
 hasMakeup: boolean
 canTakeAttendance: boolean
}

export function isCampusHolidayCancelReason(reason: string | null | undefined): boolean {
 return String(reason ?? "").startsWith("校舍假期")
}

export function scheduleAlertsFromSummary(
 summary: ScheduleManageRowSummary | undefined,
 remarks: string | null | undefined
): ScheduleAlerts {
 const rem = remarks ?? ""
 return {
  trial: summary?.hasTrial === true,
  makeup: summary?.hasMakeup === true,
  leave: summary?.hasLeave === true,
  record: rem.includes("錄影") || rem.includes("錄像") || rem.includes("錄音"),
 }
}

export function summarizeScheduleManageRows(
 context: ScheduleRosterContext,
 scheduleIds: string[],
 consecutivePeers: { id: string; consecutiveGroupId: string | null }[] = []
): Map<string, ScheduleManageRowSummary> {
 const out = new Map<string, ScheduleManageRowSummary>()
 const canTake = new Set<string>()
 for (const trial of activeTrialsForSchedules(context, scheduleIds)) canTake.add(trial.scheduleId)
 for (const makeup of makeupsForSchedules(context, scheduleIds)) {
  if (makeup.makeupScheduleId) canTake.add(makeup.makeupScheduleId)
 }
 for (const scheduleId of scheduleIds) {
  if (rosterStudentsForSchedule(context, scheduleId).length > 0) canTake.add(scheduleId)
 }
 if (canTake.size > 0 && consecutivePeers.length > 0) {
  const byGroup = new Map<string, string[]>()
  for (const row of consecutivePeers) {
   const gid = row.consecutiveGroupId?.trim()
   if (!gid) continue
   const arr = byGroup.get(gid) ?? []
   arr.push(row.id)
   byGroup.set(gid, arr)
  }
  for (const peers of byGroup.values()) {
   if (peers.some((id) => canTake.has(id))) {
    for (const id of peers) canTake.add(id)
   }
  }
 }

 for (const scheduleId of scheduleIds) {
  out.set(scheduleId, {
   scheduleId,
   rosterCount: rosterHeadcountForSchedule(context, scheduleId),
   hasTrial: activeTrialsForSchedules(context, [scheduleId]).length > 0,
   hasLeave: leavesForSchedule(context, scheduleId).length > 0,
   hasMakeup: makeupsForSchedules(context, [scheduleId]).length > 0,
   canTakeAttendance: canTake.has(scheduleId),
  })
 }
 return out
}
