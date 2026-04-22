import { Link } from "react-router-dom"
import { CalendarDays, User } from "lucide-react"

import type { TodayScheduleRow } from "@/services/dashboard"

type Props = {
 schedules: TodayScheduleRow[]
 loading?: boolean
}

export function TodayScheduleCard({ schedules, loading }: Props) {
 return (
  <section className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
   <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-base font-semibold">
     <CalendarDays className="h-5 w-5 text-primary" />
     今日課堂
     <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {loading ? "…" : `${schedules.length} 堂`}
     </span>
    </h2>
    <Link
     to="/Schedule"
     className="text-xs font-medium text-primary underline-offset-4 hover:underline"
    >
     查看全部
    </Link>
   </div>
   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : schedules.length === 0 ? (
    <p className="text-sm text-muted-foreground">今日尚無排程。</p>
   ) : (
    <ul className="flex flex-1 flex-col gap-3">
     {schedules.map((s) => (
      <li
       key={s.id}
       className="rounded-lg border border-border/80 bg-background/80 px-3 py-3"
      >
       <div className="font-medium text-foreground">{s.title}</div>
       <div className="mt-1 text-sm text-muted-foreground">{s.timeRange}</div>
       <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
         <User className="h-3.5 w-3.5" />
         {s.teacherName}
        </span>
        <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
         {s.status}
        </span>
       </div>
      </li>
     ))}
    </ul>
   )}
  </section>
 )
}
