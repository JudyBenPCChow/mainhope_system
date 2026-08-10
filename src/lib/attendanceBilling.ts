/**
 * 點名狀態與「已上堂數／扣堂」判定（嚴格白名單）。
 * 業務說明見 docs/ATTENDANCE_BILLING.md
 */

/** 點名可選狀態（新寫入） */
export const ATTENDANCE_STATUS_OPTIONS = [
 "現場",
 "錄影回放",
 "zoom實時網課",
 "no show",
 "請假而不需補回",
 "事假",
 "病假",
] as const

export type AttendanceStatusLabel = (typeof ATTENDANCE_STATUS_OPTIONS)[number]

export const BILLABLE_ATTENDANCE_OPTIONS = [
 "現場",
 "錄影回放",
 "zoom實時網課",
 "no show",
 "請假而不需補回",
] as const satisfies readonly AttendanceStatusLabel[]

export const NON_BILLABLE_ATTENDANCE_OPTIONS = ["事假", "病假"] as const satisfies readonly AttendanceStatusLabel[]

/** 桌面懸停說明（點名狀態按鈕） */
export const ATTENDANCE_STATUS_HELP: Record<AttendanceStatusLabel, string> = {
 現場: "學生實體到課，計入已上堂數（扣堂）。",
 錄影回放: "當日已交付錄影／回放連結即銷堂，不論學生何時觀看。",
 zoom實時網課: "經 Zoom 等同步上網課，計入已上堂數（扣堂）。",
 "no show": "突然缺席且沒有請假通知，仍扣堂。",
 請假而不需補回: "有請假且自願放棄已購堂（扣堂）。一般「唔嚟唔補」請用事假／病假（不扣堂）。",
 事假: "已請假（事假），不扣堂。",
 病假: "已請假（病假），不扣堂。",
}

/** 扣堂＝計入已上堂數（嚴格白名單；含舊資料相容） */
export const BILLABLE_ATTENDANCE_STATUSES = new Set<string>([
 "現場",
 "錄影回放",
 "zoom實時網課",
 "no show",
 "請假而不需補回",
 // 舊狀態相容（歷史列；新 UI 不再寫入）
 "即時直播",
 "不用補回",
 "出席",
 "網課",
 "補課",
 "線上",
])

export function isBillableAttendanceStatus(status: string | null | undefined): boolean {
 const s = String(status ?? "").trim()
 if (!s) return false
 if (BILLABLE_ATTENDANCE_STATUSES.has(s)) return true
 // 「請假而不需補回」已在白名單；其餘含「請假／缺席」者不計
 if (s.includes("缺席")) return false
 if (s.includes("請假") && s !== "請假而不需補回") return false
 if (s.includes("網課") || (s.includes("線上") && !s.includes("假"))) return true
 return false
}

/** 請假安排 → 點名預填 */
export function prefillStatusFromLeave(params: {
 leaveReason: string | null | undefined
 makeupType: string | null | undefined
}): AttendanceStatusLabel {
 const makeup = String(params.makeupType ?? "").trim()
 const reason = String(params.leaveReason ?? "").trim()
 // 「待安排」無補堂日：依請假理由預填事假／病假（與調堂相同）
 if (makeup.includes("錄影")) return "錄影回放"
 // G1：唔嚟唔補 → 預填不扣堂（事假）；「請假而不需補回」仍可人手選（放棄已購堂／扣堂）
 if (makeup.includes("不補回")) return "事假"
 if (reason.includes("病")) return "病假"
 if (reason.includes("事")) return "事假"
 return "事假"
}

export const ATTENDANCE_BILLING_HELP_SHORT =
 "扣堂：現場／錄影回放／zoom實時網課／no show／請假而不需補回。不扣堂：事假／病假。連堂＝2 堂。請假單只影響預填，點名須老師手動完成；未點名會提醒，不會自動銷堂。"
