import {
  billedHomeworkHours,
  christineHomeworkCommission,
  homeworkHourlyPay,
  isHomeworkHourlyExempt,
} from "@/lib/payroll/homeworkHours"
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

function applyHomeworkPay(teacher: PayrollTeacherInput, lines: ComputedTeacherResult["lines"], anomalies: string[]) {
  const rosterHours = teacher.homeworkRosterHours ?? 0
  const billedHours = billedHomeworkHours(rosterHours, teacher.homeworkOverrideHours)
  const rate = teacher.homeworkHourlyRate
  if (rate != null && rate > 0) {
    const amount = homeworkHourlyPay(billedHours, rate)
    if (amount > 0) {
      const overridden = teacher.homeworkOverrideHours != null
      lines.push({
        label: overridden
          ? `功輔時薪 ${billedHours} 小時 × $${rate}（已修正；編更 ${rosterHours} 小時）`
          : `功輔時薪 ${billedHours} 小時 × $${rate}`,
        amount,
        kind: "homework_hourly",
      })
    }
    return {
      rosterHours,
      billedHours,
      rate,
      overridden: teacher.homeworkOverrideHours != null,
      amount,
    }
  }
  if (rosterHours > 0 && !isHomeworkHourlyExempt(teacher.teacherName)) {
    anomalies.push("功輔當值但未設定時薪")
  }
  return undefined
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
    const lines: ComputedTeacherResult["lines"] = []
    const homework = applyHomeworkPay(teacher, lines, anomalies)
    if (!homework || homework.amount <= 0) {
      anomalies.push("缺有效費率")
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
        anomalies: [...new Set(anomalies)],
        hardBlock: true,
        homework,
      }
    }
    return {
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName,
      mode: "功輔時薪",
      missingRate: false,
      grossBeforeAdj: roundMoney(lines.reduce((s, l) => s + l.amount, 0)),
      lines,
      lessons: [],
      personalSplit: 0,
      commissionPool: 0,
      commissionPoolItems: [],
      anomalies: [...new Set(anomalies)],
      hardBlock: false,
      homework,
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

  const homework = applyHomeworkPay(teacher, lines, anomalies)

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
    homework,
  }
}

export function computePayrollMonth(input: MonthComputeInput): MonthComputeResult {
  const teachers = input.teachers.map((t) =>
    computeTeacherMonth(t, input.lessons, input.previousGrossByTeacherId?.[t.teacherId])
  )

  const comm = input.homeworkCommission
  if (comm && comm.teacherId) {
    const target = teachers.find((t) => t.teacherId === comm.teacherId)
    if (target) {
      const calc = christineHomeworkCommission({
        enrolledCount: comm.enrolledCount,
        originalPriceTotal: comm.originalPriceTotal,
      })
      target.homeworkCommission = {
        enrolledCount: calc.enrolledCount,
        originalPriceTotal: calc.originalPriceTotal,
        amount: calc.amount,
      }
      if (calc.amount > 0) {
        target.lines.push({
          label: `功輔佣金（報讀 ${calc.enrolledCount} 人，原價 × 10%）`,
          amount: calc.amount,
          kind: "homework_commission",
        })
        target.grossBeforeAdj = roundMoney(target.grossBeforeAdj + calc.amount)
      }
    }
  }

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
