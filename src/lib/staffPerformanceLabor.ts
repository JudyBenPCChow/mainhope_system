/**
 * 員工績效人工：已結算計糧 snapshot → 每位老師僱主總負擔。
 * 口徑與結算過帳一致：gross + employerMpf；已排除老師計 0。
 */

import { employerLaborCost } from "@/lib/payroll/laborEstimate"

export type SettledLaborIndex = {
  settledMonths: Set<string>
  /** monthKey → teacherId → cost */
  costByMonthTeacher: Map<string, Map<string, number>>
  /** monthKey → teacherId → snapshot 顯示名（補入無收入老師） */
  namesByMonthTeacher: Map<string, Map<string, string>>
}

export function emptySettledLaborIndex(): SettledLaborIndex {
  return {
    settledMonths: new Set(),
    costByMonthTeacher: new Map(),
    namesByMonthTeacher: new Map(),
  }
}

export function buildMonthTeacherLaborCosts(args: {
  teachers: Array<{ id: string; name?: string; gross: number | null; employerMpf?: number }>
  excludedTeacherIds: Set<string>
}): { costs: Map<string, number>; names: Map<string, string> } {
  const costs = new Map<string, number>()
  const names = new Map<string, string>()
  for (const t of args.teachers) {
    const id = String(t.id ?? "").trim()
    if (!id) continue
    if (typeof t.name === "string" && t.name.trim()) names.set(id, t.name.trim())
    if (args.excludedTeacherIds.has(id)) {
      costs.set(id, 0)
      continue
    }
    costs.set(id, employerLaborCost(t))
  }
  return { costs, names }
}

export function laborForSettledMonth(
  index: SettledLaborIndex,
  monthKey: string,
  teacherId: string
): { cost: number; missing: boolean } {
  if (!index.settledMonths.has(monthKey)) return { cost: 0, missing: true }
  const map = index.costByMonthTeacher.get(monthKey)
  if (!map || !map.has(teacherId)) return { cost: 0, missing: true }
  return { cost: map.get(teacherId) ?? 0, missing: false }
}

export function laborForSettledPeriod(
  index: SettledLaborIndex,
  monthKeys: string[],
  teacherId: string
): { cost: number | null; missing: boolean } {
  let total = 0
  let any = false
  let allMissing = true
  for (const mk of monthKeys) {
    const { cost, missing } = laborForSettledMonth(index, mk, teacherId)
    if (!missing) {
      total += cost
      any = true
      allMissing = false
    }
  }
  if (allMissing) return { cost: null, missing: true }
  return { cost: any ? Math.round(total * 100) / 100 : null, missing: false }
}

export function describeSettledLaborSource(
  monthKeys: string[],
  settledMonths: Set<string>
): string {
  const settled = monthKeys.filter((mk) => settledMonths.has(mk))
  const unsettled = monthKeys.filter((mk) => !settledMonths.has(mk))
  if (settled.length === 0) {
    return "所選期間尚未有已結算計糧；毛利待結算後顯示"
  }
  if (unsettled.length === 0) {
    return "人工＝已結算計糧（gross＋僱主MPF）"
  }
  return `人工＝已結算計糧（${settled.join("、")}）；未結算：${unsettled.join("、")}`
}
