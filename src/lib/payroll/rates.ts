import type {
  ComputedLessonLine,
  GradeBand,
  HcTier,
  PayrollLessonInput,
  PayrollMode,
  PayrollRateConfig,
  PayrollRateRow,
  PrivateSlotKind,
} from "@/lib/payroll/types"
import { roundMoney } from "@/lib/payroll/gradeBand"

function asNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asTier(raw: unknown): HcTier | undefined {
  if (raw == null || typeof raw !== "object") return undefined
  const o = raw as Record<string, unknown>
  const base = asNum(o.base, NaN)
  const perExtra = asNum(o.per_extra ?? o.perExtra, NaN)
  if (!Number.isFinite(base) || !Number.isFinite(perExtra)) return undefined
  return { base, perExtra }
}

/** 將 DB jsonb 解成引擎 config（相容 snake_case） */
export function parseRateConfig(raw: unknown): PayrollRateConfig {
  if (raw == null || typeof raw !== "object") return {}
  const o = raw as Record<string, unknown>
  const codes = o.commission_subject_codes ?? o.commissionSubjectCodes
  return {
    personalPct: o.personal_pct != null ? asNum(o.personal_pct) : o.personalPct != null ? asNum(o.personalPct) : undefined,
    commissionPct:
      o.commission_pct != null ? asNum(o.commission_pct) : o.commissionPct != null ? asNum(o.commissionPct) : undefined,
    commissionSubjectCodes: Array.isArray(codes)
      ? codes.map((c) => String(c).toUpperCase())
      : undefined,
    monthlySalary:
      o.monthly_salary != null ? asNum(o.monthly_salary) : o.monthlySalary != null ? asNum(o.monthlySalary) : undefined,
    junior: asTier(o.junior),
    senior: asTier(o.senior),
    oneToOneHc:
      o.one_to_one_hc != null ? asNum(o.one_to_one_hc) : o.oneToOneHc != null ? asNum(o.oneToOneHc) : undefined,
    oneToTwoHc:
      o.one_to_two_hc != null ? asNum(o.one_to_two_hc) : o.oneToTwoHc != null ? asNum(o.oneToTwoHc) : undefined,
    groupPerHc:
      o.group_per_hc != null ? asNum(o.group_per_hc) : o.groupPerHc != null ? asNum(o.groupPerHc) : undefined,
    groupPct: o.group_pct != null ? asNum(o.group_pct) : o.groupPct != null ? asNum(o.groupPct) : undefined,
    oneToOne: o.one_to_one != null ? asNum(o.one_to_one) : o.oneToOne != null ? asNum(o.oneToOne) : undefined,
    oneToTwo: o.one_to_two != null ? asNum(o.one_to_two) : o.oneToTwo != null ? asNum(o.oneToTwo) : undefined,
    hourlyRate:
      o.hourly_rate != null ? asNum(o.hourly_rate) : o.hourlyRate != null ? asNum(o.hourlyRate) : undefined,
    mpf: typeof o.mpf === "boolean" ? o.mpf : undefined,
  }
}

export function parsePayrollMode(raw: string | null | undefined): PayrollMode | null {
  const s = String(raw ?? "").trim()
  const allowed: PayrollMode[] = ["分成制", "固定月薪", "兼職 HC", "特別 HC", "獨立定價", "WFH 時薪"]
  return (allowed as string[]).includes(s) ? (s as PayrollMode) : null
}

export function effectiveHc(
  billableCount: number,
  privateSlot: PrivateSlotKind,
  oneToOneHc: number,
  oneToTwoHc: number
): number {
  if (privateSlot === "one_to_one") return oneToOneHc
  if (privateSlot === "one_to_two") return oneToTwoHc
  return billableCount
}

export function hcLessonPay(hc: number, tier: HcTier): number {
  if (hc <= 0) return 0
  return roundMoney(tier.base + tier.perExtra * (hc - 1))
}

function tierForBand(cfg: PayrollRateConfig, band: GradeBand): HcTier | null {
  if (band === "senior") return cfg.senior ?? null
  if (band === "junior" || band === "primary") return cfg.junior ?? null
  // unknown：優先初中，否則高中
  return cfg.junior ?? cfg.senior ?? null
}

