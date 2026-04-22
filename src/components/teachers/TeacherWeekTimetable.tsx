import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
 intervalsOverlapMinutes,
 LESSON_SLOT_DURATION_MIN,
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
 parseHm,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import type { ScheduleManageRow } from "@/services/scheduleQueries"
import { addDaysYmd, localYmd, type ScheduleRow } from "@/services/teacherQueries"

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const

/** 週視圖共用：老師詳情 / 老師首頁 / 時間表頁 */
export type WeekTimetableItem = {
 id: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 status: string
 subject: string
 courseCode: string | null
}

export function weekItemsFromTeacherScheduleRows(rows: ScheduleRow[]): WeekTimetableItem[] {
 return rows.map((r) => ({
  id: r.id,
  scheduledDate: r.scheduledDate,
  startTime: r.startTime,
  endTime: r.endTime,
  status: r.status,
  subject: r.subject,
  courseCode: r.courseCode,
 }))
}

export function weekItemsFromManageRows(rows: ScheduleManageRow[]): WeekTimetableItem[] {
 return rows.map((r) => ({
  id: r.id,
  scheduledDate: r.scheduled_date,
  startTime: r.start_time,
  endTime: r.end_time,
  status: r.status,
  subject: r.subject,
  courseCode: r.course_code,
 }))
}

function mondayYmdOfWeekContaining(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 const dow = dt.getDay()
 const diff = dow === 0 ? -6 : 1 - dow
 dt.setDate(dt.getDate() + diff)
 return localYmd(dt)
}

function scheduleOverlapsSlot(s: WeekTimetableItem, dateYmd: string, slotIndex: number): boolean {
 if (s.scheduledDate !== dateYmd) return false
 const a = parseHm(s.startTime)
 if (a == null) return false
 let b = parseHm(s.endTime)
 if (b == null) b = a + LESSON_SLOT_DURATION_MIN
 if (b <= a) b = a + LESSON_SLOT_DURATION_MIN
 const s0 = lessonSlotStartMinute(slotIndex)
 const s1 = lessonSlotEndMinute(slotIndex)
 return intervalsOverlapMinutes(a, b, s0, s1)
}

function formatWeekTitle(mondayYmd: string): string {
 const end = addDaysYmd(mondayYmd, 6)
 const [y1, m1, d1] = mondayYmd.split("-").map(Number)
 const [, m2, d2] = end.split("-").map(Number)
 return `${y1} 年 ${m1} 月 ${d1} 日 — ${m2} 月 ${d2} 日`
}

type Props = {
 items: WeekTimetableItem[]
}

