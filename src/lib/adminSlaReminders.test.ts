import { describe, expect, it } from "vitest"

import {
 ADMIN_SLA_REMINDER_KIND_TONE,
 compareAdminSlaReminders,
 formatAdminSlaReminderFailure,
 formatStudentLeaveReminderText,
 formatTeacherCancelReminderText,
 formatTrialUnpaidReminderText,
 frontDeskWorkingDaysAfter,
 gradeLabelFromClassCourseCode,
 isOverdueStudentLeaveMakeup,
 isOverdueTeacherCancelWithoutMakeup,
 isTrialUnpaidOnChaseWindow,
 nextFrontDeskWorkingDay,
 coveredCancelledScheduleIds,
 teacherCancelMakeupHref,
 trialUnpaidCollectHref,
 type AdminSlaReminderItem,
} from "@/lib/adminSlaReminders"

describe("前台工作日", () => {
 it("星期六的下一個工作日是星期一", () => {
  expect(nextFrontDeskWorkingDay("2026-10-17")).toBe("2026-10-19")
 })

 it("星期五的下一個工作日是星期六", () => {
  expect(nextFrontDeskWorkingDay("2026-10-16")).toBe("2026-10-17")
 })

 it("取消後第 7 個工作日仍未過期，第 8 個才過期", () => {
  expect(frontDeskWorkingDaysAfter("2026-10-05", "2026-10-13")).toBe(7)
  expect(frontDeskWorkingDaysAfter("2026-10-05", "2026-10-14")).toBe(8)
 })
})

describe("學生請假補堂", () => {
 const base = {
  leaveReason: "事假",
  makeupType: "待安排",
  makeupDate: null,
  makeupScheduleId: null,
  status: "待補課",
  classKind: "group",
 }

 it("請假後第 7 日仍未過期", () => {
  expect(isOverdueStudentLeaveMakeup({ ...base, leaveDate: "2026-10-01" }, "2026-10-08")).toBe(false)
 })

 it("請假後第 8 日仍待安排則過期", () => {
  expect(isOverdueStudentLeaveMakeup({ ...base, leaveDate: "2026-10-01" }, "2026-10-09")).toBe(true)
 })

 it("已標不補回、選了錄影、功輔、導師請假不計", () => {
  const today = "2026-10-20"
  expect(
   isOverdueStudentLeaveMakeup({ ...base, leaveDate: "2026-10-01", makeupType: "不補回" }, today)
  ).toBe(false)
  expect(
   isOverdueStudentLeaveMakeup({ ...base, leaveDate: "2026-10-01", makeupType: "錄影" }, today)
  ).toBe(false)
  expect(
   isOverdueStudentLeaveMakeup({ ...base, leaveDate: "2026-10-01", classKind: "homework" }, today)
  ).toBe(false)
  expect(
   isOverdueStudentLeaveMakeup(
    { ...base, leaveDate: "2026-10-01", leaveReason: "老師請假" },
    today
   )
  ).toBe(false)
 })
})

describe("導師請假取消堂", () => {
 it("沒有未取消的補回堂，超過 7 個工作日才計入", () => {
  const covered = coveredCancelledScheduleIds([
   { remarks: "makeup_of=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", status: "正常" },
   { remarks: "makeup_of=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", status: "取消" },
  ])
  expect(
   isOverdueTeacherCancelWithoutMakeup(
    {
     id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
     scheduledDate: "2026-10-05",
     cancelReason: "導師請假",
     classKind: "group",
    },
    covered,
    "2026-10-20"
   )
  ).toBe(false)
  expect(
   isOverdueTeacherCancelWithoutMakeup(
    {
     id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
     scheduledDate: "2026-10-05",
     cancelReason: "導師請假",
     classKind: "private",
    },
    covered,
    "2026-10-20"
   )
  ).toBe(true)
 })
})

