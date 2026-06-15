import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CheckCircle2, ClipboardCheck, Download, ListChecks, Sparkles } from "lucide-react"

import { StudentWhatsAppReminderButton } from "@/components/reminders/StudentWhatsAppReminderButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import {
 academicYearEditBlockedMessage,
 canEditAcademicYearForDate,
} from "@/lib/academicYearEditGuard"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import {
 ATTENDANCE_STATUS_OPTIONS,
 buildPrefillStatusMap,
 fetchExistingAttendanceMap,
 fetchLeaveStudentIdsForLesson,
 fetchMakeupStudentIdsForSchedules,
 fetchRosterForRollCall,
 fetchSchedulesForRollCallDate,
 fetchTrialStudentsForSchedules,
 localYmd,
 saveAttendanceStatusForSchedules,
 type RollCallStudentRow,
} from "@/services/attendanceQueries"
import {
 buildRollCallScheduleEntries,
 formatConsecutiveSessionLabel,
} from "@/lib/consecutiveLesson"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"
import { supabase } from "@/lib/supabaseClient"

type DisplayStudent = RollCallStudentRow & { source: "enrollment" | "trial" }

function parseYmd(raw: string | null): string | null {
 const v = raw?.slice(0, 10) ?? ""
 return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

export function RollCallPage() {
 const { pushBanner } = useAppBanner()
 const [searchParams] = useSearchParams()
 const urlScheduleId = searchParams.get("schedule_id")?.trim() || null
 const urlDate = parseYmd(searchParams.get("date"))
 const teacherTid = getTeacherScopeTeacherId()
 const [dateYmd, setDateYmd] = useState(() => urlDate ?? localYmd())
 const [schedules, setSchedules] = useState<ScheduleManageRow[]>([])
 const [pendingMakeup, setPendingMakeup] = useState(0)
 const [loadingList, setLoadingList] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [activeRollCallKey, setActiveRollCallKey] = useState<string | null>(null)
 const rollCallEntries = useMemo(
  () =>
   buildRollCallScheduleEntries(
    schedules.map((s) => ({
     id: s.id,
     scheduled_date: s.scheduled_date,
     start_time: s.start_time,
     end_time: s.end_time,
     class_id: s.class_id,
     classLabel: s.classLabel,
     course_code_full: s.course_code_full,
     teacher_name: s.teacher_name,
     session_number: s.session_number ?? null,
     consecutive_group_id: s.consecutive_group_id ?? null,
     consecutive_slot_index: s.consecutive_slot_index ?? null,
    }))
   ),
  [schedules]
 )
 const activeEntry = useMemo(
  () => rollCallEntries.find((e) => e.key === activeRollCallKey) ?? null,
  [rollCallEntries, activeRollCallKey]
 )
 const activeScheduleMeta = useMemo(() => {
  if (!activeEntry) return null
  const firstId = activeEntry.scheduleIds[0]
  return schedules.find((s) => s.id === firstId) ?? null
 }, [activeEntry, schedules])

 const [students, setStudents] = useState<DisplayStudent[]>([])
 /** 畫面上選取的狀態（未按「確定」前不寫入資料庫） */
 const [statusMap, setStatusMap] = useState<Map<string, string>>(new Map())
 /** 上次成功「確定」或載入時的已儲存狀態 */
 const [savedMap, setSavedMap] = useState<Map<string, string>>(new Map())
 const [sheetLoading, setSheetLoading] = useState(false)
 const [bulkAction, setBulkAction] = useState<null | "prefill" | "allPresent">(null)
 const [confirmSaving, setConfirmSaving] = useState(false)
 const dateEditable = useMemo(() => canEditAcademicYearForDate(dateYmd), [dateYmd])
 const [sheetErr, setSheetErr] = useState<string | null>(null)

 const reloadList = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoadingList(true)
  setErr(null)
  try {
   const list = await fetchSchedulesForRollCallDate(dateYmd)
   setSchedules(list)
   if (supabase) {
    const { count, error } = await supabase
     .from("leave_makeup_records")
     .select("id", { count: "exact", head: true })
     .ilike("status", "%待補%")
    if (!error) setPendingMakeup(count ?? 0)
   }
   const entries = buildRollCallScheduleEntries(
    list.map((s) => ({
     id: s.id,
     scheduled_date: s.scheduled_date,
     start_time: s.start_time,
     end_time: s.end_time,
     class_id: s.class_id,
     classLabel: s.classLabel,
     course_code_full: s.course_code_full,
     teacher_name: s.teacher_name,
     session_number: s.session_number ?? null,
     consecutive_group_id: s.consecutive_group_id ?? null,
     consecutive_slot_index: s.consecutive_slot_index ?? null,
    }))
   )
   setActiveRollCallKey((prev) => {
    if (urlScheduleId) {
     const entry = entries.find((e) => e.scheduleIds.includes(urlScheduleId))
     if (entry) return entry.key
    }
    if (prev && entries.some((e) => e.key === prev)) return prev
    return entries[0]?.key ?? null
   })
  } catch (e) {
   reportUserFacingError(e, { source: "RollCallPage.loadSchedules", setErr })
   setSchedules([])
  } finally {
   setLoadingList(false)
  }
 }, [dateYmd, urlScheduleId])

 useEffect(() => {
  if (urlDate && urlDate !== dateYmd) setDateYmd(urlDate)
 }, [urlDate, dateYmd])

 useEffect(() => {
  void reloadList()
 }, [reloadList])

 useEffect(() => {
  if (!isSupabaseConfigured) return

  if (!activeEntry) {
   setStudents([])
   setStatusMap(new Map())
   setSavedMap(new Map())
   setSheetLoading(false)
   setSheetErr(null)
   return
  }

  if (!activeEntry.class_id) {
   setSheetErr("此排程未綁定班別，無法開啟點名表。")
   setStudents([])
   setStatusMap(new Map())
   setSavedMap(new Map())
   setSheetLoading(false)
   return
  }

  const classId = activeEntry.class_id
  const scheduleIds = activeEntry.scheduleIds
  const lessonDate = activeEntry.scheduled_date

  let cancelled = false
  setSheetLoading(true)
  setSheetErr(null)

  void (async () => {
   try {
    const [roster, trials, existing] = await Promise.all([
     fetchRosterForRollCall(classId, lessonDate),
     fetchTrialStudentsForSchedules(scheduleIds),
     fetchExistingAttendanceMap(classId, lessonDate, scheduleIds),
    ])
    if (cancelled) return

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
     })
    }

    display.sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))

    const sm = new Map<string, string>()
    for (const row of display) {
     const ex = existing.get(row.studentId)
     sm.set(row.studentId, ex?.status ?? "")
    }

    setStudents(display)
    setStatusMap(sm)
    setSavedMap(new Map(sm))
   } catch (e) {
    if (!cancelled) {
     reportUserFacingError(e, { source: "RollCallPage.loadSheet", setErr: setSheetErr })
     setStudents([])
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
 }, [activeEntry])

 const setStatus = (studentId: string, status: string) => {
  if (!activeEntry?.class_id) return
  setStatusMap((prev) => new Map(prev).set(studentId, status))
  setSheetErr(null)
 }

 const applyPrefill = () => {
  if (!activeEntry?.class_id) {
   setSheetErr("無法預填：此排程未綁定班別。")
   return
  }
  if (students.length === 0) return
  const classId = activeEntry.class_id
  const scheduleIds = activeEntry.scheduleIds
  const lessonDate = activeEntry.scheduled_date
  setBulkAction("prefill")
  setSheetErr(null)
  void (async () => {
   try {
    const [leaveIds, makeupIds] = await Promise.all([
     fetchLeaveStudentIdsForLesson(scheduleIds, classId, lessonDate),
     fetchMakeupStudentIdsForSchedules(scheduleIds),
    ])
    const rosterIds = students.filter((s) => s.source === "enrollment").map((s) => s.studentId)
    const trialIds = new Set(students.filter((s) => s.source === "trial").map((s) => s.studentId))
    const pre = buildPrefillStatusMap({ rosterIds, leaveIds, makeupIds, trialIds })
    const next = new Map(statusMap)
    for (const row of students) {
     const s = pre.get(row.studentId) ?? "出席"
     next.set(row.studentId, s)
    }
    setStatusMap(next)
   } catch (e) {
    reportUserFacingError(e, { source: "RollCallPage.saveRow", setErr: setSheetErr })
   } finally {
    setBulkAction(null)
   }
  })()
 }

 const applyAllPresent = () => {
  if (!activeEntry?.class_id) {
   setSheetErr("無法套用：此排程未綁定班別。")
   return
  }
  if (students.length === 0) return
  setBulkAction("allPresent")
  setSheetErr(null)
  try {
   const next = new Map(statusMap)
   for (const row of students) {
    next.set(row.studentId, "出席")
   }
   setStatusMap(next)
  } finally {
   setBulkAction(null)
  }
 }

 const confirmRollCall = async () => {
  if (!activeEntry?.class_id) return
  if (students.length === 0) return
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
   const classId = activeEntry.class_id
   const lessonDate = activeEntry.scheduled_date
   const scheduleIds = activeEntry.scheduleIds
   for (const row of students) {
    const st = statusMap.get(row.studentId) ?? ""
    await saveAttendanceStatusForSchedules(
     row.studentId,
     classId,
     lessonDate,
     scheduleIds,
     st
    )
   }
   void logMgmtAuditAction({
    action: "完成點名",
    detail: `schedule_ids=${scheduleIds.join(",")}; class_id=${classId}; date=${lessonDate}; students=${students.length}`,
   })
   setSavedMap(new Map(statusMap))
   const sessionLabel = formatConsecutiveSessionLabel(activeEntry.sessionNumbers)
   pushBanner({
    tone: "success",
    title: "點名已儲存",
    message: `${activeEntry.classLabel} · ${sessionLabel} · ${lessonDate}：已記錄 ${students.length} 位學生${activeEntry.isConsecutive ? "（連堂計 2 節）" : ""}。`,
   })
  } catch (e) {
   reportUserFacingError(e, { source: "RollCallPage.saveAll", setErr: setSheetErr })
  } finally {
   setConfirmSaving(false)
  }
 }

 const exportCsv = () => {
  if (!activeEntry?.class_id) return
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
  a.download = `rollcall-${activeEntry.scheduled_date}-${activeEntry.class_id.slice(0, 8)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
 }

 /** 已選擇狀態（含未儲存） */
 const draftFilledCount = useMemo(() => {
  let n = 0
  for (const row of students) {
   const s = statusMap.get(row.studentId)
   if (s && s.trim().length > 0) n++
  }
  return n
 }, [students, statusMap])

 /** 已寫入資料庫（上次確定後） */
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

 /** 本堂是否已完成點名（全部學生皆已寫入資料庫） */
 const rollCallSaved = useMemo(
  () => students.length > 0 && savedFilledCount === students.length,
  [students.length, savedFilledCount]
 )

 if (!isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 return (
  <div className="space-y-4">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <ClipboardCheck className="h-7 w-7 text-success" aria-hidden />
      進行點名
      {pendingMakeup > 0 ? (
      <Tag tone="warning" size="sm">{pendingMakeup} 待補課</Tag>
      ) : null}
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      {teacherTid
       ? "專班老師僅見您指派的班別在該日的排程；選擇堂數後開啟點名表。預填會合併班內名單、請假與補堂排程。"
       : "預設顯示當日所有排程；選擇堂數後開啟點名表。預填會合併班內名單、請假與補堂排程。"}
     </p>
    </div>
   </header>

   {teacherTid ? (
   <div className="rounded-lg border border-info bg-info/90 px-3 py-2 text-sm text-info-foreground">
     專班老師檢視：日期與排程清單僅含<strong>您指派的班別</strong>。
   </div>
   ) : null}
   {!dateEditable ? (
    <div
     role="status"
     className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm text-amber-950"
    >
     {academicYearEditBlockedMessage()}
    </div>
   ) : null}

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <section className="grid gap-3 sm:grid-cols-2">
    <div className="rounded-xl border border-success/80 bg-success/50 p-4 shadow-sm">
     <div className="text-sm font-medium text-success">已儲存點名人次</div>
     <p className="mt-2 text-3xl font-bold tabular-nums text-success">{savedFilledCount}</p>
     <p className="mt-1 text-xs text-muted-foreground">目前堂數按「確定」後已寫入資料庫的人數</p>
    </div>
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 shadow-sm">
     <div className="text-sm font-medium text-amber-900">今日堂數</div>
     <p className="mt-2 text-3xl font-bold tabular-nums text-amber-800">{rollCallEntries.length}</p>
     <p className="mt-1 text-xs text-muted-foreground">所選日期可點名項目（連堂已合併；已排除取消）</p>
    </div>
   </section>

   <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>日期</span>
     <Input type="date" value={dateYmd} onChange={(e) => setDateYmd(e.target.value)} className="h-9 w-[11rem]" />
    </label>
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="h-9 border-amber-400/80"
     onClick={() => setDateYmd(localYmd())}
    >
     今天
    </Button>
    <label className="grid min-w-[16rem] flex-1 gap-1 text-xs text-muted-foreground">
     <span>選擇排程</span>
     <Select
      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      value={activeRollCallKey ?? ""}
      onChange={(e) => setActiveRollCallKey(e.target.value || null)}
      disabled={rollCallEntries.length === 0}
     >
      {rollCallEntries.length === 0 ? (
       <option value="">此日無排程</option>
      ) : (
       rollCallEntries.map((entry) => (
        <option key={entry.key} value={entry.key}>
         {entry.scheduled_date}
         {entry.scheduled_date === localYmd() ? "（今天）" : ""} — {entry.classLabel}
         {entry.course_code_full ? ` (${entry.course_code_full})` : ""}{" "}
         {formatConsecutiveSessionLabel(entry.sessionNumbers)} {entry.start_time ?? ""}–{entry.end_time ?? ""} —{" "}
         {entry.teacher_name ?? "—"}
         {entry.isConsecutive ? " · 連堂" : ""}
        </option>
       ))
      )}
     </Select>
    </label>
    <div className="ml-auto flex flex-wrap items-center gap-2">
     {isDirty ? (
     <Tag tone="warning" size="sm">未儲存變更</Tag>
     ) : null}
    <Tag tone="success" size="sm">已選狀態：{draftFilledCount} / {students.length}</Tag>
    </div>
   </div>

   {loadingList ? (
    <p className="text-sm text-muted-foreground">載入排程…</p>
   ) : !activeEntry ? (
    <p className="py-12 text-center text-sm text-muted-foreground">此日期沒有可點名的排程</p>
   ) : (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
     <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <div>
       <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">
         點名表 · {activeEntry.classLabel} · {formatConsecutiveSessionLabel(activeEntry.sessionNumbers)} ·{" "}
         {activeEntry.scheduled_date}
        </h2>
        {rollCallSaved ? (
         <Tag tone="success" size="sm">
          已點名
         </Tag>
        ) : (
         <Tag tone="warning" size="sm">
          未點名
         </Tag>
        )}
       </div>
       <p className="text-xs text-muted-foreground">
        共 {students.length} 位學生（班內報讀 + 試堂）
        {activeEntry.start_time && activeEntry.end_time
         ? ` · ${activeEntry.start_time}–${activeEntry.end_time}`
         : ""}
        {activeScheduleMeta?.classroom_name ? ` · ${activeScheduleMeta.classroom_name}` : ""}
        {activeEntry.isConsecutive ? " · 連堂一次點名，計 2 節學費" : ""}
        <span className="mt-1 block text-amber-900/90">
         {rollCallSaved
          ? "本堂已完成點名；若要修改出席狀態，變更後再按「確定」儲存。"
          : "請先點選出席狀態，再於下方按「確定」寫入資料庫。"}
        </span>
       </p>
      </div>
      <div className="flex flex-wrap gap-2">
       <Button
        type="button"
        size="sm"
        variant="secondary"
       className="gap-1 bg-info text-info-foreground hover:bg-info"
        disabled={sheetLoading || bulkAction !== null || students.length === 0 || !dateEditable}
        onClick={() => applyPrefill()}
       >
        <Sparkles className="h-4 w-4" />
        {bulkAction === "prefill" ? "預填中…" : "預填狀態"}
       </Button>
       <Button
        type="button"
        size="sm"
        className="gap-1 bg-success text-white hover:bg-success"
        disabled={sheetLoading || bulkAction !== null || students.length === 0 || !dateEditable}
        onClick={() => applyAllPresent()}
       >
        <ListChecks className="h-4 w-4" />
        {bulkAction === "allPresent" ? "套用中…" : "全部出席"}
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
            </div>
            {row.englishName ? (
             <div className="text-xs text-muted-foreground">({row.englishName})</div>
            ) : null}
           </td>
           <td className="px-2 py-2 text-muted-foreground">{row.grade ?? "—"}</td>
           <td className="px-2 py-2">
            <div className="flex flex-wrap gap-1">
             {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
              <button
               key={opt}
               type="button"
               disabled={!dateEditable}
               onClick={() => setStatus(row.studentId, opt)}
               className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                statusMap.get(row.studentId) === opt
                 ? "border-success bg-success text-white"
                 : "border-border bg-background text-muted-foreground hover:bg-muted/60"
               )}
              >
               {opt}
              </button>
             ))}
            </div>
           </td>
           <td className="px-2 py-2">
            {activeScheduleMeta ? (
             <StudentWhatsAppReminderButton
              compact
              contactPhone={row.contactPhone}
              payload={{
               studentName: row.fullName,
               subject: activeScheduleMeta.subject,
               courseCode: activeScheduleMeta.course_code_full,
               dateYmd: activeEntry.scheduled_date,
               startTime: activeEntry.start_time,
               endTime: activeEntry.end_time,
               classroomName: activeScheduleMeta.classroom_name,
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
      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
       <p className="text-sm text-muted-foreground">
        {isDirty ? (
         <span className="font-medium text-amber-800">目前變更尚未儲存，請確認無誤後按「確定」。</span>
        ) : (
         <span>與上次儲存內容一致；若要修改請變更狀態後再按「確定」。</span>
        )}
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
         !dateEditable
        }
        onClick={() => void confirmRollCall()}
       >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        {confirmSaving ? "儲存中…" : "確定"}
       </Button>
      </div>
     ) : null}
    </div>
   )}
  </div>
 )
}
