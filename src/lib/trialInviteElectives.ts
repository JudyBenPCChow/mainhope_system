import type { TrialInviteClassOption, TrialInviteElectiveOption } from "@/services/trialInviteQueries"

function electiveSortLabel(opt: TrialInviteElectiveOption): string {
  return (opt.short_name || opt.name_zh || opt.code).trim()
}

function offeredElectiveCodes(classes: TrialInviteClassOption[]): Set<string> {
  const codes = new Set<string>()
  for (const cls of classes) {
    if (cls.class_kind !== "group") continue
    const code = cls.subject_code.trim().toUpperCase()
    if (code) codes.add(code)
  }
  return codes
}

function electiveIsOffered(
  opt: TrialInviteElectiveOption,
  offeredCodes: Set<string>,
  useOfferedFlag: boolean
): boolean {
  if (useOfferedFlag) return opt.offered === true
  return offeredCodes.has(opt.code.trim().toUpperCase())
}

/** 本社目前有對應專科班的選修在前；其餘在後。同組內按名稱排序。 */
export function partitionTrialInviteElectives(
  options: TrialInviteElectiveOption[],
  classes: TrialInviteClassOption[]
): { offered: TrialInviteElectiveOption[]; other: TrialInviteElectiveOption[] } {
  const offeredCodes = offeredElectiveCodes(classes)
  const useOfferedFlag = options.some((o) => typeof o.offered === "boolean")
  const offered: TrialInviteElectiveOption[] = []
  const other: TrialInviteElectiveOption[] = []
  for (const opt of options) {
    if (electiveIsOffered(opt, offeredCodes, useOfferedFlag)) offered.push(opt)
    else other.push(opt)
  }
  const byName = (a: TrialInviteElectiveOption, b: TrialInviteElectiveOption) =>
    electiveSortLabel(a).localeCompare(electiveSortLabel(b), "zh-Hant")
  offered.sort(byName)
  other.sort(byName)
  return { offered, other }
}
