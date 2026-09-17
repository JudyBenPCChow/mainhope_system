import { Link } from "react-router-dom"
import { Check, MapPin, MessageCircle, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HintTooltip } from "@/components/ui/tooltip"
import { SkeletonCardGrid } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { teacherSubstituteNote, type AggregatedTeacherDayLesson } from "@/lib/teacherDayReminders"
import { cn } from "@/lib/utils"
import {
 buildTeacherDayReminderMessage,
 formatLessonReminderTimeLine,
} from "@/lib/whatsappReminder"
import type { TeacherDayReminderRow } from "@/services/lessonReminderQueries"

type FilterId = "all" | "pending" | "done" | "noPhone"

function initials(name: string): string {
 const cleaned = name.replaceAll("老師", "").trim()
 return cleaned.slice(0, 1) || "?"
}

function avatarTone(row: TeacherDayReminderRow, done: boolean): string {
 if (!row.canMessage) return "bg-destructive/15 text-destructive ring-destructive/30"
 if (done) return "bg-success/15 text-success ring-success/30"
 return "bg-warning/15 text-warning ring-warning/30"
}

function railTone(row: TeacherDayReminderRow, done: boolean): string {
 if (!row.canMessage) return "bg-destructive"
 if (done) return "bg-success"
 return "bg-warning"
}

function lessonChipClass(lesson: AggregatedTeacherDayLesson): string {
 if (lesson.originalTeacherName || lesson.isExtraLesson) return "border-warning/50 bg-warning/10"
 return "border-info/40 bg-info/5"
}

