import { describe, expect, it } from "vitest"

import {
 filterTeacherTrialRows,
 filterTeacherTrialsBySemester,
 matchesTeacherTrialStatus,
 teacherCanWriteTrialComment,
} from "@/lib/teacherTrialList"

const rows = [
 { class_id: "a", trial_date: "2026-11-01", status: "已預約" },
 { class_id: "a", trial_date: "2026-11-10", status: "待改期" },
 { class_id: "b", trial_date: "2026-11-12", status: "已完成" },
 { class_id: "b", trial_date: "2026-10-02", status: "已取消" },
]

describe("老師試堂學生篩選", () => {
 it("按班別、日期與狀態收窄", () => {
  expect(
   filterTeacherTrialRows(rows, {
    classId: "a",
    dateFrom: "2026-11-05",
    dateTo: "",
    status: "all",
   }).map((row) => row.status)
  ).toEqual(["待改期"])
  expect(
   filterTeacherTrialRows(rows, {
    classId: "all",
    dateFrom: "",
    dateTo: "2026-11-10",
    status: "booked",
   }).map((row) => row.trial_date)
  ).toEqual(["2026-11-01"])
 })

 it("狀態分成已預約、待改期、已完成、已取消", () => {
  expect(matchesTeacherTrialStatus("已預約", "booked")).toBe(true)
  expect(matchesTeacherTrialStatus("待改期", "booked")).toBe(false)
  expect(matchesTeacherTrialStatus("待改期", "reschedule")).toBe(true)
  expect(matchesTeacherTrialStatus("已完成", "done")).toBe(true)
  expect(matchesTeacherTrialStatus("學生取消", "cancel")).toBe(true)
 })

 it("只留本學期日期內的試堂", () => {
  const range = { startYmd: "2026-11-01", endYmd: "2026-11-11" }
  expect(filterTeacherTrialsBySemester(rows, range).map((row) => row.trial_date)).toEqual([
   "2026-11-01",
   "2026-11-10",
  ])
  expect(filterTeacherTrialsBySemester(rows, null)).toEqual([])
 })

 it("只有該堂實際授課老師可寫評語", () => {
  expect(teacherCanWriteTrialComment("t1", "t1")).toBe(true)
  expect(teacherCanWriteTrialComment("t2", "t1")).toBe(false)
  expect(teacherCanWriteTrialComment(null, "t1")).toBe(false)
 })
})
