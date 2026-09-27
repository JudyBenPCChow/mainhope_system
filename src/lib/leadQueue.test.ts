import { describe, expect, it } from "vitest"

import { filterLeads, formatLeadAge, leadIsStaleNew, leadMatchesQuery, pickOpenIntention, sortLeads } from "./leadQueue"
import type { LeadRow } from "@/services/leadQueries"

const now = new Date("2026-09-27T12:00:00+08:00")

function row(patch: Partial<LeadRow>): LeadRow {
  return {
    id: "1",
    fullName: "陳大文",
    school: "明愛",
    grade: "S3",
    phone: "91234567",
    contactMethod: "WhatsApp",
    wechatId: "",
    note: "想問數學",
    source: "ad_trial",
    status: "new",
    electedSubjectCodes: [],
    interestedSubjects: [],
    convertedStudentId: null,
    createdAt: "2026-09-27T10:00:00+08:00",
    intentions: [],
    ...patch,
  }
}

describe("formatLeadAge", () => {
  it("formats hours and days", () => {
    expect(formatLeadAge("2026-09-27T10:00:00+08:00", now)).toBe("2 小時前")
    expect(formatLeadAge("2026-09-25T12:00:00+08:00", now)).toBe("2 日前")
  })
})

describe("leadIsStaleNew", () => {
  it("flags new leads older than a day", () => {
    expect(leadIsStaleNew(row({ createdAt: "2026-09-26T11:00:00+08:00" }), now)).toBe(true)
    expect(leadIsStaleNew(row({ createdAt: "2026-09-27T10:00:00+08:00" }), now)).toBe(false)
    expect(leadIsStaleNew(row({ status: "contacted", createdAt: "2026-09-20T10:00:00+08:00" }), now)).toBe(
      false
    )
  })
})

describe("pickOpenIntention", () => {
  const lines = [
    { classId: "c1", scheduleId: "s1", classLabel: "中三數學" },
    { classId: "c2", scheduleId: "s2", classLabel: "功輔" },
  ]

  it("returns the first intention that is still open", () => {
    expect(pickOpenIntention(lines, ["中三數學：已不能按廣告目錄排堂"])).toEqual({
      classId: "c2",
      scheduleId: "s2",
    })
  })

  it("reports expired when every dated intention is stale", () => {
    expect(
      pickOpenIntention(lines, ["中三數學：已不能按廣告目錄排堂", "功輔：堂次已不存在"])
    ).toBe("expired")
  })

  it("returns null when there is no schedule to carry", () => {
    expect(pickOpenIntention([{ classId: null, scheduleId: null, classLabel: "" }], [])).toBeNull()
  })
})

describe("filterLeads", () => {
  it("keeps status, source, grade, and search together", () => {
    const rows = [
      row({ id: "a", status: "new", source: "ad_trial", grade: "S1" }),
      row({ id: "b", status: "converted", source: "phone", grade: "S3", fullName: "李小明" }),
    ]
    expect(filterLeads(rows, { status: "new", source: "all", query: "", grade: "", browse: "all" }).map((item) => item.id)).toEqual([
      "a",
    ])
    expect(
      filterLeads(rows, { status: "all", source: "phone", query: "小明", grade: "S3", browse: "all" }).map((item) => item.id)
    ).toEqual(["b"])
  })
})

describe("lead browse mode", () => {
  it("splits inquiry from a booked trial date", () => {
    const inquiry = row({ id: "q", intentions: [], interestedSubjects: ["功課輔導"] })
    const trial = row({
      id: "t",
      intentions: [
        {
          id: "i1",
          classId: "c",
          scheduleId: "s",
          classLabel: "功課輔導班",
          scheduledDate: "2026-09-28",
          startTime: "15:15",
          endTime: "19:30",
        },
      ],
    })
    const rows = [inquiry, trial]
    expect(filterLeads(rows, { status: "all", source: "all", query: "", grade: "", browse: "inquiry" }).map((item) => item.id)).toEqual(["q"])
    expect(filterLeads(rows, { status: "all", source: "all", query: "", grade: "", browse: "trial" }).map((item) => item.id)).toEqual(["t"])
  })
})

describe("sortLeads", () => {
  it("sorts grade in school order and puts empty last", () => {
    const rows = [
      row({ id: "s3", grade: "S3" }),
      row({ id: "p1", grade: "P1" }),
      row({ id: "blank", grade: "" }),
    ]
    expect(sortLeads(rows, "grade", "asc").map((item) => item.id)).toEqual(["p1", "s3", "blank"])
    expect(sortLeads(rows, "grade", "desc").map((item) => item.id)).toEqual(["s3", "p1", "blank"])
  })
})

describe("leadMatchesQuery", () => {
  it("matches name, note, and phone", () => {
    const lead = row({})
    expect(leadMatchesQuery(lead, "大文")).toBe(true)
    expect(leadMatchesQuery(lead, "數學")).toBe(true)
    expect(leadMatchesQuery(lead, "91234567")).toBe(true)
    expect(leadMatchesQuery(lead, "沒有")).toBe(false)
  })
})
