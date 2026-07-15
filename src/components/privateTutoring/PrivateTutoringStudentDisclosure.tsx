import type { MouseEvent } from "react"
import { Link } from "react-router-dom"
import { CalendarClock, ChevronDown, UserMinus } from "lucide-react"

import { StudentClassificationTags } from "@/components/students/studentsUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
 formatNextLessonLabel,
 type PrivateClassScheduleRow,
 type PrivateTutoringStudentRow,
} from "@/services/privateTutoringQueries"

/** 列表表頭與 summary 共用欄寬，保持未展開時與原表格對齊 */
export const PRIVATE_TUTORING_ROW_GRID =
 "grid grid-cols-[2.5rem_minmax(5rem,1.1fr)_minmax(3.5rem,0.7fr)_minmax(3rem,0.55fr)_minmax(7rem,1.7fr)_minmax(3.5rem,0.75fr)_minmax(6rem,1.4fr)_minmax(5rem,1.25fr)_minmax(4.5rem,1.1fr)]"

function isCancelledStatus(status: string): boolean {
 return status.includes("取消")
}

function formatScheduleLine(s: PrivateClassScheduleRow): string {
 const time = s.startTime ? String(s.startTime).slice(0, 5) : ""
 const end = s.endTime ? `–${String(s.endTime).slice(0, 5)}` : ""
 const room = s.classroomName ? ` · ${s.classroomName}` : ""
 return `${s.scheduledDate}${time ? ` ${time}${end}` : ""}${room}`
}

type Props = {
 row: PrivateTutoringStudentRow
 canManageEnrollment: boolean
 schedules: PrivateClassScheduleRow[] | undefined
 schedulesLoading: boolean
 onToggleOpen: (open: boolean) => void
 onBook: () => void
 onWithdraw: () => void
}

/**
 * 一對一學生列：原生 `<details>` disclosure。
 * 收合＝原列表摘要；展開＝該班未來排程。
 */
