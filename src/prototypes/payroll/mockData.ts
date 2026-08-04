/** 計糧 UI 預覽用示範資料 — 不接 Supabase／真實查詢 */

export type PayrollMode =
  | "分成制"
  | "固定月薪"
  | "兼職 HC"
  | "特別 HC"
  | "獨立定價"
  | "WFH 時薪"

/** 雙角色流程：財務準備 → 管理層核實 → 結算 */
export type PayrollRunStatus = "草稿" | "財務審閱中" | "待管理層核實" | "已結算"

/** UI 預覽用身份（尚未正式加 finance 角色） */
export type PayrollPreviewRole = "finance" | "manager"

export type ClassKind = "group" | "private"

/**
 * 出席／缺席狀態（審計用）
 * - 現場／Zoom／錄影／毋須補回請假：計入扣堂 HC
 * - no show：缺席但照扣堂
 * - 病假／事假：缺席且不扣堂（不計入人頭費／分成基數）
 */
export type StudentHcStatus =
  | "in_person"
  | "zoom"
  | "recording"
  | "no_show"
  | "sick"
  | "personal"
  | "leave_billable"

export type StudentHcRow = {
  name: string
  status: StudentHcStatus
  countsTowardHc: boolean
}

/** 單人送核狀態（財務可逐老師提交） */
export type TeacherSubmitState = {
  teacherId: string
  status: "not_submitted" | "submitted" | "accepted" | "returned"
  submittedAt?: string
  submittedBy?: string
  returnNote?: string
}

export type PayrollLineItem = {
  label: string
  amount: number
  note?: string
}

/** 跨模式加總拆分（Leo／Judy） */
export type ModeStream = {
  id: string
  label: string
  mode: PayrollMode
  amount: number
  detail: string
}

export type SalaryEvidence = {
  amount: number
  effectiveFrom: string
  effectiveTo?: string
  monthStatus: string
}

export type PayrollLesson = {
  id: string
  date: string
  startTime: string
  endTime: string
  /** 計薪扣堂人數（HC）；未點名為 0 */
  billableHc: number
  /** 本節計入該同事的金額（未扣 MPF） */
  amount: number
  presentStudents: string[]
  absentStudents: string[]
  /** 逐學生扣堂判定（審計用） */
  studentRows?: StudentHcRow[]
  notRolled: boolean
  /** 代堂／試堂／佣金說明等 */
  note?: string
  /** 計法字串，方便財務核對 */
  formula?: string
  /** given＝本人代人；received＝被人代 */
  substitute?: "given" | "received"
  substitutePeer?: string
  /** 原價基數（分成制核對用） */
  listPrice?: number
  /** 原價生效時點（歷史價，非今日價） */
  listPriceAsOf?: string
  subject?: string
  /** 分成池：納入／排除原因 */
  poolDisposition?: "in_pool" | "excluded" | "n/a"
  poolDispositionReason?: string
  /** 課堂當日班型快照 */
  classTypeSnapshot?: string
  /** 費率版本註腳 */
  rateSource?: string
  /** 補堂／試堂／取消等 */
  eventTimeline?: string
  /** 正式版連到排程詳情（mock id） */
  scheduleId?: string
  /** 名冊人數（含不扣堂缺席）— 對照計薪 HC */
  rosterCount?: number
}

export type CommissionPoolItem = {
  teacherName: string
  className: string
  date: string
  listPrice: number
  subject?: string
  included: boolean
  reason?: string
  listPriceAsOf?: string
}

export type CalcVersionMeta = {
  version: number
  computedAt: string
  dataCutoffAt: string
  previousVersion?: number
  previousComputedAt?: string
}

export type ZeroHourPerson = {
  id: string
  name: string
  reason: string
}

export type ReviewAudit = {
  teacherId: string
  teacherName: string
  reviewer: string
  reviewedAt: string
  calcVersion: number
  scope: string
  note?: string
}

export type RecalcDiffItem = {
  teacherName: string
  lessonLabel: string
  field: string
  before: string
  after: string
  amountDelta: number
}

export type ExcludedFollowUp = {
  teacherId: string
  teacherName: string
  reason: string
  handoffTo: string
}

export type WfhMockState = {
  status: "missing" | "submitted" | "approved"
  hours: number | null
  ratePerHour: number
}

export type ManualAdjustment = {
  id: string
  teacherId: string
  teacherName: string
  fromAmount: number | null
  toAmount: number
  reason: string
  createdBy: string
  createdAt: string
  status: "pending" | "approved" | "rejected"
  reviewerNote?: string
}

export type PayrollClassBlock = {
  id: string
  name: string
  classKind: ClassKind
  lessons: PayrollLesson[]
}

export type PayrollGradeBlock = {
  gradeLabel: string
  classes: PayrollClassBlock[]
}

export type PayrollTeacherRow = {
  id: string
  name: string
  mode: PayrollMode
  gross: number | null
  employeeMpf: number
  employerMpf: number
  net: number | null
  previousGross: number | null
  anomalies: string[]
  /** 非堂數項目（固定月薪、佣金池、WFH 等） */
  lines: PayrollLineItem[]
  /** 授課堂數統計（結構對齊中學出席統計） */
  grades: PayrollGradeBlock[]
  /** 分成制：個人原價 × 60% */
  personalSplit?: { listPriceTotal: number; rate: number; amount: number }
  /** 分成制：他人指定科目原價 × 10% */
  commissionPool?: {
    label: string
    listPriceTotal: number
    rate: number
    amount: number
    items: CommissionPoolItem[]
  }
  /** WFH（Cody） */
  wfh?: WfhMockState
  /** 示範：缺有效費率 */
  missingRate?: boolean
  /** 跨模式拆分 */
  modeStreams?: ModeStream[]
  /** 固定月薪適用證據 */
  salaryEvidence?: SalaryEvidence
}

export type PayrollMonthMock = {
  monthKey: string
  monthLabel: string
  status: PayrollRunStatus
  teachers: PayrollTeacherRow[]
  /** 財務提交核實後顯示 */
  submittedBy?: string
  submittedAt?: string
  /** 管理層退回原因 */
  returnReason?: string
  /** 計算版本／資料截止 */
  calc?: CalcVersionMeta
}

type CategoryKey = "juniorGroup" | "juniorPrivate" | "seniorGroup" | "seniorPrivate"

const JUNIOR = new Set(["中一", "中二", "中三"])
const SENIOR = new Set(["中四", "中五", "中六"])

const CATEGORY_META: { key: CategoryKey; label: string }[] = [
  { key: "juniorGroup", label: "初中小組" },
  { key: "juniorPrivate", label: "初中一對一" },
  { key: "seniorGroup", label: "高中小組" },
  { key: "seniorPrivate", label: "高中一對一" },
]

function mpfEmployee(gross: number): number {
  if (gross < 7100) return 0
  if (gross > 30000) return 1500
  return Math.round(gross * 0.05 * 100) / 100
}

function mpfEmployer(gross: number): number {
  if (gross > 30000) return 1500
  return Math.round(gross * 0.05 * 100) / 100
}

export function withMpf(
  row: Omit<PayrollTeacherRow, "employeeMpf" | "employerMpf" | "net"> & {
    employeeMpf?: number
    employerMpf?: number
    net?: number | null
  }
): PayrollTeacherRow {
  const gross = row.gross
  if (gross == null) {
    return { ...row, employeeMpf: 0, employerMpf: 0, net: null }
  }
  const needsMpf = ["Mark Yu", "Christine Fan", "Sophie Yu", "Katie Lee"].includes(row.name)
  const employeeMpf = needsMpf ? mpfEmployee(gross) : 0
  const employerMpf = needsMpf ? mpfEmployer(gross) : 0
  return {
    ...row,
    employeeMpf,
    employerMpf,
    net: Math.round((gross - employeeMpf) * 100) / 100,
  }
}