export function TomorrowTeacherReminderList(props: {
 rows: TeacherDayReminderRow[]
 visible: TeacherDayReminderRow[]
 reminderDate: string
 loading: boolean
 filter: FilterId
 busyId: string | null
 previewId: string | null
 onSend: (teacherId: string) => void
 onMarkManual: (teacherId: string) => void
 onUnmark: (teacherId: string) => void
 onTogglePreview: (teacherId: string) => void
}) {
 const {
  rows,
  visible,
  reminderDate,
  loading,
  filter,
  busyId,
  previewId,
  onSend,
  onMarkManual,
  onUnmark,
  onTogglePreview,
 } = props

 if (loading && rows.length === 0) {
  return <SkeletonCardGrid count={4} />
 }

 return (
  <StaggerList as="ul" className="space-y-4" aria-label="需提醒老師">
   {visible.length === 0 ? (
    <li className="rounded-2xl border border-dashed border-border bg-background px-4 py-12 text-center text-sm text-muted-foreground">
     {filter === "pending"
      ? "未提醒已清空，可切換「全部」或「已提醒」。"
      : "此篩選下沒有老師。"}
    </li>
   ) : (
    visible.map((row) => {
     const done = row.remindedAt != null
     const showPreview = previewId === row.teacherId
     const message = buildTeacherDayReminderMessage({
      teacherName: row.fullName,
      dateYmd: reminderDate,
      lessons: row.lessons,
     })
     const profileTo = `/Teachers/${row.teacherId}`
     const busy = busyId === row.teacherId

     return (
      <StaggerItem
       key={row.teacherId}
       as="li"
       className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md",
        done && "border-success/35"
       )}
      >
       <div className={cn("absolute inset-y-0 left-0 w-1.5", railTone(row, done))} aria-hidden />

       <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-stretch sm:gap-5 md:p-5 md:pl-6">
        <div className="flex min-w-0 flex-1 gap-3">
         <div
          className={cn(
           "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ring-1",
           avatarTone(row, done)
          )}
          aria-hidden
         >
          {initials(row.fullName)}
         </div>

         <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
           <div className="flex flex-wrap items-center gap-2">
            <Link
             to={profileTo}
             className="truncate text-lg font-semibold text-foreground underline-offset-4 hover:text-info hover:underline"
             title="開啟老師檔案"
            >
             {row.fullName}
            </Link>
            {row.englishName ? (
             <span className="text-xs text-muted-foreground">{row.englishName}</span>
            ) : null}
            {done ? (
             <Tag tone="success" size="sm">
              已提醒
             </Tag>
            ) : row.canMessage ? (
             <Tag tone={statusToTagTone("pending")} size="sm">
              未提醒
             </Tag>
            ) : (
             <Tag tone="error" size="sm">
              缺電話
             </Tag>
            )}
           </div>
           <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link
             to={profileTo}
             className="inline-flex items-center gap-1 text-info underline-offset-2 hover:underline"
            >
             <UserRound className="h-3.5 w-3.5" aria-hidden />
             老師檔案
            </Link>
            {row.contactPhone ? (
             <span className="tabular-nums">電話 {row.contactPhone}</span>
            ) : (
             <span className="text-destructive">未有 WhatsApp／電話</span>
            )}
            <span aria-hidden>·</span>
            <span>共 {row.lessonCount} 堂</span>
            {done && row.remindedBy ? (
             <>
              <span aria-hidden>·</span>
              <span>由 {row.remindedBy}</span>
             </>
            ) : null}
           </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
           {row.lessons.map((lessonItem, i) => {
            const time = formatLessonReminderTimeLine(
             lessonItem.startTime,
             lessonItem.endTime,
             lessonItem.isConsecutive
            )
            const substitute = teacherSubstituteNote(lessonItem.originalTeacherName)
            return (
             <div
              key={lessonItem.key}
              className={cn(
               "relative min-w-[148px] max-w-[200px] shrink-0 rounded-xl border p-3",
               lessonChipClass(lessonItem)
              )}
             >
              {i < row.lessons.length - 1 ? (
               <span
                className="absolute -right-2 top-1/2 z-10 hidden h-px w-2 -translate-y-1/2 bg-neutral-300 sm:block"
                aria-hidden
               />
              ) : null}
              <p className="text-xs font-medium tabular-nums text-foreground">{time ?? "—"}</p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">
               {lessonItem.courseCode || lessonItem.subject}
              </p>
              <p className="truncate text-xs text-muted-foreground">{lessonItem.courseName}</p>
              <p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground">
               <MapPin className="h-3 w-3 shrink-0" aria-hidden />
               {lessonItem.classroomName ?? "課室未定"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
               {lessonItem.isConsecutive ? (
                <Tag tone="info" size="sm">
                 連堂
                </Tag>
               ) : null}
               {substitute ? (
                <Tag tone={statusToTagTone("代堂")} size="sm">
                 代堂
                </Tag>
               ) : null}
               {lessonItem.isExtraLesson ? (
                <Tag tone={statusToTagTone("加堂")} size="sm">
                 加堂
                </Tag>
               ) : null}
              </div>
              {substitute ? (
               <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-warning">{substitute}</p>
              ) : null}
             </div>
            )
           })}
          </div>

          {showPreview ? (
           <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-100 p-3 text-xs leading-relaxed text-foreground">
            {message}
           </pre>
          ) : null}
         </div>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:w-[148px] sm:flex-col sm:justify-center">
         <HintTooltip
          hint={row.canMessage ? "開啟 WhatsApp（已預填當日排程）" : "缺聯絡電話"}
          className="flex-1 sm:flex-none"
         >
          <Button
           type="button"
           size="sm"
           variant="success"
           className="w-full"
           disabled={!row.canMessage || busy}
           onClick={() => onSend(row.teacherId)}
          >
           <MessageCircle className="h-4 w-4" aria-hidden />
           WhatsApp
          </Button>
         </HintTooltip>
         <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
          <Link to={profileTo}>
           <UserRound className="h-4 w-4" aria-hidden />
           檔案
          </Link>
         </Button>
         {done ? (
          <Button
           type="button"
           size="sm"
           variant="ghost"
           className="flex-1 text-xs text-muted-foreground sm:flex-none"
           disabled={busy}
           onClick={() => onUnmark(row.teacherId)}
          >
           取消標記
          </Button>
         ) : row.canMessage ? (
          <Button
           type="button"
           size="sm"
           variant="ghost"
           className="flex-1 text-xs text-muted-foreground sm:flex-none"
           disabled={busy}
           onClick={() => onMarkManual(row.teacherId)}
          >
           <Check className="h-3.5 w-3.5" aria-hidden />
           已提醒
          </Button>
         ) : null}
         <Button
          type="button"
          size="sm"
          variant="ghost"
          className="flex-1 text-xs sm:flex-none"
          onClick={() => onTogglePreview(row.teacherId)}
         >
          {showPreview ? "收起文案" : "預覽文案"}
         </Button>
        </div>
       </div>
      </StaggerItem>
     )
    })
   )}
  </StaggerList>
 )
}
