import { parseMakeupOfScheduleId } from "@/lib/scheduleMakeupMarkers"
import {
  listSpecialistTuitionPeriods,
} from "@/lib/specialistTuitionPeriods"
import { weekdayLabelFromYmd, weekdaysEqual, weekdaysFromStored } from "@/lib/weekdayUtils"

import {
  SPECIALIST_CALENDAR_TARGET_LESSONS,
  SPECIALIST_LAST_LESSON_YMD_2627,
} from "@/lib/adminOpsAssistant/config"
import type { SlotChangeWriteMode } from "@/lib/adminOpsAssistant/types"

export function specialistLastLessonYmd(academicYearLabel: string | null | undefined): string | null {
  return academicYearLabel?.trim() === "2627" ? SPECIALIST_LAST_LESSON_YMD_2627 : null
}

export function slotChangeWriteMode(
  currentDayOfWeek: string | null | undefined,
  nextDayOfWeek: string | null | undefined
): SlotChangeWriteMode {
  if (weekdaysEqual(currentDayOfWeek, nextDayOfWeek)) return "update_times"
  return "regenerate_dates"
}

export function isCancelledStatus(status: string | null | undefined): boolean {
  return String(status ?? "").includes("取消")
}

export function isMakeupScheduleRow(remarks: string | null | undefined): boolean {
  return parseMakeupOfScheduleId(remarks) != null
}

export type ScheduleSlotChangeAction = "update" | "keep" | "delete_for_regen" | "ignore_past"

/** 同星期改鐘：日後未取消、非補回才 UPDATE。改逢星期：該批列才可刪後重生。 */
export function classifyScheduleRowForSlotChange(opts: {
  scheduledDate: string
  status: string | null | undefined
  remarks: string | null | undefined
  todayYmd: string
  mode: SlotChangeWriteMode
}): ScheduleSlotChangeAction {
  const date = opts.scheduledDate.slice(0, 10)
  if (date < opts.todayYmd) return "ignore_past"
  if (isCancelledStatus(opts.status) || isMakeupScheduleRow(opts.remarks)) return "keep"
  if (opts.mode === "update_times") return "update"
  return "delete_for_regen"
}

export function emptyClassHardDeleteGate(opts: {
  activeEnrollmentCount: number
  attendanceCount: number
}): { ok: true } | { ok: false; reason: string } {
  if (opts.activeEnrollmentCount > 0) {
    return { ok: false, reason: "此班仍有報讀，不可硬刪。請改走班別詳情或退讀流程。" }
  }
  if (opts.attendanceCount > 0) {
    return { ok: false, reason: "此班已有點名紀錄，不可硬刪排程。有點名須走取消堂，不可刪列。" }
  }
  return { ok: true }
}

export function regenerateSlotChangeGate(opts: {
  attendanceOnRowsToDelete: number
  keptCancelledCount: number
  keptMakeupCount: number
  userConfirmedKeepHistorical: boolean
}): { ok: true } | { ok: false; reason: string } {
  if (opts.attendanceOnRowsToDelete > 0) {
    return {
      ok: false,
      reason: "要換日期網的堂次已有點名，不可刪列重生。請改用取消堂／補回，或維持原逢星期只改鐘。",
    }
  }
  if (
    (opts.keptCancelledCount > 0 || opts.keptMakeupCount > 0) &&
    !opts.userConfirmedKeepHistorical
  ) {
    return {
      ok: false,
      reason: "此班已有取消堂或補回堂。改逢星期時那些列不會一併搬移；請確認保留後才重生日期網。",
    }
  }
  return { ok: true }
}

export function specialistLessonDatesFromFirst(opts: {
  academicYearLabel: string
  weekday: string
  firstDateYmd: string
}): { dates: string[]; calendarTarget: number; lastLessonYmd: string | null } {
  const weekday = weekdaysFromStored(opts.weekday)[0] ?? opts.weekday.trim()
  const first = opts.firstDateYmd.slice(0, 10)
  const last = specialistLastLessonYmd(opts.academicYearLabel)
  const periods = listSpecialistTuitionPeriods(opts.academicYearLabel)
  const dates: string[] = []
  for (const period of periods) {
    for (const date of period.dates) {
      if (date < first) continue
      if (last && date > last) continue
      if (weekdayLabelFromYmd(date) === weekday) dates.push(date)
    }
  }
  return {
    dates: [...new Set(dates)].sort(),
    calendarTarget: SPECIALIST_CALENDAR_TARGET_LESSONS,
    lastLessonYmd: last,
  }
}