/** 示範：把出席學生攤成現場／Zoom／錄影（可覆寫） */
function assignPresentModes(
  present: string[],
  override?: Record<string, StudentHcStatus>
): StudentHcRow[] {
  return present.map((name, i) => {
    const forced = override?.[name]
    const status: StudentHcStatus =
      forced === "zoom" || forced === "recording" || forced === "in_person" || forced === "leave_billable"
        ? forced
        : i % 5 === 3
          ? "zoom"
          : i % 5 === 4
            ? "recording"
            : "in_person"
    return { name, status, countsTowardHc: true }
  })
}

function buildStudentRows(
  present: string[],
  absent: string[],
  noShow: string[] = [],
  presentModeOverride?: Record<string, StudentHcStatus>,
  personalLeave: string[] = []
): StudentHcRow[] {
  const rows = assignPresentModes(present, presentModeOverride)
  for (const name of absent) {
    if (noShow.includes(name)) {
      rows.push({ name, status: "no_show", countsTowardHc: true })
    } else if (personalLeave.includes(name)) {
      rows.push({ name, status: "personal", countsTowardHc: false })
    } else {
      rows.push({ name, status: "sick", countsTowardHc: false })
    }
  }
  return rows
}

export function studentHcStatusLabel(status: StudentHcStatus): string {
  switch (status) {
    case "in_person":
      return "現場"
    case "zoom":
      return "Zoom"
    case "recording":
      return "錄影"
    case "no_show":
      return "缺席 · 照扣堂（no show）"
    case "sick":
      return "缺席 · 病假（不扣堂）"
    case "personal":
      return "缺席 · 事假（不扣堂）"
    case "leave_billable":
      return "請假（毋須補回 · 計入）"
  }
}

export function isPresentStatus(status: StudentHcStatus): boolean {
  return (
    status === "in_person" ||
    status === "zoom" ||
    status === "recording" ||
    status === "leave_billable"
  )
}

export function countsTowardPayroll(status: StudentHcStatus): boolean {
  return (
    status === "in_person" ||
    status === "zoom" ||
    status === "recording" ||
    status === "leave_billable" ||
    status === "no_show"
  )
}

function L(
  partial: Omit<PayrollLesson, "presentStudents" | "absentStudents" | "billableHc" | "amount"> & {
    presentStudents?: string[]
    absentStudents?: string[]
    billableHc?: number
    amount?: number
    noShowStudents?: string[]
    personalLeaveStudents?: string[]
    presentModeOverride?: Record<string, StudentHcStatus>
  }
): PayrollLesson {
  if (partial.notRolled) {
    return {
      ...partial,
      presentStudents: [],
      absentStudents: [],
      studentRows: [],
      billableHc: 0,
      amount: 0,
      scheduleId: partial.scheduleId ?? `mock-sched-${partial.id}`,
      rosterCount: 0,
    }
  }
  const presentStudents = partial.presentStudents ?? []
  const absentStudents = partial.absentStudents ?? []
  const noShowStudents = partial.noShowStudents ?? []
  const personalLeaveStudents = partial.personalLeaveStudents ?? []
  const studentRows =
    partial.studentRows ??
    buildStudentRows(
      presentStudents,
      absentStudents,
      noShowStudents,
      partial.presentModeOverride,
      personalLeaveStudents
    )
  const billableFromRows = studentRows.filter((r) => r.countsTowardHc).length
  const rosterCount = studentRows.length
  return {
    ...partial,
    presentStudents,
    absentStudents,
    studentRows,
    billableHc: partial.billableHc ?? billableFromRows,
    amount: partial.amount ?? 0,
    scheduleId: partial.scheduleId ?? `mock-sched-${partial.id}`,
    rosterCount,
  }
}

/** 連續多週同班示範堂：金額／原價依「計薪 HC」重算，病假／事假不計入 */
function seriesLessons(opts: {
  idPrefix: string
  dates: string[]
  startTime: string
  endTime: string
  present: string[]
  /** 全員計薪時的節金額（會按計薪 HC／名冊比例縮放，除非有 hcPricing） */
  amount: number
  /** HC 制：$first + $extra×(HC−1)；有則不按比例縮放 */
  hcPricing?: { first: number; extra: number }
  note?: string
  formula?: string
  listPrice?: number
  listPriceAsOf?: string
  subject?: string
  poolDisposition?: PayrollLesson["poolDisposition"]
  poolDispositionReason?: string
  classTypeSnapshot?: string
  rateSource?: string
  eventTimeline?: string
  substitute?: "given" | "received"
  substitutePeer?: string
  absentOn?: Record<string, string[]>
  /** 缺席中標為 no show（照扣堂，計入 HC） */
  noShowOn?: Record<string, string[]>
  /** 事假（不扣堂） */
  personalOn?: Record<string, string[]>
  presentModeOn?: Record<string, Record<string, StudentHcStatus>>
  /** 這些日期標為未點名 */
  notRolledDates?: string[]
}): PayrollLesson[] {
  const rosterSize = opts.present.length
  return opts.dates.map((date) => {
    const lessonId = `${opts.idPrefix}-${date}`
    if (opts.notRolledDates?.includes(date)) {
      return L({
        id: lessonId,
        date,
        startTime: opts.startTime,
        endTime: opts.endTime,
        notRolled: true,
        note: opts.note ?? "已排程、尚未點名 — 未計入薪酬",
        formula: opts.formula,
        subject: opts.subject,
        classTypeSnapshot: opts.classTypeSnapshot,
        listPriceAsOf: opts.listPriceAsOf,
        rateSource: opts.rateSource,
        eventTimeline: opts.eventTimeline,
        poolDisposition: opts.poolDisposition,
        poolDispositionReason: opts.poolDispositionReason,
        scheduleId: `mock-sched-${lessonId}`,
        rosterCount: rosterSize,
      })
    }
    const personal = opts.personalOn?.[date] ?? []
    const noShow = opts.noShowOn?.[date] ?? []
    const sickOrPersonal = [
      ...(opts.absentOn?.[date] ?? []),
      ...personal,
    ].filter((n) => !noShow.includes(n))
    const present = opts.present.filter(
      (n) => !sickOrPersonal.includes(n) && !noShow.includes(n)
    )
    const allAbsent = [...new Set([...sickOrPersonal, ...noShow])]
    const billableHc = present.length + noShow.length
    const amount = opts.hcPricing
      ? billableHc <= 0
        ? 0
        : opts.hcPricing.first + opts.hcPricing.extra * Math.max(0, billableHc - 1)
      : rosterSize > 0
        ? Math.round(opts.amount * (billableHc / rosterSize))
        : 0
    const listPrice =
      opts.listPrice != null && rosterSize > 0
        ? Math.round(opts.listPrice * (billableHc / rosterSize))
        : opts.listPrice
    const formula = opts.hcPricing
      ? billableHc <= 0
        ? "計薪 HC＝0 → $0（病假／事假不計）"
        : `$${opts.hcPricing.first} + $${opts.hcPricing.extra} × (${billableHc}−1) = $${amount}（計薪 HC ${billableHc}／名冊 ${rosterSize}）`
      : opts.listPrice != null
        ? `原價 $${listPrice}（按計薪 ${billableHc}/${rosterSize} 人）× 比例＝$${amount}`
        : opts.formula

    return L({
      id: lessonId,
      date,
      startTime: opts.startTime,
      endTime: opts.endTime,
      notRolled: false,
      presentStudents: present,
      absentStudents: allAbsent,
      noShowStudents: noShow,
      personalLeaveStudents: personal,
      presentModeOverride: opts.presentModeOn?.[date],
      billableHc,
      amount,
      note:
        billableHc < rosterSize
          ? `${opts.note ?? ""} · 計薪 ${billableHc}/${rosterSize} 人（不扣堂缺席已剔除）`.replace(
              /^ · /,
              ""
            )
          : opts.note,
      formula,
      listPrice,
      listPriceAsOf: opts.listPriceAsOf,
      subject: opts.subject,
      poolDisposition: opts.poolDisposition,
      poolDispositionReason: opts.poolDispositionReason,
      classTypeSnapshot: opts.classTypeSnapshot,
      rateSource: opts.rateSource,
      eventTimeline: opts.eventTimeline,
      substitute: opts.substitute,
      substitutePeer: opts.substitutePeer,
      scheduleId: `mock-sched-${lessonId}`,
      rosterCount: rosterSize,
    })
  })
}