export function computeHcLessonAmount(
  lesson: PayrollLessonInput,
  cfg: PayrollRateConfig
): { amount: number; billableHc: number; formula: string; note: string | null } {
  const billableCount = lesson.students.filter((s) => s.billable).length
  const oneToOneHc = cfg.oneToOneHc ?? 3
  const oneToTwoHc = cfg.oneToTwoHc ?? 4
  const hc = effectiveHc(billableCount, lesson.privateSlot, oneToOneHc, oneToTwoHc)
  if (hc <= 0 || billableCount <= 0) {
    return { amount: 0, billableHc: 0, formula: "HC=0 → 不計薪", note: null }
  }
  const tier = tierForBand(cfg, lesson.gradeBand)
  if (!tier) {
    return {
      amount: 0,
      billableHc: hc,
      formula: "缺年級費率",
      note: "班別年級無法對應初中／高中費率",
    }
  }
  const amount = hcLessonPay(hc, tier)
  const bandLabel =
    lesson.gradeBand === "senior" ? "高中" : lesson.gradeBand === "junior" ? "初中" : lesson.gradeBand
  return {
    amount,
    billableHc: hc,
    formula: `${bandLabel} $${tier.base}+$${tier.perExtra}×(${hc}-1)`,
    note:
      lesson.privateSlot === "one_to_one"
        ? `一對一等效 ${oneToOneHc} HC（實際扣堂 ${billableCount}）`
        : lesson.privateSlot === "one_to_two"
          ? `一對二等效 ${oneToTwoHc} HC（實際扣堂 ${billableCount}）`
          : null,
  }
}

export function computeIndependentLessonAmount(
  lesson: PayrollLessonInput,
  cfg: PayrollRateConfig
): { amount: number; billableHc: number; formula: string; note: string | null; listPriceTotal: number } {
  const billable = lesson.students.filter((s) => s.billable)
  const billableHc = billable.length
  const listPriceTotal = roundMoney(billable.reduce((s, r) => s + r.listPrice, 0))

  if (lesson.privateSlot === "one_to_one") {
    const amount = cfg.oneToOne ?? 0
    return {
      amount: billableHc > 0 ? amount : 0,
      billableHc: billableHc > 0 ? 1 : 0,
      formula: `一對一固定 $${amount}`,
      note: null,
      listPriceTotal,
    }
  }
  if (lesson.privateSlot === "one_to_two") {
    const amount = cfg.oneToTwo ?? 0
    return {
      amount: billableHc > 0 ? amount : 0,
      billableHc: billableHc > 0 ? billableHc : 0,
      formula: `一對二固定 $${amount}`,
      note: null,
      listPriceTotal,
    }
  }

  if (cfg.groupPct != null && cfg.groupPct > 0) {
    const amount = roundMoney(listPriceTotal * cfg.groupPct)
    return {
      amount: billableHc > 0 ? amount : 0,
      billableHc,
      formula: `已扣堂原價 $${listPriceTotal} × ${cfg.groupPct * 100}%`,
      note: null,
      listPriceTotal,
    }
  }

  const perHc = cfg.groupPerHc ?? 0
  const amount = roundMoney(perHc * billableHc)
  return {
    amount,
    billableHc,
    formula: `$${perHc}/HC × ${billableHc}`,
    note: null,
    listPriceTotal,
  }
}

export function computeSplitLessonBases(lesson: PayrollLessonInput): {
  billableHc: number
  listPriceTotal: number
  personalSplitBase: number
} {
  const billable = lesson.students.filter((s) => s.billable)
  const listPriceTotal = roundMoney(billable.reduce((s, r) => s + r.listPrice, 0))
  return {
    billableHc: billable.length,
    listPriceTotal,
    personalSplitBase: listPriceTotal,
  }
}

export function buildLessonLine(
  lesson: PayrollLessonInput,
  partial: {
    amount: number
    billableHc: number
    formula: string
    note: string | null
    listPriceTotal?: number
    personalSplitBase?: number
    commissionPoolBase?: number
  }
): ComputedLessonLine {
  const billable = lesson.students.filter((s) => s.billable)
  const listPriceTotal =
    partial.listPriceTotal ?? roundMoney(billable.reduce((s, r) => s + r.listPrice, 0))
  return {
    scheduleId: lesson.scheduleId,
    classId: lesson.classId,
    classLabel: lesson.classLabel,
    classKind: lesson.classKind,
    date: lesson.scheduledDate,
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    billableHc: partial.billableHc,
    listPriceTotal,
    amount: roundMoney(partial.amount),
    formula: partial.formula,
    note: partial.note,
    substitute: lesson.originalTeacherId != null && lesson.originalTeacherId !== lesson.teacherId,
    originalTeacherName: lesson.originalTeacherName,
    missingRollCall: lesson.missingRollCall,
    expectedRosterCount: lesson.expectedRosterCount,
    students: lesson.students,
    personalSplitBase: partial.personalSplitBase ?? 0,
    commissionPoolBase: partial.commissionPoolBase ?? 0,
    subjectCode: lesson.subjectCode,
  }
}

export function pickRateForMonth(
  rates: PayrollRateRow[],
  teacherId: string,
  monthKey: string
): PayrollRateRow | null {
  const monthStart = `${monthKey}-01`
  const candidates = rates
    .filter((r) => r.teacherId === teacherId)
    .filter((r) => r.effectiveFrom <= monthStart)
    .filter((r) => r.effectiveTo == null || r.effectiveTo >= monthStart)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
  return candidates[0] ?? null
}
