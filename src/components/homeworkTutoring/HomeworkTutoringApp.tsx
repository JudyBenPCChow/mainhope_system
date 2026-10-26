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
import { formatYearMonthLabel, type HomeworkDivision } from "@/lib/homeworkTutoringFees"
import {
  HW_DAY_LOGS_PATH,
  HW_PATH,
  homeworkTutoringHomePath,
  isHomeworkTutoringPath,
  isHwDayLogsPath,
  isTeacherDayLogsPath,
  isWorkspaceDayLogsPath,
  parseHwDayLogStudentId,
  teacherDayLogsTargetFromWorkspace,
  workspaceDayLogsTargetFromTeacher,
} from "@/lib/homeworkTutoringNav"
import { usesSharedAppShell, type MgmtRole } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { Select } from "@/components/ui/select"
import { AdminHomeworkWorkbench } from "@/components/homeworkTutoring/AdminHomeworkWorkbench"
import { HomeworkDayLogStudentPage } from "@/components/homeworkTutoring/HomeworkDayLogStudentPage"
import { ManagerHomeworkWorkbench } from "@/components/homeworkTutoring/ManagerHomeworkWorkbench"
import { TeacherHomeworkDayLogsShell } from "@/components/homeworkTutoring/TeacherHomeworkDayLogsShell"
import { TeacherHomeworkWorkbench } from "@/components/homeworkTutoring/TeacherHomeworkWorkbench"
import {
  academicYearMonthBounds,
  clampYearMonth,
  currentYearMonth,
  composeHomeworkFeeDisplays,
  monthRosterPublishStatus,
  shiftYearMonth,
  summarizeOverview,
  withSyncedLegacyTeachers,
  HOMEWORK_DIVISION_LABEL,
  HOMEWORK_DIVISION_ORDER,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type HomeworkCompanionRoster,
  type HomeworkDivisionDutyBoard,
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
  fetchHomeworkClasses,
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
  invalidateHomeworkTutoringDataCache,
  patchHomeworkTutoringDataCache,
  setHomeworkTutoringDataCache,
} from "@/components/homeworkTutoring/homeworkTutoringState"

const ADMIN_BY_PATH: Record<string, AdminPageId> = {
  [HW_PATH.overview]: "overview",
  [HW_PATH.dayLogs]: "dayLogs",
  [HW_PATH.students]: "students",
  [HW_PATH.fees]: "fees",
  [HW_PATH.roster]: "roster",
  [HW_PATH.calendar]: "calendar",
  [HW_PATH.settings]: "settings",
}

const MANAGER_BY_PATH: Record<string, ManagerPageId> = {
  [HW_PATH.supervise]: "home",
  [HW_PATH.dayLogs]: "dayLogs",
  [HW_PATH.duty]: "duty",
  [HW_PATH.progress]: "progress",
  [HW_PATH.feeAlerts]: "fees",
  [HW_PATH.teacherAccess]: "access",
}

const TEACHER_BY_PATH: Record<string, TeacherPageId> = {
  [HW_PATH.dayLogs]: "dayLogs",
  [HW_PATH.submit]: "submit",
  [HW_PATH.myDuty]: "myDuty",
}

const ADMIN_PATH: Record<AdminPageId, string> = {
  overview: HW_PATH.overview,
  dayLogs: HW_PATH.dayLogs,
  students: HW_PATH.students,
  fees: HW_PATH.fees,
  roster: HW_PATH.roster,
  calendar: HW_PATH.calendar,
  settings: HW_PATH.settings,
}

const MANAGER_PATH: Record<ManagerPageId, string> = {
  home: HW_PATH.supervise,
  dayLogs: HW_PATH.dayLogs,
  duty: HW_PATH.duty,
  progress: HW_PATH.progress,
  fees: HW_PATH.feeAlerts,
  access: HW_PATH.teacherAccess,
}

const TEACHER_PATH: Record<TeacherPageId, string> = {
  dayLogs: HW_DAY_LOGS_PATH,
  submit: HW_PATH.submit,
  myDuty: HW_PATH.myDuty,
}

