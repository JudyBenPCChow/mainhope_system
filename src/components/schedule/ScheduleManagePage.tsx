import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { usePersistentState } from "@/hooks/usePersistentState"
import { useIsMobile } from "@/hooks/use-mobile"
import {
 CalendarDays,
 Check,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 ChevronUp,
 Download,
 DoorOpen,
 LayoutGrid,
 List,
 Plus,
 User,
 UserRound,
 UserX,
 Users,
 Wand2,
 XCircle,
} from "lucide-react"

import { RollCallSheet } from "@/components/attendance/RollCallSheet"
import { StudentWhatsAppReminderButton } from "@/components/reminders/StudentWhatsAppReminderButton"
import { Button } from "@/components/ui/button"
import type { TagTone } from "@/components/ui/tag"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { CancelReasonDialog } from "@/components/schedule/CancelReasonDialog"
import { AssignSubstituteDialog } from "@/components/schedule/AssignSubstituteDialog"
import { DayViewGrid } from "@/components/schedule/DayViewGrid"
import { ScheduleAlertIcons } from "@/components/schedule/ScheduleAlertIcons"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import { formatScheduleSubstituteTag } from "@/lib/scheduleSubstitute"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
 formatMin,
 intervalsOverlapMinutes,
 lessonSlotLabel,
 LESSON_SLOT_INDICES,
 nearestStandardSlotIndex,
 parseHm,
} from "@/lib/lessonSlots"
import {
 durationMinForSchedule,
 findScheduleRoomConflicts,
 isDateInInclusiveRange,
 isStandardSchedulePlacement,
 scheduleIntervalMinutes,
 snapTimesToStandardSlot,
 standardSlotIndexForSchedule,
} from "@/lib/scheduleDayView"
import {
 buildDayViewExtraTags,
 isDayViewIdleCard,
} from "@/lib/scheduleDayViewTags"
import { addDaysYmd } from "@/lib/weekdayUtils"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 academicYearEditBlockedMessage,
 canEditAcademicYearForDate,
} from "@/lib/academicYearEditGuard"
import { buildRollCallScheduleEntries } from "@/lib/consecutiveLesson"
import { formatClassLabel } from "@/lib/courseLabel"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { isAdmin, isMgmtStaff } from "@/lib/mgmtRole"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { getTeacherById } from "@/services/teacherQueries"
import {
 fetchLeaveInfoForSchedules,
 fetchLeaveStudentsForSchedule,
 fetchMakeupStudentsForSchedule,
 fetchScheduleIdsWithRollCallTargets,
 fetchTrialStudentsForSchedule,
 type ScheduleLeaveSnapshot,
 type ScheduleRosterStudent,
} from "@/services/attendanceQueries"
import { fetchSingleSessionNotOnSchedule } from "@/services/enrollmentSessionQueries"
import {
 deleteSchedule,
 fetchAllClasses,
 fetchClassStudents,
 getClassById,
 getScheduleById,
 insertScheduleForClass,
 updateSchedule,
 type ClassRecord,
 type ClassStudentRow,
 type ScheduleDetailRecord,
} from "@/services/classQueries"
import { parseTimeSlotBounds } from "@/services/batchScheduleHelpers"
import { consecutivePairFromFirstTimeSlot, isConsecutiveClass, resolveLessonReminderTimes } from "@/lib/consecutiveLesson"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import { slotIsFreeForBooking } from "@/services/roomBookingQueries"
import {
 fetchDayViewRosterBySchedules,
 fetchNearestScheduleDate,
 fetchScheduleAlerts,
 fetchSchedulesInRange,
 fetchScheduleStatsSnapshot,
 fetchTeacherScheduleConflicts,
 localYmd,
 scheduleRangeEnd,
 type DayViewRosterStudent,
 type ScheduleAlerts,
 type ScheduleManageRow,
 type ScheduleStatsSnapshot,
 type TeacherScheduleConflict,
} from "@/services/scheduleQueries"

const RANGE_DAYS = 14

type ViewMode = "byDate" | "list" | "day"

/** 排程問題／類型篩選（可多選，條件為 AND） */
type ScheduleIssueFilter = "noEnroll" | "private" | "noRoom"

const ISSUE_FILTER_OPTIONS: {
 id: ScheduleIssueFilter
 label: string
 icon: typeof UserX
}[] = [
 { id: "noEnroll", label: "未有學生報讀", icon: UserX },
 { id: "private", label: "一對一班別", icon: UserRound },
 { id: "noRoom", label: "未有課室安排", icon: DoorOpen },
]

/** 專班老師僅保留與自己班務相關的進階篩選 */
const TEACHER_ISSUE_FILTER_IDS: ReadonlySet<ScheduleIssueFilter> = new Set(["noEnroll"])

/** 老師篩選：未指派 teacher_id 的哨兵值 */
const UNASSIGNED_TEACHER_ID = "__unassigned__"

type PendingMove = {
 row: ScheduleManageRow
 newRoomId: string | null
 newStart: string
 newEnd: string
 roomLabel: string
 alignedToStandard: boolean
}

const EMPTY_LEAVE_SNAPSHOT: ScheduleLeaveSnapshot = {
 studentIds: new Set(),
 hasOnlineMakeup: false,
 hasRecordMakeup: false,
}

/** 課室僅在該日開放時才算已編排 */
function effectiveRoomId(s: ScheduleManageRow, activeRoomIds: ReadonlySet<string>): string | null {
 const rid = s.classroom_id
 if (!rid || !activeRoomIds.has(rid)) return null
 return rid
}

type ExpandedRosterStudent = {
 studentId: string
 fullName: string
 contactPhone: string | null
}

type ExpandedScheduleRosterProps = {
 schedule: ScheduleManageRow
 /** 同頁面已載入的排程，用於解析連堂時間 */
 schedulePeers?: ScheduleManageRow[]
 loading: boolean
 enrolled: ExpandedRosterStudent[]
 leave: ExpandedRosterStudent[]
 trial: ExpandedRosterStudent[]
 /** 來此補堂（跨班，makeup_schedule_id 指向本堂） */
 makeup: ExpandedRosterStudent[]
 /** 單堂報讀但本堂未選 */
 notEnrolled: ExpandedRosterStudent[]
 classMeta?: ReactNode
 footer?: ReactNode
}

function ExpandedScheduleRoster({
 schedule,
 schedulePeers,
 loading,
 enrolled,
 leave,
 trial,
 makeup,
 notEnrolled,
 classMeta,
 footer,
}: ExpandedScheduleRosterProps) {
 const reminderTimes = resolveLessonReminderTimes(schedule, schedulePeers)
 const sections: {
  key: string
  label: string
  students: ExpandedRosterStudent[]
  tone: TagTone
  headerClass: string
  linkClass: string
  buttonBorderClass: string
  isTrial: boolean
  attendanceStatus: string | null
  alwaysShow: boolean
  nameSuffix?: string
 }[] = [
  {
   key: "enrolled",
   label: "班內學生",
   students: enrolled,
   tone: "success",
   headerClass: "text-success",
   linkClass: "text-success",
   buttonBorderClass: "border-success/60",
   isTrial: false,
   attendanceStatus: null,
   alwaysShow: true,
  },
  {
   key: "notEnrolled",
   label: "沒有報讀此堂（單堂生）",
   students: notEnrolled,
   tone: statusToTagTone("沒有報讀此堂"),
   headerClass: "text-info",
   linkClass: "text-info",
   buttonBorderClass: "border-info/60",
   isTrial: false,
   attendanceStatus: null,
   alwaysShow: false,
   nameSuffix: "沒有報讀此堂",
  },
  {
   key: "leave",
   label: "請假學生",
   students: leave,
   tone: "error",
   headerClass: "text-destructive",
   linkClass: "text-destructive",
   buttonBorderClass: "border-destructive/60",
   isTrial: false,
   attendanceStatus: "請假",
   alwaysShow: false,
  },
  {
   key: "trial",
   label: "試堂學生",
   students: trial,
   tone: statusToTagTone("試堂"),
   headerClass: "text-warning",
   linkClass: "text-warning",
   buttonBorderClass: "border-warning/60",
   isTrial: true,
   attendanceStatus: null,
   alwaysShow: false,
  },
  {
   key: "makeup",
   label: "來此補堂",
   students: makeup,
   tone: statusToTagTone("補堂"),
   headerClass: "text-warning",
   linkClass: "text-warning",
   buttonBorderClass: "border-warning/60",
   isTrial: false,
   attendanceStatus: "現場",
   alwaysShow: false,
  },
 ]

 return (
  <>
   {classMeta}
   {loading ? (
    <p className="mt-3 text-sm text-muted-foreground">載入名單…</p>
   ) : (
    sections.map((section, index) => {
     if (!section.alwaysShow && section.students.length === 0) return null
     return (
      <div key={section.key} className={index === 0 && !classMeta ? undefined : "mt-3"}>
       <p className={cn("mb-2 text-sm font-medium", section.headerClass)}>
        {section.label}（{section.students.length}）
       </p>
       {section.students.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無就讀學生。</p>
       ) : (
        <div className="flex flex-wrap gap-2">
         {section.students.map((st) => (
          <Tag
           key={`${section.key}-${st.studentId}`}
           tone={section.tone}
           size="sm"
           className="gap-1 py-0.5 pl-2 pr-1"
          >
           <Link
            to={`/Students/${st.studentId}`}
            className={cn("text-sm font-medium hover:underline", section.linkClass)}
            onClick={(e) => e.stopPropagation()}
           >
            {section.nameSuffix ? `${st.fullName}${section.nameSuffix}` : st.fullName}
           </Link>
           <StudentWhatsAppReminderButton
            compact
            className={cn("h-7 w-7", section.buttonBorderClass)}
            contactPhone={st.contactPhone}
            payload={{
             studentName: st.fullName,
             subject: schedule.subject,
             courseName: schedule.course_name,
             courseCode: schedule.course_code_full,
             dateYmd: schedule.scheduled_date,
             startTime: reminderTimes.startTime,
             endTime: reminderTimes.endTime,
             isConsecutive: reminderTimes.isConsecutive,
             classroomName: schedule.classroom_name,
             attendanceStatus: section.attendanceStatus,
             isTrial: section.isTrial,
            }}
           />
          </Tag>
         ))}
        </div>
       )}
      </div>
     )
    })
   )}
   {footer}
  </>
 )
}

