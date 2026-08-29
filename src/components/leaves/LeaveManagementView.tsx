import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarDays, Camera, Clock, Plus, Search, SlidersHorizontal, Umbrella, Users, Video } from "lucide-react"

import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { SoftArchiveScopeBanner } from "@/components/softArchive/SoftArchiveScopeBanner"
import { Button } from "@/components/ui/button"
import { SkeletonCardGrid, SkeletonTableRows } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppConfirm, type ConfirmResult } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 deleteLeaveMakeupRecord,
 fetchEnrolledClassesForStudent,
 fetchLeaveMakeupWithRelations,
 fetchLeaveTodayStats,
 fetchMakeupCandidateSchedules,
 validateMakeupScheduleForStudent,
 fetchUpcomingSchedulesForClass,
 insertLeaveMakeupForSchedule,
 LEAVE_MAKEUP_OPTIONS,
 LEAVE_REASON_OPTIONS,
 LEAVE_TUITION_DISPOSITION_OPTIONS,
 STUDENT_LEAVE_REASON_OPTIONS,
 formatLeaveScheduleOptionLabel,
 formatMakeupCandidateLabel,
 isLeaveStatusAbandoned,
 isLeaveStatusDone,
 isLeaveStatusPending,
 leaveNeedsMakeupDate,
 localYmd,
 previewLeaveMakeupAttendanceImpact,
 previewLeaveDispositionAttendanceImpact,
 setLeaveTuitionDisposition,
 updateLeaveMakeupRecord,
 type ClassScheduleOption,
 type ConsecutiveLeaveScope,
 type EnrolledClassOption,
 type LeaveAttendanceChangeOptions,
 type LeaveManageRow,
 type LeaveTodayStats,
 type LeaveTuitionDisposition,
} from "@/services/leaveQueries"
import {
 formatAttendanceHitsDescription,
 hitsHaveBillable,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import { fetchStudentPickerOptions } from "@/services/studentQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

type StatusTab = "all" | "pending" | "done" | "abandoned"

type ConfirmFn = (options: {
 title: string
 description?: string
 confirmText?: string
 cancelText?: string
 alternateText?: string
 tone?: "default" | "warning" | "destructive"
 alternateTone?: "default" | "warning" | "destructive"
 confirmInput?: { label: string; expected: string; placeholder?: string }
}) => Promise<ConfirmResult>

/** O1：有可刪出席時三路 Confirm（預設一併刪；保留需二次確認） */
async function resolveLeaveAttendanceChoice(
 confirmDialog: ConfirmFn,
 hits: AttendanceLifecycleHit[],
 title: string
): Promise<"delete" | "keep" | "abort"> {
 if (hits.length === 0) return "keep"
 const billable = hitsHaveBillable(hits)
 const studentName = hits.find((h) => h.studentName)?.studentName?.trim() ?? ""
 const surname = studentName.slice(0, 1)
 const result = await confirmDialog({
  title,
  description: `${formatAttendanceHitsDescription(hits)}\n\n預設建議一併刪除。保留則點名紙無名但已扣堂數仍可能計入。`,
  confirmText: billable ? "⚠️ 刪除計費出席（影響已扣堂數）" : "一併刪除出席",
  alternateText: "⚠️ 保留出席（將脫離資格，仍計入已扣堂數）",
  cancelText: "取消",
  tone: "destructive",
  alternateTone: "default",
  ...(billable && surname
   ? {
      confirmInput: {
       label: `請輸入學生姓氏「${surname}」以確認刪除計費出席`,
       expected: surname,
       placeholder: surname,
      },
     }
   : {}),
 })
 if (result === true) return "delete"
 if (result === "alternate") {
  const second = await confirmDialog({
   title: "確認保留出席？",
   description:
    "將只改請假／調堂，出席列會變成孤兒（點名紙無名但已扣堂數仍計）。確定保留？",
   confirmText: "確定保留出席",
   cancelText: "取消（整筆中止）",
   tone: "warning",
  })
  if (second === true) return "keep"
  return "abort"
 }
 return "abort"
}

function attendanceOptionsFromChoice(
 choice: "delete" | "keep",
 hits: AttendanceLifecycleHit[]
): LeaveAttendanceChangeOptions | undefined {
 if (hits.length === 0) return undefined
 if (choice === "keep") return { attendanceAction: "keep" }
 return {
  attendanceAction: "delete",
  deleteAttendanceIds: hits.map((h) => h.id),
 }
}

function classTab(row: LeaveManageRow): StatusTab {
 if (isLeaveStatusAbandoned(row.status)) return "abandoned"
 if (isLeaveStatusDone(row.status)) return "done"
 if (isLeaveStatusPending(row.status)) return "pending"
 return "all"
}

/** 列表顯示：優先已連結排程之上課日 */
function displayLeaveDate(r: LeaveManageRow): string {
 return r.sched_date ?? r.leave_date
}

/** @deprecated 硬鎖已撤；恒可編輯（非當期寫入前會 soft confirm）。 */
function leaveRowEditable(_r: LeaveManageRow): boolean {
 return true
}

export function LeaveManagementView() {
 const { confirmDialog } = useAppConfirm()
 const isMobile = useIsMobile()
 const [searchParams, setSearchParams] = useSearchParams()
 const recordFromUrl = searchParams.get("record")
 const studentIdFromUrl = searchParams.get("studentId")

 const [rows, setRows] = useState<LeaveManageRow[]>([])
 const [hiddenOlderCount, setHiddenOlderCount] = useState(0)
 const [includeOlderYears, setIncludeOlderYears] = useState(false)
 const [stats, setStats] = useState<LeaveTodayStats>({ leaveStudentCount: 0, makeupStudentCount: 0 })
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [statusTab, setStatusTab] = useState<StatusTab>("all")
 const [filterDateFrom, setFilterDateFrom] = useState("")
 const [filterDateTo, setFilterDateTo] = useState("")
 const [filterSubject, setFilterSubject] = useState<string>("all")
 const [filterStudent, setFilterStudent] = useState("")
 const [filtersOpen, setFiltersOpen] = useState(false)

 const [addOpen, setAddOpen] = useState(false)
 const [studentSearch, setStudentSearch] = useState("")
 const [studentPickerOpen, setStudentPickerOpen] = useState(false)
 const [addStudentId, setAddStudentId] = useState("")
 const [addClassId, setAddClassId] = useState("")
 const [addScheduleId, setAddScheduleId] = useState("")
 const [addReason, setAddReason] = useState<(typeof STUDENT_LEAVE_REASON_OPTIONS)[number]>("病假")
 const [addMakeupArrange, setAddMakeupArrange] = useState<(typeof LEAVE_MAKEUP_OPTIONS)[number]>("待安排")
 const [addTuitionDisposition, setAddTuitionDisposition] = useState<LeaveTuitionDisposition>("減收")
 const [addMakeupScheduleId, setAddMakeupScheduleId] = useState("")
 const [addMakeupSearch, setAddMakeupSearch] = useState("")
 const [addConsecutiveScope, setAddConsecutiveScope] = useState<ConsecutiveLeaveScope>("this_slot")
 const [addRemarks, setAddRemarks] = useState("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)

 const [studentPickList, setStudentPickList] = useState<{ id: string; label: string }[]>([])
 const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClassOption[]>([])
 const [scheduleOptions, setScheduleOptions] = useState<ClassScheduleOption[]>([])
 const [makeupCandidates, setMakeupCandidates] = useState<ScheduleManageRow[]>([])
 const [detailOpen, setDetailOpen] = useState(false)
 const [detailRow, setDetailRow] = useState<LeaveManageRow | null>(null)
 const [detailStatus, setDetailStatus] = useState("")
 const [detailReason, setDetailReason] = useState<(typeof LEAVE_REASON_OPTIONS)[number]>("病假")
 const [detailMakeupType, setDetailMakeupType] = useState<(typeof LEAVE_MAKEUP_OPTIONS)[number]>("待安排")
 const [detailRemarks, setDetailRemarks] = useState("")
 const [detailSaving, setDetailSaving] = useState(false)
 const [detailErr, setDetailErr] = useState<string | null>(null)

 const [linkOpen, setLinkOpen] = useState(false)
 const [linkRow, setLinkRow] = useState<LeaveManageRow | null>(null)
 const [linkScheduleId, setLinkScheduleId] = useState("")
 const [linkSearch, setLinkSearch] = useState("")
 const [linkCandidates, setLinkCandidates] = useState<ScheduleManageRow[]>([])
 const [linkSaving, setLinkSaving] = useState(false)
 const [linkErr, setLinkErr] = useState<string | null>(null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   const [list, st] = await Promise.all([
    fetchLeaveMakeupWithRelations({
     includeOlderYears,
     extraIds: recordFromUrl ? [recordFromUrl] : [],
     extraStudentIds: studentIdFromUrl ? [studentIdFromUrl] : [],
    }),
    fetchLeaveTodayStats(),
   ])
   setRows(list.rows)
   setHiddenOlderCount(list.hiddenOlderCount)
   setStats(st)
  } catch (e) {
   reportUserFacingError(e, { source: "LeaveManagementView.reload", setErr })
   setRows([])
   setHiddenOlderCount(0)
  } finally {
   setLoading(false)
  }
 }, [includeOlderYears, recordFromUrl, studentIdFromUrl])

 useEffect(() => {
  void reload()
 }, [reload])

 useEffect(() => {
  if (!recordFromUrl || loading) return
  const t = window.setTimeout(() => {
   document.getElementById(`leave-record-${recordFromUrl}`)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
   })
  }, 100)
  return () => window.clearTimeout(t)
 }, [recordFromUrl, loading, rows])

 const clearDeepLinkFilters = () => {
  const next = new URLSearchParams(searchParams)
  next.delete("studentId")
  next.delete("record")
  setSearchParams(next, { replace: true })
 }

 useEffect(() => {
  if (!addOpen) return
  setAddErr(null)
  setStudentSearch("")
  setStudentPickerOpen(false)
  setAddStudentId("")
  setAddClassId("")
  setAddScheduleId("")
  setAddReason("病假")
  setAddMakeupArrange("待安排")
  setAddTuitionDisposition("減收")
  setAddMakeupScheduleId("")
  setAddMakeupSearch("")
  setAddConsecutiveScope("this_slot")
  setAddRemarks("")
  setEnrolledClasses([])
  setScheduleOptions([])
  void fetchStudentPickerOptions()
   .then((rows) => {
    const sl = rows.map((r) => ({
     id: r.id,
     label: `${r.full_name || "—"}（${r.grade ?? "—"}）`,
    }))
    setStudentPickList(sl)
   })
   .catch((e) => {
    reportUserFacingError(e, { source: "LeaveManagementView.studentPicker", setErr: setAddErr })
   })
 }, [addOpen])

 useEffect(() => {
  if (!addOpen || !addStudentId) {
   setEnrolledClasses([])
   setAddClassId("")
   setAddScheduleId("")
   setScheduleOptions([])
   return
  }
  void fetchEnrolledClassesForStudent(addStudentId).then((cls) => {
   setEnrolledClasses(cls)
   setAddClassId((prev) => (prev && cls.some((c) => c.id === prev) ? prev : cls[0]?.id ?? ""))
  })
 }, [addOpen, addStudentId])

 useEffect(() => {
  if (!addOpen || !addClassId) {
   setScheduleOptions([])
   setAddScheduleId("")
   return
  }
  void fetchUpcomingSchedulesForClass(addClassId, localYmd(), addStudentId || undefined).then((opts) => {
   setScheduleOptions(opts)
   setAddScheduleId((prev) => (prev && opts.some((o) => o.id === prev) ? prev : opts[0]?.id ?? ""))
  })
 }, [addOpen, addClassId, addStudentId])

 useEffect(() => {
  if (!addOpen || addMakeupArrange !== "調堂" || !addStudentId) {
   setMakeupCandidates([])
   return
  }
  void fetchMakeupCandidateSchedules({
   studentId: addStudentId,
   excludeScheduleIds: addScheduleId ? [addScheduleId] : undefined,
  }).then((list) => {
   setMakeupCandidates(list)
   setAddMakeupScheduleId((prev) => (prev && list.some((s) => s.id === prev) ? prev : ""))
  })
 }, [addOpen, addMakeupArrange, addStudentId, addScheduleId])

 const studentsFiltered = useMemo(() => {
  const q = studentSearch.trim().toLowerCase()
  if (!q) return studentPickList.slice(0, 20)
  return studentPickList.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 20)
 }, [studentPickList, studentSearch])

 const makeupFiltered = useMemo(() => {
  const q = addMakeupSearch.trim().toLowerCase()
  if (!q) return makeupCandidates
  return makeupCandidates.filter((s) => {
   const hay = `${s.classLabel} ${s.course_name ?? ""} ${s.subject} ${s.course_code_full ?? ""} ${s.teacher_name ?? ""} ${s.scheduled_date}`.toLowerCase()
   return hay.includes(q)
  })
 }, [makeupCandidates, addMakeupSearch])

 const subjectOptions = useMemo(() => {
  const s = new Set<string>()
  for (const r of rows) {
   if (r.class_subject) s.add(r.class_subject)
  }
  return [...s].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [rows])

 const tabCounts = useMemo(() => {
  const all = rows.length
  let pending = 0
  let done = 0
  let abandoned = 0
  for (const r of rows) {
   if (isLeaveStatusAbandoned(r.status)) abandoned++
   else if (isLeaveStatusDone(r.status)) done++
   else if (isLeaveStatusPending(r.status)) pending++
  }
  return { all, pending, done, abandoned }
 }, [rows])

 const filteredSorted = useMemo(() => {
  const qStudent = filterStudent.trim().toLowerCase()
  const sidFilter = studentIdFromUrl?.trim() ?? ""
  const recFocus = recordFromUrl?.trim() ?? ""
  const list = rows.filter((r) => {
   if (recFocus && r.id === recFocus) return true
   if (sidFilter && r.student_id !== sidFilter) return false
   if (statusTab !== "all" && classTab(r) !== statusTab) return false
   if (filterSubject !== "all" && (r.class_subject ?? "") !== filterSubject) return false
   if (filterDateFrom && r.leave_date < filterDateFrom) return false
   if (filterDateTo && r.leave_date > filterDateTo) return false
   if (qStudent) {
    const name = (r.student_name ?? "").toLowerCase()
    if (!name.includes(qStudent)) return false
   }
   return true
  })
  return [...list].sort((a, b) => {
   if (a.leave_date !== b.leave_date) return b.leave_date.localeCompare(a.leave_date)
   return b.id.localeCompare(a.id)
  })
 }, [
  rows,
  statusTab,
  filterSubject,
  filterDateFrom,
  filterDateTo,
  filterStudent,
  studentIdFromUrl,
  recordFromUrl,
 ])

 const activeFilterCount = useMemo(() => {
  let n = 0
  if (filterDateFrom) n++
  if (filterDateTo) n++
  if (filterSubject !== "all") n++
  if (filterStudent.trim()) n++
  return n
 }, [filterDateFrom, filterDateTo, filterSubject, filterStudent])

 const openAdd = () => {
  setAddOpen(true)
 }

 const openDetail = (row: LeaveManageRow) => {
  setDetailRow(row)
  setDetailStatus(row.status || "待補課")
  setDetailReason((row.leave_reason as (typeof LEAVE_REASON_OPTIONS)[number]) || "病假")
  setDetailMakeupType((row.makeup_type as (typeof LEAVE_MAKEUP_OPTIONS)[number]) || "待安排")
  setDetailRemarks(row.remarks ?? "")
  setDetailErr(null)
  setDetailOpen(true)
 }

 const deleteLeaveRow = async (r: LeaveManageRow) => {
  try {
   const hits = await previewLeaveMakeupAttendanceImpact(r.id, { forDelete: true })
   if (hits.length === 0) {
    if (
     !(await confirmDialog({
      title: "刪除請假紀錄",
      description: "確定刪除此筆請假紀錄？",
      confirmText: "確認刪除",
      tone: "destructive",
     }))
    ) {
     return
    }
    await deleteLeaveMakeupRecord(r.id)
   } else {
    const choice = await resolveLeaveAttendanceChoice(
     confirmDialog,
     hits,
     "刪除請假：補堂出席處理"
    )
    if (choice === "abort") return
    await deleteLeaveMakeupRecord(r.id, attendanceOptionsFromChoice(choice, hits))
   }
   await reload()
  } catch (error) {
   reportUserFacingError(error, {
    source: "LeaveManagementView.deleteLeave",
    setErr,
   })
  }
 }

 const saveDetail = async () => {
  if (!detailRow) return
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: displayLeaveDate(detailRow),
    source: "LeaveManagementView.saveDetail",
   }))
  ) {
   return
  }
  setDetailSaving(true)
  setDetailErr(null)
  try {
   const patch = {
    status: detailStatus,
    leave_reason: detailReason,
    makeup_type: detailMakeupType,
    remarks: detailRemarks.trim() || null,
    ...(detailMakeupType === "調堂"
     ? {}
     : { makeup_schedule_id: null as string | null, makeup_date: null as string | null }),
   }
   const hits = await previewLeaveMakeupAttendanceImpact(detailRow.id, { patch })
   const choice = await resolveLeaveAttendanceChoice(
    confirmDialog,
    hits,
    "清調堂／改類型：補堂出席處理"
   )
   if (choice === "abort") return
   await updateLeaveMakeupRecord(detailRow.id, patch, attendanceOptionsFromChoice(choice, hits))
   setDetailOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "LeaveManagementView.loadDetail", setErr: setDetailErr })
  } finally {
   setDetailSaving(false)
  }
 }

 const openLinkSchedule = async (row: LeaveManageRow) => {
  setLinkRow(row)
  setLinkErr(null)
  setLinkSearch("")
  setLinkOpen(true)
  try {
   const candidates = await fetchMakeupCandidateSchedules({
    studentId: row.student_id,
    excludeScheduleIds: row.schedule_id ? [row.schedule_id] : undefined,
   })
   setLinkCandidates(candidates)
   setLinkScheduleId(row.makeup_schedule_id ?? "")
  } catch (e) {
   setLinkCandidates([])
   reportUserFacingError(e, { source: "LeaveManagementView.loadLinkCandidates", setErr: setLinkErr })
  }
 }

 const linkFiltered = useMemo(() => {
  const q = linkSearch.trim().toLowerCase()
  if (!q) return linkCandidates
  return linkCandidates.filter((s) =>
   `${s.classLabel} ${s.course_name ?? ""} ${s.subject} ${s.course_code_full ?? ""} ${s.teacher_name ?? ""} ${s.scheduled_date} ${s.start_time ?? ""}`
    .toLowerCase()
    .includes(q)
  )
 }, [linkCandidates, linkSearch])

 const saveLinkSchedule = async () => {
  if (!linkRow || !linkScheduleId) {
   setLinkErr("請先選擇補堂排程。")
   return
  }
  const target = linkCandidates.find((c) => c.id === linkScheduleId)
  if (!target) {
   setLinkErr("補堂排程無效。")
   return
  }
  const linkMakeupErr = await validateMakeupScheduleForStudent(
   linkRow.student_id,
   target,
   linkRow.schedule_id
  )
  if (linkMakeupErr) {
   setLinkErr(linkMakeupErr)
   return
  }
  setLinkSaving(true)
  setLinkErr(null)
  try {
   const patch = {
    makeup_schedule_id: target.id,
    makeup_date: target.scheduled_date,
    makeup_type: "調堂" as const,
    status: linkRow.status.includes("待") ? "已批核" : linkRow.status,
   }
   const hits = await previewLeaveMakeupAttendanceImpact(linkRow.id, { patch })
   const choice = await resolveLeaveAttendanceChoice(
    confirmDialog,
    hits,
    "更改調堂排程：舊宿主出席處理"
   )
   if (choice === "abort") return
   await updateLeaveMakeupRecord(linkRow.id, patch, attendanceOptionsFromChoice(choice, hits))
   await setLeaveTuitionDisposition(linkRow.id, "調堂")
   setLinkOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "LeaveManagementView.linkMakeup", setErr: setLinkErr })
  } finally {
   setLinkSaving(false)
  }
 }

 const submitAdd = async () => {
  if (!addStudentId || !addClassId || !addScheduleId) {
   setAddErr("請完成：搜尋並選擇學生、班別，並選擇請假排程")
   return
  }
  if (addMakeupArrange === "調堂" && !addMakeupScheduleId) {
   setAddErr("補課安排為「調堂」時，請選擇補堂排程")
   return
  }
  const sched = scheduleOptions.find((s) => s.id === addScheduleId)
  if (!sched) {
   setAddErr("請假排程無效")
   return
  }
  const makeupRow =
   addMakeupArrange === "調堂" ? makeupCandidates.find((s) => s.id === addMakeupScheduleId) : undefined
  if (makeupRow) {
   const makeupErr = await validateMakeupScheduleForStudent(addStudentId, makeupRow, addScheduleId)
   if (makeupErr) {
    setAddErr(makeupErr)
    return
   }
  }

  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: sched.scheduled_date,
    source: "LeaveManagementView.submitAdd",
   }))
  ) {
   return
  }

  const consecutiveScope = sched.consecutive_group_id ? addConsecutiveScope : "this_slot"
  if (
   consecutiveScope === "all" &&
   !(await confirmDialog({
    title: "連堂兩節一併請假",
    description: "將建立兩筆請假，欠補最多 2 堂。若只欠一節，請改選「只請本節」。",
    confirmText: "確認兩節一併",
    tone: "warning",
   }))
  ) {
   return
  }

  setAddSaving(true)
  setAddErr(null)
  try {
   await insertLeaveMakeupForSchedule({
    student_id: addStudentId,
    class_id: addClassId,
    schedule_id: addScheduleId,
    leave_date: sched.scheduled_date,
    leave_reason: addReason,
    makeup_type: addMakeupArrange,
    makeup_schedule_id: addMakeupArrange === "調堂" ? addMakeupScheduleId : null,
    makeup_date: makeupRow?.scheduled_date ?? null,
    remarks: addRemarks.trim() || null,
    status: "待補課",
    tuition_disposition: addTuitionDisposition,
    consecutiveScope,
   })
   setAddOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "LeaveManagementView.onAdd", setErr: setAddErr, userMessage: "新增失敗" })
  } finally {
   setAddSaving(false)
  }
 }

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
      <Umbrella className="h-7 w-7 text-warning" aria-hidden />
      請假管理
      <Tag tone="warning" size="sm">{tabCounts.all} 則記錄</Tag>
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">請假與補堂紀錄；點學生或班別可開啟詳情頁，涉及排程可開排程詳情。</p>
    </div>
    <Button
     type="button"
     className="gap-1 bg-warning text-white hover:bg-warning"
     onClick={openAdd}
    >
     <Plus className="h-4 w-4" />
     新增請假
    </Button>
   </header>

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <SoftArchiveScopeBanner
    hiddenCount={hiddenOlderCount}
    description={`已隱藏 ${hiddenOlderCount} 筆更舊學年已完成／放棄請假（待補仍顯示；資料仍在，並非刪除）`}
    onShow={() => setIncludeOlderYears(true)}
   />

   {studentIdFromUrl || recordFromUrl ? (
   <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-info bg-info/80 px-3 py-2 text-sm text-info-foreground dark:border-info dark:bg-info/40 dark:text-info-foreground">
     <span>
      已由學生詳情帶入篩選
      {recordFromUrl ? "（並嘗試捲動至該筆）" : ""}
      。
     </span>
     <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={clearDeepLinkFilters}>
      清除網址篩選
     </Button>
    </div>
   ) : null}

   <section className="grid grid-cols-2 gap-2 md:gap-3" aria-label="今日請假與補堂概覽">
    <div className="rounded-xl border border-warning bg-warning p-2.5 text-warning-foreground shadow-sm md:p-4">
     <div className="flex items-center gap-1 text-[11px] font-medium text-warning-foreground/90 md:gap-2 md:text-sm">
      <Users className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
      今日請假
     </div>
     <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-3xl">{stats.leaveStudentCount}</p>
     <p className="mt-1 hidden text-xs text-warning-foreground/85 md:block">以「請假日期」為今天之不重複學生數</p>
    </div>
    <div className="rounded-xl border border-info bg-info p-2.5 text-info-foreground shadow-sm md:p-4">
     <div className="flex items-center gap-1 text-[11px] font-medium text-info-foreground/90 md:gap-2 md:text-sm">
      <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
      今日補堂
     </div>
     <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-3xl">{stats.makeupStudentCount}</p>
     <p className="mt-1 hidden text-xs text-info-foreground/85 md:block">以「補課日期」為今天之不重複學生數</p>
    </div>
   </section>

   <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="狀態篩選">
     {(
      [
       ["all", `全部 ${tabCounts.all}`],
       ["pending", `待補課 ${tabCounts.pending}`],
       ["done", `已補課 ${tabCounts.done}`],
       ["abandoned", `放棄補課 ${tabCounts.abandoned}`],
      ] as const
     ).map(([id, label]) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={statusTab === id}
       onClick={() => setStatusTab(id)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        statusTab === id
         ? "border-warning bg-warning text-warning-foreground"
         : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
       )}
      >
       {label}
      </button>
     ))}
    </div>
    {isMobile ? (
     <>
      <div className="flex items-center gap-2 border-t border-dashed border-border pt-3">
       <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        篩選
        {activeFilterCount > 0 ? (
         <Tag tone="info" size="sm">
          {activeFilterCount}
         </Tag>
        ) : null}
       </Button>
      </div>
      <MobileFilterSheet
       open={filtersOpen}
       onClose={() => setFiltersOpen(false)}
       title="篩選請假紀錄"
       activeCount={activeFilterCount}
       onReset={() => {
        setFilterDateFrom("")
        setFilterDateTo("")
        setFilterSubject("all")
        setFilterStudent("")
       }}
      >
       <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">請假日起</span>
        <Input
         type="date"
         value={filterDateFrom}
         onChange={(e) => setFilterDateFrom(e.target.value)}
         className="h-10 w-full"
        />
       </label>
       <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">請假日迄</span>
        <Input
         type="date"
         value={filterDateTo}
         onChange={(e) => setFilterDateTo(e.target.value)}
         className="h-10 w-full"
        />
       </label>
       <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">科目</span>
        <Select
         className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
         value={filterSubject}
         onChange={(e) => setFilterSubject(e.target.value)}
        >
         <option value="all">全部科目</option>
         {subjectOptions.map((sub) => (
          <option key={sub} value={sub}>
           {sub}
          </option>
         ))}
        </Select>
       </label>
       <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">學生（姓名）</span>
        <Input
         placeholder="搜尋姓名…"
         value={filterStudent}
         onChange={(e) => setFilterStudent(e.target.value)}
         className="h-10"
        />
       </label>
      </MobileFilterSheet>
     </>
    ) : (
     <div className="flex flex-wrap items-end gap-2 border-t border-dashed border-border pt-3">
      <label className="grid gap-1 text-xs text-muted-foreground">
       <span>請假日起</span>
       <Input
        type="date"
        value={filterDateFrom}
        onChange={(e) => setFilterDateFrom(e.target.value)}
        className="h-9 w-[11rem]"
       />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
       <span>請假日迄</span>
       <Input
        type="date"
        value={filterDateTo}
        onChange={(e) => setFilterDateTo(e.target.value)}
        className="h-9 w-[11rem]"
       />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
       <span>科目</span>
       <Select
        className="h-9 min-w-[8rem] rounded-md border border-input bg-background px-2 text-sm"
        value={filterSubject}
        onChange={(e) => setFilterSubject(e.target.value)}
       >
        <option value="all">全部科目</option>
        {subjectOptions.map((sub) => (
         <option key={sub} value={sub}>
          {sub}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid min-w-[10rem] flex-1 gap-1 text-xs text-muted-foreground">
       <span>學生（姓名）</span>
       <Input
        placeholder="搜尋姓名…"
        value={filterStudent}
        onChange={(e) => setFilterStudent(e.target.value)}
        className="h-9"
       />
      </label>
     </div>
    )}
   </div>

   {loading ? (
    isMobile ? <SkeletonCardGrid count={4} /> : <SkeletonTableRows rows={8} columns={7} />
   ) : filteredSorted.length === 0 ? (
    <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
   ) : isMobile ? (
    <StaggerList as="div" className="space-y-3">
     {filteredSorted.map((r) => (
      <StaggerItem
       key={r.id}
       as="article"
       id={`leave-record-${r.id}`}
       className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        recordFromUrl === r.id && "ring-2 ring-warning/50"
       )}
      >
       <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
         <Link
          to={`/Students/${r.student_id}`}
          className="font-semibold text-info hover:underline"
         >
          {r.student_name ?? "—"}
         </Link>
         <p className="text-xs text-muted-foreground">{r.student_grade ?? "—"}</p>
        </div>
        <Tag tone={statusToTagTone(r.status)} size="sm">
         {r.status || "—"}
        </Tag>
       </div>
       <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
        <p className="text-muted-foreground">請假日</p>
        <p className="text-right tabular-nums">{displayLeaveDate(r)}</p>
        <p className="text-muted-foreground">班別</p>
        <p className="truncate text-right">
         <Link to={`/Classes/${r.class_id}`} className="text-info hover:underline">
          {r.class_subject ?? "—"}
         </Link>
        </p>
        <p className="text-muted-foreground">補課</p>
        <p className="truncate text-right">{r.makeup_type ?? "—"}</p>
        <p className="text-muted-foreground">原因</p>
        <p className="truncate text-right">{r.leave_reason ?? "—"}</p>
       </div>
       <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => openDetail(r)}>
         詳情
        </Button>
        {leaveRowEditable(r) ? (
         <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-destructive"
          onClick={() => void deleteLeaveRow(r)}
         >
          刪除
         </Button>
        ) : null}
       </div>
      </StaggerItem>
     ))}
    </StaggerList>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[1180px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[10%] px-3 py-2 font-medium">學生</th>
        <th className="w-[13%] px-3 py-2 font-medium">請假班別</th>
        <th className="w-[9%] px-3 py-2 font-medium">所屬老師</th>
        <th className="w-[8%] px-3 py-2 font-medium">請假日期</th>
        <th className="w-[11%] px-3 py-2 font-medium">涉及排程</th>
        <th className="w-[9%] px-3 py-2 font-medium">原因</th>
        <th className="w-[10%] px-3 py-2 font-medium">補課安排</th>
        <th className="w-[10%] px-3 py-2 font-medium">學費處理</th>
        <th className="w-[8%] px-3 py-2 font-medium">備註</th>
        <th className="w-[7%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[5%] px-3 py-2 font-medium">操作</th>
       </tr>
      </thead>
      <StaggerList as="tbody">
       {filteredSorted.map((r) => (
        <StaggerItem
         key={r.id}
         as="tr"
         id={`leave-record-${r.id}`}
         className={cn(
          "border-b border-border last:border-0 transition-colors",
          recordFromUrl === r.id &&
           "bg-warning/15 ring-2 ring-inset ring-warning/50"
         )}
        >
         <td className="min-w-0 px-3 py-2 align-top">
          <Link
           to={`/Students/${r.student_id}`}
           className="block break-words font-medium text-info hover:underline"
          >
           {r.student_name ?? "—"}
          </Link>
          <div className="text-xs text-muted-foreground">{r.student_grade ?? "—"}</div>
         </td>
         <td className="min-w-0 px-3 py-2 align-top">
          <Link
           to={`/Classes/${r.class_id}`}
           className="block break-words font-medium text-info hover:underline"
          >
           {r.class_subject ?? "—"}
           {r.course_code_full ? (
            <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
             ({r.course_code_full})
            </span>
           ) : null}
          </Link>
         </td>
         <td className="min-w-0 px-3 py-2 align-top text-muted-foreground">
          <span className="block break-words">{r.teacher_name ?? "—"}</span>
         </td>
         <td className="min-w-0 px-3 py-2 align-top tabular-nums text-muted-foreground">
          {displayLeaveDate(r)}
         </td>
         <td className="min-w-0 px-3 py-2 align-top">
          {r.schedule_id ? (
           <Link
            to={`/Schedule/${r.schedule_id}`}
            className="block break-words font-medium text-info hover:underline"
           >
            {r.sched_date ?? r.leave_date} {r.sched_start ?? ""}–{r.sched_end ?? ""}
           </Link>
          ) : (
           <button
            type="button"
            className="text-warning/90 underline-offset-2 hover:underline"
            onClick={() => void openLinkSchedule(r)}
           >
            待連結排程
           </button>
          )}
         </td>
         <td className="min-w-0 px-3 py-2 align-top text-muted-foreground">
          <span className="line-clamp-3 break-words">{r.leave_reason ?? "—"}</span>
         </td>
         <td className="min-w-0 px-3 py-2 align-top">
          <MakeupCell
           row={r}
           onChanged={reload}
           readonly={!leaveRowEditable(r)}
           onPickMakeupSchedule={(row) => void openLinkSchedule(row)}
          />
         </td>
        <td className="min-w-0 px-3 py-2 align-top">
         <Select
          className="h-9 w-full text-xs"
          value={r.tuition_disposition ?? ""}
          disabled={!leaveRowEditable(r)}
          onChange={async (event) => {
           const next = event.target.value as LeaveTuitionDisposition
           try {
            const hits = await previewLeaveDispositionAttendanceImpact(r.id, next)
            const choice = await resolveLeaveAttendanceChoice(
             confirmDialog,
             hits,
             "更改學費處理會影響補堂出席"
            )
            if (choice === "abort") return
            await setLeaveTuitionDisposition(
             r.id,
             next,
             attendanceOptionsFromChoice(choice, hits)
            )
            await reload()
           } catch (error) {
            reportUserFacingError(error, {
             source: "LeaveManagementView.tuitionDisposition",
             setErr,
            })
           }
          }}
         >
          <option value="" disabled>請選擇</option>
          {LEAVE_TUITION_DISPOSITION_OPTIONS.map((option) => (
           <option key={option} value={option}>{option}</option>
          ))}
         </Select>
        </td>
         <td className="min-w-0 px-3 py-2 align-top text-xs text-muted-foreground">
          <span className="line-clamp-3 break-words">{r.remarks ?? "—"}</span>
         </td>
         <td className="min-w-0 px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
          <Select
           className={cn(
            "h-9 max-w-[7rem] rounded-md border px-1 text-xs font-medium",
            isLeaveStatusDone(r.status)
             ? "border-success bg-success text-success-foreground"
             : isLeaveStatusAbandoned(r.status)
              ? "border-slate-300 bg-slate-50"
              : "border-warning bg-warning text-warning-foreground"
           )}
           value={r.status}
           disabled={!leaveRowEditable(r)}
           onChange={async (e) => {
            await updateLeaveMakeupRecord(r.id, { status: e.target.value })
            await reload()
           }}
          >
           <option value="待補課">待補課</option>
           <option value="已批核">已批核</option>
           <option value="已補課">已補課</option>
           <option value="已完成">已完成</option>
           <option value="放棄補課">放棄補課</option>
          </Select>
         </td>
         <td className="min-w-0 px-3 py-2 align-top">
          <button
           type="button"
           className="mr-2 text-xs font-medium text-info hover:underline"
           onClick={() => openDetail(r)}
          >
           詳情
          </button>
          <button
           type="button"
           className="text-xs font-medium text-info hover:underline disabled:cursor-not-allowed disabled:opacity-50"
           disabled={!leaveRowEditable(r)}
           onClick={() => void deleteLeaveRow(r)}
          >
           刪除
          </button>
         </td>
        </StaggerItem>
       ))}
      </StaggerList>
     </table>
    </div>
   )}

   <Dialog open={addOpen} onOpenChange={setAddOpen}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
     <DialogHeader>
      <DialogTitle>新增請假</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <label className="grid gap-1">
       <span className="text-muted-foreground">學生（可搜尋姓名／年級）</span>
       <div className="relative">
        <Input
         placeholder="輸入姓名或年級搜尋…"
         value={
          addStudentId
           ? (studentPickList.find((s) => s.id === addStudentId)?.label ?? "")
           : studentSearch
         }
         onChange={(e) => {
          setAddStudentId("")
          setStudentSearch(e.target.value)
          setStudentPickerOpen(true)
         }}
         onFocus={() => setStudentPickerOpen(true)}
         className="h-9"
        />
        {studentPickerOpen && !addStudentId && studentSearch.trim() ? (
         <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {studentsFiltered.length === 0 ? (
           <div className="px-3 py-2 text-sm text-muted-foreground">找不到學生</div>
          ) : (
           studentsFiltered.map((s) => (
            <button
             key={s.id}
             type="button"
             className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
             onClick={() => {
              setAddStudentId(s.id)
              setStudentSearch("")
              setStudentPickerOpen(false)
             }}
            >
             {s.label}
            </button>
           ))
          )}
         </div>
        ) : null}
       </div>
       {addStudentId ? (
        <button
         type="button"
         className="text-left text-xs text-primary underline-offset-4 hover:underline"
         onClick={() => {
          setAddStudentId("")
          setStudentSearch("")
         }}
        >
         清除選取
        </button>
       ) : null}
      </label>

      <label className="grid gap-1">
       <span className="text-muted-foreground">班別（僅顯示該生就讀中班別）</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addClassId}
        onChange={(e) => setAddClassId(e.target.value)}
        disabled={!addStudentId || enrolledClasses.length === 0}
       >
        {!addStudentId ? (
         <option value="">請先選擇學生</option>
        ) : enrolledClasses.length === 0 ? (
         <option value="">該學生尚無就讀中班別</option>
        ) : (
         enrolledClasses.map((c) => (
          <option key={c.id} value={c.id}>
           {c.subject}
           {c.course_code_full ? `（${c.course_code_full}）` : ""}
          </option>
         ))
        )}
       </Select>
      </label>

      <label className="grid gap-1">
       <span className="text-muted-foreground">請假排程（未上堂：今日起、非取消／完成）</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addScheduleId}
        onChange={(e) => {
         setAddScheduleId(e.target.value)
         setAddConsecutiveScope("this_slot")
        }}
        disabled={!addClassId || scheduleOptions.length === 0}
       >
        {!addClassId ? (
         <option value="">請先選擇班別</option>
        ) : scheduleOptions.length === 0 ? (
         <option value="">此班尚無符合條件之排程</option>
        ) : (
         scheduleOptions.map((s) => (
          <option key={s.id} value={s.id}>
           {formatLeaveScheduleOptionLabel(s)}
          </option>
         ))
        )}
       </Select>
      </label>

      {scheduleOptions.find((s) => s.id === addScheduleId)?.consecutive_group_id ? (
       <label className="grid gap-1">
        <span className="text-muted-foreground">連堂請假範圍</span>
        <Select
         className="h-9 w-full rounded-md border border-input px-2"
         value={addConsecutiveScope}
         onChange={(e) => setAddConsecutiveScope(e.target.value as ConsecutiveLeaveScope)}
        >
         <option value="this_slot">只請本節（欠 1 堂；預設）</option>
         <option value="all">連堂兩節一併請假（欠最多 2 堂）</option>
        </Select>
        {addConsecutiveScope === "all" ? (
         <span className="text-xs text-warning">將欠補 2 堂；若只欠一節請改回「只請本節」。</span>
        ) : (
         <span className="text-xs text-muted-foreground">只欠一節時請維持此選項；兩節都欠才改「兩節一併」。</span>
        )}
       </label>
      ) : null}

      <label className="grid gap-1">
       <span className="text-muted-foreground">原因</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addReason}
        onChange={(e) => setAddReason(e.target.value as (typeof STUDENT_LEAVE_REASON_OPTIONS)[number])}
       >
        {STUDENT_LEAVE_REASON_OPTIONS.map((o) => (
         <option key={o} value={o}>
          {o}
         </option>
        ))}
       </Select>
      </label>

      <label className="grid gap-1">
       <span className="text-muted-foreground">補課安排</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addMakeupArrange}
        onChange={(e) => {
         const v = e.target.value as (typeof LEAVE_MAKEUP_OPTIONS)[number]
         setAddMakeupArrange(v)
        if (v === "調堂" || v === "錄影") setAddTuitionDisposition(v)
         if (v !== "調堂") setAddMakeupScheduleId("")
        }}
       >
        {LEAVE_MAKEUP_OPTIONS.map((o) => (
         <option key={o} value={o}>
          {o}
         </option>
        ))}
       </Select>
      </label>

      <label className="grid gap-1">
       <span className="text-muted-foreground">學費處理</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addTuitionDisposition}
        onChange={(e) => setAddTuitionDisposition(e.target.value as LeaveTuitionDisposition)}
       >
        {LEAVE_TUITION_DISPOSITION_OPTIONS.map((option) => (
         <option key={option} value={option}>{option}</option>
        ))}
       </Select>
       <span className="text-xs text-muted-foreground">
        未收款可選「減收」；已繳費請用調堂／錄影／不補回（按已繳堂數扣堂；已停用轉結餘）。
       </span>
      </label>

      {addMakeupArrange === "調堂" ? (
       <div className="rounded-lg border border-info bg-info/40 p-3 space-y-2">
        <p className="text-xs font-medium text-info">選擇補堂排程（未來一個月內、跨班）</p>
        <div className="relative">
         <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
         <Input
          placeholder="搜尋科目、代碼、老師、日期…"
          value={addMakeupSearch}
          onChange={(e) => setAddMakeupSearch(e.target.value)}
          className="h-9 pl-8"
         />
        </div>
        <Select
         className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
         value={addMakeupScheduleId}
         onChange={(e) => setAddMakeupScheduleId(e.target.value)}
        >
         <option value="">請選擇補堂排程</option>
         {makeupFiltered.map((s) => (
          <option key={s.id} value={s.id}>
           {formatMakeupCandidateLabel(s)}
          </option>
         ))}
        </Select>
       </div>
      ) : null}

      <label className="grid gap-1">
       <span className="text-muted-foreground">備註（選填）</span>
       <Input value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} className="h-9" />
      </label>

      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setAddOpen(false)}>
        取消
       </Button>
       <Button type="button" disabled={addSaving} onClick={() => void submitAdd()}>
        {addSaving ? "儲存中…" : "儲存"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <Dialog open={detailOpen} onOpenChange={(v) => !detailSaving && setDetailOpen(v)}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
     <DialogHeader>
      <DialogTitle>請假紀錄詳情</DialogTitle>
     </DialogHeader>
     {!detailRow ? null : (
      <div className="grid gap-3 text-sm">
       <p className="text-xs text-muted-foreground">
        學生：{detailRow.student_name ?? "—"} · 班別：{detailRow.class_subject ?? "—"}
       </p>
       <label className="grid gap-1">
        <span className="text-muted-foreground">狀態</span>
        <Select className="h-9 w-full rounded-md border border-input px-2" value={detailStatus} disabled={!leaveRowEditable(detailRow)} onChange={(e) => setDetailStatus(e.target.value)}>
         <option value="待補課">待補課</option>
         <option value="已批核">已批核</option>
         <option value="已補課">已補課</option>
         <option value="已完成">已完成</option>
         <option value="放棄補課">放棄補課</option>
        </Select>
       </label>
       <label className="grid gap-1">
        <span className="text-muted-foreground">原因</span>
        <Select
         className="h-9 w-full rounded-md border border-input px-2"
         value={detailReason}
         disabled={!leaveRowEditable(detailRow)}
         onChange={(e) => setDetailReason(e.target.value as (typeof LEAVE_REASON_OPTIONS)[number])}
        >
         {LEAVE_REASON_OPTIONS.map((o) => (
          <option key={o} value={o}>{o}</option>
         ))}
        </Select>
       </label>
       <label className="grid gap-1">
        <span className="text-muted-foreground">補課安排</span>
        <Select
         className="h-9 w-full rounded-md border border-input px-2"
         value={detailMakeupType}
         disabled={!leaveRowEditable(detailRow)}
         onChange={(e) => setDetailMakeupType(e.target.value as (typeof LEAVE_MAKEUP_OPTIONS)[number])}
        >
         {LEAVE_MAKEUP_OPTIONS.map((o) => (
          <option key={o} value={o}>{o}</option>
         ))}
        </Select>
       </label>
       {detailMakeupType === "調堂" || detailMakeupType === "待安排" ? (
        <div className="rounded-lg border border-info bg-info/40 p-3 space-y-2">
         <p className="text-xs text-muted-foreground">
          {detailRow.makeup_schedule_id && detailRow.makeup_date
           ? `已指定調堂日：${detailRow.makeup_date}`
           : "尚未指定調堂排程，可事後選擇補堂日子。"}
         </p>
         {leaveRowEditable(detailRow) ? (
          <Button
           type="button"
           variant="outline"
           size="sm"
           className="h-8"
           onClick={() => {
            setDetailOpen(false)
            void openLinkSchedule(detailRow)
           }}
          >
           {detailRow.makeup_schedule_id ? "更改調堂排程" : "選擇調堂日"}
          </Button>
         ) : null}
        </div>
       ) : null}
       <label className="grid gap-1">
        <span className="text-muted-foreground">備註</span>
        <Input value={detailRemarks} disabled={!leaveRowEditable(detailRow)} onChange={(e) => setDetailRemarks(e.target.value)} className="h-9" />
       </label>
       {detailErr ? <p className="text-destructive">{detailErr}</p> : null}
       <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" disabled={detailSaving} onClick={() => setDetailOpen(false)}>
         {leaveRowEditable(detailRow) ? "取消" : "關閉"}
        </Button>
        {leaveRowEditable(detailRow) ? (
        <Button type="button" disabled={detailSaving} onClick={() => void saveDetail()}>
         {detailSaving ? "儲存中…" : "儲存修改"}
        </Button>
        ) : null}
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>

   <Dialog open={linkOpen} onOpenChange={(v) => !linkSaving && setLinkOpen(v)}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
     <DialogHeader>
      <DialogTitle>連結補堂排程</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <p className="text-xs text-muted-foreground">
       {linkRow ? `學生：${linkRow.student_name ?? "—"} · 原請假日：${linkRow.leave_date}` : "請選擇補堂排程"}
       。若補入連堂，請選正確那一節（點名只計該節 1 堂）。
      </p>
      <div className="relative">
       <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
       <Input
        placeholder="搜尋科目、代碼、老師、日期…"
        value={linkSearch}
        onChange={(e) => setLinkSearch(e.target.value)}
        className="h-9 pl-8"
       />
      </div>
      <Select className="h-9 w-full rounded-md border border-input px-2" value={linkScheduleId} onChange={(e) => setLinkScheduleId(e.target.value)}>
       <option value="">請選擇補堂排程</option>
       {linkFiltered.map((s) => (
        <option key={s.id} value={s.id}>
         {formatMakeupCandidateLabel(s)}
        </option>
       ))}
      </Select>
      {linkErr ? <p className="text-destructive">{linkErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={linkSaving} onClick={() => setLinkOpen(false)}>取消</Button>
       <Button type="button" disabled={linkSaving} onClick={() => void saveLinkSchedule()}>
        {linkSaving ? "連結中…" : "確認連結"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}

function MakeupCell({
 row,
 onChanged,
 onPickMakeupSchedule,
 readonly = false,
}: {
 row: LeaveManageRow
 onChanged: () => Promise<void>
 onPickMakeupSchedule?: (row: LeaveManageRow) => void
 readonly?: boolean
}) {
 const { confirmDialog } = useAppConfirm()
 const t = (row.makeup_type ?? "").trim()
 const hasDate = !!row.makeup_date
 const [saving, setSaving] = useState(false)
 const awaitingDate = leaveNeedsMakeupDate({
  makeupType: row.makeup_type,
  makeupDate: row.makeup_date,
  makeupScheduleId: row.makeup_schedule_id,
  status: row.status,
 })

 const quickSetMakeup = async (nextType: string) => {
  if (readonly) return
  if (!nextType) return
  // 選「調堂」時開啟連結排程，避免只寫類型卻沒有補堂日
  if (nextType === "調堂") {
   onPickMakeupSchedule?.(row)
   return
  }
  setSaving(true)
  try {
   const patch = {
    makeup_type: nextType,
    makeup_schedule_id: null as string | null,
    makeup_date: null as string | null,
   }
   const hits = await previewLeaveMakeupAttendanceImpact(row.id, { patch })
   const choice = await resolveLeaveAttendanceChoice(
    confirmDialog,
    hits,
    "更改補課安排：補堂出席處理"
   )
   if (choice === "abort") return
   await updateLeaveMakeupRecord(row.id, patch, attendanceOptionsFromChoice(choice, hits))
   await onChanged()
  } catch (e) {
   reportUserFacingError(e, { source: "LeaveManagementView.MakeupCell" })
  } finally {
   setSaving(false)
  }
 }

 if (awaitingDate) {
  const selectValue =
   !t || t.includes("待安排")
    ? "待安排"
    : (LEAVE_MAKEUP_OPTIONS as readonly string[]).includes(t)
      ? t
      : "待安排"
  return (
   <div className="space-y-1">
    <Select
     className="h-8 min-w-[8.5rem] rounded-md border border-warning/80 bg-warning/20 px-2 text-xs text-warning"
     value={selectValue}
     disabled={saving || readonly}
     onChange={(e) => {
      void quickSetMakeup(e.target.value)
     }}
    >
     {LEAVE_MAKEUP_OPTIONS.map((o) => (
      <option key={o} value={o}>
       {o}
      </option>
     ))}
    </Select>
    {!readonly && onPickMakeupSchedule ? (
     <button
      type="button"
      className="block text-xs font-medium text-info hover:underline"
      onClick={() => onPickMakeupSchedule(row)}
     >
      選擇調堂日
     </button>
    ) : null}
   </div>
  )
 }
 if (t.includes("不補回")) {
  return <span className="text-muted-foreground">不補回</span>
 }
 const isRecord = t.includes("錄影") || t.includes("錄像")
 const isResched = t.includes("調堂") || t.includes("調") || t.includes("另排")
 return (
  <div className="space-y-1 text-xs">
   {isRecord ? (
    <span className="inline-flex items-center gap-1 text-info">
     <Camera className="h-3.5 w-3.5 shrink-0" />
     {t || "錄影"}
    </span>
   ) : isResched ? (
    <span className="inline-flex items-center gap-1 text-info">
     <Clock className="h-3.5 w-3.5 shrink-0" />
     {t || "調堂"}
    </span>
   ) : (
    <span className="inline-flex items-center gap-1 text-foreground">
     <Video className="h-3.5 w-3.5 shrink-0 opacity-70" />
     {t || "—"}
    </span>
   )}
   {hasDate ? (
    <div className="tabular-nums text-info">{row.makeup_date}</div>
   ) : null}
   {!readonly && isResched && onPickMakeupSchedule ? (
    <button
     type="button"
     className="block text-xs font-medium text-info hover:underline"
     onClick={() => onPickMakeupSchedule(row)}
    >
     更改調堂日
    </button>
   ) : null}
  </div>
 )
}
