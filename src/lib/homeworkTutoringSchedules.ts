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
  assignments?: Array<{ teacherId: string; start: string; end: string; room: string }>
}

export type HomeworkScheduleSlot = {
  scheduled_date: string
  start_time: string
  end_time: string
  classroom_id: string | null
  teacher_id: string | null
  roomName: string
}

/** 畫面／DB 日期都收成 M/D（如 9/21）；ISO `2026-09-21` 與 `09/02` 亦可 */
export function toDutyMdKey(date: string): string | null {
  const trimmed = date.trim()
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return `${Number(iso[2])}/${Number(iso[3])}`
  const parts = trimmed.split("/")
  if (parts.length !== 2) return null
  const mm = Number(parts[0])
  const dd = Number(parts[1])
  if (!mm || !dd) return null
  return `${mm}/${dd}`
}

/** M/D 或 ISO → ISO；需與 yearMonth 月份一致 */
export function mdKeyToIso(yearMonth: string, mdKey: string): string | null {
  const [y, m] = yearMonth.split("-").map(Number)
  const key = toDutyMdKey(mdKey)
  if (!y || !m || !key) return null
  const [mm, dd] = key.split("/").map(Number)
  if (!mm || !dd || mm !== m) return null
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

export function isHomeworkOccupancySchedule(row: {
  class_kind?: string | null
  remarks?: string | null
}): boolean {
  if (row.class_kind === "homework") return true
  return (row.remarks ?? "").includes(HOMEWORK_SCHEDULE_REMARKS)
}

/** 已加開第二室（primaryRoom 有值）。未加開唔佔 17E。 */
export function isSecondHomeworkRoomOpen(
  day: Pick<HomeworkDutyForSchedule, "primaryRoom">
): boolean {
  return Boolean(day.primaryRoom?.trim())
}

function occupancyTeacherId(
  dutyDay: HomeworkDutyForSchedule,
  roomName: string
): string | null {
  const fromAssign = (dutyDay.assignments ?? [])
    .filter((a) => (a.room || "").trim() === roomName)
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  if (fromAssign?.teacherId) return fromAssign.teacherId
  const aName = dutyDay.secondaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_A
  if (roomName === aName) return dutyDay.secondaryTeacherId ?? null
  return dutyDay.primaryTeacherId ?? null
}

export function homeworkOccupancyRooms(
  dutyDay: HomeworkDutyForSchedule
): Array<{ name: string; teacherId: string | null }> {
  const roomA = dutyDay.secondaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_A
  const rooms: Array<{ name: string; teacherId: string | null }> = [
    { name: roomA, teacherId: occupancyTeacherId(dutyDay, roomA) },
  ]
  const roomB = dutyDay.primaryRoom?.trim()
  if (roomB && roomB !== roomA) {
    rooms.push({ name: roomB, teacherId: occupancyTeacherId(dutyDay, roomB) })
  }
  return rooms
}

/** 一日已開嘅房先佔；放假或無日期則空陣列。佔室時間仍全日（15:15 起）；老師名取該室第一人。 */
export function homeworkScheduleSlotsFromDutyDay(
  dutyDay: HomeworkDutyForSchedule,
  yearMonth: string,
  roomIdByName: Map<string, string>
): HomeworkScheduleSlot[] {
  if (dutyDay.holiday) return []
  const iso = mdKeyToIso(yearMonth, dutyDay.date)
  if (!iso) return []

  const end = dutyDay.end?.trim() || "19:30"
  return homeworkOccupancyRooms(dutyDay).map(({ name, teacherId }) => ({
    scheduled_date: iso,
    start_time: HOMEWORK_OCCUPANCY_START,
    end_time: end,
    classroom_id: resolveRoomId(name, roomIdByName),
    teacher_id: teacherId,
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