export function ScheduleManagePage() {
 const { confirmDialog } = useAppConfirm()
 const { pushBanner } = useAppBanner()
 const isMobile = useIsMobile()
 const todayYmd = localYmd()
 const [searchParams, setSearchParams] = useSearchParams()
 /** 僅在「進頁當下」URL 已帶日期時才沿用（例如儀表板深連結）；之後日視圖自行寫入的今天不得蓋過「未來最近排程」初始化。 */
 const initialUrlDayDateRef = useRef<string | null>((() => {
  const view = searchParams.get("view")
  const date = searchParams.get("date")
  if (view === "day" && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  return null
 })())

 const [viewMode, setViewMode] = usePersistentState<ViewMode>("mgmt_schedule_viewMode", "byDate")
 const effectiveViewMode: ViewMode =
  isMobile && (viewMode === "list" || viewMode === "day") ? "byDate" : viewMode
 const [displayStart, setDisplayStart] = useState(todayYmd)
 const [dayViewDate, setDayViewDate] = useState(todayYmd)
 const [startInitialized, setStartInitialized] = useState(false)
 const [quickFilter, setQuickFilter] = usePersistentState<null | "cancelled">(
  "mgmt_schedule_quickFilter",
  null
 )
 const [teacherFilterIds, setTeacherFilterIds] = usePersistentState<string[]>(
  "mgmt_schedule_teacherFilterIds",
  []
 )
 const [statusFilter, setStatusFilter] = usePersistentState<string>("mgmt_schedule_statusFilter", "all")
 const [issueFilters, setIssueFilters] = usePersistentState<ScheduleIssueFilter[]>(
  "mgmt_schedule_issueFilters",
  []
 )
 const [rows, setRows] = useState<ScheduleManageRow[]>([])
 const [alerts, setAlerts] = useState<Map<string, ScheduleAlerts>>(new Map())
 const [stats, setStats] = useState<ScheduleStatsSnapshot>({
  todayLessonCount: 0,
  pendingCancelledCount: 0,
  todayStudentHeadcount: 0,
 })
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [roomOptions, setRoomOptions] = useState<{ id: string; label: string }[]>([])
 const [loading, setLoading] = useState(false)
 const [pageErr, setPageErr] = useState<string | null>(null)

 const [detailId, setDetailId] = useState<string | null>(null)
 const [detailRow, setDetailRow] = useState<ScheduleDetailRecord | null>(null)
 const [detailLoading, setDetailLoading] = useState(false)

 const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)
 const [listStudents, setListStudents] = useState<ClassStudentRow[]>([])
 const [listLeaveStudents, setListLeaveStudents] = useState<ScheduleRosterStudent[]>([])
 const [listTrialStudents, setListTrialStudents] = useState<ScheduleRosterStudent[]>([])
 const [listMakeupStudents, setListMakeupStudents] = useState<ScheduleRosterStudent[]>([])
 const [listNotEnrolledStudents, setListNotEnrolledStudents] = useState<ScheduleRosterStudent[]>([])
 const [listStudentsLoading, setListStudentsLoading] = useState(false)
 const [dayViewRosterBySchedule, setDayViewRosterBySchedule] = useState<
  Map<string, DayViewRosterStudent[]>
 >(new Map())
 const [dayViewLeaveByScheduleId, setDayViewLeaveByScheduleId] = useState<
  Map<string, ScheduleLeaveSnapshot>
 >(new Map())
 const [dayViewRosterLoading, setDayViewRosterLoading] = useState(false)
 const [assigning, setAssigning] = useState(false)

 const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
 const [moveSaving, setMoveSaving] = useState(false)
 const [moveErr, setMoveErr] = useState<string | null>(null)
 const [moveConflicts, setMoveConflicts] = useState<ScheduleManageRow[]>([])
 const [moveRemoteBlocked, setMoveRemoteBlocked] = useState<boolean | null>(null)
 const [moveChecking, setMoveChecking] = useState(false)

 const [moveDialogSchedule, setMoveDialogSchedule] = useState<ScheduleManageRow | null>(null)
 const [moveDialogRoomKey, setMoveDialogRoomKey] = useState("")
 const [moveDialogSlot, setMoveDialogSlot] = useState(0)

 const [addOpen, setAddOpen] = useState(false)
 const [addClassId, setAddClassId] = useState("")
 const [addDate, setAddDate] = useState(todayYmd)
 const [addStart, setAddStart] = useState("")
 const [addEnd, setAddEnd] = useState("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)
 const [addExtra, setAddExtra] = useState(false)
 const [classPickList, setClassPickList] = useState<{ id: string; label: string }[]>([])
 const [addClassRecords, setAddClassRecords] = useState<ClassRecord[]>([])
 const [addConflicts, setAddConflicts] = useState<TeacherScheduleConflict[]>([])

 const [cancelTarget, setCancelTarget] = useState<ScheduleManageRow | null>(null)
 const [cancelSaving, setCancelSaving] = useState(false)
 const [substituteTarget, setSubstituteTarget] = useState<ScheduleManageRow | null>(null)
 const [rollCallScheduleId, setRollCallScheduleId] = useState<string | null>(null)
 /** null = 尚未載入；載入後為有可點名對象的排程 id */
 const [rollCallEligibleIds, setRollCallEligibleIds] = useState<Set<string> | null>(null)

 const teacherScopeId = getTeacherScopeTeacherId()
 const [teacherScopeName, setTeacherScopeName] = useState<string>("專班老師")

 const rangeEnd = useMemo(() => scheduleRangeEnd(displayStart, RANGE_DAYS), [displayStart])

 const reloadStats = useCallback(async (teacherId?: string | null) => {
  try {
   setStats(await fetchScheduleStatsSnapshot(teacherId))
  } catch {
   /* ignore */
  }
 }, [])

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setPageErr(null)
  try {
   const tid = getTeacherScopeTeacherId()
   const [list, rms] = await Promise.all([
    fetchSchedulesInRange(displayStart, rangeEnd, tid ? { teacherId: tid } : undefined),
    fetchClassrooms(),
   ])
   setRows(list)
   setRooms(rms)
   setRoomOptions(
    [...rms]
     .map((r) => ({ id: r.id, label: r.name }))
     .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
   )
   // stats 不擋主畫面；alerts 仍 await，避免試堂 badge 晚到造成短暫誤灰
   void reloadStats(tid)
   setAlerts(await fetchScheduleAlerts(list))
  } catch (e) {
   reportUserFacingError(e, { source: "ScheduleManagePage.reload", setErr: setPageErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [displayStart, rangeEnd, reloadStats])

 useEffect(() => {
  if (!startInitialized) return
  void reload()
 }, [reload, startInitialized])

 useEffect(() => {
  const urlDate = initialUrlDayDateRef.current
  if (urlDate) {
   setDisplayStart(urlDate)
   setDayViewDate(urlDate)
   setStartInitialized(true)
   return
  }
  let cancelled = false
  const tid = getTeacherScopeTeacherId()
  void fetchNearestScheduleDate(tid ? { teacherId: tid } : undefined)
   .then((nearest) => {
    if (cancelled || !nearest) return
    setDisplayStart(nearest)
    setDayViewDate(nearest)
   })
   .catch(() => {
    /* 查詢失敗時維持今天，仍放行載入 */
   })
   .finally(() => {
    if (!cancelled) setStartInitialized(true)
   })
  return () => {
   cancelled = true
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [])

 useEffect(() => {
  if (!startInitialized) return
  const view = searchParams.get("view")
  const date = searchParams.get("date")
  if (view === "day" && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
   setDayViewDate(date)
   setDisplayStart(date)
   if (!isMobile) setViewMode("day")
  }
 }, [searchParams, isMobile, setViewMode, startInitialized])

 useEffect(() => {
  let cancelled = false
  const candidates = rows.filter(
   (s) => !String(s.status ?? "").includes("取消") && s.class_id != null && String(s.class_id).length > 0
  )
  if (candidates.length === 0) {
   setRollCallEligibleIds(new Set())
   return
  }
  setRollCallEligibleIds(null)
  void fetchScheduleIdsWithRollCallTargets(candidates)
   .then((ids) => {
    if (!cancelled) setRollCallEligibleIds(ids)
   })
   .catch(() => {
    if (!cancelled) setRollCallEligibleIds(new Set())
   })
  return () => {
   cancelled = true
  }
 }, [rows])

 const openRollCallForSchedule = useCallback(
  (scheduleId: string) => {
   const notifyEmpty = () => {
    pushBanner({
     tone: "info",
     title: "暫無可點名學生",
     message: "此堂沒有就讀中報讀、試堂或補堂學生，無需點名。",
    })
   }
   if (rollCallEligibleIds != null) {
    if (!rollCallEligibleIds.has(scheduleId)) {
     notifyEmpty()
     return
    }
    setRollCallScheduleId(scheduleId)
    return
   }
   const schedule = rows.find((r) => r.id === scheduleId)
   if (!schedule?.class_id) {
    notifyEmpty()
    return
   }
   void fetchScheduleIdsWithRollCallTargets([schedule]).then((ids) => {
    if (!ids.has(scheduleId)) {
     notifyEmpty()
     return
    }
    setRollCallScheduleId(scheduleId)
   })
  },
  [rollCallEligibleIds, pushBanner, rows]
 )

 const canOpenRollCall = useCallback(
  (scheduleId: string) => rollCallEligibleIds == null || rollCallEligibleIds.has(scheduleId),
  [rollCallEligibleIds]
 )

 /** 深連結：/Schedule?schedule_id=…&rollcall=1（可附 date）→ 開點名紙後清參數 */
 useEffect(() => {
  if (!startInitialized || loading) return
  const wantRollCall = searchParams.get("rollcall") === "1"
  const sid = searchParams.get("schedule_id")?.trim()
  if (!wantRollCall || !sid) return
  const schedule = rows.find((r) => r.id === sid)
  if (!schedule) return

  const clearRollCallParams = () => {
   const params = new URLSearchParams(searchParams)
   params.delete("rollcall")
   params.delete("schedule_id")
   setSearchParams(params, { replace: true })
  }

  const date = searchParams.get("date")
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
   setDisplayStart(date)
   setDayViewDate(date)
  }

  let cancelled = false
  void fetchScheduleIdsWithRollCallTargets([schedule]).then((ids) => {
   if (cancelled) return
   if (!ids.has(sid)) {
    pushBanner({
     tone: "info",
     title: "暫無可點名學生",
     message: "此堂沒有就讀中報讀、試堂或補堂學生，無需點名。",
    })
    clearRollCallParams()
    return
   }
   setRollCallScheduleId(sid)
   clearRollCallParams()
  })
  return () => {
   cancelled = true
  }
 }, [startInitialized, loading, rows, searchParams, setSearchParams, pushBanner])

 useEffect(() => {
  // 等「未來最近排程」初始化完成後再同步 URL，避免日視圖先寫入今天、蓋掉最近日期。
  if (!startInitialized) return
  if (effectiveViewMode === "day") {
   const params = new URLSearchParams(searchParams)
   if (params.get("view") !== "day" || params.get("date") !== dayViewDate) {
    params.set("view", "day")
    params.set("date", dayViewDate)
    setSearchParams(params, { replace: true })
   }
   return
  }
  if (searchParams.get("view") === "day") {
   const params = new URLSearchParams(searchParams)
   params.delete("view")
   params.delete("date")
   setSearchParams(params, { replace: true })
  }
 }, [effectiveViewMode, dayViewDate, searchParams, setSearchParams, startInitialized])

 useEffect(() => {
  if (effectiveViewMode !== "day") return
  if (!isDateInInclusiveRange(dayViewDate, displayStart, rangeEnd)) {
   setDisplayStart(dayViewDate)
  }
 }, [effectiveViewMode, dayViewDate, displayStart, rangeEnd])

 useEffect(() => {
  if (!detailId) {
   setDetailRow(null)
   return
  }
  setDetailLoading(true)
  void getScheduleById(detailId)
   .then(setDetailRow)
   .finally(() => setDetailLoading(false))
 }, [detailId])

 useEffect(() => {
  if (!expandedScheduleId) {
   setListStudents([])
   setListLeaveStudents([])
   setListTrialStudents([])
   setListMakeupStudents([])
   setListNotEnrolledStudents([])
   return
  }
  const r = rows.find((x) => x.id === expandedScheduleId)
  if (!r) return
  if (!r.class_id) {
   setListStudents([])
   setListLeaveStudents([])
   setListTrialStudents([])
   setListMakeupStudents([])
   setListNotEnrolledStudents([])
   setListStudentsLoading(false)
   return
  }
  setListStudentsLoading(true)
  const classId = r.class_id
  const scheduleId = r.id
  const scheduleDate = r.scheduled_date
  void Promise.all([
   fetchClassStudents(classId, {
    scheduleDate,
    scheduleId,
    activeOnly: true,
   }),
   fetchLeaveStudentsForSchedule(scheduleId, classId, scheduleDate),
   fetchTrialStudentsForSchedule(scheduleId),
   fetchMakeupStudentsForSchedule(scheduleId),
   fetchSingleSessionNotOnSchedule(classId, scheduleId),
  ])
   .then(([enrolled, leave, trial, makeup, notEnrolled]) => {
    setListStudents(enrolled)
    setListLeaveStudents(leave)
    setListTrialStudents(
     trial.map((st) => ({
      studentId: st.studentId,
      fullName: st.fullName,
      contactPhone: st.contactPhone,
     }))
    )
    setListMakeupStudents(makeup)
    setListNotEnrolledStudents(notEnrolled)
   })
   .finally(() => setListStudentsLoading(false))
 }, [expandedScheduleId, rows])

 useEffect(() => {
  setExpandedScheduleId(null)
 }, [effectiveViewMode])

 useEffect(() => {
  if (!addOpen) return
  void fetchAllClasses().then((all) => {
   const scoped = teacherScopeId ? all.filter((c) => c.teacher_id === teacherScopeId) : all
   setAddClassRecords(scoped)
   setClassPickList(
    scoped.map((c) => ({
     id: c.id,
     label: formatClassLabel({
      subject: c.subject,
      courseCode: c.course_code_full,
      courseName: c.course_name,
     }),
    }))
   )
   setAddClassId((prev) => {
    if (prev && scoped.some((c) => c.id === prev)) return prev
    return scoped[0]?.id || ""
   })
  })
 }, [addOpen, teacherScopeId])

 useEffect(() => {
  if (!addOpen || !addClassId || !addDate) {
   setAddConflicts([])
   return
  }
  const cls = addClassRecords.find((c) => c.id === addClassId)
  const teacherId = cls?.teacher_id ?? null
  if (!teacherId) {
   setAddConflicts([])
   return
  }
  let start = addStart || null
  let end = addEnd || null
  if (!start && cls?.time_slot) {
   const bounds = parseTimeSlotBounds(cls.time_slot)
   start = bounds.start
   if (isConsecutiveClass(cls.lesson_slots_per_session)) {
    const pair = consecutivePairFromFirstTimeSlot(cls.time_slot)
    end = pair ? pair.slot2.end : bounds.end
   } else {
    end = bounds.end
   }
  }
  if (!start) {
   setAddConflicts([])
   return
  }
  let cancelled = false
  void fetchTeacherScheduleConflicts({
   teacherId,
   scheduledDate: addDate,
   startTime: start,
   endTime: end,
  })
   .then((list) => {
    if (!cancelled) setAddConflicts(list)
   })
   .catch(() => {
    if (!cancelled) setAddConflicts([])
   })
  return () => {
   cancelled = true
  }
 }, [addOpen, addClassId, addDate, addStart, addEnd, addClassRecords])

useEffect(() => {
 if (!teacherScopeId) {
  setTeacherScopeName("專班老師")
  return
 }
 void getTeacherById(teacherScopeId)
  .then((t) => setTeacherScopeName(t?.full_name?.trim() || "專班老師"))
  .catch(() => setTeacherScopeName("專班老師"))
}, [teacherScopeId])

 const teacherOptions = useMemo(() => {
  const m = new Map<string, string>()
  let hasUnassigned = false
  for (const r of rows) {
   if (!r.teacher_id) {
    hasUnassigned = true
    continue
   }
   const label = r.teacher_name?.trim() || "未命名老師"
   if (!m.has(r.teacher_id)) m.set(r.teacher_id, label)
  }
  const list = [...m.entries()]
   .map(([id, label]) => ({ id, label }))
   .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
  if (hasUnassigned) list.push({ id: UNASSIGNED_TEACHER_ID, label: "未指派" })
  return list
 }, [rows])

 const canManageSchedules = isMgmtStaff()
 const canAssignSubstitute = isAdmin()
 const scheduleMgmtLocked = !canManageSchedules
 const scheduleRowLocked = useCallback(
  (s: { scheduled_date: string }) =>
   scheduleMgmtLocked || !canEditAcademicYearForDate(s.scheduled_date),
  [scheduleMgmtLocked]
 )

 const issueFilterOptions = useMemo(
  () =>
   teacherScopeId
    ? ISSUE_FILTER_OPTIONS.filter((o) => TEACHER_ISSUE_FILTER_IDS.has(o.id))
    : ISSUE_FILTER_OPTIONS,
  [teacherScopeId]
 )

 const effectiveIssueFilters = useMemo(
  () =>
   teacherScopeId
    ? issueFilters.filter((id) => TEACHER_ISSUE_FILTER_IDS.has(id))
    : issueFilters,
  [teacherScopeId, issueFilters]
 )

 const effectiveTeacherFilterIds = useMemo(
  () => (teacherScopeId ? [] : teacherFilterIds),
  [teacherScopeId, teacherFilterIds]
 )

 const filtered = useMemo(() => {
  const issues = new Set(effectiveIssueFilters)
  const teacherSet = new Set(effectiveTeacherFilterIds)
  return rows.filter((r) => {
   if (quickFilter === "cancelled" && !r.status.includes("取消")) return false
   if (statusFilter !== "all" && r.status !== statusFilter) return false
   if (issues.has("noEnroll") && r.enrollCount > 0) return false
   if (issues.has("private") && r.class_kind !== "private") return false
   if (issues.has("noRoom") && r.classroom_id != null) return false
   if (teacherSet.size > 0) {
    const key = r.teacher_id ?? UNASSIGNED_TEACHER_ID
    if (!teacherSet.has(key)) return false
   }
   return true
  })
 }, [rows, quickFilter, statusFilter, effectiveIssueFilters, effectiveTeacherFilterIds])

 const rollCallTarget = useMemo(() => {
  if (!rollCallScheduleId) return null
  const schedule = rows.find((r) => r.id === rollCallScheduleId)
  if (!schedule?.class_id) return null
  const peers =
   schedule.consecutive_group_id?.trim()
    ? rows.filter(
       (r) =>
        r.scheduled_date === schedule.scheduled_date &&
        r.consecutive_group_id === schedule.consecutive_group_id
      )
    : [schedule]
  const entry = buildRollCallScheduleEntries(peers).find((e) =>
   e.scheduleIds.includes(schedule.id)
  )
  if (!entry) return null
  return { schedule, entry }
 }, [rollCallScheduleId, rows])

 const byDateGroups = useMemo(() => {
  const m = new Map<string, ScheduleManageRow[]>()
  for (const r of filtered) {
   const arr = m.get(r.scheduled_date) ?? []
   arr.push(r)
   m.set(r.scheduled_date, arr)
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
 }, [filtered])

 const dayFiltered = useMemo(
  () => filtered.filter((r) => r.scheduled_date === dayViewDate),
  [filtered, dayViewDate]
 )

 const dayUnfilteredCount = useMemo(
  () => rows.filter((r) => r.scheduled_date === dayViewDate).length,
  [rows, dayViewDate]
 )

 const dayViewFilterActive =
  effectiveTeacherFilterIds.length > 0 ||
  statusFilter !== "all" ||
  quickFilter != null ||
  effectiveIssueFilters.length > 0

 const toggleIssueFilter = useCallback((id: ScheduleIssueFilter) => {
  setIssueFilters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
 }, [setIssueFilters])

 const toggleTeacherFilter = useCallback(
  (id: string) => {
   setTeacherFilterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  },
  [setTeacherFilterIds]
 )

 const clearAllFilters = useCallback(() => {
  setTeacherFilterIds([])
  setStatusFilter("all")
  setQuickFilter(null)
  setIssueFilters([])
 }, [setTeacherFilterIds, setStatusFilter, setQuickFilter, setIssueFilters])

 const dayViewDateLoaded = isDateInInclusiveRange(dayViewDate, displayStart, rangeEnd)

 useEffect(() => {
  if (effectiveViewMode !== "day") {
   setDayViewRosterBySchedule(new Map())
   setDayViewLeaveByScheduleId(new Map())
   setDayViewRosterLoading(false)
   return
  }
  if (dayFiltered.length === 0) {
   setDayViewRosterBySchedule(new Map())
   setDayViewLeaveByScheduleId(new Map())
   setDayViewRosterLoading(false)
   return
  }
  let cancelled = false
  setDayViewRosterLoading(true)
  void Promise.all([
   fetchDayViewRosterBySchedules(dayFiltered),
   fetchLeaveInfoForSchedules(dayFiltered),
  ])
   .then(([rosterMap, leaveMap]) => {
    if (cancelled) return
    setDayViewRosterBySchedule(rosterMap)
    setDayViewLeaveByScheduleId(leaveMap)
   })
   .catch((e) => {
    if (cancelled) return
    reportUserFacingError(e, { source: "ScheduleManagePage.dayViewRoster" })
    setDayViewRosterBySchedule(new Map())
    setDayViewLeaveByScheduleId(new Map())
   })
   .finally(() => {
    if (!cancelled) setDayViewRosterLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [effectiveViewMode, dayFiltered])

 const dayViewRoster = useMemo(() => {
  const m = new Map<string, string[]>()
  for (const [scheduleId, students] of dayViewRosterBySchedule.entries()) {
   m.set(
    scheduleId,
    students.map((st) => st.fullName)
   )
  }
  return m
 }, [dayViewRosterBySchedule])

 /** 日視圖細分標籤與灰卡；名單未就緒時不標灰／不推斷空班，避免誤判 */
 const { emptyScheduleIds, extraTagsByScheduleId } = useMemo(() => {
  const emptyIds = new Set<string>()
  const tagsById = new Map<string, string[]>()
  if (dayViewRosterLoading) return { emptyScheduleIds: emptyIds, extraTagsByScheduleId: tagsById }

  for (const s of dayFiltered) {
   const hasTrial = alerts.get(s.id)?.trial ?? false
   const hasMakeupTarget = alerts.get(s.id)?.makeup ?? false
   const roster = dayViewRosterBySchedule.get(s.id) ?? []
   const leave = dayViewLeaveByScheduleId.get(s.id) ?? EMPTY_LEAVE_SNAPSHOT
   const leaveAmongRosterCount = roster.filter((st) => leave.studentIds.has(st.studentId)).length
   const tagInput = {
    rosterCount: roster.length,
    leaveAmongRosterCount,
    hasTrial,
    hasMakeupTarget,
    hasOnlineMakeup: leave.hasOnlineMakeup,
    hasRecordMakeup: leave.hasRecordMakeup,
   }
   tagsById.set(s.id, buildDayViewExtraTags(tagInput))
   if (isDayViewIdleCard(tagInput)) emptyIds.add(s.id)
  }
  return { emptyScheduleIds: emptyIds, extraTagsByScheduleId: tagsById }
 }, [dayFiltered, dayViewRosterBySchedule, dayViewLeaveByScheduleId, alerts, dayViewRosterLoading])

 const roomColumns = useMemo(
  () => classroomsActiveOnDate(rooms, dayViewDate),
  [rooms, dayViewDate]
 )

 const activeRoomIdSet = useMemo(() => new Set(roomColumns.map((r) => r.id)), [roomColumns])

 /** 日視圖課室表：table-fixed 下均分課室欄寬 */
 const dayViewRoomColPct = useMemo(() => {
  const n = roomColumns.length + 1
  const timePct = 8
  const each = n > 0 ? (100 - timePct) / n : 46
  return { timePct, each }
 }, [roomColumns.length])

 const roomLabel = useCallback(
  (id: string | null) => {
   if (!id) return "未編課室"
   return rooms.find((r) => r.id === id)?.name ?? roomOptions.find((r) => r.id === id)?.label ?? "—"
  },
  [rooms, roomOptions]
 )

 const inactiveRoomNameForSchedule = useCallback(
  (s: ScheduleManageRow) => {
   const rid = s.classroom_id
   if (!rid || activeRoomIdSet.has(rid)) return null
   return s.classroom_name ?? roomLabel(rid)
  },
  [activeRoomIdSet, roomLabel]
 )

 const handleDayViewDateChange = useCallback(
  (ymd: string) => {
   setDayViewDate(ymd)
   if (!isDateInInclusiveRange(ymd, displayStart, rangeEnd)) {
    setDisplayStart(ymd)
   }
  },
  [displayStart, rangeEnd]
 )

 const shiftDayViewDate = useCallback(
  (delta: number) => {
   handleDayViewDateChange(addDaysYmd(dayViewDate, delta))
  },
  [dayViewDate, handleDayViewDateChange]
 )

 const proposeScheduleMove = useCallback(
  (row: ScheduleManageRow, roomId: string | null, slotIndex: number) => {
   if (scheduleMgmtLocked || scheduleRowLocked(row)) return
   const d = durationMinForSchedule(row)
   const { start: newStart, end: newEnd } = snapTimesToStandardSlot(slotIndex, d)
   const sameRoom = (row.classroom_id ?? null) === roomId
   const sameTime = row.start_time === newStart && row.end_time === newEnd
   if (sameRoom && sameTime) return
   setMoveErr(null)
   setPendingMove({
    row,
    newRoomId: roomId,
    newStart,
    newEnd,
    roomLabel: roomLabel(roomId),
    alignedToStandard: !isStandardSchedulePlacement(row),
   })
  },
  [scheduleMgmtLocked, scheduleRowLocked, roomLabel]
 )

 useEffect(() => {
  if (!pendingMove) {
   setMoveConflicts([])
   setMoveRemoteBlocked(null)
   setMoveChecking(false)
   return
  }
  const local = findScheduleRoomConflicts(dayFiltered, {
   excludeId: pendingMove.row.id,
   scheduledDate: dayViewDate,
   roomId: pendingMove.newRoomId,
   startTime: pendingMove.newStart,
   endTime: pendingMove.newEnd,
  })
  setMoveConflicts(local)

  if (!pendingMove.newRoomId) {
   setMoveRemoteBlocked(false)
   setMoveChecking(false)
   return
  }

  let cancelled = false
  setMoveChecking(true)
  void slotIsFreeForBooking({
   classroomId: pendingMove.newRoomId,
   scheduledDate: dayViewDate,
   startTime: pendingMove.newStart,
   endTime: pendingMove.newEnd,
   excludeScheduleId: pendingMove.row.id,
  })
   .then((free) => {
    if (!cancelled) {
     setMoveRemoteBlocked(!free)
     setMoveChecking(false)
    }
   })
   .catch(() => {
    if (!cancelled) {
     setMoveRemoteBlocked(null)
     setMoveChecking(false)
    }
   })
  return () => {
   cancelled = true
  }
 }, [pendingMove, dayFiltered, dayViewDate])

 const exportCsv = () => {
  const header = ["日期", "班別", "代碼", "開始", "結束", "老師", "位置", "狀態", "報讀人數", "教學紀錄"]
  const lines = [
   header.join(","),
   ...filtered.map((r) =>
    [
     r.scheduled_date,
     `"${r.classLabel.replace(/"/g, '""')}"`,
     r.course_code_full ?? "",
     r.start_time ?? "",
     r.end_time ?? "",
     `"${(r.teacher_name ?? "").replace(/"/g, '""')}"`,
     `"${(r.classroom_name ?? "").replace(/"/g, '""')}"`,
     r.status,
     String(r.enrollCount),
     `"${(r.teaching_notes ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    ].join(",")
   ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `schedules-${displayStart}-${rangeEnd}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
 }

 const openAdd = () => {
  if (scheduleMgmtLocked) return
  setAddErr(null)
  setAddDate(displayStart)
  setAddStart("")
  setAddEnd("")
  setAddExtra(false)
  setAddOpen(true)
 }

 const submitAdd = async () => {
  if (scheduleMgmtLocked) return
  if (!addClassId) {
   setAddErr("請選擇班別")
   return
  }
  if (!canEditAcademicYearForDate(addDate)) {
   setAddErr(academicYearEditBlockedMessage())
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
    classroom_id: cls?.classroom_id ?? null,
    is_extra_lesson: addExtra,
   })
   setAddOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "ScheduleManagePage.submitAdd", setErr: setAddErr })
  } finally {
   setAddSaving(false)
  }
 }

 const handleDropOnCell = (e: React.DragEvent, roomId: string | null, slotIndex: number) => {
  if (scheduleMgmtLocked) return
  e.preventDefault()
  const raw = e.dataTransfer.getData("application/json")
  if (!raw) return
  let parsed: { id?: string }
  try {
   parsed = JSON.parse(raw) as { id?: string }
  } catch {
   return
  }
  const id = parsed.id
  if (!id) return
  const row = rows.find((x) => x.id === id)
  if (!row || row.scheduled_date !== dayViewDate) return
  if (scheduleRowLocked(row)) return
  proposeScheduleMove(row, roomId, slotIndex)
 }

 const openMoveDialog = (schedule: ScheduleManageRow) => {
  const roomId = schedule.classroom_id
  const active = roomId && activeRoomIdSet.has(roomId) ? roomId : null
  setMoveDialogSchedule(schedule)
  setMoveDialogRoomKey(active ?? "__none__")
  const slotIdx =
   standardSlotIndexForSchedule(schedule) ??
   (parseHm(schedule.start_time) != null
    ? nearestStandardSlotIndex(parseHm(schedule.start_time)!)
    : 0)
  setMoveDialogSlot(slotIdx)
 }

 const submitMoveDialog = () => {
  if (!moveDialogSchedule) return
  const roomId = moveDialogRoomKey === "__none__" ? null : moveDialogRoomKey
  proposeScheduleMove(moveDialogSchedule, roomId, moveDialogSlot)
  setMoveDialogSchedule(null)
 }

 const confirmMove = async () => {
  if (scheduleMgmtLocked) return
  if (!pendingMove) return
  if (scheduleRowLocked(pendingMove.row)) {
   setMoveErr(academicYearEditBlockedMessage())
   return
  }
  if (moveConflicts.length > 0) {
   setMoveErr("目標時段與同課室其他排程衝突，請選擇其他格或時段。")
   return
  }
  if (moveRemoteBlocked) {
   setMoveErr("目標時段與同課室其他排程或待審約房衝突，請選擇其他格或時段。")
   return
  }
  if (moveChecking) return
  setMoveErr(null)
  setMoveSaving(true)
  try {
   await updateSchedule(pendingMove.row.id, {
    classroom_id: pendingMove.newRoomId,
    start_time: pendingMove.newStart,
    end_time: pendingMove.newEnd,
   })
   setPendingMove(null)
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   setMoveErr(msg)
   reportUserFacingError(e, {
    source: "ScheduleManagePage.confirmMove",
    setErr: setMoveErr,
    userMessage: msg,
   })
  } finally {
   setMoveSaving(false)
  }
 }

 const handleStatusChange = useCallback(
  async (row: ScheduleManageRow, newStatus: string) => {
   if (scheduleRowLocked(row)) return
   if (newStatus === row.status) return
   if (newStatus.includes("取消")) {
    setCancelTarget(row)
    return
   }
   await updateSchedule(row.id, { status: newStatus, cancel_reason: null })
   await reload()
  },
  [scheduleRowLocked, reload]
 )

 const confirmCancelSchedule = useCallback(
  async (reason: string) => {
   if (!cancelTarget) return
   setCancelSaving(true)
   try {
    await updateSchedule(cancelTarget.id, { status: "取消", cancel_reason: reason })
    setCancelTarget(null)
    await reload()
   } catch (e) {
    reportUserFacingError(e, {
     source: "ScheduleManagePage.confirmCancelSchedule",
     setErr: setPageErr,
    })
   } finally {
    setCancelSaving(false)
   }
  },
  [cancelTarget, reload]
 )

 const oneClickAssign = async () => {
  if (scheduleMgmtLocked || assigning || loading) return
  if (!canEditAcademicYearForDate(dayViewDate)) {
   pushBanner({ tone: "warning", title: "無法一鍵分配", message: academicYearEditBlockedMessage() })
   return
  }

  const dayRows = rows.filter((s) => s.scheduled_date === dayViewDate)
  const unassigned = dayRows
   .filter((s) => !s.status.includes("取消"))
   .filter((s) => effectiveRoomId(s, activeRoomIdSet) === null)
   .filter((s) => scheduleIntervalMinutes(s) !== null)
   .filter((s) => !scheduleRowLocked(s))
   .slice()
   .sort((a, b) => (parseHm(a.start_time) ?? 0) - (parseHm(b.start_time) ?? 0))

  if (roomColumns.length === 0) {
   pushBanner({ tone: "warning", title: "本日沒有可分配的課室", message: "此日期沒有開放的實體課室。" })
   return
  }
  if (unassigned.length === 0) {
   pushBanner({ tone: "info", title: "本日沒有未編課室的排程" })
   return
  }

  const ok = await confirmDialog({
   title: "一鍵分配課室",
   description: `本日有 ${unassigned.length} 堂未編課室的排程，將自動填入同時段的空置課室。`,
   confirmText: "開始分配",
  })
  if (ok !== true) return

  setAssigning(true)
  try {
   const occupancy = new Map<string, { start: number; end: number }[]>()
   for (const r of roomColumns) occupancy.set(r.id, [])
   for (const s of dayRows) {
    if (s.status.includes("取消")) continue
    const rid = effectiveRoomId(s, activeRoomIdSet)
    if (!rid) continue
    const iv = scheduleIntervalMinutes(s)
    if (iv) occupancy.get(rid)?.push(iv)
   }

   const assignments: { id: string; roomId: string }[] = []
   for (const s of unassigned) {
    const iv = scheduleIntervalMinutes(s)
    if (!iv) continue
    const startStr = formatMin(iv.start)
    const endStr = formatMin(iv.end)
    for (const room of roomColumns) {
     const occ = occupancy.get(room.id)!
     const hasLocalConflict = occ.some((o) => intervalsOverlapMinutes(iv.start, iv.end, o.start, o.end))
     if (hasLocalConflict) continue
     const free = await slotIsFreeForBooking({
      classroomId: room.id,
      scheduledDate: dayViewDate,
      startTime: startStr,
      endTime: endStr,
      excludeScheduleId: s.id,
     })
     if (!free) continue
     occ.push(iv)
     assignments.push({ id: s.id, roomId: room.id })
     break
    }
   }

   for (const a of assignments) {
    await updateSchedule(a.id, { classroom_id: a.roomId })
   }
   await reload()

   const assignedCount = assignments.length
   const remaining = unassigned.length - assignedCount
   if (assignedCount === 0) {
    pushBanner({
     tone: "warning",
     title: "一鍵分配未能分配任何排程",
     message: "同時段的課室皆已被佔用。",
    })
   } else {
    pushBanner({
     tone: "success",
     title: `已分配 ${assignedCount} 堂課室`,
     message: remaining > 0 ? `尚有 ${remaining} 堂因同時段無空置課室而未分配。` : undefined,
    })
   }
  } catch (e) {
   reportUserFacingError(e, {
    source: "ScheduleManagePage.oneClickAssign",
    setErr: setPageErr,
    userMessage: "一鍵分配失敗",
   })
  } finally {
   setAssigning(false)
  }
 }

 const jumpToday = () => {
  setDisplayStart(todayYmd)
  setDayViewDate(todayYmd)
  setQuickFilter(null)
  setViewMode("day")
 }

 const onTodayCardClick = () => {
  setDisplayStart(todayYmd)
  setDayViewDate(todayYmd)
  setQuickFilter(null)
  setViewMode("day")
 }

 const onPendingCardClick = () => {
  setQuickFilter((q) => (q === "cancelled" ? null : "cancelled"))
 }

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 const dayUnassignedCount = rows.filter(
  (s) =>
   s.scheduled_date === dayViewDate &&
   !s.status.includes("取消") &&
   effectiveRoomId(s, activeRoomIdSet) === null
 ).length

 return (
  <div className="space-y-5 text-sm leading-relaxed">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <CalendarDays className="h-6 w-6 shrink-0 text-info" aria-hidden />
      排程管理
      <Tag tone="info">{stats.todayLessonCount} 堂今日</Tag>
     </h1>
     <p className="mt-2 hidden text-sm text-muted-foreground md:block">
      按日期／列表可點擊卡片展開班內學生、請假學生與試堂學生；日視圖可拖曳或「移動到…」調整課室與時間（需確認），亦可一鍵分配未編課室的排程。日視圖學生列為上堂名單（報讀＋試堂＋補堂），並以標籤標示無人報讀、所有學生請假、請假生、試堂生、網課生、要錄影；實際不用上堂的排程以灰色淡化。非標準時間排程會顯示於「其他時段」列。日視圖以每格{" "}
      <strong>75 分鐘</strong>（09:00 起）對齊。
     </p>
    </div>
   </header>

   {teacherScopeId ? (
   <div className="rounded-xl border border-info bg-info/90 px-4 py-3 text-sm text-info-foreground">
     你正以<strong>{teacherScopeName}</strong>身分瀏覽：僅顯示指派給您的排程與統計。
    </div>
   ) : null}

   {pageErr ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {pageErr}
    </div>
   ) : null}

   <section className="grid grid-cols-3 gap-2 md:gap-4" aria-label="排程概覽">
    <button
     type="button"
     onClick={onTodayCardClick}
     className={cn(
      "rounded-xl border bg-card p-2.5 text-left shadow-sm transition-all duration-200 md:p-6",
      "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      displayStart === todayYmd && quickFilter == null ? "ring-2 ring-info/50" : "border-border"
     )}
    >
     <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground md:gap-2 md:text-sm">
      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-info md:h-5 md:w-5" />
      <span className="truncate">今日課堂</span>
     </div>
     <p className="mt-1 text-xl font-bold tabular-nums text-info md:mt-2 md:text-2xl">{stats.todayLessonCount}</p>
     <p className="mt-2 hidden text-sm text-muted-foreground md:block">點擊將列表起始日設為今天</p>
    </button>

    <button
     type="button"
     onClick={onPendingCardClick}
     className={cn(
      "rounded-xl border bg-card p-2.5 text-left shadow-sm transition-all duration-200 md:p-6",
      "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
      quickFilter === "cancelled" ? "ring-2 ring-destructive/60" : "border-border"
     )}
    >
     <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground md:gap-2 md:text-sm">
      <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive md:h-5 md:w-5" />
      <span className="truncate">待處理</span>
     </div>
     <p className="mt-1 text-xl font-bold tabular-nums text-destructive md:mt-2 md:text-2xl">{stats.pendingCancelledCount}</p>
     <p className="mt-2 hidden text-sm text-muted-foreground md:block">點擊篩選「已取消」排程（再點一次還原）</p>
    </button>

    <button
     type="button"
     onClick={onTodayCardClick}
     className={cn(
      "rounded-xl border bg-card p-2.5 text-left shadow-sm transition-all duration-200 md:p-6",
      "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40",
      "border-border"
     )}
    >
     <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground md:gap-2 md:text-sm">
      <Users className="h-3.5 w-3.5 shrink-0 text-success md:h-5 md:w-5" />
      <span className="truncate">上堂學生</span>
     </div>
     <p className="mt-1 text-xl font-bold tabular-nums text-success md:mt-2 md:text-2xl">{stats.todayStudentHeadcount}</p>
     <p className="mt-2 hidden text-sm text-muted-foreground md:block">依今天課表班別加總報讀人數</p>
    </button>
   </section>

   <p className="hidden rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 md:block">
    <span className="font-medium">提醒：</span>
    按日期／列表的圖示：鈴鐺為總覽；學士帽＝試堂、循環箭頭＝請假／補堂、攝影機＝備註需錄影、叉圈＝請假（滑鼠停上可看說明）。日視圖改以文字標籤標示無人報讀、所有學生請假、請假生、試堂生、網課生、要錄影。
   </p>

   <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
     <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <Select
       className="h-10 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-info/60"
       value={statusFilter}
       onChange={(e) => setStatusFilter(e.target.value)}
      >
       <option value="all">全部狀態</option>
       <option value="正常">正常</option>
       <option value="完成">完成</option>
       <option value="取消">取消</option>
      </Select>
      {issueFilterOptions.length > 0 ? (
       <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="進階篩選"
       >
        {issueFilterOptions.map(({ id, label, icon: Icon }) => {
         const active = effectiveIssueFilters.includes(id)
         return (
          <button
           key={id}
           type="button"
           aria-pressed={active}
           onClick={() => toggleIssueFilter(id)}
           className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all",
            active
             ? "border-info bg-info/10 text-info ring-1 ring-info/40"
             : "border-input bg-background text-muted-foreground hover:border-info/60 hover:text-foreground"
           )}
          >
           <Icon className="h-4 w-4 shrink-0" aria-hidden />
           {label}
          </button>
         )
        })}
       </div>
      ) : null}
     </div>

     <div className="flex flex-wrap items-center gap-2">
      <div
       className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
       role="tablist"
       aria-label="檢視模式"
      >
       {(
        [
         { id: "byDate" as const, label: "按日期", icon: LayoutGrid },
         ...(!isMobile
          ? ([
             { id: "list" as const, label: "列表", icon: List },
             { id: "day" as const, label: "日視圖", icon: CalendarDays },
            ] as const)
          : []),
        ] as const
       ).map(({ id, label, icon: Icon }) => (
        <button
         key={id}
         type="button"
         role="tab"
         aria-selected={effectiveViewMode === id}
         onClick={() => setViewMode(id)}
         className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
          effectiveViewMode === id
           ? "bg-primary text-primary-foreground shadow-sm"
           : "text-muted-foreground hover:bg-background hover:text-foreground"
         )}
        >
         <Icon className="h-4 w-4 shrink-0" aria-hidden />
         {label}
        </button>
       ))}
      </div>
      <Button
       type="button"
       variant="outline"
       size="default"
       className="gap-1.5 text-sm transition-all hover:bg-muted"
       onClick={exportCsv}
      >
       <Download className="h-4 w-4" />
       匯出
      </Button>
      <Button
       type="button"
       size="default"
       className="gap-1.5 bg-info text-sm text-white shadow-sm hover:bg-info"
       disabled={scheduleMgmtLocked}
       onClick={openAdd}
      >
       <Plus className="h-4 w-4" />
       新增排程
      </Button>
     </div>
    </div>

    {!teacherScopeId && teacherOptions.length > 0 ? (
     <div
      className="flex max-h-28 min-w-0 flex-wrap items-center gap-1.5 overflow-y-auto border-t border-border/70 pt-3"
      role="group"
      aria-label="老師篩選"
     >
      <span className="mr-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
       <User className="h-4 w-4 shrink-0" aria-hidden />
       老師
      </span>
      {teacherOptions.map(({ id, label }) => {
       const active = effectiveTeacherFilterIds.includes(id)
       return (
        <button
         key={id}
         type="button"
         aria-pressed={active}
         onClick={() => toggleTeacherFilter(id)}
         className={cn(
          "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-all",
          active
           ? "border-info bg-info/10 text-info ring-1 ring-info/40"
           : "border-input bg-background text-muted-foreground hover:border-info/60 hover:text-foreground"
         )}
        >
         {label}
        </button>
       )
      })}
     </div>
    ) : null}
   </div>

   {isMobile && (viewMode === "list" || viewMode === "day" || searchParams.get("view") === "day") ? (
    <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
     列表與日視圖建議使用桌面版；手機已改為「按日期」顯示。
    </p>
   ) : null}

   <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm">
    {effectiveViewMode === "day" ? (
     <>
      <div className="flex flex-wrap items-center gap-2">
       <span className="text-sm font-medium text-muted-foreground">日視圖日期</span>
       <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        aria-label="前一日"
        onClick={() => shiftDayViewDate(-1)}
       >
        <ChevronLeft className="h-5 w-5" aria-hidden />
       </Button>
       <Input
        type="date"
        value={dayViewDate}
        onChange={(e) => handleDayViewDateChange(e.target.value)}
        className="h-10 w-[12rem] cursor-pointer text-sm"
       />
       <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        aria-label="後一日"
        onClick={() => shiftDayViewDate(1)}
       >
        <ChevronRight className="h-5 w-5" aria-hidden />
       </Button>
       <Button
        type="button"
        variant="outline"
        size="default"
        className="border-amber-400/80 text-sm text-amber-900 hover:bg-amber-50"
        onClick={jumpToday}
       >
        今天
       </Button>
       <Button
        type="button"
        size="default"
        className="gap-1.5 bg-info text-sm text-white shadow-sm hover:bg-info"
        disabled={scheduleMgmtLocked || assigning || loading}
        onClick={() => void oneClickAssign()}
       >
        <Wand2 className="h-4 w-4" aria-hidden />
        {assigning ? "分配中…" : "一鍵分配"}
       </Button>
      </div>
      <div className="text-right">
       <span className="tabular-nums text-muted-foreground">
        {loading
         ? "載入中…"
         : !dayViewDateLoaded
          ? `正在載入 ${dayViewDate} 的排程…`
          : dayViewRosterLoading
           ? `本日 ${dayFiltered.length} 堂 · 學生名單更新中…`
           : `本日 ${dayFiltered.length} 堂`}
       </span>
       {!loading && dayViewDateLoaded && dayUnassignedCount > 0 ? (
        <p className="mt-0.5 text-sm text-warning">未編課室 {dayUnassignedCount} 堂</p>
       ) : null}
       {dayViewFilterActive && dayUnfilteredCount > dayFiltered.length ? (
        <p className="mt-0.5 text-sm text-warning">
         已套用篩選（本日共 {dayUnfilteredCount} 堂，顯示 {dayFiltered.length} 堂）
        </p>
       ) : null}
      </div>
     </>
    ) : (
     <>
      <div className="flex flex-wrap items-center gap-2">
       <span className="text-muted-foreground">顯示起始日期：</span>
       <Input
        type="date"
        value={displayStart}
        onChange={(e) => setDisplayStart(e.target.value)}
        className="h-10 w-[12rem] cursor-pointer text-sm"
       />
       <Button
        type="button"
        variant="outline"
        size="default"
        className="border-amber-400/80 text-sm text-amber-900 hover:bg-amber-50"
        onClick={jumpToday}
       >
        回到今天
       </Button>
      </div>
      <span className="tabular-nums text-muted-foreground">
       {loading ? "載入中…" : `顯示 ${filtered.length} 個排程`}
      </span>
     </>
    )}
   </div>

   {effectiveViewMode === "day" && scheduleMgmtLocked ? (
    <p className="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
     你目前僅能檢視日視圖；拖曳、「移動到…」與一鍵分配需管理員權限。
    </p>
   ) : null}

   {effectiveViewMode === "day" && dayViewFilterActive ? (
    <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
     日視圖已套用上方搜尋或篩選條件。
     <button
      type="button"
      className="ml-2 font-medium underline hover:no-underline"
      onClick={clearAllFilters}
     >
      清除篩選
     </button>
    </p>
   ) : null}

   {effectiveViewMode === "byDate" ? (
    <div className="space-y-6">
     {byDateGroups.map(([dateYmd, list]) => {
      const isToday = dateYmd === todayYmd
      const isRangeStart = dateYmd === displayStart
      const isHighlightDay = isToday || isRangeStart
      return (
       <section
        key={dateYmd}
        className={cn(
         "space-y-3 rounded-xl p-3 shadow-sm",
         isHighlightDay
          ? "border-2 border-amber-400 bg-amber-50/50"
          : "border border-border bg-card"
        )}
       >
        <div
         className={cn(
          "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2",
          isHighlightDay
           ? "border-amber-300/90 bg-amber-100/60"
           : "border-border bg-muted/30"
         )}
        >
         <CalendarDays
          className={cn("h-4 w-4 shrink-0", isHighlightDay ? "text-amber-800" : "text-muted-foreground")}
          aria-hidden
         />
         <span className="text-lg font-semibold tabular-nums text-foreground md:text-xl">{dateYmd}</span>
         {isToday ? (
          <Tag tone="warning" size="sm">今天</Tag>
         ) : isRangeStart ? (
          <Tag tone="warning" size="sm">起始日</Tag>
         ) : null}
         <span className="text-base text-muted-foreground">{list.length} 堂</span>
        </div>
        <ul className="space-y-2">
         {list.map((s) => {
          const a = alerts.get(s.id) ?? {
           trial: false,
           makeup: false,
           leave: false,
           record: false,
          }
          const open = expandedScheduleId === s.id
          const classMetaParts = [s.class_day_of_week, s.class_time_slot].filter(Boolean)
          const hasAttendees =
           s.enrollCount > 0 || a.makeup || a.trial || (rollCallEligibleIds?.has(s.id) ?? false)
          const emptyEnrollOnly = s.enrollCount === 0 && !a.makeup && !a.trial
          return (
           <li
            key={s.id}
            className={cn(
             "overflow-hidden rounded-xl border border-border shadow-sm transition-shadow hover:shadow-md",
             !hasAttendees ? "border-border/80 bg-muted/70" : "bg-card"
            )}
           >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
             <button
              type="button"
              className="min-w-0 flex-1 rounded-lg text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/50"
              aria-expanded={open}
              onClick={() =>
               setExpandedScheduleId((id) => (id === s.id ? null : s.id))
              }
             >
              <div className="flex flex-wrap items-center gap-2">
               <span className="text-lg font-semibold text-foreground md:text-xl">
                {s.classLabel}
                {s.course_code_full ? (
                 <span className="font-mono text-sm text-muted-foreground">
                  {" "}
                  ({s.course_code_full})
                 </span>
                ) : null}
               </span>
               <Tag tone={statusToTagTone(s.status)} size="sm">
                {s.status}
               </Tag>
               {emptyEnrollOnly ? (
                <Tag tone={statusToTagTone("暫未有學生報讀")} size="sm">
                 暫未有學生報讀
                </Tag>
               ) : null}
               {s.enrollCount === 0 && (a.makeup || a.trial) ? (
                <Tag tone={statusToTagTone(a.makeup ? "補堂" : "試堂")} size="sm">
                 {a.makeup && a.trial ? "補堂／試堂" : a.makeup ? "有補堂生" : "有試堂生"}
                </Tag>
               ) : null}
               {s.is_extra_lesson ? (
                <Tag tone={statusToTagTone("加堂")} size="sm">加堂</Tag>
               ) : null}
               {(() => {
                const subTag = formatScheduleSubstituteTag(s, teacherScopeId)
                return subTag ? (
                 <Tag tone={statusToTagTone(subTag)} size="sm">
                  {subTag}
                 </Tag>
                ) : null
               })()}
               <ScheduleAlertIcons alerts={a} />
              </div>
              {s.status.includes("取消") && s.cancel_reason ? (
               <p className="mt-1 text-sm text-muted-foreground">
                取消原因：{s.cancel_reason}
               </p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
               <span className="tabular-nums">
                {s.start_time ?? "—"}–{s.end_time ?? "—"}
               </span>
               <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4 shrink-0" aria-hidden />
                {s.teacher_name ?? "—"}
               </span>
               <span className="inline-flex items-center gap-1">
                <DoorOpen className="h-4 w-4 shrink-0" aria-hidden />
                位置：{s.classroom_name?.trim() ? s.classroom_name : "未定"}
               </span>
               <span
                className={cn(
                 "inline-flex items-center gap-1",
                 !hasAttendees ? "text-muted-foreground" : "text-info"
                )}
               >
                <Users className="h-4 w-4 opacity-70" aria-hidden />
                {s.enrollCount} 人報讀
               </span>
               {s.teaching_notes?.trim() ? (
                <Tag tone="info" size="sm">
                 已有教學紀錄
                </Tag>
               ) : null}
              </div>
             </button>
             <div
              className="flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
             >
              <Select
               className="h-11 max-w-[10rem] rounded-md border border-input bg-background px-2 text-sm transition-colors hover:border-info/50"
               value={s.classroom_id ?? ""}
               disabled={scheduleRowLocked(s)}
               onChange={async (e) => {
                if (scheduleRowLocked(s)) return
                const v = e.target.value || null
                await updateSchedule(s.id, { classroom_id: v })
                await reload()
               }}
              >
               <option value="">課室未定</option>
               {roomOptions.map((o) => (
                <option key={o.id} value={o.id}>
                 {o.label}
                </option>
               ))}
              </Select>
              <Select
               className="h-11 rounded-md border border-input bg-background px-2 text-sm font-medium text-info transition-colors hover:border-info/50"
               value={s.status}
               disabled={scheduleRowLocked(s)}
               onChange={(e) => void handleStatusChange(s, e.target.value)}
              >
               <option value="正常">正常</option>
               <option value="完成">完成</option>
               <option value="取消">取消</option>
              </Select>
              {canManageSchedules ? (
               <>
              <Link
               to="/LeaveManagement"
              className="rounded-md border border-warning px-3 py-2 text-sm font-medium text-warning transition-colors hover:bg-warning hover:text-warning-foreground"
               onClick={(e) => e.stopPropagation()}
              >
               +請假
              </Link>
              <Link
               to="/TrialSessions"
              className="rounded-md border border-info px-3 py-2 text-sm font-medium text-info transition-colors hover:bg-info hover:text-info-foreground"
               onClick={(e) => e.stopPropagation()}
              >
               +補堂試堂
              </Link>
               </>
              ) : null}
              {canAssignSubstitute ? (
               <Button
                type="button"
                variant="outline"
                size="default"
                className="h-11 text-base"
                onClick={(e) => {
                 e.stopPropagation()
                 setSubstituteTarget(s)
                }}
               >
                {s.original_teacher_id ? "更改代堂" : "指派代堂"}
               </Button>
              ) : null}
              <Button
               type="button"
               size="default"
               className="h-11 gap-1.5 bg-success px-3 text-base text-white hover:bg-success disabled:opacity-50"
               disabled={!canOpenRollCall(s.id)}
               title={canOpenRollCall(s.id) ? undefined : "暫無可點名學生"}
               onClick={(e) => {
                e.stopPropagation()
                openRollCallForSchedule(s.id)
               }}
              >
               <Check className="h-4 w-4" aria-hidden />
               確定點名
              </Button>
              {canManageSchedules ? (
              <Button
               type="button"
               variant="ghost"
               size="icon"
               className="h-11 w-11 text-destructive hover:bg-destructive/10"
               disabled={scheduleRowLocked(s)}
               aria-label="刪除排程"
               onClick={async () => {
               if (scheduleRowLocked(s)) return
               if (!(await confirmDialog({ title: "刪除排程", description: "確定刪除此排程？", confirmText: "確認刪除", tone: "destructive" }))) return
                await deleteSchedule(s.id)
                await reload()
               }}
              >
               ×
              </Button>
              ) : null}
              <Button
               type="button"
               variant="ghost"
               size="icon"
               className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-muted"
               aria-expanded={open}
               aria-label={open ? "收合詳情" : "展開詳情"}
               onClick={() =>
                setExpandedScheduleId((id) => (id === s.id ? null : s.id))
               }
              >
               {open ? (
                <ChevronUp className="h-5 w-5" aria-hidden />
               ) : (
                <ChevronDown className="h-5 w-5" aria-hidden />
               )}
              </Button>
             </div>
            </div>
            {open ? (
             <div className="border-t border-border bg-success/25 px-4 py-4 md:px-5">
              <ExpandedScheduleRoster
               schedule={s}
               schedulePeers={rows}
               loading={listStudentsLoading}
               enrolled={listStudents}
               leave={listLeaveStudents}
               trial={listTrialStudents}
               makeup={listMakeupStudents}
               notEnrolled={listNotEnrolledStudents}
               classMeta={
                <div className="space-y-2">
                 <p className="text-sm font-medium text-info">
                  班別：{s.classLabel}
                  {s.course_code_full ? `（${s.course_code_full}）` : ""}
                  {classMetaParts.length > 0 ? ` · ${classMetaParts.join(" ")}` : ""}
                 </p>
                 <p className="text-sm text-muted-foreground">
                  位置：{s.classroom_name?.trim() ? s.classroom_name : "未定"}
                 </p>
                 {s.teaching_notes?.trim() ? (
                  <div className="rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-sm">
                   <p className="text-xs font-medium text-info">教學紀錄</p>
                   <p className="mt-1 whitespace-pre-wrap text-foreground">{s.teaching_notes}</p>
                  </div>
                 ) : null}
                </div>
               }
               footer={
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                 <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="text-base"
                  onClick={() => setDetailId(s.id)}
                 >
                  快速檢視
                 </Button>
                 <Button type="button" variant="outline" size="default" className="text-base" asChild>
                  <Link to={`/Schedule/${s.id}`}>完整排程頁</Link>
                 </Button>
                 {s.class_id ? (
                  <Button type="button" variant="outline" size="default" className="text-base" asChild>
                   <Link to={`/Classes/${s.class_id}`}>班別詳情</Link>
                  </Button>
                 ) : null}
                </div>
               }
              />
             </div>
            ) : null}
           </li>
          )
         })}
        </ul>
       </section>
      )
     })}
     {byDateGroups.length === 0 ? (
      <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有排程</p>
     ) : null}
    </div>
   ) : null}

   {effectiveViewMode === "list" ? (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[800px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[11%] px-4 py-3 font-medium">日期</th>
        <th className="w-[26%] px-4 py-3 font-medium">班別</th>
        <th className="w-[11%] px-4 py-3 font-medium">時間</th>
        <th className="w-[14%] px-4 py-3 font-medium">老師</th>
        <th className="w-[14%] px-4 py-3 font-medium">位置</th>
        <th className="w-[12%] px-4 py-3 font-medium">狀態</th>
        <th className="w-[12%] px-4 py-3 font-medium">操作</th>
       </tr>
      </thead>
      <tbody>
       {filtered.map((s) => {
        const a = alerts.get(s.id) ?? {
         trial: false,
         makeup: false,
         leave: false,
         record: false,
        }
        const open = expandedScheduleId === s.id
        return (
         <Fragment key={s.id}>
          <tr
           className={cn(
            "cursor-pointer border-b border-border transition-colors hover:bg-info/40",
            open && "bg-info/30"
           )}
           onClick={() => setExpandedScheduleId((id) => (id === s.id ? null : s.id))}
          >
           <td className="min-w-0 align-top px-4 py-3 tabular-nums">
            <div className="flex flex-wrap items-center gap-1.5">
             {s.scheduled_date}
             {s.scheduled_date === todayYmd ? (
              <span className="rounded bg-amber-200 px-1.5 text-xs font-medium text-amber-950">
               今天
              </span>
             ) : null}
             <ScheduleAlertIcons alerts={a} />
            </div>
           </td>
           <td className="min-w-0 align-top px-4 py-3 font-medium">
            <span className="block break-words">{s.classLabel}</span>
            {s.course_code_full ? (
             <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
              ({s.course_code_full})
             </span>
            ) : null}
           </td>
           <td className="min-w-0 align-top px-4 py-3 tabular-nums text-muted-foreground">
            {s.start_time ?? "—"}–{s.end_time ?? "—"}
           </td>
           <td className="min-w-0 align-top px-4 py-3">
            <span className="block break-words">{s.teacher_name ?? "—"}</span>
            {(() => {
             const subTag = formatScheduleSubstituteTag(s, teacherScopeId)
             return subTag ? (
              <Tag tone={statusToTagTone(subTag)} size="sm" className="mt-1">
               {subTag}
              </Tag>
             ) : null
            })()}
           </td>
           <td className="min-w-0 align-top px-4 py-3 text-muted-foreground">
            <span className="block break-words">{s.classroom_name ?? "—"}</span>
            {s.teaching_notes?.trim() ? (
             <Tag tone="info" size="sm" className="mt-1">
              已有教學紀錄
             </Tag>
            ) : null}
           </td>
           <td className="align-top px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <Select
             className="h-10 rounded-md border border-input bg-background px-2 text-sm"
             value={s.status}
             disabled={scheduleRowLocked(s)}
             onChange={(e) => void handleStatusChange(s, e.target.value)}
            >
             <option value="正常">正常</option>
             <option value="完成">完成</option>
             <option value="取消">取消</option>
            </Select>
            {s.is_extra_lesson ? (
             <Tag tone={statusToTagTone("加堂")} size="sm" className="mt-1.5">
              加堂
             </Tag>
            ) : null}
            {s.status.includes("取消") && s.cancel_reason ? (
             <p className="mt-1 text-xs text-muted-foreground" title={s.cancel_reason}>
              原因：{s.cancel_reason}
             </p>
            ) : null}
           </td>
           <td className="min-w-0 align-top px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-2">
             {canManageSchedules ? (
             <Link
              to="/LeaveManagement"
              className="text-sm font-medium text-warning hover:underline"
              onClick={(e) => e.stopPropagation()}
             >
              +請假
             </Link>
             ) : null}
             <button
              type="button"
              className="text-sm font-medium text-success hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              disabled={!canOpenRollCall(s.id)}
              title={canOpenRollCall(s.id) ? undefined : "暫無可點名學生"}
              onClick={(e) => {
               e.stopPropagation()
               openRollCallForSchedule(s.id)
              }}
             >
              確定點名
             </button>
             {canAssignSubstitute ? (
              <Button
               type="button"
               variant="link"
               className="h-auto p-0 text-sm"
               onClick={(e) => {
                e.stopPropagation()
                setSubstituteTarget(s)
               }}
              >
               {s.original_teacher_id ? "更改代堂" : "指派代堂"}
              </Button>
             ) : null}
             {canManageSchedules ? (
             <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm text-destructive"
              disabled={scheduleRowLocked(s)}
              onClick={async (e) => {
               if (scheduleRowLocked(s)) return
               e.stopPropagation()
              if (!(await confirmDialog({ title: "刪除排程", description: "確定刪除？", confirmText: "確認刪除", tone: "destructive" }))) return
               await deleteSchedule(s.id)
               await reload()
              }}
             >
              刪除
             </Button>
             ) : null}
             {open ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden />
             ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden />
             )}
            </div>
           </td>
          </tr>
          {open ? (
           <tr className="border-b border-border bg-success/30">
            <td colSpan={7} className="px-4 py-4">
             <ExpandedScheduleRoster
              schedule={s}
              schedulePeers={rows}
              loading={listStudentsLoading}
              enrolled={listStudents}
              leave={listLeaveStudents}
              trial={listTrialStudents}
              makeup={listMakeupStudents}
              notEnrolled={listNotEnrolledStudents}
             />
            </td>
           </tr>
          ) : null}
         </Fragment>
        )
       })}
      </tbody>
     </table>
     {filtered.length === 0 ? (
      <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有排程</p>
     ) : null}
    </div>
   ) : null}

   {effectiveViewMode === "day" ? (
    <div className="space-y-4">
     {dayFiltered.length === 0 ? (
      <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm shadow-sm">
       {loading ? (
        <p className="text-muted-foreground">載入中…</p>
       ) : !dayViewDateLoaded ? (
        <p className="text-muted-foreground">正在載入 {dayViewDate} 的排程…</p>
       ) : dayViewFilterActive && dayUnfilteredCount > 0 ? (
        <p className="text-muted-foreground">
         本日有 {dayUnfilteredCount} 堂排程，但目前篩選條件下沒有符合的項目。
        </p>
       ) : (
        <p className="text-muted-foreground">本日沒有排程</p>
       )}
      </div>
     ) : (
      <DayViewGrid
       dayViewDate={dayViewDate}
       schedules={dayFiltered}
       studentRoster={dayViewRoster}
       rosterLoading={dayViewRosterLoading}
       emptyScheduleIds={emptyScheduleIds}
       extraTagsByScheduleId={extraTagsByScheduleId}
       roomColumns={roomColumns}
       activeRoomIdSet={activeRoomIdSet}
       roomColPct={dayViewRoomColPct}
       scheduleRowLocked={scheduleRowLocked}
       inactiveRoomName={inactiveRoomNameForSchedule}
       onDropOnCell={handleDropOnCell}
       onOpenDetail={setDetailId}
       onMoveRequest={openMoveDialog}
      />
     )}
    </div>
   ) : null}

   <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
    <DialogContent className="max-w-md border-info text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">排程詳細資料</DialogTitle>
     </DialogHeader>
     {detailLoading || !detailRow ? (
      <p className="text-base text-muted-foreground">載入中…</p>
     ) : (
      <div className="space-y-3 text-sm">
       <p className="text-xl font-semibold tabular-nums md:text-2xl">
        {detailRow.scheduled_date}{" "}
        {detailRow.start_time && detailRow.end_time
         ? `${detailRow.start_time}–${detailRow.end_time}`
         : ""}
       </p>
       <p>
        {detailRow.class_subject}{" "}
        <span className="font-mono text-muted-foreground">{detailRow.course_code_full ?? ""}</span>
       </p>
       <p className="text-muted-foreground">老師：{detailRow.teacher_name ?? "—"}</p>
       {(() => {
        const subTag = formatScheduleSubstituteTag(
         {
          teacher_id: detailRow.teacher_id,
          teacher_name: detailRow.teacher_name,
          original_teacher_id: detailRow.original_teacher_id,
          original_teacher_name: detailRow.original_teacher_name,
         },
         teacherScopeId
        )
        return subTag ? (
         <Tag tone={statusToTagTone(subTag)} size="sm">
          {subTag}
         </Tag>
        ) : null
       })()}
       <p className="text-muted-foreground">
        位置：{detailRow.classroom_name ?? "未分配"}
        {detailRow.classroom_is_online ? "（線上）" : ""}
       </p>
       {detailRow.teaching_notes?.trim() ? (
        <div className="rounded-lg border border-info/30 bg-info/5 px-3 py-2">
         <p className="text-xs font-medium text-info">教學紀錄</p>
         <p className="mt-1 whitespace-pre-wrap text-foreground">{detailRow.teaching_notes}</p>
        </div>
       ) : null}
       <div className="flex flex-wrap items-center gap-2">
        <Tag tone={statusToTagTone(detailRow.status)} size="sm">{detailRow.status}</Tag>
        {detailRow.is_extra_lesson ? (
         <Tag tone={statusToTagTone("加堂")} size="sm">加堂</Tag>
        ) : null}
       </div>
       {detailRow.status.includes("取消") && detailRow.cancel_reason ? (
        <p className="text-muted-foreground">取消原因：{detailRow.cancel_reason}</p>
       ) : null}
       {canAssignSubstitute ? (
        <Button
         type="button"
         variant="outline"
         size="sm"
         onClick={() => {
          const fromList = rows.find((r) => r.id === detailRow.id)
          if (fromList) {
           setSubstituteTarget(fromList)
           return
          }
          setSubstituteTarget({
           id: detailRow.id,
           scheduled_date: detailRow.scheduled_date,
           start_time: detailRow.start_time,
           end_time: detailRow.end_time,
           status: detailRow.status,
           cancel_reason: detailRow.cancel_reason,
           is_extra_lesson: detailRow.is_extra_lesson,
           remarks: detailRow.remarks,
           teaching_notes: detailRow.teaching_notes,
           session_number: null,
           consecutive_group_id: detailRow.consecutive_group_id,
           consecutive_slot_index: null,
           class_id: detailRow.class_id,
           subject: detailRow.class_subject,
           class_kind: "group",
           course_name: null,
           classLabel: detailRow.class_subject,
           course_code_full: detailRow.course_code_full,
           class_day_of_week: null,
           class_time_slot: null,
           class_lesson_slots_per_session: 1,
           teacher_id: detailRow.teacher_id,
           teacher_name: detailRow.teacher_name,
           original_teacher_id: detailRow.original_teacher_id,
           original_teacher_name: detailRow.original_teacher_name,
           classroom_id: detailRow.classroom_id,
           classroom_name: detailRow.classroom_name,
           enrollCount: 0,
          })
         }}
        >
         {detailRow.original_teacher_id ? "更改／取消代堂" : "指派代堂"}
        </Button>
       ) : null}
       {canManageSchedules ? (
        <label className="flex items-center gap-2 text-sm">
         <input
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-warning"
          checked={detailRow.is_extra_lesson}
          onChange={async (e) => {
           const next = e.target.checked
           await updateSchedule(detailRow.id, { is_extra_lesson: next })
           setDetailRow((prev) => (prev ? { ...prev, is_extra_lesson: next } : prev))
           await reload()
          }}
         />
         <span className="text-muted-foreground">標記為加堂</span>
        </label>
       ) : null}
       {detailRow.remarks ? (
        <p className="text-muted-foreground">備註：{detailRow.remarks}</p>
       ) : null}
       <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" variant="outline" size="default" className="text-base" asChild>
         <Link to={`/Schedule/${detailRow.id}`}>開啟完整頁面</Link>
        </Button>
        {detailRow.class_id ? (
         <Button type="button" variant="outline" size="default" className="text-base" asChild>
          <Link to={`/Classes/${detailRow.class_id}`}>班別詳情</Link>
         </Button>
        ) : null}
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>

   <Dialog
    open={pendingMove != null}
    onOpenChange={(o) => {
     if (!o && !moveSaving) {
      setPendingMove(null)
      setMoveErr(null)
     }
    }}
   >
    <DialogContent className="max-w-md border-amber-100 text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">確認變更排程</DialogTitle>
     </DialogHeader>
     {pendingMove ? (
      <div className="space-y-3 text-sm">
       <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
        即將調整「{pendingMove.row.classLabel}
        {pendingMove.row.course_code_full ? `（${pendingMove.row.course_code_full}）` : ""}」：
        <br />
        課室 → <strong>{pendingMove.roomLabel}</strong>
        <br />
        時間 → <strong className="tabular-nums">
         {pendingMove.newStart}–{pendingMove.newEnd}
        </strong>
        {pendingMove.alignedToStandard ? (
         <>
          <br />
          <span className="text-sm">時間將對齊標準格（09:00 起每 75 分鐘）。</span>
         </>
        ) : null}
       </p>
       {moveChecking ? (
        <p className="text-sm text-muted-foreground">正在檢查課室衝突…</p>
       ) : moveConflicts.length > 0 ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         <p className="font-medium">與以下排程衝突：</p>
         <ul className="mt-1 list-inside list-disc">
          {moveConflicts.map((c) => (
           <li key={c.id}>
            {c.classLabel}（{c.start_time ?? "—"}–{c.end_time ?? "—"}）
           </li>
          ))}
         </ul>
        </div>
       ) : moveRemoteBlocked ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         目標時段與同課室其他排程或待審約房衝突。
        </div>
       ) : (
        <p className="text-muted-foreground">未偵測到課室衝突，確認後即可儲存。</p>
       )}
       {moveErr ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         {moveErr}
        </div>
       ) : null}
       <div className="flex justify-end gap-2">
        <Button
         type="button"
         variant="outline"
         disabled={moveSaving}
         onClick={() => {
          setMoveErr(null)
          setPendingMove(null)
         }}
        >
         取消
        </Button>
        <Button
         type="button"
         className="bg-amber-600 text-white hover:bg-amber-700"
         disabled={
          moveSaving ||
          moveChecking ||
          moveConflicts.length > 0 ||
          moveRemoteBlocked === true
         }
         onClick={() => void confirmMove()}
        >
         {moveSaving ? "儲存中…" : "確定變更"}
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog
    open={moveDialogSchedule != null}
    onOpenChange={(o) => {
     if (!o) setMoveDialogSchedule(null)
    }}
   >
    <DialogContent className="max-w-md text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">移動排程</DialogTitle>
     </DialogHeader>
     {moveDialogSchedule ? (
      <div className="grid gap-4 text-sm">
       <p className="font-medium">{moveDialogSchedule.classLabel}</p>
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">課室</span>
        <Select
         className="h-11 w-full rounded-md border border-input px-3"
         value={moveDialogRoomKey}
         onChange={(e) => setMoveDialogRoomKey(e.target.value)}
        >
         {roomColumns.map((r) => (
          <option key={r.id} value={r.id}>
           {r.name}
          </option>
         ))}
         <option value="__none__">未編課室</option>
        </Select>
       </label>
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">時段（標準格）</span>
        <Select
         className="h-11 w-full rounded-md border border-input px-3"
         value={String(moveDialogSlot)}
         onChange={(e) => setMoveDialogSlot(Number(e.target.value))}
        >
         {LESSON_SLOT_INDICES.map((idx) => (
          <option key={idx} value={idx}>
           {lessonSlotLabel(idx)}
          </option>
         ))}
        </Select>
       </label>
       <p className="text-xs text-muted-foreground">
        時間將對齊所選標準格的起點；若原為非標準時間，結束時間會依上課時長重新計算。
       </p>
       <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setMoveDialogSchedule(null)}>
         取消
        </Button>
        <Button type="button" onClick={submitMoveDialog}>
         繼續確認
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <CancelReasonDialog
    open={cancelTarget != null}
    initialReason={cancelTarget?.cancel_reason ?? ""}
    saving={cancelSaving}
    onCancel={() => setCancelTarget(null)}
    onConfirm={(reason) => void confirmCancelSchedule(reason)}
   />

   <AssignSubstituteDialog
    open={substituteTarget != null}
    schedule={substituteTarget}
    onClose={() => setSubstituteTarget(null)}
    onDone={async () => {
     await reload()
     if (detailId) {
      const s = await getScheduleById(detailId)
      setDetailRow(s)
     }
    }}
   />

   <Dialog open={addOpen} onOpenChange={setAddOpen}>
    <DialogContent className="text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">新增排程</DialogTitle>
     </DialogHeader>
     <div className="grid gap-4 text-sm">
      <label className="grid gap-1.5">
       <span className="text-muted-foreground">班別</span>
       <Select
        className="h-11 w-full rounded-md border border-input px-3"
        value={addClassId}
        onChange={(e) => setAddClassId(e.target.value)}
       >
        {classPickList.map((c) => (
         <option key={c.id} value={c.id}>
          {c.label}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1.5">
       <span className="text-muted-foreground">日期</span>
       <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="h-11 text-base" />
      </label>
      <div className="grid grid-cols-2 gap-3">
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">開始</span>
        <Input type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)} className="h-11 text-base" />
       </label>
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">結束</span>
        <Input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} className="h-11 text-base" />
       </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
       <input
        type="checkbox"
        className="h-4 w-4 rounded border-input accent-warning"
        checked={addExtra}
        onChange={(e) => setAddExtra(e.target.checked)}
       />
       <span className="text-muted-foreground">標記為加堂（額外加開課堂）</span>
      </label>
      {addConflicts.length > 0 ? (
       <div
        role="alert"
        className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
       >
        <p className="font-medium text-warning">
         此老師於 {addDate} 已有 {addConflicts.length} 筆同時段排程：
        </p>
        <ul className="mt-1 space-y-0.5">
         {addConflicts.map((c) => (
          <li key={c.id} className="tabular-nums">
           {c.startTime ? c.startTime.slice(0, 5) : "—"}
           {c.endTime ? `–${c.endTime.slice(0, 5)}` : ""}
           <span className="ml-1">{c.classLabel}</span>
           {c.classroomName ? `（${c.classroomName}）` : ""}
          </li>
         ))}
        </ul>
        <p className="mt-1 text-xs text-muted-foreground">仍可繼續儲存；請確認是否真的需要重複安排。</p>
       </div>
      ) : null}
      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2">
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

   {rollCallTarget ? (
    <RollCallSheet
     entry={rollCallTarget.entry}
     scheduleMeta={rollCallTarget.schedule}
     dateEditable={canEditAcademicYearForDate(rollCallTarget.schedule.scheduled_date)}
     teacherTid={teacherScopeId}
     isMobile={isMobile}
     onClose={() => setRollCallScheduleId(null)}
     onSaved={() => void reload()}
    />
   ) : null}
  </div>
 )
}
