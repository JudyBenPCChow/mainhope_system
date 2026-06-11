import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
 AvailabilityWeekGrid,
 navigateToClassNewFromSlot,
} from "@/components/teacherAvailability/AvailabilityWeekGrid"
import { AvailabilityRoomDayView } from "@/components/teacherAvailability/AvailabilityRoomDayView"
import {
 QuickClassFromSlotDialog,
 type FreeRoomSlotContext,
} from "@/components/teacherAvailability/QuickClassFromSlotDialog"
import type { ClassRecord } from "@/services/classQueries"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import {
 getStoredAcademicYearFilter,
 setStoredAcademicYearFilter,
} from "@/lib/academicYearFilter"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { isAcademicYearReadOnly } from "@/lib/mgmtRole"
import { addDaysYmd, formatScheduleDateShort, mondayYmdOfWeekContaining } from "@/lib/weekdayUtils"
import { cn } from "@/lib/utils"
import { lessonSlotLabel } from "@/lib/lessonSlots"
import { fetchTeacherOptions } from "@/services/classQueries"
import {
 deleteAvailabilitySlot,
 fetchAcademicYearsWithDates,
 fetchAvailabilityInRange,
 fetchAvailabilityPatternSummary,
 insertAvailabilitySlot,
 type AcademicYearRange,
 type AvailabilityPatternCell,
 type TeacherAvailabilitySlot,
} from "@/services/teacherAvailabilityQueries"
import {
 fetchRoomCalendarBundle,
 type RoomCalendarPendingRow,
 type RoomCalendarScheduleRow,
} from "@/services/roomBookingQueries"
import type { RoomRecord } from "@/services/classroomQueries"
import { useAppConfirm } from "@/lib/appConfirm"

type Tab = "pattern" | "grid" | "roomDay" | "list"

