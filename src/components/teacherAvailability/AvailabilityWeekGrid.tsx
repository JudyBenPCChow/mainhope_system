import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 LESSON_SLOT_INDICES,
 lessonSlotLabel,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"
import type { TeacherAvailabilitySlot } from "@/services/teacherAvailabilityQueries"
import { weekdayLabelFromYmd } from "@/lib/weekdayUtils"

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const
const SLOTS_PER_PAGE = 3

function mondayYmdOfWeekContaining(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 const dow = dt.getDay()
 const diff = dow === 0 ? -6 : 1 - dow
 dt.setDate(dt.getDate() + diff)
 return localYmd(dt)
}

type Props = {
 slots: TeacherAvailabilitySlot[]
 mode: "single" | "all"
 weekStart: string
 onWeekStartChange: (ymd: string) => void
 yearEnd: string
 onAddSlot?: (date: string, slotIndex: number) => void
 onNavigateCreate?: (slot: TeacherAvailabilitySlot) => void
 readOnly?: boolean
}

export function AvailabilityWeekGrid({
 slots,
 mode,
 weekStart,
 onWeekStartChange,
 yearEnd,
 onAddSlot,
 onNavigateCreate,
 readOnly,
}: Props) {
 const [slotPage, setSlotPage] = useState(0)
 const weekMonday = useMemo(() => mondayYmdOfWeekContaining(weekStart), [weekStart])
 const columnDates = useMemo(
  () => Array.from({ length: 7 }, (_, i) => addDaysYmd(weekMonday, i)),
  [weekMonday]
 )
 const visibleSlotIndices = useMemo(() => {
  const start = slotPage * SLOTS_PER_PAGE
  return LESSON_SLOT_INDICES.slice(start, start + SLOTS_PER_PAGE)
 }, [slotPage])
 const maxSlotPage = Math.ceil(LESSON_SLOT_INDICES.length / SLOTS_PER_PAGE) - 1

 const cellSlots = useMemo(() => {
  const map = new Map<string, TeacherAvailabilitySlot[]>()
  for (const s of slots) {
   const idx = LESSON_SLOT_INDICES.findIndex((i) => lessonSlotLabel(i) === s.time_slot)
   if (idx < 0) continue
   const col = columnDates.indexOf(s.available_date)
   if (col < 0) continue
   const key = `${idx}-${col}`
   const list = map.get(key) ?? []
   list.push(s)
   map.set(key, list)
  }
  return map
 }, [slots, columnDates])

 return (
  <div className="space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex items-center gap-2">
     <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => onWeekStartChange(addDaysYmd(weekMonday, -7))}
     >
      <ChevronLeft className="h-4 w-4" />
     </Button>
     <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => onWeekStartChange(addDaysYmd(weekMonday, 7))}
     >
      <ChevronRight className="h-4 w-4" />
     </Button>
     <span className="text-sm font-medium">{weekMonday} 起</span>
    </div>
    <div className="flex items-center gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={slotPage <= 0}
      onClick={() => setSlotPage((p) => Math.max(0, p - 1))}
     >
      上一組時段
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={slotPage >= maxSlotPage}
      onClick={() => setSlotPage((p) => Math.min(maxSlotPage, p + 1))}
     >
      下一組時段
     </Button>
    </div>
   </div>

   <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-full min-w-[640px] table-fixed border-collapse text-xs">
     <thead>
      <tr className="bg-muted/50">
       <th className="border-b border-r border-border px-2 py-2">節次</th>
       {columnDates.map((ymd, i) => (
        <th key={ymd} className="border-b border-border px-1 py-2 text-center">
         <div>週{WEEKDAY_LABELS[i]}</div>
         <div className="tabular-nums">{ymd.slice(5).replace("-", "/")}</div>
        </th>
       ))}
      </tr>
     </thead>
     <tbody>
      {visibleSlotIndices.map((slotIdx) => (
       <tr key={slotIdx}>
        <td className="border-r border-border bg-muted/30 px-2 py-2 text-muted-foreground">
         {lessonSlotLabel(slotIdx)}
        </td>
        {columnDates.map((ymd, col) => {
         const key = `${slotIdx}-${col}`
         const list = cellSlots.get(key) ?? []
         const isPast = ymd > yearEnd
         return (
          <td key={ymd} className="min-h-[3rem] border-b border-border p-1 align-top">
           {list.length > 0 ? (
            <div className="space-y-1">
             {list.map((s) => (
              <button
               key={s.id}
               type="button"
               disabled={readOnly}
               className={cn(
                "w-full rounded px-1 py-0.5 text-left text-[10px] leading-tight",
                s.status === "可分配"
                 ? "bg-info/15 text-info hover:bg-info/25"
                 : "bg-muted text-muted-foreground"
               )}
               onClick={() => {
                if (s.status === "可分配") onNavigateCreate?.(s)
               }}
               title={s.teacher_name ?? undefined}
              >
               {mode === "all"
                ? s.teacher_abbr ?? s.teacher_name?.slice(0, 2) ?? "?"
                : s.status}
              </button>
             ))}
            </div>
           ) : !readOnly && onAddSlot && !isPast ? (
            <button
             type="button"
             className="h-full min-h-[2rem] w-full rounded border border-dashed border-border/60 text-[10px] text-muted-foreground hover:bg-muted/40"
             onClick={() => onAddSlot(ymd, slotIdx)}
            >
             +
            </button>
           ) : (
            <span className="text-muted-foreground/30">—</span>
           )}
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

export function navigateToClassNewFromSlot(
 navigate: ReturnType<typeof useNavigate>,
 slot: TeacherAvailabilitySlot
) {
 const dow = weekdayLabelFromYmd(slot.available_date)
 const params = new URLSearchParams({
  academic_year_id: slot.academic_year_id,
  teacher_id: slot.teacher_id,
  day_of_week: dow ?? "",
  time_slot: slot.time_slot,
  from_slot_id: slot.id,
 })
 navigate(`/Classes/New?${params.toString()}`)
}
