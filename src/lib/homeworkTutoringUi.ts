/** 功輔畫面共用型別與純函式（不連 DB、不含假資料） */

import { formatYearMonthLabel, homeworkMonthlyFeeHkd } from "@/lib/homeworkTutoringFees"
import {
  HOMEWORK_DEFAULT_ROOM_A,
  HOMEWORK_DEFAULT_ROOM_B,
  toDutyMdKey,
} from "@/lib/homeworkTutoringSchedules"
import { MONTH_CALENDAR_WEEK_HEADERS } from "@/lib/monthCalendar"

export { formatYearMonthLabel, HOMEWORK_DEFAULT_ROOM_A, HOMEWORK_DEFAULT_ROOM_B }
export { MONTH_CALENDAR_WEEK_HEADERS as CALENDAR_WEEK_HEADERS }

export type DayPlan = "三日" | "四日" | "五日" | "七日"
export type Weekday = "一" | "二" | "三" | "四" | "五"
export type EnrollStatus = "在籍" | "暫停" | "結束"
export type FeeStatus = "已收款" | "未收款"
export type RosterPublishStatus = "草稿" | "已發布"
export type MonthRosterState = "未編更" | "已編更"
export type SubmitStatus = "未交" | "草稿" | "已提交"

export function monthRosterToLock(state: MonthRosterState): RosterPublishStatus {
  return state === "已編更" ? "已發布" : "草稿"
}

/** 有填＝可當值；未填＝該日不報 */
export type AvailEntry =
  | { kind: "full" }
  | { kind: "custom"; start: string; end: string }

export const WEEKDAY_OPTIONS: Weekday[] = ["一", "二", "三", "四", "五"]

export const DEFAULT_CUSTOM_START = "15:30"
export const DEFAULT_CUSTOM_END = "19:30"
export const HW_SESSION_START = "15:30"
export const HW_SESSION_END = "19:30"

export type HomeworkStudentRow = {
  id: string
  name: string
  code: string
  grade: string
  plan: DayPlan
  weekdays: Weekday[]
  effectiveMonth: string
  status: EnrollStatus
}

export function formatWeekdays(days: Weekday[]): string {
  if (days.length === 0) return "—"
  return days.map((d) => `星期${d}`).join("、")
}

export function formatWeekdaysShort(days: Weekday[]): string {
  if (days.length === 0) return "—"
  return days.join("／")
}

export type HomeworkFeeDisplay = {
  studentId: string
  amountLabel: string
  status: FeeStatus
  receiptNumber?: string | null
  classId?: string
}

export type HomeworkTeacherRow = { id: string; name: string; subject: string }

/** 一日當值一人一時段；可多人。時段默認跟報更。 */
export type HomeworkDutyAssignment = {
  teacherId: string
  start: string
  end: string
  room: string
}

/** 月工作表一日：場次兩室（17D／17E）；當值以 assignments 為準 */
export type HomeworkDutyDay = {
  date: string
  weekday: string
  holiday?: string
  start: string
  end: string
  secondaryRoom: string | null
  primaryRoom: string | null
  assignments: HomeworkDutyAssignment[]
  /** 每室第一人；寫佔室／舊欄用，畫面以 assignments 為準 */
  secondaryTeacherId?: string
  primaryTeacherId?: string
}

export type HomeworkHoliday = { date: string; label: string }

export const SUBMIT_DEADLINE_NOTE =
  "請於該月最後一日起倒數第 3 日前提交（例：31→29、30→28）；過期仍可補交至月工作表發布前。剔選日子後批量設全節或自訂時間；不報的日子不剔即可。"

export const HW_ROSTER_FLOW_NOTE = "老師提交可當值日子與時段；行政匯總後發布月工作表。"

export const HOMEWORK_GRADE_FILTER_FALLBACK = [
  "小一",
  "小二",
  "小三",
  "小四",
  "小五",
  "小六",
  "中一",
  "中二",
  "中三",
  "中四",
  "中五",
  "中六",
] as const

