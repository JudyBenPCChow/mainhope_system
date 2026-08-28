/** 功輔編更 → schedules 佔室（對齊 SCHEDULING_RULES §4） */

export const HOMEWORK_OCCUPANCY_START = "15:15"
export const HOMEWORK_SCHEDULE_REMARKS = "功輔佔室"
export const HOMEWORK_DEFAULT_ROOM_A = "17D"
export const HOMEWORK_DEFAULT_ROOM_B = "17E"

export type HomeworkDutyForSchedule = {
  date: string
  holiday?: string
  start: string
  end: string
  secondaryRoom: string | null
  primaryRoom: string | null
  secondaryTeacherId?: string
  primaryTeacherId?: string
}

export type HomeworkScheduleSlot = {
  scheduled_date: string
  start_time: string
  end_time: string
  classroom_id: string | null
  teacher_id: string | null
  roomName: string
}

/** M/D（如 10/2）→ ISO；需與 yearMonth 月份一致 */
export function mdKeyToIso(yearMonth: string, mdKey: string): string | null {
  const [y, m] = yearMonth.split("-").map(Number)
  const parts = mdKey.trim().split("/")
  if (parts.length !== 2) return null
  const mm = Number(parts[0])
  const dd = Number(parts[1])
  if (!y || !m || !mm || !dd || mm !== m) return null
  return `${y}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`
}

export function monthDateRange(yearMonth: string): { from: string; to: string } | null {
  const [ys, ms] = yearMonth.split("-")
  const year = Number(ys)
  const month = Number(ms)
  if (!year || !month || month < 1 || month > 12) return null
  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return { from, to }
}

function resolveRoomId(name: string | null | undefined, roomIdByName: Map<string, string>): string | null {
  const key = (name ?? "").trim()
  if (!key) return null
  return roomIdByName.get(key) ?? null
}

/** 一日兩室佔用；放假或無日期則空陣列 */
export function homeworkScheduleSlotsFromDutyDay(
  dutyDay: HomeworkDutyForSchedule,
  yearMonth: string,
  roomIdByName: Map<string, string>
): HomeworkScheduleSlot[] {
  if (dutyDay.holiday) return []
  const iso = mdKeyToIso(yearMonth, dutyDay.date)
  if (!iso) return []

  const end = dutyDay.end?.trim() || "19:30"
  const rooms: Array<{ name: string; teacherId?: string }> = [
    { name: dutyDay.secondaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_A, teacherId: dutyDay.secondaryTeacherId },
    { name: dutyDay.primaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_B, teacherId: dutyDay.primaryTeacherId },
  ]

  return rooms.map(({ name, teacherId }) => ({
    scheduled_date: iso,
    start_time: HOMEWORK_OCCUPANCY_START,
    end_time: end,
    classroom_id: resolveRoomId(name, roomIdByName),
    teacher_id: teacherId ?? null,
    roomName: name,
  }))
}

export function homeworkScheduleSlotsFromDutyDays(
  dutyDays: HomeworkDutyForSchedule[],
  yearMonth: string,
  roomIdByName: Map<string, string>
): HomeworkScheduleSlot[] {
  return dutyDays.flatMap((d) => homeworkScheduleSlotsFromDutyDay(d, yearMonth, roomIdByName))
}
