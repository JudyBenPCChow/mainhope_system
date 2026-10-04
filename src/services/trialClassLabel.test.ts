import { describe, expect, it } from "vitest"

import { classLabelPatchFromClassRow } from "@/services/classLabelLookup"
import { applyClassLabelsToLeaveRows, type LeaveManageRow } from "@/services/leaveQueries"
import { applyClassLabelsToTrialRows, type TrialManageRow } from "@/services/trialQueries"

function blankRow(over: Partial<TrialManageRow>): TrialManageRow {
 return {
  id: "t1",
  student_id: "s1",
  class_id: "c1",
  schedule_id: "sch1",
  trial_date: "2026-10-03",
  trial_type: "半價試堂",
  status: "已完成",
  remarks: null,
  payment_id: null,
  receipt_number: null,
  payment_status: null,
  student_name: "吳家慧",
  student_grade: "S2",
  student_whatsapp: null,
  student_phone: null,
  parent_phone: null,
  student_registration: "已註冊",
  class_subject: "—",
  course_code_full: null,
  teacher_id: null,
  teacher_name: null,
  sched_date: "2026-10-03",
  sched_start: "14:00:00",
  sched_end: "15:15:00",
  outcome: "converted",
  outcome_reason: "報讀",
  outcome_note: null,
  outcome_at: null,
  converted_enrollment_id: "e1",
  converted_payment_id: null,
  course_mode: "regular",
  price_per_lesson: null,
  roll_call_done: true,
  ...over,
 }
}

describe("applyClassLabelsToTrialRows", () => {
 it("已轉化列仍按 class_id 寫上班別名稱", () => {
  const patch = classLabelPatchFromClassRow({
   subject: "數學",
   course_code_full: "2627-MATHS2001-D",
   teacher_id: "teach1",
   courses: { course_name: "中二級常規數學班" },
   teachers: { full_name: "Liam Lai" },
  })
  const [row] = applyClassLabelsToTrialRows([blankRow({ outcome: "converted", status: "已完成" })], new Map([["c1", patch]]))
  expect(row.class_subject).toBe("中二級常規數學班（2627-MATHS2001-D）")
  expect(row.teacher_name).toBe("Liam Lai")
 })

 it("未轉化列同樣寫明班別", () => {
  const patch = classLabelPatchFromClassRow({
   subject: "數學",
   course_code_full: "2627-MATHS1001-C",
   teacher_id: "teach2",
   courses: { course_name: "中一級常規數學班" },
   teachers: { full_name: "Mark Yu" },
  })
  const [row] = applyClassLabelsToTrialRows(
   [blankRow({ outcome: "open", status: "已預約", student_name: "鄭煒霆" })],
   new Map([["c1", patch]])
  )
  expect(row.class_subject).toBe("中一級常規數學班（2627-MATHS1001-C）")
 })
})

describe("applyClassLabelsToLeaveRows", () => {
 it("已完成請假列仍按 class_id 寫上班別名稱", () => {
  const patch = classLabelPatchFromClassRow({
   subject: "數學",
   course_code_full: "2627-MATHS2001-D",
   teacher_id: "teach1",
   courses: { course_name: "中二級常規數學班" },
   teachers: { full_name: "Liam Lai" },
  })
  const leave: LeaveManageRow = {
   id: "l1",
   student_id: "s1",
   class_id: "c1",
   schedule_id: "sch1",
   leave_date: "2026-10-03",
   leave_reason: "事假",
   makeup_type: "調堂",
   makeup_date: "2026-10-10",
   makeup_schedule_id: "sch2",
   tuition_disposition: "調堂",
   status: "已完成",
   remarks: null,
   student_name: "吳家慧",
   student_grade: "S2",
   class_subject: "—",
   course_code_full: null,
   teacher_name: null,
   sched_date: "2026-10-03",
   sched_start: "14:00:00",
   sched_end: "15:15:00",
  }
  const [row] = applyClassLabelsToLeaveRows([leave], new Map([["c1", patch]]))
  expect(row.class_subject).toBe("中二級常規數學班（2627-MATHS2001-D）")
  expect(row.teacher_name).toBe("Liam Lai")
 })
})
