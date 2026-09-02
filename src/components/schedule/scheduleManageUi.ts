import { DoorOpen, UserRound, UserX, type LucideIcon } from "lucide-react"

/** 排程問題／類型篩選（可多選，條件為 AND） */
export type ScheduleIssueFilter = "noEnroll" | "private" | "noRoom"

export const ISSUE_FILTER_OPTIONS: {
 id: ScheduleIssueFilter
 label: string
 icon: LucideIcon
}[] = [
 { id: "noEnroll", label: "未有學生報讀", icon: UserX },
 { id: "private", label: "私人課程", icon: UserRound },
 { id: "noRoom", label: "未有課室安排", icon: DoorOpen },
]

/** 專班老師僅保留與自己班務相關的進階篩選 */
export const TEACHER_ISSUE_FILTER_IDS: ReadonlySet<ScheduleIssueFilter> = new Set(["noEnroll"])

/** 老師篩選：未指派 teacher_id 的哨兵值 */
export const UNASSIGNED_TEACHER_ID = "__unassigned__"

export function kpiNumberDisplay(
 status: "loading" | "ready" | "error",
 value: number | null | undefined
): string {
 if (status !== "ready" || value == null) return "—"
 return String(value)
}
