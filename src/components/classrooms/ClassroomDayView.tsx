import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ChevronLeft, ChevronRight, School, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { DayViewGrid } from "@/components/schedule/DayViewGrid"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import { statusToTagTone } from "@/lib/statusTag"
import {
 formatMin,
 intervalsOverlapMinutes,
 LESSON_SLOT_INDICES,
 lessonSlotLabel,
 nearestStandardSlotIndex,
 parseHm,
} from "@/lib/lessonSlots"
import {
 durationMinForSchedule,
 findScheduleRoomConflicts,
 isStandardSchedulePlacement,
 scheduleIntervalMinutes,
 snapTimesToStandardSlot,
 standardSlotIndexForSchedule,
} from "@/lib/scheduleDayView"
import { addDaysYmd } from "@/lib/weekdayUtils"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 academicYearEditBlockedMessage,
 canEditAcademicYearForDate,
} from "@/lib/academicYearEditGuard"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { isMgmtStaff } from "@/lib/mgmtRole"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { getTeacherById } from "@/services/teacherQueries"
import { fetchLeaveStudentIdsForSchedules } from "@/services/attendanceQueries"
import {
 fetchClassStudents,
 fetchClassroomOptions,
 getScheduleById,
 updateSchedule,
 type ScheduleDetailRecord,
} from "@/services/classQueries"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import { slotIsFreeForBooking } from "@/services/roomBookingQueries"
import {
 fetchNearestScheduleDate,
 fetchScheduleAlerts,
 fetchSchedulesInRange,
 localYmd,
 type ScheduleAlerts,
 type ScheduleManageRow,
} from "@/services/scheduleQueries"

type PendingMove = {
 row: ScheduleManageRow
 newRoomId: string | null
 newStart: string
 newEnd: string
 roomLabel: string
 alignedToStandard: boolean
}

type RosterStudent = { studentId: string; fullName: string }

const EMPTY_LEAVE_SET: ReadonlySet<string> = new Set()

/** 課室視圖用：課室僅在該日開放且非取消排程實際佔用時才算已編排 */
function effectiveRoomId(s: ScheduleManageRow, activeRoomIds: ReadonlySet<string>): string | null {
 const rid = s.classroom_id
 if (!rid || !activeRoomIds.has(rid)) return null
 return rid
}

