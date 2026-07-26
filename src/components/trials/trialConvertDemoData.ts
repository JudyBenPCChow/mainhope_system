/** 試堂頁「轉化／結果 UI 預覽」假資料（僅 ?demo=1，不寫入資料庫） */

export type TrialConvertDemoCourseMode = "regular" | "summer_two_period"

/** 試堂結果（復盤用；與排程 status「已預約／已完成／取消」分開） */
export type TrialOutcome = "open" | "converted" | "lost" | "other"

export const TRIAL_OUTCOME_LABELS: Record<TrialOutcome, string> = {
 open: "待跟進",
 converted: "已轉化",
 lost: "已流失",
 other: "其他結果",
}

export const TRIAL_LOST_REASON_OPTIONS = [
 "時間不合",
 "學費偏高",
 "選其他補習社",
 "程度不合",
 "沒興趣／不需要",
 "聯絡不上",
 "試堂體驗不佳",
 "其他",
] as const

export const TRIAL_OTHER_RESULT_OPTIONS = [
 "改期再試",
 "轉介其他班／科目",
 "家長考慮中（暫掛）",
 "只試不報（明確）",
 "其他",
] as const

export type TrialConvertDemoRow = {
 id: string
 student_id: string
 class_id: string
 schedule_id: string
 trial_date: string
 trial_type: string
 status: string
 remarks: string | null
 payment_id: string | null
 receipt_number: string | null
 student_name: string | null
 student_grade: string | null
 class_subject: string | null
 course_code_full: string | null
 teacher_id: string | null
 teacher_name: string | null
 sched_date: string | null
 sched_start: string | null
 sched_end: string | null
 /** demo-only */
 courseMode: TrialConvertDemoCourseMode
 rollCallDone: boolean
 outcome: TrialOutcome
 outcomeReason: string | null
 outcomeNote: string | null
 outcomeAt: string | null
 pricePerLesson: number
}

export type TrialConvertDemoSession = {
 id: string
 sessionNumber: number
 date: string
 start: string
 end: string
}

export const TRIAL_CONVERT_DEMO_TODAY = "2026-09-12"

export const TRIAL_CONVERT_DEMO_SESSIONS: TrialConvertDemoSession[] = [
 { id: "s1", sessionNumber: 2, date: "2026-09-19", start: "16:00", end: "17:30" },
 { id: "s2", sessionNumber: 3, date: "2026-09-26", start: "16:00", end: "17:30" },
 { id: "s3", sessionNumber: 4, date: "2026-10-03", start: "16:00", end: "17:30" },
 { id: "s4", sessionNumber: 5, date: "2026-10-10", start: "16:00", end: "17:30" },
 { id: "s5", sessionNumber: 6, date: "2026-10-17", start: "16:00", end: "17:30" },
]

