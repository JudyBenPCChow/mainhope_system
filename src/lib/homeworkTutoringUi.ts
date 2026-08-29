/** 功輔畫面共用型別與純函式（不連 DB、不含假資料） */

import { formatYearMonthLabel, homeworkMonthlyFeeHkd } from "@/lib/homeworkTutoringFees"
import {
  HOMEWORK_DEFAULT_ROOM_A,
  HOMEWORK_DEFAULT_ROOM_B,
} from "@/lib/homeworkTutoringSchedules"

export { formatYearMonthLabel, HOMEWORK_DEFAULT_ROOM_A, HOMEWORK_DEFAULT_ROOM_B }

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

/** 月工作表一日：同一場次兩室（17D／17E）；DB 欄仍叫 secondary_*／primary_* */
export type HomeworkDutyDay = {
  date: string
  weekday: string
  holiday?: string
  start: string
  end: string
  secondaryRoom: string | null
  primaryRoom: string | null
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
  const holidayByKey = new Map(holidays.map((h) => [h.date, h.label]))
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
  return avail[teacherId]?.[date] ?? null
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
  if (!id) return "—"
  return teachers.find((t) => t.id === id)?.name ?? "—"
}

export function dutyTeacherLabel(
  id: string | undefined,
  published: boolean,
  teachers: readonly HomeworkTeacherRow[]
): string {
  if (id) return teacherName(id, teachers)
  return published ? "暫時空缺" : "—"
}

/** secondary_* → 預設 17D；primary_* → 預設 17E（兩室同一場，不是學部分班） */
export function roomALabel(day?: Pick<HomeworkDutyDay, "secondaryRoom"> | null): string {
  return day?.secondaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_A
}

export function roomBLabel(day?: Pick<HomeworkDutyDay, "primaryRoom"> | null): string {
  return day?.primaryRoom?.trim() || HOMEWORK_DEFAULT_ROOM_B
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
  return holidays.filter((h) => dateKeyMonth(h.date) === monthNum)
}

export function currentYearMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [ys, ms] = yearMonth.split("-")
  const date = new Date(Number(ys), Number(ms) - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
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

export function emptyDutyFromRosterDay(day: RosterDay): HomeworkDutyDay {
  return {
    date: day.key,
    weekday: day.weekdayChar,
    holiday: day.holidayLabel,
    start: HW_SESSION_START,
    end: HW_SESSION_END,
    secondaryRoom: HOMEWORK_DEFAULT_ROOM_A,
    primaryRoom: HOMEWORK_DEFAULT_ROOM_B,
    secondaryTeacherId: undefined,
    primaryTeacherId: undefined,
  }
}

function dateKeyMonth(dateKey: string): number {
  return Number(dateKey.split("/")[0])
}

/** 該月全部平日／放假日；已有編更紀錄則合併 */
export function buildMonthDutyDays(
  yearMonth: string,
  existing: HomeworkDutyDay[] = [],
  holidays: { date: string; label: string }[] = []
): HomeworkDutyDay[] {
  const cal = listRosterMonthDays(yearMonth, holidays)
  const monthNum = Number(yearMonth.split("-")[1])
  const byKey = new Map(
    existing.filter((d) => dateKeyMonth(d.date) === monthNum).map((d) => [d.date, d])
  )
  return cal
    .filter((d) => d.selectable || Boolean(d.holidayLabel))
    .map((d) => {
      const found = byKey.get(d.key)
      if (!found) return emptyDutyFromRosterDay(d)
      return { ...found, holiday: d.holidayLabel ?? found.holiday }
    })
}

export const CALENDAR_WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"] as const

export function formatSession(day: Pick<HomeworkDutyDay, "start" | "end">): string {
  return `${day.start}–${day.end}`
}

export function dutyLabel(
  day: HomeworkDutyDay,
  teachers: readonly HomeworkTeacherRow[]
): string {
  if (day.holiday) return "—"
  const a = roomALabel(day)
  const b = roomBLabel(day)
  return `${a} ${teacherName(day.secondaryTeacherId, teachers)}／${b} ${teacherName(day.primaryTeacherId, teachers)}`
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
  const todayDuty = dutyDaysList.find((d) => d.date === todayKey) ?? null
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
    return d.secondaryTeacherId === teacherId || d.primaryTeacherId === teacherId
  })
}

export function myDutyRoomLabel(day: HomeworkDutyDay, teacherId: string): string {
  const parts: string[] = []
  if (day.secondaryTeacherId === teacherId) {
    parts.push(`課室 ${roomALabel(day)}`)
  }
  if (day.primaryTeacherId === teacherId) {
    parts.push(`課室 ${roomBLabel(day)}`)
  }
  return parts.join("；") || "—"
}
