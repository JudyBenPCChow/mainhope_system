import { describe, expect, it } from "vitest"

import { HW_PATH } from "@/lib/homeworkTutoringNav"
import {
  NAV_STRUCTURE,
  filterNavForRole,
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
})
