import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import {
 roomColumnBgClass,
 roomColumnHeaderBgClass,
 UNASSIGNED_ROOM_LABEL,
} from "@/lib/classroomEligibility"
import {
 DAYTIME_SLOT_INDICES,
 EVENING_SLOT_INDICES,
 LESSON_SLOT_INDICES,
 lessonSlotLabel,
} from "@/lib/lessonSlots"
import {
 isStandardSchedulePlacement,
 nonStandardTimeHint,
 standardSlotIndexForSchedule,
} from "@/lib/scheduleDayView"
import { cn } from "@/lib/utils"
import { addDaysYmd, formatScheduleDateShort, mondayYmdOfWeekContaining } from "@/lib/weekdayUtils"
import type { RoomRecord } from "@/services/classroomQueries"
import { localYmd, type ScheduleManageRow } from "@/services/scheduleQueries"

const WEEKDAY_SHORT = ["一", "二", "三", "四", "五", "六", "日"] as const

type RoomColumn = { id: string; label: string; isUnassigned: boolean }

function roomColumnKey(col: RoomColumn): string {
 return col.isUnassigned ? "__none__" : col.id
}

function effectiveDayViewRoomId(
 schedule: ScheduleManageRow,
 activeRoomIds: ReadonlySet<string>
): string | null {
 const rid = schedule.classroom_id
 if (!rid || !activeRoomIds.has(rid)) return null
 return rid
}

function schedulesForRoomAtSlot(
 schedules: ScheduleManageRow[],
 col: RoomColumn,
 activeRoomIds: ReadonlySet<string>,
 slotIdx: number
): ScheduleManageRow[] {
 return schedules.filter((s) => {
  if (!isStandardSchedulePlacement(s)) return false
  if (standardSlotIndexForSchedule(s) !== slotIdx) return false
  const roomId = effectiveDayViewRoomId(s, activeRoomIds)
  return col.isUnassigned ? roomId === null : roomId === col.id
 })
}

function formatWeekRangeTitle(mondayYmd: string): string {
 const end = addDaysYmd(mondayYmd, 6)
 const [y1, m1, d1] = mondayYmd.split("-").map(Number)
 const [, m2, d2] = end.split("-").map(Number)
 return `${y1} 年 ${m1} 月 ${d1} 日 — ${m2} 月 ${d2} 日`
}

type Props = {
 dayViewDate: string
 onDayViewDateChange: (ymd: string) => void
 schedules: ScheduleManageRow[]
 studentRoster: Map<string, string[]>
 rosterLoading?: boolean
 emptyScheduleIds?: ReadonlySet<string>
 extraTagsByScheduleId?: ReadonlyMap<string, string[]>
 roomColumns: RoomRecord[]
 activeRoomIdSet: ReadonlySet<string>
 scheduleRowLocked: (s: ScheduleManageRow) => boolean
 inactiveRoomName: (s: ScheduleManageRow) => string | null
 onOpenDetail: (id: string) => void
 onMoveRequest?: (schedule: ScheduleManageRow) => void
 loading?: boolean
 dateLoaded?: boolean
}

