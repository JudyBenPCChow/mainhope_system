import { useEffect, useMemo, useState } from "react"

import { RecordField as Field } from "@/components/detail/RecordField"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChoiceChips } from "@/components/students/studentsUi"
import {
 formatClassScheduleLabel,
 isCancelledScheduleStatus,
 resolveEnrollmentStartDate,
 type EnrollmentStartMode,
} from "@/lib/enrollmentStart"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 classifyTransferStartOption,
 resolveNextTransferStartSchedule,
} from "@/lib/transferClassTime"
import { localTodayYmd } from "@/components/frontDesk/frontDeskUi"
import { fetchClassSchedules, type ClassScheduleRow } from "@/services/classQueries"
import type { ClassOption, EnrollmentWithClass } from "@/services/studentQueries"
import {
 fetchTransferClassTimeContext,
 type TransferClassTimeContext,
 type TransferLeavePreviewRow,
} from "@/services/transferClassTimeQueries"

type Props = {
 open: boolean
 studentId: string
 enrollment: EnrollmentWithClass | null
 classOptions: ClassOption[]
 occupiedClassIds: Set<string>
 onOpenChange: (open: boolean) => void
 onSubmit: (opts: {
  toClassId: string
  enrollDate: string
  extraReason: string
 }) => Promise<void>
}

function leaveLine(row: TransferLeavePreviewRow): string {
 const makeup = row.makeupDate
  ? `${row.makeupDate}${row.makeupClassLabel ? ` · ${row.makeupClassLabel}` : ""}${
     row.makeupSlot ? ` · ${row.makeupSlot}` : ""
    }`
  : "尚未約日"
 return `請假 ${row.leaveDate}${row.leaveReason ? `（${row.leaveReason}）` : ""} → ${makeup}`
}

