import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowUpRight, CalendarRange } from "lucide-react"

import { DayViewGrid } from "@/components/schedule/DayViewGrid"
import { Button } from "@/components/ui/button"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import {
 fetchDayViewRosterBySchedules,
 fetchSchedulesInRange,
 type ScheduleManageRow,
} from "@/services/scheduleQueries"

type Props = {
 ymd: string
}

export function HomeDayView({ ymd }: Props) {
 const navigate = useNavigate()
 const [schedules, setSchedules] = useState<ScheduleManageRow[]>([])
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [roster, setRoster] = useState<Map<string, string[]>>(new Map())
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  setError(null)
  void (async () => {
   try {
    const [rows, roomRows] = await Promise.all([
     fetchSchedulesInRange(ymd, ymd),
     fetchClassrooms(),
    ])
    const rosterBySchedule = await fetchDayViewRosterBySchedules(rows)
    if (cancelled) return
    const names = new Map<string, string[]>()
    for (const [id, students] of rosterBySchedule.entries()) {
     names.set(
      id,
      students.map((s) => s.fullName)
     )
    }
    setSchedules(rows)
    setRooms(roomRows)
    setRoster(names)
   } catch (e) {
    reportUserFacingError(e, {
     source: "HomeDayView.load",
     setErr: setError,
     userMessage: "日視圖未能載入。",
    })
    if (!cancelled) {
     setSchedules([])
     setRooms([])
     setRoster(new Map())
    }
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()
  return () => {
   cancelled = true
  }
 }, [ymd])

 const roomColumns = useMemo(() => classroomsActiveOnDate(rooms, ymd), [rooms, ymd])
 const activeRoomIdSet = useMemo(() => new Set(roomColumns.map((r) => r.id)), [roomColumns])
 const roomColPct = useMemo(() => {
  const n = roomColumns.length + 1
  const timePct = 8
  const each = n > 0 ? (100 - timePct) / n : 46
  return { timePct, each }
 }, [roomColumns.length])

 return (
  <section
   className="flex min-h-0 min-w-0 flex-col rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm md:min-h-[36rem] md:p-6"
   aria-label="日視圖"
  >
   <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
    <div className="flex items-center gap-2">
     <CalendarRange className="h-5 w-5 shrink-0 text-primary" aria-hidden />
     <h2 className="text-base font-semibold text-foreground md:text-lg">日視圖</h2>
    </div>
    <Button type="button" variant="outline" size="sm" asChild>
     <Link to={`/Schedule?view=day&date=${encodeURIComponent(ymd)}`}>
      前往完整日視圖
      <ArrowUpRight />
     </Link>
    </Button>
   </div>
   {error ? (
    <p className="text-sm text-destructive" role="alert">
     {error}
    </p>
   ) : loading ? (
    <p className="text-base text-muted-foreground">載入日視圖…</p>
   ) : (
    <DayViewGrid
     dayViewDate={ymd}
     schedules={schedules}
     studentRoster={roster}
     rosterLoading={false}
     roomColumns={roomColumns}
     activeRoomIdSet={activeRoomIdSet}
     roomColPct={roomColPct}
     scheduleRowLocked={() => true}
     inactiveRoomName={(s) => {
      const rid = s.classroom_id
      if (!rid || activeRoomIdSet.has(rid)) return null
      return s.classroom_name
     }}
     onDropOnCell={() => {}}
     onOpenDetail={(id) => navigate(`/Schedule/${id}`)}
     onMoveRequest={() => {}}
     readOnly
    />
   )}
  </section>
 )
}