export function cloneTrialConvertDemoRows(): TrialConvertDemoRow[] {
 return [
  {
   id: "t1",
   student_id: "demo-st-1",
   class_id: "demo-cl-1",
   schedule_id: "demo-sc-1",
   trial_date: "2026-09-12",
   trial_type: "免費試堂",
   status: "已預約",
   remarks: null,
   payment_id: null,
   receipt_number: null,
   student_name: "陳小明",
   student_grade: "中二",
   class_subject: "數學 · 2627 中二強化",
   course_code_full: "M2627-S2-A",
   teacher_id: "demo-tch-1",
   teacher_name: "陳老師",
   sched_date: "2026-09-12",
   sched_start: "16:00",
   sched_end: "17:30",
   courseMode: "regular",
   rollCallDone: true,
   outcome: "open",
   outcomeReason: null,
   outcomeNote: null,
   outcomeAt: null,
   pricePerLesson: 275,
  },
  {
   id: "t2",
   student_id: "demo-st-2",
   class_id: "demo-cl-2",
   schedule_id: "demo-sc-2",
   trial_date: "2026-09-13",
   trial_type: "半價試堂",
   status: "已預約",
   remarks: "已收半價試堂費",
   payment_id: "demo-pay-2",
   receipt_number: "RC-260912-018",
   student_name: "李嘉欣",
   student_grade: "中一",
   class_subject: "英文 · 2627 中一寫作",
   course_code_full: "E2627-S1-B",
   teacher_id: "demo-tch-2",
   teacher_name: "李老師",
   sched_date: "2026-09-13",
   sched_start: "10:00",
   sched_end: "11:30",
   courseMode: "regular",
   rollCallDone: false,
   outcome: "open",
   outcomeReason: null,
   outcomeNote: null,
   outcomeAt: null,
   pricePerLesson: 250,
  },
  {
   id: "t3",
   student_id: "demo-st-3",
   class_id: "demo-cl-3",
   schedule_id: "demo-sc-3",
   trial_date: "2026-09-10",
   trial_type: "原價試堂",
   status: "已完成",
   remarks: "轉正式報讀：報足全期；已收款 $1100（4 堂）",
   payment_id: "demo-pay-3",
   receipt_number: "RC-260910-041",
   student_name: "王梓軒",
   student_grade: "中三",
   class_subject: "數學 · 2627 中三溫習",
   course_code_full: "M2627-S3-C",
   teacher_id: "demo-tch-1",
   teacher_name: "陳老師",
   sched_date: "2026-09-10",
   sched_start: "18:00",
   sched_end: "19:30",
   courseMode: "regular",
   rollCallDone: true,
   outcome: "converted",
   outcomeReason: "報足全期",
   outcomeNote: "已收款 $1100（4 堂）",
   outcomeAt: "2026-09-10 19:45",
   pricePerLesson: 275,
  },
  {
   id: "t4",
   student_id: "demo-st-4",
   class_id: "demo-cl-4",
   schedule_id: "demo-sc-4",
   trial_date: "2026-07-20",
   trial_type: "體驗課",
   status: "已預約",
   remarks: null,
   payment_id: null,
   receipt_number: null,
   student_name: "黃詩琳",
   student_grade: "中二",
   class_subject: "中文 · 26SM 暑期寫作",
   course_code_full: "C26SM-S2",
   teacher_id: "demo-tch-3",
   teacher_name: "黃老師",
   sched_date: "2026-07-20",
   sched_start: "14:00",
   sched_end: "15:30",
   courseMode: "summer_two_period",
   rollCallDone: true,
   outcome: "open",
   outcomeReason: null,
   outcomeNote: null,
   outcomeAt: null,
   pricePerLesson: 250,
  },
  {
   id: "t5",
   student_id: "demo-st-5",
   class_id: "demo-cl-5",
   schedule_id: "demo-sc-5",
   trial_date: "2026-09-08",
   trial_type: "免費試堂",
   status: "取消",
   remarks: "家長改期",
   payment_id: null,
   receipt_number: null,
   student_name: "張子傑",
   student_grade: "中一",
   class_subject: "科學 · 2627 中一實驗",
   course_code_full: "S2627-S1-A",
   teacher_id: "demo-tch-2",
   teacher_name: "李老師",
   sched_date: "2026-09-08",
   sched_start: "15:00",
   sched_end: "16:30",
   courseMode: "regular",
   rollCallDone: false,
   outcome: "other",
   outcomeReason: "改期再試",
   outcomeNote: "家長要求改至九月第三週",
   outcomeAt: "2026-09-08 12:00",
   pricePerLesson: 250,
  },
  {
   id: "t6",
   student_id: "demo-st-6",
   class_id: "demo-cl-1",
   schedule_id: "demo-sc-6",
   trial_date: "2026-09-05",
   trial_type: "半價試堂",
   status: "已完成",
   remarks: null,
   payment_id: null,
   receipt_number: null,
   student_name: "周啟明",
   student_grade: "中二",
   class_subject: "數學 · 2627 中二強化",
   course_code_full: "M2627-S2-A",
   teacher_id: "demo-tch-1",
   teacher_name: "陳老師",
   sched_date: "2026-09-05",
   sched_start: "16:00",
   sched_end: "17:30",
   courseMode: "regular",
   rollCallDone: true,
   outcome: "lost",
   outcomeReason: "學費偏高",
   outcomeNote: "比較過網上課程後決定不報",
   outcomeAt: "2026-09-07 15:20",
   pricePerLesson: 275,
  },
 ]
}

export function demoHasClosedOutcome(row: { outcome?: TrialOutcome }): boolean {
 return row.outcome === "converted" || row.outcome === "lost" || row.outcome === "other"
}

export function demoCanConvert(row: {
 outcome?: TrialOutcome
 status: string
 rollCallDone?: boolean
}): boolean {
 if (demoHasClosedOutcome(row)) return false
 if (String(row.status).includes("取消")) return false
 return Boolean(row.rollCallDone)
}

export function demoConvertBlockedReason(row: {
 outcome?: TrialOutcome
 status: string
 rollCallDone?: boolean
}): string | null {
 if (row.outcome === "converted") return "已轉正式報讀"
 if (row.outcome === "lost") return "已標流失"
 if (row.outcome === "other") return "已有其他結果"
 if (String(row.status).includes("取消")) return "已取消，不可轉正"
 if (!row.rollCallDone) return "請先完成該堂點名"
 return null
}

/** 可登記流失／其他：已點名、尚未結案結果；取消堂亦可標「其他」復盤 */
export function demoCanRecordOutcome(row: {
 outcome?: TrialOutcome
 status: string
 rollCallDone?: boolean
}): boolean {
 if (demoHasClosedOutcome(row)) return false
 if (String(row.status).includes("取消")) return true
 return Boolean(row.rollCallDone)
}

export function outcomeTagTone(
 outcome: TrialOutcome
): "default" | "info" | "success" | "warning" | "error" {
 if (outcome === "converted") return "success"
 if (outcome === "lost") return "error"
 if (outcome === "other") return "warning"
 return "info"
}