const WEEKDAY_CHARS = ["日", "一", "二", "三", "四", "五", "六"] as const

export type RosterDay = {
  key: string
  day: number
  weekdayIndex: number
  weekdayChar: string
  selectable: boolean
  holidayLabel?: string
}

export function listRosterMonthDays(
  yearMonth: string,
  holidays: { date: string; label: string }[] = []
): RosterDay[] {
  const [ys, ms] = yearMonth.split("-")
  const year = Number(ys)
  const month = Number(ms)
  if (!year || !month) return []
  const holidayByKey = new Map<string, string>()
  for (const h of holidays) {
    const key = toDutyMdKey(h.date)
    if (key) holidayByKey.set(key, h.label)
  }
  const lastDay = new Date(year, month, 0).getDate()
  const days: RosterDay[] = []
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month - 1, day)
    const weekdayIndex = date.getDay()
    const key = `${month}/${day}`
    const holidayLabel = holidayByKey.get(key)
    const isWeekday = weekdayIndex >= 1 && weekdayIndex <= 5
    days.push({
      key,
      day,
      weekdayIndex,
      weekdayChar: WEEKDAY_CHARS[weekdayIndex]!,
      selectable: isWeekday && !holidayLabel,
      holidayLabel,
    })
  }
  return days
}

export type AllTeacherAvailability = Record<string, Record<string, AvailEntry>>
export type AllTeacherSubmitStatus = Record<string, SubmitStatus>

export function defaultCustomEntry(): AvailEntry {
  return { kind: "custom", start: DEFAULT_CUSTOM_START, end: DEFAULT_CUSTOM_END }
}

export function getAvailEntry(
  avail: AllTeacherAvailability,
  teacherId: string,
  date: string
): AvailEntry | null {
  const row = avail[teacherId]
  if (!row) return null
  if (row[date]) return row[date]
  const want = toDutyMdKey(date)
  if (!want) return null
  if (row[want]) return row[want]
  for (const [key, entry] of Object.entries(row)) {
    if (toDutyMdKey(key) === want) return entry
  }
  return null
}

export function formatAvailLabel(entry: AvailEntry | null): string {
  if (!entry) return "—"
  if (entry.kind === "full") return "全節"
  return `${entry.start}–${entry.end}`
}

export function isAvailActive(entry: AvailEntry | null): boolean {
  return entry != null
}

export function countSubmitProgress(
  status: AllTeacherSubmitStatus,
  teachers: readonly HomeworkTeacherRow[]
) {
  let submitted = 0
  let draft = 0
  let missing = 0
  for (const t of teachers) {
    const s = status[t.id] ?? "未交"
    if (s === "已提交") submitted += 1
    else if (s === "草稿") draft += 1
    else missing += 1
  }
  return {
    total: teachers.length,
    submitted,
    draft,
    missing,
    rateLabel: `${submitted}/${teachers.length} 已提交`,
  }
}

export function teacherName(
  id: string | undefined,
  teachers: readonly HomeworkTeacherRow[]
): string {
  const teacherId = teacherIdOf(id)
  if (teacherId) {
    const fromRow = personLabel(teachers.find((t) => t.id === teacherId)?.name)
    if (fromRow !== "—") return fromRow
  }
  if (id && typeof id === "object") return personLabel(id)
  return "—"
}

function teacherIdOf(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (value && typeof value === "object" && "id" in value) {
    const inner = (value as { id: unknown }).id
    if (typeof inner === "string" && inner.trim()) return inner.trim()
  }
  return undefined
}

function personLabel(value: unknown): string {
  if (typeof value === "string" && value.trim() && value !== "[object Object]") return value.trim()
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>
    for (const key of ["full_name", "name", "displayName"]) {
      if (typeof rec[key] === "string" && rec[key].trim()) return rec[key].trim()
    }
  }
  return "—"
}

