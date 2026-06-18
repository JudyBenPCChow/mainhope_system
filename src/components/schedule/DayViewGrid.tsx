import { useMemo } from "react"
import { AlertTriangle, Move } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { ScheduleAlertIcons } from "@/components/schedule/ScheduleAlertIcons"
import { roomColumnBgClass, roomColumnHeaderBgClass, UNASSIGNED_ROOM_LABEL } from "@/lib/classroomEligibility"
import { LESSON_SLOT_COUNT, LESSON_SLOT_INDICES, lessonSlotLabel } from "@/lib/lessonSlots"
import {
 isStandardSchedulePlacement,
 nonStandardTimeHint,
 slotSpanForStandardSchedule,
 standardSlotIndexForSchedule,
} from "@/lib/scheduleDayView"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { RoomRecord } from "@/services/classroomQueries"
import type { ScheduleAlerts, ScheduleManageRow } from "@/services/scheduleQueries"

type RoomColumn = { id: string; label: string; isUnassigned: boolean }

type CellPlan =
 | { kind: "skip" }
 | { kind: "render"; schedules: ScheduleManageRow[]; rowSpan: number }

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

function schedulesForRoomColumn(
 schedules: ScheduleManageRow[],
 col: RoomColumn,
 activeRoomIds: ReadonlySet<string>,
 predicate: (s: ScheduleManageRow) => boolean
): ScheduleManageRow[] {
 return schedules.filter((s) => {
  const roomId = effectiveDayViewRoomId(s, activeRoomIds)
  const matchesRoom = col.isUnassigned ? roomId === null : roomId === col.id
  return matchesRoom && predicate(s)
 })
}

function buildStandardGridPlan(
 standardSchedules: ScheduleManageRow[],
 columns: RoomColumn[],
 activeRoomIds: ReadonlySet<string>
): CellPlan[][] {
 const plans: CellPlan[][] = []
 const rowspanRemain: Record<string, number> = {}

 for (let slotIdx = 0; slotIdx < LESSON_SLOT_COUNT; slotIdx++) {
  const row: CellPlan[] = []
  for (const col of columns) {
   const key = roomColumnKey(col)
   if ((rowspanRemain[key] ?? 0) > 0) {
    rowspanRemain[key] = (rowspanRemain[key] ?? 0) - 1
    row.push({ kind: "skip" })
    continue
   }

   const cellSchedules = schedulesForRoomColumn(
    standardSchedules,
    col,
    activeRoomIds,
    (s) => standardSlotIndexForSchedule(s) === slotIdx
   )
   const rowSpan =
    cellSchedules.length === 1 ? slotSpanForStandardSchedule(cellSchedules[0]!) : 1
   if (rowSpan > 1) rowspanRemain[key] = rowSpan - 1
   row.push({ kind: "render", schedules: cellSchedules, rowSpan })
  }
  plans.push(row)
 }
 return plans
}

