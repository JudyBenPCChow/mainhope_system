/** 試堂紀錄沙盒假資料（僅 /prototype/TrialRecords，不寫 DB） */

export type MockTrialOutcome = "open" | "converted" | "lost"
export type MockStudentKind = "existing" | "new"

/** 由排程點名推導的顯示狀態（非人手選） */
export type MockDerivedScheduleStatus = "未點名" | "已點名" | "已取消"

export type MockScheduleOption = {
  id: string
  classId: string
  date: string
  start: string
  end: string
  sessionNumber: number
  /** 該堂是否已完成點名 → 決定試堂「排程狀態」 */
  rollCallDone: boolean
}

export type MockClassOption = {
  id: string
  label: string
  subject: string
  teacherId: string
  teacherName: string
}

export type MockStudentOption = {
  id: string
  name: string
  grade: string
  kind: MockStudentKind
}

export type MockTrialRow = {
  id: string
  studentId: string
  studentName: string
  studentGrade: string
  studentKind: MockStudentKind
  classId: string
  classLabel: string
  teacherId: string
  teacherName: string
  /** 時間／日期一律由此排程帶出 */
  scheduleId: string
  /** 人手取消試堂（與點名無關） */
  cancelled: boolean
  /** 是否已繳費（正式版由收款／繳費紀錄帶出，本頁只顯示） */
  paid: boolean
  outcome: MockTrialOutcome
  outcomeReason: string | null
  enrolledClassLabel: string | null
  remarks: string | null
}

export const MOCK_STUDENTS: MockStudentOption[] = [
  { id: "stu-1", name: "陳小明", grade: "P4", kind: "new" },
  { id: "stu-2", name: "李美華", grade: "P5", kind: "existing" },
  { id: "stu-3", name: "王梓軒", grade: "S1", kind: "new" },
  { id: "stu-4", name: "張雨晴", grade: "P3", kind: "new" },
  { id: "stu-5", name: "黃子謙", grade: "P6", kind: "existing" },
  { id: "stu-6", name: "林安琪", grade: "S2", kind: "existing" },
]

export const MOCK_CLASSES: MockClassOption[] = [
  {
    id: "cls-math-p4",
    label: "P4 數學強化 · MH-P4M-A",
    subject: "數學",
    teacherId: "tch-1",
    teacherName: "周老師",
  },
  {
    id: "cls-eng-p5",
    label: "P5 英文閱讀 · MH-P5E-B",
    subject: "英文",
    teacherId: "tch-2",
    teacherName: "陳老師",
  },
  {
    id: "cls-chi-s1",
    label: "S1 中文寫作 · MH-S1C-A",
    subject: "中文",
    teacherId: "tch-3",
    teacherName: "林老師",
  },
  {
    id: "cls-math-p6",
    label: "P6 數學衝刺 · MH-P6M-C",
    subject: "數學",
    teacherId: "tch-1",
    teacherName: "周老師",
  },
]

export const MOCK_SCHEDULES: MockScheduleOption[] = [
  {
    id: "sch-1a",
    classId: "cls-math-p4",
    date: "2026-07-29",
    start: "16:00",
    end: "17:30",
    sessionNumber: 3,
    rollCallDone: false,
  },
  {
    id: "sch-1b",
    classId: "cls-math-p4",
    date: "2026-08-05",
    start: "16:00",
    end: "17:30",
    sessionNumber: 4,
    rollCallDone: false,
  },
  {
    id: "sch-1c",
    classId: "cls-math-p4",
    date: "2026-08-12",
    start: "16:00",
    end: "17:30",
    sessionNumber: 5,
    rollCallDone: false,
  },
  {
    id: "sch-2a",
    classId: "cls-eng-p5",
    date: "2026-07-30",
    start: "17:45",
    end: "19:15",
    sessionNumber: 2,
    rollCallDone: false,
  },
  {
    id: "sch-2b",
    classId: "cls-eng-p5",
    date: "2026-08-06",
    start: "17:45",
    end: "19:15",
    sessionNumber: 3,
    rollCallDone: false,
  },
  {
    id: "sch-3a",
    classId: "cls-chi-s1",
    date: "2026-07-25",
    start: "15:00",
    end: "16:30",
    sessionNumber: 1,
    rollCallDone: true,
  },
  {
    id: "sch-3b",
    classId: "cls-chi-s1",
    date: "2026-08-07",
    start: "15:00",
    end: "16:30",
    sessionNumber: 2,
    rollCallDone: false,
  },
  {
    id: "sch-4a",
    classId: "cls-math-p6",
    date: "2026-07-20",
    start: "10:00",
    end: "11:30",
    sessionNumber: 4,
    rollCallDone: true,
  },
  {
    id: "sch-4b",
    classId: "cls-math-p6",
    date: "2026-08-08",
    start: "10:00",
    end: "11:30",
    sessionNumber: 5,
    rollCallDone: false,
  },
]

export const MOCK_LOST_REASONS = [
  "時間不合",
  "學費偏高",
  "選其他補習社",
  "程度不合",
  "沒興趣／不需要",
  "聯絡不上",
  "試堂體驗不佳",
  "其他",
] as const

