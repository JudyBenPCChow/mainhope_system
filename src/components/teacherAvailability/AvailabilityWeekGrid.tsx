import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 LESSON_SLOT_INDICES,
 lessonSlotLabel,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import { mondayYmdOfWeekContaining, weekdayLabelFromYmd } from "@/lib/weekdayUtils"
import { addDaysYmd } from "@/services/teacherQueries"
import type { TeacherAvailabilitySlot } from "@/services/teacherAvailabilityQueries"
import { slotIndexForStoredTimeSlot } from "@/services/teacherAvailabilityQueries"
import type { RoomRecord } from "@/services/classroomQueries"
import {
 freeRoomNamesForSlot,
 slotScheduleItemsForCell,
 type GridSlotScheduleItem,
 type RoomCalendarPendingRow,
 type RoomCalendarScheduleRow,
} from "@/services/roomBookingQueries"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const

/** 課室 chip 顏色（26SM 三間星座課室各一色；其餘課室沿用相近色） */
const ROOM_CHIP_CLASS: Record<string, string> = {
 矩尺座: "bg-success/20 text-success ring-1 ring-success/30",
 英仙座: "bg-info/20 text-info ring-1 ring-info/30",
 山案座: "bg-warning/20 text-warning ring-1 ring-warning/30",
 "17D": "bg-success/15 text-success ring-1 ring-success/25",
 "17E": "bg-info/15 text-info ring-1 ring-info/25",
 "17K": "bg-neutral-200/80 text-neutral-700 ring-1 ring-neutral-300/60",
}

const TEACHER_CHIP =
 "rounded-md bg-info/15 px-1.5 py-0.5 text-left text-[10px] font-medium leading-snug text-info ring-1 ring-info/25 hover:bg-info/25 disabled:cursor-default disabled:opacity-60"

const SCHEDULE_CHIP =
 "rounded-md bg-warning/15 px-1.5 py-0.5 text-left text-[10px] leading-snug text-amber-950 ring-1 ring-warning/30"

const SCHEDULE_PENDING_CHIP =
 "rounded-md bg-warning/25 px-1.5 py-0.5 text-left text-[10px] leading-snug text-warning ring-1 ring-warning/40"

function roomChipClass(name: string): string {
 return ROOM_CHIP_CLASS[name] ?? "bg-muted text-muted-foreground ring-1 ring-border"
}

type Props = {
 slots: TeacherAvailabilitySlot[]
 mode: "single" | "all"
 weekStart: string
 onWeekStartChange: (ymd: string) => void
 yearEnd: string
 yearStart?: string
 onAddSlot?: (date: string, slotIndex: number) => void
 onDeleteSlot?: (slotId: string) => void
 onNavigateCreate?: (slot: TeacherAvailabilitySlot) => void
 readOnly?: boolean
 rooms?: RoomRecord[]
 roomSchedules?: RoomCalendarScheduleRow[]
 roomPending?: RoomCalendarPendingRow[]
}

type AllModeCellData = {
 availableTeachers: TeacherAvailabilitySlot[]
 scheduleItems: GridSlotScheduleItem[]
 freeRooms: string[]
 activeRoomCount: number
}

function AllTeachersCell({
 data,
 readOnly,
 onNavigateCreate,
}: {
 data: AllModeCellData
 readOnly?: boolean
 onNavigateCreate?: (slot: TeacherAvailabilitySlot) => void
}) {
 const { availableTeachers, scheduleItems, freeRooms, activeRoomCount } = data
 const hasContent =
  availableTeachers.length > 0 || scheduleItems.length > 0 || activeRoomCount > 0

 if (!hasContent) {
  return <span className="flex min-h-[6rem] items-center justify-center text-muted-foreground/30">—</span>
 }

 return (
  <div className="flex min-h-[6rem] flex-col gap-1.5 p-1">
   {availableTeachers.length > 0 ? (
    <div className="flex flex-wrap gap-0.5">
     {availableTeachers.map((s) => (
      <button
       key={s.id}
       type="button"
       disabled={readOnly || s.status !== "可分配"}
       className={TEACHER_CHIP}
       onClick={() => {
        if (s.status === "可分配") onNavigateCreate?.(s)
       }}
       title={s.status === "可分配" ? "由此老師建班" : s.status}
      >
       {s.teacher_name ?? "—"}
      </button>
     ))}
    </div>
   ) : null}

   {scheduleItems.length > 0 ? (
    <div className="flex flex-wrap gap-0.5">
     {scheduleItems.map((item) => (
      <div
       key={`${item.kind}-${item.id}`}
       className={item.kind === "pending" ? SCHEDULE_PENDING_CHIP : SCHEDULE_CHIP}
       title={[item.label, item.teacherName, item.roomName].filter(Boolean).join(" · ")}
      >
       <div className="font-medium leading-tight">{item.label}</div>
       {(item.teacherName || item.roomName) && (
        <div className="mt-px text-[9px] leading-tight opacity-85">
         {[item.teacherName, item.roomName].filter(Boolean).join(" · ")}
        </div>
       )}
      </div>
     ))}
    </div>
   ) : null}

   {activeRoomCount > 0 ? (
    <div className="mt-auto flex flex-wrap gap-0.5 border-t border-border/40 pt-1">
     {freeRooms.length > 0 ? (
      freeRooms.map((name) => (
       <span
        key={name}
        className={cn(
         "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-snug",
         roomChipClass(name)
        )}
       >
        {name}
       </span>
      ))
     ) : (
      <span className="text-[10px] text-muted-foreground">房滿</span>
     )}
    </div>
   ) : null}
  </div>
 )
}