describe("試堂前未收款", () => {
 it("寫成一筆事項，而不是類別", () => {
  expect(
   formatStudentLeaveReminderText({
    teacherName: "Mark Yu",
    gradeLabel: "中四",
    subject: "數學",
    studentName: "陳小明",
    leaveDate: "2026-10-09",
   })
  ).toBe("Mark Yu 中四數學 · 陳小明 10/9 請假，尚未安排補堂")
  expect(gradeLabelFromClassCourseCode("2627-MATHS4001-A")).toBe("中四")
  expect(
   formatTeacherCancelReminderText({
    teacherName: "Mark Yu",
    gradeLabel: "中四",
    subject: "數學",
    scheduledDate: "2026-10-09",
   })
  ).toBe("Mark Yu 中四數學 10/9 因老師請假取消，尚未安排補回")
  expect(
   formatTrialUnpaidReminderText({
    studentName: "陳小明",
    gradeLabel: "中四",
    subject: "數學",
    trialDate: "2026-10-17",
   })
  ).toBe("陳小明 中四數學試堂 10/17 仍未收款")
 })

 it("試堂收款排在逾期補堂前面，並帶到收款登記", () => {
  const trial: AdminSlaReminderItem = {
   id: "trial-1",
   kind: "trial",
   href: "/Payments",
   text: "陳小明 中四數學試堂 10/17 仍未收款",
   sortDate: "2026-10-17",
  }
  const leave: AdminSlaReminderItem = {
   id: "leave-1",
   kind: "leave",
   href: "/LeaveManagement",
   text: "Mark Yu 中四數學 · 陳小明 10/1 請假，尚未安排補堂",
   sortDate: "2026-10-01",
  }
  expect(compareAdminSlaReminders(trial, leave)).toBeLessThan(0)
  const newerLeave: AdminSlaReminderItem = {
   ...leave,
   id: "leave-2",
   sortDate: "2026-10-09",
   text: "Mark Yu 中四數學 · 陳小明 10/9 請假，尚未安排補堂",
  }
  expect(compareAdminSlaReminders(newerLeave, leave)).toBeLessThan(0)
  expect(compareAdminSlaReminders(newerLeave, trial)).toBeGreaterThan(0)
  const laterLeave: AdminSlaReminderItem = { ...newerLeave, id: "leave-3", sortDate: "2026-10-18" }
  expect(compareAdminSlaReminders(laterLeave, trial)).toBeLessThan(0)
  expect(
   trialUnpaidCollectHref({ studentId: "s1", classId: "c1", trialType: "半價試堂" })
  ).toBe("/Payments?studentId=s1&mode=receive&trialPay=half&classId=c1")
  expect(trialUnpaidCollectHref({ studentId: null, classId: "c1", trialType: "免費試堂" })).toBe(
   "/TrialSessions"
  )
  expect(
   teacherCancelMakeupHref({
    classId: "c1",
    scheduleId: "sched-1",
    scheduledDate: "2026-10-09",
   })
  ).toBe("/Classes/c1?tab=schedule&makeup=sched-1")
 })

 it("三種短標用不同色，不用灰色", () => {
  expect(ADMIN_SLA_REMINDER_KIND_TONE.leave).toBe("warning")
  expect(ADMIN_SLA_REMINDER_KIND_TONE.cancel).toBe("info")
  expect(ADMIN_SLA_REMINDER_KIND_TONE.trial).toBe("error")
 })

 it("整段失敗與缺一類的字句不同", () => {
  expect(formatAdminSlaReminderFailure(["leave", "cancel", "trial"])).toBe("提醒未能載入。")
  expect(formatAdminSlaReminderFailure(["leave", "trial"])).toBe(
   "有部分提醒未能載入（缺請假、收款）。"
  )
  expect(formatAdminSlaReminderFailure([])).toBeNull()
 })

 it("星期五只包括今日與星期六仍未收款的試堂", () => {
  const friday = "2026-10-16"
  expect(
   isTrialUnpaidOnChaseWindow(
    { trialDate: "2026-10-17", status: "已預約", paymentId: null, paymentStatus: null },
    friday
   )
  ).toBe(true)
  expect(
   isTrialUnpaidOnChaseWindow(
    { trialDate: "2026-10-16", status: "已預約", paymentId: "p", paymentStatus: "待收款" },
    friday
   )
  ).toBe(true)
  expect(
   isTrialUnpaidOnChaseWindow(
    { trialDate: "2026-10-19", status: "已預約", paymentId: null, paymentStatus: null },
    friday
   )
  ).toBe(false)
  expect(
   isTrialUnpaidOnChaseWindow(
    { trialDate: "2026-10-17", status: "已預約", paymentId: "p", paymentStatus: "已收款" },
    friday
   )
  ).toBe(false)
  expect(
   isTrialUnpaidOnChaseWindow(
    { trialDate: "2026-10-17", status: "取消", paymentId: null, paymentStatus: null },
    friday
   )
  ).toBe(false)
 })
})
