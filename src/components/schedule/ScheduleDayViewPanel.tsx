import type { ReactNode } from "react"
import { Wand2 } from "lucide-react"

import { DayViewGrid } from "@/components/schedule/DayViewGrid"
import { MobileDayViewGrid } from "@/components/schedule/MobileDayViewGrid"
import { Button } from "@/components/ui/button"
import { DateStepper } from "@/components/ui/date-stepper"
import { Input } from "@/components/ui/input"
import { SkeletonTimetableBlock } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { RoomRecord } from "@/services/classroomQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

type Props = {
 isMobile: boolean
 allowMobileDayView: boolean
 dayViewDate: string
 onDayViewDateChange: (ymd: string) => void
 onJumpToday: () => void
 loading: boolean
 dayViewDateLoaded: boolean
 dayViewRosterLoading: boolean
 dayFiltered: ScheduleManageRow[]
 dayUnfilteredCount: number
 dayUnassignedCount: number
 dayViewFilterActive: boolean
 scheduleMgmtLocked: boolean
 assigning: boolean
 onOneClickAssign: () => void
 onClearFilters: () => void
 closureName: string | undefined
 studentRoster: Map<string, string[]>
 emptyScheduleIds: Set<string>
 extraTagsByScheduleId: Map<string, string[]>
 roomColumns: RoomRecord[]
 activeRoomIdSet: ReadonlySet<string>
 roomColPct: { timePct: number; each: number }
 scheduleRowLocked: (s: ScheduleManageRow) => boolean
 inactiveRoomName: (s: ScheduleManageRow) => string | null
 onOpenDetail: (id: string) => void
 onMoveRequest: (s: ScheduleManageRow) => void
 onDropOnCell: (e: React.DragEvent, roomId: string | null, slotIndex: number) => void
}

