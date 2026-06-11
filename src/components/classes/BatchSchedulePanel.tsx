import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { formatScheduleDateShort } from "@/lib/weekdayUtils"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import {
 buildBatchScheduleCandidates,
 checkRoomConflictsForDates,
 executeBatchSchedules,
 type BatchScheduleCandidate,
} from "@/services/batchScheduleHelpers"
import { updateClass, type ClassRecord } from "@/services/classQueries"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import { fetchAcademicYearsWithDates, type AcademicYearRange } from "@/services/teacherAvailabilityQueries"

type Props = {
 classId: string
 cls: ClassRecord
 onComplete?: (result: { createdCount: number; skippedCount: number }) => void
 compact?: boolean
}

export function BatchSchedulePanel({ classId, cls, onComplete, compact }: Props) {
 const [year, setYear] = useState<AcademicYearRange | null>(null)
 const [candidates, setCandidates] = useState<BatchScheduleCandidate[]>([])
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [classroomId, setClassroomId] = useState(cls.classroom_id ?? "")
 const [loading, setLoading] = useState(true)
 const [submitting, setSubmitting] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [successMsg, setSuccessMsg] = useState<string | null>(null)

 const load = useCallback(async (opts?: { quiet?: boolean }) => {
  if (!opts?.quiet) {
   setLoading(true)
   setErr(null)
  }
  try {
   const [years, rm] = await Promise.all([fetchAcademicYearsWithDates(), fetchClassrooms()])
   setRooms(rm.filter((r) => !r.is_online))
   const yr =
    years.find((y) => y.id === cls.academic_year_id) ??
    years.find((y) => y.label === cls.academic_year_label) ??
    years.find((y) => y.is_current) ??
    years[0] ??
    null
   setYear(yr)
   if (!yr) {
    setCandidates([])
    return
   }
   const cands = await buildBatchScheduleCandidates({
    cls,
    year: yr,
    teacherId: cls.teacher_id,
   })
   setCandidates(cands)
  } catch (e) {
   reportUserFacingError(e, { source: "BatchSchedulePanel.load", setErr })
  } finally {
   if (!opts?.quiet) setLoading(false)
  }
 }, [cls])

 useEffect(() => {
  void load()
 }, [load])

 useEffect(() => {
  setClassroomId(cls.classroom_id ?? "")
 }, [cls.classroom_id])

 const checkedDates = useMemo(
  () => candidates.filter((c) => c.checked).map((c) => c.date),
  [candidates]
 )

 const checkedDatesKey = useMemo(() => checkedDates.slice().sort().join(","), [checkedDates])

 const refreshRoomConflicts = useCallback(async () => {
  if (!cls.time_slot || !checkedDatesKey || !classroomId) return
  const dates = checkedDatesKey.split(",")
  const conflicts = await checkRoomConflictsForDates({
   dates,
   timeSlot: cls.time_slot,
   classroomId,
  })
  setCandidates((prev) => {
   const next = prev.map((c) => ({
    ...c,
    roomConflict: conflicts.has(c.date),
   }))
   if (next.every((c, i) => c.roomConflict === prev[i]!.roomConflict)) return prev
   return next
  })
 }, [checkedDatesKey, classroomId, cls.time_slot])

 useEffect(() => {
  void refreshRoomConflicts()
 }, [refreshRoomConflicts])

 const toggleDate = (date: string) => {
  setSuccessMsg(null)
  setCandidates((prev) =>
   prev.map((c) => (c.date === date ? { ...c, checked: !c.checked } : c))
  )
 }

 const onSubmit = async () => {
  if (!year) return
  setSubmitting(true)
  setErr(null)
  setSuccessMsg(null)
  try {
   if (classroomId && classroomId !== cls.classroom_id) {
    await updateClass(classId, { classroom_id: classroomId })
   }
   const toCreate = candidates.filter((c) => c.checked && !c.roomConflict).map((c) => c.date)
   if (toCreate.length === 0) {
    setErr("請至少勾選一個可排程且課室無衝突的日期")
    return
   }
   const result = await executeBatchSchedules({
    classId,
    cls: { ...cls, classroom_id: classroomId || null },
    year,
    dates: toCreate,
    classroomId: classroomId || null,
    markAvailability: true,
   })
   if (result.createdDates.length > 0) {
    setSuccessMsg(`已成功新增 ${result.createdDates.length} 筆排程`)
    onComplete?.({
     createdCount: result.createdDates.length,
     skippedCount: result.skippedDates.length,
    })
   }
   if (result.skippedDates.length > 0) {
    setErr(
     `已建立 ${result.createdDates.length} 筆；略過 ${result.skippedDates.length} 筆（${result.skippedDates
      .slice(0, 3)
      .map((s) => `${formatScheduleDateShort(s.date)}:${s.reason}`)
      .join("；")}${result.skippedDates.length > 3 ? "…" : ""}）`
    )
   }
   await load({ quiet: true })
  } catch (e) {
   reportUserFacingError(e, { source: "BatchSchedulePanel.submit", setErr, userMessage: "批量排程失敗" })
  } finally {
   setSubmitting(false)
  }
 }

 if (loading) {
  return <p className="text-sm text-muted-foreground">載入排程候選日期…</p>
 }

 if (!year) {
  return <p className="text-sm text-muted-foreground">找不到學年資料，無法批量排程。</p>
 }

 return (
  <div className={cn("space-y-4", compact ? "" : "rounded-xl border border-border bg-card p-4")}>
   <div>
    <h3 className="text-sm font-semibold">快速批量排程</h3>
    <p className="mt-1 text-xs text-muted-foreground">
     預設勾選老師有檔期的日期；其餘日期仍可手動勾選以建立排程。提交後才標記檔期為已分配。
    </p>
   </div>
   <div>
    <label className="text-xs text-muted-foreground">課室（預填至各排程，之後可逐筆修改）</label>
    <Select
     className="mt-1 flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-2 text-sm"
     value={classroomId}
     onChange={(e) => setClassroomId(e.target.value)}
    >
     <option value="">不指定課室</option>
     {rooms.map((r) => (
      <option key={r.id} value={r.id}>
       {r.name}
      </option>
     ))}
    </Select>
   </div>
   {candidates.length === 0 ? (
    <p className="text-sm text-muted-foreground">
     此班別的逢星期或學年日期區間內沒有符合的候選日。
    </p>
   ) : (
    <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
     {candidates.map((c) => (
      <li key={c.date} className="flex flex-wrap items-center gap-2 text-sm">
       <label className="flex cursor-pointer items-center gap-2">
        <input
         type="checkbox"
         checked={c.checked}
         onChange={() => toggleDate(c.date)}
         className="rounded border-border"
        />
        <span className="tabular-nums">{c.date}</span>
        <span className="text-muted-foreground">（{formatScheduleDateShort(c.date)}）</span>
       </label>
       {!c.hasAvailability ? null : (
        <Tag tone="success" size="sm">
         有檔期
        </Tag>
       )}
       {c.roomConflict ? (
        <span className="text-xs text-destructive">課室衝突</span>
       ) : null}
      </li>
     ))}
    </ul>
   )}
   {successMsg ? (
    <div
     role="status"
     className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
    >
     {successMsg}
    </div>
   ) : null}
   {err ? (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}
   <div className="flex flex-wrap gap-2">
    <Button
     type="button"
     disabled={submitting || candidates.length === 0 || checkedDates.length === 0}
     onClick={() => void onSubmit()}
    >
     {submitting ? "建立中…" : `建立 ${checkedDates.length} 筆排程`}
    </Button>
   </div>
  </div>
 )
}
