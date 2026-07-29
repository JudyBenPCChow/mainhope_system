/** 前台指引精靈沙盒：純假資料，不連業務 DB */

export type MockStudent = {
 id: string
 full_name: string
 english_name: string
 student_code: string
 grade: string
 parent_phone: string
}

export type MockClass = {
 id: string
 label: string
 subject: string
 courseCode: string
 pricePerLesson: number
 kind: "group" | "private"
}

export type MockSchedule = {
 id: string
 classId: string
 scheduled_date: string
 start_time: string
 end_time: string
}

export type MockEnrollment = {
 id: string
 classId: string
 periodLabel: string
}

export type MockPayment = {
 id: string
 mode: "receive" | "invoice"
 total: number
 method: string
 lines: { classId: string; lessons: number; amount: number }[]
}

export type MockLeave = {
 id: string
 classId: string
 scheduleId: string
 leave_date: string
 reason: string
 makeup: string
}

function ymdOffset(days: number): string {
 const d = new Date()
 d.setDate(d.getDate() + days)
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export const MOCK_CLASSES: MockClass[] = [
 {
  id: "mock-class-eng-f3",
  label: "英文 · F3 小組（逢六 10:00）",
  subject: "英文",
  courseCode: "ENG-F3-SAT",
  pricePerLesson: 275,
  kind: "group",
 },
 {
  id: "mock-class-math-f4",
  label: "數學 · F4 小組（逢日 14:00）",
  subject: "數學",
  courseCode: "MATH-F4-SUN",
  pricePerLesson: 300,
  kind: "group",
 },
 {
  id: "mock-class-chem-private",
  label: "化學 · 一對一（示範）",
  subject: "化學",
  courseCode: "CHEM-1v1",
  pricePerLesson: 825,
  kind: "private",
 },
]

export const MOCK_SCHEDULES: MockSchedule[] = [
 {
  id: "mock-sch-eng-1",
  classId: "mock-class-eng-f3",
  scheduled_date: ymdOffset(3),
  start_time: "10:00",
  end_time: "11:30",
 },
 {
  id: "mock-sch-eng-2",
  classId: "mock-class-eng-f3",
  scheduled_date: ymdOffset(10),
  start_time: "10:00",
  end_time: "11:30",
 },
 {
  id: "mock-sch-eng-3",
  classId: "mock-class-eng-f3",
  scheduled_date: ymdOffset(17),
  start_time: "10:00",
  end_time: "11:30",
 },
 {
  id: "mock-sch-math-1",
  classId: "mock-class-math-f4",
  scheduled_date: ymdOffset(4),
  start_time: "14:00",
  end_time: "15:30",
 },
 {
  id: "mock-sch-math-2",
  classId: "mock-class-math-f4",
  scheduled_date: ymdOffset(11),
  start_time: "14:00",
  end_time: "15:30",
 },
 {
  id: "mock-sch-chem-1",
  classId: "mock-class-chem-private",
  scheduled_date: ymdOffset(5),
  start_time: "16:00",
  end_time: "17:00",
 },
 {
  id: "mock-sch-chem-2",
  classId: "mock-class-chem-private",
  scheduled_date: ymdOffset(12),
  start_time: "16:00",
  end_time: "17:00",
 },
]

export const MOCK_DEMO_PREFILL = {
 full_name: "陳小明（沙盒）",
 english_name: "Chan Siu Ming",
 grade: "F3",
 parent_phone: "91234567",
} as const

export function nextMockStudentCode(seq: number): string {
 return `MOCK${String(seq).padStart(4, "0")}`
}

export function newMockId(prefix: string): string {
 return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
