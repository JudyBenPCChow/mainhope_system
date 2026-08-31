import type { RoomRecord } from "@/services/classroomQueries"
import type { ScheduleAlerts, ScheduleManageRow } from "@/services/scheduleQueries"
import { prefillStatusFromLeave } from "@/lib/attendanceBilling"

export type PrototypeStudent = {
 id: string
 fullName: string
 englishName: string | null
 grade: string | null
 source: "enrollment" | "trial" | "makeup"
 /** 當日請假單（僅影響預填建議） */
 leave?: {
  leaveReason: string
  makeupType: string
 } | null
}

/** 綠色展開區用的簡化名冊列 */
export type PrototypeRosterPerson = {
 studentId: string
 fullName: string
 contactPhone: string | null
}

export type PrototypeExpandRoster = {
 enrolled: PrototypeRosterPerson[]
 leave: PrototypeRosterPerson[]
 trial: PrototypeRosterPerson[]
 makeup: PrototypeRosterPerson[]
 notEnrolled: PrototypeRosterPerson[]
}

/**
 * 原型專用狀態名稱（尚未同步正式 attendanceBilling）。
 * 即時直播→zoom實時網課；不用補回→請假而不需補回
 */
export const PROTOTYPE_STATUS_OPTIONS = [
 "現場",
 "錄影回放",
 "zoom實時網課",
 "no show",
 "請假而不需補回",
 "事假",
 "病假",
] as const

export type PrototypeStatus = (typeof PROTOTYPE_STATUS_OPTIONS)[number]

export const PROTOTYPE_BILLABLE_OPTIONS = [
 "現場",
 "錄影回放",
 "zoom實時網課",
 "no show",
 "請假而不需補回",
] as const satisfies readonly PrototypeStatus[]

export const PROTOTYPE_NON_BILLABLE_OPTIONS = ["事假", "病假"] as const satisfies readonly PrototypeStatus[]

export const PROTOTYPE_STATUS_HELP: Record<PrototypeStatus, string> = {
 現場: "學生實體到課，計入已上堂數（扣堂）。",
 錄影回放: "當日已交付錄影／回放連結即銷堂，不論學生何時觀看。",
 zoom實時網課: "經 Zoom 等同步上網課，計入已上堂數（扣堂）。",
 "no show": "突然缺席且沒有請假通知，仍扣堂。",
 請假而不需補回: "有請假，本可補回但學生自願放棄，仍扣堂。",
 事假: "已請假（事假），不扣堂。",
 病假: "已請假（病假），不扣堂。",
}

export function isPrototypeBillableStatus(status: string | null | undefined): boolean {
 const s = String(status ?? "").trim()
 return (PROTOTYPE_BILLABLE_OPTIONS as readonly string[]).includes(s)
}

/** 將正式預填標籤對應到原型顯示名稱 */
function mapBillingLabelToPrototype(label: string): PrototypeStatus {
 if (label === "即時直播") return "zoom實時網課"
 if (label === "不用補回") return "請假而不需補回"
 if ((PROTOTYPE_STATUS_OPTIONS as readonly string[]).includes(label)) {
  return label as PrototypeStatus
 }
 return "事假"
}

/** 與正式日視圖對齊的模擬日期 */
export const PROTOTYPE_TODAY = "2026-07-17"

export const PROTOTYPE_ROOMS: RoomRecord[] = [
 { id: "room-301", name: "301", capacity: 12, is_online: false, remarks: null },
 { id: "room-202", name: "202", capacity: 10, is_online: false, remarks: null },
 { id: "room-seminar-a", name: "研討 A", capacity: 4, is_online: false, remarks: null },
]

function baseRow(
 partial: Pick<
  ScheduleManageRow,
  | "id"
  | "start_time"
  | "end_time"
  | "class_id"
  | "subject"
  | "classLabel"
  | "course_code_full"
  | "classroom_id"
  | "classroom_name"
  | "enrollCount"
  | "class_kind"
  | "session_number"
  | "consecutive_group_id"
  | "consecutive_slot_index"
  | "class_lesson_slots_per_session"
 > &
  Partial<Pick<ScheduleManageRow, "teacher_name" | "class_day_of_week" | "class_time_slot" | "course_name">>
): ScheduleManageRow {
 return {
  scheduled_date: PROTOTYPE_TODAY,
  status: "正常",
  cancel_reason: null,
  is_extra_lesson: false,
  roster_policy: "class_all",
  roster_confirmed_at: null,
  remarks: null,
  teaching_notes: null,
  course_name: null,
  class_day_of_week: "五",
  class_time_slot: partial.start_time,
  teacher_id: "proto-teacher",
  teacher_name: "Judy Chu",
  original_teacher_id: null,
  original_teacher_name: null,
  ...partial,
 }
}