const AUG_W1 = ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24"] as const
const AUG_W2 = ["2026-08-04", "2026-08-11", "2026-08-18", "2026-08-25"] as const
const AUG_W3 = ["2026-08-05", "2026-08-12", "2026-08-19", "2026-08-26"] as const
const AUG_W4 = ["2026-08-06", "2026-08-13", "2026-08-20", "2026-08-27"] as const
const AUG_W5 = ["2026-08-07", "2026-08-14", "2026-08-21", "2026-08-28"] as const

const S_MATH_A = ["陳浩然", "王美玲", "李俊傑", "黃子晴", "張家豪", "周啟明", "劉俊宇", "吳嘉欣"]
const S_MATH_B = ["鄭志偉", "何佩珊", "梁卓希", "楊曉彤", "林詩晴", "馬天朗"]
const S_ENG = ["陳浩然", "王美玲", "李俊傑", "黃子晴", "張家豪", "林詩晴"]
const S_CHI = ["吳嘉欣", "鄭志偉", "何佩珊", "梁卓希", "楊曉彤", "林詩晴", "馬天朗", "周啟明"]
const S_PHY = ["陳浩然", "王美玲", "李俊傑", "黃子晴", "張家豪"]
const S_CHEM = ["楊曉彤", "林詩晴", "馬天朗", "周啟明", "吳嘉欣", "鄭志偉"]
const S_BIO = ["陳浩然", "王美玲", "李俊傑", "黃子晴", "何佩珊", "梁卓希"]
const S_JR = ["林詩晴", "馬天朗", "周啟明", "吳嘉欣", "鄭志偉"]

export function classKindLabel(kind: ClassKind): string {
  return kind === "private" ? "一對一" : "小組"
}

export function lessonPresentCount(l: PayrollLesson): number {
  return l.notRolled ? 0 : l.presentStudents.length
}

export function lessonAbsentCount(l: PayrollLesson): number {
  return l.notRolled ? 0 : l.absentStudents.length
}

export function classLessonCount(c: PayrollClassBlock): number {
  return c.lessons.length
}

export function classBillableHc(c: PayrollClassBlock): number {
  return c.lessons.reduce((s, l) => s + l.billableHc, 0)
}

export function classAmount(c: PayrollClassBlock): number {
  return c.lessons.reduce((s, l) => s + l.amount, 0)
}

export function classPresentTotal(c: PayrollClassBlock): number {
  return c.lessons.reduce((s, l) => s + lessonPresentCount(l), 0)
}

export function classAbsentTotal(c: PayrollClassBlock): number {
  return c.lessons.reduce((s, l) => s + lessonAbsentCount(l), 0)
}

export function gradeLessonCount(g: PayrollGradeBlock): number {
  return g.classes.reduce((s, c) => s + c.lessons.length, 0)
}

export function gradeBillableHc(g: PayrollGradeBlock): number {
  return g.classes.reduce((s, c) => s + classBillableHc(c), 0)
}

export function gradeAmount(g: PayrollGradeBlock): number {
  return g.classes.reduce((s, c) => s + classAmount(c), 0)
}

export function teacherClassCount(t: PayrollTeacherRow): number {
  return t.grades.reduce((s, g) => s + g.classes.length, 0)
}

export function teacherLessonCount(t: PayrollTeacherRow): number {
  return t.grades.reduce((s, g) => s + gradeLessonCount(g), 0)
}

export function teacherBillableHc(t: PayrollTeacherRow): number {
  return t.grades.reduce((s, g) => s + gradeBillableHc(g), 0)
}

export function teacherLessonAmount(t: PayrollTeacherRow): number {
  return t.grades.reduce((s, g) => s + gradeAmount(g), 0)
}

export function teacherPresentTotal(t: PayrollTeacherRow): number {
  return t.grades.reduce(
    (s, g) => s + g.classes.reduce((ss, c) => ss + classPresentTotal(c), 0),
    0
  )
}

export function teacherAbsentTotal(t: PayrollTeacherRow): number {
  return t.grades.reduce(
    (s, g) => s + g.classes.reduce((ss, c) => ss + classAbsentTotal(c), 0),
    0
  )
}

export function teacherNotRolledCount(t: PayrollTeacherRow): number {
  let n = 0
  for (const g of t.grades) {
    for (const c of g.classes) {
      for (const l of c.lessons) if (l.notRolled) n += 1
    }
  }
  return n
}

export type CategoryTotals = {
  key: CategoryKey
  label: string
  gradeIds: Set<string>
  classCount: number
  lessonCount: number
  billableHc: number
  presentVisits: number
  absentVisits: number
  amount: number
}

function emptyCategory(meta: { key: CategoryKey; label: string }): CategoryTotals {
  return {
    key: meta.key,
    label: meta.label,
    gradeIds: new Set(),
    classCount: 0,
    lessonCount: 0,
    billableHc: 0,
    presentVisits: 0,
    absentVisits: 0,
    amount: 0,
  }
}

function bandOf(gradeLabel: string): "junior" | "senior" | null {
  if (JUNIOR.has(gradeLabel)) return "junior"
  if (SENIOR.has(gradeLabel)) return "senior"
  return null
}

function categoryKeyOf(band: "junior" | "senior", classKind: ClassKind): CategoryKey {
  if (band === "junior") return classKind === "group" ? "juniorGroup" : "juniorPrivate"
  return classKind === "group" ? "seniorGroup" : "seniorPrivate"
}

export function teacherCategoryTotals(t: PayrollTeacherRow): CategoryTotals[] {
  const map = new Map<CategoryKey, CategoryTotals>()
  for (const meta of CATEGORY_META) map.set(meta.key, emptyCategory(meta))

  for (const g of t.grades) {
    const band = bandOf(g.gradeLabel)
    if (!band) continue
    for (const c of g.classes) {
      const key = categoryKeyOf(band, c.classKind)
      const target = map.get(key)!
      target.gradeIds.add(g.gradeLabel)
      target.classCount += 1
      target.lessonCount += c.lessons.length
      target.billableHc += classBillableHc(c)
      target.presentVisits += classPresentTotal(c)
      target.absentVisits += classAbsentTotal(c)
      target.amount += classAmount(c)
    }
  }
  return CATEGORY_META.map((m) => map.get(m.key)!)
}

export type GradeKindSummaryRow = {
  gradeLabel: string
  classKind: ClassKind
  classCount: number
  lessonCount: number
  billableHc: number
  presentVisits: number
  absentVisits: number
  amount: number
}

