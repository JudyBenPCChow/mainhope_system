import type { ClassKind } from "@/lib/privateClassKind"
import type { PayrollMode } from "@/lib/payroll/types"

export type { ClassKind, PayrollMode }

/** 雙角色流程：財務準備 → 管理層核實 → 結算 */
export type PayrollRunStatus = "草稿" | "財務審閱中" | "待管理層核實" | "已結算"

/**
 * 出席／缺席狀態（審計用）
 * - 現場／Zoom／錄影／毋須補回請假：計入扣堂 HC
 * - no show：缺席但照扣堂
 * - 病假／事假：缺席且不扣堂（不計入人頭費／分成基數）
 */
export type StudentHcStatus =
  | "in_person"
  | "zoom"
  | "recording"
  | "no_show"
  | "sick"
  | "personal"
  | "leave_billable"

export type StudentHcRow = {
  name: string
  status: StudentHcStatus
  countsTowardHc: boolean
}

/** 單人送核狀態（財務可逐老師提交） */
export type TeacherSubmitState = {
  teacherId: string
  status: "not_submitted" | "submitted" | "accepted" | "returned"
  submittedAt?: string
  submittedBy?: string
  returnNote?: string
}

export type PayrollLineItem = {
  label: string
  amount: number
  note?: string
}

/** 跨模式加總拆分（Leo／Judy） */
export type ModeStream = {
  id: string
  label: string
  mode: PayrollMode
  amount: number
  detail: string
}

export type SalaryEvidence = {
  amount: number
  effectiveFrom: string
  effectiveTo?: string
  monthStatus: string
}

export type PayrollLesson = {
  id: string
  date: string
  startTime: string
  endTime: string
  /** 計薪扣堂人數（人頭）；未點名為 0 */
  billableHc: number
  /** 本節計入該同事的金額（未扣 MPF） */
  amount: number
  presentStudents: string[]
  absentStudents: string[]
  /** 逐學生扣堂判定（審計用） */
  studentRows?: StudentHcRow[]
  notRolled: boolean
  /** 代堂／試堂／佣金說明等 */
  note?: string
  /** 計法字串，方便財務核對 */
  formula?: string
  /** given＝本人代人；received＝被人代 */
  substitute?: "given" | "received"
  substitutePeer?: string
  /** 原價基數（分成制核對用） */
  listPrice?: number
  /** 原價生效時點（歷史價，非今日價） */
  listPriceAsOf?: string
  subject?: string
  /** 分成池：納入／排除原因 */
  poolDisposition?: "in_pool" | "excluded" | "n/a"
  poolDispositionReason?: string
  /** 課堂當日班型快照 */
  classTypeSnapshot?: string
  /** 費率版本註腳 */
  rateSource?: string
  /** 補堂／試堂／取消等 */
  eventTimeline?: string
  /** 正式版連到排程詳情 */
  scheduleId?: string
  /** 班別 id（inbox／跳轉用） */
  classId?: string
  /** 名冊人數（含不扣堂缺席）— 對照計薪人頭 */
  rosterCount?: number
}

export type CommissionPoolItem = {
  teacherName: string
  className: string
  date: string
  listPrice: number
  subject?: string
  included: boolean
  reason?: string
  listPriceAsOf?: string
}

export type CalcVersionMeta = {
  version: number
  computedAt: string
  dataCutoffAt: string
  previousVersion?: number
  previousComputedAt?: string
}

export type ZeroHourPerson = {
  id: string
  name: string
  reason: string
}

export type ReviewAudit = {
  teacherId: string
  teacherName: string
  reviewer: string
  reviewedAt: string
  calcVersion: number
  scope: string
  note?: string
}

export type RecalcDiffItem = {
  teacherName: string
  lessonLabel: string
  field: string
  before: string
  after: string
  amountDelta: number
}

export type ExcludedFollowUp = {
  teacherId: string
  teacherName: string
  reason: string
  handoffTo: string
}

export type WfhMockState = {
  status: "missing" | "submitted" | "approved"
  hours: number | null
  ratePerHour: number
}

export type ManualAdjustment = {
  id: string
  teacherId: string
  teacherName: string
  fromAmount: number | null
  toAmount: number
  reason: string
  createdBy: string
  createdAt: string
  status: "pending" | "approved" | "rejected"
  reviewerNote?: string
}

export type PayrollClassBlock = {
  id: string
  name: string
  classKind: ClassKind
  lessons: PayrollLesson[]
}

export type PayrollGradeBlock = {
  gradeLabel: string
  classes: PayrollClassBlock[]
}

export type PayrollTeacherRow = {
  id: string
  name: string
  mode: PayrollMode
  gross: number | null
  employeeMpf: number
  employerMpf: number
  net: number | null
  previousGross: number | null
  anomalies: string[]
  /** 非堂數項目（固定月薪、佣金池、WFH 等） */
  lines: PayrollLineItem[]
  /** 授課堂數統計（結構對齊中學出席統計） */
  grades: PayrollGradeBlock[]
  /** 分成制：個人原價 × 60% */
  personalSplit?: { listPriceTotal: number; rate: number; amount: number }
  /** 分成制：他人指定科目原價 × 10% */
  commissionPool?: {
    label: string
    listPriceTotal: number
    rate: number
    amount: number
    items: CommissionPoolItem[]
  }
  /** WFH（Cody） */
  wfh?: WfhMockState
  /** 功輔時薪 */
  homework?: {
    rosterHours: number
    billedHours: number
    rate: number
    overridden: boolean
    amount: number
  }
  /** Christine 功輔佣金 */
  homeworkCommission?: {
    enrolledCount: number
    originalPriceTotal: number
    amount: number
  }
  /** 示範：缺有效費率 */
  missingRate?: boolean
  /** 跨模式拆分 */
  modeStreams?: ModeStream[]
  /** 固定月薪適用證據 */
  salaryEvidence?: SalaryEvidence
}

export type HomeworkHourSave =
  | { kind: "override"; hours: number }
  | { kind: "clear" }

export type PayrollMonthMock = {
  monthKey: string
  monthLabel: string
  status: PayrollRunStatus
  teachers: PayrollTeacherRow[]
  /** 財務提交核實後顯示 */
  submittedBy?: string
  submittedAt?: string
  /** 管理層退回原因 */
  returnReason?: string
  /** 計算版本／資料截止 */
  calc?: CalcVersionMeta
}