export function TeacherWeekTimetable({ items }: Props) {
 const [weekMondayYmd, setWeekMondayYmd] = useState(() => mondayYmdOfWeekContaining(localYmd()))
 const [pickerYmd, setPickerYmd] = useState(() => localYmd())

 const columnDates = useMemo(
  () => Array.from({ length: 7 }, (_, i) => addDaysYmd(weekMondayYmd, i)),
  [weekMondayYmd]
 )

 const slotMatches = useMemo(() => {
  const grid = new Map<string, WeekTimetableItem[]>()
  for (const slot of LESSON_SLOT_INDICES) {
   for (let col = 0; col < 7; col++) {
    const dateYmd = addDaysYmd(weekMondayYmd, col)
    const key = `${slot}-${col}`
    const list = items.filter((s) => scheduleOverlapsSlot(s, dateYmd, slot))
    grid.set(key, list)
   }
  }
  return grid
 }, [items, weekMondayYmd])

 const weekGridColPct = useMemo(() => {
  const timePct = 10
  const each = (100 - timePct) / 7
  return { timePct, each }
 }, [])

 const goPrevWeek = () => setWeekMondayYmd((m) => addDaysYmd(m, -7))
 const goNextWeek = () => setWeekMondayYmd((m) => addDaysYmd(m, 7))

 const applyPicker = () => {
  setWeekMondayYmd(mondayYmdOfWeekContaining(pickerYmd))
 }

 return (
  <div className="mx-auto max-w-[110rem] space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-2">
     <Button type="button" variant="outline" size="icon" onClick={goPrevWeek} aria-label="上一週">
      <ChevronLeft className="h-4 w-4" />
     </Button>
     <Button type="button" variant="outline" size="icon" onClick={goNextWeek} aria-label="下一週">
      <ChevronRight className="h-4 w-4" />
     </Button>
     <h2 className="text-base font-semibold text-foreground md:text-lg">
      {formatWeekTitle(weekMondayYmd)}
     </h2>
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <label className="text-sm text-muted-foreground">跳至日期</label>
     <Input
      type="date"
      className="w-auto min-w-[10.5rem]"
      value={pickerYmd}
      onChange={(e) => setPickerYmd(e.target.value)}
     />
     <Button type="button" variant="secondary" size="sm" onClick={applyPicker}>
      顯示該週
     </Button>
    </div>
   </div>

   <p className="text-sm text-muted-foreground">
    橫軸為本週一至日；直軸為預設堂數格（每格 75 分鐘）。點卡片可開啟排程詳情。
   </p>

   <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
    <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-xs md:text-sm">
     <colgroup>
      <col style={{ width: `${weekGridColPct.timePct}%` }} />
      {columnDates.map((ymd) => (
       <col key={ymd} style={{ width: `${weekGridColPct.each}%` }} />
      ))}
     </colgroup>
     <thead>
      <tr>
       <th className="sticky left-0 z-10 border-b border-r border-border bg-muted/90 px-2 py-2 font-medium text-muted-foreground">
        節次
       </th>
       {columnDates.map((ymd, i) => (
        <th
         key={ymd}
         className="min-w-0 border-b border-border bg-muted/60 px-1.5 py-2 text-center font-medium leading-tight"
        >
         <div className="text-muted-foreground">週{WEEKDAY_LABELS[i]}</div>
         <div className="tabular-nums text-foreground">{ymd.slice(5).replace("-", "/")}</div>
        </th>
       ))}
      </tr>
     </thead>
     <tbody>
      {LESSON_SLOT_INDICES.map((slot) => (
       <tr key={slot}>
        <th className="sticky left-0 z-10 border-b border-r border-border bg-muted/40 px-2 py-1.5 text-xs font-medium tabular-nums text-muted-foreground md:text-sm">
         {lessonSlotLabel(slot)}
        </th>
        {columnDates.map((ymd, col) => {
         const key = `${slot}-${col}`
         const list = slotMatches.get(key) ?? []
         return (
          <td
           key={`${slot}-${ymd}`}
           className="border-b border-border bg-background/80 p-1 align-top"
          >
           <div className="flex min-h-[3.25rem] flex-col gap-1">
            {list.length === 0 ? (
             <span className="block min-h-[2rem] text-[0.65rem] text-muted-foreground/40 md:text-xs">
              —
             </span>
            ) : (
             list.map((s) => {
              const cancelled = s.status.includes("取消")
              return (
               <Link
                key={s.id}
                to={`/Schedule/${s.id}`}
                className={cn(
                 "block rounded-md border px-1 py-0.5 text-[0.65rem] leading-snug shadow-sm transition-colors hover:border-primary hover:bg-primary/5 md:text-xs",
                 cancelled
                  ? "border-dashed border-muted-foreground/40 bg-muted/50 text-muted-foreground line-through"
                  : "border-teal-200 bg-teal-50/90 text-teal-950"
                )}
               >
                <div className="font-semibold">{s.subject}</div>
                <div className="tabular-nums text-muted-foreground">
                 {s.startTime ?? "—"}–{s.endTime ?? "—"}
                </div>
                {s.courseCode ? (
                 <div className="font-mono text-[0.6rem] text-muted-foreground md:text-[0.65rem]">
                  {s.courseCode}
                 </div>
                ) : null}
               </Link>
              )
             })
            )}
           </div>
          </td>
         )
        })}
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </div>
 )
}
