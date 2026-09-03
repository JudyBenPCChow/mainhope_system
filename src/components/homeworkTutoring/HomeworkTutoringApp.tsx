import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { ClipboardList } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { AdminWorkspaceNav } from "@/components/detail/AdminWorkspaceNav"
import {
 ADMIN_WORKSPACE_DESCRIPTION,
 adminWorkspacePageClass,
} from "@/lib/adminNavigation"
import { HomeworkTutoringTeacherAccess } from "@/components/homeworkTutoring/HomeworkTutoringTeacherAccess"
import { useAuth } from "@/lib/authBootstrap"
import { formatYearMonthLabel } from "@/lib/homeworkTutoringFees"
import { HW_PATH, homeworkTutoringHomePath, isHomeworkTutoringPath } from "@/lib/homeworkTutoringNav"
import { usesSharedAppShell, type MgmtRole } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { AdminHomeworkWorkbench } from "@/components/homeworkTutoring/AdminHomeworkWorkbench"
import { ManagerHomeworkWorkbench } from "@/components/homeworkTutoring/ManagerHomeworkWorkbench"
import { TeacherHomeworkWorkbench } from "@/components/homeworkTutoring/TeacherHomeworkWorkbench"
import {
  academicYearMonthBounds,
  clampYearMonth,
  currentYearMonth,
  composeHomeworkFeeDisplays,
  monthRosterToLock,
  shiftYearMonth,
  withSyncedLegacyTeachers,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type HomeworkDutyDay,
  type HomeworkFeeDisplay,
  type HomeworkHoliday,
  type HomeworkStudentRow,
  type HomeworkTeacherRow,
  type MonthRosterState,
} from "@/lib/homeworkTutoringUi"
import { toDutyMdKey } from "@/lib/homeworkTutoringSchedules"
import {
  ADMIN_NAV,
  MANAGER_NAV,
  TEACHER_NAV,
  type AdminPageId,
  type ManagerPageId,
  type TeacherPageId,
} from "@/components/homeworkTutoring/homeworkTutoringSectionNav"
import { fetchHomeworkTutoringTeacherAccess } from "@/services/homeworkTutoringAccessQueries"
import {
  fetchHomeworkPaidByStudentFromPayments,
  fetchHomeworkAvailabilityForMonth,
  fetchHomeworkClass,
  fetchHomeworkClosures,
  fetchHomeworkEnrollments,
  fetchHomeworkRosterMonth,
  publishHomeworkRosterMonth,
  clearHomeworkOccupancySchedules,
  setHomeworkRosterMonthStatus,
  upsertHomeworkAvailability,
  type HomeworkClassRef,
  type HomeworkEnrollmentRow,
} from "@/services/homeworkTutoringQueries"
import { applyHomeworkRosterStatusChange } from "@/lib/homeworkTutoringRosterPersist"
import {
 getHomeworkTutoringDataCache,
 isHomeworkTutoringCacheFresh,
 patchHomeworkTutoringDataCache,
 setHomeworkTutoringDataCache,
} from "@/components/homeworkTutoring/homeworkTutoringState"

const ADMIN_BY_PATH: Record<string, AdminPageId> = {
  [HW_PATH.overview]: "overview",
  [HW_PATH.students]: "students",
  [HW_PATH.fees]: "fees",
  [HW_PATH.roster]: "roster",
  [HW_PATH.calendar]: "calendar",
  [HW_PATH.settings]: "settings",
}

const MANAGER_BY_PATH: Record<string, ManagerPageId> = {
  [HW_PATH.supervise]: "home",
  [HW_PATH.duty]: "duty",
  [HW_PATH.progress]: "progress",
  [HW_PATH.feeAlerts]: "fees",
  [HW_PATH.teacherAccess]: "access",
}

const TEACHER_BY_PATH: Record<string, TeacherPageId> = {
  [HW_PATH.submit]: "submit",
  [HW_PATH.myDuty]: "myDuty",
}

const ADMIN_PATH: Record<AdminPageId, string> = {
  overview: HW_PATH.overview,
  students: HW_PATH.students,
  fees: HW_PATH.fees,
  roster: HW_PATH.roster,
  calendar: HW_PATH.calendar,
  settings: HW_PATH.settings,
}