function asHm(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const sliced = value.slice(0, 5)
    if (/^\d{2}:\d{2}$/.test(sliced)) return sliced
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>
    if (typeof rec.start === "string") return asHm(rec.start, fallback)
  }
  return fallback
}

function asRoom(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : HOMEWORK_DEFAULT_ROOM_A
}

export function dutyTeacherLabel(
  id: string | undefined,
  published: boolean,
  teachers: readonly HomeworkTeacherRow[]
): string {
  if (id) return teacherName(id, teachers)
  return published ? "暫時空缺" : "—"
}

export function isSecondRoomOpen(day?: Pick<HomeworkDutyDay, "primaryRoom"> | null): boolean {
  return Boolean(day?.primaryRoom?.trim())
}

/** secondary_* → 預設 17D；primary_* → 已加開先有第二房（預設 17E） */
export function roomALabel(day?: Pick<HomeworkDutyDay, "secondaryRoom"> | null): string {
  return day?.secondaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_A
}

export function roomBLabel(day?: Pick<HomeworkDutyDay, "primaryRoom"> | null): string {
  return day?.primaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_B
}

export function openedHomeworkRoomNames(day: HomeworkDutyDay): string[] {
  const a = roomALabel(day)
  if (!isSecondRoomOpen(day)) return [a]
  const b = roomBLabel(day)
  return b === a ? [a] : [a, b]
}

export function openSecondHomeworkRoom(
  day: HomeworkDutyDay,
  roomName: string = HOMEWORK_DEFAULT_ROOM_B
): HomeworkDutyDay {
  const name = roomName.trim() || HOMEWORK_DEFAULT_ROOM_B
  if (name === roomALabel(day)) return day
  return withSyncedLegacyTeachers({ ...day, primaryRoom: name })
}

export function closeSecondHomeworkRoom(day: HomeworkDutyDay): HomeworkDutyDay {
  const a = roomALabel(day)
  const b = day.primaryRoom?.trim()
  const nextAssignments = dutyAssignments(day).map((x) =>
    b && x.room === b ? { ...x, room: a } : x
  )
  return withSyncedLegacyTeachers({
    ...day,
    primaryRoom: null,
    assignments: nextAssignments,
  })
}

export function todayDateKey(now: Date = new Date()): string {
  return `${now.getMonth() + 1}/${now.getDate()}`
}

export function availDatesForMonth(
  yearMonth: string,
  holidays: { date: string; label: string }[] = []
): string[] {
  return listRosterMonthDays(yearMonth, holidays)
    .filter((d) => d.selectable)
    .map((d) => d.key)
}

export function holidaysInYearMonth(
  yearMonth: string,
  holidays: { date: string; label: string }[]
): { date: string; label: string }[] {
  const monthNum = Number(yearMonth.split("-")[1])
  if (!monthNum) return []
  return holidays.filter((h) => dutyKeyMonth(h.date) === monthNum)
}

