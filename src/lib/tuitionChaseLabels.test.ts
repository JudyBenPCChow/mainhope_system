import { describe, expect, it } from "vitest"

import {
 formatTuitionChaseDueLessons,
 formatTuitionChaseEnrolledClass,
 formatTuitionChaseRemainingAfterThisPeriod,
 formatTuitionChaseScheduleDate,
 formatTuitionChaseTimeRange,
 sortTuitionChaseEnrolledClasses,
 tuitionChaseBalanceWhy,
 tuitionChaseInventoryCaption,
 tuitionChaseThisPeriodSkipReason,
 tuitionChasePoolLabel,
 tuitionChaseQueueStatusLabel,
 tuitionChaseSuggestedOnceCaption,
} from "@/lib/tuitionChaseLabels"

describe("formatTuitionChaseDueLessons", () => {
 it("answers yes with lesson count and no with 不用收", () => {
  expect(formatTuitionChaseDueLessons(4)).toBe("4 堂")
  expect(formatTuitionChaseDueLessons(0)).toBe("不用收")
 })
})

describe("formatTuitionChaseScheduleDate", () => {
 it("shows month/day and weekday", () => {
  expect(formatTuitionChaseScheduleDate("2026-09-10")).toBe("9/10（四）")
 })
})

describe("formatTuitionChaseTimeRange", () => {
 it("joins start and end, or shows start only", () => {
  expect(formatTuitionChaseTimeRange("16:00", "17:30")).toBe("16:00–17:30")
  expect(formatTuitionChaseTimeRange("16:00", null)).toBe("16:00")
  expect(formatTuitionChaseTimeRange(null, null)).toBe("")
 })
})

describe("formatTuitionChaseRemainingAfterThisPeriod", () => {
 it("explains missing remaining, shortfall, and leftover", () => {
  expect(formatTuitionChaseRemainingAfterThisPeriod(-2, false)).toBe("未有結餘資料")
  expect(formatTuitionChaseRemainingAfterThisPeriod(-2, true)).toBe("尚欠 2 堂")
  expect(formatTuitionChaseRemainingAfterThisPeriod(3, true)).toBe("3 堂")
 })
})

describe("tuitionChaseSuggestedOnceCaption", () => {
 it("downgrades two-period total to a non-default sentence", () => {
  expect(tuitionChaseSuggestedOnceCaption(8)).toBe("可一次收齊 8 堂（兩期，非硬性）。")
  expect(tuitionChaseSuggestedOnceCaption(0)).toBe("兩期均不用另收。")
 })
})

describe("tuitionChasePoolLabel", () => {
 it("lists covered subjects on a shared specialist namespace", () => {
  expect(
   tuitionChasePoolLabel(
    { courseGroup: "group_specialist", namespaceKey: "S1", sharesAcrossClasses: true },
    ["中文", "數學"]
   )
   ).toBe("專科班（中一） · 中文、數學")
 })
})

describe("formatTuitionChaseEnrolledClass", () => {
 it("puts class code before the enrolled class name", () => {
  expect(
   formatTuitionChaseEnrolledClass({
    courseCode: "2627-BIO6001-A",
    displayName: "生物",
   })
  ).toBe("2627-BIO6001-A 生物")
 })

 it("shows only the class name when there is no code", () => {
  expect(
   formatTuitionChaseEnrolledClass({
    courseCode: null,
    displayName: "文覺稼＋文覺瑩數學（必修部份）一對二",
   })
  ).toBe("文覺稼＋文覺瑩數學（必修部份）一對二")
 })
})

describe("sortTuitionChaseEnrolledClasses", () => {
 it("sorts by class code then name", () => {
  const sorted = sortTuitionChaseEnrolledClasses([
   { classId: "b", courseCode: "2627-MATH1001-B", displayName: "數學" },
   { classId: "a", courseCode: "2627-CHIN1001-A", displayName: "中國語文" },
  ])
  expect(sorted.map((c) => c.classId)).toEqual(["a", "b"])
 })
})

describe("tuitionChaseQueueStatusLabel", () => {
 it("labels the three queues plus missing remaining", () => {
  expect(tuitionChaseQueueStatusLabel("now")).toBe("現在要追")
  expect(tuitionChaseQueueStatusLabel("next")).toBe("下期要追")
  expect(tuitionChaseQueueStatusLabel("prepaid")).toBe("已預繳")
  expect(tuitionChaseQueueStatusLabel("unknown")).toBe("未有結餘資料")
 })
})

describe("tuitionChaseInventoryCaption", () => {
 it("keeps inventory secondary and explains remainder after this period", () => {
  expect(
   tuitionChaseInventoryCaption({
    remainingLessons: 0,
    thisPeriodPendingUnits: 4,
    nextPeriodUnits: 4,
    thisPeriodLabel: "常規第一期",
    nextPeriodLabel: "常規第二期",
    remainingAfterThisPeriod: -4,
   })
  ).toBe(
   "尚餘可扣堂數 0 · 常規第一期還會扣 4 · 常規第二期會扣 4 · 扣完本期後尚欠 4 堂"
  )
 })

 it("does not treat missing remaining as zero leftover lessons", () => {
  expect(
   tuitionChaseInventoryCaption({
    remainingLessons: 0,
    thisPeriodPendingUnits: 4,
    nextPeriodUnits: 4,
    thisPeriodLabel: "常規第一期",
    nextPeriodLabel: "常規第二期",
    remainingKnown: false,
   })
  ).toBe("未有結餘資料 · 常規第一期還會扣 4 · 常規第二期會扣 4")
 })
})

