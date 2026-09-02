import { describe, expect, it } from "vitest"

import {
 buildScheduleCsv,
 compareScheduleListRows,
 EMPTY_SCHEDULE_HEADER_FILTERS,
 scheduleMatchesHeaderFilters,
 sortScheduleListRows,
} from "@/components/schedule/scheduleListColumns"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

function row(partial: Partial<ScheduleManageRow> & { id: string }): ScheduleManageRow {
 return {
  scheduled_date: "2026-09-03",
  start_time: "16:00",
  end_time: "17:15",
  status: "正常",
  cancel_reason: null,
  is_extra_lesson: false,
  roster_policy: "class_all",
  roster_confirmed_at: null,
  remarks: null,
  teaching_notes: null,
  session_number: null,
  consecutive_group_id: null,
  consecutive_slot_index: null,
  class_id: "c1",
  subject: "數學",
  class_kind: "group",
  course_name: "數學",
  classLabel: "數學 S1",
  course_code_full: "M-S1-A",
  class_day_of_week: "三",
  class_time_slot: "16:00-17:15",
  class_lesson_slots_per_session: 1,
  teacher_id: "t1",
  teacher_name: "陳老師",
  original_teacher_id: null,
  original_teacher_name: null,
  classroom_id: "r1",
  classroom_name: "17D",
  enrollCount: 3,
  ...partial,
 } as ScheduleManageRow
}

describe("scheduleMatchesHeaderFilters", () => {
 it("狀態精確、班別模糊、人數未知不匹配人數篩選", () => {
  const math = row({ id: "a", classLabel: "數學 S1", status: "取消", enrollCount: null })
  const eng = row({ id: "b", classLabel: "英文 S2", status: "正常", enrollCount: 2 })
  expect(
   scheduleMatchesHeaderFilters(math, { ...EMPTY_SCHEDULE_HEADER_FILTERS, status: "取消" })
  ).toBe(true)
  expect(
   scheduleMatchesHeaderFilters(eng, { ...EMPTY_SCHEDULE_HEADER_FILTERS, status: "取消" })
  ).toBe(false)
  expect(
   scheduleMatchesHeaderFilters(math, { ...EMPTY_SCHEDULE_HEADER_FILTERS, class: "數學" })
  ).toBe(true)
  expect(
   scheduleMatchesHeaderFilters(math, { ...EMPTY_SCHEDULE_HEADER_FILTERS, enroll: "0" })
  ).toBe(false)
  expect(
   scheduleMatchesHeaderFilters(eng, { ...EMPTY_SCHEDULE_HEADER_FILTERS, enroll: "2" })
  ).toBe(true)
 })
})

describe("compareScheduleListRows", () => {
 it("空課室與未知人數永遠排最後", () => {
  const withRoom = row({ id: "a", classroom_name: "17D" })
  const noRoom = row({ id: "b", classroom_name: null })
  expect(compareScheduleListRows(withRoom, noRoom, "room", "asc")).toBeLessThan(0)
  expect(compareScheduleListRows(noRoom, withRoom, "room", "desc")).toBeGreaterThan(0)

  const known = row({ id: "c", enrollCount: 1 })
  const unknown = row({ id: "d", enrollCount: null })
  expect(compareScheduleListRows(known, unknown, "enroll", "asc")).toBeLessThan(0)
 })

 it("預設按日期再按時間", () => {
  const later = row({ id: "a", scheduled_date: "2026-09-10", start_time: "10:00" })
  const earlier = row({ id: "b", scheduled_date: "2026-09-03", start_time: "16:00" })
  expect(sortScheduleListRows([later, earlier], "date", "asc").map((r) => r.id)).toEqual(["b", "a"])
 })
})

describe("buildScheduleCsv", () => {
 it("檔首記錄範圍、篩選與產出時間", () => {
  const csv = buildScheduleCsv([row({ id: "a" })], {
   rangeLabel: "2026-09-03–2026-09-16",
   filterLabel: "狀態=全部",
   producedAt: "2026-09-03T04:00:00+08:00",
  })
  expect(csv).toContain("# 範圍: 2026-09-03–2026-09-16")
  expect(csv).toContain("# 篩選: 狀態=全部")
  expect(csv).toContain("# 產出時間: 2026-09-03T04:00:00+08:00")
  expect(csv).toContain("數學 S1")
 })
})
