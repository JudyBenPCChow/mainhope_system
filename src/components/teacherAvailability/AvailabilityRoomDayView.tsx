import { Fragment, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import { addDaysYmd, weekdayLabelFromYmd } from "@/lib/weekdayUtils"
import {
 classroomsActiveOnDate,
 roomColumnBgClass,
 roomColumnHeaderBgClass,
 UNASSIGNED_ROOM_ID,
 UNASSIGNED_ROOM_LABEL,
} from "@/lib/classroomEligibility"
import type { RoomRecord } from "@/services/classroomQueries"
import {
 occupiersForSlot,
 type RoomCalendarPendingRow,
 type RoomCalendarScheduleRow,
} from "@/services/roomBookingQueries"
import type { TeacherAvailabilitySlot } from "@/services/teacherAvailabilityQueries"
import { slotIndexForStoredTimeSlot } from "@/services/teacherAvailabilityQueries"

/** 單一課室欄寬（約 3 天可同時入畫面） */
const ROOM_COL_W = "w-[4.75rem] min-w-[4.75rem] max-w-[4.75rem]"

const UNASSIGNED_ROOM: RoomRecord = {
 id: UNASSIGNED_ROOM_ID,
 name: UNASSIGNED_ROOM_LABEL,
 capacity: null,
 is_online: false,
 remarks: null,
}

type Props = {
 windowStart: string
 onWindowStartChange: (ymd: string) => void
 yearStart?: string
 yearEnd: string
 slots: TeacherAvailabilitySlot[]
 rooms: RoomRecord[]
 roomSchedules: RoomCalendarScheduleRow[]
 roomPending: RoomCalendarPendingRow[]
 onTeacherSlotClick?: (slot: TeacherAvailabilitySlot) => void
 onFreeRoomClick?: (ctx: {
  ymd: string
  room: RoomRecord
  slotIndex: number
  availableTeachers: TeacherAvailabilitySlot[]
 }) => void
 readOnly?: boolean
}

type DayColumn = {
 room: RoomRecord
 isUnassigned: boolean
}

type DayBlock = {
 ymd: string
 columns: DayColumn[]
 outOfYear: boolean
}

function formatDayHeader(ymd: string): string {
 const [, m, d] = ymd.split("-").map(Number)
 const dow = weekdayLabelFromYmd(ymd)
 return `${d} / ${m}（${dow ?? ""}）`
}

function buildDayColumns(rooms: RoomRecord[], ymd: string): DayColumn[] {
 const active = classroomsActiveOnDate(rooms, ymd)
 return [
  ...active.map((room) => ({ room, isUnassigned: false })),
  { room: UNASSIGNED_ROOM, isUnassigned: true },
 ]
}

function availableTeachersForSlot(
 ymd: string,
 slotIndex: number,
 slots: TeacherAvailabilitySlot[]
): TeacherAvailabilitySlot[] {
 return slots
  .filter(
   (s) =>
    s.available_date.slice(0, 10) === ymd &&
    s.status === "可分配" &&
    slotIndexForStoredTimeSlot(s.time_slot) === slotIndex
  )
  .sort((a, b) => (a.teacher_name ?? "").localeCompare(b.teacher_name ?? "", "zh-Hant"))
}

function roomBorderClass(isLastInDay: boolean): string {
 return isLastInDay
  ? "border-r-2 border-solid border-border"
  : "border-r border-dashed border-border/80"
}

function OccupantList({ items }: { items: ReturnType<typeof occupiersForSlot> }) {
 return (
  <ul className="space-y-1">
   {items.map((o) => (
    <li
     key={`${o.kind}-${o.id}`}
     className={cn(
      "rounded px-1 py-0.5 text-[10px] leading-tight ring-1",
      o.kind === "pending"
       ? "bg-warning/30 text-warning-foreground ring-warning/40"
       : "bg-background/70 text-amber-950 ring-amber-300/50"
     )}
     title={[o.label, o.teacherName].filter(Boolean).join(" · ")}
    >
     <div className="line-clamp-2 font-medium">{o.label}</div>
     {o.teacherName ? (
      <div className="mt-px truncate text-[9px] opacity-85">{o.teacherName}</div>
     ) : null}
    </li>
   ))}
  </ul>
 )
}

function RoomCell({
 ymd,
 room,
 isUnassigned,
 slotIndex,
 slotStart,
 slotEnd,
 roomSchedules,
 roomPending,
 muted,
 readOnly,
 onFreeRoomClick,
}: {
 ymd: string
 room: RoomRecord
 isUnassigned: boolean
 slotIndex: number
 slotStart: number
 slotEnd: number
 roomSchedules: RoomCalendarScheduleRow[]
 roomPending: RoomCalendarPendingRow[]
 muted?: boolean
 readOnly?: boolean
 onFreeRoomClick?: (ctx: {
  ymd: string
  room: RoomRecord
  slotIndex: number
  availableTeachers: TeacherAvailabilitySlot[]
 }) => void
}) {
 const occ = occupiersForSlot(ymd, room.id, slotStart, slotEnd, roomSchedules, roomPending)

 if (muted) {
  return <span className="text-[10px] text-muted-foreground/40">—</span>
 }

 if (isUnassigned) {
  if (occ.length === 0) {
   return <span className="text-[10px] text-muted-foreground/50">—</span>
  }
  return <OccupantList items={occ} />
 }

 if (occ.length === 0) {
  if (!readOnly && onFreeRoomClick && !isUnassigned) {
   return (
    <button
     type="button"
     className="w-full rounded px-0.5 py-1 text-[11px] font-medium leading-tight text-success hover:bg-success/10 hover:underline"
     title="由此空檔建班"
     onClick={() =>
      onFreeRoomClick({
       ymd,
       room,
       slotIndex,
       availableTeachers: [],
      })
     }
    >
     有空
    </button>
   )
  }
  return <span className="text-[11px] font-medium leading-tight text-success">有空</span>
 }

 return <OccupantList items={occ} />
}

export function AvailabilityRoomDayView({
 windowStart,
 onWindowStartChange,
 yearStart,
 yearEnd,
 slots,
 rooms,
 roomSchedules,
 roomPending,
 onTeacherSlotClick,
 onFreeRoomClick,
 readOnly,
}: Props) {
 const windowEnd = useMemo(() => addDaysYmd(windowStart, 6), [windowStart])

 const isOutOfYear = (ymd: string) => {
  const yFrom = yearStart?.slice(0, 10)
  if (yFrom && ymd < yFrom) return true
  return ymd > yearEnd.slice(0, 10)
 }

 const dayBlocks = useMemo((): DayBlock[] => {
  return Array.from({ length: 7 }, (_, i) => {
   const ymd = addDaysYmd(windowStart, i)
   return {
    ymd,
    columns: buildDayColumns(rooms, ymd),
    outOfYear: isOutOfYear(ymd),
   }
  })
 }, [windowStart, rooms, yearStart, yearEnd])

 return (
  <div className="space-y-3">
   <div className="flex flex-wrap items-center gap-2">
    <Button
     type="button"
     variant="outline"
     size="icon"
     onClick={() => onWindowStartChange(addDaysYmd(windowStart, -1))}
     aria-label="上一日"
    >
     <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button
     type="button"
     variant="outline"
     size="icon"
     onClick={() => onWindowStartChange(addDaysYmd(windowStart, 1))}
     aria-label="下一日"
    >
     <ChevronRight className="h-4 w-4" />
    </Button>
    <span className="text-sm font-medium tabular-nums">
     {windowStart} 起 · {windowEnd}
    </span>
    <span className="text-xs text-muted-foreground">
     共 7 日，左右捲動；箭咀每次移動一日
    </span>
   </div>

   <div className="flex flex-wrap items-center gap-2 text-[10px]">
    <span className={cn("rounded-md px-2 py-0.5 font-medium", roomColumnHeaderBgClass("山案座"))}>
     山案座
    </span>
    <span className={cn("rounded-md px-2 py-0.5 font-medium", roomColumnHeaderBgClass("英仙座"))}>
     英仙座
    </span>
    <span className={cn("rounded-md px-2 py-0.5 font-medium", roomColumnHeaderBgClass("矩尺座"))}>
     矩尺座
    </span>
    <span className={cn("rounded-md px-2 py-0.5 font-medium", roomColumnHeaderBgClass(UNASSIGNED_ROOM_LABEL))}>
     未編課室
    </span>
   </div>

   <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-max table-fixed border-collapse text-xs">
     <thead>
      <tr className="bg-muted/60">
       <th
        rowSpan={2}
        className="sticky left-0 z-20 w-[5.25rem] min-w-[5.25rem] border-b border-r-2 border-solid border-border bg-muted/90 px-1.5 py-2 text-left text-[11px] font-medium"
       >
        時段
       </th>
       {dayBlocks.map((day) => (
        <th
         key={day.ymd}
         colSpan={day.columns.length}
         className={cn(
          "border-b border-r-2 border-solid border-border px-1 py-1.5 text-center text-[11px] font-semibold",
          day.outOfYear && "text-muted-foreground"
         )}
        >
         {formatDayHeader(day.ymd)}
        </th>
       ))}
      </tr>
      <tr>
       {dayBlocks.flatMap((day) =>
        day.columns.map(({ room, isUnassigned }, ci) => (
         <th
          key={`${day.ymd}-${room.id}`}
          className={cn(
           "border-b px-0.5 py-1 text-center text-[10px] font-medium leading-tight",
           roomBorderClass(ci === day.columns.length - 1),
           roomColumnHeaderBgClass(room.name),
           ROOM_COL_W,
           day.outOfYear && "opacity-60"
          )}
         >
          {isUnassigned ? (
           <span className="block scale-90">{room.name}</span>
          ) : (
           room.name
          )}
         </th>
        ))
       )}
      </tr>
     </thead>
     <tbody>
       {LESSON_SLOT_INDICES.map((slotIdx) => {
          const slotStart = lessonSlotStartMinute(slotIdx)
          const slotEnd = lessonSlotEndMinute(slotIdx)

          return (
           <Fragment key={slotIdx}>
            <tr className="align-top">
             <td
              rowSpan={2}
              className="sticky left-0 z-10 border-b border-r-2 border-solid border-border bg-muted/30 px-1 py-1.5 text-[10px] tabular-nums leading-tight text-muted-foreground"
             >
              {lessonSlotLabel(slotIdx)}
             </td>
             {dayBlocks.flatMap((day) => {
              const availableTeachers = day.outOfYear
               ? []
               : availableTeachersForSlot(day.ymd, slotIdx, slots)
              return day.columns.map(({ room, isUnassigned }, ci) => (
               <td
                key={`${day.ymd}-${room.id}-${slotIdx}`}
                className={cn(
                 "min-h-[2.75rem] border-b px-1 py-1.5 align-top",
                 roomBorderClass(ci === day.columns.length - 1),
                 roomColumnBgClass(room.name),
                 ROOM_COL_W,
                 day.outOfYear && "opacity-60"
                )}
               >
                <RoomCell
                 ymd={day.ymd}
                 room={room}
                 isUnassigned={isUnassigned}
                 slotIndex={slotIdx}
                 slotStart={slotStart}
                 slotEnd={slotEnd}
                 roomSchedules={roomSchedules}
                 roomPending={roomPending}
                 muted={day.outOfYear}
                 readOnly={readOnly}
                 onFreeRoomClick={
                  onFreeRoomClick
                   ? (partial) =>
                      onFreeRoomClick({
                       ...partial,
                       availableTeachers,
                      })
                   : undefined
                 }
                />
               </td>
              ))
             })}
            </tr>
         <tr>
          {dayBlocks.map((day) => {
           const availableTeachers = day.outOfYear
            ? []
            : availableTeachersForSlot(day.ymd, slotIdx, slots)
           return (
            <td
             key={`${day.ymd}-${slotIdx}-teachers`}
             colSpan={day.columns.length}
             className={cn(
              "border-b border-r-2 border-solid border-border bg-info/[0.04] px-1 py-1 text-[10px] leading-snug",
              day.outOfYear && "bg-muted/20 opacity-60"
             )}
            >
             <span className="text-muted-foreground">可任教：</span>
             {availableTeachers.length > 0 ? (
              availableTeachers.map((s, i) => (
               <Fragment key={s.id}>
                {i > 0 ? <span className="text-muted-foreground">, </span> : null}
                {!readOnly && onTeacherSlotClick ? (
                 <button
                  type="button"
                  className="text-info hover:underline"
                  onClick={() => onTeacherSlotClick(s)}
                 >
                  {s.teacher_name}
                 </button>
                ) : (
                 <span className="text-info">{s.teacher_name}</span>
                )}
               </Fragment>
              ))
             ) : (
              <span className="text-muted-foreground">—</span>
             )}
            </td>
           )
          })}
         </tr>
        </Fragment>
       )
      })}
     </tbody>
    </table>
   </div>

   <p className="text-[10px] text-muted-foreground">
    課室之間虛線 · 日期之間實線 · 點擊「有空」可建班（不含排程）
   </p>
  </div>
 )
}
