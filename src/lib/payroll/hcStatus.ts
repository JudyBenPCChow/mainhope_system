import type { StudentHcStatus } from "@/lib/payroll/viewTypes"

/**
 * 點名狀態 → 計糧審計桶。
 * 舊資料：「出席」＝實際到課；裸「請假」＝不扣堂請假（與扣堂白名單一致）。
 */
export function attendanceStatusToHc(status: string): StudentHcStatus {
  const s = String(status ?? "").trim()
  if (s.includes("錄影")) return "recording"
  if (/zoom|網課|線上|直播/i.test(s)) return "zoom"
  if (/no\s*show/i.test(s)) return "no_show"
  if (s === "病假" || s.includes("病假")) return "sick"
  if (s.includes("請假而不需補回") || s.includes("不用補回")) return "leave_billable"
  if (s === "事假" || s.includes("事假")) return "personal"
  if (s === "請假" || (s.includes("請假") && !s.includes("不需補回"))) return "personal"
  if (s.includes("缺席")) return "personal"
  return "in_person"
}

export function isActualPresentHc(status: StudentHcStatus): boolean {
  return (
    status === "in_person" ||
    status === "zoom" ||
    status === "recording" ||
    status === "leave_billable"
  )
}

export function isNonBillableLeaveHc(status: StudentHcStatus): boolean {
  return status === "sick" || status === "personal"
}
