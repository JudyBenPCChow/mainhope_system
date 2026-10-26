import type { MgmtRole } from "@/lib/mgmtRole"

export const HOMEWORK_TUTORING_PATH_PREFIX = "/HomeworkTutoring"

export const HW_PATH = {
  overview: "/HomeworkTutoring/Overview",
  students: "/HomeworkTutoring/Students",
  fees: "/HomeworkTutoring/Fees",
  roster: "/HomeworkTutoring/Roster",
  calendar: "/HomeworkTutoring/Calendar",
  settings: "/HomeworkTutoring/Settings",
  supervise: "/HomeworkTutoring/Supervise",
  duty: "/HomeworkTutoring/Duty",
  progress: "/HomeworkTutoring/Progress",
  feeAlerts: "/HomeworkTutoring/FeeAlerts",
  teacherAccess: "/HomeworkTutoring/TeacherAccess",
  submit: "/HomeworkTutoring/Submit",
  myDuty: "/HomeworkTutoring/MyDuty",
  dayLogs: "/HomeworkTutoring/DayLogs",
} as const

/** 老師功課紀錄主路徑（與行政工作域 `/HomeworkTutoring/DayLogs` 分開）。 */
export const HW_DAY_LOGS_PATH = "/HomeworkDayLogs"

function studentIdAfterBase(pathname: string, base: string): string | null {
  const prefix = `${base}/`
  if (!pathname.startsWith(prefix)) return null
  const id = pathname.slice(prefix.length).split("/")[0]?.trim() ?? ""
  return id || null
}

/**
 * 單生功課紀錄。預設老師／共用前綴 `/HomeworkDayLogs`；
 * 行政工作域傳入 `HW_PATH.dayLogs`。
 */
export function hwDayLogStudentPath(studentId: string, basePath: string = HW_DAY_LOGS_PATH): string {
  return `${basePath}/${studentId}`
}

export function parseHwDayLogStudentId(pathname: string): string | null {
  return studentIdAfterBase(pathname, HW_DAY_LOGS_PATH) ?? studentIdAfterBase(pathname, HW_PATH.dayLogs)
}

/** 老師獨立工作區：`/HomeworkDayLogs` 及其單生頁。 */
export function isTeacherDayLogsPath(pathname: string): boolean {
  return pathname === HW_DAY_LOGS_PATH || pathname.startsWith(`${HW_DAY_LOGS_PATH}/`)
}

/** 行政／管理層工作域內的功課紀錄。 */
export function isWorkspaceDayLogsPath(pathname: string): boolean {
  return pathname === HW_PATH.dayLogs || pathname.startsWith(`${HW_PATH.dayLogs}/`)
}

export function isHwDayLogsPath(pathname: string): boolean {
  return isTeacherDayLogsPath(pathname) || isWorkspaceDayLogsPath(pathname)
}

/** 老師書籤舊路徑 → 新路徑（保留學生 id）。 */
export function teacherDayLogsTargetFromWorkspace(pathname: string): string {
  const id = studentIdAfterBase(pathname, HW_PATH.dayLogs)
  return id ? hwDayLogStudentPath(id) : HW_DAY_LOGS_PATH
}

/** 非老師誤入老師路徑 → 工作域舊路徑。 */
export function workspaceDayLogsTargetFromTeacher(pathname: string): string {
  const id = studentIdAfterBase(pathname, HW_DAY_LOGS_PATH)
  return id ? `${HW_PATH.dayLogs}/${id}` : HW_PATH.dayLogs
}

export function isHomeworkTutoringPath(pathname: string): boolean {
  return (
    pathname === HOMEWORK_TUTORING_PATH_PREFIX ||
    pathname.startsWith(`${HOMEWORK_TUTORING_PATH_PREFIX}/`)
  )
}

export function homeworkTutoringHomePath(role: MgmtRole): string {
  if (role === "teacher") return HW_DAY_LOGS_PATH
  if (role === "manager") return HW_PATH.supervise
  return HW_PATH.overview
}
