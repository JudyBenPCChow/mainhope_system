import { useRef } from "react"
import { Link } from "react-router-dom"
import {
 CalendarDays,
 ChevronLeft,
 ChevronRight,
 Clock,
 GraduationCap,
 MapPin,
 Umbrella,
 User,
 Users,
} from "lucide-react"

import {
 addDaysToYmd,
 formatScheduleBoardHeading,
 todayYmdLocal,
} from "@/components/home/format"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useIdleScrollCarousel } from "@/hooks/useIdleScrollCarousel"
import { statusToTagTone } from "@/lib/statusTag"
import {
 type DashboardTodayClassCard,
 type DashboardTodayLeaveRow,
} from "@/services/dashboard"

type Props = {
 /** 課堂列表所顯示的日期（YYYY-MM-DD），預設應為今日 */
 scheduleViewYmd: string
 onScheduleViewYmdChange: (ymd: string) => void
 todayClassCards: DashboardTodayClassCard[]
 /** 「課堂排程」在換日載入時為 true */
 scheduleColumnLoading?: boolean
 todayLeaves: DashboardTodayLeaveRow[]
 loading?: boolean
}

export function DashboardBoard({
 scheduleViewYmd,
 onScheduleViewYmdChange,
 todayClassCards,
 scheduleColumnLoading = false,
 todayLeaves,
 loading,
}: Props) {
 const today = todayYmdLocal()
 const scheduleDayLink = `/Schedule?view=day&date=${encodeURIComponent(scheduleViewYmd)}`
 const scheduleBusy = Boolean(loading || scheduleColumnLoading)

 const scheduleScrollRef = useRef<HTMLDivElement>(null)
 const leavesScrollRef = useRef<HTMLDivElement>(null)

 useIdleScrollCarousel(
  scheduleScrollRef,
  !scheduleBusy && todayClassCards.length > 0,
  `${scheduleViewYmd}-${todayClassCards.length}-${scheduleBusy ? 1 : 0}`
 )
 useIdleScrollCarousel(
  leavesScrollRef,
  !loading && todayLeaves.length > 0,
  `${todayLeaves.length}-${loading ? 1 : 0}`
 )

 return (
  <div className="flex flex-col gap-5">
   <section
    className="flex min-h-0 flex-col rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm md:min-h-[36rem] md:p-6"
    aria-label="今日課堂"
   >
    <div className="mb-4 flex shrink-0 flex-col gap-2">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground md:text-lg">
       <CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden />
       今日課堂
       <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
        {scheduleBusy ? "…" : `${todayClassCards.length} 堂`}
       </span>
      </h2>
      <Link
       to={scheduleDayLink}
       className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
       日視圖
      </Link>
     </div>
     <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:justify-start">
       <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="上一日"
        disabled={scheduleBusy}
        onClick={() => onScheduleViewYmdChange(addDaysToYmd(scheduleViewYmd, -1))}
       >
        <ChevronLeft className="h-5 w-5" aria-hidden />
       </Button>
       <p className="min-w-0 flex-1 px-1 text-center text-sm font-medium text-foreground sm:flex-none sm:text-left">
        {formatScheduleBoardHeading(scheduleViewYmd)}
       </p>
       <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="下一日"
        disabled={scheduleBusy}
        onClick={() => onScheduleViewYmdChange(addDaysToYmd(scheduleViewYmd, 1))}
       >
        <ChevronRight className="h-5 w-5" aria-hidden />
       </Button>
      </div>
      {scheduleViewYmd !== today ? (
       <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 text-xs"
        disabled={scheduleBusy}
        onClick={() => onScheduleViewYmdChange(today)}
       >
        回到今天
       </Button>
      ) : null}
     </div>
    </div>
    {scheduleBusy ? (
     <p className="shrink-0 text-base text-muted-foreground">載入中…</p>
    ) : todayClassCards.length === 0 ? (
     <p className="shrink-0 text-base text-muted-foreground">此日尚無排程。</p>
    ) : (
     <div
      ref={scheduleScrollRef}
      className="max-h-[40rem] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth pr-0.5 md:max-h-[48rem]"
     >
      <ul className="flex flex-col gap-3">
       {todayClassCards.map((c) => (
        <li key={c.scheduleId} className="snap-start snap-always">
         <Link
          to={`/Schedule/${c.scheduleId}`}
          className="block rounded-lg border border-border/90 bg-background/95 p-4 shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/[0.03] md:p-5"
         >
          <div className="text-base font-semibold leading-snug text-foreground md:text-lg">
           {c.className}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground md:text-base">
           <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.gradeLabel}
           </span>
           <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.teacherName}
           </span>
          </div>
          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground md:text-base">
           <Users className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
           <span className="leading-relaxed">{c.studentNamesLine}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/50 pt-2 text-sm text-muted-foreground md:text-base">
           <span className="inline-flex items-center gap-1 tabular-nums">
            <MapPin className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.classroomName}
           </span>
           <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.timeRange}
           </span>
          </div>
          <Tag tone={statusToTagTone(c.status)} size="sm" className="mt-2">
           {c.status}
          </Tag>
         </Link>
        </li>
       ))}
      </ul>
     </div>
    )}
   </section>

   <section
    className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm md:p-6"
    aria-label="今日請假學生"
   >
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
     <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground md:text-lg">
      <Umbrella className="h-5 w-5 shrink-0 text-warning" aria-hidden />
      今日請假學生
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
       {loading ? "…" : `${todayLeaves.length} 筆`}
      </span>
     </h2>
     <Link
      to="/LeaveManagement"
      className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
     >
      前往請假
     </Link>
    </div>
    {loading ? (
     <p className="text-base text-muted-foreground">載入中…</p>
    ) : todayLeaves.length === 0 ? (
     <p className="text-base text-muted-foreground">今日無請假紀錄。</p>
    ) : (
     <div
      ref={leavesScrollRef}
      className="max-h-80 snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth pr-1"
     >
      <ul className="divide-y divide-border/70 rounded-lg border border-border/60">
       {todayLeaves.map((r) => (
        <li
         key={r.id}
         className="flex snap-start snap-always flex-col gap-1 px-4 py-3 text-base sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        >
         <div className="min-w-0">
          <Link
           to={`/Students/${r.studentId}`}
           className="font-semibold text-primary hover:underline"
          >
           {r.studentName}
          </Link>
          <span className="text-muted-foreground">
           {r.studentGrade ? ` · ${r.studentGrade}` : ""}
          </span>
          <div className="mt-1 text-sm text-muted-foreground">
           {r.classLabel}
           {r.teacherName ? ` · ${r.teacherName}` : ""}
           {r.timeRange ? ` · ${r.timeRange}` : ""}
          </div>
         </div>
         <div className="flex shrink-0 flex-wrap items-center gap-2">
          {r.leaveReason ? (
           <Tag tone="warning" size="sm">
            {r.leaveReason}
           </Tag>
          ) : null}
          {r.scheduleId ? (
           <Link
            to={`/Schedule/${r.scheduleId}`}
            className="text-sm font-medium text-primary hover:underline"
           >
            排程詳情
           </Link>
          ) : null}
         </div>
        </li>
       ))}
      </ul>
     </div>
    )}
   </section>
  </div>
 )
}