describe("tuitionChaseBalanceWhy", () => {
 const labels = { thisPeriodLabel: "常規第一期", nextPeriodLabel: "常規第二期" }

 it("says this period is already covered by remaining paid lessons", () => {
  expect(
   tuitionChaseBalanceWhy({
    ...labels,
    remainingLessons: 4,
    thisPeriodPendingUnits: 4,
    thisPeriodDueLessons: 0,
    remainingAfterThisPeriod: 0,
    nextPeriodUnits: 4,
    nextPeriodDueLessons: 4,
   })
  ).toBe(
   "常規第一期不用收：尚餘 4 堂剛好覆蓋還會扣 4 堂；常規第二期要收 4 堂。"
  )
 })

 it("says leftover remaining after this period is unused prepaid lessons", () => {
  expect(
   tuitionChaseBalanceWhy({
    ...labels,
    remainingLessons: 8,
    thisPeriodPendingUnits: 4,
    thisPeriodDueLessons: 0,
    remainingAfterThisPeriod: 4,
    nextPeriodUnits: 4,
    nextPeriodDueLessons: 0,
   })
  ).toBe(
   "常規第一期不用收：尚餘 8 堂已夠還會扣 4 堂，扣完本期後仍有 4 堂（先前已繳未用完）；常規第二期不用收。"
  )
 })

 it("says this period is clear because nothing is still pending", () => {
  expect(
   tuitionChaseBalanceWhy({
    ...labels,
    remainingLessons: 4,
    thisPeriodPendingUnits: 0,
    thisPeriodDueLessons: 0,
    remainingAfterThisPeriod: 4,
    nextPeriodUnits: 4,
    nextPeriodDueLessons: 0,
   })
  ).toBe(
   "常規第一期不用收：本期沒有還會扣的堂；常規第二期不用收。"
  )
 })

 it("says this period needs no collection because of leave", () => {
  expect(
   tuitionChaseBalanceWhy({
    ...labels,
    remainingLessons: 4,
    thisPeriodPendingUnits: 0,
    thisPeriodDueLessons: 0,
    remainingAfterThisPeriod: 4,
    nextPeriodUnits: 4,
    nextPeriodDueLessons: 4,
    thisPeriodDeductedUnits: 0,
    thisPeriodNondeductUnits: 4,
   })
  ).toBe(
   "常規第一期不用收：本期 4 堂已點事假／病假，不扣堂數；常規第二期要收 4 堂。"
  )
 })

 it("says this period is already deducted", () => {
  expect(
   tuitionChaseBalanceWhy({
    ...labels,
    remainingLessons: 4,
    thisPeriodPendingUnits: 0,
    thisPeriodDueLessons: 0,
    remainingAfterThisPeriod: 4,
    nextPeriodUnits: 4,
    nextPeriodDueLessons: 4,
    thisPeriodDeductedUnits: 4,
    thisPeriodNondeductUnits: 0,
   })
  ).toBe(
   "常規第一期不用收：本期已扣完 4 堂；常規第二期要收 4 堂。"
  )
 })

 it("does not invent due when remaining is unknown", () => {
  expect(
   tuitionChaseBalanceWhy({
    ...labels,
    remainingLessons: 0,
    thisPeriodPendingUnits: 4,
    thisPeriodDueLessons: 0,
    remainingAfterThisPeriod: 0,
    nextPeriodUnits: 4,
    nextPeriodDueLessons: 0,
    remainingKnown: false,
   })
  ).toBe("未有結餘資料，無法計算要交堂數。")
 })

 it("explains negative remaining as unpaid lessons already taken", () => {
  expect(
   tuitionChaseBalanceWhy({
    ...labels,
    remainingLessons: -2,
    thisPeriodPendingUnits: 0,
    thisPeriodDueLessons: 2,
    remainingAfterThisPeriod: -2,
    nextPeriodUnits: 4,
    nextPeriodDueLessons: 4,
   })
  ).toBe(
   "已上課未付款 2 堂，常規第一期要收 2 堂；常規第二期要收 4 堂。"
  )
 })
})

describe("tuitionChaseThisPeriodSkipReason", () => {
 const base = {
  remainingLessons: 4,
  remainingAfterThisPeriod: 0,
  thisPeriodPendingUnits: 4,
  thisPeriodDueLessons: 0,
 }

 it("returns null when this period is still due", () => {
  expect(tuitionChaseThisPeriodSkipReason({ ...base, thisPeriodDueLessons: 4 })).toBeNull()
 })

 it("distinguishes leftover remaining from exactly covering this period", () => {
  expect(tuitionChaseThisPeriodSkipReason(base)).toBe("尚餘已夠本期")
  expect(
   tuitionChaseThisPeriodSkipReason({ ...base, remainingLessons: 8, remainingAfterThisPeriod: 4 })
  ).toBe("先前已繳未用完")
 })

 it("distinguishes leave, deducted, and no schedule when nothing is pending", () => {
  const nonePending = {
   remainingLessons: 4,
   remainingAfterThisPeriod: 4,
   thisPeriodPendingUnits: 0,
   thisPeriodDueLessons: 0,
  }
  expect(
   tuitionChaseThisPeriodSkipReason({
    ...nonePending,
    thisPeriodDeductedUnits: 0,
    thisPeriodNondeductUnits: 4,
   })
  ).toBe("本期請假不扣")
  expect(
   tuitionChaseThisPeriodSkipReason({
    ...nonePending,
    thisPeriodDeductedUnits: 4,
    thisPeriodNondeductUnits: 0,
   })
  ).toBe("本期已扣完")
  expect(
   tuitionChaseThisPeriodSkipReason({
    ...nonePending,
    thisPeriodDeductedUnits: 0,
    thisPeriodNondeductUnits: 0,
   })
  ).toBe("本期沒有排程")
 })
})
