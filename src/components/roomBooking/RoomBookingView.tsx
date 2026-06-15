import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, DoorOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatClassLabel } from "@/lib/courseLabel"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 formatMin,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
 LESSON_SLOT_INDICES,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import { getMgmtRole } from "@/lib/mgmtRole"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { fetchAllClasses, type ClassRecord } from "@/services/classQueries"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import {
 createRoomBookingRequest,
 fetchPendingBookingRequestsDetailed,
 fetchSchedulesForRoomCalendar,
 occupiersForSlot,
 slotIsFreeForBooking,
} from "@/services/roomBookingQueries"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

const OTHER_VALUE = "__OTHER__"

function weekdayLabel(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 const w = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()]
 return `週${w}`
}

export function RoomBookingView() {
 const role = getMgmtRole()
 const teacherId = getTeacherScopeTeacherId()
 const today = localYmd()
 const [weekStart, setWeekStart] = useState(today)
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [schedules, setSchedules] = useState<Awaited<ReturnType<typeof fetchSchedulesForRoomCalendar>>>([])
 const [pending, setPending] = useState<Awaited<ReturnType<typeof fetchPendingBookingRequestsDetailed>>>([])
 const [myClasses, setMyClasses] = useState<ClassRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [dialogOpen, setDialogOpen] = useState(false)
 const [pickDate, setPickDate] = useState("")
 const [pickRoomId, setPickRoomId] = useState("")
 const [pickRoomName, setPickRoomName] = useState("")
 const [pickSlotIdx, setPickSlotIdx] = useState(0)
 const [classChoice, setClassChoice] = useState("")
 const [reason, setReason] = useState("")
 const [submitting, setSubmitting] = useState(false)
 const [formErr, setFormErr] = useState<string | null>(null)

 const weekEnd = useMemo(() => addDaysYmd(weekStart, 6), [weekStart])
 const weekDays = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => addDaysYmd(weekStart, i)), [weekStart])

 const weekGridColPct = useMemo(() => {
  const timePct = 10
  const each = (100 - timePct) / 7
  return { timePct, each }
 }, [])

 const physicalRooms = useMemo(() => rooms.filter((r) => !r.is_online), [rooms])

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured || !teacherId) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [rm, cls] = await Promise.all([fetchClassrooms(), fetchAllClasses()])
   const mine = cls.filter((c) => c.teacher_id === teacherId)
   setMyClasses(mine.sort((a, b) => a.subject.localeCompare(b.subject, "zh-Hant")))
   setRooms(rm)
   const ids = rm.filter((r) => !r.is_online).map((r) => r.id)
   const [sc, pend] = await Promise.all([
    fetchSchedulesForRoomCalendar(ids, weekStart, weekEnd),
    fetchPendingBookingRequestsDetailed(weekStart, weekEnd),
   ])
   setSchedules(sc)
   setPending(pend)
  } catch (e) {
   reportUserFacingError(e, { source: "RoomBookingView.load", setErr })
  } finally {
   setLoading(false)
  }
 }, [teacherId, weekStart, weekEnd])

 useEffect(() => {
  void reload()
 }, [reload])

 const mineClassOptions = useMemo(() => myClasses, [myClasses])

 const openBook = (ymd: string, room: RoomRecord, slotIdx: number) => {
  const st = formatMin(lessonSlotStartMinute(slotIdx))
  const en = formatMin(lessonSlotEndMinute(slotIdx))
  setPickDate(ymd)
  setPickRoomId(room.id)
  setPickRoomName(room.name)
  setPickSlotIdx(slotIdx)
  setClassChoice(mineClassOptions[0]?.id ?? OTHER_VALUE)
  setReason("")
  setFormErr(null)
  setDialogOpen(true)
  void slotIsFreeForBooking({
   classroomId: room.id,
   scheduledDate: ymd,
   startTime: st,
   endTime: en,
  }).then((ok) => {
   if (!ok) setFormErr("此時段已有排程或待審申請，請重新整理。")
  })
 }

 const submitRequest = async () => {
  if (!teacherId || !pickRoomId || !pickDate) return
  const st = formatMin(lessonSlotStartMinute(pickSlotIdx))
  const en = formatMin(lessonSlotEndMinute(pickSlotIdx))
  const isOther = classChoice === OTHER_VALUE
  if (isOther && !reason.trim()) {
   setFormErr("選擇「其他」時請填寫約房原因。")
   return
  }
  const free = await slotIsFreeForBooking({
   classroomId: pickRoomId,
   scheduledDate: pickDate,
   startTime: st,
   endTime: en,
  })
  if (!free) {
   setFormErr("此時段已被占用，請關閉後重選。")
   return
  }
  setSubmitting(true)
  setFormErr(null)
  try {
   await createRoomBookingRequest({
    teacherId,
    classroomId: pickRoomId,
    scheduledDate: pickDate,
    startTime: st,
    endTime: en,
    targetClassId: isOther ? null : classChoice,
    isOther,
    reason: reason.trim() || null,
   })
   setDialogOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "RoomBookingView.submit", setErr: setFormErr })
  } finally {
   setSubmitting(false)
  }
 }

 if (!isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 if (role !== "teacher" || !teacherId) {
  return (
   <div className="space-y-3 p-4">
    <p className="text-muted-foreground">請以<strong>專班老師</strong>身分登入後使用「預約空房」。</p>
   </div>
  )
 }

 return (
  <div className="space-y-5">
   <header>
    <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
     <DoorOpen className="h-7 w-7 text-teal-600" aria-hidden />
     預約空房
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
     周曆以<strong>今天</strong>為第 1 日；每格 <strong>75 分鐘</strong>（09:00 起）。綠格可預約；<strong className="text-warning">橙色</strong>
     為待審約房；<strong className="text-amber-800">琥珀色</strong>為已排定堂數。
    </p>
   </header>

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <div className="flex flex-wrap items-center gap-2">
    <Button
     type="button"
     variant="outline"
     size="sm"
     onClick={() => setWeekStart((w) => addDaysYmd(w, -7))}
    >
     <ChevronLeft className="h-4 w-4" />
     上一週
    </Button>
    <Button
     type="button"
     variant="outline"
     size="sm"
     onClick={() => setWeekStart((w) => addDaysYmd(w, 7))}
    >
     下一週
     <ChevronRight className="h-4 w-4" />
    </Button>
    <Button type="button" variant="secondary" size="sm" onClick={() => setWeekStart(today)}>
     本週（今天起）
    </Button>
    <span className="text-sm text-muted-foreground tabular-nums">
     {weekStart} — {weekEnd}
    </span>
   </div>

   {loading ? (
    <p className="text-muted-foreground">載入中…</p>
   ) : (
    <div className="space-y-10">
     {physicalRooms.map((room) => (
      <section key={room.id} className="rounded-xl border border-border bg-card shadow-sm">
       <div className="border-b border-border bg-muted/30 px-4 py-3">
        <h2 className="text-lg font-semibold">{room.name}</h2>
        {room.capacity != null ? (
         <p className="text-xs text-muted-foreground">容量約 {room.capacity} 人</p>
        ) : null}
       </div>
       <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-xs sm:text-sm">
         <colgroup>
          <col style={{ width: `${weekGridColPct.timePct}%` }} />
          {weekDays.map((d) => (
           <col key={d} style={{ width: `${weekGridColPct.each}%` }} />
          ))}
         </colgroup>
         <thead>
          <tr className="bg-muted/40 text-left text-muted-foreground">
           <th className="sticky left-0 z-[1] border border-border bg-muted/50 px-2 py-2">
            時段
           </th>
           {weekDays.map((d) => (
            <th key={d} className="min-w-0 border border-border px-1 py-2 font-medium">
             <div className="tabular-nums">{d.slice(5).replace("-", "/")}</div>
             <div className="font-normal text-[10px] text-muted-foreground">{weekdayLabel(d)}</div>
            </th>
           ))}
          </tr>
         </thead>
         <tbody>
          {LESSON_SLOT_INDICES.map((slotIdx) => (
           <tr key={slotIdx}>
            <td className="sticky left-0 z-[1] border border-border bg-card px-2 py-1.5 tabular-nums text-muted-foreground">
             {lessonSlotLabel(slotIdx)}
            </td>
            {weekDays.map((d) => {
             const slotStart = lessonSlotStartMinute(slotIdx)
             const slotEnd = lessonSlotEndMinute(slotIdx)
             const occ = occupiersForSlot(d, room.id, slotStart, slotEnd, schedules, pending)
             const free = occ.length === 0
             return (
              <td key={`${room.id}-${d}-${slotIdx}`} className="align-top border border-border p-1">
               {free ? (
                <button
                 type="button"
                 onClick={() => openBook(d, room, slotIdx)}
                 className={cn(
                  "flex min-h-[3.5rem] w-full flex-col items-center justify-center rounded-md border border-success/80 bg-success/90 px-1 py-1 text-[11px] font-medium text-success transition-colors hover:bg-success"
                 )}
                >
                 可預約
                </button>
               ) : (
                <ul className="space-y-1">
                 {occ.map((o) => {
                  const isPending = o.kind === "pending"
                  return (
                   <li
                    key={`${o.kind}-${o.id}`}
                    className={cn(
                     "rounded-md border p-1.5 text-[11px] leading-tight shadow-sm",
                     isPending
                      ? "border-warning/90 bg-warning text-warning-foreground"
                      : "border-warning/30 bg-warning/10 text-warning"
                    )}
                   >
                    <span className="font-medium">{o.label}</span>
                    {o.teacherName ? (
                     <span
                      className={cn(
                       "block text-[10px]",
                       isPending ? "text-warning/85" : "text-amber-900/80"
                      )}
                     >
                      {o.teacherName}
                     </span>
                    ) : null}
                   </li>
                  )
                 })}
                </ul>
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
     ))}
     {physicalRooms.length === 0 ? (
      <p className="text-muted-foreground">尚無實體課室資料。</p>
     ) : null}
    </div>
   )}

   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>提交約房申請</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <p className="rounded-lg border border-border bg-muted/30 px-3 py-2">
       <span className="font-medium tabular-nums">{pickDate}</span> · {weekdayLabel(pickDate)}
       <br />
       {lessonSlotLabel(pickSlotIdx)} · {pickRoomName}
      </p>
      <label className="grid gap-1">
       <span className="text-muted-foreground">補堂所屬班別</span>
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-2"
        value={classChoice}
        onChange={(e) => setClassChoice(e.target.value)}
       >
        {mineClassOptions.map((c) => (
         <option key={c.id} value={c.id}>
          {formatClassLabel({
           subject: c.subject,
           courseCode: c.course_code_full,
           courseName: c.course_name,
          })}
         </option>
        ))}
        <option value={OTHER_VALUE}>其他</option>
       </Select>
      </label>
      {classChoice === OTHER_VALUE ? (
       <label className="grid gap-1">
        <span className="text-muted-foreground">約房原因（必填）</span>
        <Textarea
         value={reason}
         onChange={(e) => setReason(e.target.value)}
         placeholder="請說明用途…"
         className="min-h-[100px]"
        />
       </label>
      ) : (
       <label className="grid gap-1">
        <span className="text-muted-foreground">備註（選填）</span>
        <Textarea
         value={reason}
         onChange={(e) => setReason(e.target.value)}
         placeholder="可填寫補堂說明…"
         className="min-h-[80px]"
        />
       </label>
      )}
      {formErr ? <p className="text-destructive">{formErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={submitting} onClick={() => setDialogOpen(false)}>
        取消
       </Button>
       <Button type="button" disabled={submitting} onClick={() => void submitRequest()}>
        {submitting ? "送出中…" : "送出申請"}
       </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
       送出後由管理員審批；核准後會寫入排程（選班別則綁定該班；選「其他」則備註為「○○老師預約」）。
      </p>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
