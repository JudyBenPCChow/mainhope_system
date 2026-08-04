/**
 * 計糧引擎型別（純計算；與 UI／DB snapshot 對齊）
 */

export type PayrollMode =
  | "分成制"
  | "固定月薪"
  | "兼職 HC"
  | "特別 HC"
  | "獨立定價"
  | "WFH 時薪"

export type GradeBand = "junior" | "senior" | "primary" | "unknown"

export type PrivateSlotKind = "one_to_one" | "one_to_two" | "group"

export type HcTier = {
  base: number
  perExtra: number
}

export type PayrollRateConfig = {
  personalPct?: number
  commissionPct?: number
  commissionSubjectCodes?: string[]
  monthlySalary?: number
  junior?: HcTier
  senior?: HcTier
  oneToOneHc?: number
  oneToTwoHc?: number
  groupPerHc?: number
  groupPct?: number
  oneToOne?: number
  oneToTwo?: number
  hourlyRate?: number
  mpf?: boolean
}

export type PayrollRateRow = {
  id: string
  teacherId: string
  mode: PayrollMode
  effectiveFrom: string
  effectiveTo: string | null
  config: PayrollRateConfig
  notes: string | null
}

export type PayrollStudentRow = {
  studentId: string
  studentName: string
  status: string
  billable: boolean
  listPrice: number
}

export type PayrollLessonInput = {
  scheduleId: string
  classId: string
  classLabel: string
  classKind: "group" | "private"
  privateSlot: PrivateSlotKind
  gradeLabels: string[]
  gradeBand: GradeBand
  subjectCode: string | null
  scheduledDate: string
  startTime: string | null
  endTime: string | null
  cancelled: boolean
  teacherId: string | null
  teacherName: string | null
  originalTeacherId: string | null
  originalTeacherName: string | null
  /** 班別主責（分成制佣金歸屬參考） */
  classOwnerTeacherId: string | null
  listPricePerLesson: number
  students: PayrollStudentRow[]
  /** 已排程但完全無點名列 */
  missingRollCall: boolean
}

export type PayrollTeacherInput = {
  teacherId: string
  teacherName: string
  rate: PayrollRateRow | null
  /** 已核准 WFH／人手工時（小時） */
  approvedHours: number
}

export type ComputedLessonLine = {
  scheduleId: string
  classId: string
  classLabel: string
  classKind: "group" | "private"
  date: string
  startTime: string | null
  endTime: string | null
  billableHc: number
  listPriceTotal: number
  amount: number
  formula: string
  note: string | null
  substitute: boolean
  originalTeacherName: string | null
  missingRollCall: boolean
  students: PayrollStudentRow[]
  /** 計入本人分成基數的原價合計 */
  personalSplitBase: number
  /** 計入他人佣金池的原價合計（科目符合時） */
  commissionPoolBase: number
  subjectCode: string | null
}

export type ComputedTeacherResult = {
  teacherId: string
  teacherName: string
  mode: PayrollMode | "未設定"
  missingRate: boolean
  grossBeforeAdj: number
  lines: { label: string; amount: number; kind: string }[]
  lessons: ComputedLessonLine[]
  personalSplit: number
  commissionPool: number
  commissionPoolItems: { scheduleId: string; classLabel: string; date: string; amount: number; teacherName: string }[]
  anomalies: string[]
  hardBlock: boolean
}

export type MonthComputeInput = {
  monthKey: string
  teachers: PayrollTeacherInput[]
  lessons: PayrollLessonInput[]
  /** 上個月各教師 gross（對照 ±30%） */
  previousGrossByTeacherId?: Record<string, number>
}

export type MonthComputeResult = {
  monthKey: string
  teachers: ComputedTeacherResult[]
  hardBlockAnomalies: string[]
}