export const OUTCOME_LABELS: Record<MockTrialOutcome, string> = {
  open: "待跟進",
  converted: "已轉化",
  lost: "流失",
}

export const STUDENT_KIND_LABELS: Record<MockStudentKind, string> = {
  new: "新生",
  existing: "現有學生",
}

export function getSchedule(scheduleId: string): MockScheduleOption | undefined {
  return MOCK_SCHEDULES.find((s) => s.id === scheduleId)
}

export function formatScheduleLabel(sch: MockScheduleOption): string {
  return `第${sch.sessionNumber}堂 · ${sch.date} ${sch.start}–${sch.end}`
}

/** 排程狀態：取消優先；否則看該堂是否已點名 */
export function derivedScheduleStatus(row: Pick<MockTrialRow, "cancelled" | "scheduleId">): MockDerivedScheduleStatus {
  if (row.cancelled) return "已取消"
  const sch = getSchedule(row.scheduleId)
  if (sch?.rollCallDone) return "已點名"
  return "未點名"
}

export function derivedStatusTone(
  status: MockDerivedScheduleStatus
): "info" | "success" | "default" {
  if (status === "已點名") return "success"
  if (status === "已取消") return "default"
  return "info"
}

export function cloneMockTrials(): MockTrialRow[] {
  return [
    {
      id: "tr-1",
      studentId: "stu-1",
      studentName: "陳小明",
      studentGrade: "P4",
      studentKind: "new",
      classId: "cls-math-p4",
      classLabel: "P4 數學強化 · MH-P4M-A",
      teacherId: "tch-1",
      teacherName: "周老師",
      scheduleId: "sch-1a",
      cancelled: false,
      paid: false,
      outcome: "open",
      outcomeReason: null,
      enrolledClassLabel: null,
      remarks: null,
    },
    {
      id: "tr-2",
      studentId: "stu-2",
      studentName: "李美華",
      studentGrade: "P5",
      studentKind: "existing",
      classId: "cls-eng-p5",
      classLabel: "P5 英文閱讀 · MH-P5E-B",
      teacherId: "tch-2",
      teacherName: "陳老師",
      scheduleId: "sch-2a",
      cancelled: false,
      paid: true,
      outcome: "open",
      outcomeReason: null,
      enrolledClassLabel: null,
      remarks: "家長希望先試",
    },
    {
      id: "tr-3",
      studentId: "stu-3",
      studentName: "王梓軒",
      studentGrade: "S1",
      studentKind: "new",
      classId: "cls-chi-s1",
      classLabel: "S1 中文寫作 · MH-S1C-A",
      teacherId: "tch-3",
      teacherName: "林老師",
      scheduleId: "sch-3a",
      cancelled: false,
      paid: false,
      outcome: "converted",
      outcomeReason: "報足全期",
      enrolledClassLabel: "S1 中文寫作 · MH-S1C-A",
      remarks: null,
    },
    {
      id: "tr-4",
      studentId: "stu-4",
      studentName: "張雨晴",
      studentGrade: "P3",
      studentKind: "new",
      classId: "cls-math-p4",
      classLabel: "P4 數學強化 · MH-P4M-A",
      teacherId: "tch-1",
      teacherName: "周老師",
      scheduleId: "sch-1a",
      cancelled: false,
      paid: false,
      outcome: "converted",
      outcomeReason: "報足全期",
      enrolledClassLabel: "P6 數學衝刺 · MH-P6M-C",
      remarks: "試堂後改報 P6 衝刺班（跨班轉化示例）",
    },
    {
      id: "tr-5",
      studentId: "stu-5",
      studentName: "黃子謙",
      studentGrade: "P6",
      studentKind: "existing",
      classId: "cls-math-p6",
      classLabel: "P6 數學衝刺 · MH-P6M-C",
      teacherId: "tch-1",
      teacherName: "周老師",
      scheduleId: "sch-4a",
      cancelled: false,
      paid: true,
      outcome: "lost",
      outcomeReason: "學費偏高",
      enrolledClassLabel: null,
      remarks: null,
    },
    {
      id: "tr-6",
      studentId: "stu-6",
      studentName: "林安琪",
      studentGrade: "S2",
      studentKind: "existing",
      classId: "cls-eng-p5",
      classLabel: "P5 英文閱讀 · MH-P5E-B",
      teacherId: "tch-2",
      teacherName: "陳老師",
      scheduleId: "sch-2b",
      cancelled: false,
      paid: false,
      outcome: "open",
      outcomeReason: null,
      enrolledClassLabel: null,
      remarks: "由 sch-2a 改期至此（沙盒示例）",
    },
  ]
}

export function schedulesForClass(classId: string, excludeScheduleId?: string): MockScheduleOption[] {
  return MOCK_SCHEDULES.filter(
    (s) => s.classId === classId && (excludeScheduleId == null || s.id !== excludeScheduleId)
  )
}

export function outcomeTone(outcome: MockTrialOutcome): "info" | "success" | "error" {
  if (outcome === "converted") return "success"
  if (outcome === "lost") return "error"
  return "info"
}