function pathAllowedForRole(pathname: string, role: MgmtRole): boolean {
  if (isHwDayLogsPath(pathname)) {
    return (
      role === "admin" ||
      role === "manager" ||
      role === "alien" ||
      role === "teacher"
    )
  }
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

function toStudentRows(enrolls: HomeworkEnrollmentRow[]): HomeworkStudentRow[] {
  return enrolls.map((e) => ({
    id: e.studentId,
    name: e.studentName,
    code: e.studentCode,
    grade: e.grade,
    plan: e.plan,
    weekdays: e.weekdays,
    effectiveMonth: e.effectiveMonth,
    status: e.status,
  }))
}

/**
 * 正式功課輔導頁。側欄已掛；報讀／校曆／月費／報更／當值接 DB。
 * 編更確定後寫入 schedules 佔室（15:15 起；預設課室可調）。
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
  const [hwClasses, setHwClasses] = useState<HomeworkClassRef[]>(
    () => (hydrateHw ? initialHwCache!.hwClasses ?? [] : [])
  )
  const [companion, setCompanion] = useState<HomeworkCompanionRoster | null>(
    () => (hydrateHw ? initialHwCache!.companion ?? null : null)
  )
  const [division, setDivision] = useState<HomeworkDivision>(
    () => initialHwCache?.hwClass?.division ?? "secondary"
  )
  const divisionRef = useRef(division)
  divisionRef.current = division
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
  const [teacherDutyBoards, setTeacherDutyBoards] = useState<HomeworkDivisionDutyBoard[]>(
    () => (hydrateHw ? initialHwCache!.teacherDutyBoards ?? [] : [])
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

  const dutyBoardRequestRef = useRef(0)
  const loadTeacherDutyBoards = useCallback(
    async (classes: HomeworkClassRef[], yearMonth: string) => {
      if (role !== "teacher") {
        setTeacherDutyBoards([])
        patchHomeworkTutoringDataCache((c) => ({ ...c, teacherDutyBoards: [] }))
        return
      }
      const request = ++dutyBoardRequestRef.current
      const ordered = HOMEWORK_DIVISION_ORDER.flatMap((division) => {
        const cls = classes.find((c) => c.division === division)
        return cls ? [cls] : []
      })
      const boards = await Promise.all(
        ordered.map(async (cls) => {
          const roster = await fetchHomeworkRosterMonth({
            classId: cls.id,
            academicYearId: cls.academicYearId,
            yearMonth,
          })
          const board: HomeworkDivisionDutyBoard = {
            division: cls.division,
            classroomName: cls.classroomName,
            yearMonth,
            status: roster.status,
            dutyDays: mapDutyDays(roster.days),
          }
          return board
        })
      )
      if (request !== dutyBoardRequestRef.current) return
      if (yearMonth !== dutyViewMonthRef.current) return
      setTeacherDutyBoards(boards)
      patchHomeworkTutoringDataCache((c) => ({ ...c, teacherDutyBoards: boards }))
    },
    [role]
  )

  const loadCompanion = useCallback(
    async (classes: HomeworkClassRef[], active: HomeworkClassRef, yearMonth: string) => {
      const other =
        role === "teacher" ? null : classes.find((c) => c.division !== active.division) ?? null
      if (!other) {
        setCompanion(null)
        patchHomeworkTutoringDataCache((c) => ({ ...c, companion: null }))
        return
      }
      const [enrolls, roster] = await Promise.all([
        fetchHomeworkEnrollments(other.id),
        fetchHomeworkRosterMonth({
          classId: other.id,
          academicYearId: other.academicYearId,
          yearMonth,
        }),
      ])
      const next: HomeworkCompanionRoster = {
        division: other.division,
        classroomName: other.classroomName,
        yearMonth,
        status: roster.status,
        students: toStudentRows(enrolls),
        dutyDays: mapDutyDays(roster.days),
      }
      setCompanion(next)
      patchHomeworkTutoringDataCache((c) => ({ ...c, companion: next }))
    },
    [role]
  )

  const reload = useCallback(async (opts?: { silent?: boolean; divisionOverride?: HomeworkDivision }) => {
    if (!opts?.silent) setLoading(true)
    setLoadError(null)
    try {
      const classes = await fetchHomeworkClasses("2627")
      setHwClasses(classes)
      const want = opts?.divisionOverride ?? divisionRef.current
      const cls =
        classes.find((c) => c.division === want) ??
        classes.find((c) => c.division === "secondary") ??
        classes[0] ??
        null
      if (cls) {
        setDivision(cls.division)
        divisionRef.current = cls.division
      }
      setHwClass(cls)
      if (!cls) {
        setStudents([])
        setFees([])
        setHolidays([])
        setDutyDays([])
        setDutyViewDays([])
        setTeacherDutyBoards([])
        setCalendarDutyDays([])
        setCompanion(null)
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
      // 老師亦需報讀名冊（功課紀錄）；月費仍只給非老師。
      const [enrolls, closures, access] = await Promise.all([
        fetchHomeworkEnrollments(cls.id),
        fetchHomeworkClosures(cls.academicYearId),
        fetchHomeworkTutoringTeacherAccess(),
      ])

      const studentRows = toStudentRows(enrolls)
      setStudents(studentRows)

      const feeRows = !isTeacher
        ? composeHomeworkFeeDisplays({
            classId: cls.id,
            billingMonth: viewMonth,
            division: cls.division,
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
          hwClasses: classes,
          hwClass: cls,
          companion: null,
          students: studentRows,
          fees: feeRows,
          holidays: holidayRows,
          avail: {},
          submitStatus: {},
          dutyDays: [],
          dutyViewDays: [],
          calendarDutyDays: [],
          teacherDutyBoards: role === "teacher" ? null : [],
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
      await Promise.all([
        ...extraMonths.map((m) => loadDutyViewMonth(cls, m)),
        loadCompanion(classes, cls, sheetTarget),
        loadTeacherDutyBoards(classes, dutyViewMonthRef.current),
      ])
    } catch (e) {
      reportUserFacingError(e, { source: "HomeworkTutoringApp.reload" })
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [role, defaultRosterMonth, viewMonth, loadMonthData, loadDutyViewMonth, loadCompanion, loadTeacherDutyBoards])

  const handleDivisionChange = useCallback(
    (next: string) => {
      const d = next === "primary" ? "primary" : "secondary"
      if (d === divisionRef.current) return
      setDivision(d)
      divisionRef.current = d
      invalidateHomeworkTutoringDataCache()
      void reload({ divisionOverride: d })
    },
    [reload]
  )

  const [pendingEdit, setPendingEdit] = useState<{ date: string; division: HomeworkDivision } | null>(
    null
  )
  const clearPendingEdit = useCallback(() => setPendingEdit(null), [])

  const handleEditCompanionDay = useCallback(
    (date: string) => {
      if (!companion) return
      setPendingEdit({ date, division: companion.division })
      handleDivisionChange(companion.division)
    },
    [companion, handleDivisionChange]
  )

  useEffect(() => {
    if (!role) return
    const cached = getHomeworkTutoringDataCache()
    const teacherBoardsMissing =
      role === "teacher" && cached?.hwClass != null && cached.teacherDutyBoards == null
    if (isHomeworkTutoringCacheFresh(role) && !teacherBoardsMissing) return
    void reload({ silent: hydrateHw || teacherBoardsMissing })
  }, [reload, role, hydrateHw])

  const changeLoadedMonth = useCallback(
    async (yearMonth: string) => {
      if (!yearMonth || yearMonth === loadedMonthRef.current) return
      if (!hwClass) return
      setMonthLoading(true)
      setLoadError(null)
      try {
        await Promise.all([
          loadMonthData(hwClass, yearMonth, hwTeachers),
          loadCompanion(hwClasses, hwClass, yearMonth),
        ])
      } catch (e) {
        reportUserFacingError(e, { source: "HomeworkTutoringApp.changeMonth" })
        setLoadError(e instanceof Error ? e.message : String(e))
      } finally {
        setMonthLoading(false)
      }
    },
    [hwClass, hwClasses, hwTeachers, loadMonthData, loadCompanion]
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
      if (next === sheetMonthRef.current) setDutyViewDays(dutyDays)
      const jobs: Promise<void>[] = []
      if (role === "teacher") jobs.push(loadTeacherDutyBoards(hwClasses, next))
      if (next !== sheetMonthRef.current) jobs.push(loadDutyViewMonth(hwClass, next))
      if (jobs.length === 0) return
      setMonthLoading(true)
      setLoadError(null)
      try {
        await Promise.all(jobs)
      } catch (e) {
        reportUserFacingError(e, { source: "HomeworkTutoringApp.changeDutyViewMonth" })
        setLoadError(e instanceof Error ? e.message : String(e))
      } finally {
        setMonthLoading(false)
      }
    },
    [hwClass, hwClasses, dutyDays, loadDutyViewMonth, loadTeacherDutyBoards, role]
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

  const dayLogStudentId = parseHwDayLogStudentId(pathname)
  const onDayLogs = isWorkspaceDayLogsPath(pathname)
  const dayLogOverview = useMemo(
    () => summarizeOverview(students, fees, calendarDutyDays),
    [students, fees, calendarDutyDays]
  )
  const dayLogTodayDuty = dayLogOverview.todayDuty

  const teacherPage =
    role === "teacher"
      ? TEACHER_BY_PATH[pathname] ?? (onDayLogs ? ("dayLogs" as const) : undefined)
      : undefined
  const displayedMonth = teacherPage === "myDuty" ? dutyViewMonth : sheetMonth
  const teacherDutyDays = teacherPage === "myDuty" ? dutyViewDays : dutyDays
  const rosterPublishStatus = monthRosterPublishStatus(monthRosterStatus[displayedMonth] ?? "未編更")
  const dutyViewPublishStatus = monthRosterPublishStatus(monthRosterStatus[dutyViewMonth] ?? "未編更")

  if (!role) return null

  if (role === "teacher" && isWorkspaceDayLogsPath(pathname)) {
    return <Navigate to={teacherDayLogsTargetFromWorkspace(pathname)} replace />
  }

  if (role !== "teacher" && isTeacherDayLogsPath(pathname)) {
    return <Navigate to={workspaceDayLogsTargetFromTeacher(pathname)} replace />
  }

  const onTeacherDayLogs = role === "teacher" && isTeacherDayLogsPath(pathname)

  if (!onTeacherDayLogs && (pathname === "/HomeworkTutoring" || !isHomeworkTutoringPath(pathname))) {
    return <Navigate to={homeworkTutoringHomePath(role)} replace />
  }

  if (!onTeacherDayLogs && !pathAllowedForRole(pathname, role)) {
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

  const adminPage =
    role === "admin" || role === "alien"
      ? ADMIN_BY_PATH[pathname] ?? (onDayLogs ? ("dayLogs" as const) : undefined)
      : undefined
  const managerPage =
    role === "manager" || (role === "alien" && !adminPage)
      ? MANAGER_BY_PATH[pathname] ?? (onDayLogs ? ("dayLogs" as const) : undefined)
      : undefined
  const teacherId = profile?.teacherId ?? hwTeachers[0]?.id ?? ""
  const teacherDisplayName = hwTeachers.find((t) => t.id === teacherId)?.name ?? ""
  const dayLogStudent = dayLogStudentId
    ? students.find((s) => s.id === dayLogStudentId) ?? null
    : null

  if (onTeacherDayLogs) {
    return (
      <TeacherHomeworkDayLogsShell
        loading={loading || monthLoading}
        loadError={loadError}
        students={students}
        hwTeachers={hwTeachers}
        todayDuty={dayLogTodayDuty}
        todayWeekday={dayLogOverview.todayWeekday}
        todayCount={dayLogOverview.todayCount}
        holidayLabel={dayLogTodayDuty?.holiday ?? null}
        holidays={holidays}
        academicYearLabel={hwClass?.academicYearLabel ?? "2627"}
        preferredTeacherId={profile?.teacherId ?? null}
        studentId={dayLogStudentId}
        student={dayLogStudent}
      />
    )
  }

  let pageTitle = "功課輔導班"
  let PageIcon: LucideIcon = ClipboardList
  if (dayLogStudent) {
    pageTitle = `${dayLogStudent.name} · 功課紀錄`
    PageIcon = ADMIN_NAV.find((p) => p.value === "dayLogs")?.icon ?? PageIcon
  } else if (adminPage) {
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

      {hwClasses.length > 1 && role !== "teacher" ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="hw-division">
            學部
          </label>
          <Select
            id="hw-division"
            className="w-40"
            value={division}
            onChange={(e) => handleDivisionChange(e.target.value)}
            aria-label="功輔學部"
          >
            {hwClasses.some((c) => c.division === "secondary") ? (
              <option value="secondary">{HOMEWORK_DIVISION_LABEL.secondary}</option>
            ) : null}
            {hwClasses.some((c) => c.division === "primary") ? (
              <option value="primary">{HOMEWORK_DIVISION_LABEL.primary}</option>
            ) : null}
          </Select>
          {hwClass?.classroomName ? (
            <span className="text-xs text-muted-foreground">
              預設課室 {hwClass.classroomName}
              {hwClass.timeSlot ? ` · ${hwClass.timeSlot}` : ""}
            </span>
          ) : null}
        </div>
      ) : null}

      {loading || monthLoading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}
      {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}

      {!loading && !loadError && dayLogStudentId ? (
        dayLogStudent ? (
          <HomeworkDayLogStudentPage
            student={dayLogStudent}
            hwTeachers={hwTeachers}
            todayDuty={dayLogTodayDuty}
            holidays={holidays}
            academicYearLabel={hwClass?.academicYearLabel ?? "2627"}
            canDelete={role === "admin" || role === "manager" || role === "alien"}
            preferredTeacherId={profile?.teacherId ?? teacherId ?? null}
          />
        ) : (
          <div className="space-y-3 rounded-xl border border-dashed border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">找不到此學生的功輔報讀紀錄。</p>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => navigate(HW_PATH.dayLogs)}
            >
              返回圖庫
            </button>
          </div>
        )
      ) : null}

      {!loading && !loadError && !dayLogStudentId && adminPage ? (
        <AdminHomeworkWorkbench
          tab={adminPage}
          onTabChange={(tab) => navigate(ADMIN_PATH[tab])}
          division={hwClass?.division ?? division}
          defaultRoomA={hwClass?.classroomName ?? undefined}
          companion={companion}
          onEditCompanionDay={handleEditCompanionDay}
          initialEditDate={
            pendingEdit && pendingEdit.division === hwClass?.division ? pendingEdit.date : null
          }
          onInitialEditHandled={clearPendingEdit}
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
          academicYearLabel={hwClass?.academicYearLabel ?? "2627"}
          canDeleteDayLogs={role === "admin" || role === "manager" || role === "alien"}
          preferredTeacherId={profile?.teacherId ?? null}
        />
      ) : null}

      {!loading && !loadError && !dayLogStudentId && managerPage === "access" ? (
        <HomeworkTutoringTeacherAccess />
      ) : null}

      {!loading && !loadError && !dayLogStudentId && managerPage && managerPage !== "access" ? (
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
          overviewDutyDays={calendarDutyDays}
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

      {!loading && !loadError && !dayLogStudentId && teacherPage && teacherId ? (
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
          dutyBoards={
            teacherPage === "myDuty"
              ? HOMEWORK_DIVISION_ORDER.flatMap((division) => {
                  const cls = hwClasses.find((c) => c.division === division)
                  if (!cls) return []
                  const loaded = teacherDutyBoards.find(
                    (b) => b.division === division && b.yearMonth === dutyViewMonth
                  )
                  return [
                    {
                      division,
                      classroomName: loaded?.classroomName ?? cls.classroomName,
                      yearMonth: dutyViewMonth,
                      status: loaded?.status ?? "未編更",
                      dutyDays: loaded?.dutyDays ?? [],
                      ready: Boolean(loaded),
                    },
                  ]
                })
              : undefined
          }
          students={students}
          overviewDutyDays={calendarDutyDays}
        />
      ) : null}
    </div>
  )
}