export function TransferClassTimeDialog({
 open,
 studentId,
 enrollment,
 classOptions,
 occupiedClassIds,
 onOpenChange,
 onSubmit,
}: Props) {
 const todayYmd = localTodayYmd()
 const [toClassId, setToClassId] = useState("")
 const [startMode, setStartMode] = useState<EnrollmentStartMode>("next")
 const [startScheduleId, setStartScheduleId] = useState("")
 const [extraReason, setExtraReason] = useState("")
 const [ackUnscheduled, setAckUnscheduled] = useState(false)
 const [schedules, setSchedules] = useState<ClassScheduleRow[]>([])
 const [schedulesLoading, setSchedulesLoading] = useState(false)
 const [ctx, setCtx] = useState<TransferClassTimeContext | null>(null)
 const [ctxLoading, setCtxLoading] = useState(false)
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const targetOptions = useMemo(() => {
  if (!enrollment) return []
  return classOptions.filter(
   (o) =>
    o.id !== enrollment.classId &&
    o.subject === enrollment.classSubject &&
    o.classKind === "group" &&
    o.courseMode !== "summer_two_period" &&
    !occupiedClassIds.has(o.id)
  )
 }, [classOptions, enrollment, occupiedClassIds])

 useEffect(() => {
  if (!open) {
   setToClassId("")
   setStartMode("next")
   setStartScheduleId("")
   setExtraReason("")
   setAckUnscheduled(false)
   setSchedules([])
   setCtx(null)
   setError(null)
   setSaving(false)
  }
 }, [open])

 useEffect(() => {
  if (!open || !toClassId || !enrollment || !studentId) {
   setSchedules([])
   setCtx(null)
   return
  }
  let cancelled = false
  setSchedulesLoading(true)
  setCtxLoading(true)
  void Promise.all([
   fetchClassSchedules(toClassId),
   fetchTransferClassTimeContext({
    studentId,
    fromClassId: enrollment.classId,
    toClassId,
   }),
  ])
   .then(([rows, nextCtx]) => {
    if (cancelled) return
    setSchedules(rows)
    setCtx(nextCtx)
   })
   .catch((e) => {
    if (cancelled) return
    setError(formatUnknownError(e))
   })
   .finally(() => {
    if (cancelled) return
    setSchedulesLoading(false)
    setCtxLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [open, toClassId, enrollment, studentId])

 const nextSchedule = useMemo(
  () =>
   resolveNextTransferStartSchedule(schedules, todayYmd, {
    attendedOnTargetYmds: ctx?.attendedOnTargetYmds ?? [],
    arrangedOnTargetYmds: ctx?.arrangedOnTargetYmds ?? [],
   }),
  [schedules, todayYmd, ctx]
 )

 const startOptions = useMemo(
  () =>
   schedules
    .filter((row) => !isCancelledScheduleStatus(row.status))
    .map((row) => {
     const kind = classifyTransferStartOption({
      scheduleYmd: row.scheduled_date,
      todayYmd,
      attendedOnTargetYmds: ctx?.attendedOnTargetYmds ?? [],
      arrangedOnTargetYmds: ctx?.arrangedOnTargetYmds ?? [],
     })
     return { row, kind }
    })
    .filter((item) => item.kind !== "hidden"),
  [schedules, todayYmd, ctx]
 )

 const needsAck = Boolean(ctx && ctx.unscheduled.length > 0)
 const canSubmit =
  Boolean(toClassId) &&
  !saving &&
  !schedulesLoading &&
  !ctxLoading &&
  (!needsAck || ackUnscheduled) &&
  (startMode === "next" ? Boolean(nextSchedule) : Boolean(startScheduleId))

 const submit = async () => {
  if (!enrollment) return
  setError(null)
  try {
   const enrollDate = resolveEnrollmentStartDate({
    mode: startMode,
    todayYmd,
    nextScheduleDate: nextSchedule?.scheduled_date,
    specifiedScheduleDate: startOptions.find((item) => item.row.id === startScheduleId)?.row
     .scheduled_date,
   })
   setSaving(true)
   await onSubmit({ toClassId, enrollDate, extraReason })
   onOpenChange(false)
  } catch (e) {
   reportUserFacingError(e, {
    source: "TransferClassTimeDialog.submit",
    setErr: setError,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setSaving(false)
  }
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
    <DialogHeader>
     <DialogTitle>轉時間</DialogTitle>
    </DialogHeader>
    {enrollment ? (
     <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
       只可改同一科目的上課時段。轉科或只離開請用退讀。請假與補堂跟舊班，不會搬去新班。
      </p>
      <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
       現時：{[enrollment.dayOfWeek, enrollment.timeSlot].filter(Boolean).join(" ") || "—"}
      </div>
      <Field label="改為">
       {targetOptions.length === 0 ? (
        <p className="text-muted-foreground">沒有可轉的同科專科班。</p>
       ) : (
        <Select
         className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
         value={toClassId}
         onChange={(e) => {
          setToClassId(e.target.value)
          setStartScheduleId("")
          setAckUnscheduled(false)
         }}
        >
         <option value="">請選擇同科另一時段…</option>
         {targetOptions.map((o) => (
          <option key={o.id} value={o.id}>
           {o.label}
          </option>
         ))}
        </Select>
       )}
      </Field>

      {toClassId && ctxLoading ? (
       <p className="text-muted-foreground">核對舊班補堂中…</p>
      ) : null}
      {ctx && (ctx.arrangedOnTarget.length > 0 || ctx.arrangedElsewhere.length > 0 || ctx.unscheduled.length > 0) ? (
       <div className="space-y-2 rounded-md border border-amber-700/35 bg-amber-50 px-3 py-2 text-amber-950">
        {ctx.arrangedOnTarget.length > 0 ? (
         <div>
          <p className="font-medium">已安排補堂（新班，尚未上）</p>
          <p className="mt-1 text-xs">轉時間的報讀第一堂必須在此補堂完成之後。該日仍以調堂上紙。</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
           {ctx.arrangedOnTarget.map((row) => (
            <li key={row.id}>{leaveLine(row)}</li>
           ))}
          </ul>
         </div>
        ) : null}
        {ctx.arrangedElsewhere.length > 0 ? (
         <div>
          <p className="font-medium">已安排補堂（其他班）</p>
          <p className="mt-1 text-xs">學生仍須依約上此補堂。</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
           {ctx.arrangedElsewhere.map((row) => (
            <li key={row.id}>{leaveLine(row)}</li>
           ))}
          </ul>
         </div>
        ) : null}
        {ctx.unscheduled.length > 0 ? (
         <div>
          <p className="font-medium">舊班尚有請假未約補堂</p>
          <p className="mt-1 text-xs">請假及補堂跟舊班。轉時間後請到請假管理繼續約日。欠堂不會消失。</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
           {ctx.unscheduled.map((row) => (
            <li key={row.id}>{leaveLine(row)}</li>
           ))}
          </ul>
          <label className="mt-2 flex items-start gap-2 text-xs">
           <Checkbox
            checked={ackUnscheduled}
            onCheckedChange={setAckUnscheduled}
            aria-label="知道仍欠補"
           />
           <span>知道仍欠補，請假跟舊班</span>
          </label>
         </div>
        ) : null}
       </div>
      ) : null}

      {toClassId ? (
       <>
        <Field label="開始報讀">
         <ChoiceChips
          options={["next", "schedule"] as const}
          value={startMode}
          onChange={(mode) => {
           setStartMode(mode)
           if (mode === "schedule" && !startScheduleId && nextSchedule) {
            setStartScheduleId(nextSchedule.id)
           }
          }}
          label={(mode) => (mode === "next" ? "下一堂" : "指定排程開始")}
         />
        </Field>
        {startMode === "next" ? (
         <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-muted-foreground">
          {schedulesLoading
           ? "載入排程中…"
           : nextSchedule
             ? <>將由 <strong className="text-foreground">{formatClassScheduleLabel(nextSchedule)}</strong> 開始計入報讀</>
             : "此班暫無可用的未來排程（已跳過已調堂／未完成的新班補堂）。"}
         </div>
        ) : (
         <Field label="選擇開始排程">
          {schedulesLoading ? (
           <p className="text-muted-foreground">載入排程中…</p>
          ) : startOptions.length === 0 ? (
           <p role="alert" className="text-destructive">
            此班暫無可選排程。
           </p>
          ) : (
           <Select
            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={startScheduleId}
            onChange={(e) => setStartScheduleId(e.target.value)}
           >
            <option value="">請選擇排程…</option>
            {startOptions.map(({ row, kind }) => (
             <option key={row.id} value={row.id} disabled={kind !== "selectable"}>
              {formatClassScheduleLabel(row)}
              {kind === "attended_makeup" ? "　已調堂上堂，不可作報讀第一堂" : ""}
              {kind === "arranged_makeup" ? "　已安排補堂（尚未上），不可作報讀第一堂" : ""}
             </option>
            ))}
           </Select>
          )}
         </Field>
        )}
       </>
      ) : null}

      <Field label="備註（選填）">
       <Textarea
        value={extraReason}
        onChange={(e) => setExtraReason(e.target.value)}
        rows={2}
        className="resize-none"
        placeholder="例如：星期四較適合"
       />
      </Field>

      {error ? (
       <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
        {error}
       </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
       <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
        取消
       </Button>
       <Button type="button" disabled={!canSubmit} loading={saving} loadingText="處理中…" onClick={() => void submit()}>
        確認轉時間
       </Button>
      </div>
     </div>
    ) : null}
   </DialogContent>
  </Dialog>
 )
}
