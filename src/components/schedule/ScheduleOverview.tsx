import { CalendarDays, ChevronDown, Users, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { kpiNumberDisplay } from "@/components/schedule/scheduleManageUi"

export type ScheduleOverviewStats = {
 todayLesson: { status: "loading" | "ready" | "error"; value: number | null }
 cancelled: { status: "loading" | "ready" | "error"; value: number | null }
 todayHeadcount: { status: "loading" | "ready" | "error"; value: number | null }
}

type Props = {
 stats: ScheduleOverviewStats
 statsError: boolean
 open: boolean
 onOpenChange: (open: boolean) => void
 selectedDate: string
 todayYmd: string
 todayActive: boolean
 cancelledActive: boolean
 onTodayClick: () => void
 onCancelledClick: () => void
}

export function ScheduleOverview({
 stats,
 statsError,
 open,
 onOpenChange,
 selectedDate,
 todayYmd,
 todayActive,
 cancelledActive,
 onTodayClick,
 onCancelledClick,
}: Props) {
 const isToday = selectedDate === todayYmd
 return (
  <section className="space-y-2" aria-label="排程概覽">
   <div className="flex items-center justify-between gap-2">
    <p className="text-sm font-medium text-muted-foreground">
     {isToday ? "今日概覽" : `${selectedDate} 概覽`}
    </p>
    <Button
     type="button"
     variant="ghost"
     size="sm"
     className="h-8 gap-1 px-2 text-muted-foreground"
     aria-expanded={open}
     onClick={() => onOpenChange(!open)}
    >
     {open ? "收合" : "展開"}
     <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
    </Button>
   </div>
   {open ? (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
     <button
      type="button"
      onClick={onTodayClick}
      className={cn(
       "rounded-xl border bg-card p-2.5 text-left shadow-sm transition-all duration-200 md:p-6",
       "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
       todayActive ? "ring-2 ring-info/50" : "border-border"
      )}
     >
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground md:gap-2 md:text-sm">
       <CalendarDays className="h-3.5 w-3.5 shrink-0 text-info md:h-5 md:w-5" />
       <span className="truncate">{isToday ? "今日課堂" : "當日課堂"}</span>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-info md:mt-2 md:text-2xl">
       {kpiNumberDisplay(stats.todayLesson.status, stats.todayLesson.value)}
      </p>
      <p className="mt-2 hidden text-sm text-muted-foreground md:block">
       {isToday ? "點擊以日視圖查看今天" : "點擊以日視圖查看此日"}
      </p>
     </button>

     <button
      type="button"
      onClick={onCancelledClick}
      className={cn(
       "rounded-xl border bg-card p-2.5 text-left shadow-sm transition-all duration-200 md:p-6",
       "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
       cancelledActive ? "ring-2 ring-destructive/60" : "border-border"
      )}
     >
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground md:gap-2 md:text-sm">
       <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive md:h-5 md:w-5" />
       <span className="truncate">未來取消堂</span>
      </div>
      <p
       role="alert"
       className="mt-1 text-xl font-bold tabular-nums text-destructive md:mt-2 md:text-2xl"
      >
       {kpiNumberDisplay(stats.cancelled.status, stats.cancelled.value)}
      </p>
      <p className="mt-2 hidden text-sm text-muted-foreground md:block">
       {isToday ? "今天起真正取消的堂；不是可結案待辦" : "由此日起真正取消的堂；不是可結案待辦"}
      </p>
     </button>

     <button
      type="button"
      onClick={onTodayClick}
      className={cn(
       "rounded-xl border border-border bg-card p-2.5 text-left shadow-sm transition-all duration-200 md:p-6",
       "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40"
      )}
     >
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground md:gap-2 md:text-sm">
       <Users className="h-3.5 w-3.5 shrink-0 text-success md:h-5 md:w-5" />
       <span className="truncate">{isToday ? "今日學生人次" : "當日學生人次"}</span>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-success md:mt-2 md:text-2xl">
       {kpiNumberDisplay(stats.todayHeadcount.status, stats.todayHeadcount.value)}
      </p>
      <p className="mt-2 hidden text-sm text-muted-foreground md:block">
       {isToday ? "今天各堂點名冊加總；同一學生兩堂計兩次" : "該日各堂點名冊加總；同一學生兩堂計兩次"}
      </p>
     </button>
    </div>
   ) : null}
   {statsError ? (
    <div
     role="alert"
     className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
     排程統計未能載入
    </div>
   ) : null}
  </section>
 )
}
