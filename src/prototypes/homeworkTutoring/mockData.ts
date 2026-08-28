/** 功輔 UI 沙盒假資料 — 不連接服務／資料庫 */

export type DayPlan = "三日" | "四日" | "五日" | "七日"
export type Weekday = "一" | "二" | "三" | "四" | "五"
export type EnrollStatus = "在籍" | "暫停" | "結束"
export type FeeStatus = "已收款" | "未收款"
export type RosterPublishStatus = "草稿" | "已發布"
export type MonthRosterState = "未編更" | "已編更"

export function monthRosterToLock(state: MonthRosterState): RosterPublishStatus {
  return state === "已編更" ? "已發布" : "草稿"
}
/** 老師報更（針對報更目標月，沙盒為 10 月）— 一次提交，不分學部 */
export type SubmitStatus = "未交" | "草稿" | "已提交"

/** 功輔學部：行政編更時分配當日中／小學導師 */
export type HwDivision = "secondary" | "primary"

export const HW_DIVISIONS: { value: HwDivision; label: string }[] = [
  { value: "secondary", label: "中學部" },
  { value: "primary", label: "小學部" },
]

/** 有填＝可當值；未填＝該日不報（不用標「不可」） */
export type AvailEntry =
  | { kind: "full" }
  | { kind: "custom"; start: string; end: string }

export type SandboxRole = "admin" | "manager" | "teacher"

export const WEEKDAY_OPTIONS: Weekday[] = ["一", "二", "三", "四", "五"]

export const DEFAULT_CUSTOM_START = "15:30"
export const DEFAULT_CUSTOM_END = "19:30"
export const MOCK_SESSION_START = "15:30"
export const MOCK_SESSION_END = "19:30"
export const MOCK_ROOMS = ["17D", "17E"] as const

export type MockStudent = {
  id: string
  name: string
  code: string
  grade: string
  plan: DayPlan
  /** 慣常到校星期（一至五）；作紀錄用，不限制實際到校 */
  weekdays: Weekday[]
  effectiveMonth: string
  status: EnrollStatus
}

export function planDayCount(plan: DayPlan): number {
  if (plan === "三日") return 3
  if (plan === "四日") return 4
  if (plan === "五日") return 5
  return 7
}

export function formatWeekdays(days: Weekday[]): string {
  if (days.length === 0) return "—"
  return days.map((d) => `星期${d}`).join("、")
}

export function formatWeekdaysShort(days: Weekday[]): string {
  if (days.length === 0) return "—"
  return days.join("／")
}

export type MockFeeRow = {
  studentId: string
  amountLabel: string
  status: FeeStatus
}

export type MockTeacher = { id: string; name: string; subject: string }

/** 專科老師名單；功輔側欄入口由管理層剔選，唔係全體自動有 */
export const MOCK_SUBJECT_TEACHERS: MockTeacher[] = [
  { id: "t1", name: "陳老師", subject: "數學" },
  { id: "t2", name: "王老師", subject: "英文" },
  { id: "t3", name: "林老師", subject: "中文" },
  { id: "t4", name: "李老師", subject: "物理" },
  { id: "t5", name: "黃老師", subject: "化學" },
  { id: "t6", name: "周老師", subject: "生物" },
]

/** 預設有功課輔導班側欄入口（可報更） */
export const MOCK_DEFAULT_HW_ACCESS_IDS: readonly string[] = ["t1", "t2", "t3"]

export function cloneHwAccessIds(): Set<string> {
  return new Set(MOCK_DEFAULT_HW_ACCESS_IDS)
}

export function teachersWithHwAccess(accessIds: ReadonlySet<string>): MockTeacher[] {
  return MOCK_SUBJECT_TEACHERS.filter((t) => accessIds.has(t.id))
}

