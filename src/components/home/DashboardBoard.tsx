import { useMemo, useRef } from "react"
import { Link } from "react-router-dom"
import {
 CalendarDays,
 CheckCircle2,
 ChevronLeft,
 ChevronRight,
 Clock,
 DoorOpen,
 GraduationCap,
 ListTodo,
 MapPin,
 Umbrella,
 User,
 Users,
} from "lucide-react"

import {
 addDaysToYmd,
 dashboardTitleDate,
 formatScheduleBoardHeading,
 todayYmdLocal,
} from "@/components/home/format"
import { Button } from "@/components/ui/button"
import { useIdleScrollCarousel } from "@/hooks/useIdleScrollCarousel"
import { LESSON_SLOT_INDICES, lessonSlotLabel } from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import {
 type DashboardRoomVacancyColumn,
 type DashboardTodayClassCard,
 type DashboardTodayLeaveRow,
 type DashboardTodoItem,
} from "@/services/dashboard"

type Props = {
 /** 左欄課堂列表所顯示的日期（YYYY-MM-DD），預設應為今日 */
 scheduleViewYmd: string
 onScheduleViewYmdChange: (ymd: string) => void
 todayClassCards: DashboardTodayClassCard[]
 /** 僅左欄「課堂排程」在換日載入時為 true */
 scheduleColumnLoading?: boolean
 todosToday: DashboardTodoItem[]
 roomVacancy: DashboardRoomVacancyColumn[]
 todayLeaves: DashboardTodayLeaveRow[]
 loading?: boolean
}

