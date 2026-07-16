import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { useAppBanner } from "@/lib/appBanner"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatScheduleSubstituteTag } from "@/lib/scheduleSubstitute"
import { fetchTeacherOptions, type TeacherOption } from "@/services/classQueries"
import {
 assignScheduleSubstitute,
 clearScheduleSubstitute,
 type TeacherScheduleConflict,
} from "@/services/scheduleQueries"

export type AssignSubstituteScheduleSource = {
 id: string
 classLabel?: string
 class_subject?: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 teacher_id: string | null
 teacher_name: string | null
 original_teacher_id: string | null
 original_teacher_name: string | null
 consecutive_group_id: string | null
 is_consecutive_lesson?: boolean
}

type AssignSubstituteDialogProps = {
 open: boolean
 schedule: AssignSubstituteScheduleSource | null
 onClose: () => void
 onDone: () => void | Promise<void>
}

export function AssignSubstituteDialog({
 open,
 schedule,
 onClose,
 onDone,
}: AssignSubstituteDialogProps) {
 const { pushBanner } = useAppBanner()
 const [teachers, setTeachers] = useState<TeacherOption[]>([])
 const [selectedId, setSelectedId] = useState("")
 const [loadingTeachers, setLoadingTeachers] = useState(false)
 const [saving, setSaving] = useState(false)
 const [clearing, setClearing] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [conflicts, setConflicts] = useState<TeacherScheduleConflict[]>([])

 const isSubstituted = Boolean(schedule?.original_teacher_id)
 const label = schedule?.classLabel ?? schedule?.class_subject ?? "排程"
 const isConsecutive =
  Boolean(schedule?.is_consecutive_lesson) || Boolean(schedule?.consecutive_group_id)

 useEffect(() => {
  if (!open) return
  setErr(null)
  setConflicts([])
  setSelectedId(schedule?.teacher_id && isSubstituted ? schedule.teacher_id : "")
  setLoadingTeachers(true)
  void fetchTeacherOptions()
   .then(setTeachers)
   .catch((e) => reportUserFacingError(e, { source: "AssignSubstituteDialog.teachers", setErr }))
   .finally(() => setLoadingTeachers(false))
 }, [open, schedule, isSubstituted])

 const excludeTeacherIds = useMemo(() => {
  const ids = new Set<string>()
  const original = schedule?.original_teacher_id ?? schedule?.teacher_id
  if (original) ids.add(original)
  return ids
 }, [schedule])

 const options = useMemo(
  () => teachers.filter((t) => !excludeTeacherIds.has(t.id) || t.id === selectedId),
  [teachers, excludeTeacherIds, selectedId]
 )

 const currentTag = schedule
  ? formatScheduleSubstituteTag({
     teacher_id: schedule.teacher_id,
     teacher_name: schedule.teacher_name,
     original_teacher_id: schedule.original_teacher_id,
     original_teacher_name: schedule.original_teacher_name,
    })
  : null

 const submitAssign = async () => {
  if (!schedule || !selectedId) {
   setErr("請選擇代堂老師")
   return
  }
  setSaving(true)
  setErr(null)
  try {
   const result = await assignScheduleSubstitute(schedule.id, selectedId)
   setConflicts(result.conflicts)
   const conflictNote =
    result.conflicts.length > 0
     ? `（代堂老師該時段另有 ${result.conflicts.length} 筆排程，已仍完成指派）`
     : ""
   pushBanner({
    tone: result.conflicts.length > 0 ? "warning" : "success",
    title: "已指派代堂",
    message: `${label}${isConsecutive ? "（連堂一併）" : ""}${conflictNote}`,
   })
   await onDone()
   if (result.conflicts.length === 0) onClose()
  } catch (e) {
   reportUserFacingError(e, { source: "AssignSubstituteDialog.assign", setErr })
  } finally {
   setSaving(false)
  }
 }

 const submitClear = async () => {
  if (!schedule) return
  setClearing(true)
  setErr(null)
  try {
   await clearScheduleSubstitute(schedule.id)
   pushBanner({
    tone: "success",
    title: "已取消代堂",
    message: `${label}${isConsecutive ? "（連堂一併）" : ""}已還原給原任老師`,
   })
   await onDone()
   onClose()
  } catch (e) {
   reportUserFacingError(e, { source: "AssignSubstituteDialog.clear", setErr })
  } finally {
   setClearing(false)
  }
 }

 return (
  <Dialog
   open={open}
   onOpenChange={(o) => {
    if (!o) onClose()
   }}
  >
   <DialogContent className="max-w-md text-sm">
    <DialogHeader>
     <DialogTitle className="text-lg font-semibold">
      {isSubstituted ? "更改／取消代堂" : "指派代堂老師"}
     </DialogTitle>
    </DialogHeader>
    {schedule ? (
     <div className="space-y-4">
      <div>
       <p className="font-medium">{label}</p>
       <p className="mt-1 text-muted-foreground">
        {schedule.scheduled_date}{" "}
        {schedule.start_time && schedule.end_time
         ? `${schedule.start_time}–${schedule.end_time}`
         : ""}
       </p>
       {isConsecutive ? (
        <p className="mt-1 text-xs text-warning">連堂將一併指派／取消代堂。</p>
       ) : null}
       {currentTag ? (
        <p className="mt-2 text-sm text-warning">{currentTag}</p>
       ) : (
        <p className="mt-2 text-sm text-muted-foreground">
         現任老師：{schedule.teacher_name ?? "—"}
        </p>
       )}
      </div>

      {err ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
       >
        {err}
       </div>
      ) : null}

      {conflicts.length > 0 ? (
       <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
        <p className="font-medium text-warning">代堂老師時段衝突（仍已指派）</p>
        <ul className="mt-1 list-inside list-disc text-muted-foreground">
         {conflicts.slice(0, 5).map((c) => (
          <li key={c.id}>
           {c.startTime ?? "—"}–{c.endTime ?? "—"} {c.classLabel}
          </li>
         ))}
         {conflicts.length > 5 ? <li>…另有 {conflicts.length - 5} 筆</li> : null}
        </ul>
       </div>
      ) : null}

      <div>
       <label className="text-xs text-muted-foreground">代堂老師</label>
       <Select
        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={selectedId}
        disabled={loadingTeachers || saving || clearing}
        onChange={(e) => setSelectedId(e.target.value)}
       >
        <option value="">{loadingTeachers ? "載入中…" : "請選擇老師"}</option>
        {options.map((t) => (
         <option key={t.id} value={t.id}>
          {t.label}
         </option>
        ))}
       </Select>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
       <Button type="button" variant="outline" disabled={saving || clearing} onClick={onClose}>
        關閉
       </Button>
       {isSubstituted ? (
        <Button
         type="button"
         variant="outline"
         disabled={saving || clearing}
         onClick={() => void submitClear()}
        >
         {clearing ? "取消中…" : "取消代堂"}
        </Button>
       ) : null}
       <Button
        type="button"
        disabled={saving || clearing || !selectedId}
        onClick={() => void submitAssign()}
       >
        {saving ? "儲存中…" : isSubstituted ? "更改代堂老師" : "確認指派"}
       </Button>
      </div>
     </div>
    ) : null}
   </DialogContent>
  </Dialog>
 )
}