export function teacherGradeKindRows(t: PayrollTeacherRow): GradeKindSummaryRow[] {
  const rows: GradeKindSummaryRow[] = []
  for (const g of t.grades) {
    for (const kind of ["group", "private"] as const) {
      const classes = g.classes.filter((c) => c.classKind === kind)
      if (classes.length === 0) continue
      rows.push({
        gradeLabel: g.gradeLabel,
        classKind: kind,
        classCount: classes.length,
        lessonCount: classes.reduce((s, c) => s + c.lessons.length, 0),
        billableHc: classes.reduce((s, c) => s + classBillableHc(c), 0),
        presentVisits: classes.reduce((s, c) => s + classPresentTotal(c), 0),
        absentVisits: classes.reduce((s, c) => s + classAbsentTotal(c), 0),
        amount: classes.reduce((s, c) => s + classAmount(c), 0),
      })
    }
  }
  return rows
}

export type CategoryHierarchyRow = {
  category: CategoryTotals
  children: GradeKindSummaryRow[]
}

/** 類別 → 年級（兩層；高中小組 = 中四／中五… 之和） */
export function teacherCategoryHierarchy(t: PayrollTeacherRow): CategoryHierarchyRow[] {
  const grades = teacherGradeKindRows(t)
  return teacherCategoryTotals(t).map((category) => {
    const kind: ClassKind =
      category.key === "juniorPrivate" || category.key === "seniorPrivate" ? "private" : "group"
    const band = category.key.startsWith("junior") ? "junior" : "senior"
    const children = grades.filter((r) => bandOf(r.gradeLabel) === band && r.classKind === kind)
    return { category, children }
  })
}

