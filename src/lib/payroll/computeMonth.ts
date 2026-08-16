import type {
  ComputedLessonLine,
  ComputedTeacherResult,
  MonthComputeInput,
  MonthComputeResult,
  PayrollLessonInput,
  PayrollRateRow,
  PayrollTeacherInput,
} from "@/lib/payroll/types"
import { roundMoney } from "@/lib/payroll/gradeBand"
import {
  buildLessonLine,
  computeHcLessonAmount,
  computeIndependentLessonAmount,
  computeSplitLessonBases,
} from "@/lib/payroll/rates"

function subjectMatches(codes: string[] | undefined, subjectCode: string | null): boolean {
  if (!codes?.length || !subjectCode) return false
  const up = subjectCode.toUpperCase()
  return codes.some((c) => c.toUpperCase() === up)
}

function lessonForTeacher(lesson: PayrollLessonInput, teacherId: string): boolean {
  return lesson.teacherId === teacherId && !lesson.cancelled
}

/**
 * 計算一位教師當月薪酬（不含人手調整；MPF 在組裝 UI 時套用）
 */
export function computeTeacherMonth(
  teacher: PayrollTeacherInput,
  allLessons: PayrollLessonInput[],
  previousGross?: number
): ComputedTeacherResult {
  const rate = teacher.rate
  const anomalies: string[] = []
  let hardBlock = false

  if (!rate) {
    anomalies.push("缺有效費率")
    hardBlock = true
    return {
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName,
      mode: "未設定",
      missingRate: true,
      grossBeforeAdj: 0,
      lines: [],
      lessons: [],
      personalSplit: 0,
      commissionPool: 0,
      commissionPoolItems: [],
      anomalies,
      hardBlock,
    }
  }

  const cfg = rate.config
  const mode = rate.mode
  const myLessons = allLessons.filter((l) => lessonForTeacher(l, teacher.teacherId))
  const lessons: ComputedLessonLine[] = []
  const lines: ComputedTeacherResult["lines"] = []
  let personalSplit = 0
  let commissionPool = 0
  const commissionPoolItems: ComputedTeacherResult["commissionPoolItems"] = []

  // 缺點名硬阻擋
  for (const l of myLessons) {
    if (l.missingRollCall) {
      anomalies.push(`缺點名：${l.classLabel}（${l.scheduledDate}）`)
      hardBlock = true
    }
  }

  if (mode === "固定月薪") {
    const salary = cfg.monthlySalary ?? 0
    if (salary <= 0) {
      anomalies.push("缺有效費率（月薪為 0）")
      hardBlock = true
    }
    lines.push({ label: "固定月薪", amount: salary, kind: "fixed" })
  } else if (mode === "WFH 時薪") {
    const rateHr = cfg.hourlyRate ?? 60
    if (teacher.approvedHours <= 0) {
      anomalies.push("缺已核准 WFH 工時")
      hardBlock = true
    }
    const amount = roundMoney(rateHr * teacher.approvedHours)
    lines.push({
      label: `WFH ${teacher.approvedHours} 小時 × $${rateHr}`,
      amount,
      kind: "wfh",
    })
  } else if (mode === "分成制") {
    const personalPct = cfg.personalPct ?? 0.6
    const commissionPct = cfg.commissionPct ?? 0.1
    for (const l of myLessons) {
      const bases = computeSplitLessonBases(l)
      const amount = roundMoney(bases.personalSplitBase * personalPct)
      lessons.push(
        buildLessonLine(l, {
          amount,
          billableHc: bases.billableHc,
          formula: `已扣堂原價 $${bases.listPriceTotal} × ${personalPct * 100}%`,
          note: null,
          listPriceTotal: bases.listPriceTotal,
          personalSplitBase: bases.personalSplitBase,
        })
      )
      personalSplit = roundMoney(personalSplit + amount)
    }
    // 他人授課佣金：指定科目、其他教師上堂
    for (const l of allLessons) {
      if (l.cancelled) continue
      if (!l.teacherId || l.teacherId === teacher.teacherId) continue
      if (!subjectMatches(cfg.commissionSubjectCodes, l.subjectCode)) continue
      const bases = computeSplitLessonBases(l)
      if (bases.listPriceTotal <= 0) continue
      const poolAmount = roundMoney(bases.listPriceTotal * commissionPct)
      commissionPool = roundMoney(commissionPool + poolAmount)
      commissionPoolItems.push({
        scheduleId: l.scheduleId,
        classLabel: l.classLabel,
        date: l.scheduledDate,
        amount: poolAmount,
        teacherName: l.teacherName ?? "—",
      })
    }
    if (personalSplit > 0) {
      lines.push({ label: "個人授課收益（60%）", amount: personalSplit, kind: "personal_split" })
    }
    if (commissionPool > 0) {
      lines.push({ label: "他人授課佣金（10%）", amount: commissionPool, kind: "commission" })
    } else {
      anomalies.push("分成制佣金科目池為 $0")
    }
  } else if (mode === "兼職 HC" || mode === "特別 HC") {
    for (const l of myLessons) {
      const r = computeHcLessonAmount(l, cfg)
      if (r.note?.includes("缺年級")) {
        anomalies.push(`缺年級費率：${l.classLabel}`)
        hardBlock = true
      }
      lessons.push(
        buildLessonLine(l, {
          ...r,
          listPriceTotal: roundMoney(l.students.filter((s) => s.billable).reduce((a, s) => a + s.listPrice, 0)),
        })
      )
    }
  } else if (mode === "獨立定價") {
    for (const l of myLessons) {
      const r = computeIndependentLessonAmount(l, cfg)
      lessons.push(buildLessonLine(l, r))
    }
  }

  const lessonSum = roundMoney(lessons.reduce((s, l) => s + l.amount, 0))
  const lineSum = roundMoney(lines.reduce((s, l) => s + l.amount, 0))
  // 分成制金額已在 lines；HC／獨立定價在 lessons
  const grossBeforeAdj =
    mode === "分成制" || mode === "固定月薪" || mode === "WFH 時薪"
      ? lineSum
      : roundMoney(lessonSum + lineSum)

  if (previousGross != null && previousGross > 0) {
    const delta = Math.abs(grossBeforeAdj - previousGross) / previousGross
    if (delta >= 0.3) {
      anomalies.push(`本月金額較上月變動 ±${Math.round(delta * 100)}%`)
    }
  }

  for (const l of lessons) {
    if (l.billableHc === 0 && !l.missingRollCall) {
      anomalies.push(`實際計薪人頭=0：${l.classLabel}（${l.date}）`)
    }
  }

  return {
    teacherId: teacher.teacherId,
    teacherName: teacher.teacherName,
    mode,
    missingRate: false,
    grossBeforeAdj,
    lines,
    lessons,
    personalSplit,
    commissionPool,
    commissionPoolItems,
    anomalies: [...new Set(anomalies)],
    hardBlock,
  }
}

export function computePayrollMonth(input: MonthComputeInput): MonthComputeResult {
  const teachers = input.teachers.map((t) =>
    computeTeacherMonth(t, input.lessons, input.previousGrossByTeacherId?.[t.teacherId])
  )
  const hardBlockAnomalies = teachers
    .filter((t) => t.hardBlock)
    .flatMap((t) => t.anomalies.map((a) => `${t.teacherName}：${a}`))

  return {
    monthKey: input.monthKey,
    teachers,
    hardBlockAnomalies,
  }
}

export type { PayrollRateRow }
