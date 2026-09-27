/** 試堂列表「收款／上紙」：確認收款後才上點名紙。 */

export type TrialReceiptGate = "unissued" | "pending" | "received"

export const TRIAL_RECEIPT_GATE_LABEL: Record<TrialReceiptGate, string> = {
  unissued: "未出單",
  pending: "待收款",
  received: "已收款可上紙",
}

export function trialReceiptGate(input: {
  paymentId: string | null
  paymentStatus: string | null
}): TrialReceiptGate {
  if (!input.paymentId) return "unissued"
  if (String(input.paymentStatus ?? "").includes("已收款")) return "received"
  return "pending"
}

export function matchesReceiptTab(
  gate: TrialReceiptGate,
  tab: "all" | "unpaid" | TrialReceiptGate
): boolean {
  if (tab === "all") return true
  if (tab === "unpaid") return gate !== "received"
  return gate === tab
}

export function trialAddPrefill(search: URLSearchParams): {
  studentId: string
  classId: string
  scheduleId: string
  hint: string | null
} {
  const studentId = search.get("studentId")?.trim() ?? ""
  const classId = search.get("classId")?.trim() ?? ""
  const scheduleId = search.get("scheduleId")?.trim() ?? ""
  const hint = search.get("intentExpired") === "1"
    ? "原先想試的堂次已不能用，請改選班別與堂次。"
    : classId
      ? "已帶入想試的班別與堂次，可再修改。"
      : null
  return { studentId, classId, scheduleId, hint }
}

/** 預填堂次仍在可選列表就保留；否則改最近一堂。 */
export function nextScheduleSelection(prev: string, optionIds: string[]): {
  id: string
  replaced: boolean
} {
  if (prev && optionIds.includes(prev)) return { id: prev, replaced: false }
  return { id: optionIds[0] ?? "", replaced: Boolean(prev) }
}

export function trialMatchesPersonQuery(
  row: {
    student_name: string | null
    student_whatsapp: string | null
    student_phone: string | null
    parent_phone: string | null
  },
  rawQuery: string
): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true
  if ((row.student_name ?? "").toLowerCase().includes(query)) return true
  const digits = query.replace(/\D/g, "")
  if (digits.length < 3) return false
  const phones = [row.student_whatsapp, row.student_phone, row.parent_phone].map((value) =>
    (value ?? "").replace(/\D/g, "")
  )
  return phones.some((phone) => phone.includes(digits))
}
