import {
 BookOpen,
 DoorOpen,
 Layers,
 UserCheck,
 UserRound,
 Users,
 UserX,
 type LucideIcon,
} from "lucide-react"

/** 報讀人數三段篩選：全部 → 有學生 → 未有學生 */
export type ScheduleEnrollmentFilter = "all" | "hasEnroll" | "noEnroll"

/** 班別類型三段篩選：全部 → 專科班 → 非專科班 */
export type ScheduleClassKindFilter = "all" | "group" | "nonGroup"

/** 仍為開關的進階篩選 */
export type ScheduleBinaryIssueFilter = "noRoom"

export type ScheduleAdvancedFilterId = "enrollment" | "classKind" | "noRoom"

const ENROLLMENT_CYCLE: readonly ScheduleEnrollmentFilter[] = ["all", "hasEnroll", "noEnroll"]
const CLASS_KIND_CYCLE: readonly ScheduleClassKindFilter[] = ["all", "group", "nonGroup"]

export function nextEnrollmentFilter(current: ScheduleEnrollmentFilter): ScheduleEnrollmentFilter {
 const i = ENROLLMENT_CYCLE.indexOf(current)
 return ENROLLMENT_CYCLE[(i < 0 ? 0 : i + 1) % ENROLLMENT_CYCLE.length]!
}

export function nextClassKindFilter(current: ScheduleClassKindFilter): ScheduleClassKindFilter {
 const i = CLASS_KIND_CYCLE.indexOf(current)
 return CLASS_KIND_CYCLE[(i < 0 ? 0 : i + 1) % CLASS_KIND_CYCLE.length]!
}

export function enrollmentFilterLabel(mode: ScheduleEnrollmentFilter): string {
 switch (mode) {
  case "hasEnroll":
   return "有學生報讀"
  case "noEnroll":
   return "未有學生報讀"
  default:
   return "學生報讀"
 }
}

export function classKindFilterLabel(mode: ScheduleClassKindFilter): string {
 switch (mode) {
  case "group":
   return "專科班"
  case "nonGroup":
   return "非專科班"
  default:
   return "班別類型"
 }
}

export function enrollmentFilterIcon(mode: ScheduleEnrollmentFilter): LucideIcon {
 switch (mode) {
  case "hasEnroll":
   return UserCheck
  case "noEnroll":
   return UserX
  default:
   return Users
 }
}

export function classKindFilterIcon(mode: ScheduleClassKindFilter): LucideIcon {
 switch (mode) {
  case "group":
   return BookOpen
  case "nonGroup":
   return UserRound
  default:
   return Layers
 }
}

export const ISSUE_FILTER_OPTIONS: {
 id: ScheduleAdvancedFilterId
 /** 老師範圍僅顯示與此相關者 */
 teacherVisible: boolean
}[] = [
 { id: "enrollment", teacherVisible: true },
 { id: "classKind", teacherVisible: false },
 { id: "noRoom", teacherVisible: false },
]

export const NO_ROOM_FILTER_OPTION = {
 id: "noRoom" as const,
 label: "未有課室安排",
 icon: DoorOpen,
}

/** 老師篩選：未指派 teacher_id 的哨兵值 */
export const UNASSIGNED_TEACHER_ID = "__unassigned__"

export function kpiNumberDisplay(
 status: "loading" | "ready" | "error",
 value: number | null | undefined
): string {
 if (status !== "ready" || value == null) return "—"
 return String(value)
}