export function ClassroomDayView() {
 const { confirmDialog } = useAppConfirm()
 const { pushBanner } = useAppBanner()
 const [searchParams, setSearchParams] = useSearchParams()
 const todayYmd = localYmd()

 const [dayViewDate, setDayViewDate] = useState(() => {
  const d = new URLSearchParams(window.location.search).get("date")
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayYmd
 })
 const [dateInitialized, setDateInitialized] = useState(false)

 const [rows, setRows] = useState<ScheduleManageRow[]>([])
 const [alerts, setAlerts] = useState<Map<string, ScheduleAlerts>>(new Map())
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [roomOptions, setRoomOptions] = useState<{ id: string; label: string }[]>([])
 const [rosterByClass, setRosterByClass] = useState<Map<string, RosterStudent[]>>(new Map())
 const [leaveByScheduleId, setLeaveByScheduleId] = useState<Map<string, Set<string>>>(new Map())
 const [loading, setLoading] = useState(false)
 const [pageErr, setPageErr] = useState<string | null>(null)

 const [detailId, setDetailId] = useState<string | null>(null)
 const [detailRow, setDetailRow] = useState<ScheduleDetailRecord | null>(null)
 const [detailLoading, setDetailLoading] = useState(false)

 const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
 const [moveSaving, setMoveSaving] = useState(false)
 const [moveErr, setMoveErr] = useState<string | null>(null)
 const [moveConflicts, setMoveConflicts] = useState<ScheduleManageRow[]>([])
 const [moveRemoteBlocked, setMoveRemoteBlocked] = useState<boolean | null>(null)
 const [moveChecking, setMoveChecking] = useState(false)

 const [moveDialogSchedule, setMoveDialogSchedule] = useState<ScheduleManageRow | null>(null)
 const [moveDialogRoomKey, setMoveDialogRoomKey] = useState("")
 const [moveDialogSlot, setMoveDialogSlot] = useState(0)

 const [assigning, setAssigning] = useState(false)

 const teacherScopeId = getTeacherScopeTeacherId()
 const [teacherScopeName, setTeacherScopeName] = useState<string>("專班老師")

 const canManageSchedules = isMgmtStaff()
 const scheduleMgmtLocked = !canManageSchedules

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setPageErr(null)
  try {
   const tid = getTeacherScopeTeacherId()
   const [list, rms, opts] = await Promise.all([
    fetchSchedulesInRange(dayViewDate, dayViewDate, tid ? { teacherId: tid } : undefined),
    fetchClassrooms(),
    fetchClassroomOptions(),
   ])
   setRows(list)
   setRooms(rms)
   setRoomOptions(opts)
   const [al, leaveMap] = await Promise.all([
    fetchScheduleAlerts(list),
    fetchLeaveStudentIdsForSchedules(list),
   ])
   setAlerts(al)
   setLeaveByScheduleId(leaveMap)

   const classIds = [...new Set(list.map((s) => s.class_id).filter((x): x is string => x != null))]
   const rosterEntries = await Promise.all(
    classIds.map(async (classId) => {
     const students = await fetchClassStudents(classId, {
      scheduleDate: dayViewDate,
      activeOnly: true,
     })
     return [
      classId,
      students.map((st) => ({ studentId: st.studentId, fullName: st.fullName })),
     ] as const
    })
   )
   setRosterByClass(new Map(rosterEntries))
  } catch (e) {
   reportUserFacingError(e, { source: "ClassroomDayView.reload", setErr: setPageErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [dayViewDate])

 useEffect(() => {
  const dateParam = searchParams.get("date")
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
   setDayViewDate(dateParam)
   setDateInitialized(true)
   return
  }
  let cancelled = false
  const tid = getTeacherScopeTeacherId()
  void fetchNearestScheduleDate(tid ? { teacherId: tid } : undefined)
   .then((nearest) => {
    if (!cancelled && nearest) setDayViewDate(nearest)
   })
   .finally(() => {
    if (!cancelled) setDateInitialized(true)
   })
  return () => {
   cancelled = true
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [])

 useEffect(() => {
  if (!dateInitialized) return
  void reload()
 }, [reload, dateInitialized])

 useEffect(() => {
  if (!dateInitialized) return
  const params = new URLSearchParams(searchParams)
  if (params.get("date") !== dayViewDate) {
   params.set("date", dayViewDate)
   setSearchParams(params, { replace: true })
  }
 }, [dayViewDate, dateInitialized, searchParams, setSearchParams])

 useEffect(() => {
  if (!detailId) {
   setDetailRow(null)
   return
  }
  setDetailLoading(true)
  void getScheduleById(detailId)
   .then(setDetailRow)
   .finally(() => setDetailLoading(false))
 }, [detailId])

 useEffect(() => {
  if (!teacherScopeId) {
   setTeacherScopeName("專班老師")
   return
  }
  void getTeacherById(teacherScopeId)
   .then((t) => setTeacherScopeName(t?.full_name?.trim() || "專班老師"))
   .catch(() => setTeacherScopeName("專班老師"))
 }, [teacherScopeId])

 const roomColumns = useMemo(() => classroomsActiveOnDate(rooms, dayViewDate), [rooms, dayViewDate])
 const activeRoomIdSet = useMemo(() => new Set(roomColumns.map((r) => r.id)), [roomColumns])

 const roomColPct = useMemo(() => {
  const n = roomColumns.length + 1
  const timePct = 8
  const each = n > 0 ? (100 - timePct) / n : 46
  return { timePct, each }
 }, [roomColumns.length])

 const studentRoster = useMemo(() => {
  const m = new Map<string, string[]>()
  for (const [classId, students] of rosterByClass.entries()) {
   m.set(
    classId,
    students.map((st) => st.fullName)
   )
  }
  return m
 }, [rosterByClass])

 /** 沒有任何學生（沒有報讀或全員請假，且無試堂學生）的排程 */
 const emptyScheduleIds = useMemo(() => {
  const out = new Set<string>()
  for (const s of rows) {
   if (!s.class_id) continue
   const hasTrial = alerts.get(s.id)?.trial ?? false
   if (hasTrial) continue
   const roster = rosterByClass.get(s.class_id) ?? []
   if (roster.length === 0) {
    out.add(s.id)
    continue
   }
   const leave = leaveByScheduleId.get(s.id) ?? EMPTY_LEAVE_SET
   const present = roster.filter((st) => !leave.has(st.studentId))
   if (present.length === 0) out.add(s.id)
  }
  return out
 }, [rows, rosterByClass, leaveByScheduleId, alerts])

 const roomLabel = useCallback(
  (id: string | null) => {
   if (!id) return "未編課室"
   return rooms.find((r) => r.id === id)?.name ?? roomOptions.find((r) => r.id === id)?.label ?? "—"
  },
  [rooms, roomOptions]
 )

 const inactiveRoomNameForSchedule = useCallback(
  (s: ScheduleManageRow) => {
   const rid = s.classroom_id
   if (!rid || activeRoomIdSet.has(rid)) return null
   return s.classroom_name ?? roomLabel(rid)
  },
  [activeRoomIdSet, roomLabel]
 )

 const scheduleRowLocked = useCallback(
  (s: { scheduled_date: string }) =>
   scheduleMgmtLocked || !canEditAcademicYearForDate(s.scheduled_date),
  [scheduleMgmtLocked]
 )

 const handleDayViewDateChange = useCallback((ymd: string) => {
  if (ymd) setDayViewDate(ymd)
 }, [])

 const shiftDayViewDate = useCallback(
  (delta: number) => {
   setDayViewDate((prev) => addDaysYmd(prev, delta))
  },
  []
 )

 const jumpToday = () => setDayViewDate(todayYmd)

 const proposeScheduleMove = useCallback(
  (row: ScheduleManageRow, roomId: string | null, slotIndex: number) => {
   if (scheduleMgmtLocked || scheduleRowLocked(row)) return
   const d = durationMinForSchedule(row)
   const { start: newStart, end: newEnd } = snapTimesToStandardSlot(slotIndex, d)
   const sameRoom = (row.classroom_id ?? null) === roomId
   const sameTime = row.start_time === newStart && row.end_time === newEnd
   if (sameRoom && sameTime) return
   setMoveErr(null)
   setPendingMove({
    row,
    newRoomId: roomId,
    newStart,
    newEnd,
    roomLabel: roomLabel(roomId),
    alignedToStandard: !isStandardSchedulePlacement(row),
   })
  },
  [scheduleMgmtLocked, scheduleRowLocked, roomLabel]
 )

 useEffect(() => {
  if (!pendingMove) {
   setMoveConflicts([])
   setMoveRemoteBlocked(null)
   setMoveChecking(false)
   return
  }
  const local = findScheduleRoomConflicts(rows, {
   excludeId: pendingMove.row.id,
   scheduledDate: dayViewDate,
   roomId: pendingMove.newRoomId,
   startTime: pendingMove.newStart,
   endTime: pendingMove.newEnd,
  })
  setMoveConflicts(local)

  if (!pendingMove.newRoomId) {
   setMoveRemoteBlocked(false)
   setMoveChecking(false)
   return
  }

  let cancelled = false
  setMoveChecking(true)
  void slotIsFreeForBooking({
   classroomId: pendingMove.newRoomId,
   scheduledDate: dayViewDate,
   startTime: pendingMove.newStart,
   endTime: pendingMove.newEnd,
   excludeScheduleId: pendingMove.row.id,
  })
   .then((free) => {
    if (!cancelled) {
     setMoveRemoteBlocked(!free)
     setMoveChecking(false)
    }
   })
   .catch(() => {
    if (!cancelled) {
     setMoveRemoteBlocked(null)
     setMoveChecking(false)
    }
   })
  return () => {
   cancelled = true
  }
 }, [pendingMove, rows, dayViewDate])

 const handleDropOnCell = (e: React.DragEvent, roomId: string | null, slotIndex: number) => {
  if (scheduleMgmtLocked) return
  e.preventDefault()
  const raw = e.dataTransfer.getData("application/json")
  if (!raw) return
  let parsed: { id?: string }
  try {
   parsed = JSON.parse(raw) as { id?: string }
  } catch {
   return
  }
  const id = parsed.id
  if (!id) return
  const row = rows.find((x) => x.id === id)
  if (!row || row.scheduled_date !== dayViewDate) return
  if (scheduleRowLocked(row)) return
  proposeScheduleMove(row, roomId, slotIndex)
 }

 const openMoveDialog = (schedule: ScheduleManageRow) => {
  const roomId = schedule.classroom_id
  const active = roomId && activeRoomIdSet.has(roomId) ? roomId : null
  setMoveDialogSchedule(schedule)
  setMoveDialogRoomKey(active ?? "__none__")
  const slotIdx =
   standardSlotIndexForSchedule(schedule) ??
   (parseHm(schedule.start_time) != null ? nearestStandardSlotIndex(parseHm(schedule.start_time)!) : 0)
  setMoveDialogSlot(slotIdx)
 }

 const submitMoveDialog = () => {
  if (!moveDialogSchedule) return
  const roomId = moveDialogRoomKey === "__none__" ? null : moveDialogRoomKey
  proposeScheduleMove(moveDialogSchedule, roomId, moveDialogSlot)
  setMoveDialogSchedule(null)
 }

 const confirmMove = async () => {
  if (scheduleMgmtLocked || !pendingMove) return
  if (scheduleRowLocked(pendingMove.row)) {
   setMoveErr(academicYearEditBlockedMessage())
   return
  }
  if (moveConflicts.length > 0) {
   setMoveErr("目標時段與同課室其他排程衝突，請選擇其他格或時段。")
   return
  }
  if (moveRemoteBlocked) {
   setMoveErr("目標時段與同課室其他排程或待審約房衝突，請選擇其他格或時段。")
   return
  }
  if (moveChecking) return
  setMoveErr(null)
  setMoveSaving(true)
  try {
   await updateSchedule(pendingMove.row.id, {
    classroom_id: pendingMove.newRoomId,
    start_time: pendingMove.newStart,
    end_time: pendingMove.newEnd,
   })
   setPendingMove(null)
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   setMoveErr(msg)
   reportUserFacingError(e, {
    source: "ClassroomDayView.confirmMove",
    setErr: setMoveErr,
    userMessage: msg,
   })
  } finally {
   setMoveSaving(false)
  }
 }

 const oneClickAssign = async () => {
  if (scheduleMgmtLocked || assigning || loading) return
  if (!canEditAcademicYearForDate(dayViewDate)) {
   pushBanner({ tone: "warning", title: "無法一鍵分配", message: academicYearEditBlockedMessage() })
   return
  }

  const unassigned = rows
   .filter((s) => !s.status.includes("取消"))
   .filter((s) => effectiveRoomId(s, activeRoomIdSet) === null)
   .filter((s) => scheduleIntervalMinutes(s) !== null)
   .filter((s) => !scheduleRowLocked(s))
   .slice()
   .sort((a, b) => (parseHm(a.start_time) ?? 0) - (parseHm(b.start_time) ?? 0))

  if (roomColumns.length === 0) {
   pushBanner({ tone: "warning", title: "本日沒有可分配的課室", message: "此日期沒有開放的實體課室。" })
   return
  }
  if (unassigned.length === 0) {
   pushBanner({ tone: "info", title: "本日沒有未編課室的排程" })
   return
  }

  const ok = await confirmDialog({
   title: "一鍵分配課室",
   description: `本日有 ${unassigned.length} 堂未編課室的排程，將自動填入同時段的空置課室。`,
   confirmText: "開始分配",
  })
  if (ok !== true) return

  setAssigning(true)
  try {
   const occupancy = new Map<string, { start: number; end: number }[]>()
   for (const r of roomColumns) occupancy.set(r.id, [])
   for (const s of rows) {
    if (s.status.includes("取消")) continue
    const rid = effectiveRoomId(s, activeRoomIdSet)
    if (!rid) continue
    const iv = scheduleIntervalMinutes(s)
    if (iv) occupancy.get(rid)?.push(iv)
   }

   const assignments: { id: string; roomId: string; roomName: string }[] = []
   for (const s of unassigned) {
    const iv = scheduleIntervalMinutes(s)
    if (!iv) continue
    const startStr = formatMin(iv.start)
    const endStr = formatMin(iv.end)
    for (const room of roomColumns) {
     const occ = occupancy.get(room.id)!
     const hasLocalConflict = occ.some((o) => intervalsOverlapMinutes(iv.start, iv.end, o.start, o.end))
     if (hasLocalConflict) continue
     const free = await slotIsFreeForBooking({
      classroomId: room.id,
      scheduledDate: dayViewDate,
      startTime: startStr,
      endTime: endStr,
      excludeScheduleId: s.id,
     })
     if (!free) continue
     occ.push(iv)
     assignments.push({ id: s.id, roomId: room.id, roomName: room.name })
     break
    }
   }

   for (const a of assignments) {
    await updateSchedule(a.id, { classroom_id: a.roomId })
   }
   await reload()

   const assignedCount = assignments.length
   const remaining = unassigned.length - assignedCount
   if (assignedCount === 0) {
    pushBanner({
     tone: "warning",
     title: "一鍵分配未能分配任何排程",
     message: "同時段的課室皆已被佔用。",
    })
   } else {
    pushBanner({
     tone: "success",
     title: `已分配 ${assignedCount} 堂課室`,
     message: remaining > 0 ? `尚有 ${remaining} 堂因同時段無空置課室而未分配。` : undefined,
    })
   }
  } catch (e) {
   reportUserFacingError(e, {
    source: "ClassroomDayView.oneClickAssign",
    setErr: setPageErr,
    userMessage: "一鍵分配失敗",
   })
  } finally {
   setAssigning(false)
  }
 }

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 const unassignedCount = rows.filter(
  (s) => !s.status.includes("取消") && effectiveRoomId(s, activeRoomIdSet) === null
 ).length

 return (
  <div className="space-y-5 text-sm leading-relaxed">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <School className="h-6 w-6 shrink-0 text-info" aria-hidden />
      課室管理
      <Tag tone="info">{dayViewDate} 共 {rows.length} 堂</Tag>
     </h1>
     <p className="mt-2 text-sm text-muted-foreground">
      以課室為欄、每格 75 分鐘（09:00 起）檢視當日排程。可拖曳或「移動到…」調整課室與時段（需確認）。
      未編課室者顯示於「未編課室」欄；沒有任何學生（沒有報讀或全員請假）的排程以灰色淡化。
     </p>
    </div>
    <Button
     type="button"
     size="default"
     className="gap-1.5 bg-info text-sm text-white shadow-sm hover:bg-info"
     disabled={scheduleMgmtLocked || assigning || loading}
     onClick={() => void oneClickAssign()}
    >
     <Wand2 className="h-4 w-4" aria-hidden />
     {assigning ? "分配中…" : "一鍵分配"}
    </Button>
   </header>

   {teacherScopeId ? (
    <div className="rounded-xl border border-info bg-info/90 px-4 py-3 text-sm text-info-foreground">
     你正以<strong>{teacherScopeName}</strong>身分瀏覽：僅顯示指派給您的排程。
    </div>
   ) : null}

   {pageErr ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {pageErr}
    </div>
   ) : null}

   <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm">
    <div className="flex flex-wrap items-center gap-2">
     <span className="text-muted-foreground">檢視日期</span>
     <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-10 w-10 shrink-0"
      aria-label="前一日"
      onClick={() => shiftDayViewDate(-1)}
     >
      <ChevronLeft className="h-5 w-5" aria-hidden />
     </Button>
     <Input
      type="date"
      value={dayViewDate}
      onChange={(e) => handleDayViewDateChange(e.target.value)}
      className="h-10 w-[12rem] cursor-pointer text-sm"
     />
     <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-10 w-10 shrink-0"
      aria-label="後一日"
      onClick={() => shiftDayViewDate(1)}
     >
      <ChevronRight className="h-5 w-5" aria-hidden />
     </Button>
     <Button
      type="button"
      variant="outline"
      size="default"
      className="border-amber-400/80 text-sm text-amber-900 hover:bg-amber-50"
      onClick={jumpToday}
     >
      今天
     </Button>
    </div>
    <div className="text-right">
     <span className="tabular-nums text-muted-foreground">
      {loading ? "載入中…" : `本日 ${rows.length} 堂`}
     </span>
     {!loading && unassignedCount > 0 ? (
      <p className="mt-0.5 text-xs text-warning">未編課室 {unassignedCount} 堂</p>
     ) : null}
    </div>
   </div>

   {scheduleMgmtLocked ? (
    <p className="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
     你目前僅能檢視；拖曳、「移動到…」與一鍵分配需管理員權限。
    </p>
   ) : null}

   {rows.length === 0 ? (
    <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm shadow-sm">
     {loading ? (
      <p className="text-muted-foreground">載入中…</p>
     ) : (
      <p className="text-muted-foreground">本日沒有排程</p>
     )}
    </div>
   ) : (
    <DayViewGrid
     dayViewDate={dayViewDate}
     schedules={rows}
     alerts={alerts}
     studentRoster={studentRoster}
     emptyScheduleIds={emptyScheduleIds}
     roomColumns={roomColumns}
     activeRoomIdSet={activeRoomIdSet}
     roomColPct={roomColPct}
     scheduleRowLocked={scheduleRowLocked}
     inactiveRoomName={inactiveRoomNameForSchedule}
     onDropOnCell={handleDropOnCell}
     onOpenDetail={setDetailId}
     onMoveRequest={openMoveDialog}
    />
   )}

   <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
    <DialogContent className="max-w-md border-info text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">排程詳細資料</DialogTitle>
     </DialogHeader>
     {detailLoading || !detailRow ? (
      <p className="text-base text-muted-foreground">載入中…</p>
     ) : (
      <div className="space-y-3 text-sm">
       <p className="text-xl font-semibold tabular-nums md:text-2xl">
        {detailRow.scheduled_date}{" "}
        {detailRow.start_time && detailRow.end_time
         ? `${detailRow.start_time}–${detailRow.end_time}`
         : ""}
       </p>
       <p>
        {detailRow.class_subject}{" "}
        <span className="font-mono text-muted-foreground">{detailRow.course_code_full ?? ""}</span>
       </p>
       <p className="text-muted-foreground">老師：{detailRow.teacher_name ?? "—"}</p>
       <p className="text-muted-foreground">課室：{detailRow.classroom_name ?? "未分配"}</p>
       <div className="flex flex-wrap items-center gap-2">
        <Tag tone={statusToTagTone(detailRow.status)} size="sm">{detailRow.status}</Tag>
        {detailRow.is_extra_lesson ? (
         <Tag tone={statusToTagTone("加堂")} size="sm">加堂</Tag>
        ) : null}
       </div>
       {detailRow.status.includes("取消") && detailRow.cancel_reason ? (
        <p className="text-muted-foreground">取消原因：{detailRow.cancel_reason}</p>
       ) : null}
       {canManageSchedules ? (
        <label className="flex items-center gap-2 text-sm">
         <input
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-warning"
          checked={detailRow.is_extra_lesson}
          onChange={async (e) => {
           const next = e.target.checked
           await updateSchedule(detailRow.id, { is_extra_lesson: next })
           setDetailRow((prev) => (prev ? { ...prev, is_extra_lesson: next } : prev))
           await reload()
          }}
         />
         <span className="text-muted-foreground">標記為加堂</span>
        </label>
       ) : null}
       {detailRow.remarks ? (
        <p className="text-muted-foreground">備註：{detailRow.remarks}</p>
       ) : null}
       <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" variant="outline" size="default" className="text-base" asChild>
         <Link to={`/Schedule/${detailRow.id}`}>開啟完整頁面</Link>
        </Button>
        {detailRow.class_id ? (
         <Button type="button" variant="outline" size="default" className="text-base" asChild>
          <Link to={`/Classes/${detailRow.class_id}`}>班別詳情</Link>
         </Button>
        ) : null}
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>

   <Dialog
    open={pendingMove != null}
    onOpenChange={(o) => {
     if (!o && !moveSaving) {
      setPendingMove(null)
      setMoveErr(null)
     }
    }}
   >
    <DialogContent className="max-w-md border-amber-100 text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">確認變更排程</DialogTitle>
     </DialogHeader>
     {pendingMove ? (
      <div className="space-y-3 text-sm">
       <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
        即將調整「{pendingMove.row.classLabel}
        {pendingMove.row.course_code_full ? `（${pendingMove.row.course_code_full}）` : ""}」：
        <br />
        課室 → <strong>{pendingMove.roomLabel}</strong>
        <br />
        時間 → <strong className="tabular-nums">
         {pendingMove.newStart}–{pendingMove.newEnd}
        </strong>
        {pendingMove.alignedToStandard ? (
         <>
          <br />
          <span className="text-sm">時間將對齊標準格（09:00 起每 75 分鐘）。</span>
         </>
        ) : null}
       </p>
       {moveChecking ? (
        <p className="text-sm text-muted-foreground">正在檢查課室衝突…</p>
       ) : moveConflicts.length > 0 ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         <p className="font-medium">與以下排程衝突：</p>
         <ul className="mt-1 list-inside list-disc">
          {moveConflicts.map((c) => (
           <li key={c.id}>
            {c.classLabel}（{c.start_time ?? "—"}–{c.end_time ?? "—"}）
           </li>
          ))}
         </ul>
        </div>
       ) : moveRemoteBlocked ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         目標時段與同課室其他排程或待審約房衝突。
        </div>
       ) : (
        <p className="text-muted-foreground">未偵測到課室衝突，確認後即可儲存。</p>
       )}
       {moveErr ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         {moveErr}
        </div>
       ) : null}
       <div className="flex justify-end gap-2">
        <Button
         type="button"
         variant="outline"
         disabled={moveSaving}
         onClick={() => {
          setMoveErr(null)
          setPendingMove(null)
         }}
        >
         取消
        </Button>
        <Button
         type="button"
         className="bg-amber-600 text-white hover:bg-amber-700"
         disabled={
          moveSaving || moveChecking || moveConflicts.length > 0 || moveRemoteBlocked === true
         }
         onClick={() => void confirmMove()}
        >
         {moveSaving ? "儲存中…" : "確定變更"}
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog
    open={moveDialogSchedule != null}
    onOpenChange={(o) => {
     if (!o) setMoveDialogSchedule(null)
    }}
   >
    <DialogContent className="max-w-md text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">移動排程</DialogTitle>
     </DialogHeader>
     {moveDialogSchedule ? (
      <div className="grid gap-4 text-sm">
       <p className="font-medium">{moveDialogSchedule.classLabel}</p>
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">課室</span>
        <Select
         className="h-11 w-full rounded-md border border-input px-3"
         value={moveDialogRoomKey}
         onChange={(e) => setMoveDialogRoomKey(e.target.value)}
        >
         {roomColumns.map((r) => (
          <option key={r.id} value={r.id}>
           {r.name}
          </option>
         ))}
         <option value="__none__">未編課室</option>
        </Select>
       </label>
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">時段（標準格）</span>
        <Select
         className="h-11 w-full rounded-md border border-input px-3"
         value={String(moveDialogSlot)}
         onChange={(e) => setMoveDialogSlot(Number(e.target.value))}
        >
         {LESSON_SLOT_INDICES.map((idx) => (
          <option key={idx} value={idx}>
           {lessonSlotLabel(idx)}
          </option>
         ))}
        </Select>
       </label>
       <p className="text-xs text-muted-foreground">
        時間將對齊所選標準格的起點；若原為非標準時間，結束時間會依上課時長重新計算。
       </p>
       <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setMoveDialogSchedule(null)}>
         取消
        </Button>
        <Button type="button" onClick={submitMoveDialog}>
         繼續確認
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>
  </div>
 )
}
