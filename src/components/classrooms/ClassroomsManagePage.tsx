import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Check, ChevronLeft, ChevronRight, Monitor, Plus, School } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
 DAYTIME_SLOT_INDICES,
 EVENING_SLOT_INDICES,
 formatMin,
 intervalsOverlapMinutes,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
 LESSON_SLOT_DURATION_MIN,
 LESSON_SLOT_INDICES,
} from "@/lib/lessonSlots"
import { formatClassLabel } from "@/lib/courseLabel"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { fetchAllClasses, getClassById } from "@/services/classQueries"
import { insertScheduleForClass } from "@/services/scheduleWriteQueries"
import {
 fetchClassrooms,
 fetchClassesUsingRoom,
 fetchSchedulesForRoomRange,
 type RoomRecord,
 type RoomScheduleRow,
} from "@/services/classroomQueries"
import { localYmd } from "@/services/teacherQueries"

const DOW_ZH = ["日", "一", "二", "三", "四", "五", "六"] as const

function startOfWeekMonday(d: Date): Date {
 const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
 const day = x.getDay()
 const diff = day === 0 ? -6 : 1 - day
 x.setDate(x.getDate() + diff)
 return x
}

function addDays(d: Date, n: number): Date {
 const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
 x.setDate(x.getDate() + n)
 return x
}

function parseYmd(ymd: string): Date {
 const [y, m, da] = ymd.split("-").map(Number)
 return new Date(y, m - 1, da)
}

const TIME_SLOTS = LESSON_SLOT_INDICES.map((idx) => ({
 label: lessonSlotLabel(idx),
 startMin: lessonSlotStartMinute(idx),
 endMin: lessonSlotEndMinute(idx),
 index: idx,
}))

const DAYTIME_TIME_SLOTS = TIME_SLOTS.filter((s) => DAYTIME_SLOT_INDICES.includes(s.index))

function parseHm(t: string | null): number | null {
 if (!t) return null
 const m = t.match(/^(\d{1,2}):(\d{2})$/)
 if (!m) return null
 const h = Number(m[1])
 const mm = Number(m[2])
 if (Number.isNaN(h) || Number.isNaN(mm)) return null
 return h * 60 + mm
}

function schedTimeRange(s: RoomScheduleRow): { a: number; b: number } | null {
 const a = parseHm(s.start_time)
 if (a === null) return null
 let b = parseHm(s.end_time)
 if (b === null) b = a + LESSON_SLOT_DURATION_MIN
 return { a, b }
}

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
 return intervalsOverlapMinutes(a0, a1, b0, b1)
}

function formatMdSlash(ymd: string): string {
 const d = parseYmd(ymd)
 return `${d.getMonth() + 1}/${d.getDate()}`
}

