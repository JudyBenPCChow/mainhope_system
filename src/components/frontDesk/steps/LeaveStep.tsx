import { useEffect, useMemo, useState } from "react"

import { Field, localTodayYmd } from "@/components/frontDesk/frontDeskUi"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import {
 fetchEnrolledClassesForStudent,
 fetchMakeupCandidateSchedules,
 fetchUpcomingSchedulesForClass,
 insertLeaveMakeupForSchedule,
 LEAVE_MAKEUP_OPTIONS,
 STUDENT_LEAVE_REASON_OPTIONS,
 validateMakeupScheduleForStudent,
 type ClassScheduleOption,
 type EnrolledClassOption,
} from "@/services/leaveQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"
import type { StudentRecord } from "@/services/studentQueries"

type Props = {
 student: StudentRecord
 leaveCount: number
 onLeaveAdded: () => void
 onSkip: () => void
 onFinish: () => void
}

export function LeaveStep({ student, leaveCount, onLeaveAdded, onSkip, onFinish }: Props) {
 const { pushBanner } = useAppBanner()
 const [classes, setClasses] = useState<EnrolledClassOption[]>([])
 const [schedules, setSchedules] = useState<ClassScheduleOption[]>([])
 const [makeupCandidates, setMakeupCandidates] = useState<ScheduleManageRow[]>([])
 const [classId, setClassId] = useState("")
 const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
 const [reason, setReason] = useState<(typeof STUDENT_LEAVE_REASON_OPTIONS)[number]>("病假")
 const [makeup, setMakeup] = useState<(typeof LEAVE_MAKEUP_OPTIONS)[number]>("待安排")
 const [makeupScheduleId, setMakeupScheduleId] = useState("")
 const [remarks, setRemarks] = useState("")
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [registeredDates, setRegisteredDates] = useState<string[]>([])

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  void fetchEnrolledClassesForStudent(student.id)
   .then((list) => {
    if (cancelled) return
    setClasses(list)
    if (list.length === 1) setClassId(list[0].id)
   })
   .catch((e) => {
    if (!cancelled) reportUserFacingError(e, { source: "LeaveStep.loadClasses", setErr })
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [student.id])

 useEffect(() => {
  if (!classId) {
   setSchedules([])
   setSelectedScheduleIds([])
   return
  }
  let cancelled = false
  void fetchUpcomingSchedulesForClass(classId, localTodayYmd(), student.id)
   .then((opts) => {
    if (!cancelled) {
     setSchedules(opts)
     setSelectedScheduleIds([])
    }
   })
   .catch((e) => {
    if (!cancelled) reportUserFacingError(e, { source: "LeaveStep.loadSchedules", setErr })
   })
  return () => {
   cancelled = true
  }
 }, [classId, student.id])

 const primaryScheduleId = selectedScheduleIds[0] ?? ""

 useEffect(() => {
  if (makeup !== "調堂" || !primaryScheduleId) {
   setMakeupCandidates([])
   setMakeupScheduleId("")
   return
  }
  let cancelled = false
  void fetchMakeupCandidateSchedules({
   studentId: student.id,
   excludeScheduleIds: selectedScheduleIds,
  })
   .then((rows) => {
    if (!cancelled) setMakeupCandidates(rows)
   })
   .catch(() => {
    if (!cancelled) setMakeupCandidates([])
   })
  return () => {
   cancelled = true
  }
 }, [makeup, primaryScheduleId, selectedScheduleIds, student.id])

 const toggleSchedule = (id: string) => {
  setSelectedScheduleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
 }

 const selectedSorted = useMemo(() => {
  const set = new Set(selectedScheduleIds)
  return schedules.filter((s) => set.has(s.id))
 }, [schedules, selectedScheduleIds])

 const onSubmit = async () => {
  if (saving) return
  if (!classId || selectedSorted.length === 0) {
   setErr("請選擇班別，並勾選至少一天（一堂）請假排程")
   return
  }
  if (makeup === "調堂" && !makeupScheduleId) {
   setErr("補課安排為「調堂」時，請選擇補堂排程（套用至本次勾選的第一堂）")
   return
  }
  const makeupRow = makeup === "調堂" ? makeupCandidates.find((s) => s.id === makeupScheduleId) : undefined
  if (makeupRow && primaryScheduleId) {
   const makeupErr = await validateMakeupScheduleForStudent(student.id, makeupRow, primaryScheduleId)
   if (makeupErr) {
    setErr(makeupErr)
    return
   }
  }

  setSaving(true)
  setErr(null)
  const dates: string[] = []
  try {
   for (let i = 0; i < selectedSorted.length; i++) {
    const sched = selectedSorted[i]
    await insertLeaveMakeupForSchedule({
     student_id: student.id,
     class_id: classId,
     schedule_id: sched.id,
     leave_date: sched.scheduled_date,
     leave_reason: reason,
     // 調堂排程僅套用至第一堂；其餘先標「待安排」，之後可在請假管理選調堂日
     makeup_type: makeup === "調堂" && i > 0 ? "待安排" : makeup,
     makeup_schedule_id: makeup === "調堂" && i === 0 ? makeupScheduleId : null,
     makeup_date: makeup === "調堂" && i === 0 ? (makeupRow?.scheduled_date ?? null) : null,
     remarks: remarks.trim() || null,
     status: "待補課",
    })
    dates.push(sched.scheduled_date)
    onLeaveAdded()
   }
   setRegisteredDates((prev) => [...prev, ...dates])
   pushBanner({
    tone: "success",
    title: "已登記請假",
    message: `共 ${dates.length} 天：${dates.join("、")}`,
   })
   setSelectedScheduleIds([])
   setMakeupScheduleId("")
   setRemarks("")
   const opts = await fetchUpcomingSchedulesForClass(classId, localTodayYmd(), student.id)
   setSchedules(opts)
  } catch (e) {
   reportUserFacingError(e, { source: "LeaveStep.onSubmit", setErr, userMessage: "新增失敗" })
  } finally {
   setSaving(false)
  }
 }

 return (
  <div className="space-y-6">
   <p className="text-sm text-muted-foreground">
    可一次勾選多天（多堂）未來排程請假。沒有則可略過。
   </p>
   {leaveCount > 0 || registeredDates.length > 0 ? (
    <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success" role="status">
     本流程已登記 {leaveCount} 筆請假
     {registeredDates.length > 0 ? `（${registeredDates.join("、")}）` : ""}。可再選其他日子繼續登記。
    </div>
   ) : null}
   {err ? (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {loading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}

   {!loading && classes.length === 0 ? (
    <div role="alert" className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
     尚無「就讀中」班別，無法登記請假。請先完成報讀。
    </div>
   ) : (
    <div className="space-y-4">
     <Field label="班別">
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
       value={classId}
       onChange={(e) => setClassId(e.target.value)}
      >
       <option value="">請選擇班別</option>
       {classes.map((c) => (
        <option key={c.id} value={c.id}>
         {c.subject}
         {c.course_code_full ? `（${c.course_code_full}）` : ""}
        </option>
       ))}
      </Select>
     </Field>

     <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <span className="text-sm font-medium">請假排程（可多選）</span>
       <div className="flex gap-2 text-xs">
        <button
         type="button"
         className="text-primary hover:underline disabled:opacity-50"
         disabled={schedules.length === 0}
         onClick={() => setSelectedScheduleIds(schedules.map((s) => s.id))}
        >
         全選
        </button>
        <button
         type="button"
         className="text-muted-foreground hover:underline disabled:opacity-50"
         disabled={selectedScheduleIds.length === 0}
         onClick={() => setSelectedScheduleIds([])}
        >
         清除
        </button>
       </div>
      </div>
      {schedules.length === 0 ? (
       <p className="text-sm text-muted-foreground">此班目前沒有可請假的未來排程。</p>
      ) : (
       <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
        {schedules.map((s) => {
         const checked = selectedScheduleIds.includes(s.id)
         return (
          <li key={s.id}>
           <label
            className={cn(
             "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
             checked ? "bg-primary/10" : "hover:bg-muted/60"
            )}
           >
            <input
             type="checkbox"
             className="h-4 w-4 rounded border-input"
             checked={checked}
             onChange={() => toggleSchedule(s.id)}
            />
            <span>
             {s.scheduled_date}
             {s.start_time ? ` ${s.start_time.slice(0, 5)}` : ""}
             {s.end_time ? `–${s.end_time.slice(0, 5)}` : ""}
            </span>
           </label>
          </li>
         )
        })}
       </ul>
      )}
      {selectedScheduleIds.length > 0 ? (
       <p className="text-xs text-success">已選 {selectedScheduleIds.length} 天</p>
      ) : null}
     </div>

     <div className="grid gap-4 sm:grid-cols-2">
      <Field label="原因">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={reason}
        onChange={(e) => setReason(e.target.value as (typeof STUDENT_LEAVE_REASON_OPTIONS)[number])}
       >
        {STUDENT_LEAVE_REASON_OPTIONS.map((r) => (
         <option key={r} value={r}>
          {r}
         </option>
        ))}
       </Select>
      </Field>
      <Field label="補課安排">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={makeup}
        onChange={(e) => setMakeup(e.target.value as (typeof LEAVE_MAKEUP_OPTIONS)[number])}
       >
        {LEAVE_MAKEUP_OPTIONS.map((r) => (
         <option key={r} value={r}>
          {r}
         </option>
        ))}
       </Select>
      </Field>
     </div>
     {makeup === "調堂" ? (
      <Field label="補堂排程（套用至勾選的第一堂）">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={makeupScheduleId}
        onChange={(e) => setMakeupScheduleId(e.target.value)}
       >
        <option value="">請選擇補堂</option>
        {makeupCandidates.map((s) => (
         <option key={s.id} value={s.id}>
          {s.scheduled_date}
          {s.start_time ? ` ${String(s.start_time).slice(0, 5)}` : ""}
         </option>
        ))}
       </Select>
      </Field>
     ) : null}
     <Field label="備註（選填）">
      <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
     </Field>
    </div>
   )}

   <div className="flex flex-wrap gap-2">
    <Button
     type="button"
     disabled={saving || classes.length === 0 || selectedScheduleIds.length === 0}
     onClick={() => void onSubmit()}
    >
     {saving
      ? "登記中…"
      : selectedScheduleIds.length > 1
        ? `登記所選 ${selectedScheduleIds.length} 天請假`
        : "登記此堂請假"}
    </Button>
    {leaveCount > 0 ? (
     <Button type="button" variant="outline" onClick={onFinish}>
      完成精靈
     </Button>
    ) : (
     <Button type="button" variant="outline" onClick={onSkip}>
      略過請假並完成
     </Button>
    )}
   </div>
  </div>
 )
}
