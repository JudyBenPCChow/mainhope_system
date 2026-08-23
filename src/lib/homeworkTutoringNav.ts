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
} as const

export function isHomeworkTutoringPath(pathname: string): boolean {
  return (
    pathname === HOMEWORK_TUTORING_PATH_PREFIX ||
    pathname.startsWith(`${HOMEWORK_TUTORING_PATH_PREFIX}/`)
  )
}

export function homeworkTutoringHomePath(role: MgmtRole): string {
  if (role === "teacher") return HW_PATH.submit
  if (role === "manager") return HW_PATH.supervise
  return HW_PATH.overview
}