/** 三堂假排程：連續兩格數學、英文、一對一（時間對齊 75 分鐘格） */
export const PROTOTYPE_SCHEDULES: ScheduleManageRow[] = [
 baseRow({
  id: "proto-lesson-1",
  start_time: "10:15",
  end_time: "11:30",
  class_id: "proto-class-chi",
  subject: "中文",
  classLabel: "暑期升中三級中文班",
  course_code_full: "26SM-CHIS3008-B",
  course_name: "暑期升中三級中文班",
  classroom_id: "room-301",
  classroom_name: "301",
  enrollCount: 1,
  class_kind: "group",
  session_number: 5,
  consecutive_group_id: null,
  consecutive_slot_index: null,
  class_lesson_slots_per_session: 1,
  teacher_name: "Katie Lee",
  class_day_of_week: "星期三, 星期五",
  class_time_slot: "10:15–11:30",
 }),
 baseRow({
  id: "proto-lesson-2",
  start_time: "16:30",
  end_time: "19:00",
  class_id: "proto-class-math",
  subject: "數學",
  classLabel: "數學精進",
  course_code_full: "MATH-3A",
  classroom_id: "room-202",
  classroom_name: "202",
  enrollCount: 3,
  class_kind: "group",
  session_number: 8,
  consecutive_group_id: "proto-consec-math",
  consecutive_slot_index: 0,
  class_lesson_slots_per_session: 2,
 }),
 baseRow({
  id: "proto-lesson-3",
  start_time: "20:15",
  end_time: "21:30",
  class_id: "proto-class-phy",
  subject: "物理",
  classLabel: "物理一對一",
  course_code_full: null,
  classroom_id: "room-seminar-a",
  classroom_name: "研討 A",
  enrollCount: 1,
  class_kind: "private",
  session_number: 12,
  consecutive_group_id: null,
  consecutive_slot_index: null,
  class_lesson_slots_per_session: 1,
 }),
]

export const PROTOTYPE_ALERTS: Map<string, ScheduleAlerts> = new Map([
 ["proto-lesson-1", { trial: false, makeup: false, leave: false, record: false }],
 [
  "proto-lesson-2",
  { trial: true, makeup: true, leave: true, record: false },
 ],
 ["proto-lesson-3", { trial: false, makeup: false, leave: false, record: false }],
])

export const PROTOTYPE_STUDENT_ROSTER: Map<string, string[]> = new Map([
 ["proto-class-chi", ["蕭樂瑩"]],
 ["proto-class-math", ["陳小明", "李美華", "王志強"]],
 ["proto-class-phy", ["何俊熙"]],
])

export const PROTOTYPE_EXPAND_ROSTER: Record<string, PrototypeExpandRoster> = {
 "proto-lesson-1": {
  enrolled: [{ studentId: "proto-stu-xiao", fullName: "蕭樂瑩", contactPhone: "91234567" }],
  leave: [],
  trial: [],
  makeup: [],
  notEnrolled: [],
 },
 "proto-lesson-2": {
  enrolled: [
   { studentId: "proto-stu-chen", fullName: "陳小明", contactPhone: "91111111" },
   { studentId: "proto-stu-li", fullName: "李美華", contactPhone: null },
   { studentId: "proto-stu-wong", fullName: "王志強", contactPhone: "92222222" },
  ],
  leave: [
   { studentId: "proto-stu-chen", fullName: "陳小明", contactPhone: "91111111" },
   { studentId: "proto-stu-wong", fullName: "王志強", contactPhone: "92222222" },
   { studentId: "proto-stu-cheung", fullName: "張浩然", contactPhone: null },
  ],
  trial: [{ studentId: "proto-stu-huang", fullName: "黃子晴", contactPhone: null }],
  makeup: [{ studentId: "proto-stu-cheung", fullName: "張浩然", contactPhone: null }],
  notEnrolled: [],
 },
 "proto-lesson-3": {
  enrolled: [{ studentId: "proto-stu-ho", fullName: "何俊熙", contactPhone: null }],
  leave: [],
  trial: [],
  makeup: [],
  notEnrolled: [],
 },
}

export const PROTOTYPE_ROLLCALL_STUDENTS: Record<string, PrototypeStudent[]> = {
 "proto-lesson-1": [
  { id: "s-xiao", fullName: "蕭樂瑩", englishName: null, grade: "P6", source: "enrollment" },
 ],
 "proto-lesson-2": [
  {
   id: "s1",
   fullName: "陳小明",
   englishName: "Ming",
   grade: "P4",
   source: "enrollment",
   leave: { leaveReason: "事假", makeupType: "調堂" },
  },
  { id: "s2", fullName: "李美華", englishName: "May", grade: "P4", source: "enrollment" },
  {
   id: "s3",
   fullName: "王志強",
   englishName: "Ken",
   grade: "P5",
   source: "enrollment",
   leave: { leaveReason: "病假", makeupType: "錄影" },
  },
  { id: "s4", fullName: "黃子晴", englishName: "Chloe", grade: "P4", source: "trial" },
  {
   id: "s5",
   fullName: "張浩然",
   englishName: null,
   grade: "P5",
   source: "makeup",
   leave: { leaveReason: "事假", makeupType: "不補回" },
  },
 ],
 "proto-lesson-3": [
  { id: "s9", fullName: "何俊熙", englishName: "Jason", grade: "S2", source: "enrollment" },
 ],
}

export function rollcallHintForSchedule(id: string): {
 leaveHint?: string
 trialHint?: string
 consecutiveLabel?: string
 billingNote?: string
} {
 if (id === "proto-lesson-2") {
  return {
   leaveHint: "陳小明 事假（調堂）· 王志強 病假（錄影）· 張浩然（請假而不需補回）",
   trialHint: "試堂：黃子晴",
   consecutiveLabel: "連續 2 堂＝扣 2 堂",
   billingNote: "連堂點名對每個 schedule 各寫一列",
  }
 }
 return {}
}

export function suggestedPrefillForStudent(s: PrototypeStudent): PrototypeStatus | null {
 if (!s.leave) return null
 return mapBillingLabelToPrototype(prefillStatusFromLeave(s.leave))
}
