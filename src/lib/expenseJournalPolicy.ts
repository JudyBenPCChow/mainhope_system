/** 日記帳科目分層：前台日常 vs 管理層結構成本。唔含 React／DB。 */

export type ExpenseAccountVisibility = "front_desk" | "manager"

export const PAYROLL_POSTED_ACCOUNT_CODES = ["labor_tutor", "labor_employer_mpf"] as const

export const FRONT_DESK_ACCOUNT_CODES = [
  "materials",
  "supplies",
  "team_welfare",
  "marketing",
] as const

export function isExpenseAccountVisibility(
  value: string
): value is ExpenseAccountVisibility {
  return value === "front_desk" || value === "manager"
}

export function isPayrollPostedAccountCode(code: string): boolean {
  return (PAYROLL_POSTED_ACCOUNT_CODES as readonly string[]).includes(code)
}

export function isManualSelectableAccount(input: {
  code: string
  visibility: ExpenseAccountVisibility
  canReadFullLedger: boolean
}): boolean {
  if (isPayrollPostedAccountCode(input.code)) return false
  if (input.canReadFullLedger) return true
  return input.visibility === "front_desk"
}

/** 已選科目：例外規則（按金／退款／薪金）先 pending，其餘即確認。 */
export function resolveManualLedgerStatus(forcePending: boolean): "pending_review" | "confirmed" {
  return forcePending ? "pending_review" : "confirmed"
}

export function frontDeskBlockedMessage(hint: string | null): string {
  const t = hint?.trim()
  return t || "此類開支請由管理層入帳"
}