export function currentYearMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [ys, ms] = yearMonth.split("-")
  const date = new Date(Number(ys), Number(ms) - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** 學年 label → 可揀月份範圍。常規 9–6；暑期 7–8。 */
export function academicYearMonthBounds(label: string): { min: string; max: string } {
  const t = label.trim()
  const sm = t.match(/^(\d{2})SM$/i)
  if (sm) {
    const year = 2000 + Number(sm[1])
    return { min: `${year}-07`, max: `${year}-08` }
  }
  const regular = t.match(/^(\d{2})(\d{2})$/)
  if (regular) {
    const startY = 2000 + Number(regular[1])
    const endY = 2000 + Number(regular[2])
    return { min: `${startY}-09`, max: `${endY}-06` }
  }
  return { min: "2026-09", max: "2027-06" }
}

export function clampYearMonth(yearMonth: string, min: string, max: string): string {
  if (yearMonth < min) return min
  if (yearMonth > max) return max
  return yearMonth
}

export function teachersAvailableOnDay(
  avail: AllTeacherAvailability,
  dateKey: string,
  teachers: readonly HomeworkTeacherRow[]
): HomeworkTeacherRow[] {
  return teachers.filter((t) => isAvailActive(getAvailEntry(avail, t.id, dateKey)))
}

export function substituteTeachers(
  avail: AllTeacherAvailability,
  dateKey: string,
  assignedIds: Array<string | undefined>,
  teachers: readonly HomeworkTeacherRow[]
): HomeworkTeacherRow[] {
  const assigned = new Set(assignedIds.filter(Boolean))
  return teachersAvailableOnDay(avail, dateKey, teachers).filter((t) => !assigned.has(t.id))
}

export function availWindow(entry: AvailEntry | null): { start: string; end: string } {
  if (!entry || entry.kind === "full") {
    return { start: HW_SESSION_START, end: HW_SESSION_END }
  }
  return { start: entry.start, end: entry.end }
}

export function sortDutyAssignments(
  assignments: readonly HomeworkDutyAssignment[]
): HomeworkDutyAssignment[] {
  return [...assignments].sort((a, b) => {
    const start = a.start.localeCompare(b.start)
    if (start !== 0) return start
    const room = a.room.localeCompare(b.room)
    if (room !== 0) return room
    return a.teacherId.localeCompare(b.teacherId)
  })
}

function legacyAssignmentsFromColumns(
  day: Pick<
    HomeworkDutyDay,
    "start" | "end" | "secondaryRoom" | "primaryRoom" | "secondaryTeacherId" | "primaryTeacherId"
  >
): HomeworkDutyAssignment[] {
  const out: HomeworkDutyAssignment[] = []
  if (day.secondaryTeacherId) {
    out.push({
      teacherId: day.secondaryTeacherId,
      start: day.start || HW_SESSION_START,
      end: day.end || HW_SESSION_END,
      room: roomALabel(day),
    })
  }
  if (day.primaryTeacherId) {
    out.push({
      teacherId: day.primaryTeacherId,
      start: day.start || HW_SESSION_START,
      end: day.end || HW_SESSION_END,
      room: roomBLabel(day),
    })
  }
  return out
}

export function dutyAssignments(day: HomeworkDutyDay | null | undefined): HomeworkDutyAssignment[] {
  if (!day) return []
  if (Array.isArray(day.assignments)) return sortDutyAssignments(day.assignments)
  return sortDutyAssignments(legacyAssignmentsFromColumns(day))
}

export function assignedTeacherIds(day: HomeworkDutyDay | null | undefined): string[] {
  return [...new Set(dutyAssignments(day).map((a) => a.teacherId))]
}

export function defaultRoomForNextAssignment(day: HomeworkDutyDay): string {
  const a = roomALabel(day)
  if (!isSecondRoomOpen(day)) return a
  const b = roomBLabel(day)
  const rooms = new Set(dutyAssignments(day).map((x) => x.room))
  if (!rooms.has(a)) return a
  if (!rooms.has(b)) return b
  return a
}

export function makeAssignmentFromAvail(
  teacherId: string,
  entry: AvailEntry | null,
  room: string
): HomeworkDutyAssignment {
  const window = availWindow(entry)
  return { teacherId, start: window.start, end: window.end, room }
}

export function firstAssignmentTeacherForRoom(day: HomeworkDutyDay, roomName: string): string | undefined {
  return dutyAssignments(day).find((a) => a.room === roomName)?.teacherId
}

export function withSyncedLegacyTeachers(day: HomeworkDutyDay): HomeworkDutyDay {
  const assignments = dutyAssignments(day)
  return {
    ...day,
    assignments,
    secondaryTeacherId: firstAssignmentTeacherForRoom({ ...day, assignments }, roomALabel(day)),
    primaryTeacherId: isSecondRoomOpen(day)
      ? firstAssignmentTeacherForRoom({ ...day, assignments }, roomBLabel(day))
      : undefined,
  }
}

/** 排程管理改功輔佔室課室之後，寫返當日編更房號同當值 assignment.room */
export function applyHomeworkOccupancyClassroomMoveToDuty(
  day: HomeworkDutyDay,
  fromRoomName: string,
  toRoomName: string
): HomeworkDutyDay {
  const from = fromRoomName.trim()
  const to = toRoomName.trim()
  if (!from || !to || from === to) return day

  const a = roomALabel(day)
  const secondOpen = isSecondRoomOpen(day)
  const b = secondOpen ? roomBLabel(day) : ""
  const isFromA = from === a
  const isFromB = Boolean(b) && from === b

  let secondaryRoom = day.secondaryRoom
  let primaryRoom = day.primaryRoom
  let assignments = dutyAssignments(day)

  const swapAB = () => {
    secondaryRoom = b
    primaryRoom = a
    assignments = assignments.map((x) => {
      if (x.room === a) return { ...x, room: b }
      if (x.room === b) return { ...x, room: a }
      return x
    })
  }

  if (isFromA && secondOpen && to === b) {
    swapAB()
  } else if (isFromB && to === a) {
    swapAB()
  } else if (isFromA || (!secondOpen && !isFromB)) {
    secondaryRoom = to
    assignments = assignments.map((x) => (x.room === from ? { ...x, room: to } : x))
  } else if (isFromB) {
    primaryRoom = to
    assignments = assignments.map((x) => (x.room === from ? { ...x, room: to } : x))
  } else {
    if (!secondOpen) secondaryRoom = to
    assignments = assignments.map((x) => (x.room === from ? { ...x, room: to } : x))
  }

  return withSyncedLegacyTeachers({
    ...day,
    secondaryRoom,
    primaryRoom,
    assignments,
  })
}

export function formatAssignmentLine(
  assignment: HomeworkDutyAssignment,
  teachers: readonly HomeworkTeacherRow[]
): string {
  const name = teacherName(assignment.teacherId, teachers)
  return `${name} ${formatAssignmentHours(assignment)}`
}

export function formatAssignmentHours(assignment: HomeworkDutyAssignment): string {
  return `${asHm(assignment.start, HW_SESSION_START)}–${asHm(assignment.end, HW_SESSION_END)}`
}

/** 老師月曆格：課室＋名字＋該人時段 */
export function formatCalendarAssignmentLine(
  assignment: HomeworkDutyAssignment,
  teachers: readonly HomeworkTeacherRow[]
): string {
  return `${asRoom(assignment.room)} ${formatAssignmentLine(assignment, teachers)}`
}

export type HomeworkDutyRoomCard = {
  room: string
  assignments: HomeworkDutyAssignment[]
}

/** 主課室無人＝暫時空缺（已開無人）；其餘空房＝不啟用 */
export function homeworkDutyRoomIdleLabel(day: HomeworkDutyDay, room: string): string {
  return asRoom(room) === roomALabel(day) ? "暫時空缺" : "不啟用此課室"
}

/** 一日一卡一課室（主房＋預設第二房）；同房多人按開始時間排（交接） */
export function homeworkDutyRoomCards(
  day: HomeworkDutyDay | undefined
): HomeworkDutyRoomCard[] {
  if (!day || day.holiday) return []
  const people = dutyAssignments(day)
  const rooms = [...openedHomeworkRoomNames(day)]
  if (!isSecondRoomOpen(day) && !rooms.includes(HOMEWORK_DEFAULT_ROOM_B)) {
    rooms.push(HOMEWORK_DEFAULT_ROOM_B)
  }
  for (const a of people) {
    const room = asRoom(a.room)
    if (!rooms.includes(room)) rooms.push(room)
  }
  return rooms.map((room) => ({
    room,
    assignments: people.filter((a) => asRoom(a.room) === room),
  }))
}

export function formatDutyPeople(
  day: HomeworkDutyDay | null | undefined,
  teachers: readonly HomeworkTeacherRow[]
): string {
  if (!day || day.holiday) return "—"
  const list = dutyAssignments(day)
  if (list.length === 0) return "—"
  return list.map((a) => formatAssignmentLine(a, teachers)).join("、")
}

export function myAssignments(day: HomeworkDutyDay, teacherId: string): HomeworkDutyAssignment[] {
  return dutyAssignments(day).filter((a) => a.teacherId === teacherId)
}

export function emptyDutyFromRosterDay(day: RosterDay): HomeworkDutyDay {
  return {
    date: day.key,
    weekday: day.weekdayChar,
    holiday: day.holidayLabel,
    start: HW_SESSION_START,
    end: HW_SESSION_END,
    secondaryRoom: HOMEWORK_DEFAULT_ROOM_A,
    primaryRoom: null,
    assignments: [],
    secondaryTeacherId: undefined,
    primaryTeacherId: undefined,
  }
}

/** 日期鍵的月份數字；ISO、`09/02`、`9/2` 皆可 */
export function dutyKeyMonth(dateKey: string): number {
  const key = toDutyMdKey(dateKey)
  return key ? Number(key.split("/")[0]) : Number.NaN
}

export function findDutyDay(
  days: readonly HomeworkDutyDay[],
  dateKey: string
): HomeworkDutyDay | undefined {
  const want = toDutyMdKey(dateKey)
  if (!want) return undefined
  return days.find((d) => toDutyMdKey(d.date) === want)
}

export function dutyDaysByMdKey(
  days: readonly HomeworkDutyDay[]
): Map<string, HomeworkDutyDay> {
  const map = new Map<string, HomeworkDutyDay>()
  for (const d of days) {
    const key = toDutyMdKey(d.date)
    if (key) map.set(key, d)
  }
  return map
}

/** 該月全部平日／放假日；已有編更紀錄則合併 */
export function buildMonthDutyDays(
  yearMonth: string,
  existing: HomeworkDutyDay[] = [],
  holidays: { date: string; label: string }[] = []
): HomeworkDutyDay[] {
  const cal = listRosterMonthDays(yearMonth, holidays)
  const monthNum = Number(yearMonth.split("-")[1])
  const byKey = new Map<string, HomeworkDutyDay>()
  for (const d of existing) {
    const key = toDutyMdKey(d.date)
    if (!key || dutyKeyMonth(key) !== monthNum) continue
    byKey.set(key, d.date === key ? d : { ...d, date: key })
  }
  return cal
    .filter((d) => d.selectable || Boolean(d.holidayLabel))
    .map((d) => {
      const found = byKey.get(d.key)
      if (!found) return emptyDutyFromRosterDay(d)
      return { ...found, holiday: d.holidayLabel ?? found.holiday }
    })
}

export function formatSession(day: Pick<HomeworkDutyDay, "start" | "end">): string {
  return `${day.start}–${day.end}`
}

export function dutyLabel(
  day: HomeworkDutyDay,
  teachers: readonly HomeworkTeacherRow[]
): string {
  if (day.holiday) return "—"
  return formatDutyPeople(day, teachers)
}

function asWeekday(value: string): Weekday | null {
  return WEEKDAY_OPTIONS.includes(value as Weekday) ? (value as Weekday) : null
}

export function studentsComingOnWeekday(
  students: HomeworkStudentRow[],
  weekday: Weekday | null
) {
  if (!weekday) return []
  return students.filter((s) => s.status === "在籍" && s.weekdays.includes(weekday))
}

export function formatDutyDateHeading(day: HomeworkDutyDay): string {
  return `${day.date}（${day.weekday}）`
}

/** 應繳由價目表計；已繳／未繳只睇繳費紀錄（已收款、未作廢、收款日落在該月） */
export function composeHomeworkFeeDisplays(opts: {
  classId: string
  billingMonth: string
  enrollments: Array<{
    studentId: string
    status: EnrollStatus
    plan: DayPlan
    grade: string
  }>
  paidByStudentId: ReadonlyMap<string, { receiptNumber: string }>
}): HomeworkFeeDisplay[] {
  return opts.enrollments
    .filter((e) => e.status === "在籍" || e.status === "暫停")
    .map((e) => {
      const amount = homeworkMonthlyFeeHkd(e.plan, e.grade, opts.billingMonth)
      const paid = opts.paidByStudentId.get(e.studentId)
      return {
        studentId: e.studentId,
        amountLabel: amount != null ? `$${amount.toLocaleString("en-HK")}` : "—",
        status: paid ? "已收款" : "未收款",
        receiptNumber: paid?.receiptNumber ?? null,
        classId: opts.classId,
      }
    })
}

export function summarizeOverview(
  students: HomeworkStudentRow[],
  fees: HomeworkFeeDisplay[],
  dutyDaysList: HomeworkDutyDay[],
  now: Date = new Date()
) {
  const active = students.filter((s) => s.status === "在籍")
  const feeByStudent = new Map(fees.map((f) => [f.studentId, f]))
  let paid = 0
  let unpaid = 0
  for (const s of active) {
    const fee = feeByStudent.get(s.id)
    if (fee?.status === "已收款") paid += 1
    else unpaid += 1
  }
  const openDutyCount = dutyDaysList.filter((d) => !d.holiday).length
  const todayKey = todayDateKey(now)
  const todayDuty = findDutyDay(dutyDaysList, todayKey) ?? null
  const todayWeekday = todayDuty
    ? asWeekday(todayDuty.weekday)
    : asWeekday(WEEKDAY_CHARS[now.getDay()] ?? "")
  const coming = studentsComingOnWeekday(students, todayWeekday)
  return {
    activeCount: active.length,
    paid,
    unpaid,
    dutyDays: openDutyCount,
    todayDuty,
    todayWeekday,
    todayCount: coming.length,
  }
}

export function unpaidFeeRows(students: HomeworkStudentRow[], fees: HomeworkFeeDisplay[]) {
  return fees
    .map((f) => {
      const s = students.find((x) => x.id === f.studentId)
      if (!s || s.status === "結束" || f.status !== "未收款") return null
      return { ...f, student: s }
    })
    .filter(Boolean) as Array<HomeworkFeeDisplay & { student: HomeworkStudentRow }>
}

export function myDutyDays(teacherId: string, days: HomeworkDutyDay[]) {
  return days.filter((d) => {
    if (d.holiday) return false
    return myAssignments(d, teacherId).length > 0
  })
}

export function myDutyRoomLabel(day: HomeworkDutyDay, teacherId: string): string {
  const mine = myAssignments(day, teacherId)
  if (mine.length === 0) return "—"
  return mine.map((a) => `課室 ${a.room} ${a.start}–${a.end}`).join("；")
}

/** 月曆格用：課室＋自己的時段 */
export function myDutyRoomShort(day: HomeworkDutyDay, teacherId: string): string {
  const mine = myAssignments(day, teacherId)
  if (mine.length === 0) return ""
  const rooms = [...new Set(mine.map((a) => a.room))]
  return rooms.join("／")
}

export function myDutyTimeLabel(day: HomeworkDutyDay, teacherId: string): string {
  const mine = myAssignments(day, teacherId)
  if (mine.length === 0) return "—"
  return mine.map((a) => `${a.start}–${a.end}`).join("、")
}

export function isTeacherOnDutyDay(
  day: HomeworkDutyDay | undefined,
  teacherId: string
): boolean {
  if (!day || day.holiday) return false
  return myAssignments(day, teacherId).length > 0
}

export type MyDutyCalendarTone = "mine" | "other" | "closed"

/** 老師月曆色：自己當值淡橙、其他平日淡藍、週末／放假灰 */
export function myDutyCalendarTone(opts: {
  selectable: boolean
  holidayLabel?: string
  isMine: boolean
}): MyDutyCalendarTone {
  if (!opts.selectable || opts.holidayLabel) return "closed"
  return opts.isMine ? "mine" : "other"
}