const augustTeachers: PayrollTeacherRow[] = [
  withMpf({
    id: "mark",
    name: "Mark Yu",
    mode: "分成制",
    // 個人授課約 $36,000×60%＝$21,600；他人數學池 $120,000×10%＝$12,000
    gross: 33600,
    previousGross: 35200,
    anomalies: [],
    personalSplit: { listPriceTotal: 36000, rate: 0.6, amount: 21600 },
    commissionPool: {
      label: "他人數學／M1／M2 原價 × 10%",
      listPriceTotal: 120000,
      rate: 0.1,
      amount: 12000,
      items: [
        {
          teacherName: "Liam Lai",
          className: "中二數學小組 A",
          date: "2026-08-03",
          listPrice: 3600,
          subject: "數學",
          included: true,
          listPriceAsOf: "2026-08-01 生效價",
        },
        {
          teacherName: "Billy Shek",
          className: "中一數學小組 B",
          date: "2026-08-07",
          listPrice: 3000,
          subject: "數學",
          included: true,
          listPriceAsOf: "2026-08-01 生效價",
        },
        {
          teacherName: "Natalie Kwok",
          className: "中五英文小組 C",
          date: "2026-08-06",
          listPrice: 4800,
          subject: "英文",
          included: false,
          reason: "科目＝英文，不屬數學／M1／M2 pool",
        },
        {
          teacherName: "其他（示範匯總）",
          className: "數學／M1／M2 其餘節",
          date: "2026-08",
          listPrice: 113400,
          subject: "數學／M1／M2",
          included: true,
          listPriceAsOf: "各節課堂當日 course price",
        },
      ],
    },
    lines: [
      {
        label: "他人數學／M1／M2 佣金 10%",
        amount: 12000,
        note: "其他教師已扣堂原價約 $120,000（示範池）",
      },
    ],
    grades: [
      {
        gradeLabel: "中四",
        classes: [
          {
            id: "mark-s4-math",
            name: "中四數學必修 A",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "mark-s4",
              dates: [...AUG_W3],
              startTime: "16:00",
              endTime: "17:30",
              present: S_MATH_A,
              amount: 2880,
              note: "個人 60%（原價基數約 $4,800／節）",
              formula: "原價 $4,800 × 60% = $2,880",
              listPrice: 4800,
              listPriceAsOf: "2026-08-01 生效價（非今日價）",
              subject: "數學",
              poolDisposition: "n/a",
              poolDispositionReason: "本人授課 → 計入個人 60%，非他人 10% 池",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課 · 無代堂 · 非試堂",
              // 8/12 劉俊宇 no show＝照扣堂；8/26 兩人病假＝不計入分成基數
              absentOn: { "2026-08-26": ["周啟明", "吳嘉欣"] },
              noShowOn: { "2026-08-12": ["劉俊宇"] },
              presentModeOn: {
                "2026-08-05": { 王美玲: "zoom", 黃子晴: "recording" },
              },
            }),
          },
        ],
      },
      {
        gradeLabel: "中五",
        classes: [
          {
            id: "mark-s5-m2",
            name: "中五 M2 小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "mark-s5",
              dates: [...AUG_W5],
              startTime: "19:00",
              endTime: "20:30",
              present: S_MATH_B,
              amount: 2160,
              note: "個人 60%（原價基數約 $3,600／節）",
              formula: "原價 $3,600 × 60% = $2,160",
              listPrice: 3600,
              listPriceAsOf: "2026-08-01 生效價（非今日價）",
              subject: "M2",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課 · 無代堂 · 非試堂",
              absentOn: { "2026-08-14": ["楊曉彤"], "2026-08-28": ["馬天朗"] },
            }),
          },
          {
            id: "mark-s5-1on1",
            name: "中五數學一對一 · 張家豪",
            classKind: "private",
            lessons: seriesLessons({
              idPrefix: "mark-1on1",
              dates: ["2026-08-02", "2026-08-09", "2026-08-16", "2026-08-23"],
              startTime: "14:00",
              endTime: "15:30",
              present: ["張家豪"],
              amount: 360,
              note: "個人 60%（原價 $600）；等價 3 HC",
              formula: "原價 $600 × 60% = $360",
              listPrice: 600,
              listPriceAsOf: "2026-08-01 生效價",
              subject: "數學",
              classTypeSnapshot: "1on1（當日快照 · 等價 3 人頭）",
              eventTimeline: "原訂課",
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "christine",
    name: "Christine Fan",
    mode: "分成制",
    // 個人 $28,800；他人中文池 $96,000×10%＝$9,600
    gross: 38400,
    previousGross: 36100,
    anomalies: [],
    personalSplit: { listPriceTotal: 48000, rate: 0.6, amount: 28800 },
    commissionPool: {
      label: "他人中國語文原價 × 10%",
      listPriceTotal: 96000,
      rate: 0.1,
      amount: 9600,
      items: [
        {
          teacherName: "Cyndi Ng",
          className: "中四中文精讀（示範）",
          date: "2026-08-03",
          listPrice: 4800,
          subject: "中國語文",
          included: true,
          listPriceAsOf: "2026-08-01 生效價",
        },
        {
          teacherName: "Judy Chu",
          className: "中六中國歷史（示範）",
          date: "2026-08-07",
          listPrice: 5200,
          subject: "中國歷史",
          included: false,
          reason: "中國歷史 — 不屬中國語文 pool（排除中國歷史／文學）",
        },
        {
          teacherName: "其他（示範匯總）",
          className: "中國語文其餘節",
          date: "2026-08",
          listPrice: 91200,
          subject: "中國語文",
          included: true,
          listPriceAsOf: "各節課堂當日 course price",
        },
      ],
    },
    lines: [
      {
        label: "他人中國語文佣金 10%",
        amount: 9600,
        note: "其他教師已扣堂原價約 $96,000（示範池）",
      },
    ],
    grades: [
      {
        gradeLabel: "中三",
        classes: [
          {
            id: "cf-s3-chi",
            name: "中三中文小組 B",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "cf-s3",
              dates: [...AUG_W2],
              startTime: "17:00",
              endTime: "18:30",
              present: S_CHI,
              amount: 3600,
              note: "個人 60%（原價基數約 $6,000／節）",
              formula: "原價 $6,000 × 60% = $3,600",
              listPrice: 6000,
              listPriceAsOf: "2026-08-01 生效價（非今日價）",
              subject: "中國語文",
              poolDisposition: "in_pool",
              poolDispositionReason: "本科目屬中國語文 → 計入 Christine 10% 池（他人授課時）",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課 · 無代堂 · 非試堂",
              absentOn: { "2026-08-11": ["周啟明"], "2026-08-25": ["馬天朗", "林詩晴"] },
            }),
          },
        ],
      },
      {
        gradeLabel: "中六",
        classes: [
          {
            id: "cf-s6-chi",
            name: "中六中文精讀",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "cf-s6g",
              dates: [...AUG_W4],
              startTime: "16:30",
              endTime: "18:00",
              present: S_ENG,
              amount: 2880,
              note: "個人 60%（原價基數約 $4,800／節）",
            }),
          },
          {
            id: "cf-s6-1on1",
            name: "中六中文一對一 · 陳浩然",
            classKind: "private",
            lessons: seriesLessons({
              idPrefix: "cf-1on1",
              dates: ["2026-08-01", "2026-08-08", "2026-08-15", "2026-08-22", "2026-08-29"],
              startTime: "15:00",
              endTime: "16:30",
              present: ["陳浩然"],
              amount: 576,
              note: "個人 60%（原價 $960）",
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "sophie",
    name: "Sophie Yu",
    mode: "固定月薪",
    gross: 16000,
    previousGross: 16000,
    anomalies: [],
    salaryEvidence: {
      amount: 16000,
      effectiveFrom: "2026-01-01",
      monthStatus: "全月在職 · 無調薪 · 無無薪假",
    },
    lines: [{ label: "固定月薪（行政人員）", amount: 16000, note: "不按堂數計薪" }],
    grades: [],
  }),
  withMpf({
    id: "katie",
    name: "Katie Lee",
    mode: "固定月薪",
    gross: 20000,
    previousGross: 20000,
    anomalies: [],
    salaryEvidence: {
      amount: 20000,
      effectiveFrom: "2025-09-01",
      monthStatus: "全月在職 · 無調薪 · 無無薪假",
    },
    lines: [{ label: "固定月薪", amount: 20000, note: "不按堂數計薪" }],
    grades: [],
  }),
  withMpf({
    id: "natalie",
    name: "Natalie Kwok",
    mode: "兼職 HC",
    // 高中：4×$500 + 4×$430＝$3,720（上月課量較多）
    gross: 3720,
    previousGross: 7200,
    anomalies: ["本月總薪酬較上月 −44%，請確認課量是否正常"],
    lines: [],
    grades: [
      {
        gradeLabel: "中五",
        classes: [
          {
            id: "nat-s5",
            name: "中五英文小組 C",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "nat-s5",
              dates: [...AUG_W4],
              startTime: "18:00",
              endTime: "19:30",
              present: S_ENG,
              amount: 500,
              hcPricing: { first: 150, extra: 70 },
              note: "高中 HC：僅計薪人頭（現場／Zoom／錄影／no show）",
              rateSource: "高中一般 PT（$150/$70），自 2026-01-01 生效（非 8 月新費率）",
              subject: "英文",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課",
              // 8/13 張家豪 no show＝照扣堂；8/27 林詩晴病假＝不扣堂、不計費
              absentOn: { "2026-08-27": ["林詩晴"] },
              noShowOn: { "2026-08-13": ["張家豪"] },
              presentModeOn: {
                "2026-08-06": { 林詩晴: "zoom", 黃子晴: "recording" },
              },
            }),
          },
        ],
      },
      {
        gradeLabel: "中六",
        classes: [
          {
            id: "nat-s6",
            name: "中六英文小組 D",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "nat-s6",
              dates: [...AUG_W1],
              startTime: "19:00",
              endTime: "20:30",
              present: S_PHY,
              amount: 430,
              hcPricing: { first: 150, extra: 70 },
              note: "高中 HC：病假不計入人頭費",
              rateSource: "高中一般 PT（$150/$70），自 2026-01-01 生效",
              subject: "英文",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課 · 8/10 黃子晴病假不計 HC",
              absentOn: { "2026-08-10": ["黃子晴"] },
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "liam",
    name: "Liam Lai",
    mode: "兼職 HC",
    // 初中 $120+$60×4＝$360；自有 8 節 + 代堂 4 節
    gross: 4320,
    previousGross: 3960,
    anomalies: [],
    lines: [],
    grades: [
      {
        gradeLabel: "中二",
        classes: [
          {
            id: "liam-s2",
            name: "中二數學小組 A",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "liam-s2",
              dates: [...AUG_W1],
              startTime: "16:30",
              endTime: "18:00",
              present: S_JR,
              amount: 360,
              hcPricing: { first: 120, extra: 60 },
              note: "初中 HC：病假不計入",
              absentOn: { "2026-08-17": ["吳嘉欣"] },
            }),
          },
        ],
      },
      {
        gradeLabel: "中一",
        classes: [
          {
            id: "liam-s1",
            name: "中一數學小組 C",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "liam-s1",
              dates: [...AUG_W2],
              startTime: "15:00",
              endTime: "16:30",
              present: S_JR,
              amount: 360,
              hcPricing: { first: 120, extra: 60 },
              note: "初中 HC",
            }),
          },
        ],
      },
      {
        gradeLabel: "中三",
        classes: [
          {
            id: "liam-sub",
            name: "中三數學小組（代 Kenneth Li）",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "liam-sub",
              dates: [...AUG_W5],
              startTime: "17:00",
              endTime: "18:30",
              present: S_MATH_B,
              amount: 360,
              hcPricing: { first: 120, extra: 60 },
              note: "代堂：薪酬歸當日授課教師",
              rateSource: "初中一般 PT（$120/$60），自 2026-01-01 生效",
              subject: "數學",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "代堂：Kenneth 請假 → Liam 授課 · 非補堂",
              substitute: "given",
              substitutePeer: "Kenneth Li",
              absentOn: { "2026-08-21": ["楊曉彤"] },
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "kenneth",
    name: "Kenneth Li",
    mode: "兼職 HC",
    // 高中自有 8 節×$430；中三 4 節全數由 Liam 代＝$0
    gross: 3440,
    previousGross: 6880,
    anomalies: ["本月總薪酬較上月 −50%，其中 4 節由 Liam Lai 代堂"],
    lines: [],
    grades: [
      {
        gradeLabel: "中四",
        classes: [
          {
            id: "ken-s4",
            name: "中四物理小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "ken-s4",
              dates: [...AUG_W3],
              startTime: "19:00",
              endTime: "20:30",
              present: S_PHY,
              amount: 430,
              note: "高中 HC：$150 + $70×4",
              absentOn: { "2026-08-19": ["李俊傑"] },
            }),
          },
        ],
      },
      {
        gradeLabel: "中五",
        classes: [
          {
            id: "ken-s5",
            name: "中五物理小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "ken-s5",
              dates: [...AUG_W4],
              startTime: "17:30",
              endTime: "19:00",
              present: S_PHY,
              amount: 430,
              note: "高中 HC：$150 + $70×4",
            }),
          },
        ],
      },
      {
        gradeLabel: "中三",
        classes: [
          {
            id: "ken-subbed",
            name: "中三數學小組 A",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "ken-subbed",
              dates: [...AUG_W5],
              startTime: "17:00",
              endTime: "18:30",
              present: S_MATH_B,
              amount: 0,
              note: "本節由 Liam Lai 代堂，不計入 Kenneth",
              formula: "代出 → $0（歸 Liam Lai）",
              substitute: "received",
              substitutePeer: "Liam Lai",
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "judy",
    name: "Judy Chu",
    mode: "特別 HC",
    // 特別費率約 $550／節 × 8；另示範功課班串流
    gross: 5800,
    previousGross: 4400,
    anomalies: ["跨模式：特別 HC + 功課班，請分開核對"],
    modeStreams: [
      {
        id: "judy-special",
        label: "特別 HC（化學小組）",
        mode: "特別 HC",
        amount: 4400,
        detail: "8 節 × 約 $550",
      },
      {
        id: "judy-hw",
        label: "功課班 $70/hr",
        mode: "獨立定價",
        amount: 1400,
        detail: "示範 20 小時（與 Leo 同結構）",
      },
    ],
    lines: [
      {
        label: "功課班時薪（跨模式）",
        amount: 1400,
        note: "與特別 HC 分開核對；合計見總薪酬",
      },
    ],
    grades: [
      {
        gradeLabel: "中六",
        classes: [
          {
            id: "judy-s6",
            name: "中六化學小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "judy-s6",
              dates: [...AUG_W5],
              startTime: "14:00",
              endTime: "15:30",
              present: S_CHEM,
              amount: 550,
              note: "特別費率（高中）",
              formula: "特別 HC $550／節",
              rateSource: "Judy 特別費率表，自 2026-03-01 生效",
              subject: "化學",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課",
              absentOn: { "2026-08-14": ["吳嘉欣"] },
            }),
          },
        ],
      },
      {
        gradeLabel: "中五",
        classes: [
          {
            id: "judy-s5",
            name: "中五化學小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "judy-s5",
              dates: [...AUG_W2],
              startTime: "14:00",
              endTime: "15:30",
              present: S_CHEM,
              amount: 550,
              note: "特別費率（高中）",
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "jackson",
    name: "Jackson Lau（Sum）",
    mode: "獨立定價",
    // 小組 $110×5＝$550 ×8；一對一 $454 ×4
    gross: 6216,
    previousGross: 5980,
    anomalies: [],
    lines: [],
    grades: [
      {
        gradeLabel: "中一",
        classes: [
          {
            id: "sum-s1",
            name: "中一英文小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "sum-s1",
              dates: [...AUG_W1],
              startTime: "10:00",
              endTime: "11:30",
              present: S_JR,
              amount: 550,
              note: "$110 × 5",
            }),
          },
        ],
      },
      {
        gradeLabel: "中二",
        classes: [
          {
            id: "sum-s2",
            name: "中二英文小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "sum-s2",
              dates: [...AUG_W3],
              startTime: "10:00",
              endTime: "11:30",
              present: S_JR,
              amount: 550,
              note: "$110 × 5",
              absentOn: { "2026-08-12": ["鄭志偉"] },
            }),
          },
          {
            id: "sum-1on1",
            name: "中二英文一對一 · 梁卓希",
            classKind: "private",
            lessons: seriesLessons({
              idPrefix: "sum-1on1",
              dates: ["2026-08-02", "2026-08-09", "2026-08-16", "2026-08-23"],
              startTime: "11:30",
              endTime: "13:00",
              present: ["梁卓希"],
              amount: 454,
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "cyndi",
    name: "Cyndi Ng",
    mode: "獨立定價",
    // 原價×50%：約 $750／節 × 8
    gross: 6000,
    previousGross: 5250,
    anomalies: [],
    lines: [],
    grades: [
      {
        gradeLabel: "中四",
        classes: [
          {
            id: "cyndi-s4",
            name: "中四生物小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "cyndi-s4",
              dates: [...AUG_W1],
              startTime: "13:00",
              endTime: "14:30",
              present: S_BIO,
              amount: 750,
              note: "原價×50%（原價基數約 $1,500）",
              absentOn: { "2026-08-17": ["張家豪"] },
            }),
          },
        ],
      },
      {
        gradeLabel: "中五",
        classes: [
          {
            id: "cyndi-s5",
            name: "中五生物小組",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "cyndi-s5",
              dates: [...AUG_W3],
              startTime: "13:00",
              endTime: "14:30",
              present: S_BIO,
              amount: 750,
              note: "原價×50%",
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "leo",
    name: "Leo Chan",
    mode: "兼職 HC",
    gross: 1760,
    previousGross: 1600,
    anomalies: ["跨模式：PT 專科班 + 功課班，請分開核對"],
    modeStreams: [
      {
        id: "leo-pt",
        label: "PT 專科班（一般費率）",
        mode: "兼職 HC",
        amount: 360,
        detail: "示範 1 節 · $120+$60×4",
      },
      {
        id: "leo-hw",
        label: "功課班 $70/hr",
        mode: "獨立定價",
        amount: 1400,
        detail: "示範 20 小時",
      },
    ],
    lines: [
      {
        label: "功課班時薪（跨模式）",
        amount: 1400,
        note: "與 PT 專科班分開核對",
      },
    ],
    grades: [
      {
        gradeLabel: "中二",
        classes: [
          {
            id: "leo-s2",
            name: "中二專科小組（Leo）",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "leo-s2",
              dates: ["2026-08-08"],
              startTime: "16:00",
              endTime: "17:30",
              present: S_JR,
              amount: 360,
              hcPricing: { first: 120, extra: 60 },
              note: "PT 專科班一般費率",
              rateSource: "初中一般 PT（$120/$60），自 2026-01-01 生效",
              subject: "數學",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課",
            }),
          },
        ],
      },
    ],
  }),
  withMpf({
    id: "cody",
    name: "Cody Cheong",
    mode: "WFH 時薪",
    gross: null,
    previousGross: 2400,
    anomalies: ["本月未有已核准的在家工作時數"],
    wfh: { status: "missing", hours: null, ratePerHour: 60 },
    lines: [
      {
        label: "在家工作時薪 $60／小時",
        amount: 0,
        note: "上月約 40 小時；本月待申報並經管理層核准（財務不可自核）",
      },
    ],
    grades: [],
  }),
  withMpf({
    id: "billy",
    name: "Billy Shek",
    mode: "兼職 HC",
    // 初中 11 節已點名×$360；另 1 節未點名
    gross: 3960,
    previousGross: 3960,
    anomalies: ["有 1 節排程尚未點名（示範）"],
    lines: [],
    grades: [
      {
        gradeLabel: "中一",
        classes: [
          {
            id: "billy-s1",
            name: "中一數學小組 B",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "billy-s1",
              dates: [...AUG_W5],
              startTime: "16:00",
              endTime: "17:30",
              present: S_JR,
              amount: 360,
              hcPricing: { first: 120, extra: 60 },
              note: "初中 HC",
              rateSource: "初中一般 PT（$120/$60），自 2026-01-01 生效",
              subject: "數學",
              classTypeSnapshot: "小組（當日快照）",
              eventTimeline: "原訂課（8/28 未點名）",
              notRolledDates: ["2026-08-28"],
            }),
          },
        ],
      },
      {
        gradeLabel: "中二",
        classes: [
          {
            id: "billy-s2",
            name: "中二數學小組 B",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "billy-s2",
              dates: [...AUG_W2],
              startTime: "16:00",
              endTime: "17:30",
              present: S_JR,
              amount: 360,
              hcPricing: { first: 120, extra: 60 },
              note: "初中 HC",
            }),
          },
        ],
      },
      {
        gradeLabel: "中三",
        classes: [
          {
            id: "billy-s3",
            name: "中三數學小組 B",
            classKind: "group",
            lessons: seriesLessons({
              idPrefix: "billy-s3",
              dates: [...AUG_W4],
              startTime: "15:00",
              endTime: "16:30",
              present: S_MATH_B,
              amount: 360,
              hcPricing: { first: 120, extra: 60 },
              note: "初中 HC：病假不計入",
              absentOn: { "2026-08-20": ["林詩晴"] },
            }),
          },
        ],
      },
    ],
  }),
  /** 本月無堂 $0 — 證明「在母名單但無計薪」，非 query 漏人 */
  withMpf({
    id: "cheryl",
    name: "Cheryl Ng",
    mode: "兼職 HC",
    gross: 0,
    previousGross: 720,
    anomalies: [],
    lines: [{ label: "本月無已排程／已點名課堂", amount: 0, note: "母名單在冊 · $0" }],
    grades: [],
  }),
  withMpf({
    id: "emma",
    name: "Emma Cai",
    mode: "兼職 HC",
    gross: 0,
    previousGross: 0,
    anomalies: [],
    lines: [{ label: "本月無堂", amount: 0, note: "母名單在冊 · $0" }],
    grades: [],
  }),
  withMpf({
    id: "phoebe",
    name: "Phoebe Tam",
    mode: "特別 HC",
    gross: 0,
    previousGross: 1100,
    anomalies: [],
    lines: [{ label: "本月無堂", amount: 0, note: "母名單在冊 · $0" }],
    grades: [],
  }),
].map((t) => syncLessonBasedGross(t))

/** HC／獨立定價：總薪酬與逐堂計薪 HC 金額對齊（病假不計入） */
function syncLessonBasedGross(t: PayrollTeacherRow): PayrollTeacherRow {
  if (t.personalSplit || t.wfh || t.salaryEvidence) return t
  if (t.mode !== "兼職 HC" && t.mode !== "特別 HC" && t.mode !== "獨立定價") return t
  if (t.grades.length === 0) return t
  const lessonSum = teacherLessonAmount(t)
  const lineSum = t.lines.reduce((s, l) => s + l.amount, 0)
  const gross = Math.round((lessonSum + lineSum) * 100) / 100
  return withMpf({ ...t, gross })
}

export const DEFAULT_CALC_META: CalcVersionMeta = {
  version: 3,
  computedAt: "2026-08-03 14:00",
  dataCutoffAt: "2026-08-03 14:00",
  previousVersion: 2,
  previousComputedAt: "2026-08-01 10:30",
}

/** 示範重算逐節 diff（點「重新計算」後顯示） */
export const MOCK_RECALC_DIFF: RecalcDiffItem[] = [
  {
    teacherName: "Natalie Kwok",
    lessonLabel: "中五英文小組 C · 8/13",
    field: "HC",
    before: "5",
    after: "6（張家豪 no show 計入）",
    amountDelta: 70,
  },
  {
    teacherName: "Liam Lai",
    lessonLabel: "中三數學小組（代 Kenneth）· 8/21",
    field: "代堂歸屬",
    before: "Kenneth",
    after: "Liam",
    amountDelta: 360,
  },
  {
    teacherName: "Cody Cheong",
    lessonLabel: "WFH 工時",
    field: "狀態",
    before: "未申報",
    after: "待管理層核准（若已申報）",
    amountDelta: 0,
  },
]

export type RosterSummary = {
  total: number
  withLessons: number
  zeroHour: number
  anomalyNames: string[]
  zeroHourNames: string[]
  paidNames: string[]
  outsideNote: string
}

export function buildRosterSummary(teachers: PayrollTeacherRow[]): RosterSummary {
  const zeroHour = teachers.filter(
    (t) => t.gross === 0 && teacherLessonCount(t) === 0 && !t.wfh
  )
  const withLessons = teachers.filter((t) => teacherLessonCount(t) > 0 || (t.wfh != null && t.id === "cody"))
  const paid = teachers.filter((t) => (t.gross ?? 0) > 0 || (t.gross == null && t.wfh))
  const anomalyNames = teachers.filter((t) => t.anomalies.length > 0).map((t) => t.name)
  return {
    total: teachers.length,
    withLessons: withLessons.length,
    zeroHour: zeroHour.length,
    anomalyNames,
    zeroHourNames: zeroHour.map((t) => t.name),
    paidNames: paid.map((t) => t.name),
    outsideNote: "不在名單但系統有紀錄：—（無）",
  }
}

export function buildExcludedFollowUps(
  teachers: PayrollTeacherRow[],
  excludedIds: Set<string>
): ExcludedFollowUp[] {
  return teachers
    .filter((t) => excludedIds.has(t.id))
    .map((t) => ({
      teacherId: t.id,
      teacherName: t.name,
      reason: t.anomalies[0] ?? "硬阻擋已排除",
      handoffTo: "Mark Yu",
    }))
}

export type NotRolledRef = {
  teacherId: string
  teacherName: string
  className: string
  lessonId: string
  date: string
}

export type SubstituteRef = {
  teacherId: string
  teacherName: string
  direction: "given" | "received"
  peer: string
  className: string
  lessonId: string
  date: string
  amount: number
}

export function listNotRolledLessons(teachers: PayrollTeacherRow[]): NotRolledRef[] {
  const out: NotRolledRef[] = []
  for (const t of teachers) {
    for (const g of t.grades) {
      for (const c of g.classes) {
        for (const l of c.lessons) {
          if (l.notRolled) {
            out.push({
              teacherId: t.id,
              teacherName: t.name,
              className: c.name,
              lessonId: l.id,
              date: l.date,
            })
          }
        }
      }
    }
  }
  return out
}

export function listSubstituteLessons(teachers: PayrollTeacherRow[]): SubstituteRef[] {
  const out: SubstituteRef[] = []
  for (const t of teachers) {
    for (const g of t.grades) {
      for (const c of g.classes) {
        for (const l of c.lessons) {
          if (l.substitute) {
            out.push({
              teacherId: t.id,
              teacherName: t.name,
              direction: l.substitute,
              peer: l.substitutePeer ?? "—",
              className: c.name,
              lessonId: l.id,
              date: l.date,
              amount: l.amount,
            })
          }
        }
      }
    }
  }
  return out
}

export function teacherMomPct(t: PayrollTeacherRow): number | null {
  if (t.gross == null || t.previousGross == null || t.previousGross <= 0) return null
  return Math.round(((t.gross - t.previousGross) / t.previousGross) * 100)
}

export function withWfhApplied(
  teacher: PayrollTeacherRow,
  hours: number | null,
  status: WfhMockState["status"]
): PayrollTeacherRow {
  if (!teacher.wfh) return teacher
  const rate = teacher.wfh.ratePerHour
  if (status === "approved" && hours != null && hours > 0) {
    const gross = Math.round(hours * rate * 100) / 100
    return withMpf({
      ...teacher,
      gross,
      anomalies: teacher.anomalies.filter((a) => !a.includes("時數") && !a.includes("工時")),
      wfh: { status, hours, ratePerHour: rate },
      lines: [
        {
          label: `在家工作時薪 $${rate}／小時 × ${hours} 小時`,
          amount: gross,
          note: "已核准（示範）",
        },
      ],
    })
  }
  return withMpf({
    ...teacher,
    gross: null,
    anomalies:
      teacher.anomalies.some((a) => a.includes("時數") || a.includes("工時"))
        ? teacher.anomalies
        : [...teacher.anomalies, "本月未有已核准的在家工作時數"],
    wfh: { status, hours, ratePerHour: rate },
    lines: [
      {
        label: `在家工作時薪 $${rate}／小時`,
        amount: 0,
        note:
          status === "submitted"
            ? `已申報 ${hours ?? 0} 小時，待管理層核准`
            : "待申報並經管理層核准",
      },
    ],
  })
}

export type ReadinessItem = {
  key: string
  label: string
  ok: boolean
  detail: string
  hard: boolean
}

export function buildMonthReadiness(teachers: PayrollTeacherRow[]): ReadinessItem[] {
  const notRolled = listNotRolledLessons(teachers)
  const missingRate = teachers.filter((t) => t.missingRate)
  const cody = teachers.find((t) => t.id === "cody")
  const codyOk = Boolean(cody?.wfh && cody.wfh.status === "approved" && (cody.wfh.hours ?? 0) > 0)
  const subs = listSubstituteLessons(teachers)
  return [
    {
      key: "rollcall",
      label: "點名齊備",
      ok: notRolled.length === 0,
      detail:
        notRolled.length === 0
          ? "所有已排程課堂已點名"
          : `${notRolled.length} 節尚未點名`,
      hard: true,
    },
    {
      key: "rates",
      label: "費率／月薪",
      ok: missingRate.length === 0,
      detail:
        missingRate.length === 0
          ? "各同事已有適用費率或月薪（示範）"
          : `${missingRate.length} 人缺費率`,
      hard: true,
    },
    {
      key: "cody",
      label: "Cody 工時",
      ok: codyOk || !cody,
      detail: !cody
        ? "—"
        : codyOk
          ? `已核准 ${cody.wfh?.hours} 小時`
          : cody.wfh?.status === "submitted"
            ? `已申報 ${cody.wfh.hours ?? 0} 小時，待核准`
            : "未有已核准工時（可排除後提交其餘）",
      hard: true,
    },
    {
      key: "sub",
      label: "代堂核對",
      ok: true,
      detail:
        subs.length === 0 ? "本月無代堂標記" : `${subs.length} 節含代堂，請抽查歸屬`,
      hard: false,
    },
  ]
}


export const PAYROLL_MONTH_OPTIONS = [
  { value: "2026-08", label: "2026年8月" },
  { value: "2026-07", label: "2026年7月（已結算示範）" },
] as const

export const PAYROLL_MOCK_BY_MONTH: Record<string, PayrollMonthMock> = {
  "2026-08": {
    monthKey: "2026-08",
    monthLabel: "2026年8月",
    status: "財務審閱中",
    calc: { ...DEFAULT_CALC_META },
    teachers: augustTeachers,
  },
  "2026-07": {
    monthKey: "2026-07",
    monthLabel: "2026年7月",
    status: "已結算",
    submittedBy: "財務（示範）",
    submittedAt: "2026-07-28 16:20",
    calc: {
      version: 1,
      computedAt: "2026-07-28 16:00",
      dataCutoffAt: "2026-07-28 15:30",
    },
    teachers: augustTeachers.map((t) => ({
      ...t,
      anomalies: [],
      grades: t.grades.map((g) => ({
        ...g,
        classes: g.classes.map((c) => ({
          ...c,
          lessons: c.lessons.map((l) => ({ ...l, notRolled: false })),
        })),
      })),
      gross: t.previousGross,
      net:
        t.previousGross == null
          ? null
          : Math.round(
              (t.previousGross -
                (["Mark Yu", "Christine Fan", "Sophie Yu", "Katie Lee"].includes(t.name)
                  ? mpfEmployee(t.previousGross)
                  : 0)) *
                100
            ) / 100,
      employeeMpf: ["Mark Yu", "Christine Fan", "Sophie Yu", "Katie Lee"].includes(t.name)
        ? mpfEmployee(t.previousGross ?? 0)
        : 0,
      employerMpf: ["Mark Yu", "Christine Fan", "Sophie Yu", "Katie Lee"].includes(t.name)
        ? mpfEmployer(t.previousGross ?? 0)
        : 0,
    })),
  },
}

export function statusLabel(status: PayrollRunStatus): string {
  switch (status) {
    case "草稿":
      return "草稿"
    case "財務審閱中":
      return "財務審閱中"
    case "待管理層核實":
      return "待管理層核實"
    case "已結算":
      return "已結算"
  }
}

/** 硬阻擋：示範上視為提交前應處理（未點名、缺工時） */
export function hardBlockAnomalies(teachers: PayrollTeacherRow[]): { name: string; msg: string }[] {
  const out: { name: string; msg: string }[] = []
  for (const t of teachers) {
    for (const msg of t.anomalies) {
      if (
        msg.includes("未點名") ||
        msg.includes("缺點名") ||
        msg.includes("未有已核准") ||
        msg.includes("時數") ||
        msg.includes("費率") ||
        msg.includes("WFH")
      ) {
        out.push({ name: t.name, msg })
      }
    }
  }
  return out
}

export function summarizePayrollMonth(month: PayrollMonthMock) {
  const withPay = month.teachers.filter((t) => t.gross != null)
  const gross = withPay.reduce((s, t) => s + (t.gross ?? 0), 0)
  const employeeMpf = month.teachers.reduce((s, t) => s + t.employeeMpf, 0)
  const employerMpf = month.teachers.reduce((s, t) => s + t.employerMpf, 0)
  const net = withPay.reduce((s, t) => s + (t.net ?? 0), 0)
  const anomalyCount = month.teachers.filter((t) => t.anomalies.length > 0).length
  const lessonCount = month.teachers.reduce((s, t) => s + teacherLessonCount(t), 0)
  const billableHc = month.teachers.reduce((s, t) => s + teacherBillableHc(t), 0)
  return {
    gross,
    employeeMpf,
    employerMpf,
    net,
    teacherCount: month.teachers.length,
    paidCount: withPay.length,
    anomalyCount,
    lessonCount,
    billableHc,
  }
}

export function sortTeachersForDisplay(teachers: PayrollTeacherRow[]): PayrollTeacherRow[] {
  return [...teachers].sort((a, b) => {
    const aA = a.anomalies.length > 0 ? 0 : 1
    const bA = b.anomalies.length > 0 ? 0 : 1
    if (aA !== bA) return aA - bA
    return a.name.localeCompare(b.name, "en")
  })
}

export function formatHkd(amount: number | null | undefined): string {
  if (amount == null) return "—"
  return `$${amount.toLocaleString("en-HK", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function mpfBandSteps(gross: number | null | undefined): {
  applicable: string
  band: string
  employee: string
  employer: string
} | null {
  if (gross == null) return null
  if (gross < 7100) {
    return {
      applicable: formatHkd(gross),
      band: "低於 $7,100 → 僱員免供",
      employee: "$0",
      employer: formatHkd(Math.round(gross * 0.05 * 100) / 100),
    }
  }
  if (gross > 30000) {
    return {
      applicable: formatHkd(gross),
      band: "高於 $30,000 → 供款上限",
      employee: "$1,500",
      employer: "$1,500",
    }
  }
  const e = Math.round(gross * 0.05 * 100) / 100
  return {
    applicable: formatHkd(gross),
    band: "$7,100–$30,000 → 5%",
    employee: formatHkd(e),
    employer: formatHkd(e),
  }
}

/** 管理層強制抽查項（示範） */
export function buildManagerSpotChecks(teachers: PayrollTeacherRow[]): {
  id: string
  label: string
  teacherId: string
}[] {
  const checks: { id: string; label: string; teacherId: string }[] = []
  if (teachers.some((t) => t.id === "mark")) {
    checks.push({ id: "spot-mark-pool", label: "Mark Yu 分成原價池", teacherId: "mark" })
  }
  if (teachers.some((t) => t.id === "liam")) {
    checks.push({ id: "spot-liam-sub", label: "Liam Lai 代堂歸屬", teacherId: "liam" })
  }
  if (teachers.some((t) => t.id === "cody")) {
    checks.push({ id: "spot-cody-wfh", label: "Cody 工時核准", teacherId: "cody" })
  }
  return checks
}
