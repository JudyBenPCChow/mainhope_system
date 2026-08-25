import { useCallback, useEffect, useMemo, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { ClipboardList } from "lucide-react"

import { HomeworkTutoringTeacherAccess } from "@/components/homeworkTutoring/HomeworkTutoringTeacherAccess"
import { useAuth } from "@/lib/authBootstrap"
import { formatYearMonthLabel } from "@/lib/homeworkTutoringFees"
import { HW_PATH, homeworkTutoringHomePath, isHomeworkTutoringPath } from "@/lib/homeworkTutoringNav"
import type { MgmtRole } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { AdminHomeworkWorkbench } from "@/prototypes/homeworkTutoring/AdminHomeworkWorkbench"
import { ManagerHomeworkWorkbench } from "@/prototypes/homeworkTutoring/ManagerHomeworkWorkbench"
import { TeacherHomeworkWorkbench } from "@/prototypes/homeworkTutoring/TeacherHomeworkWorkbench"
import {
  currentYearMonth,
  monthRosterToLock,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type MockDutyDay,
  type MockFeeRow,
  type MockHoliday,
  type MockStudent,
  type MockTeacher,
  type MonthRosterState,
} from "@/prototypes/homeworkTutoring/mockData"
import {
  ADMIN_NAV,
  MANAGER_NAV,
  TEACHER_NAV,
  type AdminPageId,
  type ManagerPageId,
  type TeacherPageId,
} from "@/prototypes/homeworkTutoring/sandboxNav"
import { fetchHomeworkTutoringTeacherAccess } from "@/services/homeworkTutoringAccessQueries"
import {
  ensureHomeworkMonthlyCharges,
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
} from "@/services/homeworkTutoringQueries"

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

/**
 * 正式功課輔導頁。側欄已掛；報讀／校曆／月費／報更／當值接 DB。
 * 編更確定後寫入 schedules 佔室（15:15 起；17D／17E）。
 */
export function HomeworkTutoringApp({ teacherNavVisible }: { teacherNavVisible: boolean }) {
  const { role, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hwClass, setHwClass] = useState<HomeworkClassRef | null>(null)
  const [students, setStudents] = useState<MockStudent[]>([])
  const [fees, setFees] = useState<MockFeeRow[]>([])
  const [holidays, setHolidays] = useState<MockHoliday[]>([])
  const [avail, setAvail] = useState<AllTeacherAvailability>({})
  const [submitStatus, setSubmitStatus] = useState<AllTeacherSubmitStatus>({})
  const [dutyDays, setDutyDays] = useState<MockDutyDay[]>([])
  const [rosterMonthId, setRosterMonthId] = useState<string>("")
  const [monthRosterStatus, setMonthRosterStatus] = useState<Record<string, MonthRosterState>>({})
  const [hwTeachers, setHwTeachers] = useState<MockTeacher[]>([])
  const [hwAccessIds, setHwAccessIds] = useState<Set<string>>(() => new Set())

  const viewMonth = currentYearMonth()
  const rosterMonthKey = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number)
    if (!y || !m) return viewMonth
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`
    return next
  }, [viewMonth])

  const reload = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const cls = await fetchHomeworkClass("2627")
      setHwClass(cls)
      if (!cls) {
        setStudents([])
        setFees([])
        setHolidays([])
        setDutyDays([])
        setLoadError("尚未建立 2627 功課輔導班（請確認 migration 已套用）。")
        return
      }

      const [enrolls, closures, access, availRows, roster] = await Promise.all([
        fetchHomeworkEnrollments(cls.id),
        fetchHomeworkClosures(cls.academicYearId),
        fetchHomeworkTutoringTeacherAccess(),
        fetchHomeworkAvailabilityForMonth(rosterMonthKey),
        fetchHomeworkRosterMonth({
          classId: cls.id,
          academicYearId: cls.academicYearId,
          yearMonth: rosterMonthKey,
        }),
      ])

      setStudents(
        enrolls.map((e) => ({
          id: e.studentId,
          name: e.studentName,
          code: e.studentCode,
          grade: e.grade,
          plan: e.plan === "七日" ? "七日" : e.plan,
          weekdays: e.weekdays,
          effectiveMonth: e.effectiveMonth,
          status: e.status,
        }))
      )

      const feeRows = await ensureHomeworkMonthlyCharges({
        academicYearId: cls.academicYearId,
        classId: cls.id,
        billingMonth: viewMonth,
        enrollments: enrolls,
      })
      setFees(
        feeRows.map((f) => ({
          studentId: f.studentId,
          amountLabel: f.amountLabel,
          status: f.status === "已收款" ? "已收款" : "未收款",
        }))
      )

      setHolidays(
        closures.map((h) => ({
          date: holidayDisplayDate(h.date),
          label: h.label,
        }))
      )

      const enabled = access.filter((t) => t.enabled)
      setHwTeachers(enabled.map((t) => ({ id: t.id, name: t.name, subject: t.subjectLabel })))
      setHwAccessIds(new Set(enabled.map((t) => t.id)))

      const nextAvail: AllTeacherAvailability = {}
      const nextStatus: AllTeacherSubmitStatus = {}
      for (const row of availRows) {
        nextAvail[row.teacherId] = row.entries
        nextStatus[row.teacherId] = row.status
      }
      for (const t of enabled) {
        if (!nextStatus[t.id]) nextStatus[t.id] = "未交"
      }
      setAvail(nextAvail)
      setSubmitStatus(nextStatus)

      setRosterMonthId(roster.id)
      setMonthRosterStatus({ [rosterMonthKey]: roster.status })
      setDutyDays(
        roster.days.map((d) => ({
          date: holidayDisplayDate(d.date),
          weekday: d.weekday,
          holiday: d.holiday,
          start: d.start,
          end: d.end,
          secondaryRoom: d.secondaryRoom,
          primaryRoom: d.primaryRoom,
          secondaryTeacherId: d.secondaryTeacherId,
          primaryTeacherId: d.primaryTeacherId,
        }))
      )
    } catch (e) {
      reportUserFacingError(e, { source: "HomeworkTutoringApp.reload" })
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [rosterMonthKey, viewMonth])

  useEffect(() => {
    void reload()
  }, [reload])

  const persistTeacherAvail = useCallback(
    async (teacherId: string, status: "草稿" | "已提交", entries: AllTeacherAvailability) => {
      try {
        await upsertHomeworkAvailability({
          teacherId,
          targetMonth: rosterMonthKey,
          status,
          entries: entries[teacherId] ?? {},
        })
      } catch (e) {
        reportUserFacingError(e, { source: "HomeworkTutoringApp.persistTeacherAvail" })
      }
    },
    [rosterMonthKey]
  )

  const setAvailAndMaybePersist: typeof setAvail = useCallback(
    (action) => {
      setAvail((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        return next
      })
    },
    []
  )

  const setSubmitStatusPersisted: typeof setSubmitStatus = useCallback(
    (action) => {
      setSubmitStatus((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        for (const [teacherId, status] of Object.entries(next)) {
          if (status === "草稿" || status === "已提交") {
            void persistTeacherAvail(teacherId, status, avail)
          }
        }
        return next
      })
    },
    [avail, persistTeacherAvail]
  )

  const setMonthRosterStatusPersisted: typeof setMonthRosterStatus = useCallback(
    (action) => {
      setMonthRosterStatus((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        for (const [ym, state] of Object.entries(next)) {
          if (prev[ym] === state) continue
          if (state === "未編更" && hwClass && ym) {
            void clearHomeworkOccupancySchedules(hwClass.id, ym).catch((e) => {
              reportUserFacingError(e, { source: "HomeworkTutoringApp.revertSchedules" })
            })
          }
          if (rosterMonthId && ym === rosterMonthKey && (state === "未編更" || state === "已編更")) {
            void setHomeworkRosterMonthStatus(rosterMonthId, state).catch((e) => {
              reportUserFacingError(e, { source: "HomeworkTutoringApp.setRosterStatus" })
            })
          }
        }
        return next
      })
    },
    [hwClass, rosterMonthId, rosterMonthKey]
  )

  const handlePublishRoster = useCallback(
    async (yearMonth: string, monthDays: MockDutyDay[]) => {
      if (!hwClass) throw new Error("尚未建立功課輔導班")
      await publishHomeworkRosterMonth({
        classId: hwClass.id,
        academicYearId: hwClass.academicYearId,
        yearMonth,
        dutyDays: monthDays.map((d) => ({
          date: d.date,
          weekday: d.weekday,
          holiday: d.holiday,
          start: d.start,
          end: d.end,
          secondaryRoom: d.secondaryRoom,
          primaryRoom: d.primaryRoom,
          secondaryTeacherId: d.secondaryTeacherId,
          primaryTeacherId: d.primaryTeacherId,
        })),
      })
    },
    [hwClass]
  )

  const rosterPublishStatus = monthRosterToLock(monthRosterStatus[rosterMonthKey] ?? "未編更")

  if (!role) return null

  if (pathname === "/HomeworkTutoring" || !isHomeworkTutoringPath(pathname)) {
    return <Navigate to={homeworkTutoringHomePath(role)} replace />
  }

  if (!pathAllowedForRole(pathname, role)) {
    return <Navigate to={homeworkTutoringHomePath(role)} replace />
  }

  if (role === "teacher" && !teacherNavVisible) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
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
  const teacherPage = TEACHER_BY_PATH[pathname]
  const teacherId = profile?.teacherId ?? hwTeachers[0]?.id ?? ""

  let pageTitle = "功課輔導班"
  let PageIcon: LucideIcon = ClipboardList
  if (adminPage) {
    const item = ADMIN_NAV.find((p) => p.value === adminPage)
    pageTitle = item?.label ?? pageTitle
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
    <div className="space-y-4">
      <header>
        <div className="flex items-center gap-2">
          <PageIcon className="h-6 w-6 text-primary" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{pageTitle}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          功課輔導班｜{hwClass?.academicYearLabel ?? "2627"}學年｜{formatYearMonthLabel(viewMonth)}
        </p>
      </header>

      {loading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {!loading && !loadError && adminPage ? (
        <AdminHomeworkWorkbench
          tab={adminPage}
          onTabChange={(tab) => navigate(ADMIN_PATH[tab])}
          students={students}
          fees={fees}
          avail={avail}
          setAvail={setAvailAndMaybePersist}
          submitStatus={submitStatus}
          setSubmitStatus={setSubmitStatusPersisted}
          dutyDays={dutyDays}
          setDutyDays={setDutyDays}
          monthRosterStatus={monthRosterStatus}
          setMonthRosterStatus={setMonthRosterStatusPersisted}
          hwTeachers={hwTeachers}
          holidays={holidays}
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
          rosterPublishStatus={rosterPublishStatus}
          hwTeachers={hwTeachers}
          hwAccessIds={hwAccessIds}
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
          avail={avail}
          setAvail={setAvailAndMaybePersist}
          submitStatus={submitStatus}
          setSubmitStatus={setSubmitStatusPersisted}
          rosterPublishStatus={rosterPublishStatus}
          dutyDays={dutyDays}
        />
      ) : null}
    </div>
  )
}
