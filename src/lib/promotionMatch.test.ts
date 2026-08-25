import { describe, expect, it } from "vitest"

import {
  buildClassMatchBundles,
  buildStudentMatchBundles,
  type PromotionClassRow,
  type PromotionEnrollmentRow,
  type PromotionStudentRow,
} from "./promotionMatch"

const targetClass: PromotionClassRow = {
  id: "class-chinese",
  courseId: "course-chinese-target",
  subjectId: "subject-chinese",
  label: "中四中文",
  subject: "中文",
  grades: ["中四"],
  dayOfWeek: "星期一",
  timeSlot: "10:00-11:00",
  lessonSlotsPerSession: 1,
  teacherName: null,
  capacity: 12,
  status: "進行中",
}

const englishClass: PromotionClassRow = {
  ...targetClass,
  id: "class-english",
  courseId: "course-english",
  subjectId: "subject-english",
  label: "中四英文",
  subject: "英文",
}

function student(
  id: string,
  gradeLabel = "中四",
  activeIn26SM = false,
  enrolledIn2526 = false
): PromotionStudentRow {
  return {
    id,
    studentCode: id,
    fullName: id,
    englishName: null,
    gradeLabel,
    contactPhone: null,
    registrationStatus: "已註冊",
    activeIn26SM,
    enrolledIn2526,
  }
}

function enrollment(
  id: string,
  studentId: string,
  options: {
    classId: string
    courseId: string
    subjectId: string
    dayOfWeek: string
    timeSlot: string
    academicYearLabel?: string | null
  }
): PromotionEnrollmentRow {
  return {
    id,
    studentId,
    classId: options.classId,
    courseId: options.courseId,
    subjectId: options.subjectId,
    period: null,
    status: "就讀中",
    classLabel: options.classId,
    dayOfWeek: options.dayOfWeek,
    timeSlot: options.timeSlot,
    lessonSlotsPerSession: 1,
    academicYearLabel: options.academicYearLabel ?? "2627",
  }
}

describe("historical subject promotion matching", () => {
  it("marks former same-subject students only when they are not currently studying it in 2627", () => {
    const students = [
      student("roster"),
      student("former-same-still-other"),
      student("former-same-current-same"),
      student("former-other"),
      student("wrong-grade", "中五"),
      student("time-conflict"),
    ]
    const enrollments = [
      enrollment("en-roster", "roster", {
        classId: targetClass.id,
        courseId: targetClass.courseId!,
        subjectId: targetClass.subjectId!,
        dayOfWeek: "星期一",
        timeSlot: "10:00-11:00",
      }),
      enrollment("en-other", "former-same-still-other", {
        classId: "class-math",
        courseId: "course-math",
        subjectId: "subject-math",
        dayOfWeek: "星期二",
        timeSlot: "10:00-11:00",
      }),
      enrollment("en-current-same", "former-same-current-same", {
        classId: "class-chinese-other",
        courseId: "course-chinese-other",
        subjectId: "subject-chinese",
        dayOfWeek: "星期二",
        timeSlot: "10:00-11:00",
      }),
      enrollment("en-conflict", "time-conflict", {
        classId: "class-math-conflict",
        courseId: "course-math-conflict",
        subjectId: "subject-math",
        dayOfWeek: "星期一",
        timeSlot: "10:30-11:30",
      }),
    ]
    const historicalSubjects = [
      { studentId: "former-same-still-other", subjectId: "subject-chinese" },
      { studentId: "former-same-current-same", subjectId: "subject-chinese" },
      { studentId: "former-other", subjectId: "subject-math" },
      { studentId: "wrong-grade", subjectId: "subject-chinese" },
      { studentId: "time-conflict", subjectId: "subject-chinese" },
    ]

    const [bundle] = buildClassMatchBundles({
      classes: [targetClass],
      students,
      enrollments,
      historicalSubjects,
    })

    const formerStillOther = bundle?.eligible.find(
      (item) => item.student.id === "former-same-still-other"
    )
    expect(formerStillOther).toMatchObject({
      previouslyStudiedTargetSubject: true,
      currentlyStudiesTargetSubject: false,
    })

    const currentSame = bundle?.eligible.find(
      (item) => item.student.id === "former-same-current-same"
    )
    expect(currentSame).toMatchObject({
      previouslyStudiedTargetSubject: true,
      currentlyStudiesTargetSubject: true,
    })

    expect(
      bundle?.eligible.find((item) => item.student.id === "former-other")
    ).toMatchObject({
      previouslyStudiedTargetSubject: false,
      currentlyStudiesTargetSubject: false,
    })
    expect(bundle?.eligible.some((item) => item.student.id === "wrong-grade")).toBe(false)
    expect(bundle?.eligible.some((item) => item.student.id === "time-conflict")).toBe(false)
  })

  it("does not treat 26SM same-slot enrollments as 2627 conflicts or current subject", () => {
    const students = [student("summer-same-slot", "中四", true)]
    const enrollments = [
      enrollment("en-summer", "summer-same-slot", {
        classId: "class-summer-chinese",
        courseId: "course-summer-chinese",
        subjectId: "subject-chinese",
        dayOfWeek: "星期一",
        timeSlot: "10:00-11:00",
        academicYearLabel: "26SM",
      }),
    ]
    const historicalSubjects = [
      { studentId: "summer-same-slot", subjectId: "subject-chinese" },
    ]

    const [bundle] = buildClassMatchBundles({
      classes: [targetClass],
      students,
      enrollments,
      historicalSubjects,
    })

    const eligible = bundle?.eligible.find((item) => item.student.id === "summer-same-slot")
    expect(eligible).toMatchObject({
      previouslyStudiedTargetSubject: true,
      currentlyStudiesTargetSubject: false,
    })
    expect(eligible?.summerClasses).toHaveLength(1)
    expect(eligible?.regularClasses).toHaveLength(0)
  })

  it("includes empty 2627 classes when minFullTerm is 0", () => {
    const bundles = buildClassMatchBundles({
      classes: [targetClass],
      students: [student("a")],
      enrollments: [],
      minFullTerm: 0,
    })
    expect(bundles).toHaveLength(1)
    expect(bundles[0]?.fullTermCount).toBe(0)
    expect(bundles[0]?.eligible.some((item) => item.student.id === "a")).toBe(true)
  })
})

describe("student match bundles", () => {
  it("sorts previously studied subjects first", () => {
    const students = [student("s1", "中四", true)]
    const enrollments = [
      enrollment("en-summer", "s1", {
        classId: "class-summer-english",
        courseId: "course-summer-english",
        subjectId: "subject-english",
        dayOfWeek: "星期三",
        timeSlot: "14:00-15:15",
        academicYearLabel: "26SM",
      }),
    ]
    const [bundle] = buildStudentMatchBundles({
      classes: [targetClass, englishClass],
      students,
      enrollments,
      historicalSubjects: [{ studentId: "s1", subjectId: "subject-english" }],
    })
    expect(bundle?.eligible.map((item) => item.cls.id)).toEqual([
      "class-english",
      "class-chinese",
    ])
    expect(bundle?.eligible[0]?.previouslyStudiedTargetSubject).toBe(true)
    expect(bundle?.eligible[1]?.previouslyStudiedTargetSubject).toBe(false)
  })
})
