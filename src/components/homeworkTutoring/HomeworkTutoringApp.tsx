import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { HomeworkTutoringTeacherAccess } from "@/components/homeworkTutoring/HomeworkTutoringTeacherAccess"
import { useAuth } from "@/lib/authBootstrap"
import { HW_PATH, homeworkTutoringHomePath, isHomeworkTutoringPath } from "@/lib/homeworkTutoringNav"
import type { MgmtRole } from "@/lib/mgmtRole"
import { AdminHomeworkWorkbench } from "@/prototypes/homeworkTutoring/AdminHomeworkWorkbench"
import { ManagerHomeworkWorkbench } from "@/prototypes/homeworkTutoring/ManagerHomeworkWorkbench"
import { TeacherHomeworkWorkbench } from "@/prototypes/homeworkTutoring/TeacherHomeworkWorkbench"
import {
  MOCK_ACADEMIC_YEAR,
  MOCK_DUTY_DAYS,
  MOCK_FEES,
  MOCK_MONTH_LABEL,
  MOCK_MONTH_ROSTER_STATUS,
  MOCK_ROSTER_MONTH_KEY,
  MOCK_STUDENTS,
  MOCK_TEACHERS,
  cloneAvailability,
  cloneSubmitStatus,
  monthRosterToLock,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type MockDutyDay,
  type MockStudent,
  type MonthRosterState,
} from "@/prototypes/homeworkTutoring/mockData"
import type { AdminPageId, ManagerPageId, TeacherPageId } from "@/prototypes/homeworkTutoring/sandboxNav"

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

/**
 * 正式功課輔導頁。側欄已掛；老師入口接真實資料。
 * 報讀／月費／編更暫用沙盒假資料。
 */
export function HomeworkTutoringApp({ teacherNavVisible }: { teacherNavVisible: boolean }) {
  const { role, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  const [students] = useState<MockStudent[]>(() => [...MOCK_STUDENTS])
  const [fees] = useState(() => [...MOCK_FEES])
  const [avail, setAvail] = useState<AllTeacherAvailability>(() => cloneAvailability())
  const [submitStatus, setSubmitStatus] = useState<AllTeacherSubmitStatus>(() => cloneSubmitStatus())
  const [dutyDays, setDutyDays] = useState<MockDutyDay[]>(() => [...MOCK_DUTY_DAYS])
  const [monthRosterStatus, setMonthRosterStatus] = useState<Record<string, MonthRosterState>>(
    () => ({ ...MOCK_MONTH_ROSTER_STATUS })
  )
  const rosterPublishStatus = monthRosterToLock(
    monthRosterStatus[MOCK_ROSTER_MONTH_KEY] ?? "未編更"
  )
  const hwTeachers = MOCK_TEACHERS

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
  const teacherId = profile?.teacherId ?? MOCK_TEACHERS[0]!.id
  const showMockNotice = Boolean(adminPage || teacherPage || (managerPage && managerPage !== "access"))

  return (
    <div className="space-y-4">
      {showMockNotice ? (
        <p className="text-xs text-muted-foreground">
          {MOCK_ACADEMIC_YEAR}學年 · {MOCK_MONTH_LABEL}示範畫面。報讀、月費、編更尚未接真實資料，儲存唔會寫入系統。
        </p>
      ) : null}

      {adminPage ? (
        <AdminHomeworkWorkbench
          tab={adminPage}
          onTabChange={(tab) => navigate(ADMIN_PATH[tab])}
          students={students}
          fees={fees}
          avail={avail}
          setAvail={setAvail}
          submitStatus={submitStatus}
          setSubmitStatus={setSubmitStatus}
          dutyDays={dutyDays}
          setDutyDays={setDutyDays}
          monthRosterStatus={monthRosterStatus}
          setMonthRosterStatus={setMonthRosterStatus}
          hwTeachers={hwTeachers}
        />
      ) : null}

      {managerPage === "access" ? <HomeworkTutoringTeacherAccess /> : null}

      {managerPage && managerPage !== "access" ? (
        <ManagerHomeworkWorkbench
          tab={managerPage}
          onTabChange={(tab) => navigate(MANAGER_PATH[tab])}
          students={students}
          fees={fees}
          submitStatus={submitStatus}
          rosterPublishStatus={rosterPublishStatus}
          hwTeachers={hwTeachers}
          hwAccessIds={new Set()}
          onToggleHwAccess={() => {}}
        />
      ) : null}

      {teacherPage ? (
        <TeacherHomeworkWorkbench
          tab={teacherPage}
          onTabChange={(tab) => navigate(TEACHER_PATH[tab])}
          teacherId={teacherId}
          avail={avail}
          setAvail={setAvail}
          submitStatus={submitStatus}
          setSubmitStatus={setSubmitStatus}
          rosterPublishStatus={rosterPublishStatus}
        />
      ) : null}
    </div>
  )
}
