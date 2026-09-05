import { describe, expect, it } from "vitest"

import {
 buildPaymentYearContext,
 countCurrentYearPaidLessons,
 formatCurrentHomeworkPaidText,
 groupPastPaymentsByAcademicYear,
 isAttendanceInCurrentAcademicYear,
 partitionPaymentsByAcademicYear,
 paymentProductLineTags,
 summarizeCurrentYearPayments,
 type PaymentYearFields,
} from "@/lib/studentPaymentYearSummary"

const YEARS = [
 { label: "2526", start_date: "2025-09-01", end_date: "2026-06-30", is_current: false },
 { label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31", is_current: false },
 { label: "2627", start_date: "2026-09-01", end_date: "2027-06-30", is_current: true },
]

const MISFLAGGED = [
 { label: "2526", start_date: "2025-09-01", end_date: "2026-06-30", is_current: true },
 { label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31", is_current: false },
 { label: "2627", start_date: "2026-09-01", end_date: "2027-06-30", is_current: false },
]

const AS_OF = "2026-09-02"

function ctx(asOf = AS_OF, years = YEARS) {
 return buildPaymentYearContext(years, asOf)
}

function receipt(partial: Partial<PaymentYearFields> & Pick<PaymentYearFields, "id">): PaymentYearFields {
 return {
  payment_date: "2026-09-15",
  created_at: "2026-09-15T10:00:00Z",
  status: "已收款",
  details: [],
  ...partial,
 }
}

describe("buildPaymentYearContext", () => {
 it("9 月只用 2627，私人窗跟學年起迄，不跟 is_current 旗標", () => {
  const built = buildPaymentYearContext(MISFLAGGED, AS_OF)
  expect(built.currentYearLabels).toEqual(["2627"])
  expect(built.currentYearStart).toBe("2026-09-01")
  expect(built.currentYearEnd).toBe("2027-06-30")
 })
})

describe("partitionPaymentsByAcademicYear", () => {
 it("2627 專科進本年，26SM 專科進過往，不拆卡", () => {
  const current = receipt({
   id: "cur",
   payment_date: "2026-09-10",
   details: [
    {
     lessonCount: 8,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "2627",
    },
   ],
  })
  const summer = receipt({
   id: "sm",
   payment_date: "2026-08-10",
   details: [
    {
     lessonCount: 4,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "26SM",
    },
   ],
  })
  const { current: now, past } = partitionPaymentsByAcademicYear([summer, current], ctx())
  expect(now.map((r) => r.id)).toEqual(["cur"])
  expect(past.map((r) => r.id)).toEqual(["sm"])
 })

 it("私人無學年：收款日落在本年窗才進本年清單", () => {
  const inWindow = receipt({
   id: "priv-now",
   payment_date: "2026-10-01",
   details: [
    {
     lessonCount: 4,
     coverageStartMonth: null,
     description: null,
     classKind: "private",
     classSubject: "一對一英文",
     academicYearLabel: null,
    },
   ],
  })
  const before = receipt({
   id: "priv-old",
   payment_date: "2026-08-20",
   details: [
    {
     lessonCount: 2,
     coverageStartMonth: null,
     description: null,
     classKind: "private",
     classSubject: "一對一英文",
     academicYearLabel: null,
    },
   ],
  })
  const { current: now, past } = partitionPaymentsByAcademicYear([inWindow, before], ctx())
  expect(now.map((r) => r.id)).toEqual(["priv-now"])
  expect(past.map((r) => r.id)).toEqual(["priv-old"])
 })

 it("功輔覆蓋月在 2627 進本年；8 月覆蓋進過往", () => {
  const sep = receipt({
   id: "hw-sep",
   details: [
    {
     lessonCount: 1,
     coverageStartMonth: "2026-09",
     description: "功課輔導班 · 2026年9月月費",
     classKind: "homework",
     classSubject: "功課輔導",
     academicYearLabel: "2627",
    },
   ],
  })
  const aug = receipt({
   id: "hw-aug",
   payment_date: "2026-08-05",
   details: [
    {
     lessonCount: 1,
     coverageStartMonth: "2026-08",
     description: "功課輔導班 · 2026年8月月費",
     classKind: "homework",
     classSubject: "功課輔導",
     academicYearLabel: "26SM",
    },
   ],
  })
  const { current: now, past } = partitionPaymentsByAcademicYear([sep, aug], ctx())
  expect(now.map((r) => r.id)).toEqual(["hw-sep"])
  expect(past.map((r) => r.id)).toEqual(["hw-aug"])
 })

 it("混單不拆卡：任一明細屬本年則整張進本年清單", () => {
  const mixed = receipt({
   id: "mix",
   payment_date: "2026-09-20",
   details: [
    {
     lessonCount: 4,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "中文",
     academicYearLabel: "26SM",
    },
    {
     lessonCount: 8,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "英文",
     academicYearLabel: "2627",
    },
   ],
  })
  const { current: now, past } = partitionPaymentsByAcademicYear([mixed], ctx())
  expect(now).toHaveLength(1)
  expect(now[0]?.id).toBe("mix")
  expect(past).toHaveLength(0)
 })

 it("本年清單新至舊", () => {
  const older = receipt({ id: "a", payment_date: "2026-09-01", created_at: "2026-09-01T09:00:00Z" })
  const newer = receipt({ id: "b", payment_date: "2026-09-20", created_at: "2026-09-20T09:00:00Z" })
  older.details = [
   {
    lessonCount: 1,
    coverageStartMonth: null,
    description: null,
    classKind: "group",
    classSubject: "數學",
    academicYearLabel: "2627",
   },
  ]
  newer.details = older.details
  const { current: now } = partitionPaymentsByAcademicYear([older, newer], ctx())
  expect(now.map((r) => r.id)).toEqual(["b", "a"])
 })
})

describe("summarizeCurrentYearPayments", () => {
 it("專科堂、私人堂、功輔月分開；26SM 不進本年數字", () => {
  const rows = [
   receipt({
    id: "g",
    details: [
     {
      lessonCount: 8,
      coverageStartMonth: null,
      description: null,
      classKind: "group",
      classSubject: "數學",
      academicYearLabel: "2627",
     },
    ],
   }),
   receipt({
    id: "sm",
    payment_date: "2026-08-01",
    details: [
     {
      lessonCount: 40,
      coverageStartMonth: null,
      description: null,
      classKind: "group",
      classSubject: "數學",
      academicYearLabel: "26SM",
     },
    ],
   }),
   receipt({
    id: "p",
    payment_date: "2026-11-01",
    details: [
     {
      lessonCount: 4,
      coverageStartMonth: null,
      description: null,
      classKind: "private",
      classSubject: "一對一英文",
      academicYearLabel: null,
     },
    ],
   }),
   receipt({
    id: "h",
    details: [
     {
      lessonCount: 2,
      coverageStartMonth: "2026-09",
      description: "月費",
      classKind: "homework",
      classSubject: "功課輔導",
      academicYearLabel: "2627",
     },
    ],
   }),
  ]
  const summary = summarizeCurrentYearPayments(rows, ctx())
  expect(summary.specialistLessons).toBe(8)
  expect(summary.privateLessons).toBe(4)
  expect(summary.homeworkMonths).toEqual(["2026-09", "2026-10"])
  expect(formatCurrentHomeworkPaidText(summary.homeworkMonths)).toBe(
   "本學年已繳 2 個月（9 月、10 月）"
  )
 })

 it("混單只把本年明細加進摘要，功輔不進堂數", () => {
  const mixed = receipt({
   id: "mix",
   details: [
    {
     lessonCount: 8,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "2627",
    },
    {
     lessonCount: 4,
     coverageStartMonth: null,
     description: null,
     classKind: "private",
     classSubject: "一對一英文",
     academicYearLabel: null,
    },
    {
     lessonCount: 1,
     coverageStartMonth: "2026-09",
     description: "月費",
     classKind: "homework",
     classSubject: "功課輔導",
     academicYearLabel: "2627",
    },
    {
     lessonCount: 10,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "中文",
     academicYearLabel: "26SM",
    },
   ],
  })
  const summary = summarizeCurrentYearPayments([mixed], ctx())
  expect(summary.specialistLessons).toBe(8)
  expect(summary.privateLessons).toBe(4)
  expect(summary.homeworkMonths).toEqual(["2026-09"])
 })

 it("作廢／待收款不進摘要堂數與月數", () => {
  const rows = [
   receipt({
    id: "void",
    status: "作廢",
    details: [
     {
      lessonCount: 8,
      coverageStartMonth: null,
      description: null,
      classKind: "group",
      classSubject: "數學",
      academicYearLabel: "2627",
     },
    ],
   }),
   receipt({
    id: "pending",
    status: "待收款",
    details: [
     {
      lessonCount: 4,
      coverageStartMonth: null,
      description: null,
      classKind: "private",
      classSubject: "一對一英文",
      academicYearLabel: null,
     },
    ],
   }),
  ]
  const summary = summarizeCurrentYearPayments(rows, ctx())
  expect(summary.specialistLessons).toBe(0)
  expect(summary.privateLessons).toBe(0)
  expect(summary.homeworkMonths).toEqual([])
  const { current: now } = partitionPaymentsByAcademicYear(rows, ctx())
  expect(now.map((r) => r.id)).toEqual(["void", "pending"])
 })
})

describe("groupPastPaymentsByAcademicYear", () => {
 it("過往按學年分組，新學年在上；私人無年歸未標學年", () => {
  const sm = receipt({
   id: "sm",
   payment_date: "2026-08-01",
   details: [
    {
     lessonCount: 4,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "26SM",
    },
   ],
  })
  const old = receipt({
   id: "old",
   payment_date: "2026-03-01",
   details: [
    {
     lessonCount: 4,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "2526",
    },
   ],
  })
  const priv = receipt({
   id: "priv",
   payment_date: "2026-08-20",
   details: [
    {
     lessonCount: 2,
     coverageStartMonth: null,
     description: null,
     classKind: "private",
     classSubject: "一對一英文",
     academicYearLabel: null,
    },
   ],
  })
  const groups = groupPastPaymentsByAcademicYear([old, sm, priv])
  expect(groups.map((g) => g.label)).toEqual(["26SM", "2526", "未標學年"])
  expect(groups[0]?.items.map((r) => r.id)).toEqual(["sm"])
  expect(groups[2]?.items.map((r) => r.id)).toEqual(["priv"])
 })
})

describe("paymentProductLineTags", () => {
 it("一張單多線可多個標籤，不重複", () => {
  const mixed = receipt({
   id: "mix",
   details: [
    {
     lessonCount: 8,
     coverageStartMonth: null,
     description: null,
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "2627",
    },
    {
     lessonCount: 1,
     coverageStartMonth: "2026-09",
     description: "月費",
     classKind: "homework",
     classSubject: "功課輔導",
     academicYearLabel: "2627",
    },
    {
     lessonCount: 4,
     coverageStartMonth: null,
     description: null,
     classKind: "private",
     classSubject: "一對一英文",
     academicYearLabel: null,
    },
   ],
  })
  expect(paymentProductLineTags(mixed)).toEqual(["專科班", "私人課程", "功輔"])
 })
})

describe("countCurrentYearPaidLessons", () => {
 it("本學年專科加私人；暑期與功輔不進堂數", () => {
  const rows = [
   receipt({
    id: "g",
    details: [
     {
      lessonCount: 8,
      coverageStartMonth: null,
      description: null,
      classKind: "group",
      classSubject: "數學",
      academicYearLabel: "2627",
     },
    ],
   }),
   receipt({
    id: "p",
    payment_date: "2026-10-01",
    details: [
     {
      lessonCount: 4,
      coverageStartMonth: null,
      description: null,
      classKind: "private",
      classSubject: "一對一英文",
      academicYearLabel: null,
     },
    ],
   }),
   receipt({
    id: "sm",
    payment_date: "2026-08-01",
    details: [
     {
      lessonCount: 40,
      coverageStartMonth: null,
      description: null,
      classKind: "group",
      classSubject: "數學",
      academicYearLabel: "26SM",
     },
    ],
   }),
   receipt({
    id: "h",
    details: [
     {
      lessonCount: 2,
      coverageStartMonth: "2026-09",
      description: "月費",
      classKind: "homework",
      classSubject: "功課輔導",
      academicYearLabel: "2627",
     },
    ],
   }),
  ]
  expect(countCurrentYearPaidLessons(rows, ctx())).toBe(12)
 })
})

describe("isAttendanceInCurrentAcademicYear", () => {
 it("專科／功輔跟班別學年；私人跟出席日；舊學年與無標籤專科不計", () => {
  const yearCtx = ctx()
  expect(
   isAttendanceInCurrentAcademicYear(
    {
     attendanceDate: "2026-09-10",
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "2627",
    },
    yearCtx
   )
  ).toBe(true)
  expect(
   isAttendanceInCurrentAcademicYear(
    {
     attendanceDate: "2026-08-10",
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: "26SM",
    },
    yearCtx
   )
  ).toBe(false)
  expect(
   isAttendanceInCurrentAcademicYear(
    {
     attendanceDate: "2026-11-01",
     classKind: "private",
     classSubject: "一對一英文",
     academicYearLabel: null,
    },
    yearCtx
   )
  ).toBe(true)
  expect(
   isAttendanceInCurrentAcademicYear(
    {
     attendanceDate: "2026-08-15",
     classKind: "private",
     classSubject: "一對一英文",
     academicYearLabel: null,
    },
    yearCtx
   )
  ).toBe(false)
  expect(
   isAttendanceInCurrentAcademicYear(
    {
     attendanceDate: "2026-09-10",
     classKind: "group",
     classSubject: "數學",
     academicYearLabel: null,
    },
    yearCtx
   )
  ).toBe(false)
  expect(
   isAttendanceInCurrentAcademicYear(
    {
     attendanceDate: "2026-09-12",
     classKind: "homework",
     classSubject: "功課輔導",
     academicYearLabel: "2627",
    },
    yearCtx
   )
  ).toBe(true)
 })
})
