import { describe, expect, it } from "vitest"

import { partitionTrialInviteElectives } from "./trialInviteElectives"
import type { TrialInviteClassOption, TrialInviteElectiveOption } from "@/services/trialInviteQueries"

function elective(code: string, name: string): TrialInviteElectiveOption {
  return { code, name_zh: name, short_name: name }
}

function groupClass(subjectCode: string): TrialInviteClassOption {
  return {
    id: subjectCode,
    class_kind: "group",
    subject: subjectCode,
    subject_code: subjectCode,
    subject_category: "senior_elective",
    course_code_full: "",
    course_name: "",
    teacher_name: "",
    day_of_week: "",
    time_slot: "",
    schedules: [],
  }
}

describe("partitionTrialInviteElectives", () => {
  it("puts offered electives first, others after, each sorted by name", () => {
    const options = [
      elective("HIST", "歷史"),
      elective("PHY", "物理"),
      elective("BIO", "生物"),
      elective("MUS", "音樂"),
    ]
    const classes = [groupClass("BIO"), groupClass("PHY")]
    const { offered, other } = partitionTrialInviteElectives(options, classes)
    expect(offered.map((o) => o.code)).toEqual(["BIO", "PHY"])
    expect(other.map((o) => o.code)).toEqual(["MUS", "HIST"])
  })

  it("ignores homework classes when deciding offered", () => {
    const options = [elective("PHY", "物理"), elective("MUS", "音樂")]
    const classes: TrialInviteClassOption[] = [
      { ...groupClass("MUS"), class_kind: "homework" },
    ]
    const { offered, other } = partitionTrialInviteElectives(options, classes)
    expect(offered).toEqual([])
    expect(other.map((o) => o.code)).toEqual(["PHY", "MUS"])
  })

  it("uses offered flag so PHY/M2 stay pinned even if this grade has no catalog class", () => {
    const options: TrialInviteElectiveOption[] = [
      { ...elective("PHY", "物理"), offered: true },
      { ...elective("M2", "M2"), offered: true },
      { ...elective("MUS", "音樂"), offered: false },
    ]
    const { offered, other } = partitionTrialInviteElectives(options, [])
    expect(offered.map((o) => o.code).sort()).toEqual(["M2", "PHY"])
    expect(other.map((o) => o.code)).toEqual(["MUS"])
  })
})