/** 月工作表一日：中／小學部分配導師＋課室；班時間可改 */
export type MockDutyDay = {
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

export type MockHoliday = { date: string; label: string }

export const MOCK_MONTH_LABEL = "2026年9月"
/** 老師報更／行政匯總所針對的月份（下月） */
export const MOCK_ROSTER_MONTH_LABEL = "2026年10月"
export const MOCK_ROSTER_MONTH_KEY = "2026-10"
export const MOCK_ACADEMIC_YEAR = "2627"
export const MOCK_DEFAULT_SECONDARY_ROOM = "17D"
export const MOCK_DEFAULT_PRIMARY_ROOM = "17E"
export const MOCK_SPLIT_NOTE = "老師提交可當值日子與時段；行政匯總後發布月工作表。"
/** 報更截止＝該月末日倒數第 3 日（含末日）＝末日 − 2；過截止仍可補交至發布前 */
export const SUBMIT_DEADLINE_NOTE =
  "請於該月最後一日起倒數第 3 日前提交（例：31→29、30→28）；過期仍可補交至月工作表發布前。剔選日子後批量設全節或自訂時間；不報的日子不剔即可。"
/** @deprecated 用 SUBMIT_DEADLINE_NOTE */
export const MOCK_SUBMIT_DEADLINE_NOTE = SUBMIT_DEADLINE_NOTE

const WEEKDAY_CHARS = ["日", "一", "二", "三", "四", "五", "六"] as const

/** 報更月曆一日（顯示整月；可剔選＝平日且非功輔放假） */
export type RosterDay = {
  key: string
  day: number
  weekdayIndex: number
  weekdayChar: string
  selectable: boolean
  holidayLabel?: string
}

/** 列出報更目標月每一日（含週末；週末／放假不可剔選） */
export function listRosterMonthDays(
  yearMonth: string = MOCK_ROSTER_MONTH_KEY,
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

/** 報更／當值示範＝預設有功輔入口嘅專科老師 */
export const MOCK_TEACHERS: MockTeacher[] = teachersWithHwAccess(
  new Set(MOCK_DEFAULT_HW_ACCESS_IDS)
)

export const MOCK_STUDENTS: MockStudent[] = [
  { id: "s1", name: "王小明", code: "S0123", grade: "中二", plan: "四日", weekdays: ["一", "二", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s2", name: "李小華", code: "S0456", grade: "中四", plan: "五日", weekdays: ["一", "二", "三", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s3", name: "張嘉欣", code: "S0789", grade: "中一", plan: "三日", weekdays: ["一", "三", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s4", name: "陳浩然", code: "S1011", grade: "中三", plan: "四日", weekdays: ["二", "三", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s5", name: "黃詩婷", code: "S1213", grade: "中五", plan: "五日", weekdays: ["一", "二", "三", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s6", name: "林俊傑", code: "S1415", grade: "中二", plan: "三日", weekdays: ["二", "四", "五"], effectiveMonth: "2026-09", status: "暫停" },
  { id: "s7", name: "吳詠琳", code: "S1617", grade: "中六", plan: "四日", weekdays: ["一", "三", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s8", name: "周柏宇", code: "S1819", grade: "中一", plan: "五日", weekdays: ["一", "二", "三", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s9", name: "馬子軒", code: "S2021", grade: "中三", plan: "三日", weekdays: ["一", "二", "四"], effectiveMonth: "2026-10", status: "在籍" },
  { id: "s10", name: "何雅文", code: "S2223", grade: "中四", plan: "四日", weekdays: ["一", "二", "三", "五"], effectiveMonth: "2026-08", status: "結束" },
  { id: "s11", name: "鄭樂怡", code: "S2425", grade: "小四", plan: "四日", weekdays: ["一", "二", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s12", name: "許俊朗", code: "S2627", grade: "小五", plan: "五日", weekdays: ["一", "二", "三", "四", "五"], effectiveMonth: "2026-09", status: "在籍" },
  { id: "s13", name: "梁心悠", code: "S2829", grade: "小三", plan: "三日", weekdays: ["一", "三", "五"], effectiveMonth: "2026-09", status: "在籍" },
]

export const MOCK_FEES: MockFeeRow[] = [
  { studentId: "s1", amountLabel: "—", status: "已收款" },
  { studentId: "s2", amountLabel: "—", status: "已收款" },
  { studentId: "s3", amountLabel: "—", status: "未收款" },
  { studentId: "s4", amountLabel: "—", status: "已收款" },
  { studentId: "s5", amountLabel: "—", status: "未收款" },
  { studentId: "s6", amountLabel: "—", status: "未收款" },
  { studentId: "s7", amountLabel: "—", status: "已收款" },
  { studentId: "s8", amountLabel: "—", status: "已收款" },
  { studentId: "s9", amountLabel: "—", status: "未收款" },
  { studentId: "s11", amountLabel: "—", status: "未收款" },
  { studentId: "s12", amountLabel: "—", status: "已收款" },
  { studentId: "s13", amountLabel: "—", status: "未收款" },
]

export type AllTeacherAvailability = Record<string, Record<string, AvailEntry>>
export type AllTeacherSubmitStatus = Record<string, SubmitStatus>

const FULL: AvailEntry = { kind: "full" }

function custom(start: string, end: string): AvailEntry {
  return { kind: "custom", start, end }
}

/** 示範：各月可上班（key＝M/D；空白＝不報） */
export const MOCK_AVAILABILITY: AllTeacherAvailability = {
  t1: {
    "8/24": FULL,
    "8/25": FULL,
    "8/26": custom("15:30", "17:00"),
    "9/1": FULL,
    "9/2": FULL,
    "9/3": FULL,
    "9/4": FULL,
    "9/5": FULL,
    "9/8": FULL,
    "9/9": FULL,
    "9/12": custom("17:00", "19:30"),
    "10/2": FULL,
    "10/3": FULL,
    "10/6": custom("15:30", "17:00"),
    "10/7": FULL,
  },
  t2: {
    "8/24": custom("17:00", "19:30"),
    "8/27": FULL,
    "9/1": FULL,
    "9/3": FULL,
    "9/4": FULL,
    "9/5": FULL,
    "9/8": custom("15:30", "17:00"),
    "9/9": FULL,
    "9/10": FULL,
    "9/11": FULL,
    "10/2": custom("17:00", "19:30"),
    "10/6": FULL,
    "10/7": custom("17:00", "19:30"),
    "10/8": FULL,
  },
  t3: {
    "8/26": FULL,
    "8/28": FULL,
    "9/1": custom("17:00", "19:30"),
    "9/2": FULL,
    "9/3": custom("15:30", "17:00"),
    "9/4": FULL,
    "9/10": FULL,
    "9/11": FULL,
    "9/12": FULL,
    "10/3": custom("15:30", "17:00"),
    "10/7": FULL,
    "10/8": custom("17:00", "19:30"),
  },
}

/** 10 月整月日曆（含週末）；可報更日子見 selectable */
export const MOCK_ROSTER_DAYS: RosterDay[] = listRosterMonthDays(MOCK_ROSTER_MONTH_KEY)

/** 可報更平日 keys（行政匯總格用） */
export const MOCK_AVAIL_DATES: string[] = MOCK_ROSTER_DAYS.filter((d) => d.selectable).map(
  (d) => d.key
)

export const MOCK_SUBMIT_STATUS: AllTeacherSubmitStatus = {
  t1: "已提交",
  t2: "草稿",
  t3: "未交",
}

export function defaultCustomEntry(): AvailEntry {
  return custom(DEFAULT_CUSTOM_START, DEFAULT_CUSTOM_END)
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

export function cloneAvailability(): AllTeacherAvailability {
  return structuredClone(MOCK_AVAILABILITY)
}

export function cloneSubmitStatus(): AllTeacherSubmitStatus {
  return { ...MOCK_SUBMIT_STATUS }
}

export function countSubmitProgress(
  status: AllTeacherSubmitStatus,
  teachers: MockTeacher[] = MOCK_TEACHERS
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

function openDay(
  date: string,
  weekday: string,
  secondaryTeacherId: string,
  primaryTeacherId: string,
  secondaryRoom: string = MOCK_DEFAULT_SECONDARY_ROOM,
  primaryRoom: string = MOCK_DEFAULT_PRIMARY_ROOM,
  start: string = MOCK_SESSION_START,
  end: string = MOCK_SESSION_END
): MockDutyDay {
  return {
    date,
    weekday,
    start,
    end,
    secondaryRoom,
    primaryRoom,
    secondaryTeacherId,
    primaryTeacherId,
  }
}

export const MOCK_DUTY_DAYS: MockDutyDay[] = [
  openDay("9/1", "一", "t1", "t2"),
  openDay("9/2", "二", "t1", "t3"),
  openDay("9/3", "三", "t1", "t2", "17D", "17E", "15:30", "19:00"),
  openDay("9/4", "四", "t2", "t3"),
  openDay("9/5", "五", "t2", "t1", "17E", "17D"),
  openDay("9/8", "一", "t1", "t3"),
  openDay("9/9", "二", "t3", "t2"),
  {
    date: "9/18",
    weekday: "五",
    holiday: "中秋翌日（功輔放假）",
    start: MOCK_SESSION_START,
    end: MOCK_SESSION_END,
    secondaryRoom: null,
    primaryRoom: null,
  },
]

export const MOCK_HOLIDAYS: MockHoliday[] = [
  { date: "9/18", label: "中秋翌日（功輔放假）" },
  { date: "9/30", label: "校方進修日（功輔放假）" },
]

export const MOCK_PRICE_GRADES = [
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

export function studentDivision(grade: string): HwDivision {
  return grade.startsWith("小") ? "primary" : "secondary"
}

export function teacherName(
  id: string | undefined,
  teachers: readonly MockTeacher[] = MOCK_SUBJECT_TEACHERS
): string {
  if (!id) return "—"
  return teachers.find((t) => t.id === id)?.name ?? "—"
}

export function dutyTeacherLabel(
  id: string | undefined,
  published: boolean,
  teachers: readonly MockTeacher[] = MOCK_SUBJECT_TEACHERS
): string {
  if (id) return teacherName(id, teachers)
  return published ? "暫時空缺" : "—"
}

/** secondary_* → 預設 17D；primary_* → 預設 17E */
export function roomALabel(day?: Pick<MockDutyDay, "secondaryRoom"> | null): string {
  return day?.secondaryRoom?.trim() || MOCK_DEFAULT_SECONDARY_ROOM
}

export function roomBLabel(day?: Pick<MockDutyDay, "primaryRoom"> | null): string {
  return day?.primaryRoom?.trim() || MOCK_DEFAULT_PRIMARY_ROOM
}

export function todayDateKey(now: Date = new Date()): string {
  return `${now.getMonth() + 1}/${now.getDate()}`
}

/** 該月可報更平日（M/D），供可上班時段表頭 */
export function availDatesForMonth(
  yearMonth: string,
  holidays: { date: string; label: string }[] = []
): string[] {
  return listRosterMonthDays(yearMonth, holidays)
    .filter((d) => d.selectable)
    .map((d) => d.key)
}

/** 從完整假日列表濾出該月（假日 date 為 M/D） */
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

export function formatYearMonthLabel(yearMonth: string): string {
  const [ys, ms] = yearMonth.split("-")
  const year = Number(ys)
  const month = Number(ms)
  if (!year || !month) return yearMonth
  return `${year}年${month}月`
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [ys, ms] = yearMonth.split("-")
  const date = new Date(Number(ys), Number(ms) - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function holidaysForMonth(yearMonth: string): MockHoliday[] {
  if (yearMonth === "2026-09") return MOCK_HOLIDAYS
  return []
}

export function teachersAvailableOnDay(
  avail: AllTeacherAvailability,
  dateKey: string,
  teachers: readonly MockTeacher[] = MOCK_SUBJECT_TEACHERS
): MockTeacher[] {
  return teachers.filter((t) => isAvailActive(getAvailEntry(avail, t.id, dateKey)))
}

export function substituteTeachers(
  avail: AllTeacherAvailability,
  dateKey: string,
  assignedIds: Array<string | undefined>,
  teachers: readonly MockTeacher[] = MOCK_SUBJECT_TEACHERS
): MockTeacher[] {
  const assigned = new Set(assignedIds.filter(Boolean))
  return teachersAvailableOnDay(avail, dateKey, teachers).filter((t) => !assigned.has(t.id))
}

export function emptyDutyFromRosterDay(day: RosterDay): MockDutyDay {
  return {
    date: day.key,
    weekday: day.weekdayChar,
    holiday: day.holidayLabel,
    start: MOCK_SESSION_START,
    end: MOCK_SESSION_END,
    secondaryRoom: MOCK_DEFAULT_SECONDARY_ROOM,
    primaryRoom: MOCK_DEFAULT_PRIMARY_ROOM,
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
  existing: MockDutyDay[] = [],
  holidays: { date: string; label: string }[] = holidaysForMonth(yearMonth)
): MockDutyDay[] {
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

export const MOCK_MONTH_ROSTER_STATUS: Record<string, MonthRosterState> = {
  "2026-09": "已編更",
}

export const CALENDAR_WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"] as const

export function formatSession(day: Pick<MockDutyDay, "start" | "end">): string {
  return `${day.start}–${day.end}`
}

export function dutyLabel(
  day: MockDutyDay,
  teachers: readonly MockTeacher[] = MOCK_SUBJECT_TEACHERS
): string {
  if (day.holiday) return "—"
  const a = roomALabel(day)
  const b = roomBLabel(day)
  return `${a} ${teacherName(day.secondaryTeacherId, teachers)}／${b} ${teacherName(day.primaryTeacherId, teachers)}`
}

function asWeekday(value: string): Weekday | null {
  return WEEKDAY_OPTIONS.includes(value as Weekday) ? (value as Weekday) : null
}

/** 在籍且慣常到校星期包含該日 */
export function studentsComingOnWeekday(students: MockStudent[], weekday: Weekday | null) {
  if (!weekday) return []
  return students.filter((s) => s.status === "在籍" && s.weekdays.includes(weekday))
}

export function formatDutyDateHeading(day: MockDutyDay): string {
  return `${day.date}（${day.weekday}）`
}

export function summarizeOverview(
  students: MockStudent[],
  fees: MockFeeRow[],
  dutyDaysList: MockDutyDay[] = MOCK_DUTY_DAYS,
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
    todayPrimary: coming.filter((s) => studentDivision(s.grade) === "primary").length,
    todaySecondary: coming.filter((s) => studentDivision(s.grade) === "secondary").length,
  }
}

export function unpaidFeeRows(students: MockStudent[], fees: MockFeeRow[]) {
  return fees
    .map((f) => {
      const s = students.find((x) => x.id === f.studentId)
      if (!s || s.status === "結束" || f.status !== "未收款") return null
      return { ...f, student: s }
    })
    .filter(Boolean) as Array<MockFeeRow & { student: MockStudent }>
}

export function myDutyDays(teacherId: string, days: MockDutyDay[] = MOCK_DUTY_DAYS) {
  return days.filter((d) => {
    if (d.holiday) return false
    return d.secondaryTeacherId === teacherId || d.primaryTeacherId === teacherId
  })
}

export function myDutyDivisionLabel(day: MockDutyDay, teacherId: string): string {
  const parts: string[] = []
  if (day.secondaryTeacherId === teacherId) {
    parts.push(`課室 ${roomALabel(day)}`)
  }
  if (day.primaryTeacherId === teacherId) {
    parts.push(`課室 ${roomBLabel(day)}`)
  }
  return parts.join("；") || "—"
}