export function AvailabilityWeekGrid({
 slots,
 mode,
 weekStart,
 onWeekStartChange,
 yearEnd,
 yearStart,
 onAddSlot,
 onDeleteSlot,
 onNavigateCreate,
 readOnly,
 rooms = [],
 roomSchedules = [],
 roomPending = [],
}: Props) {
 const weekMonday = useMemo(() => mondayYmdOfWeekContaining(weekStart), [weekStart])
 const columnDates = useMemo(
  () => Array.from({ length: 7 }, (_, i) => addDaysYmd(weekMonday, i)),
  [weekMonday]
 )

 const cellSlots = useMemo(() => {
  const map = new Map<string, TeacherAvailabilitySlot[]>()
  for (const s of slots) {
   const idx = slotIndexForStoredTimeSlot(s.time_slot)
   if (idx < 0) continue
   const dateKey = s.available_date.slice(0, 10)
   const col = columnDates.indexOf(dateKey)
   if (col < 0) continue
   const key = `${idx}-${col}`
   const list = map.get(key) ?? []
   list.push(s)
   map.set(key, list)
  }
  return map
 }, [slots, columnDates])

 const showRoomOverlay = mode === "all" && rooms.length > 0

 const allModeCellData = useMemo(() => {
  if (!showRoomOverlay) return new Map<string, AllModeCellData>()
  const map = new Map<string, AllModeCellData>()
  for (const slotIdx of LESSON_SLOT_INDICES) {
   for (let col = 0; col < columnDates.length; col++) {
    const ymd = columnDates[col]!
    const key = `${slotIdx}-${col}`
    const teacherList = cellSlots.get(key) ?? []
    map.set(key, {
     availableTeachers: teacherList.filter((s) => s.status === "可分配"),
     scheduleItems: slotScheduleItemsForCell({
      ymd,
      slotIndex: slotIdx,
      rooms,
      schedules: roomSchedules,
      pending: roomPending,
     }),
     freeRooms: freeRoomNamesForSlot({
      ymd,
      slotIndex: slotIdx,
      rooms,
      schedules: roomSchedules,
      pending: roomPending,
     }),
     activeRoomCount: classroomsActiveOnDate(rooms, ymd).length,
    })
   }
  }
  return map
 }, [showRoomOverlay, columnDates, cellSlots, rooms, roomSchedules, roomPending])

 const isOutOfYear = (ymd: string) => {
  const yFrom = yearStart?.slice(0, 10)
  if (yFrom && ymd < yFrom) return true
  return ymd > yearEnd.slice(0, 10)
 }

 return (
  <div className="space-y-3">
   <div className="flex flex-wrap items-center gap-2">
    <Button
     type="button"
     variant="outline"
     size="icon"
     onClick={() => onWeekStartChange(addDaysYmd(weekMonday, -7))}
     aria-label="上一週"
    >
     <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button
     type="button"
     variant="outline"
     size="icon"
     onClick={() => onWeekStartChange(addDaysYmd(weekMonday, 7))}
     aria-label="下一週"
    >
     <ChevronRight className="h-4 w-4" />
    </Button>
    <span className="text-sm font-medium">{weekMonday} 起</span>
    {mode === "single" ? (
     <span className="text-xs text-muted-foreground">點 + 新增；已登記格可刪除或建班</span>
    ) : showRoomOverlay ? (
     <span className="text-xs text-muted-foreground">
      藍色＝可任教老師 · 琥珀色＝已排程 · 下方彩色標籤＝空房
     </span>
    ) : null}
   </div>

   {mode === "all" && showRoomOverlay ? (
    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
     <span className={cn("rounded-md px-1.5 py-0.5", TEACHER_CHIP, "pointer-events-none")}>老師</span>
     <span className={cn("rounded-md px-1.5 py-0.5", SCHEDULE_CHIP, "pointer-events-none")}>班別</span>
     {(["矩尺座", "英仙座", "山案座"] as const).map((name) => (
      <span
       key={name}
       className={cn("rounded-md px-1.5 py-0.5 font-medium", roomChipClass(name), "pointer-events-none")}
      >
       {name}
      </span>
     ))}
    </div>
   ) : null}

   <div className="overflow-x-auto rounded-xl border border-border">
    <table
     className={cn(
      "w-full table-fixed border-collapse",
      mode === "all" ? "min-w-[56rem] text-xs" : "min-w-[640px] text-xs"
     )}
    >
     <thead>
      <tr className="bg-muted/50">
       <th className="sticky left-0 z-10 w-[7.5rem] border-b border-r border-border bg-muted/90 px-2 py-2">
        節次
       </th>
       {columnDates.map((ymd, i) => (
        <th key={ymd} className="border-b border-border px-1 py-2 text-center">
         <div>週{WEEKDAY_LABELS[i]}</div>
         <div className="tabular-nums">{ymd.slice(5).replace("-", "/")}</div>
        </th>
       ))}
      </tr>
     </thead>
     <tbody>
      {LESSON_SLOT_INDICES.map((slotIdx) => (
       <tr key={slotIdx}>
        <td className="sticky left-0 z-10 border-r border-border bg-muted/30 px-2 py-2 text-[11px] leading-tight text-muted-foreground align-top">
         {lessonSlotLabel(slotIdx)}
        </td>
        {columnDates.map((ymd, col) => {
         const key = `${slotIdx}-${col}`
         const list = cellSlots.get(key) ?? []
         const outOfYear = isOutOfYear(ymd)

         if (mode === "all" && showRoomOverlay) {
          const cellData = allModeCellData.get(key)
          return (
           <td key={ymd} className="border-b border-border align-top">
            {cellData ? (
             <AllTeachersCell
              data={cellData}
              readOnly={readOnly}
              onNavigateCreate={onNavigateCreate}
             />
            ) : (
             <span className="flex min-h-[6rem] items-center justify-center text-muted-foreground/30">
              —
             </span>
            )}
           </td>
          )
         }

         return (
          <td key={ymd} className="min-h-[2.5rem] border-b border-border p-0.5 align-top">
           <div className="flex min-h-[2rem] flex-col gap-0.5">
            {list.length > 0 ? (
             <div className="space-y-0.5">
              {list.map((s) => (
               <div
                key={s.id}
                className={cn(
                 "rounded px-1 py-0.5 text-[10px] leading-tight",
                 s.status === "可分配" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"
                )}
               >
                <div className="font-medium">{s.status}</div>
                {!readOnly && s.status === "可分配" ? (
                 <div className="mt-0.5 flex flex-wrap gap-0.5">
                  <button
                   type="button"
                   className="rounded bg-background/80 px-1 py-px text-[9px] hover:bg-background"
                   onClick={() => onNavigateCreate?.(s)}
                  >
                   建班
                  </button>
                  {onDeleteSlot ? (
                   <button
                    type="button"
                    className="inline-flex items-center gap-0.5 rounded bg-background/80 px-1 py-px text-[9px] text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteSlot(s.id)}
                    title="刪除此檔期"
                   >
                    <Trash2 className="h-2.5 w-2.5" />
                    刪除
                   </button>
                  ) : null}
                 </div>
                ) : null}
               </div>
              ))}
             </div>
            ) : !readOnly && onAddSlot && !outOfYear ? (
             <button
              type="button"
              className="flex min-h-[1.5rem] w-full items-center justify-center rounded border border-dashed border-border/60 text-muted-foreground hover:bg-muted/40"
              onClick={() => onAddSlot(ymd, slotIdx)}
              title="新增可任教檔期"
             >
              +
             </button>
            ) : (
             <span className="flex min-h-[1.5rem] items-center justify-center text-muted-foreground/30">—</span>
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