const MANAGER_PATH: Record<ManagerPageId, string> = {
  home: HW_PATH.supervise,
  duty: HW_PATH.duty,
  progress: HW_PATH.progress,
  fees: HW_PATH.feeAlerts,
  access: HW_PATH.teacherAccess,
}

const TEACHER_PATH: Record<TeacherPageId, string> = {
  submit: HW_PATH.submit,
  myDuty: HW_PATH.myDuty,
}

function pathAllowedForRole(pathname: string, role: MgmtRole): boolean {
  if (ADMIN_BY_PATH[pathname]) return role === "admin" || role === "alien"
  if (MANAGER_BY_PATH[pathname]) return role === "manager" || role === "alien"
  if (TEACHER_BY_PATH[pathname]) return role === "teacher"
  return false
}

function holidayDisplayDate(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7))
  const d = Number(isoDate.slice(8, 10))
  if (!m || !d) return isoDate
  return `${m}/${d}`
}

function mapDutyDays(
  days: Array<{
    date: string
    weekday: string
    holiday?: string
    start: string
    end: string
    secondaryRoom: string | null
    primaryRoom: string | null
    secondaryTeacherId?: string
    primaryTeacherId?: string
    assignments?: HomeworkDutyDay["assignments"]
  }>
): HomeworkDutyDay[] {
  return days.map((d) => ({
    date: toDutyMdKey(d.date) ?? holidayDisplayDate(d.date),
    weekday: d.weekday,
    holiday: d.holiday,
    start: d.start,
    end: d.end,
    secondaryRoom: d.secondaryRoom,
    primaryRoom: d.primaryRoom,
    secondaryTeacherId: d.secondaryTeacherId,
    primaryTeacherId: d.primaryTeacherId,
    assignments: d.assignments ?? [],
  }))
}

/**
 * 正式功課輔導頁。側欄已掛；報讀／校曆／月費／報更／當值接 DB。
 * 編更確定後寫入 schedules 佔室（15:15 起；17D／17E）。
 */