export function PrivateTutoringStudentDisclosure({
 row,
 canManageEnrollment,
 schedules,
 schedulesLoading,
 onToggleOpen,
 onBook,
 onWithdraw,
}: Props) {
 const isWithdrawn = row.enrollmentRowStatus === "已退讀"
 /** 已退讀且無下一堂：僅展示靜態列，不提供展開（禁用態） */
 const expandDisabled = isWithdrawn && row.upcomingLessonCount === 0

 const activeSchedules = (schedules ?? []).filter((s) => !isCancelledStatus(s.status))

 const summaryInteractiveGuard = (e: MouseEvent<HTMLElement>) => {
  const target = e.target as HTMLElement | null
  if (target?.closest("a, button")) {
   e.preventDefault()
  }
 }

 const rowCells = (
  <>
   <div className="min-w-0 truncate px-4 py-3">
    <Link
     to={`/Students/${row.studentId}`}
     className="font-medium text-primary hover:underline"
     title={row.fullName}
    >
     {row.fullName}
    </Link>
   </div>
   <div className="px-4 py-3 font-mono text-sm tabular-nums">{row.studentCode}</div>
   <div className="min-w-0 truncate px-4 py-3" title={row.grade ?? ""}>
    {row.grade ?? "—"}
   </div>
   <div className="min-w-0 truncate px-4 py-3" title={row.classSubject}>
    <span className="inline-flex max-w-full items-center gap-1.5">
     <Link
      to={`/Classes/${row.classId}`}
      state={{ fromPrivateTutoring: true }}
      className="truncate font-medium text-primary hover:underline"
      title={row.classSubject}
     >
      {row.classSubject}
     </Link>
     {isWithdrawn ? (
      <Tag tone="default" className="shrink-0">
       已退讀
      </Tag>
     ) : null}
    </span>
   </div>
   <div className="min-w-0 truncate px-4 py-3" title={row.teacherName ?? ""}>
    {row.teacherName ?? "—"}
   </div>
   <div className="px-4 py-3">
    <StudentClassificationTags
     student={{
      registration_status: row.registrationStatus as "已註冊" | "非注冊",
      enrollment_status: row.enrollmentStatus as "在讀" | "非在讀",
      activity_status: row.activityStatus as "活躍生" | "非活躍生",
      academic_stage: row.academicStage as "中學階段" | "已畢業",
     }}
     compact
     size="sm"
    />
   </div>
   <div className="min-w-0 px-4 py-3">
    <div className="flex min-w-0 items-center gap-1.5">
     <span className="min-w-0 truncate" title={formatNextLessonLabel(row.nextLesson)}>
      {formatNextLessonLabel(row.nextLesson)}
     </span>
     {row.upcomingLessonCount > 1 ? (
      <Tag tone="info" className="shrink-0">
       +{row.upcomingLessonCount - 1}
      </Tag>
     ) : null}
    </div>
   </div>
   <div className="px-4 py-3">
    {isWithdrawn ? (
     <span className="text-sm text-muted-foreground">—</span>
    ) : (
     <div className="flex items-center gap-1">
      <Button
       type="button"
       size="default"
       variant="outline"
       className="h-10 w-10 shrink-0 px-0"
       title="預約"
       aria-label="預約"
       onClick={onBook}
      >
       <CalendarClock className="h-4 w-4" />
      </Button>
      {canManageEnrollment ? (
       <Button
        type="button"
        size="default"
        variant="ghost"
        className="h-10 w-10 shrink-0 px-0 text-destructive hover:text-destructive"
        title="退讀"
        aria-label="退讀"
        onClick={onWithdraw}
       >
        <UserMinus className="h-4 w-4" />
       </Button>
      ) : null}
     </div>
    )}
   </div>
  </>
 )

 if (expandDisabled) {
  return (
   <div
    className={cn(
     PRIVATE_TUTORING_ROW_GRID,
     "items-center border-b border-border/60 bg-muted/30 text-sm text-muted-foreground last:border-0"
    )}
    aria-disabled="true"
   >
    <div className="flex items-center justify-center px-1" aria-hidden>
     <ChevronDown className="h-5 w-5 opacity-30" />
    </div>
    {rowCells}
   </div>
  )
 }

 return (
  <details
   className="group border-b border-border/60 last:border-0 open:bg-muted/20"
   onToggle={(e) => onToggleOpen(e.currentTarget.open)}
  >
   <summary
    className={cn(
     PRIVATE_TUTORING_ROW_GRID,
     "cursor-pointer list-none items-center text-sm transition-colors",
     "hover:bg-muted/40",
     "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
     "[&::-webkit-details-marker]:hidden",
     isWithdrawn && "bg-muted/30 text-muted-foreground"
    )}
    onClick={summaryInteractiveGuard}
   >
    <div className="flex items-center justify-center px-1">
     <ChevronDown
      className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
      aria-hidden
     />
     <span className="sr-only">展開或收合未來排程</span>
    </div>
    {rowCells}
   </summary>

   <div className="border-t border-border/50 bg-muted/15 px-4 py-4 sm:pl-12">
    <p className="mb-2 text-sm font-medium text-muted-foreground">未來排程</p>
    {schedulesLoading && schedules === undefined ? (
     <p className="text-sm text-muted-foreground">載入排程…</p>
    ) : activeSchedules.length === 0 ? (
     <p className="text-sm text-muted-foreground">沒有未來排程。</p>
    ) : (
     <ul className="max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
      {activeSchedules.map((s) => {
       const label = formatScheduleLine(s)
       return (
        <li
         key={s.id}
         className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
        >
         <Link
          to={`/Schedule/${s.id}`}
          className="min-w-0 flex-1 truncate font-medium text-primary hover:underline"
          title={label}
         >
          {label}
         </Link>
         {s.teacherName ? (
          <span className="max-w-[10rem] truncate text-sm text-muted-foreground" title={s.teacherName}>
           {s.teacherName}
          </span>
         ) : null}
         <Tag tone={statusToTagTone(s.status)} className="shrink-0">
          {s.status}
         </Tag>
        </li>
       )
      })}
     </ul>
    )}
   </div>
  </details>
 )
}