export function DayViewScheduleCard({
 schedule,
 alerts,
 studentNames,
 variant,
 historyReadOnly,
 inactiveRoomName,
 onOpenDetail,
 onMoveRequest,
 onDragStart,
}: {
 schedule: ScheduleManageRow
 alerts: ScheduleAlerts
 studentNames: string[]
 variant: "assigned" | "unassigned"
 historyReadOnly: boolean
 inactiveRoomName?: string | null
 onOpenDetail: () => void
 onMoveRequest?: () => void
 onDragStart: (e: React.DragEvent) => void
}) {
 const timeHint = nonStandardTimeHint(schedule)
 const timeLabel =
  schedule.start_time && schedule.end_time
   ? `${schedule.start_time}–${schedule.end_time}`
   : schedule.start_time ?? ""
 const span = isStandardSchedulePlacement(schedule) ? slotSpanForStandardSchedule(schedule) : 1
 const studentSummary =
  studentNames.length === 0
   ? "—"
   : studentNames.length <= 3
    ? studentNames.join("、")
    : `${studentNames.slice(0, 2).join("、")} 等 ${studentNames.length} 人`

 return (
  <div
   draggable={!historyReadOnly}
   aria-disabled={historyReadOnly}
   onDragStart={onDragStart}
   className={cn(
    "rounded-lg border px-2.5 py-2.5 text-sm shadow-sm",
    historyReadOnly ? "cursor-default opacity-75" : "cursor-grab active:cursor-grabbing",
    variant === "unassigned"
     ? "border-warning/60 bg-warning/15 text-warning-foreground"
     : "border-info/50 bg-info/10 text-info"
   )}
  >
   <div className="flex items-start justify-between gap-1.5">
    <button
     type="button"
     className="min-w-0 flex-1 break-words text-left font-semibold leading-snug hover:underline"
     onClick={onOpenDetail}
    >
     {schedule.classLabel}
    </button>
    <ScheduleAlertIcons alerts={alerts} />
   </div>
   <div className="mt-1.5 flex flex-wrap items-center gap-1">
    <Tag tone={statusToTagTone(schedule.status)} size="sm">
     {schedule.status}
    </Tag>
    {schedule.is_extra_lesson ? (
     <Tag tone={statusToTagTone("加堂")} size="sm">加堂</Tag>
    ) : null}
    {span > 1 ? (
     <span className="text-[10px] text-muted-foreground">佔 {span} 格</span>
    ) : null}
   </div>
   {schedule.status.includes("取消") && schedule.cancel_reason ? (
    <p className="mt-1 break-words text-xs text-muted-foreground" title={schedule.cancel_reason}>
     取消原因：{schedule.cancel_reason}
    </p>
   ) : null}
   <p className="mt-1.5 break-words text-xs leading-relaxed opacity-90">
    老師：{schedule.teacher_name?.trim() || "—"}
   </p>
   <p className="mt-0.5 break-words text-xs leading-relaxed opacity-90" title={studentNames.join("、")}>
    學生：{studentSummary}
   </p>
   {inactiveRoomName ? (
    <p className="mt-1 text-xs text-warning">原課室：{inactiveRoomName}（此日未開放）</p>
   ) : null}
   {timeLabel ? (
    <p className="mt-1.5 tabular-nums text-xs font-medium opacity-80">{timeLabel}</p>
   ) : null}
   {timeHint ? (
    <p className="mt-1 flex items-start gap-1 text-xs text-warning" title={timeHint}>
     <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
     <span>{timeHint}</span>
    </p>
   ) : null}
   {historyReadOnly ? (
    <p className="mt-1 text-[10px] text-muted-foreground">僅檢視，不可拖曳調整</p>
   ) : onMoveRequest ? (
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="mt-2 h-7 w-full gap-1 text-xs"
     onClick={onMoveRequest}
    >
     <Move className="h-3.5 w-3.5" aria-hidden />
     移動到…
    </Button>
   ) : null}
  </div>
 )
}

type Props = {
 dayViewDate: string
 schedules: ScheduleManageRow[]
 alerts: Map<string, ScheduleAlerts>
 studentRoster: Map<string, string[]>
 roomColumns: RoomRecord[]
 activeRoomIdSet: ReadonlySet<string>
 roomColPct: { timePct: number; each: number }
 scheduleRowLocked: (s: ScheduleManageRow) => boolean
 inactiveRoomName: (s: ScheduleManageRow) => string | null
 onDropOnCell: (e: React.DragEvent, roomId: string | null, slotIndex: number) => void
 onOpenDetail: (id: string) => void
 onMoveRequest: (schedule: ScheduleManageRow) => void
}