export function MobileDayViewGrid({
 dayViewDate,
 onDayViewDateChange,
 schedules,
 studentRoster,
 rosterLoading = false,
 emptyScheduleIds,
 extraTagsByScheduleId,
 roomColumns,
 activeRoomIdSet,
 scheduleRowLocked,
 inactiveRoomName,
 onOpenDetail,
 onMoveRequest,
 loading = false,
 dateLoaded = true,
}: Props) {
 const [showEvening, setShowEvening] = useState(false)
 const [hideVacant, setHideVacant] = useState(false)

 const weekMonday = useMemo(() => mondayYmdOfWeekContaining(dayViewDate), [dayViewDate])
 const weekDates = useMemo(
  () => Array.from({ length: 7 }, (_, i) => addDaysYmd(weekMonday, i)),
  [weekMonday]
 )

 const columns: RoomColumn[] = useMemo(
  () => [
   ...roomColumns.map((r) => ({ id: r.id, label: r.name, isUnassigned: false })),
   { id: "__none__", label: UNASSIGNED_ROOM_LABEL, isUnassigned: true },
  ],
  [roomColumns]
 )

 const standardSchedules = useMemo(
  () => schedules.filter((s) => isStandardSchedulePlacement(s)),
  [schedules]
 )
 const nonStandardSchedules = useMemo(
  () => schedules.filter((s) => !isStandardSchedulePlacement(s)),
  [schedules]
 )

 const visibleSlots = useMemo(
  () => (showEvening ? LESSON_SLOT_INDICES : DAYTIME_SLOT_INDICES),
  [showEvening]
 )

 const occupiedRoomCountBySlot = useMemo(() => {
  const map = new Map<number, number>()
  for (const slotIdx of LESSON_SLOT_INDICES) {
   let n = 0
   for (const col of columns) {
    if (schedulesForRoomAtSlot(standardSchedules, col, activeRoomIdSet, slotIdx).length > 0) n += 1
   }
   map.set(slotIdx, n)
  }
  return map
 }, [columns, standardSchedules, activeRoomIdSet])

 const jumpWeek = (deltaWeeks: number) => {
  const nextMonday = addDaysYmd(weekMonday, deltaWeeks * 7)
  const dowOffset = weekDates.indexOf(dayViewDate)
  const offset = dowOffset >= 0 ? dowOffset : 0
  onDayViewDateChange(addDaysYmd(nextMonday, offset))
 }

 const renderCompactCard = (s: ScheduleManageRow, variant: "assigned" | "unassigned") => {
  const timeHint = nonStandardTimeHint(s)
  const roster = studentRoster.get(s.id) ?? []
  const empty = emptyScheduleIds?.has(s.id) ?? false
  const extraTags = extraTagsByScheduleId?.get(s.id) ?? []
  const canMove = Boolean(onMoveRequest) && !scheduleRowLocked(s)
  const studentSummary = rosterLoading
   ? "名單載入中…"
   : roster.length === 0
    ? "—"
    : roster.length <= 2
     ? roster.join("、")
     : `${roster.slice(0, 2).join("、")} 等 ${roster.length} 人`

  return (
   <div
    key={s.id}
    className={cn(
     "rounded-md border px-2.5 py-2",
     empty
      ? "border-border bg-muted/60 text-muted-foreground"
      : variant === "unassigned"
       ? "border-warning/70 bg-warning/20 text-warning"
       : "border-info/40 bg-info/10 text-info"
    )}
   >
    <button
     type="button"
     onClick={() => onOpenDetail(s.id)}
     className="w-full text-left transition-colors active:opacity-80"
    >
     <div className="text-sm font-semibold leading-snug text-foreground">{s.classLabel}</div>
     <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
      {s.start_time && s.end_time
       ? `${s.start_time}–${s.end_time}`
       : s.start_time ?? ""}
      {s.teacher_name ? ` · ${s.teacher_name}` : ""}
      {timeHint ? ` · ${timeHint}` : ""}
     </div>
     <div className="mt-0.5 text-xs text-muted-foreground">{studentSummary}</div>
     {inactiveRoomName(s) ? (
      <div className="mt-0.5 text-xs text-warning">原課室：{inactiveRoomName(s)}</div>
     ) : null}
    </button>
    {extraTags.length > 0 ? (
     <div className="mt-1.5 flex flex-wrap gap-1">
      {extraTags.map((t) => (
       <Tag key={t} tone="default" size="sm">
        {t}
       </Tag>
      ))}
     </div>
    ) : null}
    {canMove ? (
     <Button
      type="button"
      variant="link"
      className="mt-1 h-auto p-0 text-xs"
      onClick={() => onMoveRequest?.(s)}
     >
      移動到…
     </Button>
    ) : null}
   </div>
  )
 }

 return (
  <div className="space-y-3" aria-label="週曆日視圖">
   <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
    <div className="flex items-center justify-between gap-2">
     <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0"
      aria-label="上一週"
      onClick={() => jumpWeek(-1)}
     >
      <ChevronLeft className="h-4 w-4" />
     </Button>
     <div className="min-w-0 text-center">
      <p className="text-sm font-semibold leading-snug text-foreground">
       {formatWeekRangeTitle(weekMonday)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">以週瀏覽 · 點選日期查看各課室</p>
     </div>
     <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0"
      aria-label="下一週"
      onClick={() => jumpWeek(1)}
     >
      <ChevronRight className="h-4 w-4" />
     </Button>
    </div>

    <div
     className="mt-3 grid grid-cols-7 gap-1"
     role="tablist"
     aria-label="本週日期"
    >
     {weekDates.map((ymd, i) => {
      const selected = ymd === dayViewDate
      const isToday = ymd === localYmd()
      return (
       <button
        key={ymd}
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={() => onDayViewDateChange(ymd)}
        className={cn(
         "flex flex-col items-center rounded-lg px-0.5 py-2 text-center transition-colors",
         selected
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/40 text-foreground hover:bg-muted"
        )}
       >
        <span className={cn("text-[0.65rem]", selected ? "opacity-90" : "text-muted-foreground")}>
         {WEEKDAY_SHORT[i]}
        </span>
        <span className="mt-0.5 text-sm font-semibold tabular-nums">
         {formatScheduleDateShort(ymd).split("/")[1]}
        </span>
        {isToday && !selected ? (
         <span className="mt-0.5 h-1 w-1 rounded-full bg-amber-500" aria-label="今天" />
        ) : (
         <span className="mt-0.5 h-1 w-1" aria-hidden />
        )}
       </button>
      )
     })}
    </div>
   </div>

   <div className="flex flex-wrap items-center gap-2">
    <Button
     type="button"
     variant={showEvening ? "secondary" : "outline"}
     size="sm"
     className="text-xs"
     aria-pressed={showEvening}
     onClick={() => setShowEvening((v) => !v)}
    >
     {showEvening ? "只看朝 9–晚 6" : "顯示晚間"}
    </Button>
    <Button
     type="button"
     variant={hideVacant ? "secondary" : "outline"}
     size="sm"
     className="text-xs"
     aria-pressed={hideVacant}
     onClick={() => setHideVacant((v) => !v)}
    >
     {hideVacant ? "顯示空置課室" : "只看使用中"}
    </Button>
    <span className="text-xs tabular-nums text-muted-foreground">
     {loading
      ? "載入中…"
      : !dateLoaded
       ? `正在載入 ${dayViewDate}…`
       : `${dayViewDate} · ${schedules.length} 堂`}
    </span>
   </div>

   {!showEvening && EVENING_SLOT_INDICES.some((i) => (occupiedRoomCountBySlot.get(i) ?? 0) > 0) ? (
    <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
     晚間尚有課堂；可點「顯示晚間」展開 17:45 後時段。
    </p>
   ) : null}

   <div className="space-y-3">
    {visibleSlots.map((slotIdx) => {
     const occupied = occupiedRoomCountBySlot.get(slotIdx) ?? 0
     const rows = columns
      .map((col) => ({
       col,
       items: schedulesForRoomAtSlot(standardSchedules, col, activeRoomIdSet, slotIdx),
      }))
      .filter(({ items }) => !hideVacant || items.length > 0)

     return (
      <section
       key={slotIdx}
       className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
       aria-label={lessonSlotLabel(slotIdx)}
      >
       <header className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <h3 className="text-sm font-semibold tabular-nums text-foreground">
         {lessonSlotLabel(slotIdx)}
        </h3>
        <span className="text-xs text-muted-foreground">
         {occupied}/{columns.length} 課室使用中
        </span>
       </header>
       {rows.length === 0 ? (
        <p className="px-3 py-4 text-center text-sm text-muted-foreground">此時段無使用中課室</p>
       ) : (
        <ul className="divide-y divide-border">
         {rows.map(({ col, items }) => (
          <li
           key={roomColumnKey(col)}
           className={cn(
            "px-3 py-2.5",
            roomColumnBgClass(col.isUnassigned ? UNASSIGNED_ROOM_LABEL : col.label)
           )}
          >
           <div
            className={cn(
             "mb-1.5 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
             roomColumnHeaderBgClass(col.isUnassigned ? UNASSIGNED_ROOM_LABEL : col.label)
            )}
           >
            {col.label}
           </div>
           {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">空置</p>
           ) : (
            <div className="flex flex-col gap-1.5">
             {items.map((s) =>
              renderCompactCard(s, col.isUnassigned ? "unassigned" : "assigned")
             )}
            </div>
           )}
          </li>
         ))}
        </ul>
       )}
      </section>
     )
    })}

    {nonStandardSchedules.length > 0 ? (
     <section className="overflow-hidden rounded-xl border border-warning/40 bg-warning/5 shadow-sm">
      <header className="border-b border-warning/30 px-3 py-2">
       <h3 className="text-sm font-semibold text-warning">其他時段</h3>
       <p className="text-xs text-muted-foreground">非標準時間排程</p>
      </header>
      <ul className="divide-y divide-border">
       {columns.map((col) => {
        const items = nonStandardSchedules.filter((s) => {
         const roomId = effectiveDayViewRoomId(s, activeRoomIdSet)
         return col.isUnassigned ? roomId === null : roomId === col.id
        })
        if (items.length === 0) return null
        return (
         <li key={roomColumnKey(col)} className="px-3 py-2.5">
          <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{col.label}</div>
          <div className="flex flex-col gap-1.5">
           {items.map((s) => renderCompactCard(s, col.isUnassigned ? "unassigned" : "assigned"))}
          </div>
         </li>
        )
       })}
      </ul>
     </section>
    ) : null}
   </div>
  </div>
 )
}
