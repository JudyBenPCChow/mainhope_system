/** 功輔 UI 沙盒假資料 — 不連接服務／資料庫 */

export type DayPlan = "三日" | "四日" | "五日"
export type Weekday = "一" | "二" | "三" | "四" | "五"
export type EnrollStatus = "在籍" | "暫停" | "結束"
export type FeeStatus = "已收款" | "未收款"
export type DutySlot = "全日" | "上節" | "下節" | "—"
export type RosterPublishStatus = "草稿" | "已發布"
/** 老師報更（針對報更目標月，沙盒為 10 月） */
export type SubmitStatus = "未交" | "草稿" | "已提交"

export type SandboxRole = "admin" | "manager" | "teacher"

export const WEEKDAY_OPTIONS: Weekday[] = ["一", "二", "三", "四", "五"]

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
  return 5
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

export type MockTeacher = { id: string; name: string }

export type MockDutyDay = {
  date: string
  weekday: string
  holiday?: string
  room: string | null
  mode: "全日" | "分上下節" | "放假"
  fullTeacherId?: string
  upperTeacherId?: string
  lowerTeacherId?: string
}

export type MockHoliday = { date: string; label: string }

export const MOCK_MONTH_LABEL = "2026年9月"
/** 老師報更／行政匯總所針對的月份（下月） */
export const MOCK_ROSTER_MONTH_LABEL = "2026年10月"
export const MOCK_ROSTER_MONTH_KEY = "2026-10"
export const MOCK_ACADEMIC_YEAR = "2627"
export const MOCK_DEFAULT_ROOM = "17E"
export const MOCK_SPLIT_NOTE = "上節 15:15–17:30｜下節 17:30–19:30｜佔用自 15:15"
/** 沙盒示範：報更截止說明 */
export const MOCK_SUBMIT_DEADLINE_NOTE = "請於上月 25 日前提交（示範文案；正式截止日後補）"

export const DUTY_CYCLE: DutySlot[] = ["全日", "上節", "下節", "—"]

export const MOCK_TEACHERS: MockTeacher[] = [
  { id: "t1", name: "陳老師" },
  { id: "t2", name: "王老師" },
  { id: "t3", name: "林老師" },
]

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
]

/** 示範：10 月可上班（部分格子） */
export const MOCK_AVAILABILITY: Record<string, Record<string, DutySlot>> = {
  t1: { "10/2": "全日", "10/3": "全日", "10/6": "上節", "10/7": "全日", "10/8": "—" },
  t2: { "10/2": "下節", "10/3": "—", "10/6": "全日", "10/7": "下節", "10/8": "全日" },
  t3: { "10/2": "—", "10/3": "上節", "10/6": "—", "10/7": "全日", "10/8": "上節" },
}

export const MOCK_AVAIL_DATES = ["10/2", "10/3", "10/6", "10/7", "10/8"] as const

/** 初始報更提交狀態（10 月） */
export const MOCK_SUBMIT_STATUS: Record<string, SubmitStatus> = {
  t1: "已提交",
  t2: "草稿",
  t3: "未交",
}

export function cloneAvailability(): Record<string, Record<string, DutySlot>> {
  return structuredClone(MOCK_AVAILABILITY)
}

export function cloneSubmitStatus(): Record<string, SubmitStatus> {
  return { ...MOCK_SUBMIT_STATUS }
}

export function countSubmitProgress(status: Record<string, SubmitStatus>) {
  const teachers = MOCK_TEACHERS
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

export function cycleDutySlot(cur: DutySlot): DutySlot {
  const idx = DUTY_CYCLE.indexOf(cur)
  return DUTY_CYCLE[(idx + 1) % DUTY_CYCLE.length]!
}

export const MOCK_DUTY_DAYS: MockDutyDay[] = [
  { date: "9/1", weekday: "一", room: "17E", mode: "全日", fullTeacherId: "t1" },
  { date: "9/2", weekday: "二", room: "17E", mode: "全日", fullTeacherId: "t1" },
  { date: "9/3", weekday: "三", room: "17E", mode: "分上下節", upperTeacherId: "t1", lowerTeacherId: "t2" },
  { date: "9/4", weekday: "四", room: "17E", mode: "全日", fullTeacherId: "t2" },
  { date: "9/5", weekday: "五", room: "17D", mode: "全日", fullTeacherId: "t2" },
  { date: "9/8", weekday: "一", room: "17E", mode: "全日", fullTeacherId: "t1" },
  { date: "9/9", weekday: "二", room: "17E", mode: "全日", fullTeacherId: "t3" },
  { date: "9/18", weekday: "五", holiday: "中秋翌日（功輔放假）", room: null, mode: "放假" },
]

export const MOCK_HOLIDAYS: MockHoliday[] = [
  { date: "9/18", label: "中秋翌日（功輔放假）" },
  { date: "9/30", label: "校方進修日（功輔放假）" },
]

export const MOCK_PRICE_GRADES = ["中一", "中二", "中三", "中四", "中五", "中六"] as const

export function teacherName(id: string | undefined): string {
  if (!id) return "—"
  return MOCK_TEACHERS.find((t) => t.id === id)?.name ?? "—"
}

export function dutyLabel(day: MockDutyDay): string {
  if (day.mode === "放假") return "—"
  if (day.mode === "全日") return `全日 · ${teacherName(day.fullTeacherId)}`
  return `上 ${teacherName(day.upperTeacherId)}／下 ${teacherName(day.lowerTeacherId)}`
}

export function summarizeOverview(students: MockStudent[], fees: MockFeeRow[]) {
  const active = students.filter((s) => s.status === "在籍")
  const feeByStudent = new Map(fees.map((f) => [f.studentId, f]))
  let paid = 0
  let unpaid = 0
  for (const s of active) {
    const fee = feeByStudent.get(s.id)
    if (fee?.status === "已收款") paid += 1
    else unpaid += 1
  }
  const dutyDays = MOCK_DUTY_DAYS.filter((d) => d.mode !== "放假").length
  return {
    activeCount: active.length,
    paid,
    unpaid,
    dutyDays,
    todayDuty: MOCK_DUTY_DAYS[2]!,
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
    if (d.mode === "放假") return false
    if (d.mode === "全日") return d.fullTeacherId === teacherId
    return d.upperTeacherId === teacherId || d.lowerTeacherId === teacherId
  })
}
