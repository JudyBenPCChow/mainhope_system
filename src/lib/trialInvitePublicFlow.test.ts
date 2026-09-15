import { describe, expect, it } from "vitest"

import type { TrialInviteClassOption } from "@/services/trialInviteQueries"

import {
  assemblePicks,
  buildSubjectGroups,
  classAllowedAfterElectives,
  dropSelectedSubject,
  filterCatalogClasses,
  pickedClassCount,
  pickedScheduleCount,
  pruneAndAutofillClasses,
  pruneAndAutofillSchedules,
  selectedClassIdsForGroups,
  selectedSubjectGroups,
  nearestUpcomingSchedules,
  visibleTrialClasses,
  subjectKeyOf,
} from "./trialInvitePublicFlow"

function cls(opts: {
  id: string
  kind?: string
  subject: string
  code?: string
  category?: string
  teacher?: string
  schedules?: { id: string; date: string }[]
}): TrialInviteClassOption {
  return {
    id: opts.id,
    class_kind: opts.kind ?? "group",
    subject: opts.subject,
    subject_code: opts.code ?? "",
    subject_category: opts.category ?? "main",
    course_code_full: opts.id.toUpperCase(),
    course_name: opts.subject,
    teacher_name: opts.teacher ?? "陳老師",
    day_of_week: "星期一",
    time_slot: "16:00-17:30",
    schedules: (opts.schedules ?? [{ id: `${opts.id}-s1`, date: "2026-09-14" }]).map((s) => ({
      id: s.id,
      scheduled_date: s.date,
      start_time: "16:00",
      end_time: "17:30",
      session_number: 1,
    })),
  }
}

