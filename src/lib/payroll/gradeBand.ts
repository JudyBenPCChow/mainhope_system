import type { GradeBand, PrivateSlotKind } from "@/lib/payroll/types"
import { resolveClassGradeLabels } from "@/lib/classGrade"
import { resolveClassKind } from "@/lib/privateClassKind"

const JUNIOR = new Set(["中一", "中二", "中三"])
const SENIOR = new Set(["中四", "中五", "中六"])
const PRIMARY = new Set(["小一", "小二", "小三", "小四", "小五", "小六"])

/** 初中／高中按班別年級，不按學生年級 */
export function gradeBandFromLabels(labels: string[]): GradeBand {
  const set = new Set(labels)
  const hasJunior = [...set].some((g) => JUNIOR.has(g))
  const hasSenior = [...set].some((g) => SENIOR.has(g))
  const hasPrimary = [...set].some((g) => PRIMARY.has(g))
  if (hasSenior) return "senior"
  if (hasJunior) return "junior"
  if (hasPrimary) return "primary"
  return "unknown"
}

export function resolvePayrollGradeBand(
  grade: string[] | null | undefined,
  gradeCode: string | null | undefined
): { labels: string[]; band: GradeBand } {
  const labels = resolveClassGradeLabels(grade, gradeCode)
  return { labels, band: gradeBandFromLabels(labels) }
}

export function resolvePrivateSlotKind(
  classKind: string | null | undefined,
  subject: string | null | undefined
): PrivateSlotKind {
  const kind = resolveClassKind(classKind, subject)
  if (kind !== "private") return "group"
  const s = String(subject ?? "")
  if (/一對二/.test(s)) return "one_to_two"
  if (/一對一|單對單/.test(s)) return "one_to_one"
  // private 但未標名額 → 當一對一
  return "one_to_one"
}

export function isScheduleCancelled(status: string | null | undefined): boolean {
  return String(status ?? "").includes("取消")
}

export function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}
