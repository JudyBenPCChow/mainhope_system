/** MPF：只認名單內教師；法定上下限 */

export const MPF_TEACHER_NAME_MATCHERS = [
  "Mark Yu",
  "Christine Fan",
  "Sophie Yu",
  "Katie Lee",
] as const

export function teacherNeedsMpf(opts: {
  teacherName: string
  rateMpfFlag?: boolean
}): boolean {
  if (opts.rateMpfFlag === true) return true
  if (opts.rateMpfFlag === false) return false
  return (MPF_TEACHER_NAME_MATCHERS as readonly string[]).includes(opts.teacherName)
}

/** 僱員強制性供款 */
export function mpfEmployeeContribution(relevantIncome: number): number {
  const g = Number(relevantIncome) || 0
  if (g < 7100) return 0
  if (g > 30000) return 1500
  return Math.round(g * 0.05 * 100) / 100
}

/** 僱主強制性供款（低於 $7,100 仍須 5%） */
export function mpfEmployerContribution(relevantIncome: number): number {
  const g = Number(relevantIncome) || 0
  if (g <= 0) return 0
  if (g > 30000) return 1500
  return Math.round(g * 0.05 * 100) / 100
}

export function withMpf(gross: number): {
  gross: number
  employeeMpf: number
  employerMpf: number
  net: number
} {
  const employeeMpf = mpfEmployeeContribution(gross)
  const employerMpf = mpfEmployerContribution(gross)
  return {
    gross: Math.round(gross * 100) / 100,
    employeeMpf,
    employerMpf,
    net: Math.round((gross - employeeMpf) * 100) / 100,
  }
}