export function DashboardBoard({
 scheduleViewYmd,
 onScheduleViewYmdChange,
 todayClassCards,
 scheduleColumnLoading = false,
 todosToday,
 roomVacancy,
 todayLeaves,
 loading,
}: Props) {
 const today = todayYmdLocal()
 const scheduleDayLink = `/Schedule?view=day&date=${encodeURIComponent(scheduleViewYmd)}`
 const scheduleBusy = Boolean(loading || scheduleColumnLoading)

 const scheduleScrollRef = useRef<HTMLDivElement>(null)
 const todosScrollRef = useRef<HTMLDivElement>(null)
 const leavesScrollRef = useRef<HTMLDivElement>(null)

 useIdleScrollCarousel(
  scheduleScrollRef,
  !scheduleBusy && todayClassCards.length > 0,
  `${scheduleViewYmd}-${todayClassCards.length}-${scheduleBusy ? 1 : 0}`
 )
 useIdleScrollCarousel(
  todosScrollRef,
  !loading && todosToday.length > 0,
  `${todosToday.length}-${loading ? 1 : 0}`
 )
 useIdleScrollCarousel(
  leavesScrollRef,
  !loading && todayLeaves.length > 0,
  `${todayLeaves.length}-${loading ? 1 : 0}`
 )

 const vacancyColPct = useMemo(() => {
  const n = roomVacancy.length
  if (n === 0) return { time: 100, each: 0 }
  const time = 14
  return { time, each: (100 - time) / n }
 }, [roomVacancy.length])

 return (
  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
   {/* 左 30% */}
   <section
    className="flex min-h-[20rem] flex-col rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm md:p-6 lg:w-[30%] lg:min-w-0 lg:shrink-0"
    aria-label="今日課堂"
   >
    <div className="mb-3 flex shrink-0 flex-col gap-2">
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
      className="max-h-[35rem] overflow-y-auto overscroll-contain pr-0.5"
     >
      <ul className="flex flex-col gap-3">
       {todayClassCards.map((c) => (
        <li key={c.scheduleId}>
         <Link
          to={`/Schedule/${c.scheduleId}`}
          className="block rounded-lg border border-border/90 bg-background/95 p-4 shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/[0.03]"
         >
          <div className="text-base font-semibold leading-snug text-foreground md:text-lg">
           {c.className}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
           <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.gradeLabel}
           </span>
           <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.teacherName}
           </span>
          </div>
          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
           <Users className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
           <span className="leading-relaxed">{c.studentNamesLine}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/50 pt-2 text-sm text-muted-foreground">
           <span className="inline-flex items-center gap-1 tabular-nums">
            <MapPin className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.classroomName}
           </span>
           <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {c.timeRange}
           </span>
          </div>
          <span className="mt-2 inline-flex rounded-md border border-sky-200/80 bg-sky-50/90 px-2 py-0.5 text-xs font-medium text-sky-900">
           {c.status}
          </span>
         </Link>
        </li>
       ))}
      </ul>
     </div>
    )}
   </section>

   {/* 右 70% */}
   <section className="flex min-w-0 flex-1 flex-col gap-5 lg:w-[70%]" aria-label="今日概況">
   {/* 待辦事項（今日） */}
    <div className="rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm md:p-6">
     <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground md:text-lg">
       <ListTodo className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />
       今日待辦事項
       <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
        {loading ? "…" : `${todosToday.length} 項`}
       </span>
      </h2>
      <Link
       to="/Calendar"
       className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
      >
       管理待辦
       <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
     </div>
     <p className="mb-3 text-sm text-muted-foreground">今日 {dashboardTitleDate()}</p>
     {loading ? (
      <p className="text-base text-muted-foreground">載入中…</p>
     ) : todosToday.length === 0 ? (
      <p className="text-base text-muted-foreground">今日尚無待辦。前往「待辦事項」新增。</p>
     ) : (
      <div
       ref={todosScrollRef}
       className="max-h-72 overflow-y-auto overscroll-contain pr-1"
      >
       <ul className="space-y-2">
        {todosToday.map((t) => (
         <li
          key={t.id}
          className="flex gap-3 rounded-lg border border-border/70 bg-background/80 px-4 py-3 text-base transition-colors hover:bg-muted/30"
         >
          <Link to={`/Calendar/${t.id}`} className="flex min-w-0 flex-1 gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500/70" aria-hidden />
          <div className="min-w-0">
           <div className="font-semibold text-foreground">{t.title}</div>
           {t.notes ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.notes}</p>
           ) : null}
          </div>
          </Link>
         </li>
        ))}
       </ul>
      </div>
     )}
    </div>

    {/* 課室空缺 */}
    <Link
     to={scheduleDayLink}
     className="block rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm transition-colors hover:border-teal-300/50 hover:bg-teal-50/20 md:p-6"
    >
     <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground md:text-lg">
       <DoorOpen className="h-5 w-5 shrink-0 text-teal-600" aria-hidden />
       今日課室空缺
      </h2>
      <span className="text-sm font-medium text-teal-700">開啟排程日視圖 →</span>
     </div>
     <p className="mb-3 text-sm text-muted-foreground">
      四欄為前四間課室（依名稱排序）；列為預設堂數格（09:00 起每格 75 分鐘，最後一格自 20:15 起）。大點表示該格有課，小點表示無排程。
     </p>
     {loading ? (
      <p className="text-base text-muted-foreground">載入中…</p>
     ) : roomVacancy.length === 0 ? (
      <p className="text-base text-muted-foreground">尚無課室資料。</p>
     ) : (
      <div className="overflow-x-auto">
       <table className="w-full min-w-[320px] table-fixed border-collapse text-center text-xs md:text-sm">
        <colgroup>
         <col style={{ width: `${vacancyColPct.time}%` }} />
         {roomVacancy.map((col) => (
          <col key={col.roomId} style={{ width: `${vacancyColPct.each}%` }} />
         ))}
        </colgroup>
        <thead>
         <tr>
          <th className="border border-border/60 bg-muted/40 px-1.5 py-2 font-medium text-muted-foreground">
           時段
          </th>
          {roomVacancy.map((col) => (
           <th
            key={col.roomId}
            className="min-w-0 border border-border/60 bg-muted/40 px-1 py-2 font-medium leading-tight text-foreground"
            title={col.roomName}
           >
            <span className="line-clamp-2">{col.roomName}</span>
           </th>
          ))}
         </tr>
        </thead>
        <tbody>
         {LESSON_SLOT_INDICES.map((slotIndex) => (
          <tr key={slotIndex}>
           <td className="border border-border/60 bg-card px-1.5 py-1.5 text-left text-[0.7rem] tabular-nums text-muted-foreground md:text-xs">
            {lessonSlotLabel(slotIndex)}
           </td>
           {roomVacancy.map((col) => {
            const on = col.occupied[slotIndex] ?? false
            return (
             <td key={`${col.roomId}-${slotIndex}`} className="border border-border/60 py-1.5">
              <span className="inline-flex justify-center">
               <span
                className={cn(
                 "rounded-full",
                 on ? "h-2 w-2 bg-teal-600" : "h-1 w-1 bg-muted-foreground/35"
                )}
                title={on ? "已佔用" : "空"}
               />
              </span>
             </td>
            )
           })}
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}
    </Link>

    {/* 今日請假 */}
    <div className="rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm md:p-6">
     <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground md:text-lg">
       <Umbrella className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
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
       className="max-h-80 overflow-y-auto overscroll-contain pr-1"
      >
       <ul className="divide-y divide-border/70 rounded-lg border border-border/60">
        {todayLeaves.map((r) => (
         <li
          key={r.id}
          className="flex flex-col gap-1 px-4 py-3 text-base sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
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
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-sm text-amber-950">
             {r.leaveReason}
            </span>
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
    </div>
   </section>
  </div>
 )
}
