import { useEffect, useMemo, useState } from "react"

import { Field, localTodayYmd } from "@/components/frontDesk/frontDeskUi"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import {
 fetchEnrolledClassesForStudent,
 fetchMakeupCandidateSchedules,
 fetchUpcomingSchedulesForClass,
 formatLeaveScheduleOptionLabel,
 formatMakeupCandidateLabel,
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
 const { confirmDialog } = useAppConfirm()
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

 /** 有幾組連堂被整組勾選（兩節都勾＝欠 2 堂／組） */
 const fullConsecutiveGroupCount = useMemo(() => {
  const selectedSet = new Set(selectedScheduleIds)
  const seenGroups = new Set<string>()
  let count = 0
  for (const s of schedules) {
   if (!s.consecutive_group_id || seenGroups.has(s.consecutive_group_id)) continue
   seenGroups.add(s.consecutive_group_id)
   const peers = schedules.filter((p) => p.consecutive_group_id === s.consecutive_group_id)
   if (peers.length > 1 && peers.every((p) => selectedSet.has(p.id))) count += 1
  }
  return count
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

  if (
   fullConsecutiveGroupCount > 0 &&
   !(await confirmDialog({
    title: "連堂兩節一併請假",
    description:
     fullConsecutiveGroupCount === 1
      ? "已勾選連堂兩節，將建立兩筆請假，欠補最多 2 堂。若只欠一節，請只勾其中一節。"
      : `已有 ${fullConsecutiveGroupCount} 組連堂兩節都勾選，每組將欠補 2 堂。若只欠一節，請只勾該節。`,
    confirmText: "確認兩節一併",
    tone: "warning",
   }))
  ) {
   return
  }

  setSaving(true)
  setErr(null)
  const dates: string[] = []
  try {
   const selectedSet = new Set(selectedScheduleIds)
   const handled = new Set<string>()
   let makeupApplied = false

   const insertOne = async (
    sched: ClassScheduleOption,
    scope: "all" | "this_slot"
   ) => {
    const applyMakeup = !makeupApplied && makeup === "調堂"
    if (applyMakeup) makeupApplied = true
    await insertLeaveMakeupForSchedule({
     student_id: student.id,
     class_id: classId,
     schedule_id: sched.id,
     leave_date: sched.scheduled_date,
     leave_reason: reason,
     makeup_type: applyMakeup ? makeup : makeup === "調堂" ? "待安排" : makeup,
     makeup_schedule_id: applyMakeup ? makeupScheduleId : null,
     makeup_date: applyMakeup ? (makeupRow?.scheduled_date ?? null) : null,
     remarks: remarks.trim() || null,
     status: "待補課",
     consecutiveScope: scope,
    })
    dates.push(sched.scheduled_date)
    onLeaveAdded()
   }

   for (const sched of selectedSorted) {
    if (handled.has(sched.id)) continue
    if (sched.consecutive_group_id) {
     const peersInList = schedules.filter(
      (s) => s.consecutive_group_id === sched.consecutive_group_id
     )
     const selectedPeers = peersInList.filter((s) => selectedSet.has(s.id))
     for (const p of selectedPeers) handled.add(p.id)
     if (peersInList.length > 1 && selectedPeers.length >= peersInList.length) {
      await insertOne(selectedPeers[0]!, "all")
     } else {
      for (const p of selectedPeers) {
       await insertOne(p, "this_slot")
      }
     }
    } else {
     handled.add(sched.id)
     await insertOne(sched, "this_slot")
    }
   }
   setRegisteredDates((prev) => [...prev, ...dates])
   pushBanner({
    tone: "success",
    title: "已登記請假",
    message: `共 ${dates.length} 筆：${dates.join("、")}`,
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
            <span>{formatLeaveScheduleOptionLabel(s)}</span>
           </label>
          </li>
         )
        })}
       </ul>
      )}
      {selectedScheduleIds.length > 0 ? (
       <p
        className={cn(
         "text-xs",
         fullConsecutiveGroupCount > 0 ? "text-warning" : "text-success"
        )}
       >
        {fullConsecutiveGroupCount > 0
         ? `已選 ${selectedScheduleIds.length} 項；其中 ${fullConsecutiveGroupCount} 組連堂兩節都勾＝整組請假（每組欠最多 2 堂）。只欠一節請只勾該節。`
         : `已選 ${selectedScheduleIds.length} 項（連堂只勾一節＝只請該節、欠 1 堂；兩節都勾＝整組請假）`}
       </p>
      ) : (
       <p className="text-xs text-muted-foreground">
        連堂預設只請所勾那一節；兩節都欠才要兩節都勾（提交時會再確認）。
       </p>
      )}
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
      <Field label="補堂排程（套用至第一筆請假；連堂請選正確那一節）">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={makeupScheduleId}
        onChange={(e) => setMakeupScheduleId(e.target.value)}
       >
        <option value="">請選擇補堂</option>
        {makeupCandidates.map((s) => (
         <option key={s.id} value={s.id}>
          {formatMakeupCandidateLabel(s)}
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
