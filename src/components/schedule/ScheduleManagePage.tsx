import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { usePersistentState } from "@/hooks/usePersistentState"
import { useIsMobile } from "@/hooks/use-mobile"
import { useIsXl } from "@/hooks/use-xl"
import {
 CalendarDays,
 Check,
 Download,
 LayoutGrid,
 List,
 Plus,
} from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { RollCallSheet } from "@/components/attendance/RollCallSheet"
import { Button } from "@/components/ui/button"
import { SkeletonDetailHeader } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { CancelReasonDialog } from "@/components/schedule/CancelReasonDialog"
import { AssignSubstituteDialog } from "@/components/schedule/AssignSubstituteDialog"
import { ExtraLessonRosterPicker } from "@/components/schedule/ExtraLessonRosterPicker"
import { ScheduleByDateList } from "@/components/schedule/ScheduleByDateList"
import { ScheduleDayViewPanel } from "@/components/schedule/ScheduleDayViewPanel"
import { ExpandedScheduleRoster } from "@/components/schedule/ScheduleExpandedRoster"
import { ScheduleFilters } from "@/components/schedule/ScheduleFilters"
import { ScheduleListTable } from "@/components/schedule/ScheduleListTable"
import { ScheduleOverview } from "@/components/schedule/ScheduleOverview"
import {
 buildScheduleCsv,
 downloadTextFile,
 EMPTY_SCHEDULE_HEADER_FILTERS,
 isScheduleListColumnId,
 scheduleMatchesHeaderFilters,
 sortScheduleListRows,
 type ScheduleListColumnId,
 type ScheduleListHeaderFilters,
} from "@/components/schedule/scheduleListColumns"
import {
 ISSUE_FILTER_OPTIONS,
 UNASSIGNED_TEACHER_ID,
 classKindFilterLabel,
 enrollmentFilterLabel,
 nextClassKindFilter,
 nextEnrollmentFilter,
 type ScheduleClassKindFilter,
 type ScheduleEnrollmentFilter,
} from "@/components/schedule/scheduleManageUi"
import { useFutureCancelledScheduleData } from "@/components/schedule/useFutureCancelledScheduleData"
import {
 useOpenScheduleRecord,
 useSchedulePreviewActive,
} from "@/components/schedule/useOpenScheduleRecord"
import { useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import type { SortDir } from "@/components/list/listFilterUtils"
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
import { addDaysYmd, isYmd } from "@/lib/weekdayUtils"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { buildRollCallScheduleEntries } from "@/lib/consecutiveLesson"
import { formatClassLabel } from "@/lib/courseLabel"
import { isUnassignedTeachingTeacherIssue, scheduleTeacherDisplayName } from "@/lib/privateClassKind"
import { isHomeworkOccupancySchedule } from "@/lib/homeworkTutoringSchedules"
import { resolveSoftCancelScheduleOptions } from "@/lib/scheduleSoftCancelConfirm"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
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
import {
 fetchClassesForOpsList,
 fetchClassStudents,
 getClassById,
 type ClassRecord,
 type ClassStudentRow,
} from "@/services/classQueries"
import { getScheduleById, type ScheduleDetailRecord } from "@/services/scheduleDetailQueries"
import { deleteSchedule, insertScheduleForClass, updateSchedule } from "@/services/scheduleWriteQueries"
import {
 listExtraLessonRosterCandidates,
 type ExtraLessonRosterCandidate,
} from "@/services/scheduleRosterPolicyQueries"
import { applyHomeworkOccupancyClassroomMove } from "@/services/homeworkTutoringQueries"
import {
 fetchScheduleRosterContext,
 singleSessionNotOnSchedule,
 type ScheduleRosterContext,
} from "@/services/scheduleRosterQueries"
import { parseTimeSlotBounds } from "@/services/batchScheduleHelpers"
import { consecutivePairFromFirstTimeSlot, isConsecutiveClass } from "@/lib/consecutiveLesson"
import { slotIsFreeForBooking } from "@/services/roomBookingQueries"
import {
 fetchDayViewRosterBySchedules,
 fetchNearestScheduleDate,
 fetchScheduleStatsSnapshot,
 fetchTeacherScheduleConflicts,
 localYmd,
 scheduleRangeEnd,
 type DayViewRosterStudent,
 type ScheduleManageRow,
 type ScheduleStatsSnapshot,
 type TeacherScheduleConflict,
} from "@/services/scheduleQueries"
import {
 getScheduleListDataCache,
 invalidateScheduleManageCaches,
} from "@/components/schedule/scheduleListState"
import {
 applyFutureCancelledSearch,
 applyScheduleDayViewSearch,
 calendarDayChanged,
 captureScheduleListReturnState,
 decideInitialScheduleDates,
 FUTURE_CANCELLED_SCOPE,
 initialUrlDateFromSearch,
 parseScheduleManageSearch,
 parseValidScheduleYmd,
 SCHEDULE_RANGE_DAYS,
 shouldFetchNearestScheduleDate,
 type ScheduleListReturnState,
} from "@/components/schedule/scheduleManageDateState"
import { useScheduleListData } from "@/components/schedule/useScheduleListData"
import { bumpRequestGeneration, isLiveKeyedRequest } from "@/lib/requestGeneration"
import { fetchAcademicCalendarClosures } from "@/services/academicCalendarQueries"
import { fetchAcademicYearsWithDates } from "@/services/teacherAvailabilityQueries"
import { usesSharedAppShell } from "@/lib/mgmtRole"

type ScheduleStatsUi =
 | { status: "loading" }
 | { status: "ready"; data: ScheduleStatsSnapshot }
 | { status: "error" }

const RANGE_DAYS = SCHEDULE_RANGE_DAYS
const SCHEDULE_HIGHLIGHT_MS = 2400

type ViewMode = "byDate" | "list" | "day"

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

export function ScheduleManagePage() {
 const { confirmDialog } = useAppConfirm()
 const { pushBanner } = useAppBanner()
 const { profile, role } = useAuth()
 const teacherScopeId = getTeacherScopeTeacherId(profile)
 const isMobile = useIsMobile()
 /** 行政／外星人：手機可使用日視圖（週條＋課室佔用）；專班老師仍強制按日期 */
 /** 手機日／週曆視圖：行政與老師皆可用（資料仍依角色 scope） */
 const allowMobileDayView = true
 const [todayYmd, setTodayYmd] = useState(() => localYmd())
 const todayYmdRef = useRef(todayYmd)
 todayYmdRef.current = todayYmd
 const [searchParams, setSearchParams] = useSearchParams()
 /** 僅在「進頁當下」URL 已帶日期時才沿用（例如儀表板深連結）；之後日視圖自行寫入的今天不得蓋過「未來最近排程」初始化。 */
 const initialUrlDayDateRef = useRef<string | null>(
  initialUrlDateFromSearch(parseScheduleManageSearch(searchParams))
 )

 const initialScheduleCache = getScheduleListDataCache()
 const initialUrlDayDate = initialUrlDayDateRef.current
 const initialDateDecision = decideInitialScheduleDates({
  urlDate: initialUrlDayDate,
  cacheDisplayStart: initialScheduleCache?.key.displayStart ?? null,
  cacheTeacherScopeId: initialScheduleCache?.key.teacherScopeId ?? null,
  cacheHasData: initialScheduleCache != null,
  teacherScopeId,
  todayYmd,
 })

 const [viewMode, setViewMode] = usePersistentState<ViewMode>("mgmt_schedule_viewMode", "byDate")
 const location = useLocation()
 const isXl = useIsXl()
 const { closePreview, preview } = useRecordPreview()
 const openScheduleRecord = useOpenScheduleRecord()
 const parsedSearch = parseScheduleManageSearch(searchParams)
 const futureCancelledMode = parsedSearch.scope === FUTURE_CANCELLED_SCOPE
 const futureCancelledReturnRef = useRef<ScheduleListReturnState | null>(null)
 const effectiveViewMode: ViewMode =
  futureCancelledMode
   ? "byDate"
   : isMobile && (viewMode === "list" || (viewMode === "day" && !allowMobileDayView))
     ? "byDate"
     : viewMode
 const [displayStart, setDisplayStart] = useState(initialDateDecision.displayStart)
 const [dayViewDate, setDayViewDate] = useState(initialDateDecision.dayViewDate)
 const [startInitialized, setStartInitialized] = useState(initialDateDecision.initialized)
 const [teacherFilterIds, setTeacherFilterIds] = usePersistentState<string[]>(
  "mgmt_schedule_teacherFilterIds",
  []
 )
 const [statusFilter, setStatusFilter] = usePersistentState<string>("mgmt_schedule_statusFilter", "all")
 const [enrollmentFilter, setEnrollmentFilter] = usePersistentState<ScheduleEnrollmentFilter>(
  "mgmt_schedule_enrollmentFilter",
  "all"
 )
 const [classKindFilter, setClassKindFilter] = usePersistentState<ScheduleClassKindFilter>(
  "mgmt_schedule_classKindFilter",
  "all"
 )
 const [noRoomFilter, setNoRoomFilter] = usePersistentState<boolean>(
  "mgmt_schedule_noRoomFilter",
  false
 )
 const [filtersOpen, setFiltersOpen] = useState(false)
 const [overviewOpenDesktop, setOverviewOpenDesktop] = usePersistentState(
  "mgmt_schedule_overviewOpen",
  true
 )
 const [overviewOpenMobile, setOverviewOpenMobile] = useState(false)
 const overviewOpen = isMobile ? overviewOpenMobile : overviewOpenDesktop
 const [listSortKey, setListSortKey] = usePersistentState<ScheduleListColumnId>(
  "mgmt_schedule_listSortKey",
  "date"
 )
 const [listSortDir, setListSortDir] = usePersistentState<SortDir>("mgmt_schedule_listSortDir", "asc")
 const [listHeaderFilters, setListHeaderFilters] = usePersistentState<ScheduleListHeaderFilters>(
  "mgmt_schedule_listHeaderFilters",
  EMPTY_SCHEDULE_HEADER_FILTERS
 )
 const [highlightScheduleId, setHighlightScheduleId] = useState<string | null>(null)
 const rangeEnd = useMemo(() => scheduleRangeEnd(displayStart, RANGE_DAYS), [displayStart])
 const listData = useScheduleListData({
  enabled: startInitialized && !futureCancelledMode,
  teacherScopeId,
  displayStart,
  rangeEnd,
 })
 const cancelledData = useFutureCancelledScheduleData({
  enabled: startInitialized,
  teacherScopeId,
  asOf: todayYmd,
 })
 const rows = futureCancelledMode ? cancelledData.rows : listData.rows
 const alerts = futureCancelledMode ? cancelledData.alerts : listData.alerts
 const rooms = futureCancelledMode && cancelledData.rooms.length > 0 ? cancelledData.rooms : listData.rooms
 const roomOptions =
  futureCancelledMode && cancelledData.roomOptions.length > 0
   ? cancelledData.roomOptions
   : listData.roomOptions
 const loading = futureCancelledMode ? cancelledData.loading : listData.loading
 const rosterLoading = futureCancelledMode ? cancelledData.summaryLoading : listData.summaryLoading
 const rowsStale = futureCancelledMode ? cancelledData.stale : listData.stale
 const reloadRange = listData.reload
 const reloadCancelled = cancelledData.reload
 const reload = useCallback(async () => {
  invalidateScheduleManageCaches({ futureCancelled: true })
  await Promise.all([reloadRange(), reloadCancelled()])
 }, [reloadRange, reloadCancelled])
 const [actionErr, setActionErr] = useState<string | null>(null)
 const pageErr = (futureCancelledMode ? cancelledData.error : listData.error) ?? actionErr
 const listPreviewEnabled = useSchedulePreviewActive(effectiveViewMode === "list")
 const [rosterContext, setRosterContext] = useState<ScheduleRosterContext | null>(null)
 const [stats, setStats] = useState<ScheduleStatsUi>({ status: "loading" })
 const [closureNameByDate, setClosureNameByDate] = useState<Map<string, string>>(() => new Map())
 const statsGenRef = useRef({ current: 0 })

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
 const [addRosterCandidates, setAddRosterCandidates] = useState<ExtraLessonRosterCandidate[]>([])
 const [addRosterIds, setAddRosterIds] = useState<string[]>([])
 const [addRosterLoading, setAddRosterLoading] = useState(false)
 const [classPickList, setClassPickList] = useState<{ id: string; label: string }[]>([])
 const [addClassRecords, setAddClassRecords] = useState<ClassRecord[]>([])
 const [addConflicts, setAddConflicts] = useState<TeacherScheduleConflict[]>([])

 const [cancelTarget, setCancelTarget] = useState<ScheduleManageRow | null>(null)
 const [cancelSaving, setCancelSaving] = useState(false)
 const [substituteTarget, setSubstituteTarget] = useState<ScheduleManageRow | null>(null)
 const [rollCallScheduleId, setRollCallScheduleId] = useState<string | null>(null)
 const rollCallEligibleIds = useMemo(() => {
  if (rosterLoading) return null
  const summaries = futureCancelledMode ? cancelledData.rowSummaries : listData.rowSummaries
  const ids = new Set<string>()
  for (const [id, summary] of summaries) {
   if (summary.canTakeAttendance) ids.add(id)
  }
  return ids
 }, [cancelledData.rowSummaries, futureCancelledMode, listData.rowSummaries, rosterLoading])

 const canManageSchedules = can(profile?.activeCapabilities, "schedule.reschedule")
 const canRollCall = can(profile?.activeCapabilities, "attendance.take")
 const canAssignSubstitute = canManageSchedules
 const scheduleMgmtLocked = !canManageSchedules
 const [teacherScopeName, setTeacherScopeName] = useState<string>("專班老師")

 const reloadStats = useCallback(async (teacherId?: string | null) => {
  const asOf = todayYmdRef.current
  const requestKey = `${teacherId ?? ""}:${asOf}`
  const gen = bumpRequestGeneration(statsGenRef.current)
  setStats({ status: "loading" })
  const isLive = () =>
   isLiveKeyedRequest(
    statsGenRef.current,
    gen,
    `${teacherScopeId ?? ""}:${todayYmdRef.current}`,
    requestKey,
    (a, b) => a === b
   )
  try {
   const result = await fetchScheduleStatsSnapshot(teacherId)
   if (!isLive()) return
   if ("ok" in result) setStats({ status: "ready", data: result.ok })
   else setStats({ status: "error" })
  } catch {
   if (!isLive()) return
   setStats({ status: "error" })
  }
 }, [teacherScopeId])

 useEffect(() => {
  if (!startInitialized) return
  void reloadStats(teacherScopeId)
 }, [startInitialized, teacherScopeId, reloadStats])

 useEffect(() => {
  const urlDate = initialUrlDayDateRef.current
  const cached = getScheduleListDataCache()
  const cacheMatchesTeacherScope =
   cached != null && cached.key.teacherScopeId === teacherScopeId
  if (!shouldFetchNearestScheduleDate({ urlDate, cacheMatchesTeacherScope })) {
   if (urlDate) {
    setDisplayStart(urlDate)
    setDayViewDate(urlDate)
   }
   setStartInitialized(true)
   return
  }
  let cancelled = false
  void fetchNearestScheduleDate(teacherScopeId ? { teacherId: teacherScopeId } : undefined)
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
 }, [teacherScopeId])

 useEffect(() => {
  const refreshCalendarDay = () => {
   const next = localYmd()
   if (!calendarDayChanged(todayYmdRef.current, next)) return
   todayYmdRef.current = next
   setTodayYmd(next)
   void reloadStats(teacherScopeId)
  }
  const onVisibility = () => {
   if (document.visibilityState === "visible") refreshCalendarDay()
  }
  window.addEventListener("focus", refreshCalendarDay)
  document.addEventListener("visibilitychange", onVisibility)
  return () => {
   window.removeEventListener("focus", refreshCalendarDay)
   document.removeEventListener("visibilitychange", onVisibility)
  }
 }, [reloadStats, teacherScopeId])

 useEffect(() => {
  if (!startInitialized) return
  const parsed = parseScheduleManageSearch(searchParams)
  if (parsed.view === "day" && parsed.date) {
   setDayViewDate(parsed.date)
   setDisplayStart(parsed.date)
   if (!isMobile || allowMobileDayView) setViewMode("day")
  }
 }, [searchParams, isMobile, allowMobileDayView, setViewMode, startInitialized])

 const openRollCallForSchedule = useCallback(
  (scheduleId: string) => {
   if (!canRollCall) return
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
   void fetchScheduleIdsWithRollCallTargets([schedule], rosterContext ?? undefined).then((ids) => {
    if (!ids.has(scheduleId)) {
     notifyEmpty()
     return
    }
    setRollCallScheduleId(scheduleId)
   })
  },
  [canRollCall, rollCallEligibleIds, pushBanner, rows, rosterContext]
 )

 const canOpenRollCall = useCallback(
  (scheduleId: string) => rollCallEligibleIds == null || rollCallEligibleIds.has(scheduleId),
  [rollCallEligibleIds]
 )

 /** 深連結：/Schedule?schedule_id=…&rollcall=1（可附 date）→ 開點名紙後清參數 */
 useEffect(() => {
  if (!startInitialized || loading) return
  if (!canRollCall) return
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

  const date = parseValidScheduleYmd(searchParams.get("date"))
  if (date) {
   setDisplayStart(date)
   setDayViewDate(date)
  }

  let cancelled = false
  void fetchScheduleIdsWithRollCallTargets([schedule], rosterContext ?? undefined).then((ids) => {
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
 }, [
  startInitialized,
  loading,
  rows,
  searchParams,
  setSearchParams,
  pushBanner,
  rosterContext,
  canRollCall,
 ])

 useEffect(() => {
  // 等「未來最近排程」初始化完成後再同步 URL，避免日視圖先寫入今天、蓋掉最近日期。
  if (!startInitialized || futureCancelledMode) return
  const { next, changed } = applyScheduleDayViewSearch(searchParams, {
   viewMode: effectiveViewMode,
   dayViewDate,
  })
  if (changed) setSearchParams(next, { replace: true })
 }, [
  effectiveViewMode,
  dayViewDate,
  searchParams,
  setSearchParams,
  startInitialized,
  futureCancelledMode,
 ])

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
  const contextPromise = rosterContext?.schedules.some((schedule) => schedule.id === scheduleId)
   ? Promise.resolve(rosterContext)
   : fetchScheduleRosterContext([scheduleId])
  void contextPromise
   .then(async (rosterContext) => {
    const [enrolled, leave, trial, makeup] = await Promise.all([
     fetchClassStudents(classId, {
      scheduleDate,
      scheduleId,
      activeOnly: true,
      rosterContext,
     }),
     fetchLeaveStudentsForSchedule(scheduleId, classId, scheduleDate, rosterContext),
     fetchTrialStudentsForSchedule(scheduleId, rosterContext),
     fetchMakeupStudentsForSchedule(scheduleId, rosterContext),
    ])
    return {
     enrolled,
     leave,
     trial,
     makeup,
     notEnrolled: singleSessionNotOnSchedule(rosterContext, scheduleId),
    }
   })
   .then(({ enrolled, leave, trial, makeup, notEnrolled }) => {
    setListStudents(enrolled)
    setListLeaveStudents(leave)
    setListTrialStudents(
     trial.map((st) => ({
      studentId: st.studentId,
      fullName: st.fullName,
      contactPhone: st.contactPhone,
      messagingTarget: st.messagingTarget,
     }))
    )
    setListMakeupStudents(makeup)
    setListNotEnrolledStudents(notEnrolled)
   })
   .finally(() => setListStudentsLoading(false))
 }, [expandedScheduleId, rows, rosterContext])

 useEffect(() => {
  setExpandedScheduleId(null)
 }, [effectiveViewMode])

 useEffect(() => {
  if (!addOpen) return
  void fetchClassesForOpsList().then((result) => {
   const all = result.classes
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
  if (!addOpen || !addExtra || !addClassId) {
   setAddRosterCandidates([])
   setAddRosterIds([])
   setAddRosterLoading(false)
   return
  }
  let cancelled = false
  setAddRosterLoading(true)
  void listExtraLessonRosterCandidates({ classId: addClassId, scheduleDate: addDate })
   .then((rows) => {
    if (cancelled) return
    setAddRosterCandidates(rows)
    setAddRosterIds(rows.map((row) => row.studentId))
    setAddRosterLoading(false)
   })
   .catch(() => {
    if (cancelled) return
    setAddRosterCandidates([])
    setAddRosterIds([])
    setAddRosterLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [addOpen, addExtra, addClassId, addDate])

useEffect(() => {
 if (!teacherScopeId) {
  setTeacherScopeName("專班老師")
  return
 }
 void getTeacherById(teacherScopeId)
  .then((t) => setTeacherScopeName(t?.full_name?.trim() || "專班老師"))
  .catch(() => setTeacherScopeName("專班老師"))
}, [teacherScopeId])

 useEffect(() => {
  let cancelled = false
  void (async () => {
   try {
    const years = await fetchAcademicYearsWithDates()
    const maps = await Promise.all(years.map((year) => fetchAcademicCalendarClosures(year.id)))
    if (cancelled) return
    const next = new Map<string, string>()
    for (const rows of maps) {
     for (const row of rows) next.set(row.closureDate, row.name)
    }
    setClosureNameByDate(next)
   } catch {
    if (!cancelled) setClosureNameByDate(new Map())
   }
  })()
  return () => {
   cancelled = true
  }
 }, [])

 const teacherOptions = useMemo(() => {
  const m = new Map<string, string>()
  let hasUnassigned = false
  for (const r of rows) {
   if (isUnassignedTeachingTeacherIssue(r)) {
    hasUnassigned = true
    continue
   }
   if (!r.teacher_id) continue
   const label = r.teacher_name?.trim() || "未命名老師"
   if (!m.has(r.teacher_id)) m.set(r.teacher_id, label)
  }
  const list = [...m.entries()]
   .map(([id, label]) => ({ id, label }))
   .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
  if (hasUnassigned) list.push({ id: UNASSIGNED_TEACHER_ID, label: "未指派" })
  return list
 }, [rows])

 const scheduleRowLocked = useCallback(
  (_s?: { scheduled_date: string }) => scheduleMgmtLocked,
  [scheduleMgmtLocked]
 )

 const advancedFilterIds = useMemo(
  () =>
   ISSUE_FILTER_OPTIONS.filter((o) => (teacherScopeId ? o.teacherVisible : true)).map(
    (o) => o.id
   ),
  [teacherScopeId]
 )

 const effectiveEnrollmentFilter = enrollmentFilter
 const effectiveClassKindFilter = teacherScopeId ? ("all" as const) : classKindFilter
 const effectiveNoRoomFilter = teacherScopeId ? false : noRoomFilter

 const effectiveTeacherFilterIds = useMemo(
  () => (teacherScopeId ? [] : teacherFilterIds),
  [teacherScopeId, teacherFilterIds]
 )

 const advancedFilterActive =
  effectiveEnrollmentFilter !== "all" ||
  effectiveClassKindFilter !== "all" ||
  effectiveNoRoomFilter

 const filtered = useMemo(() => {
  if (futureCancelledMode) return rows
  const teacherSet = new Set(effectiveTeacherFilterIds)
  return rows.filter((r) => {
   if (statusFilter !== "all" && r.status !== statusFilter) return false
   if (effectiveEnrollmentFilter === "hasEnroll") {
    if (r.enrollCount == null || r.enrollCount <= 0) return false
   } else if (effectiveEnrollmentFilter === "noEnroll") {
    if (r.enrollCount == null || r.enrollCount > 0) return false
   }
   if (effectiveClassKindFilter === "group") {
    if (r.class_kind !== "group") return false
   } else if (effectiveClassKindFilter === "nonGroup") {
    if (r.class_kind === "group") return false
   }
   if (effectiveNoRoomFilter && r.classroom_id != null) return false
   if (teacherSet.size > 0) {
    const key = isUnassignedTeachingTeacherIssue(r)
     ? UNASSIGNED_TEACHER_ID
     : (r.teacher_id ?? "")
    if (!teacherSet.has(key)) return false
   }
   return true
  })
 }, [
  rows,
  futureCancelledMode,
  statusFilter,
  effectiveEnrollmentFilter,
  effectiveClassKindFilter,
  effectiveNoRoomFilter,
  effectiveTeacherFilterIds,
 ])

 const listTableRows = useMemo(() => {
  const headered = filtered.filter((row) => scheduleMatchesHeaderFilters(row, listHeaderFilters))
  const sortKey = isScheduleListColumnId(listSortKey) ? listSortKey : "date"
  return sortScheduleListRows(headered, sortKey, listSortDir)
 }, [filtered, listHeaderFilters, listSortDir, listSortKey])

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
  effectiveTeacherFilterIds.length > 0 || statusFilter !== "all" || advancedFilterActive

 const cycleEnrollmentFilter = useCallback(() => {
  setEnrollmentFilter((prev) => nextEnrollmentFilter(prev))
 }, [setEnrollmentFilter])

 const cycleClassKindFilter = useCallback(() => {
  setClassKindFilter((prev) => nextClassKindFilter(prev))
 }, [setClassKindFilter])

 const toggleNoRoomFilter = useCallback(() => {
  setNoRoomFilter((prev) => !prev)
 }, [setNoRoomFilter])

 const toggleTeacherFilter = useCallback(
  (id: string) => {
   setTeacherFilterIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  },
  [setTeacherFilterIds]
 )

 const clearAllFilters = useCallback(() => {
  setTeacherFilterIds([])
  setStatusFilter("all")
  setEnrollmentFilter("all")
  setClassKindFilter("all")
  setNoRoomFilter(false)
 }, [
  setTeacherFilterIds,
  setStatusFilter,
  setEnrollmentFilter,
  setClassKindFilter,
  setNoRoomFilter,
 ])

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
  void fetchScheduleRosterContext(dayFiltered.map((row) => row.id))
   .then((context) => {
    if (cancelled) return
    setRosterContext(context)
    return Promise.all([
     fetchDayViewRosterBySchedules(dayFiltered, context),
     fetchLeaveInfoForSchedules(dayFiltered, context),
    ])
   })
   .then((result) => {
    if (cancelled || !result) return
    const [rosterMap, leaveMap] = result
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
  for (const s of dayFiltered) {
   if (isHomeworkOccupancySchedule(s)) {
    tagsById.set(s.id, ["佔室"])
   }
  }
  if (dayViewRosterLoading) return { emptyScheduleIds: emptyIds, extraTagsByScheduleId: tagsById }

  for (const s of dayFiltered) {
   if (isHomeworkOccupancySchedule(s)) continue
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
   if (!isYmd(ymd)) return
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
   if (isHomeworkOccupancySchedule(row)) {
    if (!roomId) return
    if ((row.classroom_id ?? null) === roomId) return
    setMoveErr(null)
    setPendingMove({
     row,
     newRoomId: roomId,
     newStart: row.start_time ?? "15:15",
     newEnd: row.end_time ?? "19:30",
     roomLabel: roomLabel(roomId),
     alignedToStandard: false,
    })
    return
   }
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

 const captureReturn = useCallback((): ScheduleListReturnState => {
  return captureScheduleListReturnState({
   search: searchParams.toString(),
   viewMode: futureCancelledMode ? viewMode : effectiveViewMode,
   displayStart,
   dayViewDate,
   selectedScheduleId: expandedScheduleId,
   scrollY: window.scrollY,
  })
 }, [
  searchParams,
  futureCancelledMode,
  viewMode,
  effectiveViewMode,
  displayStart,
  dayViewDate,
  expandedScheduleId,
 ])

 const openRecord = useCallback(
  (id: string) => {
   openScheduleRecord(id, {
    listView: effectiveViewMode === "list" && !futureCancelledMode,
    returnState: captureReturn(),
   })
  },
  [openScheduleRecord, effectiveViewMode, futureCancelledMode, captureReturn]
 )

 const exportCsv = () => {
  const csvRows = futureCancelledMode ? rows : filtered
  const advancedParts = [
   effectiveEnrollmentFilter !== "all"
    ? enrollmentFilterLabel(effectiveEnrollmentFilter)
    : null,
   effectiveClassKindFilter !== "all" ? classKindFilterLabel(effectiveClassKindFilter) : null,
   effectiveNoRoomFilter ? "未有課室安排" : null,
  ].filter(Boolean)
  const filterParts = futureCancelledMode
   ? ["未來取消堂專用模式"]
   : [
      statusFilter !== "all" ? `狀態=${statusFilter}` : "狀態=全部",
      advancedParts.length > 0 ? `進階=${advancedParts.join("+")}` : null,
      effectiveTeacherFilterIds.length > 0 ? `老師=${effectiveTeacherFilterIds.length}` : null,
     ].filter(Boolean)
  const csv = buildScheduleCsv(csvRows, {
   rangeLabel: futureCancelledMode
    ? `今天起（${todayYmd}）`
    : `${displayStart}–${rangeEnd}`,
   filterLabel: filterParts.join("；") || "無",
   producedAt: new Date().toISOString(),
  })
  downloadTextFile(
   futureCancelledMode
    ? `schedules-future-cancelled-${todayYmd}.csv`
    : `schedules-${displayStart}-${rangeEnd}.csv`,
   csv
  )
 }

 const openAdd = () => {
  if (scheduleMgmtLocked) return
  setAddErr(null)
  setAddDate(displayStart)
  setAddStart("")
  setAddEnd("")
  setAddExtra(false)
  setAddRosterCandidates([])
  setAddRosterIds([])
  setAddOpen(true)
 }

 const submitAdd = async () => {
  if (scheduleMgmtLocked) return
  if (!addClassId) {
   setAddErr("請選擇班別")
   return
  }
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: addDate,
    source: "ScheduleManagePage.submitAdd",
   }))
  ) {
   return
  }
  setAddSaving(true)
  setAddErr(null)
  try {
   const cls = await getClassById(addClassId)
   let start = addStart || null
   let end = addEnd || null
   if (!start && cls?.time_slot) {
    const bounds = parseTimeSlotBounds(cls.time_slot)
    start = bounds.start
    end = bounds.end
   }
   if (!start || !end) {
    setAddErr("請填寫開始與結束時間，或先為班別設定時段")
    return
   }
   await insertScheduleForClass(addClassId, cls?.teacher_id ?? null, {
    scheduled_date: addDate,
    start_time: start,
    end_time: end,
    classroom_id: cls?.classroom_id ?? null,
    is_extra_lesson: addExtra,
    rosterStudentIds: addExtra ? addRosterIds : undefined,
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
   setMoveErr("僅管理員可移動排程。")
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
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: pendingMove.row.scheduled_date,
    source: "ScheduleManagePage.confirmMove",
   }))
  ) {
   return
  }
  setMoveErr(null)
  setMoveSaving(true)
  try {
   const occupancy = isHomeworkOccupancySchedule(pendingMove.row)
   if (occupancy) {
    if (!pendingMove.newRoomId) {
     setMoveErr("功輔佔室必須指定課室。")
     return
    }
    await updateSchedule(pendingMove.row.id, { classroom_id: pendingMove.newRoomId })
    if (pendingMove.row.class_id) {
     await applyHomeworkOccupancyClassroomMove({
      classId: pendingMove.row.class_id,
      scheduledDate: pendingMove.row.scheduled_date,
      fromClassroomId: pendingMove.row.classroom_id,
      toClassroomId: pendingMove.newRoomId,
     })
    }
   } else {
    await updateSchedule(pendingMove.row.id, {
     classroom_id: pendingMove.newRoomId,
     start_time: pendingMove.newStart,
     end_time: pendingMove.newEnd,
    })
   }
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
   if (isHomeworkOccupancySchedule(row)) return
   if (newStatus === row.status) return
   if (newStatus.includes("取消")) {
    setCancelTarget(row)
    return
   }
   if (
    !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
     dateYmd: row.scheduled_date,
     source: "ScheduleManagePage.handleStatusChange",
    }))
   ) {
    return
   }
   await updateSchedule(row.id, { status: newStatus, cancel_reason: null })
   await reload()
  },
  [scheduleRowLocked, reload, confirmDialog]
 )

 const confirmCancelSchedule = useCallback(
  async (reason: string) => {
   if (!cancelTarget) return
   if (isHomeworkOccupancySchedule(cancelTarget)) return
   if (
    !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
     dateYmd: cancelTarget.scheduled_date,
     source: "ScheduleManagePage.confirmCancelSchedule",
    }))
   ) {
    return
   }
   setCancelSaving(true)
   try {
    const softOpts = await resolveSoftCancelScheduleOptions(confirmDialog, [cancelTarget.id])
    if (softOpts === "abort") return
    await updateSchedule(cancelTarget.id, { status: "取消", cancel_reason: reason }, softOpts)
    setCancelTarget(null)
    await reload()
   } catch (e) {
    reportUserFacingError(e, {
     source: "ScheduleManagePage.confirmCancelSchedule",
     setErr: setActionErr,
    })
   } finally {
    setCancelSaving(false)
   }
  },
  [cancelTarget, reload, confirmDialog]
 )

 const oneClickAssign = async () => {
  if (scheduleMgmtLocked || assigning || loading) return
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: dayViewDate,
    source: "ScheduleManagePage.oneClickAssign",
   }))
  ) {
   return
  }

  const dayRows = rows.filter((s) => s.scheduled_date === dayViewDate)
  const unassigned = dayRows
   .filter((s) => !s.status.includes("取消"))
   .filter((s) => !isHomeworkOccupancySchedule(s))
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
    setErr: setActionErr,
    userMessage: "一鍵分配失敗",
   })
  } finally {
   setAssigning(false)
  }
 }

 const exitFutureCancelled = () => {
  const saved = futureCancelledReturnRef.current
  if (saved) {
   setViewMode(saved.viewMode)
   setDisplayStart(saved.displayStart)
   setDayViewDate(saved.dayViewDate)
   if (saved.selectedScheduleId) setExpandedScheduleId(saved.selectedScheduleId)
   setSearchParams(new URLSearchParams(saved.search), { replace: true })
   const y = saved.scrollY
   if (y != null) {
    requestAnimationFrame(() => window.scrollTo(0, y))
   }
   return
  }
  setSearchParams((prev) => applyFutureCancelledSearch(prev, false), { replace: true })
 }

 const jumpToday = () => {
  setDisplayStart(todayYmd)
  setDayViewDate(todayYmd)
  setViewMode("day")
 }

 const onTodayCardClick = () => {
  if (futureCancelledMode) exitFutureCancelled()
  setDisplayStart(todayYmd)
  setDayViewDate(todayYmd)
  setViewMode("day")
 }

 const enterFutureCancelled = () => {
  if (futureCancelledMode) {
   exitFutureCancelled()
   return
  }
  const current = new URLSearchParams(searchParams)
  current.delete("scope")
  futureCancelledReturnRef.current = captureScheduleListReturnState({
   search: current.toString(),
   viewMode: effectiveViewMode,
   displayStart,
   dayViewDate,
   selectedScheduleId: expandedScheduleId,
   scrollY: window.scrollY,
  })
  setSearchParams((prev) => applyFutureCancelledSearch(prev, true), { replace: true })
 }

 useEffect(() => {
  if (effectiveViewMode !== "list" || !isXl) closePreview()
 }, [effectiveViewMode, isXl, closePreview])

 useEffect(() => {
  const st = location.state as { highlightScheduleId?: string; scrollY?: number } | null
  const id = st?.highlightScheduleId
  if (!id) return
  setHighlightScheduleId(id)
  const timer = window.setTimeout(() => setHighlightScheduleId(null), SCHEDULE_HIGHLIGHT_MS)
  requestAnimationFrame(() => {
   document.querySelector(`[data-schedule-anchor="${CSS.escape(id)}"]`)?.scrollIntoView({
    block: "center",
   })
   if (st?.scrollY != null) window.scrollTo(0, st.scrollY)
  })
  return () => window.clearTimeout(timer)
 }, [location.state])

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

 const blankTeacherCount = rows.filter((s) => isUnassignedTeachingTeacherIssue(s)).length

 const activeFilterCount =
  (statusFilter !== "all" ? 1 : 0) +
  (effectiveEnrollmentFilter !== "all" ? 1 : 0) +
  (effectiveClassKindFilter !== "all" ? 1 : 0) +
  (effectiveNoRoomFilter ? 1 : 0) +
  effectiveTeacherFilterIds.length

 const resetScheduleFilters = () => {
  setStatusFilter("all")
  setEnrollmentFilter("all")
  setClassKindFilter("all")
  setNoRoomFilter(false)
  setTeacherFilterIds([])
 }

 const unassignedRoomCount = rows.filter(
  (s) => !s.status.includes("取消") && s.classroom_id == null
 ).length
 const cancelledKpiStatus = cancelledData.error
  ? "error"
  : cancelledData.loading && cancelledData.rows.length === 0
    ? "loading"
    : "ready"
 const todayKpiStatus = stats.status
 const todayLessonTag =
  stats.status === "ready" ? `${stats.data.todayLessonCount} 堂今日` : "— 堂今日"
 const csvDisabled = rosterLoading
 const previewScheduleId = preview?.kind === "schedule" ? preview.id : null

 const renderExpanded = (s: ScheduleManageRow) => {
  const occupancy = isHomeworkOccupancySchedule(s)
  const classMetaParts = [s.class_day_of_week, s.class_time_slot].filter(Boolean)
  if (occupancy) {
   return (
    <p className="text-sm text-muted-foreground">
     功輔佔室：可改課室（會寫返當日編更）。放假請用功輔校曆；加開／收起第二房請到當值編更。
    </p>
   )
  }
  return (
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
     </div>
    }
    footer={
     s.class_id ? (
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
       <Button type="button" variant="outline" size="default" className="text-base" asChild>
        <Link to={`/Classes/${s.class_id}`}>班別詳情</Link>
       </Button>
      </div>
     ) : null
    }
   />
  )
 }

 const renderByDateActions = (s: ScheduleManageRow) => {
  const occupancy = isHomeworkOccupancySchedule(s)
  return (
   <>
    <Select
     className="h-11 max-w-[10rem] rounded-md border border-input bg-background px-2 text-sm transition-colors hover:border-info/50"
     value={s.classroom_id ?? ""}
     disabled={scheduleRowLocked(s)}
     onChange={async (e) => {
      if (scheduleRowLocked(s)) return
      const v = e.target.value || null
      if (occupancy) {
       if (!v) return
       await updateSchedule(s.id, { classroom_id: v })
       if (s.class_id) {
        await applyHomeworkOccupancyClassroomMove({
         classId: s.class_id,
         scheduledDate: s.scheduled_date,
         fromClassroomId: s.classroom_id,
         toClassroomId: v,
        })
       }
      } else {
       await updateSchedule(s.id, { classroom_id: v })
      }
      await reload()
     }}
    >
     {occupancy ? null : <option value="">課室未定</option>}
     {roomOptions.map((o) => (
      <option key={o.id} value={o.id}>
       {o.label}
      </option>
     ))}
    </Select>
    {occupancy ? (
     <p className="text-xs text-muted-foreground">放假請用功輔校曆，唔好取消佔室。</p>
    ) : (
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
    )}
    {occupancy ? null : canManageSchedules ? (
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
    {occupancy ? null : canAssignSubstitute ? (
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
    {occupancy ? null : canRollCall ? (
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
    ) : null}
    {occupancy ? null : canManageSchedules ? (
     <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-11 w-11 text-destructive hover:bg-destructive/10"
      disabled={scheduleRowLocked(s)}
      aria-label="刪除排程"
      onClick={async () => {
       if (scheduleRowLocked(s)) return
       if (
        !(await confirmDialog({
         title: "刪除排程",
         description: "確定刪除此排程？",
         confirmText: "確認刪除",
         tone: "destructive",
        }))
       )
        return
       await deleteSchedule(s.id)
       await reload()
      }}
     >
      ×
     </Button>
    ) : null}
   </>
  )
 }

 const renderListActions = (s: ScheduleManageRow) => {
  const occupancy = isHomeworkOccupancySchedule(s)
  return (
   <>
    {occupancy ? null : canManageSchedules ? (
     <Link
      to="/LeaveManagement"
      className="text-sm font-medium text-warning hover:underline"
      onClick={(e) => e.stopPropagation()}
     >
      +請假
     </Link>
    ) : null}
    {occupancy ? null : canRollCall ? (
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
    ) : null}
    {occupancy ? null : canAssignSubstitute ? (
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
    {occupancy ? null : canManageSchedules ? (
     <Button
      type="button"
      variant="link"
      className="h-auto p-0 text-sm text-destructive"
      disabled={scheduleRowLocked(s)}
      onClick={async (e) => {
       if (scheduleRowLocked(s)) return
       e.stopPropagation()
       if (
        !(await confirmDialog({
         title: "刪除排程",
         description: "確定刪除？",
         confirmText: "確認刪除",
         tone: "destructive",
        }))
       )
        return
       await deleteSchedule(s.id)
       await reload()
      }}
     >
      刪除
     </Button>
    ) : null}
   </>
  )
 }

 const renderStatusControl = (s: ScheduleManageRow) => {
  const occupancy = isHomeworkOccupancySchedule(s)
  if (occupancy) {
   return <p className="text-xs text-muted-foreground">放假請用功輔校曆</p>
  }
  return (
   <>
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
   </>
  )
 }

 const pageBody = (
  <div className="space-y-5 text-sm leading-relaxed">
   {usesSharedAppShell(role) ? (
    <AdminPageHeader
     eyebrow="行政工作"
     title="排程"
     description="管理課堂排程、日期及實際授課老師。"
     titleExtra={<Tag tone="info">{todayLessonTag}</Tag>}
    />
   ) : (
    <header className="flex flex-wrap items-start justify-between gap-3">
     <div>
      <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
       <CalendarDays className="h-6 w-6 shrink-0 text-info" aria-hidden />
       排程管理
       <Tag tone="info">{todayLessonTag}</Tag>
      </h1>
      <p className="mt-2 hidden text-sm text-muted-foreground md:block">
       按日期可展開名單；列表開啟預覽或完整詳情；日視圖以拖曳及移動課室為主。
      </p>
     </div>
    </header>
   )}

   {futureCancelledMode ? (
    <div
     role="status"
     className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
    >
     <p className="font-medium text-destructive">未來取消堂（今天起）</p>
     <Button type="button" variant="outline" size="sm" onClick={exitFutureCancelled}>
      返回原日期及視圖
     </Button>
    </div>
   ) : null}

   {teacherScopeId ? (
    <div className="rounded-xl border border-info bg-info/90 px-4 py-3 text-sm text-info-foreground">
     你正以<strong>{teacherScopeName}</strong>身分瀏覽：僅顯示指派給您的排程與統計。
    </div>
   ) : null}

   {canManageSchedules && blankTeacherCount > 0 && !futureCancelledMode ? (
    <div
     role="status"
     className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-warning"
    >
     目前載入範圍有 <strong className="tabular-nums">{blankTeacherCount}</strong>{" "}
     堂排程未指定實際授課老師。老師時間表／點名紙可能看不到這些堂；請先補班別任教老師或為該堂指定老師。篩選老師選「未指派」可列出。
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

   <ScheduleOverview
    stats={{
     todayLesson: {
      status: todayKpiStatus,
      value: stats.status === "ready" ? stats.data.todayLessonCount : null,
     },
     cancelled: {
      status: cancelledKpiStatus,
      value: cancelledKpiStatus === "ready" ? cancelledData.rows.length : null,
     },
     todayHeadcount: {
      status: todayKpiStatus,
      value: stats.status === "ready" ? stats.data.todayStudentHeadcount : null,
     },
    }}
    statsError={stats.status === "error" || Boolean(cancelledData.error)}
    open={overviewOpen}
    onOpenChange={(open) => {
     if (isMobile) setOverviewOpenMobile(open)
     else setOverviewOpenDesktop(open)
    }}
    todayActive={!futureCancelledMode && displayStart === todayYmd}
    cancelledActive={futureCancelledMode}
    onTodayClick={onTodayCardClick}
    onCancelledClick={enterFutureCancelled}
   />

   <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
     <ScheduleFilters
      isMobile={isMobile}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      activeFilterCount={futureCancelledMode ? 0 : activeFilterCount}
      onReset={resetScheduleFilters}
      unassignedRoomCount={unassignedRoomCount}
      unassignedTeacherCount={blankTeacherCount}
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      advancedFilterIds={advancedFilterIds}
      enrollmentFilter={effectiveEnrollmentFilter}
      onCycleEnrollment={cycleEnrollmentFilter}
      classKindFilter={effectiveClassKindFilter}
      onCycleClassKind={cycleClassKindFilter}
      noRoomActive={effectiveNoRoomFilter}
      onToggleNoRoom={toggleNoRoomFilter}
      enrollmentDisabled={rosterLoading}
      paused={futureCancelledMode}
      teacherScopeId={teacherScopeId}
      teacherOptions={teacherOptions}
      effectiveTeacherFilterIds={effectiveTeacherFilterIds}
      onToggleTeacher={toggleTeacherFilter}
     />
     <div className="flex flex-wrap items-center gap-2">
      {futureCancelledMode ? null : (
       <div
        className="inline-flex min-h-10 rounded-lg border border-border bg-muted/30 p-0.5"
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
           : allowMobileDayView
             ? ([{ id: "day" as const, label: "週曆", icon: CalendarDays }] as const)
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
           "inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
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
      )}
      <Button
       type="button"
       variant="outline"
       size="default"
       className="gap-1.5 text-sm transition-all hover:bg-muted"
       disabled={csvDisabled}
       title={csvDisabled ? "點名冊人數尚未完成，請稍候再匯出" : undefined}
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
   </div>

   {isMobile && viewMode === "list" && !futureCancelledMode ? (
    <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
     列表建議使用桌面版；手機已改為「按日期」顯示。
    </p>
   ) : null}

   {effectiveViewMode !== "day" ? (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm">
     <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground">顯示起始日期：</span>
      <Input
       type="date"
       value={displayStart}
       onChange={(e) => {
        const next = e.target.value
        if (isYmd(next)) setDisplayStart(next)
       }}
       className="h-10 w-[12rem] cursor-pointer text-sm"
       disabled={futureCancelledMode}
      />
      {futureCancelledMode ? null : (
       <Button
        type="button"
        variant="outline"
        size="default"
        className="border-amber-400/80 text-sm text-amber-900 hover:bg-amber-50"
        onClick={jumpToday}
       >
        回到今天
       </Button>
      )}
     </div>
     <span className="tabular-nums text-muted-foreground">
      {rowsStale ? "正在更新 · " : null}
      {loading
       ? "載入課堂中…"
       : rosterLoading
         ? `已顯示 ${filtered.length} 堂 · 標記載入中…`
         : `顯示 ${filtered.length} 個排程`}
     </span>
    </div>
   ) : null}

   {effectiveViewMode === "byDate" ? (
    <ScheduleByDateList
     groups={byDateGroups}
     todayYmd={todayYmd}
     displayStart={displayStart}
     alerts={alerts}
     expandedScheduleId={expandedScheduleId}
     onToggleExpand={(id) => setExpandedScheduleId((cur) => (cur === id ? null : id))}
     onOpenRecord={openRecord}
     rosterLoading={rosterLoading}
     updating={rowsStale}
     canManageSchedules={canManageSchedules}
     teacherScopeId={teacherScopeId}
     rollCallEligibleIds={rollCallEligibleIds}
     highlightScheduleId={highlightScheduleId}
     loading={loading}
     renderActions={renderByDateActions}
     renderExpanded={renderExpanded}
    />
   ) : null}

   {effectiveViewMode === "list" ? (
    <ScheduleListTable
     rows={listTableRows}
     filterSourceRows={filtered}
     alerts={alerts}
     loading={loading}
     rosterLoading={rosterLoading}
     updating={rowsStale}
     emptyHint="此條件下沒有排程"
     sortKey={isScheduleListColumnId(listSortKey) ? listSortKey : "date"}
     sortDir={listSortDir}
     onToggleSort={(key) => {
      if (listSortKey === key) setListSortDir((d) => (d === "asc" ? "desc" : "asc"))
      else {
       setListSortKey(key)
       setListSortDir("asc")
      }
     }}
     headerFilters={listHeaderFilters}
     onHeaderFilterChange={(key, value) =>
      setListHeaderFilters((prev) => ({ ...prev, [key]: value }))
     }
     todayYmd={todayYmd}
     teacherScopeId={teacherScopeId}
     canManageSchedules={canManageSchedules}
     previewId={listPreviewEnabled ? previewScheduleId : null}
     highlightScheduleId={highlightScheduleId}
     expandedScheduleId={expandedScheduleId}
     onToggleExpand={(id) => setExpandedScheduleId((cur) => (cur === id ? null : id))}
     onOpenRecord={openRecord}
     renderRowActions={renderListActions}
     renderStatusControl={renderStatusControl}
     renderExpanded={renderExpanded}
    />
   ) : null}

   {effectiveViewMode === "day" ? (
    <ScheduleDayViewPanel
     isMobile={isMobile}
     allowMobileDayView={allowMobileDayView}
     dayViewDate={dayViewDate}
     onDayViewDateChange={handleDayViewDateChange}
     onShiftDate={shiftDayViewDate}
     onJumpToday={jumpToday}
     loading={loading}
     dayViewDateLoaded={dayViewDateLoaded}
     dayViewRosterLoading={dayViewRosterLoading}
     dayFiltered={dayFiltered}
     dayUnfilteredCount={dayUnfilteredCount}
     dayUnassignedCount={dayUnassignedCount}
     dayViewFilterActive={dayViewFilterActive}
     scheduleMgmtLocked={scheduleMgmtLocked}
     assigning={assigning}
     onOneClickAssign={() => void oneClickAssign()}
     onClearFilters={clearAllFilters}
     closureName={closureNameByDate.get(dayViewDate)}
     studentRoster={dayViewRoster}
     emptyScheduleIds={emptyScheduleIds}
     extraTagsByScheduleId={extraTagsByScheduleId}
     roomColumns={roomColumns}
     activeRoomIdSet={activeRoomIdSet}
     roomColPct={dayViewRoomColPct}
     scheduleRowLocked={scheduleRowLocked}
     inactiveRoomName={inactiveRoomNameForSchedule}
     onOpenDetail={(id) => openRecord(id)}
     onMoveRequest={openMoveDialog}
     onDropOnCell={handleDropOnCell}
    />
   ) : null}
  </div>
 )

 return (
  <>
   {pageBody}

   <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
    <DialogContent className="max-w-md border-info text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">排程詳細資料</DialogTitle>
     </DialogHeader>
     {detailLoading || !detailRow ? (
      <SkeletonDetailHeader />
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
       <p
        className={cn(
         "text-muted-foreground",
         canManageSchedules && isUnassignedTeachingTeacherIssue(detailRow) && "font-medium text-warning"
        )}
       >
        老師：
        {scheduleTeacherDisplayName(detailRow, { warnIfUnassigned: canManageSchedules })}
       </p>
       {canManageSchedules && isUnassignedTeachingTeacherIssue(detailRow) ? (
        <p className="text-xs text-warning">
         未指定實際授課老師時，老師時間表／點名紙可能看不到此堂。
        </p>
       ) : null}
       {isHomeworkOccupancySchedule(detailRow) ? (
        <Tag tone={statusToTagTone("佔室")} size="sm">佔室</Tag>
       ) : null}
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
        {detailRow.roster_policy === "selected" ? (
         <Tag tone={statusToTagTone("加堂")} size="sm">挑選名單</Tag>
        ) : null}
       </div>
       {detailRow.status.includes("取消") && detailRow.cancel_reason ? (
        <p className="text-muted-foreground">取消原因：{detailRow.cancel_reason}</p>
       ) : null}
       {isHomeworkOccupancySchedule(detailRow) ? (
        <p className="text-sm text-muted-foreground">
         功輔佔室：放假請用功輔校曆。改課室請用日視圖拖曳或「移動到…」。
        </p>
       ) : canAssignSubstitute ? (
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
           roster_policy: detailRow.roster_policy,
           roster_confirmed_at: detailRow.roster_confirmed_at,
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
           enrollCount: null,
          })
         }}
        >
         {detailRow.original_teacher_id ? "更改／取消代堂" : "指派代堂"}
        </Button>
       ) : null}
       {canManageSchedules && !isHomeworkOccupancySchedule(detailRow) ? (
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
       {canManageSchedules && detailRow.roster_policy === "selected" ? (
        <p className="text-sm text-muted-foreground">
         此堂以挑選名單上紙。未點名前可到完整頁面改選就讀生。
        </p>
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
        {isHomeworkOccupancySchedule(pendingMove.row) ? (
         <>
          <br />
          <span>佔室時間維持 {pendingMove.newStart}–{pendingMove.newEnd}（只改課室）。</span>
         </>
        ) : (
         <>
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
         </>
        )}
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
         {isHomeworkOccupancySchedule(moveDialogSchedule) ? null : (
         <option value="__none__">未編課室</option>
         )}
        </Select>
       </label>
       {isHomeworkOccupancySchedule(moveDialogSchedule) ? (
        <p className="text-xs text-muted-foreground">功輔佔室只改課室，時間維持 15:15 起至當日結束。</p>
       ) : (
       <>
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
       </>
       )}
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
    <DialogContent className="max-h-[90vh] overflow-y-auto text-sm">
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
      {addExtra ? (
       addRosterLoading ? (
        <p className="text-sm text-muted-foreground">載入就讀生名單…</p>
       ) : (
        <ExtraLessonRosterPicker
         candidates={addRosterCandidates}
         selectedIds={addRosterIds}
         onChange={setAddRosterIds}
         disabled={addSaving}
        />
       )
      ) : null}
      {addConflicts.length > 0 ? (
       <div
        role="alert"
        className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
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
      {addErr ? <p role="alert" className="text-destructive">{addErr}</p> : null}
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
     dateEditable={true}
     teacherTid={teacherScopeId}
     isMobile={isMobile}
     onClose={() => setRollCallScheduleId(null)}
     onSaved={() => void reload()}
    />
   ) : null}
  </>
 )
}