export function TeacherAvailabilityPage() {
 const navigate = useNavigate()
 const { confirmDialog } = useAppConfirm()
 const [tab, setTab] = useState<Tab>("pattern")
 const [years, setYears] = useState<AcademicYearRange[]>([])
 const [yearId, setYearId] = useState("")
 const [teacherId, setTeacherId] = useState("")
 const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
 const [gridMode, setGridMode] = useState<"single" | "all">("single")
 const [weekStart, setWeekStart] = useState(() => mondayYmdOfWeekContaining(new Date().toISOString().slice(0, 10)))
 const [slots, setSlots] = useState<TeacherAvailabilitySlot[]>([])
 const [pattern, setPattern] = useState<AvailabilityPatternCell[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [listStatus, setListStatus] = useState<string>("可分配")
 const [addingSlot, setAddingSlot] = useState(false)
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [roomSchedules, setRoomSchedules] = useState<RoomCalendarScheduleRow[]>([])
 const [roomPending, setRoomPending] = useState<RoomCalendarPendingRow[]>([])
 const [freeRoomCtx, setFreeRoomCtx] = useState<FreeRoomSlotContext | null>(null)

 const year = useMemo(() => years.find((y) => y.id === yearId) ?? null, [years, yearId])
 const isHistoryView = useMemo(() => {
  if (!year) return false
  return isAcademicYearReadOnly(year.end_date, year.label)
 }, [year])
 const historyReadOnly = isHistoryView

 const reload = useCallback(async () => {
  if (!year) return
  setLoading(true)
  setErr(null)
  try {
   const from = year.start_date.slice(0, 10)
   const to = year.end_date.slice(0, 10)
   const gridMonday = mondayYmdOfWeekContaining(weekStart.slice(0, 10))
   const gridSunday = addDaysYmd(gridMonday, 6)
   const roomDayStart = weekStart.slice(0, 10)
   const roomDayEnd = addDaysYmd(roomDayStart, 6)
   const rangeFrom =
    tab === "grid"
     ? gridMonday < from
       ? from
       : gridMonday
     : tab === "roomDay"
       ? roomDayStart < from
         ? from
         : roomDayStart
       : from
   const rangeTo =
    tab === "grid"
     ? gridSunday > to
       ? to
       : gridSunday
     : tab === "roomDay"
       ? roomDayEnd > to
         ? to
         : roomDayEnd
       : to
   const needRoomData = (tab === "grid" && gridMode === "all") || tab === "roomDay"
   const [sl, pat, roomBundle] = await Promise.all([
    fetchAvailabilityInRange(rangeFrom, rangeTo, {
     academicYearId: year.id,
     teacherId:
      gridMode === "single" && teacherId && tab === "grid" ? teacherId : undefined,
     status: tab === "list" && listStatus !== "全部" ? listStatus : undefined,
    }),
    teacherId && tab === "pattern"
     ? fetchAvailabilityPatternSummary(teacherId, year.id)
     : Promise.resolve([] as AvailabilityPatternCell[]),
    needRoomData
     ? fetchRoomCalendarBundle(
        tab === "roomDay" ? roomDayStart : gridMonday,
        tab === "roomDay" ? roomDayEnd : gridSunday
       )
     : Promise.resolve(null),
   ])
   setSlots(sl)
   setPattern(pat)
   if (roomBundle) {
    setRooms(roomBundle.rooms)
    setRoomSchedules(roomBundle.schedules)
    setRoomPending(roomBundle.pending)
   } else {
    setRooms([])
    setRoomSchedules([])
    setRoomPending([])
   }
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherAvailabilityPage.load", setErr })
  } finally {
   setLoading(false)
  }
 }, [year, weekStart, teacherId, gridMode, tab, listStatus])

 useEffect(() => {
  void (async () => {
   const [yrs, tchs] = await Promise.all([fetchAcademicYearsWithDates(), fetchTeacherOptions()])
   setYears(yrs)
   setTeachers(tchs)
   const stored = getStoredAcademicYearFilter()
   const currentLabel = academicYearLabelFromStartDate(null)
   const targetLabel = stored === "current" ? currentLabel : stored
   const picked =
    yrs.find((y) => y.label === targetLabel) ??
    yrs.find((y) => y.is_current) ??
    yrs[0]
   if (picked) {
    setYearId(picked.id)
    setWeekStart(mondayYmdOfWeekContaining(picked.start_date.slice(0, 10)))
   }
  })()
 }, [])

 useEffect(() => {
  if (!yearId) return
  void reload()
 }, [yearId, reload])

 const onAddSlot = async (date: string, slotIndex: number) => {
  if (historyReadOnly || !year || !teacherId || addingSlot) return
  setAddingSlot(true)
  setErr(null)
  try {
   await insertAvailabilitySlot({
    teacher_id: teacherId,
    academic_year_id: year.id,
    available_date: date,
    time_slot: lessonSlotLabel(slotIndex),
   })
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherAvailabilityPage.onAddSlot", setErr })
  } finally {
   setAddingSlot(false)
  }
 }

 const onDeleteSlot = async (id: string) => {
  if (historyReadOnly) return
  if (!(await confirmDialog({ title: "刪除檔期", description: "確定刪除此可任教檔期？", confirmText: "確認刪除", tone: "destructive" }))) return
  try {
   await deleteAvailabilitySlot(id)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherAvailabilityPage.onDeleteSlot", setErr })
  }
 }

 return (
  <div className="space-y-5 p-4 md:p-6">
   <div>
    <h1 className="text-xl font-semibold">老師可任教檔期</h1>
    <p className="text-sm text-muted-foreground">
     登記老師有空時間，供開班前參考；班別開始後的改期請在排程管理處理。
    </p>
   </div>

   <div className="flex flex-wrap gap-3">
    <div>
     <label className="text-xs text-muted-foreground">學年</label>
     <Select
      className="mt-1 flex h-9 min-w-[8rem] rounded-md border border-input bg-background px-2 text-sm"
      value={yearId}
      onChange={(e) => {
       const y = years.find((x) => x.id === e.target.value)
       setYearId(e.target.value)
       if (y) {
        setStoredAcademicYearFilter(y.is_current ? "current" : y.label)
        setWeekStart(mondayYmdOfWeekContaining(y.start_date.slice(0, 10)))
       }
      }}
     >
      {years.map((y) => (
       <option key={y.id} value={y.id}>
        {y.label}
       </option>
      ))}
     </Select>
    </div>
    <div>
     <label className="text-xs text-muted-foreground">老師（登記／規律摘要）</label>
     <Select
      className="mt-1 flex h-9 min-w-[10rem] rounded-md border border-input bg-background px-2 text-sm"
      value={teacherId}
      onChange={(e) => setTeacherId(e.target.value)}
     >
      <option value="">請選擇</option>
      {teachers.map((t) => (
       <option key={t.id} value={t.id}>
        {t.label}
       </option>
      ))}
     </Select>
    </div>
   </div>

   <div className="flex flex-wrap gap-2 border-b border-border pb-2">
    {(
     [
      ["pattern", "規律摘要"],
      ["grid", "時段格線"],
      ["roomDay", "日期課室"],
      ["list", "檔期列表"],
     ] as const
    ).map(([key, label]) => (
     <button
      key={key}
      type="button"
      className={cn(
       "rounded-lg px-3 py-1.5 text-sm",
       tab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      )}
      onClick={() => setTab(key)}
     >
      {label}
     </button>
    ))}
   </div>

   {historyReadOnly ? (
    <p className="text-sm text-muted-foreground">2526 及更早學年僅供查閱，無法修改檔期。</p>
   ) : null}
   {err ? (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {tab === "pattern" ? (
    <div className="space-y-3">
     {!teacherId ? (
      <p className="text-sm text-muted-foreground">請先選擇老師以查看規律摘要。</p>
     ) : loading ? (
      <p className="text-sm text-muted-foreground">載入中…</p>
     ) : pattern.length === 0 ? (
      <p className="text-sm text-muted-foreground">尚無登記檔期。</p>
     ) : (
      <div className="space-y-2">
       {pattern.map((p) => (
        <div key={`${p.day_of_week}-${p.time_slot}`} className="rounded-xl border border-border bg-card p-3">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">
           {p.day_of_week} · {p.time_slot}
          </span>
          <Tag tone="info">已登記 {p.count} 個日期</Tag>
         </div>
         <p className="mt-2 text-sm text-muted-foreground">
          {p.dates.map(formatScheduleDateShort).join("、")}
         </p>
         {!historyReadOnly ? (
          <Button
           type="button"
           size="sm"
           className="mt-2"
           variant="secondary"
           onClick={() => {
            if (!year || !teacherId) return
            const params = new URLSearchParams({
             academic_year_id: year.id,
             teacher_id: teacherId,
             day_of_week: p.day_of_week,
             time_slot: p.time_slot,
            })
            navigate(`/Classes/New?${params.toString()}`)
           }}
          >
           由此時段新增班別
          </Button>
         ) : null}
        </div>
       ))}
      </div>
     )}
    </div>
   ) : null}

   {tab === "grid" ? (
    <div className="space-y-3">
     <div className="flex flex-wrap gap-2">
      <Button
       type="button"
       size="sm"
       variant={gridMode === "single" ? "default" : "outline"}
       onClick={() => setGridMode("single")}
      >
       單一老師
      </Button>
      <Button
       type="button"
       size="sm"
       variant={gridMode === "all" ? "default" : "outline"}
       onClick={() => setGridMode("all")}
      >
       全體老師
      </Button>
     </div>
     {gridMode === "single" && !teacherId ? (
      <p className="text-sm text-muted-foreground">單一老師模式請先選擇老師；點 + 新增檔期，已登記格可刪除。</p>
     ) : (
      <AvailabilityWeekGrid
       slots={slots}
       mode={gridMode}
       weekStart={weekStart}
       onWeekStartChange={setWeekStart}
       yearStart={year?.start_date.slice(0, 10)}
       yearEnd={year?.end_date.slice(0, 10) ?? "2099-12-31"}
       onAddSlot={gridMode === "single" ? onAddSlot : undefined}
       onDeleteSlot={gridMode === "single" && !historyReadOnly ? onDeleteSlot : undefined}
       onNavigateCreate={(s) => navigateToClassNewFromSlot(navigate, s)}
       readOnly={historyReadOnly}
       rooms={gridMode === "all" ? rooms : undefined}
       roomSchedules={gridMode === "all" ? roomSchedules : undefined}
       roomPending={gridMode === "all" ? roomPending : undefined}
      />
     )}
    </div>
   ) : null}

   {tab === "roomDay" ? (
    <div className="space-y-3">
     {loading ? (
      <p className="text-sm text-muted-foreground">載入中…</p>
     ) : (
      <>
       <AvailabilityRoomDayView
        windowStart={weekStart.slice(0, 10)}
        onWindowStartChange={setWeekStart}
        yearStart={year?.start_date.slice(0, 10)}
        yearEnd={year?.end_date.slice(0, 10) ?? "2099-12-31"}
        slots={slots}
        rooms={rooms}
        roomSchedules={roomSchedules}
        roomPending={roomPending}
        onTeacherSlotClick={(s) => navigateToClassNewFromSlot(navigate, s)}
        onFreeRoomClick={historyReadOnly ? undefined : setFreeRoomCtx}
        readOnly={historyReadOnly}
       />
       <QuickClassFromSlotDialog
        open={freeRoomCtx != null}
        onOpenChange={(open) => {
         if (!open) setFreeRoomCtx(null)
        }}
        context={freeRoomCtx}
        academicYear={year}
        onCreated={(cls: ClassRecord) => {
         setFreeRoomCtx(null)
         navigate(`/Classes/${cls.id}`)
        }}
       />
      </>
     )}
    </div>
   ) : null}

   {tab === "list" ? (
    <div className="space-y-3">
     <Select
      className="flex h-9 w-auto min-w-[8rem] rounded-md border border-input bg-background px-2 text-sm"
      value={listStatus}
      onChange={(e) => setListStatus(e.target.value)}
     >
      <option value="全部">全部狀態</option>
      <option value="可分配">可分配</option>
      <option value="已分配">已分配</option>
     </Select>
     <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[36rem] table-fixed border-collapse text-sm">
       <thead>
        <tr className="border-b bg-muted/50 text-left">
         <th className="w-[18%] px-3 py-2">日期</th>
         <th className="w-[18%] px-3 py-2">時段</th>
         <th className="w-[28%] px-3 py-2">老師</th>
         <th className="w-[16%] px-3 py-2">狀態</th>
         <th className="w-[20%] px-3 py-2">操作</th>
        </tr>
       </thead>
       <tbody>
        {loading ? (
         <tr>
          <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
           載入中…
          </td>
         </tr>
        ) : slots.length === 0 ? (
         <tr>
          <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
           沒有檔期
          </td>
         </tr>
        ) : (
         slots.map((s) => (
          <tr key={s.id} className="border-b">
           <td className="px-3 py-2 tabular-nums">{s.available_date}</td>
           <td className="px-3 py-2">{s.time_slot}</td>
           <td className="px-3 py-2">{s.teacher_name ?? "—"}</td>
           <td className="px-3 py-2">
            <Tag tone={statusToTagTone(s.status)} size="sm">{s.status}</Tag>
           </td>
           <td className="px-3 py-2">
            {s.status === "可分配" && !historyReadOnly ? (
             <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => navigateToClassNewFromSlot(navigate, s)}>
               建班
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void onDeleteSlot(s.id)}>
               刪除
              </Button>
             </div>
            ) : (
             "—"
            )}
           </td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
    </div>
   ) : null}
  </div>
 )
}
