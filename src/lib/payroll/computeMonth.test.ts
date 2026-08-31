import { describe, expect, it } from "vitest"

import { computePayrollMonth } from "@/lib/payroll/computeMonth"
import { mpfEmployeeContribution, mpfEmployerContribution, withMpf } from "@/lib/payroll/mpf"
import { computeHcLessonAmount, hcLessonPay, parseRateConfig } from "@/lib/payroll/rates"
import type { PayrollLessonInput, PayrollRateRow, PayrollTeacherInput } from "@/lib/payroll/types"

function rate(
  teacherId: string,
  mode: PayrollRateRow["mode"],
  config: Record<string, unknown>
): PayrollRateRow {
  return {
    id: `rate-${teacherId}`,
    teacherId,
    mode,
    effectiveFrom: "2026-03-01",
    effectiveTo: null,
    config: parseRateConfig(config),
    notes: null,
  }
}

function lesson( partial: Partial<PayrollLessonInput> & Pick<PayrollLessonInput, "scheduleId" | "teacherId">): PayrollLessonInput {
  const students = partial.students ?? []
  return {
    classId: "c1",
    classLabel: "MATH S1",
    classKind: "group",
    privateSlot: "group",
    gradeLabels: ["中一"],
    gradeBand: "junior",
    subjectCode: "MATH",
    scheduledDate: "2026-08-05",
    startTime: "16:00",
    endTime: "17:30",
    cancelled: false,
    teacherName: "T",
    originalTeacherId: null,
    originalTeacherName: null,
    classOwnerTeacherId: null,
    listPricePerLesson: 600,
    missingRollCall: false,
    ...partial,
    students,
    expectedRosterCount: partial.expectedRosterCount ?? students.length,
  }
}

describe("payroll mpf", () => {
  it("applies statutory bands", () => {
    expect(mpfEmployeeContribution(5000)).toBe(0)
    expect(mpfEmployerContribution(5000)).toBe(250)
    expect(withMpf(16000)).toEqual({
      gross: 16000,
      employeeMpf: 800,
      employerMpf: 800,
      net: 15200,
    })
    expect(withMpf(45000)).toEqual({
      gross: 45000,
      employeeMpf: 1500,
      employerMpf: 1500,
      net: 43500,
    })
  })
})

describe("payroll HC formula", () => {
  it("matches junior general tutor table", () => {
    expect(hcLessonPay(2, { base: 120, perExtra: 60 })).toBe(180)
    expect(hcLessonPay(4, { base: 150, perExtra: 70 })).toBe(360)
  })

  it("uses equivalent HC for 1:1 / 1:2", () => {
    const l = lesson({
      scheduleId: "s1",
      teacherId: "billy",
      privateSlot: "one_to_one",
      classKind: "private",
      students: [{ studentId: "1", studentName: "A", status: "現場", billable: true, listPrice: 600 }],
    })
    const r = computeHcLessonAmount(
      l,
      parseRateConfig({
        junior: { base: 120, per_extra: 60 },
        one_to_one_hc: 3,
        one_to_two_hc: 4,
      })
    )
    expect(r.billableHc).toBe(3)
    expect(r.amount).toBe(240)
  })
})