export function HomeworkTutoringApp({ teacherNavVisible }: { teacherNavVisible: boolean }) {
  const { role, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  const initialHwCache = getHomeworkTutoringDataCache()
  const hydrateHw =
   initialHwCache != null && role != null && initialHwCache.role === role && initialHwCache.hwClass != null

  const [loading, setLoading] = useState(() => !hydrateHw)
  const [monthLoading, setMonthLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hwClass, setHwClass] = useState<HomeworkClassRef | null>(
   () => (hydrateHw ? initialHwCache!.hwClass : null)
  )
  const [students, setStudents] = useState<HomeworkStudentRow[]>(
   () => (hydrateHw ? initialHwCache!.students : [])
  )
  const [fees, setFees] = useState<HomeworkFeeDisplay[]>(
   () => (hydrateHw ? initialHwCache!.fees : [])
  )
  const [holidays, setHolidays] = useState<HomeworkHoliday[]>(
   () => (hydrateHw ? initialHwCache!.holidays : [])
  )
  const [avail, setAvail] = useState<AllTeacherAvailability>(
   () => (hydrateHw ? initialHwCache!.avail : {})
  )
  const [submitStatus, setSubmitStatus] = useState<AllTeacherSubmitStatus>(
   () => (hydrateHw ? initialHwCache!.submitStatus : {})
  )
  const [dutyDays, setDutyDays] = useState<HomeworkDutyDay[]>(
   () => (hydrateHw ? initialHwCache!.dutyDays : [])
  )
  const [dutyViewDays, setDutyViewDays] = useState<HomeworkDutyDay[]>(
    () => (hydrateHw ? initialHwCache!.dutyViewDays ?? [] : [])
  )
  const [calendarDutyDays, setCalendarDutyDays] = useState<HomeworkDutyDay[]>(
    () => (hydrateHw ? initialHwCache!.calendarDutyDays ?? [] : [])
  )
  const [rosterMonthId, setRosterMonthId] = useState<string>(
   () => (hydrateHw ? initialHwCache!.rosterMonthId : "")
  )
  const [monthRosterStatus, setMonthRosterStatus] = useState<Record<string, MonthRosterState>>(
   () => (hydrateHw ? initialHwCache!.monthRosterStatus : {})
  )
  const [hwTeachers, setHwTeachers] = useState<HomeworkTeacherRow[]>(
   () => (hydrateHw ? initialHwCache!.hwTeachers : [])
  )
  const [hwAccessIds, setHwAccessIds] = useState<Set<string>>(
   () => (hydrateHw ? initialHwCache!.hwAccessIds : new Set())
  )

  const viewMonth = currentYearMonth()
  const defaultRosterMonth = useMemo(() => shiftYearMonth(viewMonth, 1), [viewMonth])
  const [sheetMonth, setSheetMonth] = useState(
   () => (hydrateHw ? initialHwCache!.sheetMonth : defaultRosterMonth)
  )
  const sheetMonthRef = useRef(sheetMonth)
  sheetMonthRef.current = sheetMonth
  const availRef = useRef(avail)
  availRef.current = avail
  const submitStatusRef = useRef(submitStatus)
  submitStatusRef.current = submitStatus
  const monthRosterStatusRef = useRef(monthRosterStatus)
  monthRosterStatusRef.current = monthRosterStatus
  const loadedMonthRef = useRef(hydrateHw ? initialHwCache!.loadedMonth : "")
  const [dutyViewMonth, setDutyViewMonth] = useState(() => {
    const bounds = academicYearMonthBounds("2627")
    if (hydrateHw) {
      return initialHwCache!.dutyViewMonth ?? clampYearMonth(currentYearMonth(), bounds.min, bounds.max)
    }
    return clampYearMonth(currentYearMonth(), bounds.min, bounds.max)
  })
  const dutyViewMonthRef = useRef(dutyViewMonth)
  dutyViewMonthRef.current = dutyViewMonth

  useEffect(() => {
    if (hydrateHw) return
    setSheetMonth(defaultRosterMonth)
  }, [defaultRosterMonth, hydrateHw])

  const applyRosterDays = useCallback((yearMonth: string, days: HomeworkDutyDay[], rosterId: string, status: MonthRosterState) => {
    setMonthRosterStatus((prev) => {
      const next = { ...prev, [yearMonth]: status }
      monthRosterStatusRef.current = next
      return next
    })
    if (yearMonth === sheetMonthRef.current) {
      setDutyDays(days)
      setRosterMonthId(rosterId)
    }
    if (yearMonth === dutyViewMonthRef.current) {
      setDutyViewDays(days)
    }
    if (yearMonth === currentYearMonth()) {
      setCalendarDutyDays(days)
    }
  }, [])

  const loadMonthData = useCallback(
    async (
      cls: HomeworkClassRef,
      yearMonth: string,
      enabledTeachers: HomeworkTeacherRow[]
    ) => {
      const [availRows, roster] = await Promise.all([
        fetchHomeworkAvailabilityForMonth(yearMonth),
        fetchHomeworkRosterMonth({
          classId: cls.id,
          academicYearId: cls.academicYearId,
          yearMonth,
        }),
      ])

      const nextAvail: AllTeacherAvailability = {}
      const nextStatus: AllTeacherSubmitStatus = {}
      for (const row of availRows) {
        nextAvail[row.teacherId] = row.entries
        nextStatus[row.teacherId] = row.status
      }
      for (const t of enabledTeachers) {
        if (!nextStatus[t.id]) nextStatus[t.id] = "未交"
      }
      setAvail(nextAvail)
      availRef.current = nextAvail
      setSubmitStatus(nextStatus)
      submitStatusRef.current = nextStatus
      const days = mapDutyDays(roster.days)
      applyRosterDays(yearMonth, days, roster.id, roster.status)
      loadedMonthRef.current = yearMonth
      patchHomeworkTutoringDataCache((c) => ({
        ...c,
        avail: nextAvail,
        submitStatus: nextStatus,
        rosterMonthId: yearMonth === sheetMonthRef.current ? roster.id : c.rosterMonthId,
        monthRosterStatus: { ...c.monthRosterStatus, [yearMonth]: roster.status },
        dutyDays: yearMonth === sheetMonthRef.current ? days : c.dutyDays,
        dutyViewDays: yearMonth === dutyViewMonthRef.current ? days : c.dutyViewDays,
        calendarDutyDays: yearMonth === currentYearMonth() ? days : c.calendarDutyDays,
        loadedMonth: yearMonth,
        sheetMonth: sheetMonthRef.current,
        dutyViewMonth: dutyViewMonthRef.current,
      }))
    },
    [applyRosterDays]
  )

  const loadDutyViewMonth = useCallback(
    async (cls: HomeworkClassRef, yearMonth: string) => {
      const roster = await fetchHomeworkRosterMonth({
        classId: cls.id,
        academicYearId: cls.academicYearId,
        yearMonth,
      })
      const days = mapDutyDays(roster.days)
      applyRosterDays(yearMonth, days, roster.id, roster.status)
      patchHomeworkTutoringDataCache((c) => ({
        ...c,
        monthRosterStatus: { ...c.monthRosterStatus, [yearMonth]: roster.status },
        dutyViewDays: yearMonth === dutyViewMonthRef.current ? days : c.dutyViewDays,
        calendarDutyDays: yearMonth === currentYearMonth() ? days : c.calendarDutyDays,
        dutyDays:
          yearMonth === sheetMonthRef.current
            ? days
            : c.dutyDays,
        rosterMonthId: yearMonth === sheetMonthRef.current ? roster.id : c.rosterMonthId,
      }))
    },
    [applyRosterDays]
  )

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setLoadError(null)
    try {
      const cls = await fetchHomeworkClass("2627")
      setHwClass(cls)
      if (!cls) {
        setStudents([])
        setFees([])
        setHolidays([])
        setDutyDays([])
        setDutyViewDays([])
        setCalendarDutyDays([])
        setLoadError("尚未建立 2627 功課輔導班（請確認 migration 已套用）。")
        return
      }

      const isTeacher = role === "teacher"
      const sheetTarget = sheetMonthRef.current || defaultRosterMonth
      const extraMonths = [
        ...new Set(
          [dutyViewMonthRef.current, currentYearMonth()].filter((m) => m && m !== sheetTarget)
        ),
      ]
      loadedMonthRef.current = sheetTarget
      const [enrolls, closures, access] = await Promise.all([
        isTeacher ? Promise.resolve([] as HomeworkEnrollmentRow[]) : fetchHomeworkEnrollments(cls.id),
        fetchHomeworkClosures(cls.academicYearId),
        fetchHomeworkTutoringTeacherAccess(),
      ])

      const studentRows: HomeworkStudentRow[] = enrolls.map((e) => ({
          id: e.studentId,
          name: e.studentName,
          code: e.studentCode,
          grade: e.grade,
          plan: e.plan,
          weekdays: e.weekdays,
          effectiveMonth: e.effectiveMonth,
          status: e.status,
        }))
      setStudents(studentRows)

      const feeRows = !isTeacher
        ? composeHomeworkFeeDisplays({
            classId: cls.id,
            billingMonth: viewMonth,
            enrollments: enrolls,
            paidByStudentId: await fetchHomeworkPaidByStudentFromPayments(cls.id, viewMonth),
          })
        : []
      setFees(feeRows)

      const holidayRows = closures.map((h) => ({
          date: toDutyMdKey(h.date) ?? holidayDisplayDate(h.date),
          label: h.label,
        }))
      setHolidays(holidayRows)

      const enabled = access.filter((t) => t.enabled)
      const teacherList = enabled.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subjectLabel,
      }))
      const accessIds = new Set(enabled.map((t) => t.id))
      setHwTeachers(teacherList)
      setHwAccessIds(accessIds)

      if (role) {
        setHomeworkTutoringDataCache({
          role,
          hwClass: cls,
          students: studentRows,
          fees: feeRows,
          holidays: holidayRows,
          avail: {},
          submitStatus: {},
          dutyDays: [],
          dutyViewDays: [],
          calendarDutyDays: [],
          rosterMonthId: "",
          monthRosterStatus: {},
          hwTeachers: teacherList,
          hwAccessIds: accessIds,
          loadedMonth: sheetTarget,
          sheetMonth: sheetMonthRef.current,
          dutyViewMonth: dutyViewMonthRef.current,
        })
      }

      await loadMonthData(cls, sheetTarget, teacherList)
      await Promise.all(extraMonths.map((m) => loadDutyViewMonth(cls, m)))
    } catch (e) {
      reportUserFacingError(e, { source: "HomeworkTutoringApp.reload" })
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [role, defaultRosterMonth, viewMonth, loadMonthData, loadDutyViewMonth])

  useEffect(() => {
    if (isHomeworkTutoringCacheFresh(role)) return
    void reload({ silent: hydrateHw })
  }, [reload, role, hydrateHw])

  const changeLoadedMonth = useCallback(
    async (yearMonth: string) => {
      if (!yearMonth || yearMonth === loadedMonthRef.current) return
      if (!hwClass) return
      setMonthLoading(true)
      setLoadError(null)
      try {
        await loadMonthData(hwClass, yearMonth, hwTeachers)
      } catch (e) {
        reportUserFacingError(e, { source: "HomeworkTutoringApp.changeMonth" })
        setLoadError(e instanceof Error ? e.message : String(e))
      } finally {
        setMonthLoading(false)
      }
    },
    [hwClass, hwTeachers, loadMonthData]
  )

  const handleSheetMonthChange = useCallback(
    async (yearMonth: string) => {
      if (yearMonth === sheetMonthRef.current) return
      setSheetMonth(yearMonth)
      sheetMonthRef.current = yearMonth
      patchHomeworkTutoringDataCache((c) => ({ ...c, sheetMonth: yearMonth }))
      await changeLoadedMonth(yearMonth)
    },
    [changeLoadedMonth]
  )

  const handleDutyViewMonthChange = useCallback(
    async (yearMonth: string) => {
      const bounds = academicYearMonthBounds(hwClass?.academicYearLabel ?? "2627")
      const next = clampYearMonth(yearMonth, bounds.min, bounds.max)
      if (next === dutyViewMonthRef.current) return
      setDutyViewMonth(next)
      dutyViewMonthRef.current = next
      patchHomeworkTutoringDataCache((c) => ({ ...c, dutyViewMonth: next }))
      if (!hwClass) return
      if (next === sheetMonthRef.current) {
        setDutyViewDays(dutyDays)
        return
      }
      setMonthLoading(true)
      setLoadError(null)
      try {
        await loadDutyViewMonth(hwClass, next)
      } catch (e) {
        reportUserFacingError(e, { source: "HomeworkTutoringApp.changeDutyViewMonth" })
        setLoadError(e instanceof Error ? e.message : String(e))
      } finally {
        setMonthLoading(false)
      }
    },
    [hwClass, dutyDays, loadDutyViewMonth]
  )

  useEffect(() => {
    if (!hwClass?.academicYearLabel) return
    const bounds = academicYearMonthBounds(hwClass.academicYearLabel)
    setDutyViewMonth((ym) => clampYearMonth(ym, bounds.min, bounds.max))
  }, [hwClass?.academicYearLabel])

  const persistTeacherAvail = useCallback(
    async (
      teacherId: string,
      status: "草稿" | "已提交",
      entries: AllTeacherAvailability,
      targetMonth = sheetMonthRef.current
    ) => {
      await upsertHomeworkAvailability({
        teacherId,
        targetMonth,
        status,
        entries: entries[teacherId] ?? {},
      })
    },
    []
  )

  const persistDraftAvailSnapshot = useCallback(
    async (entries: AllTeacherAvailability, statuses: AllTeacherSubmitStatus, targetMonth: string) => {
      for (const [teacherId, status] of Object.entries(statuses)) {
        if (status !== "草稿" && status !== "已提交") continue
        try {
          await persistTeacherAvail(teacherId, status, entries, targetMonth)
        } catch (e) {
          reportUserFacingError(e, { source: "HomeworkTutoringApp.persistTeacherAvail" })
          throw e
        }
      }
    },
    [persistTeacherAvail]
  )

  const persistTeacherAvailNow = useCallback(
    async (teacherId: string, status: "草稿" | "已提交") => {
      try {
        await persistTeacherAvail(teacherId, status, availRef.current)
        setSubmitStatus((prev) => {
          const next = { ...prev, [teacherId]: status }
          submitStatusRef.current = next
          patchHomeworkTutoringDataCache((c) => ({
            ...c,
            avail: availRef.current,
            submitStatus: next,
          }))
          return next
        })
      } catch (e) {
        reportUserFacingError(e, { source: "HomeworkTutoringApp.persistTeacherAvail" })
        throw e
      }
    },
    [persistTeacherAvail]
  )

  const setAvailKeepingRef: typeof setAvail = useCallback((action) => {
    setAvail((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      availRef.current = next
      return next
    })
  }, [])

  const persistMonthRosterStatus = useCallback(
    async (yearMonth: string, nextState: MonthRosterState) => {
      try {
        const next = await applyHomeworkRosterStatusChange({
          previous: monthRosterStatusRef.current,
          yearMonth,
          nextState,
          classId: hwClass?.id ?? null,
          rosterMonthId,
          sheetMonth,
          clearOccupancy: clearHomeworkOccupancySchedules,
          setRosterStatus: setHomeworkRosterMonthStatus,
        })
        monthRosterStatusRef.current = next
        setMonthRosterStatus(next)
        patchHomeworkTutoringDataCache((c) => ({ ...c, monthRosterStatus: next }))
      } catch (e) {
        reportUserFacingError(e, { source: "HomeworkTutoringApp.persistMonthRosterStatus" })
        throw e
      }
    },
    [hwClass, rosterMonthId, sheetMonth]
  )

  const handlePublishRoster = useCallback(
    async (yearMonth: string, monthDays: HomeworkDutyDay[]) => {
      if (!hwClass) throw new Error("尚未建立功課輔導班")
      await persistDraftAvailSnapshot(availRef.current, submitStatusRef.current, yearMonth)
      await publishHomeworkRosterMonth({
        classId: hwClass.id,
        academicYearId: hwClass.academicYearId,
        yearMonth,
        dutyDays: monthDays.map((d) => {
          const synced = withSyncedLegacyTeachers(d)
          return {
            date: synced.date,
            weekday: synced.weekday,
            holiday: synced.holiday,
            start: synced.start,
            end: synced.end,
            secondaryRoom: synced.secondaryRoom,
            primaryRoom: synced.primaryRoom,
            secondaryTeacherId: synced.secondaryTeacherId,
            primaryTeacherId: synced.primaryTeacherId,
            assignments: synced.assignments,
          }
        }),
      })
      await loadMonthData(hwClass, yearMonth, hwTeachers)
      const extras = [
        ...new Set(
          [dutyViewMonthRef.current, currentYearMonth()].filter((m) => m && m !== yearMonth)
        ),
      ]
      await Promise.all(extras.map((m) => loadDutyViewMonth(hwClass, m)))
    },
    [hwClass, hwTeachers, loadMonthData, loadDutyViewMonth, persistDraftAvailSnapshot]
  )

  const teacherPage = TEACHER_BY_PATH[pathname]
  const displayedMonth = teacherPage === "myDuty" ? dutyViewMonth : sheetMonth
  const teacherDutyDays = teacherPage === "myDuty" ? dutyViewDays : dutyDays
  const rosterPublishStatus = monthRosterToLock(monthRosterStatus[displayedMonth] ?? "未編更")
  const dutyViewPublishStatus = monthRosterToLock(monthRosterStatus[dutyViewMonth] ?? "未編更")

  if (!role) return null

  if (pathname === "/HomeworkTutoring" || !isHomeworkTutoringPath(pathname)) {
    return <Navigate to={homeworkTutoringHomePath(role)} replace />
  }

  if (!pathAllowedForRole(pathname, role)) {
    return <Navigate to={homeworkTutoringHomePath(role)} replace />
  }

  if (role === "teacher" && !teacherNavVisible) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center">
        <p className="font-medium text-foreground">沒有功課輔導入口</p>
        <p className="mt-2 text-sm text-muted-foreground">
          管理層尚未剔選你進入功課輔導。側欄亦不會顯示此分組。
        </p>
      </div>
    )
  }

  if (role === "teacher" && !profile?.teacherId) {
    return (
      <p className="text-sm text-muted-foreground">你的帳戶尚未連結老師資料，未能開啟功輔報更。</p>
    )
  }

  const adminPage = ADMIN_BY_PATH[pathname]
  const managerPage = MANAGER_BY_PATH[pathname]
  const teacherId = profile?.teacherId ?? hwTeachers[0]?.id ?? ""
  const teacherDisplayName = hwTeachers.find((t) => t.id === teacherId)?.name ?? ""

  let pageTitle = "功課輔導班"
  let PageIcon: LucideIcon = ClipboardList
  if (adminPage) {
    const item = ADMIN_NAV.find((p) => p.value === adminPage)
    pageTitle =
      role === "admin" && adminPage === "overview" ? "今日情況" : (item?.label ?? pageTitle)
    PageIcon = item?.icon ?? PageIcon
  } else if (managerPage) {
    const item = MANAGER_NAV.find((p) => p.value === managerPage)
    pageTitle = item?.label ?? pageTitle
    PageIcon = item?.icon ?? PageIcon
  } else if (teacherPage) {
    const item = TEACHER_NAV.find((p) => p.value === teacherPage)
    pageTitle = item?.label ?? pageTitle
    PageIcon = item?.icon ?? PageIcon
  }

  return (
    <div className={usesSharedAppShell(role) ? adminWorkspacePageClass : "space-y-4"}>
      {usesSharedAppShell(role) ? (
        <AdminPageHeader
          eyebrow="工作域"
          title={pageTitle}
          description={ADMIN_WORKSPACE_DESCRIPTION.homework}
          titleExtra={
            <span className="text-sm font-normal text-muted-foreground">
              {hwClass?.academicYearLabel ?? "2627"}學年 · {formatYearMonthLabel(viewMonth)}
            </span>
          }
        />
      ) : (
        <header>
          <div className="flex items-center gap-2">
            <PageIcon className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{pageTitle}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            功課輔導班｜{hwClass?.academicYearLabel ?? "2627"}學年｜
            {formatYearMonthLabel(viewMonth)}
          </p>
        </header>
      )}

      <AdminWorkspaceNav workspace="homework" />

      {loading || monthLoading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}
      {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}

      {!loading && !loadError && adminPage ? (
        <AdminHomeworkWorkbench
          tab={adminPage}
          onTabChange={(tab) => navigate(ADMIN_PATH[tab])}
          students={students}
          fees={fees}
          avail={avail}
          setAvail={setAvailKeepingRef}
          submitStatus={submitStatus}
          onPersistTeacherAvail={persistTeacherAvailNow}
          dutyDays={dutyDays}
          overviewDutyDays={calendarDutyDays}
          setDutyDays={setDutyDays}
          monthRosterStatus={monthRosterStatus}
          persistMonthRosterStatus={persistMonthRosterStatus}
          hwTeachers={hwTeachers}
          holidays={holidays}
          sheetMonth={sheetMonth}
          onSheetMonthChange={(ym) => {
            void handleSheetMonthChange(ym)
          }}
          onPublishRoster={handlePublishRoster}
        />
      ) : null}

      {managerPage === "access" ? <HomeworkTutoringTeacherAccess /> : null}

      {!loading && !loadError && managerPage && managerPage !== "access" ? (
        <ManagerHomeworkWorkbench
          tab={managerPage}
          onTabChange={(tab) => navigate(MANAGER_PATH[tab])}
          students={students}
          fees={fees}
          submitStatus={submitStatus}
          rosterPublishStatus={dutyViewPublishStatus}
          hwTeachers={hwTeachers}
          hwAccessIds={hwAccessIds}
          dutyDays={dutyViewDays}
          dutyMonth={dutyViewMonth}
          onDutyMonthChange={(ym) => {
            void handleDutyViewMonthChange(ym)
          }}
          rosterMonth={sheetMonth}
          academicYearLabel={hwClass?.academicYearLabel ?? "2627"}
          holidays={holidays}
          onToggleHwAccess={() => {
            void reload()
          }}
        />
      ) : null}

      {!loading && !loadError && teacherPage && teacherId ? (
        <TeacherHomeworkWorkbench
          tab={teacherPage}
          onTabChange={(tab) => navigate(TEACHER_PATH[tab])}
          teacherId={teacherId}
          teacherDisplayName={teacherDisplayName}
          avail={avail}
          setAvail={setAvailKeepingRef}
          submitStatus={submitStatus}
          onPersistTeacherAvail={persistTeacherAvailNow}
          rosterPublishStatus={rosterPublishStatus}
          dutyDays={teacherDutyDays}
          rosterMonthKey={displayedMonth}
          onRosterMonthChange={
            teacherPage === "myDuty"
              ? (ym) => {
                  void handleDutyViewMonthChange(ym)
                }
              : (ym) => {
                  void handleSheetMonthChange(ym)
                }
          }
          academicYearLabel={hwClass?.academicYearLabel ?? "2627"}
          holidays={holidays}
          teachers={hwTeachers}
        />
      ) : null}
    </div>
  )
}