/** 禁止為湊 40 而補建已過日期，或排在專科最後上課日之後。 */
export function forbiddenPadDates(opts: {
  proposedDates: readonly string[]
  todayYmd: string
  lastLessonYmd: string | null
}): { past: string[]; afterLast: string[] } {
  const past: string[] = []
  const afterLast: string[] = []
  for (const raw of opts.proposedDates) {
    const date = raw.slice(0, 10)
    if (date < opts.todayYmd) past.push(date)
    if (opts.lastLessonYmd && date > opts.lastLessonYmd) afterLast.push(date)
  }
  return { past, afterLast }
}

export function assertNoForbiddenPad(opts: {
  proposedDates: readonly string[]
  todayYmd: string
  lastLessonYmd: string | null
}): void {
  const { past, afterLast } = forbiddenPadDates(opts)
  if (past.length > 0) {
    throw new Error("不可為湊滿 40 堂而補建已過日期。中途開班以實際可排堂數為準。")
  }
  if (afterLast.length > 0) {
    throw new Error("不可把專科堂排在最後上課日之後。")
  }
}

export type RoomRankTier = "keep" | "preferred" | "last_resort" | "forbidden"

const CONSTELLATION_ROOMS = new Set(["矩尺座", "山案座", "英仙座"])

export function isWeekdayLabel(dayOfWeek: string | null | undefined): boolean {
  const days = weekdaysFromStored(dayOfWeek)
  if (days.length === 0) return false
  return days.every((d) => d !== "星期六" && d !== "星期日")
}

export function classroomRankTier(opts: {
  roomName: string
  weekday: string | null | undefined
  currentRoomId: string | null | undefined
  roomId: string
}): RoomRankTier {
  const name = opts.roomName.trim()
  if (name === "17K") return "forbidden"
  if (opts.currentRoomId && opts.roomId === opts.currentRoomId && name !== "17K") return "keep"
  const weekday = isWeekdayLabel(opts.weekday)
  if (weekday && name === "17D") return "forbidden"
  if (weekday && name === "17E") return "last_resort"
  if (CONSTELLATION_ROOMS.has(name)) return "preferred"
  return "preferred"
}

export function rankClassroomCandidates<T extends { id: string; name: string; is_online?: boolean }>(
  rooms: readonly T[],
  opts: { weekday: string | null | undefined; currentRoomId: string | null | undefined }
): Array<T & { tier: RoomRankTier }> {
  const ranked = rooms
    .filter((room) => !room.is_online)
    .map((room) => ({
      ...room,
      tier: classroomRankTier({
        roomName: room.name,
        weekday: opts.weekday,
        currentRoomId: opts.currentRoomId,
        roomId: room.id,
      }),
    }))
    .filter((room) => room.tier !== "forbidden")
  const order: Record<RoomRankTier, number> = {
    keep: 0,
    preferred: 1,
    last_resort: 2,
    forbidden: 9,
  }
  return ranked.sort((a, b) => {
    const d = order[a.tier] - order[b.tier]
    if (d !== 0) return d
    return a.name.localeCompare(b.name, "zh-Hant")
  })
}

export function colleagueNoticeDraft(opts: {
  courseName: string
  courseCode: string
  dayOfWeek: string
  timeSlot: string
}): string {
  return [opts.courseName.trim(), opts.courseCode.trim(), opts.dayOfWeek.trim(), opts.timeSlot.trim()]
    .filter(Boolean)
    .join("\n")
}

export function lessonCountPreviewLine(actual: number, calendarTarget: number): string {
  if (actual === calendarTarget) return `將排 ${actual} 堂（校曆目標 ${calendarTarget}）`
  return `將排 ${actual} 堂（校曆目標 ${calendarTarget}；中途開班可少於此數，不會為湊滿而補建已過日期）`
}
