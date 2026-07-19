/** 日視圖卡片：細分狀態標籤（不含排程 status／加堂） */

export type DayViewTagInput = {
 rosterCount: number
 /** 上堂名單中，當日請假人數 */
 leaveAmongRosterCount: number
 hasTrial: boolean
 hasOnlineMakeup: boolean
 hasRecordMakeup: boolean
}

export function isOnlineLeaveMakeup(makeupType: string | null | undefined): boolean {
 const t = String(makeupType ?? "")
 return (
  t.includes("網課") ||
  t.includes("線上") ||
  t.includes("zoom") ||
  t.includes("Zoom") ||
  t.includes("即時直播") ||
  t.includes("錄影回放")
 )
}

export function isRecordLeaveMakeup(makeupType: string | null | undefined): boolean {
 return /錄影|錄像|錄音/.test(String(makeupType ?? ""))
}

/** 實際不用上堂（上堂名單空或全員請假）；有試堂生則仍需上堂，不標灰 */
export function isDayViewIdleCard(input: {
 rosterCount: number
 leaveAmongRosterCount: number
 hasTrial: boolean
}): boolean {
 if (input.hasTrial) return false
 if (input.rosterCount === 0) return true
 return input.leaveAmongRosterCount >= input.rosterCount
}

/**
 * 額外標籤順序：無人報讀｜所有學生請假｜請假生｜試堂生｜網課生｜要錄影
 * 「無人報讀」與「所有學生請假」互斥；全員請假時不重複掛「請假生」。
 */
export function buildDayViewExtraTags(input: DayViewTagInput): string[] {
 const tags: string[] = []
 const allLeave =
  input.rosterCount > 0 && input.leaveAmongRosterCount >= input.rosterCount

 if (input.rosterCount === 0) {
  tags.push("無人報讀")
 } else if (allLeave) {
  tags.push("所有學生請假")
 } else if (input.leaveAmongRosterCount > 0) {
  tags.push("請假生")
 }

 if (input.hasTrial) tags.push("試堂生")
 if (input.hasOnlineMakeup) tags.push("網課生")
 if (input.hasRecordMakeup) tags.push("要錄影")
 return tags
}