export function ClassroomsManagePage() {
 const isMobile = useIsMobile()
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [selectedRoomId, setSelectedRoomId] = useState("")
 const [weekMonday, setWeekMonday] = useState(() => startOfWeekMonday(new Date()))
 const [selectedDateYmd, setSelectedDateYmd] = useState(() => localYmd())
 const [schedules, setSchedules] = useState<RoomScheduleRow[]>([])
 const [schedLoading, setSchedLoading] = useState(false)
 const [pageErr, setPageErr] = useState<string | null>(null)
 const [showEvening, setShowEvening] = useState(false)

 const [addOpen, setAddOpen] = useState(false)
 const [classOptions, setClassOptions] = useState<{ id: string; label: string }[]>([])
 const [addClassId, setAddClassId] = useState("")
 const [addDate, setAddDate] = useState("")
 const [addStart, setAddStart] = useState("")
 const [addEnd, setAddEnd] = useState("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)

 const todayYmd = localYmd()

 const weekStartYmd = useMemo(() => localYmd(weekMonday), [weekMonday])
 const weekEndYmd = useMemo(() => localYmd(addDays(weekMonday, 6)), [weekMonday])

 const weekDays = useMemo(() => {
  const out: { ymd: string; label: string }[] = []
  for (let i = 0; i < 7; i++) {
   const ymd = localYmd(addDays(weekMonday, i))
   const d = parseYmd(ymd)
   out.push({
    ymd,
    label: `${formatMdSlash(ymd)} ${DOW_ZH[d.getDay()]}`,
   })
  }
  return out
 }, [weekMonday])

 const weekGridColPct = useMemo(() => {
  const timePct = isMobile ? 14 : 10
  const each = (100 - timePct) / 7
  return { timePct, each }
 }, [isMobile])

 const visibleSlots = useMemo(
  () => (showEvening || !isMobile ? TIME_SLOTS : DAYTIME_TIME_SLOTS),
  [showEvening, isMobile]
 )

 const hasEveningSchedules = useMemo(() => {
  return schedules.some((s) => {
   const range = schedTimeRange(s)
   if (!range) return false
   return EVENING_SLOT_INDICES.some((idx) => {
    const s0 = lessonSlotStartMinute(idx)
    const s1 = lessonSlotEndMinute(idx)
    return rangesOverlap(range.a, range.b, s0, s1)
   })
  })
 }, [schedules])

 const selectedRoom = useMemo(
  () => rooms.find((r) => r.id === selectedRoomId) ?? null,
  [rooms, selectedRoomId]
 )

 const reloadRooms = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setPageErr(null)
  try {
   const r = await fetchClassrooms()
   setRooms(r)
   setSelectedRoomId((prev) => {
    if (prev && r.some((x) => x.id === prev)) return prev
    return r[0]?.id ?? ""
   })
  } catch (e) {
   reportUserFacingError(e, { source: "ClassroomsManagePage.reloadRooms", setErr: setPageErr })
  }
 }, [])

 useEffect(() => {
  void reloadRooms()
 }, [reloadRooms])

 useEffect(() => {
  setSelectedDateYmd((prev) => {
   if (prev >= weekStartYmd && prev <= weekEndYmd) return prev
   return weekStartYmd
  })
 }, [weekStartYmd, weekEndYmd])

 const reloadSchedules = useCallback(async () => {
  if (!isSupabaseConfigured || !selectedRoomId) return
  setSchedLoading(true)
  setPageErr(null)
  try {
   const data = await fetchSchedulesForRoomRange(selectedRoomId, weekStartYmd, weekEndYmd)
   setSchedules(data)
  } catch (e) {
   setSchedules([])
   reportUserFacingError(e, { source: "ClassroomsManagePage.reloadSchedules", setErr: setPageErr })
  } finally {
   setSchedLoading(false)
  }
 }, [selectedRoomId, weekStartYmd, weekEndYmd])

 useEffect(() => {
  void reloadSchedules()
 }, [reloadSchedules])

 const reloadClassOptions = useCallback(async () => {
  if (!isSupabaseConfigured || !selectedRoomId) return
  try {
   let list = await fetchClassesUsingRoom(selectedRoomId)
   if (list.length === 0) {
    const all = await fetchAllClasses()
    list = all.map((c) => ({
     id: c.id,
     label: `${formatClassLabel({
      subject: c.subject,
      courseCode: c.course_code_full,
      courseName: c.course_name,
     })}${c.classroom_name ? ` · ${c.classroom_name}` : " · 未綁課室"}`,
    }))
   }
   setClassOptions(list)
   setAddClassId((prev) => {
    if (prev && list.some((x) => x.id === prev)) return prev
    return list[0]?.id ?? ""
   })
  } catch {
   setClassOptions([])
  }
 }, [selectedRoomId])

 useEffect(() => {
  void reloadClassOptions()
 }, [reloadClassOptions])

 const openAddDialog = (opts?: { dateYmd?: string; start?: string; end?: string }) => {
  setAddErr(null)
  setAddDate(opts?.dateYmd ?? selectedDateYmd)
  setAddStart(opts?.start ?? "")
  setAddEnd(opts?.end ?? "")
  setAddOpen(true)
 }

 useEffect(() => {
  if (!addOpen || !addClassId) return
  if (addStart || addEnd) return
  let cancelled = false
  void getClassById(addClassId).then((c) => {
   if (cancelled || !c?.time_slot) return
   const m = c.time_slot.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/)
   if (m) {
    const norm = (t: string) => {
     const [h, mm] = t.split(":").map(Number)
     return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
    }
    setAddStart(norm(m[1]))
    setAddEnd(norm(m[2]))
   }
  })
  return () => {
   cancelled = true
  }
 }, [addOpen, addClassId, addStart, addEnd])

 const daySchedules = useMemo(
  () =>
   schedules
    .filter((s) => s.scheduled_date === selectedDateYmd)
    .slice()
    .sort((a, b) => {
     const ta = parseHm(a.start_time) ?? 0
     const tb = parseHm(b.start_time) ?? 0
     return ta - tb
    }),
  [schedules, selectedDateYmd]
 )

 const cellSchedules = useCallback(
  (dayYmd: string, slot: (typeof TIME_SLOTS)[0]) => {
   return schedules.filter((s) => {
    if (s.scheduled_date !== dayYmd) return false
    const tr = schedTimeRange(s)
    if (!tr) return false
    return rangesOverlap(tr.a, tr.b, slot.startMin, slot.endMin)
   })
  },
  [schedules]
 )

 const submitAdd = async () => {
  if (!addClassId || !addDate) {
   setAddErr("請選擇班別與日期")
   return
  }
  setAddSaving(true)
  setAddErr(null)
  try {
   const cls = await getClassById(addClassId)
   await insertScheduleForClass(addClassId, cls?.teacher_id ?? null, {
    scheduled_date: addDate,
    start_time: addStart || null,
    end_time: addEnd || null,
    classroom_id: selectedRoomId,
   })
   setAddOpen(false)
   await reloadSchedules()
  } catch (e) {
   reportUserFacingError(e, { source: "ClassroomsManagePage.addSchedule", setErr: setAddErr, userMessage: "新增失敗" })
  } finally {
   setAddSaving(false)
  }
 }

 const goToday = () => {
  const t = new Date()
  setWeekMonday(startOfWeekMonday(t))
  setSelectedDateYmd(localYmd(t))
 }

 const jumpWeek = (delta: number) => {
  setWeekMonday((w) => addDays(w, delta * 7))
 }

 const onDateInputChange = (v: string) => {
  if (!v) return
  const d = parseYmd(v)
  setWeekMonday(startOfWeekMonday(d))
  setSelectedDateYmd(v)
 }

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code> 並填入{" "}
    <code className="rounded bg-white/60 px-1">VITE_SUPABASE_URL</code> 與{" "}
    <code className="rounded bg-white/60 px-1">VITE_SUPABASE_ANON_KEY</code>）。
   </div>
  )
 }

 return (
  <div className="space-y-4">
   <header className="flex flex-wrap items-end justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
      <span className="inline-flex items-center gap-1.5">
       <School className="h-7 w-7 text-teal-600" aria-hidden />
       課室管理
      </span>
      <Tag tone="info" size="sm">{rooms.length} 間</Tag>
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">依課室檢視週排程，點選欄位或空白格可快速新增。</p>
    </div>
   </header>

   {pageErr ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {pageErr}
    </div>
   ) : null}

   <section aria-label="選擇課室">
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">選擇課室</p>
    <div className="flex flex-wrap gap-2">
     {rooms.map((r) => {
      const active = r.id === selectedRoomId
      return (
       <button
        key={r.id}
        type="button"
        onClick={() => setSelectedRoomId(r.id)}
        className={cn(
         "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
         "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2",
         active
          ? "border-teal-500 bg-teal-600 text-white shadow-md ring-2 ring-teal-400/40"
          : "border-border bg-card text-foreground hover:border-teal-300 hover:bg-teal-50/60 active:scale-[0.98]"
        )}
       >
        {r.is_online ? <Monitor className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
        <span>{r.name}</span>
        {r.capacity != null ? (
         <span className={cn("tabular-nums", active ? "text-teal-100" : "text-muted-foreground")}>
          （{r.capacity}人）
         </span>
        ) : null}
       </button>
      )
     })}
    </div>
   </section>

   {selectedRoom ? (
    <section
     className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
     aria-label="課室資訊"
    >
     <div className="flex flex-wrap items-center gap-2">
      <span className="text-lg font-semibold"> {selectedRoom.name}</span>
      <span
       className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        selectedRoom.is_online ? "bg-info text-info-foreground" : "bg-teal-100 text-teal-800"
       )}
      >
       {selectedRoom.is_online ? "網課" : "實體課室"}
      </span>
     </div>
     <p className="mt-1 text-sm text-muted-foreground">
      {selectedRoom.capacity != null ? `可容納 ${selectedRoom.capacity} 人` : "容量未設定"}
      {selectedRoom.remarks ? ` · ${selectedRoom.remarks}` : ""}
     </p>
    </section>
   ) : null}

   <section
    className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    aria-label="週曆"
   >
     <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
     <div className="flex flex-wrap items-center gap-2">
      <Button
       type="button"
       variant="outline"
       size="icon"
       className="shrink-0 transition-transform hover:bg-teal-50 active:scale-95"
       aria-label="上一週"
       onClick={() => jumpWeek(-1)}
      >
       <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[10rem] text-center text-sm font-medium tabular-nums sm:min-w-[14rem]">
       {weekStartYmd} — {weekEndYmd}
      </span>
      <Button
       type="button"
       variant="outline"
       size="icon"
       className="shrink-0 transition-transform hover:bg-teal-50 active:scale-95"
       aria-label="下一週"
       onClick={() => jumpWeek(1)}
      >
       <ChevronRight className="h-4 w-4" />
      </Button>
     </div>
     <div className="flex flex-wrap items-center gap-2">
      {isMobile ? (
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
      ) : null}
      <Input
       type="date"
       value={selectedDateYmd}
       onChange={(e) => onDateInputChange(e.target.value)}
       className="h-9 w-[11rem] cursor-pointer transition-colors hover:border-teal-400/60"
      />
      <Button
       type="button"
       variant="outline"
       className="border-amber-400/80 text-amber-900 transition-all hover:bg-amber-50 focus-visible:ring-amber-400/50"
       onClick={goToday}
      >
       今天
      </Button>
     </div>
    </div>

    {isMobile ? (
     <p className="mb-3 text-xs text-muted-foreground">
      可左右滑動查看整週；時間欄固定。預設顯示朝 9–晚 6（至 17:45）。
      {hasEveningSchedules && !showEvening ? " 晚間尚有課堂，可點「顯示晚間」。" : ""}
     </p>
    ) : null}

    <div className="relative overflow-x-auto rounded-lg border border-border">
     {schedLoading ? (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 text-sm text-muted-foreground backdrop-blur-[1px]">
       載入排程…
      </div>
     ) : null}
     <table
      className={cn(
       "w-full table-fixed border-collapse text-sm",
       isMobile ? "min-w-[640px]" : "min-w-[720px]"
      )}
     >
      <colgroup>
       <col style={{ width: `${weekGridColPct.timePct}%` }} />
       {weekDays.map((d) => (
        <col key={d.ymd} style={{ width: `${weekGridColPct.each}%` }} />
       ))}
      </colgroup>
      <thead>
       <tr className="bg-muted/40">
        <th className="sticky left-0 z-[1] border-b border-r border-border bg-muted/50 px-2 py-2 text-left font-medium text-muted-foreground">
         時間
        </th>
        {weekDays.map((d) => {
         const sel = d.ymd === selectedDateYmd
         return (
          <th key={d.ymd} className="min-w-0 border-b border-border p-0">
           <button
            type="button"
            onClick={() => setSelectedDateYmd(d.ymd)}
            className={cn(
             "flex w-full flex-col items-center gap-0.5 px-2 py-2 transition-all duration-200",
             "hover:bg-teal-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500/40",
             sel ? "bg-info/90 text-teal-900" : "bg-transparent"
            )}
           >
            <span className="font-medium">{d.label}</span>
            {sel ? (
             <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-teal-700">
              <Check className="h-3 w-3" aria-hidden />
              選取
             </span>
            ) : (
             <span className="text-[10px] text-muted-foreground">點選</span>
            )}
           </button>
          </th>
         )
        })}
       </tr>
      </thead>
      <tbody>
       {visibleSlots.map((slot) => (
        <tr key={slot.label}>
         <td className="sticky left-0 z-[1] border-r border-border bg-card px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
          {slot.label}
         </td>
         {weekDays.map((d) => {
          const sel = d.ymd === selectedDateYmd
          const items = cellSchedules(d.ymd, slot)
          return (
           <td
            key={`${d.ymd}-${slot.label}`}
            className={cn(
             "align-top border border-border p-0 transition-colors duration-150",
             sel ? "bg-info/50" : "bg-card",
             items.length === 0 && "cursor-pointer hover:bg-teal-50/40 active:bg-teal-100/50"
            )}
           >
            {items.length === 0 ? (
             <button
              type="button"
              aria-label={`${d.label} ${slot.label}，新增排程`}
              className="flex min-h-[3rem] w-full flex-col gap-1 p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500/50"
              onClick={() => {
               setSelectedDateYmd(d.ymd)
               openAddDialog({
                dateYmd: d.ymd,
                start: formatMin(slot.startMin),
                end: formatMin(slot.endMin),
               })
              }}
             />
            ) : (
             <div className="flex min-h-[3rem] flex-col gap-1 p-1.5">
              {items.map((s) => {
               const noStudents = s.enrollCount === 0
               return (
                <Link
                 key={s.id}
                 to={`/Schedule/${s.id}`}
                 title={noStudents ? "暫未有學生報讀" : undefined}
                 className={cn(
                  "block truncate rounded-md border px-1.5 py-0.5 text-xs font-medium",
                  "transition-all hover:shadow-sm active:scale-[0.99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
                  noStudents
                   ? "border-border bg-muted/70 text-muted-foreground hover:border-border hover:bg-muted"
                   : "border-teal-200/80 bg-teal-50/90 text-teal-900 hover:border-teal-400 hover:bg-teal-100"
                 )}
                >
                 {s.classLabel}
                 {s.start_time ? ` · ${s.start_time}` : ""}
                </Link>
               )
              })}
             </div>
            )}
           </td>
          )
         })}
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   </section>

   <section
    className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    aria-label="當日排程"
   >
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
     <h2 className="text-lg font-semibold">
       {selectedDateYmd} 的排程
      {selectedDateYmd === todayYmd ? <Tag tone="warning" size="sm" className="ml-2">今天</Tag> : null}
     </h2>
     <Button
      type="button"
      className="bg-teal-600 text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md focus-visible:ring-teal-500 active:scale-[0.98]"
      onClick={() => openAddDialog()}
     >
      <Plus className="mr-1.5 h-4 w-4" aria-hidden />
      新增排程
     </Button>
    </div>

    {daySchedules.length === 0 ? (
     <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      此日期暫無排程
     </p>
    ) : (
     <ul className="space-y-2">
      {daySchedules.map((s) => {
       const noStudents = s.enrollCount === 0
       return (
        <li key={s.id}>
         <Link
          to={`/Schedule/${s.id}`}
          className={cn(
           "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-all",
           "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
           noStudents
            ? "border-border/80 bg-muted/70 text-muted-foreground hover:bg-muted"
            : "border-border bg-card hover:border-teal-300 hover:bg-teal-50/50"
          )}
         >
          <span className={cn("font-medium", noStudents ? "text-muted-foreground" : "text-foreground")}>
           {s.classLabel}
           {s.course_code_full ? `（${s.course_code_full}）` : ""}
          </span>
          <span className="inline-flex flex-wrap items-center gap-1 text-sm tabular-nums text-muted-foreground">
           <span>
            {s.start_time ?? "—"} — {s.end_time ?? "—"}
            {s.teacher_name ? ` · ${s.teacher_name}` : ""}
           </span>
           <Tag tone={statusToTagTone(s.status)} size="sm">{s.status}</Tag>
           {noStudents ? (
            <Tag tone={statusToTagTone("暫未有學生報讀")} size="sm">無學生</Tag>
           ) : null}
          </span>
         </Link>
        </li>
       )
      })}
     </ul>
    )}
   </section>

   <Dialog open={addOpen} onOpenChange={setAddOpen}>
    <DialogContent className="max-w-md border-teal-100">
     <DialogHeader>
      <DialogTitle>新增排程</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <label className="grid gap-1">
       <span className="text-muted-foreground">班別</span>
       <Select
        className="h-9 w-full rounded-md border border-input bg-background px-2 transition-colors hover:border-teal-400/50"
        value={addClassId}
        onChange={(e) => setAddClassId(e.target.value)}
       >
        {classOptions.length === 0 ? <option value="">（尚無班別）</option> : null}
        {classOptions.map((o) => (
         <option key={o.id} value={o.id}>
          {o.label}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">日期</span>
       <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="h-9" />
      </label>
      <div className="grid grid-cols-2 gap-2">
       <label className="grid gap-1">
        <span className="text-muted-foreground">開始</span>
        <Input
         type="time"
         value={addStart}
         onChange={(e) => setAddStart(e.target.value)}
         className="h-9 tabular-nums"
        />
       </label>
       <label className="grid gap-1">
        <span className="text-muted-foreground">結束</span>
        <Input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} className="h-9 tabular-nums" />
       </label>
      </div>
      {addErr ? <p className="text-sm text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-1">
       <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={addSaving}>
        取消
       </Button>
       <Button
        type="button"
        className="bg-teal-600 hover:bg-teal-700"
        disabled={addSaving || !addClassId}
        onClick={() => void submitAdd()}
       >
        {addSaving ? "儲存中…" : "儲存"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
