import { Link } from "react-router-dom"
import { CalendarDays, FileText } from "lucide-react"

import { todayYmdLocal } from "@/components/home/format"
import { cn } from "@/lib/utils"

type Props = {
 todayClassCount: number
 /** 狀態為「待繳費」之出單／通知單筆數（對應繳費紀錄篩選） */
 pendingPayCount: number
 loading?: boolean
}

const cardClass =
 "flex min-h-[5.5rem] items-center gap-4 rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.02] md:min-h-[6rem] md:p-6"

export function DashboardTopMetrics({ todayClassCount, pendingPayCount, loading }: Props) {
 const today = todayYmdLocal()
 const scheduleLink = `/Schedule?view=day&date=${encodeURIComponent(today)}`
 const paymentsLink = "/Payments?tab=history&histStatus=pendingPay"

 return (
  <div className="grid gap-4 sm:grid-cols-2">
   <Link to={scheduleLink} className={cn(cardClass, "text-left")} aria-label="開啟今日排程日視圖">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-slate-700 md:h-14 md:w-14">
     <CalendarDays className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.75} aria-hidden />
    </div>
    <div className="min-w-0">
     <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">今日課堂</div>
     <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
      {loading ? "…" : `${todayClassCount} 堂`}
     </div>
     <p className="mt-0.5 text-sm text-muted-foreground">開啟排程日視圖 →</p>
    </div>
   </Link>

   <Link to={paymentsLink} className={cn(cardClass, "text-left")} aria-label="前往繳費紀錄（待繳費／出單）">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 md:h-14 md:w-14">
     <FileText className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.75} aria-hidden />
    </div>
    <div className="min-w-0">
     <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">待繳費</div>
     <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
      {loading ? "…" : `${pendingPayCount} 筆`}
     </div>
     <p className="mt-0.5 text-sm text-muted-foreground">出單（待繳）紀錄 →</p>
    </div>
   </Link>
  </div>
 )
}
