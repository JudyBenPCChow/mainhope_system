import { describe, expect, it } from "vitest"

import {
  HW_DAY_LOGS_PATH,
  HW_PATH,
  homeworkDayLogsEntryVisible,
  homeworkTutoringHomePath,
  teacherDayLogsTargetFromWorkspace,
  workspaceDayLogsTargetFromTeacher,
} from "@/lib/homeworkTutoringNav"
import {
  NAV_STRUCTURE,
  filterMainNavEntries,
  filterNavForRole,
  isHomeworkTutorOnlyAllowedPath,
  keepHomeworkTutorOnlyNav,
  stripHomeworkTutoringNav,
} from "@/lib/navStructure"

describe("功課輔導側欄", () => {
  it("一級是功課輔導分組，打開先有二級", () => {
    const group = NAV_STRUCTURE.find((e) => e.kind === "group" && e.id === "homework-tutoring")
    expect(group?.kind === "group" && group.label).toBe("功課輔導")
    expect(group?.kind === "group" && group.children.length).toBeGreaterThan(1)
  })

  it("行政見到概覽，管理層見到老師入口，老師見到報更", () => {
    const admin = filterNavForRole("admin", NAV_STRUCTURE).find(
      (e) => e.kind === "group" && e.id === "homework-tutoring"
    )
    expect(admin?.kind === "group" && admin.label).toBe("功課輔導")
    expect(admin?.kind === "group" && admin.children.some((c) => c.path === HW_PATH.overview)).toBe(
      true
    )

    const manager = filterNavForRole("manager", NAV_STRUCTURE).find(
      (e) => e.kind === "group" && e.id === "homework-tutoring"
    )
    expect(manager?.kind === "group" && manager.label).toBe("功課輔導")
    expect(
      manager?.kind === "group" && manager.children.some((c) => c.path === HW_PATH.teacherAccess)
    ).toBe(true)

    const teacher = filterNavForRole("teacher", NAV_STRUCTURE).find(
      (e) => e.kind === "group" && e.id === "homework-tutoring"
    )
    expect(teacher?.kind === "group" && teacher.label).toBe("功課輔導")
    expect(teacher?.kind === "group" && teacher.children.map((c) => c.path)).toEqual([
      HW_PATH.submit,
      HW_PATH.myDuty,
    ])
  })

  it("strip 會去掉老師功輔入口", () => {
    const stripped = stripHomeworkTutoringNav(filterNavForRole("teacher", NAV_STRUCTURE))
    expect(stripped.some((e) => e.kind === "group" && e.id === "homework-tutoring")).toBe(false)
    expect(
      stripped.some((e) => e.kind === "leaf" && e.path.startsWith("/HomeworkTutoring"))
    ).toBe(false)
  })

  it("純功輔導師側欄只留功輔與共用入口", () => {
    const narrowed = keepHomeworkTutorOnlyNav(
      filterMainNavEntries(filterNavForRole("teacher", NAV_STRUCTURE))
    )
    const paths = narrowed.flatMap((e) =>
      e.kind === "leaf" ? [e.path] : e.children.map((c) => c.path)
    )
    expect(paths).toContain("/Home")
    expect(paths).toContain("/AllFeatures")
    expect(paths).toContain("/Inbox")
    expect(paths).toContain(HW_PATH.submit)
    expect(paths).toContain(HW_PATH.myDuty)
    expect(paths).not.toContain(HW_PATH.dayLogs)
    expect(paths).not.toContain("/Attendance")
    expect(paths).not.toContain("/Classes")
    expect(paths).not.toContain("/TeacherTimetable")
    expect(paths).not.toContain("/PrivateTutoring")
    expect(paths).not.toContain("/Schedule")
    expect(paths).not.toContain("/RoomBooking")
    expect(paths).not.toContain("/AttendanceRecords")
    expect(paths).not.toContain("/TeachingRecords")
  })

  it("純功輔允許路徑判斷", () => {
    expect(isHomeworkTutorOnlyAllowedPath("/HomeworkTutoring/Submit")).toBe(true)
    expect(isHomeworkTutorOnlyAllowedPath("/HomeworkDayLogs")).toBe(false)
    expect(isHomeworkTutorOnlyAllowedPath("/HomeworkDayLogs/student-1")).toBe(false)
    expect(isHomeworkTutorOnlyAllowedPath("/Attendance")).toBe(false)
    expect(isHomeworkTutorOnlyAllowedPath("/Settings")).toBe(true)
  })
})

describe("老師功課紀錄路徑", () => {
  it("老師預設落地與舊路徑轉向新路徑", () => {
    expect(homeworkDayLogsEntryVisible("teacher")).toBe(false)
    expect(homeworkDayLogsEntryVisible("admin")).toBe(false)
    expect(homeworkDayLogsEntryVisible("manager")).toBe(true)
    expect(homeworkDayLogsEntryVisible("alien")).toBe(true)
    expect(homeworkTutoringHomePath("teacher")).toBe(HW_PATH.submit)
    expect(homeworkTutoringHomePath("admin")).toBe(HW_PATH.overview)
    expect(teacherDayLogsTargetFromWorkspace("/HomeworkTutoring/DayLogs")).toBe(HW_DAY_LOGS_PATH)
    expect(teacherDayLogsTargetFromWorkspace("/HomeworkTutoring/DayLogs/stu-1")).toBe(
      `${HW_DAY_LOGS_PATH}/stu-1`
    )
    expect(workspaceDayLogsTargetFromTeacher("/HomeworkDayLogs/stu-1")).toBe(
      "/HomeworkTutoring/DayLogs/stu-1"
    )
  })
})
