/** HK 成本帳支付渠道（正規化枚舉＋繁中顯示） */

export const EXPENSE_PAY_METHODS = [
  "bank_card",
  "cashbox",
  "fps",
  "cheque",
  "staff_advance",
  "other",
] as const

export type ExpensePayMethod = (typeof EXPENSE_PAY_METHODS)[number]

export const EXPENSE_PAY_METHOD_LABEL: Record<ExpensePayMethod, string> = {
  bank_card: "公司卡／銀行轉帳",
  cashbox: "Cashbox／現金",
  fps: "轉數快",
  cheque: "支票",
  staff_advance: "職員墊支",
  other: "其他",
}

export function isExpensePayMethod(value: string): value is ExpensePayMethod {
  return (EXPENSE_PAY_METHODS as readonly string[]).includes(value)
}

export function expensePayMethodLabel(value: string): string {
  if (isExpensePayMethod(value)) return EXPENSE_PAY_METHOD_LABEL[value]
  return value || "—"
}