describe("payroll month compute", () => {
  it("computes Mark 60% + 10% commission excluding own lessons from pool", () => {
    const markRate = rate("mark", "分成制", {
      personal_pct: 0.6,
      commission_pct: 0.1,
      commission_subject_codes: ["MATH", "M1", "M2"],
      mpf: true,
    })
    const billyRate = rate("billy", "兼職 HC", {
      junior: { base: 120, per_extra: 60 },
      senior: { base: 150, per_extra: 70 },
      one_to_one_hc: 3,
      one_to_two_hc: 4,
    })

    const teachers: PayrollTeacherInput[] = [
      { teacherId: "mark", teacherName: "Mark Yu", rate: markRate, approvedHours: 0 },
      { teacherId: "billy", teacherName: "Billy Shek", rate: billyRate, approvedHours: 0 },
    ]

    const lessons: PayrollLessonInput[] = [
      lesson({
        scheduleId: "m1",
        teacherId: "mark",
        teacherName: "Mark Yu",
        students: [
          { studentId: "a", studentName: "A", status: "現場", billable: true, listPrice: 1000 },
          { studentId: "b", studentName: "B", status: "現場", billable: true, listPrice: 1000 },
          { studentId: "c", studentName: "C", status: "病假", billable: false, listPrice: 1000 },
        ],
      }),
      lesson({
        scheduleId: "b1",
        teacherId: "billy",
        teacherName: "Billy Shek",
        classLabel: "MATH S2",
        students: [
          { studentId: "d", studentName: "D", status: "現場", billable: true, listPrice: 5000 },
          { studentId: "e", studentName: "E", status: "錄影回放", billable: true, listPrice: 5000 },
        ],
      }),
    ]

    const result = computePayrollMonth({ monthKey: "2026-08", teachers, lessons })
    const mark = result.teachers.find((t) => t.teacherId === "mark")!
    // personal: 2000 * 60% = 1200
    expect(mark.personalSplit).toBe(1200)
    // commission: 10000 * 10% = 1000（不含 Mark 自己的課）
    expect(mark.commissionPool).toBe(1000)
    expect(mark.grossBeforeAdj).toBe(2200)

    const billy = result.teachers.find((t) => t.teacherId === "billy")!
    // HC=2 junior: 120+60=180
    expect(billy.grossBeforeAdj).toBe(180)
  })

  it("hard-blocks missing roll-call only when roster expected", () => {
    const billyRate = rate("billy", "兼職 HC", {
      junior: { base: 120, per_extra: 60 },
      one_to_one_hc: 3,
      one_to_two_hc: 4,
    })
    const teachers: PayrollTeacherInput[] = [
      { teacherId: "billy", teacherName: "Billy", rate: billyRate, approvedHours: 0 },
    ]
    const withRoster = computePayrollMonth({
      monthKey: "2026-08",
      teachers,
      lessons: [
        lesson({
          scheduleId: "s",
          teacherId: "billy",
          expectedRosterCount: 3,
          missingRollCall: true,
          students: [],
        }),
      ],
    })
    expect(withRoster.teachers[0].hardBlock).toBe(true)
    expect(withRoster.teachers[0].anomalies.some((a) => a.includes("缺點名"))).toBe(true)

    const emptyRoster = computePayrollMonth({
      monthKey: "2026-08",
      teachers,
      lessons: [], // 無人報讀課堂已在 service 層略過
    })
    expect(emptyRoster.teachers[0].hardBlock).toBe(false)
  })

  it("hard-blocks missing rate", () => {
    const teachers: PayrollTeacherInput[] = [
      { teacherId: "x", teacherName: "No Rate", rate: null, approvedHours: 0 },
    ]
    const r1 = computePayrollMonth({ monthKey: "2026-08", teachers, lessons: [] })
    expect(r1.teachers[0].hardBlock).toBe(true)
    expect(r1.teachers[0].anomalies).toContain("缺有效費率")
  })

  it("substitute: day teacher gets HC; owner gets commission only", () => {
    const markRate = rate("mark", "分成制", {
      personal_pct: 0.6,
      commission_pct: 0.1,
      commission_subject_codes: ["MATH"],
    })
    const billyRate = rate("billy", "兼職 HC", {
      junior: { base: 120, per_extra: 60 },
      one_to_one_hc: 3,
      one_to_two_hc: 4,
    })
    const teachers: PayrollTeacherInput[] = [
      { teacherId: "mark", teacherName: "Mark Yu", rate: markRate, approvedHours: 0 },
      { teacherId: "billy", teacherName: "Billy", rate: billyRate, approvedHours: 0 },
    ]
    const lessons: PayrollLessonInput[] = [
      lesson({
        scheduleId: "sub1",
        teacherId: "billy",
        teacherName: "Billy",
        originalTeacherId: "mark",
        originalTeacherName: "Mark Yu",
        classOwnerTeacherId: "mark",
        students: [
          { studentId: "a", studentName: "A", status: "現場", billable: true, listPrice: 600 },
          { studentId: "b", studentName: "B", status: "現場", billable: true, listPrice: 600 },
        ],
      }),
    ]
    const result = computePayrollMonth({ monthKey: "2026-08", teachers, lessons })
    const mark = result.teachers.find((t) => t.teacherId === "mark")!
    const billy = result.teachers.find((t) => t.teacherId === "billy")!
    expect(mark.personalSplit).toBe(0)
    expect(mark.commissionPool).toBe(120) // 1200 * 10%
    expect(billy.grossBeforeAdj).toBe(180) // HC=2
    expect(billy.lessons[0].substitute).toBe(true)
  })

  it("adds homework hourly on top of specialist pay and Christine commission at 15", () => {
    const leoRate = rate("leo", "兼職 HC", {
      junior: { base: 120, per_extra: 60 },
      one_to_one_hc: 3,
      one_to_two_hc: 4,
    })
    const cfanRate = rate("cfan", "分成制", {
      personal_pct: 0.6,
      commission_pct: 0.1,
      commission_subject_codes: ["CHI"],
    })
    const teachers: PayrollTeacherInput[] = [
      {
        teacherId: "leo",
        teacherName: "Leo Chan",
        rate: leoRate,
        approvedHours: 0,
        homeworkHourlyRate: 70,
        homeworkRosterHours: 4,
      },
      {
        teacherId: "cfan",
        teacherName: "Christine Fan",
        rate: cfanRate,
        approvedHours: 0,
        homeworkHourlyRate: 100,
        homeworkRosterHours: 2,
      },
    ]
    const result = computePayrollMonth({
      monthKey: "2026-09",
      teachers,
      lessons: [],
      homeworkCommission: { teacherId: "cfan", enrolledCount: 15, originalPriceTotal: 45000 },
    })
    const leo = result.teachers.find((t) => t.teacherId === "leo")!
    expect(leo.homework?.amount).toBe(280)
    expect(leo.grossBeforeAdj).toBe(280)
    const cfan = result.teachers.find((t) => t.teacherId === "cfan")!
    expect(cfan.homework?.amount).toBe(200)
    expect(cfan.homeworkCommission?.amount).toBe(4500)
    expect(cfan.grossBeforeAdj).toBe(4700)
  })

  it("pays homework-only teachers without specialist rate and gates commission below 15", () => {
    const teachers: PayrollTeacherInput[] = [
      {
        teacherId: "annie",
        teacherName: "Annie Leung",
        rate: null,
        approvedHours: 0,
        homeworkHourlyRate: 100,
        homeworkRosterHours: 24,
      },
      {
        teacherId: "cfan",
        teacherName: "Christine Fan",
        rate: rate("cfan", "分成制", {
          personal_pct: 0.6,
          commission_pct: 0.1,
          commission_subject_codes: ["CHI"],
        }),
        approvedHours: 0,
      },
    ]
    const result = computePayrollMonth({
      monthKey: "2026-09",
      teachers,
      lessons: [],
      homeworkCommission: { teacherId: "cfan", enrolledCount: 6, originalPriceTotal: 18000 },
    })
    const annie = result.teachers.find((t) => t.teacherId === "annie")!
    expect(annie.mode).toBe("功輔時薪")
    expect(annie.missingRate).toBe(false)
    expect(annie.homework?.amount).toBe(2400)
    expect(annie.grossBeforeAdj).toBe(2400)
    const cfan = result.teachers.find((t) => t.teacherId === "cfan")!
    expect(cfan.homeworkCommission).toEqual({
      enrolledCount: 6,
      originalPriceTotal: 18000,
      amount: 0,
    })
    expect(cfan.grossBeforeAdj).toBe(0)
  })
})
