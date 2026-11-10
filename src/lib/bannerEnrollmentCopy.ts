/** 報讀／試堂成功橫旗的共用字句。標題要能單獨看懂。 */

export const ENROLLMENT_PAY_MESSAGE =
 "請到收款登記確認學費。確認收款後，已繳堂數才會增加。"

export const HOMEWORK_PAY_MESSAGE = "請到收款登記進行收款。"

export const TRIAL_PAY_MESSAGE =
 "請繼續收款出單並確認；確認後先上點名紙（含 $0 免費試堂）。"

export function enrollmentLeavePayMessage(leaveCount: number): string {
 return `已同步建立 ${leaveCount} 堂請假；${ENROLLMENT_PAY_MESSAGE}`
}

export function privateMoreClassMessage(mode: "一對一" | "一對二"): string {
 return `如學生同時報讀其他科目／老師${mode}課程，請繼續新增班別。`
}

export function homeworkDaysLabel(plan: "三日" | "四日" | "五日"): string {
 if (plan === "三日") return "三天"
 if (plan === "四日") return "四天"
 return "五天"
}

export function enrollmentAddedTitle(input: {
 studentName: string
 classLabel: string
 whenLabel?: string | null
 homework?: boolean
}): string {
 const name = input.studentName.trim() || "學生"
 const klass = input.classLabel.trim()
 const when = (input.whenLabel ?? "").trim()
 if (input.homework) {
  return `【已增加報讀】${name} ${klass}${when ? ` ${when}` : ""}`
 }
 const rest = [klass, when].filter(Boolean).join("  ")
 return rest ? `【已增加報讀】${name}  ${rest}` : `【已增加報讀】${name}`
}

/** 下拉標籤「課程名（代碼）」取出課程名。 */
export function classNameFromPickLabel(label: string): string {
 const head = label.split("·")[0]?.replace(/（[^）]*）/g, "").trim() ?? ""
 return head || label.trim()
}

export function formatDayMonth(ymd: string): string {
 const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim())
 if (!match) return ymd.trim()
 return `${Number(match[3])}/${Number(match[2])}`
}

export function formatClockRange(start?: string | null, end?: string | null): string {
 const from = (start ?? "").slice(0, 5)
 const to = (end ?? "").slice(0, 5)
 if (from && to) return `${from}-${to}`
 return from || to
}

export function timeFromDatedLabel(dateYmd: string, label: string): string {
 return label.replace(dateYmd, "").trim().replace(/[–—]/g, "-")
}

export function trialRegisteredTitle(input: {
 studentName: string
 dateYmd: string
 classLabel: string
 timeLabel: string
 approved?: boolean
}): string {
 const head = input.approved ? "【已核准試堂登記】" : "【試堂登記成功】"
 const name = input.studentName.trim() || "學生"
 const bits = [formatDayMonth(input.dateYmd), input.classLabel.trim(), input.timeLabel.trim()].filter(Boolean)
 return `${head}${name}  已登記 ${bits.join(" ")} 試堂`
}

export function trialRegisteredCountTitle(studentName: string, count: number): string {
 const name = studentName.trim() || "學生"
 return `【已核准試堂登記】${name}  已登記 ${count} 筆試堂`
}