export function ScheduleDayViewPanel({
 isMobile,
 allowMobileDayView,
 dayViewDate,
 onDayViewDateChange,
 onJumpToday,
 loading,
 dayViewDateLoaded,
 dayViewRosterLoading,
 dayFiltered,
 dayUnfilteredCount,
 dayUnassignedCount,
 dayViewFilterActive,
 scheduleMgmtLocked,
 assigning,
 onOneClickAssign,
 onClearFilters,
 closureName,
 studentRoster,
 emptyScheduleIds,
 extraTagsByScheduleId,
 roomColumns,
 activeRoomIdSet,
 roomColPct,
 scheduleRowLocked,
 inactiveRoomName,
 onOpenDetail,
 onMoveRequest,
 onDropOnCell,
}: Props) {
 const countLabel = loading
  ? "載入中…"
  : !dayViewDateLoaded
    ? `正在載入 ${dayViewDate} 的排程…`
    : dayViewRosterLoading
      ? `本日 ${dayFiltered.length} 堂 · 點名冊更新中…`
      : `本日 ${dayFiltered.length} 堂`

 const toolbar: ReactNode = (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm">
   <div className="flex flex-wrap items-center gap-2">
    {!isMobile ? (
     <>
      <span className="text-sm font-medium text-muted-foreground">日視圖日期</span>
      <DateStepper value={dayViewDate} onChange={onDayViewDateChange} />
     </>
    ) : (
     <Input
      type="date"
      value={dayViewDate}
      onChange={(e) => onDayViewDateChange(e.target.value)}
      className="h-10 w-[11rem] cursor-pointer text-sm"
      aria-label="跳至日期"
     />
    )}
    <Button
     type="button"
     variant="outline"
     size="default"
     className="border-amber-400/80 text-sm text-amber-900 hover:bg-amber-50"
     onClick={onJumpToday}
    >
     今天
    </Button>
    <Button
     type="button"
     size="default"
     className="gap-1.5 bg-info text-sm text-white shadow-sm hover:bg-info"
     disabled={scheduleMgmtLocked || assigning || loading || dayViewRosterLoading}
     onClick={onOneClickAssign}
    >
     <Wand2 className="h-4 w-4" aria-hidden />
     {assigning ? "分配中…" : dayViewRosterLoading ? "名單載入中…" : "一鍵分配"}
    </Button>
   </div>
   <div className={cn("text-right", isMobile && "w-full text-left sm:w-auto sm:text-right")}>
    <span className="tabular-nums text-muted-foreground">{countLabel}</span>
    {!loading && dayViewDateLoaded && dayUnassignedCount > 0 ? (
     <p className="mt-0.5 text-sm text-warning">未編課室 {dayUnassignedCount} 堂</p>
    ) : null}
    {dayViewFilterActive && dayUnfilteredCount > dayFiltered.length ? (
     <p className="mt-0.5 text-sm text-warning">
      已套用篩選（本日共 {dayUnfilteredCount} 堂，顯示 {dayFiltered.length} 堂）
     </p>
    ) : null}
   </div>
  </div>
 )

 return (
  <div className="space-y-4">
   {toolbar}
   {scheduleMgmtLocked ? (
    <p className="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
     你目前僅能檢視日視圖；拖曳、「移動到…」與一鍵分配需管理員權限。
    </p>
   ) : null}
   {dayViewFilterActive ? (
    <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
     日視圖已套用上方搜尋或篩選條件。
     <button type="button" className="ml-2 font-medium underline hover:no-underline" onClick={onClearFilters}>
      清除篩選
     </button>
    </p>
   ) : null}
   {closureName ? (
    <p role="status" className="rounded-lg border border-warning/50 px-3 py-2 text-sm text-warning">
     {dayViewDate} 為校舍假期（{closureName}）。該日沒有課堂，並非取消堂。
    </p>
   ) : null}
   {isMobile && allowMobileDayView ? (
    loading && !dayViewDateLoaded ? (
     <SkeletonTimetableBlock />
    ) : (
     <MobileDayViewGrid
      dayViewDate={dayViewDate}
      onDayViewDateChange={onDayViewDateChange}
      schedules={dayFiltered}
      studentRoster={studentRoster}
      rosterLoading={dayViewRosterLoading}
      emptyScheduleIds={emptyScheduleIds}
      extraTagsByScheduleId={extraTagsByScheduleId}
      roomColumns={roomColumns}
      activeRoomIdSet={activeRoomIdSet}
      scheduleRowLocked={scheduleRowLocked}
      inactiveRoomName={inactiveRoomName}
      onOpenDetail={onOpenDetail}
      onMoveRequest={scheduleMgmtLocked ? undefined : onMoveRequest}
      loading={loading}
      dateLoaded={dayViewDateLoaded}
     />
    )
   ) : dayFiltered.length === 0 ? (
    <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm shadow-sm">
     {loading ? (
      <SkeletonTimetableBlock />
     ) : !dayViewDateLoaded ? (
      <p className="text-muted-foreground">正在載入 {dayViewDate} 的排程…</p>
     ) : dayViewFilterActive && dayUnfilteredCount > 0 ? (
      <p className="text-muted-foreground">
       本日有 {dayUnfilteredCount} 堂排程，但目前篩選條件下沒有符合的項目。
      </p>
     ) : (
      <p className="text-muted-foreground">本日沒有排程</p>
     )}
    </div>
   ) : (
    <DayViewGrid
     dayViewDate={dayViewDate}
     schedules={dayFiltered}
     studentRoster={studentRoster}
     rosterLoading={dayViewRosterLoading}
     emptyScheduleIds={emptyScheduleIds}
     extraTagsByScheduleId={extraTagsByScheduleId}
     roomColumns={roomColumns}
     activeRoomIdSet={activeRoomIdSet}
     roomColPct={roomColPct}
     scheduleRowLocked={scheduleRowLocked}
     inactiveRoomName={inactiveRoomName}
     onDropOnCell={onDropOnCell}
     onOpenDetail={onOpenDetail}
     onMoveRequest={onMoveRequest}
    />
   )}
  </div>
 )
}