describe("trialInvitePublicFlow", () => {
  const chiA = cls({ id: "chi-a", subject: "中文" })
  const chiB = cls({
    id: "chi-b",
    subject: "中文",
    teacher: "李老師",
    schedules: [
      { id: "chi-b-s1", date: "2026-09-14" },
      { id: "chi-b-s2", date: "2026-09-21" },
    ],
  })
  const eng = cls({ id: "eng-a", subject: "英文" })
  const hw = cls({ id: "hw-1", kind: "homework", subject: "功課輔導", category: "other" })
  const bio = cls({
    id: "bio-a",
    subject: "生物",
    code: "BIO",
    category: "senior_elective",
  })

  it("groups classes by kind and subject, 專科班 first", () => {
    const groups = buildSubjectGroups([hw, chiB, chiA, eng])
    expect(groups.map((g) => g.classKind)).toEqual(["group", "group", "homework"])
    const chi = groups.find((g) => g.key === subjectKeyOf(chiA))
    expect(chi?.classes.map((c) => c.id)).toEqual(["chi-b", "chi-a"])
  })

  it("filters catalog by electives: 功輔與主科可選，未勾選修不可選", () => {
    const all = [chiA, hw, bio]
    const none = filterCatalogClasses(all, true, new Set())
    expect(none.map((c) => c.id)).toEqual(["chi-a", "hw-1"])
    const withBio = filterCatalogClasses(all, true, new Set(["BIO"]))
    expect(withBio.map((c) => c.id)).toEqual(["chi-a", "hw-1", "bio-a"])
  })

  it("classAllowedAfterElectives keeps homework and main subjects", () => {
    expect(classAllowedAfterElectives(hw, true, new Set())).toBe(true)
    expect(classAllowedAfterElectives(chiA, true, new Set())).toBe(true)
    expect(classAllowedAfterElectives(bio, true, new Set())).toBe(false)
    expect(classAllowedAfterElectives(bio, true, new Set(["BIO"]))).toBe(true)
  })

  it("dropSelectedSubject keeps the last subject", () => {
    expect(dropSelectedSubject(["chi"], "chi")).toEqual(["chi"])
    expect(dropSelectedSubject(["chi", "eng"], "chi")).toEqual(["eng"])
    expect(dropSelectedSubject(["chi", "eng"], "math")).toEqual(["chi", "eng"])
  })

  it("auto-fills the only class and drops unselected subjects", () => {
    const groups = buildSubjectGroups([chiA, chiB, eng])
    const chiKey = subjectKeyOf(chiA)
    const engKey = subjectKeyOf(eng)
    const next = pruneAndAutofillClasses([engKey], groups, { [chiKey]: "chi-b" })
    expect(next).toEqual({ [engKey]: "eng-a" })
  })

  it("keeps a previously chosen class when the subject stays selected", () => {
    const groups = buildSubjectGroups([chiA, chiB, eng])
    const chiKey = subjectKeyOf(chiA)
    const next = pruneAndAutofillClasses([chiKey], groups, { [chiKey]: "chi-b" })
    expect(next).toEqual({ [chiKey]: "chi-b" })
  })

  it("does not auto-pick when a subject still has multiple classes", () => {
    const groups = buildSubjectGroups([chiA, chiB])
    const chiKey = subjectKeyOf(chiA)
    expect(pruneAndAutofillClasses([chiKey], groups, {})).toEqual({})
  })

  it("auto-fills the only schedule and drops leftover classes", () => {
    const next = pruneAndAutofillSchedules(["eng-a"], [chiB, eng], {
      "chi-b": "chi-b-s1",
    })
    expect(next).toEqual({ "eng-a": "eng-a-s1" })
  })

  it("keeps a previously chosen schedule when still valid", () => {
    const next = pruneAndAutofillSchedules(["chi-b"], [chiB], { "chi-b": "chi-b-s2" })
    expect(next).toEqual({ "chi-b": "chi-b-s2" })
  })

  it("assemblePicks only returns complete subject → class → schedule rows", () => {
    const groups = buildSubjectGroups([chiA, chiB, eng])
    const chiKey = subjectKeyOf(chiA)
    const engKey = subjectKeyOf(eng)
    const selected = selectedSubjectGroups(groups, [chiKey, engKey])
    expect(pickedClassCount([chiKey, engKey], groups, { [chiKey]: "chi-b" })).toEqual({
      picked: 1,
      total: 2,
    })
    expect(selectedClassIdsForGroups(selected, { [chiKey]: "chi-b" })).toEqual(["chi-b"])
    expect(
      assemblePicks(groups, [chiKey, engKey], { [chiKey]: "chi-b", [engKey]: "eng-a" }, {
        "chi-b": "chi-b-s2",
      })
    ).toEqual([
      {
        classId: "chi-b",
        scheduleId: "chi-b-s2",
        subjectLabel: "中文",
        classLabel: "CHI-B",
        scheduleLabel: "2026-09-21 16:00–17:30",
      },
    ])
    const complete = assemblePicks(
      groups,
      [chiKey, engKey],
      { [chiKey]: "chi-b", [engKey]: "eng-a" },
      { "chi-b": "chi-b-s2", "eng-a": "eng-a-s1" }
    )
    expect(complete.map((p) => p.classId).sort()).toEqual(["chi-b", "eng-a"])
    expect(pickedScheduleCount(["chi-b", "eng-a"], [chiB, eng], { "chi-b": "chi-b-s2" })).toEqual({
      picked: 1,
      total: 2,
    })
  })

  it("nearestUpcomingSchedules keeps the next four sessions", () => {
    const many = cls({
      id: "bio-d",
      subject: "生物",
      schedules: [
        { id: "s5", date: "2026-10-16" },
        { id: "s1", date: "2026-09-18" },
        { id: "s3", date: "2026-10-02" },
        { id: "s2", date: "2026-09-25" },
        { id: "s4", date: "2026-10-09" },
      ],
    })
    expect(nearestUpcomingSchedules(many).map((s) => s.id)).toEqual(["s1", "s2", "s3", "s4"])
  })

  it("visibleTrialClasses keeps the four soonest classes and a kept selection", () => {
    const a = cls({ id: "a", subject: "生物", schedules: [{ id: "a1", date: "2026-09-20" }] })
    const b = cls({ id: "b", subject: "生物", schedules: [{ id: "b1", date: "2026-09-13" }] })
    const c = cls({ id: "c", subject: "生物", schedules: [{ id: "c1", date: "2026-09-27" }] })
    const d = cls({ id: "d", subject: "生物", schedules: [{ id: "d1", date: "2026-09-18" }] })
    const e = cls({ id: "e", subject: "生物", schedules: [{ id: "e1", date: "2026-10-11" }] })
    expect(visibleTrialClasses([a, b, c, d, e]).map((x) => x.id)).toEqual(["b", "d", "a", "c"])
    expect(visibleTrialClasses([a, b, c, d, e], "e").map((x) => x.id)).toEqual(["b", "d", "a", "e"])
  })
})