export function DayViewGrid({
 dayViewDate,
 schedules,
 alerts,
 studentRoster,
 roomColumns,
 activeRoomIdSet,
 roomColPct,
 scheduleRowLocked,
 inactiveRoomName,
 onDropOnCell,
 onOpenDetail,
 onMoveRequest,
}: Props) {
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

 const gridPlan = useMemo(
  () => buildStandardGridPlan(standardSchedules, columns, activeRoomIdSet),
  [standardSchedules, columns, activeRoomIdSet]
 )

 const renderCard = (s: ScheduleManageRow, variant: "assigned" | "unassigned") => (
  <DayViewScheduleCard
   key={s.id}
   schedule={s}
   alerts={alerts.get(s.id) ?? { trial: false, makeup: false, leave: false, record: false }}
   studentNames={s.class_id ? (studentRoster.get(s.class_id) ?? []) : []}
   variant={variant}
   historyReadOnly={scheduleRowLocked(s)}
   inactiveRoomName={inactiveRoomName(s)}
   onOpenDetail={() => onOpenDetail(s.id)}
   onMoveRequest={scheduleRowLocked(s) ? undefined : () => onMoveRequest(s)}
   onDragStart={(e) => {
    if (scheduleRowLocked(s)) {
     e.preventDefault()
     return
    }
    e.dataTransfer.setData("application/json", JSON.stringify({ id: s.id }))
    e.dataTransfer.effectAllowed = "move"
   }}
  />
 )

 return (
  <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
   <p className="border-b border-border bg-muted/30 px-4 py-3 text-sm font-medium">
    {dayViewDate} · 日視圖（依課室）· 每格 75 分鐘 · 拖曳或「移動到…」可調整課室與時段
   </p>
   <table className="w-full min-w-[1040px] table-fixed border-collapse text-sm">
    <colgroup>
     <col style={{ width: `${roomColPct.timePct}%` }} />
     {columns.map((col) => (
      <col key={roomColumnKey(col)} style={{ width: `${roomColPct.each}%` }} />
     ))}
    </colgroup>
    <thead>
     <tr className="bg-muted/40">
      <th className="sticky left-0 z-[1] border border-border bg-muted/50 px-2 py-3">時間</th>
      {columns.map((col) => (
       <th
        key={roomColumnKey(col)}
        className={cn(
         "min-w-0 border border-border px-2 py-3 font-medium",
         roomColumnHeaderBgClass(col.isUnassigned ? UNASSIGNED_ROOM_LABEL : col.label)
        )}
       >
        <span className="block break-words">{col.label}</span>
       </th>
      ))}
     </tr>
    </thead>
    <tbody>
     {LESSON_SLOT_INDICES.map((slotIdx) => (
      <tr key={slotIdx}>
       <td className="sticky left-0 z-[1] border border-border bg-card px-2 py-2 tabular-nums text-muted-foreground">
        {lessonSlotLabel(slotIdx)}
       </td>
       {gridPlan[slotIdx]!.map((plan, colIdx) => {
        if (plan.kind === "skip") return null
        const col = columns[colIdx]!
        return (
         <td
          key={roomColumnKey(col)}
          rowSpan={plan.rowSpan > 1 ? plan.rowSpan : undefined}
          className={cn(
           "align-top border border-border p-1.5 transition-colors",
           col.isUnassigned ? "hover:bg-warning/10" : "hover:bg-info/5",
           roomColumnBgClass(col.isUnassigned ? UNASSIGNED_ROOM_LABEL : col.label)
          )}
          data-room-id={col.isUnassigned ? "__none__" : col.id}
          onDragOver={(e) => {
           e.preventDefault()
           e.dataTransfer.dropEffect = "move"
          }}
          onDrop={(e) => onDropOnCell(e, col.isUnassigned ? null : col.id, slotIdx)}
         >
          <div
           className={cn(
            "flex flex-col gap-1.5",
            plan.rowSpan > 1 ? "min-h-full" : "min-h-[7.5rem]"
           )}
          >
           {plan.schedules.map((s) =>
            renderCard(s, col.isUnassigned ? "unassigned" : "assigned")
           )}
          </div>
         </td>
        )
       })}
      </tr>
     ))}
     {nonStandardSchedules.length > 0 ? (
      <tr className="bg-warning/5">
       <td className="sticky left-0 z-[1] border border-border bg-warning/10 px-2 py-2 text-xs font-medium text-warning">
        其他時段
        <span className="mt-0.5 block font-normal text-muted-foreground">非標準時間</span>
       </td>
       {columns.map((col) => (
        <td
         key={roomColumnKey(col)}
         className={cn(
          "align-top border border-border p-1.5",
          roomColumnBgClass(col.isUnassigned ? UNASSIGNED_ROOM_LABEL : col.label)
         )}
        >
         <div className="flex min-h-[5rem] flex-col gap-1.5">
          {schedulesForRoomColumn(nonStandardSchedules, col, activeRoomIdSet, () => true).map(
           (s) => renderCard(s, col.isUnassigned ? "unassigned" : "assigned")
          )}
         </div>
        </td>
       ))}
      </tr>
     ) : null}
    </tbody>
   </table>
  </div>
 )
}
