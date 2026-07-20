import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, ChevronDown, Download, ListChecks, NotebookPen, Sparkles } from "lucide-react"

import { AttendanceStatusPicker } from "@/components/attendance/attendanceStatusUi"
import { StudentWhatsAppReminderButton } from "@/components/reminders/StudentWhatsAppReminderButton"
import { TeachingNotesEditor } from "@/components/schedule/TeachingNotesEditor"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import {
 academicYearEditBlockedMessage,
} from "@/lib/academicYearEditGuard"
import { ATTENDANCE_BILLING_HELP_SHORT } from "@/lib/attendanceBilling"
import {
 formatConsecutiveSessionLabel,
 trimTimeHm,
 type RollCallScheduleEntry,
} from "@/lib/consecutiveLesson"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 canTeacherEditScheduleRollCall,
 formatScheduleSubstituteTag,
} from "@/lib/scheduleSubstitute"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
 buildPrefillStatusMap,
 fetchExistingAttendanceMap,
 fetchLeavePrefillForLesson,
 fetchMakeupStudentIdsForSchedules,
 fetchMakeupStudentsForSchedules,
 fetchRosterForRollCall,
 fetchSingleSessionNotOnSchedule,
 fetchTrialStudentsForSchedules,
 saveAttendanceStatusForSchedules,
 type RollCallStudentRow,
} from "@/services/attendanceQueries"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

type DisplayStudent = RollCallStudentRow & { source: "enrollment" | "trial" | "makeup" }

export type RollCallPanelStats = {
 key: string
 loaded: boolean
 savedFilled: number
 studentCount: number
 rollCallSaved: boolean
 isDirty: boolean
}

type Props = {
 entry: RollCallScheduleEntry
 scheduleMeta: ScheduleManageRow | null
 open: boolean
 onOpenChange: (open: boolean) => void
 dateEditable: boolean
 teacherTid: string | null
 isMobile: boolean
 onStats: (stats: RollCallPanelStats) => void
 /** accordion＝獨立點名頁；sheet＝排程滑出點名紙 */
 presentation?: "accordion" | "sheet"
 /** 尚無已存點名時，載入後自動依請假預填（老師仍可改） */
 autoPrefillWhenEmpty?: boolean
 /** 成功寫入資料庫後回呼（排程點名紙用來刷新列表） */
 onConfirmed?: () => void
}

