/**
 * 更換任教老師時，哪些排程可同步。
 * 已有老師且已開始／已取消的堂不改寫；空白老師可回填；代堂只改 original_teacher_id。
 */

import { parseHm } from "@/lib/lessonSlots"

export type ClassTeacherSyncScheduleRow = {
  id: string
  status: string | null
  scheduledDate: string
  startTime: string | null
  teacherId: string | null
  originalTeacherId: string | null
  consecutiveGroupId?: string | null
}

export function civilYmd(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function civilHm(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function scheduleHasStarted(
  scheduledDate: string,
  startTime: string | null,
  todayYmd: string,
  nowHm: string
): boolean {
  if (scheduledDate < todayYmd) return true
  if (scheduledDate > todayYmd) return false
  if (!startTime) return true
  const startMin = parseHm(startTime)
  const nowMin = parseHm(nowHm)
  if (startMin == null || nowMin == null) return true
  return startMin <= nowMin
}

function isCancelledStatus(status: string | null): boolean {
  return String(status ?? "").includes("取消")
}

function hasSubstituteMarker(originalTeacherId: string | null): boolean {
  return originalTeacherId != null && originalTeacherId.trim() !== ""
}

function overwriteBlockedIds(
  rows: ClassTeacherSyncScheduleRow[],
  todayYmd: string,
  nowHm: string
): Set<string> {
  const started = new Set<string>()
  for (const row of rows) {
    if (isCancelledStatus(row.status)) continue
    if (scheduleHasStarted(row.scheduledDate, row.startTime, todayYmd, nowHm)) {
      started.add(row.id)
    }
  }
  const byGroup = new Map<string, string[]>()
  for (const row of rows) {
    if (isCancelledStatus(row.status)) continue
    const gid = row.consecutiveGroupId?.trim()
    if (!gid) continue
    const arr = byGroup.get(gid) ?? []
    arr.push(row.id)
    byGroup.set(gid, arr)
  }
  const blocked = new Set(started)
  for (const members of byGroup.values()) {
    if (members.some((id) => started.has(id))) {
      for (const id of members) blocked.add(id)
    }
  }
  return blocked
}

export function partitionSchedulesForClassTeacherSync(
  rows: ClassTeacherSyncScheduleRow[],
  nextTeacherId: string | null,
  todayYmd: string,
  nowHm: string
): { directIds: string[]; substituteIds: string[] } {
  const directIds: string[] = []
  const substituteIds: string[] = []
  const blocked = overwriteBlockedIds(rows, todayYmd, nowHm)
  for (const row of rows) {
    if (isCancelledStatus(row.status)) continue
    if (hasSubstituteMarker(row.originalTeacherId)) {
      if (!blocked.has(row.id) && row.originalTeacherId !== nextTeacherId) {
        substituteIds.push(row.id)
      }
      continue
    }
    const tid = row.teacherId?.trim() || null
    if (tid == null) {
      if (nextTeacherId != null) directIds.push(row.id)
      continue
    }
    if (blocked.has(row.id)) continue
    if (tid !== nextTeacherId) directIds.push(row.id)
  }
  return { directIds, substituteIds }
}