export function RollCallClassPanel({
 entry,
 scheduleMeta,
 open,
 onOpenChange,
 dateEditable,
 teacherTid,
 isMobile,
 onStats,
 presentation = "accordion",
 autoPrefillWhenEmpty = false,
 onConfirmed,
}: Props) {
 const isSheet = presentation === "sheet"
 const { pushBanner } = useAppBanner()
 const canEditRollCall =
  dateEditable &&
  canTeacherEditScheduleRollCall({ teacher_id: scheduleMeta?.teacher_id ?? null }, teacherTid)
 const substituteTag = scheduleMeta
  ? formatScheduleSubstituteTag(scheduleMeta, teacherTid)
  : null
 const reminderTimes = useMemo(
  () => ({
   startTime: trimTimeHm(entry.start_time),
   endTime: trimTimeHm(entry.end_time),
   isConsecutive: entry.isConsecutive,
  }),
  [entry]
 )

 const [students, setStudents] = useState<DisplayStudent[]>([])
 const [notEnrolledNames, setNotEnrolledNames] = useState<string[]>([])
 const [leaveStudentIds, setLeaveStudentIds] = useState<Set<string>>(() => new Set())
 const [statusMap, setStatusMap] = useState<Map<string, string>>(new Map())
 const [savedMap, setSavedMap] = useState<Map<string, string>>(new Map())
 const [sheetLoading, setSheetLoading] = useState(true)
 const [bulkAction, setBulkAction] = useState<null | "prefill" | "allPresent">(null)
 const [confirmSaving, setConfirmSaving] = useState(false)
 const [sheetErr, setSheetErr] = useState<string | null>(null)
 const [notesSavedLocal, setNotesSavedLocal] = useState<string | null | undefined>(undefined)
 const didAutoPrefillRef = useRef(false)

 useEffect(() => {
  didAutoPrefillRef.current = false
  setNotesSavedLocal(undefined)
 }, [entry.key])

 useEffect(() => {
  if (!entry.class_id) {
   setSheetErr("此排程未綁定班別，無法開啟點名表。")
   setStudents([])
   setStatusMap(new Map())
   setSavedMap(new Map())
   setSheetLoading(false)
   return
  }

  const classId = entry.class_id
  const scheduleIds = entry.scheduleIds
  const lessonDate = entry.scheduled_date

  let cancelled = false
  setSheetLoading(true)
  setSheetErr(null)

  void (async () => {
   try {
    const primaryScheduleId = scheduleIds[0] ?? ""
    const [roster, trials, makeups, existing, notOnSchedule, leaveByStudent] = await Promise.all([
     fetchRosterForRollCall(classId, lessonDate, scheduleIds),
     fetchTrialStudentsForSchedules(scheduleIds),
     scheduleIds.length > 0 ? fetchMakeupStudentsForSchedules(scheduleIds) : Promise.resolve([]),
     fetchExistingAttendanceMap(classId, lessonDate, scheduleIds),
     primaryScheduleId
      ? fetchSingleSessionNotOnSchedule(classId, primaryScheduleId)
      : Promise.resolve([]),
     fetchLeavePrefillForLesson(scheduleIds, classId, lessonDate),
    ])
    if (cancelled) return

    setLeaveStudentIds(new Set(leaveByStudent.keys()))
    const enrolledIds = roster.map((r) => r.studentId)
    const display: DisplayStudent[] = roster.map((r) => ({ ...r, source: "enrollment" as const }))
    for (const t of trials) {
     if (enrolledIds.includes(t.studentId)) continue
     display.push({
      enrollmentId: `trial-${t.studentId}`,
      studentId: t.studentId,
      fullName: t.fullName,
      englishName: t.englishName,
      grade: t.grade,
      school: null,
      enrollDate: null,
      status: "試堂",
      source: "trial",
      contactPhone: t.contactPhone,
      isSingleSession: false,
     })
    }
    const onSheetIds = new Set(display.map((d) => d.studentId))
    for (const m of makeups) {
     if (onSheetIds.has(m.studentId)) continue
     onSheetIds.add(m.studentId)
     display.push({
      enrollmentId: `makeup-${m.studentId}`,
      studentId: m.studentId,
      fullName: m.fullName,
      englishName: m.englishName,
      grade: m.grade,
      school: null,
      enrollDate: null,
      status: "補堂",
      source: "makeup",
      contactPhone: m.contactPhone,
      isSingleSession: false,
     })
    }

    display.sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))

    const saved = new Map<string, string>()
    for (const row of display) {
     const ex = existing.get(row.studentId)
     saved.set(row.studentId, ex?.status ?? "")
    }

    let draft = new Map(saved)
    const noneSaved = display.every((row) => !(saved.get(row.studentId) ?? "").trim())
    if (autoPrefillWhenEmpty && noneSaved && display.length > 0 && !didAutoPrefillRef.current) {
     didAutoPrefillRef.current = true
     const rosterIds = display.filter((s) => s.source === "enrollment").map((s) => s.studentId)
     const trialIds = new Set(display.filter((s) => s.source === "trial").map((s) => s.studentId))
     const makeupIds = new Set(display.filter((s) => s.source === "makeup").map((s) => s.studentId))
     const pre = buildPrefillStatusMap({
      rosterIds,
      leaveByStudent,
      makeupIds,
      trialIds,
     })
     draft = new Map()
     for (const row of display) {
      draft.set(row.studentId, pre.get(row.studentId) ?? "現場")
     }
    }

    setStudents(display)
    setNotEnrolledNames(notOnSchedule.map((r) => r.fullName))
    setStatusMap(draft)
    setSavedMap(saved)
   } catch (e) {
    if (!cancelled) {
     reportUserFacingError(e, { source: "RollCallClassPanel.loadSheet", setErr: setSheetErr })
     setStudents([])
     setNotEnrolledNames([])
     setStatusMap(new Map())
     setSavedMap(new Map())
    }
   } finally {
    if (!cancelled) setSheetLoading(false)
   }
  })()

  return () => {
   cancelled = true
  }
 }, [entry, autoPrefillWhenEmpty])

 const draftFilledCount = useMemo(() => {
  let n = 0
  for (const row of students) {
   const s = statusMap.get(row.studentId)
   if (s && s.trim().length > 0) n++
  }
  return n
 }, [students, statusMap])

 const savedFilledCount = useMemo(() => {
  let n = 0
  for (const row of students) {
   const s = savedMap.get(row.studentId)
   if (s && s.trim().length > 0) n++
  }
  return n
 }, [students, savedMap])

 const isDirty = useMemo(() => {
  for (const row of students) {
   const a = statusMap.get(row.studentId) ?? ""
   const b = savedMap.get(row.studentId) ?? ""
   if (a !== b) return true
  }
  return false
 }, [students, statusMap, savedMap])

 const rollCallSaved = useMemo(
  () => students.length > 0 && savedFilledCount === students.length,
  [students.length, savedFilledCount]
 )

 useEffect(() => {
  onStats({
   key: entry.key,
   loaded: !sheetLoading,
   savedFilled: savedFilledCount,
   studentCount: students.length,
   rollCallSaved,
   isDirty,
  })
 }, [
  entry.key,
  sheetLoading,
  savedFilledCount,
  students.length,
  rollCallSaved,
  isDirty,
  onStats,
 ])

 const setStatus = (studentId: string, status: string) => {
  if (!canEditRollCall) return
  if (!entry.class_id) return
  setStatusMap((prev) => new Map(prev).set(studentId, status))
  setSheetErr(null)
 }

 const applyPrefill = () => {
  if (!canEditRollCall) {
   setSheetErr("此堂已指派代堂，僅代堂老師可修改點名。")
   return
  }
  if (!entry.class_id) {
   setSheetErr("無法預填：此排程未綁定班別。")
   return
  }
  if (students.length === 0) return
  const classId = entry.class_id
  const scheduleIds = entry.scheduleIds
  const lessonDate = entry.scheduled_date
  setBulkAction("prefill")
  setSheetErr(null)
  void (async () => {
   try {
    const [leaveByStudent, makeupIds] = await Promise.all([
     fetchLeavePrefillForLesson(scheduleIds, classId, lessonDate),
     fetchMakeupStudentIdsForSchedules(scheduleIds),
    ])
    setLeaveStudentIds(new Set(leaveByStudent.keys()))
    const rosterIds = students.filter((s) => s.source === "enrollment").map((s) => s.studentId)
    const trialIds = new Set(students.filter((s) => s.source === "trial").map((s) => s.studentId))
    const pre = buildPrefillStatusMap({ rosterIds, leaveByStudent, makeupIds, trialIds })
    const next = new Map(statusMap)
    for (const row of students) {
     const s = pre.get(row.studentId) ?? "現場"
     next.set(row.studentId, s)
    }
    setStatusMap(next)
   } catch (e) {
    reportUserFacingError(e, { source: "RollCallClassPanel.prefill", setErr: setSheetErr })
   } finally {
    setBulkAction(null)
   }
  })()
 }

 const applyAllPresent = () => {
  if (!canEditRollCall) {
   setSheetErr("此堂已指派代堂，僅代堂老師可修改點名。")
   return
  }
  if (!entry.class_id) {
   setSheetErr("無法套用：此排程未綁定班別。")
   return
  }
  if (students.length === 0) return
  setBulkAction("allPresent")
  setSheetErr(null)
  try {
   const next = new Map(statusMap)
   for (const row of students) {
    if (leaveStudentIds.has(row.studentId)) continue
    next.set(row.studentId, "現場")
   }
   setStatusMap(next)
  } finally {
   setBulkAction(null)
  }
 }

 const confirmRollCall = async () => {
  if (!entry.class_id) return
  if (students.length === 0) return
  if (!canEditRollCall) {
   pushBanner({
    tone: "warning",
    title: "無法儲存點名",
    message: dateEditable
     ? "此堂已指派代堂，僅代堂老師可完成點名；您可閱覽現有紀錄。"
     : academicYearEditBlockedMessage(),
   })
   return
  }
  if (!dateEditable) {
   pushBanner({ tone: "warning", title: "無法儲存點名", message: academicYearEditBlockedMessage() })
   return
  }
  for (const row of students) {
   const s = (statusMap.get(row.studentId) ?? "").trim()
   if (!s) {
    setSheetErr("請為每位學生選擇出席狀態後，再按「確定」完成點名。")
    return
   }
  }
  setConfirmSaving(true)
  setSheetErr(null)
  try {
   const classId = entry.class_id
   const lessonDate = entry.scheduled_date
   const scheduleIds = entry.scheduleIds
   for (const row of students) {
    const st = statusMap.get(row.studentId) ?? ""
    await saveAttendanceStatusForSchedules(row.studentId, classId, lessonDate, scheduleIds, st)
   }
   void logMgmtAuditAction({
    action: "完成點名",
    detail: `schedule_ids=${scheduleIds.join(",")}; class_id=${classId}; date=${lessonDate}; students=${students.length}`,
   })
   setSavedMap(new Map(statusMap))
   const sessionLabel = formatConsecutiveSessionLabel(entry.sessionNumbers)
   pushBanner({
    tone: "success",
    title: "點名已儲存",
    message: `${entry.classLabel} · ${sessionLabel} · ${lessonDate}：已記錄 ${students.length} 位學生${entry.isConsecutive ? "（連堂計 2 節）" : ""}。`,
   })
   onConfirmed?.()
  } catch (e) {
   reportUserFacingError(e, { source: "RollCallClassPanel.saveAll", setErr: setSheetErr })
  } finally {
   setConfirmSaving(false)
  }
 }

 const exportCsv = () => {
  if (!entry.class_id) return
  const lines = [
   ["學生", "英文名", "年級", "狀態"].join(","),
   ...students.map((row) =>
    [
     `"${row.fullName.replace(/"/g, '""')}"`,
     `"${(row.englishName ?? "").replace(/"/g, '""')}"`,
     row.grade ?? "",
     statusMap.get(row.studentId) ?? "",
    ].join(",")
   ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `rollcall-${entry.scheduled_date}-${entry.class_id.slice(0, 8)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
 }

 const sessionLabel = formatConsecutiveSessionLabel(entry.sessionNumbers)
 const timeLabel =
  entry.start_time && entry.end_time ? `${entry.start_time}–${entry.end_time}` : null

 const titleMeta = (
  <>
   <div className="flex flex-wrap items-center gap-2">
    <span className="font-semibold text-foreground">
     {entry.classLabel}
     {entry.course_code_full ? (
      <span className="ml-1 font-normal text-muted-foreground">({entry.course_code_full})</span>
     ) : null}
    </span>
    <Tag tone="default" size="sm">
     {sessionLabel}
    </Tag>
    {sheetLoading ? (
     <Tag tone="default" size="sm">
      載入中…
     </Tag>
    ) : rollCallSaved ? (
     <Tag tone="success" size="sm">
      已點名
     </Tag>
    ) : (
     <Tag tone="warning" size="sm">
      未點名
     </Tag>
    )}
    {isDirty ? (
     <Tag tone="warning" size="sm">
      未儲存變更
     </Tag>
    ) : null}
    {substituteTag ? (
     <Tag tone="info" size="sm">
      {substituteTag}
     </Tag>
    ) : null}
    {entry.isConsecutive ? (
     <Tag tone="info" size="sm">
      連堂
     </Tag>
    ) : null}
   </div>
   <p className="mt-0.5 text-xs text-muted-foreground">
    {[
     timeLabel,
     entry.teacher_name ?? null,
     scheduleMeta?.classroom_name ?? null,
     !sheetLoading ? `${draftFilledCount}/${students.length} 已選` : null,
    ]
     .filter(Boolean)
     .join(" · ")}
   </p>
  </>
 )

 const body = (
   <div
    className={cn(
     "space-y-3",
     isSheet ? "px-1 pb-2 pt-1" : "border-t border-border px-4 pb-4 pt-3",
     isMobile && students.length > 0 && "pb-4"
    )}
   >
    <div className="flex flex-wrap items-start justify-between gap-2">
     <div className="min-w-0">
      <p className="text-xs text-muted-foreground">
       共 {students.length} 位學生（班內報讀 + 試堂）
       {entry.isConsecutive ? " · 連堂一次點名，計 2 堂（扣 2 堂）" : ""}
       <span className="mt-1 block text-muted-foreground/90">{ATTENDANCE_BILLING_HELP_SHORT}</span>
       <span className="mt-1 block text-amber-900/90">
        {!canEditRollCall && dateEditable
         ? "此堂已指派代堂，僅代堂老師可修改點名；您可閱覽現有紀錄。"
         : rollCallSaved
           ? "本堂已完成點名；若要修改狀態，變更後再按「確定」儲存。"
           : autoPrefillWhenEmpty
             ? "已依請假／預設帶入狀態，可直接改選後按「確定」寫入。有請假單者按「全部現場」不會覆蓋。"
             : "請先點選狀態，再於下方按「確定」寫入資料庫。有請假單者按「全部現場」不會覆蓋。"}
       </span>
      </p>
      {notEnrolledNames.length > 0 ? (
       <p className="mt-2 rounded-md border border-info/30 bg-info/5 px-3 py-2 text-sm text-foreground">
        {notEnrolledNames.map((name) => `${name}沒有報讀此堂`).join("；")}
        <span className="ml-1 text-muted-foreground">（單堂報讀，非請假）</span>
       </p>
      ) : null}
     </div>
     <div className="flex flex-wrap gap-2">
      {!autoPrefillWhenEmpty ? (
       <Button
        type="button"
        size="sm"
        variant="secondary"
        className="gap-1 bg-info text-info-foreground hover:bg-info"
        disabled={sheetLoading || bulkAction !== null || students.length === 0 || !canEditRollCall}
        onClick={() => applyPrefill()}
       >
        <Sparkles className="h-4 w-4" />
        {bulkAction === "prefill" ? "預填中…" : "預填狀態"}
       </Button>
      ) : null}
      <Button
       type="button"
       size="sm"
       className="gap-1 bg-success text-white hover:bg-success"
       disabled={sheetLoading || bulkAction !== null || students.length === 0 || !canEditRollCall}
       onClick={() => applyAllPresent()}
      >
       <ListChecks className="h-4 w-4" />
       {bulkAction === "allPresent" ? "套用中…" : "全部現場"}
      </Button>
      <Button type="button" size="sm" variant="outline" className="gap-1" onClick={exportCsv}>
       <Download className="h-4 w-4" />
       匯出
      </Button>
     </div>
    </div>

    {sheetErr ? (
     <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {sheetErr}
     </div>
    ) : null}

    {sheetLoading ? (
     <p className="text-sm text-muted-foreground">載入名單…</p>
    ) : isMobile ? (
     <div className="space-y-3">
      {students.map((row, idx) => (
       <article key={row.studentId} className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
         <div className="min-w-0">
          <p className="text-xs text-muted-foreground">#{idx + 1}</p>
          <div className="font-medium">
           {row.fullName}
           {row.source === "trial" ? (
            <Tag tone="info" size="sm" className="ml-2 align-middle">
             試堂
            </Tag>
           ) : null}
           {row.source === "makeup" ? (
            <Tag tone={statusToTagTone("補堂")} size="sm" className="ml-2 align-middle">
             補堂
            </Tag>
           ) : null}
           {row.source === "enrollment" && row.isSingleSession ? (
            <Tag tone={statusToTagTone("單堂報讀")} size="sm" className="ml-2 align-middle">
             單堂報讀
            </Tag>
           ) : null}
          </div>
          {row.englishName ? (
           <div className="text-xs text-muted-foreground">({row.englishName})</div>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">年級：{row.grade ?? "—"}</p>
         </div>
         {scheduleMeta ? (
          <StudentWhatsAppReminderButton
           compact
           contactPhone={row.contactPhone}
           payload={{
            studentName: row.fullName,
            subject: scheduleMeta.subject,
            courseCode: scheduleMeta.course_code_full,
            dateYmd: entry.scheduled_date,
            startTime: reminderTimes.startTime,
            endTime: reminderTimes.endTime,
            isConsecutive: reminderTimes.isConsecutive,
            classroomName: scheduleMeta.classroom_name,
            attendanceStatus: statusMap.get(row.studentId) || null,
            isTrial: row.source === "trial",
           }}
          />
         ) : null}
        </div>
        <div className="mt-3">
         <AttendanceStatusPicker
          value={statusMap.get(row.studentId)}
          disabled={!canEditRollCall}
          onSelect={(opt) => setStatus(row.studentId, opt)}
         />
        </div>
       </article>
      ))}
     </div>
    ) : (
     <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
       <thead>
        <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
         <th className="w-[6%] px-2 py-2 font-medium">#</th>
         <th className="w-[30%] px-2 py-2 font-medium">學生</th>
         <th className="w-[12%] px-2 py-2 font-medium">年級</th>
         <th className="w-[32%] px-2 py-2 font-medium">狀態</th>
         <th className="w-[20%] px-2 py-2 font-medium">通知</th>
        </tr>
       </thead>
       <tbody>
        {students.map((row, idx) => (
         <tr key={row.studentId} className="border-b border-border last:border-0">
          <td className="px-2 py-2 tabular-nums text-muted-foreground">{idx + 1}</td>
          <td className="px-2 py-2">
           <div className="font-medium">
            {row.fullName}
            {row.source === "trial" ? (
             <span className="ml-2 rounded bg-info px-1.5 py-0.5 text-[10px] font-medium text-info-foreground">
              試堂
             </span>
            ) : null}
            {row.source === "makeup" ? (
             <Tag tone={statusToTagTone("補堂")} size="sm" className="ml-2 align-middle">
              補堂
             </Tag>
            ) : null}
            {row.source === "enrollment" && row.isSingleSession ? (
             <Tag tone={statusToTagTone("單堂報讀")} size="sm" className="ml-2 align-middle">
              單堂報讀
             </Tag>
            ) : null}
           </div>
           {row.englishName ? (
            <div className="text-xs text-muted-foreground">({row.englishName})</div>
           ) : null}
          </td>
          <td className="px-2 py-2 text-muted-foreground">{row.grade ?? "—"}</td>
          <td className="px-2 py-2">
           <AttendanceStatusPicker
            compact
            value={statusMap.get(row.studentId)}
            disabled={!canEditRollCall}
            onSelect={(opt) => setStatus(row.studentId, opt)}
           />
          </td>
          <td className="px-2 py-2">
           {scheduleMeta ? (
            <StudentWhatsAppReminderButton
             compact
             contactPhone={row.contactPhone}
             payload={{
              studentName: row.fullName,
              subject: scheduleMeta.subject,
              courseCode: scheduleMeta.course_code_full,
              dateYmd: entry.scheduled_date,
              startTime: reminderTimes.startTime,
              endTime: reminderTimes.endTime,
              isConsecutive: reminderTimes.isConsecutive,
              classroomName: scheduleMeta.classroom_name,
              attendanceStatus: statusMap.get(row.studentId) || null,
              isTrial: row.source === "trial",
             }}
            />
           ) : null}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    )}

    {!sheetLoading && students.length > 0 ? (
     <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
       {isDirty ? (
        <span className="font-medium text-amber-800">目前變更尚未儲存，請確認無誤後按「確定」。</span>
       ) : (
        <span>與上次儲存內容一致；若要修改請變更狀態後再按「確定」。</span>
       )}
       <span className="ml-1">已選 {draftFilledCount} / {students.length}</span>
      </p>
      <Button
       type="button"
       size="lg"
       className="shrink-0 gap-2 bg-success text-white hover:bg-success disabled:opacity-60"
       disabled={
        confirmSaving ||
        sheetLoading ||
        bulkAction !== null ||
        students.length === 0 ||
        !isDirty ||
        !canEditRollCall
       }
       onClick={() => void confirmRollCall()}
      >
       <CheckCircle2 className="h-5 w-5" aria-hidden />
       {confirmSaving ? "儲存中…" : "確定"}
      </Button>
     </div>
    ) : null}

    {canEditRollCall && scheduleMeta ? (
     <div className="mt-4 space-y-2 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
       <NotebookPen className="h-4 w-4 text-info" aria-hidden />
       本堂教學紀錄
       {(notesSavedLocal !== undefined
        ? Boolean(notesSavedLocal?.trim())
        : Boolean(scheduleMeta.teaching_notes?.trim())) ? (
        <Tag tone="info" size="sm">
         已有紀錄
        </Tag>
       ) : null}
      </div>
      <p className="text-xs text-muted-foreground">選填；與出席狀態分開儲存。</p>
      <TeachingNotesEditor
       scheduleId={scheduleMeta.id}
       initialNotes={
        notesSavedLocal !== undefined ? notesSavedLocal : scheduleMeta.teaching_notes
       }
       classId={scheduleMeta.class_id}
       scheduledDate={scheduleMeta.scheduled_date}
       startTime={scheduleMeta.start_time}
       compact
       errorSource="RollCallClassPanel"
       onSaved={(notes) => setNotesSavedLocal(notes)}
      />
     </div>
    ) : null}
   </div>
 )

 if (isSheet) {
  return (
   <div className="space-y-3">
    <div className="min-w-0 px-1">{titleMeta}</div>
    {body}
   </div>
  )
 }

 return (
  <details
   className="group rounded-xl border border-border bg-card shadow-sm open:shadow-md"
   open={open}
   onToggle={(e) => {
    const next = (e.currentTarget as HTMLDetailsElement).open
    if (next !== open) onOpenChange(next)
   }}
  >
   <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
    <ChevronDown
     className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
     aria-hidden
    />
    <div className="min-w-0 flex-1">{titleMeta}</div>
   </summary>
   {body}
  </details>
 )
}
