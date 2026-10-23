import { leaveNeedsMakeupDate } from "@/services/leaveQueries"
import { gradeLabelFromCourseCode } from "@/lib/classGrade"
import { COURSE_CODE_REGEX } from "@/lib/courseCode"
import { paymentsReceiveHref } from "@/lib/paymentsReceiveHref"
import { parseMakeupOfScheduleId } from "@/lib/scheduleMakeupMarkers"
import type { TagTone } from "@/lib/tagTone"
import { trialReceiptGate } from "@/lib/trialReceiptGate"
import { addDaysYmd, weekdayLabelFromYmd } from "@/lib/weekdayUtils"

/** 學生請假：7 日內要有補堂日，或標不補回。選錄影不算完成。 */
export const STUDENT_LEAVE_MAKEUP_SLA_DAYS = 7
/** 導師請假取消堂：7 個工作日內要有補回排程。 */
export const TEACHER_CANCEL_MAKEUP_SLA_WORKING_DAYS = 7

/**
 * 前台工作日：星期一至六。星期日不計。
 * 校舍假期是不上課，不從工作日扣除。
 */
export function isFrontDeskWorkingDay(ymd: string): boolean {
 const label = weekdayLabelFromYmd(ymd)
 return label != null && label !== "星期日"
}

/** 下一個前台工作日（不含當日）。 */
export function nextFrontDeskWorkingDay(ymd: string): string {
 let cur = addDaysYmd(ymd, 1)
 while (!isFrontDeskWorkingDay(cur)) cur = addDaysYmd(cur, 1)
 return cur
}

/** start 之後、直到 today（含）的工作日數。同一天或更早為 0。 */
export function frontDeskWorkingDaysAfter(startYmd: string, todayYmd: string): number {
 if (todayYmd <= startYmd) return 0
 let count = 0
 let cur = addDaysYmd(startYmd, 1)
 while (cur <= todayYmd) {
  if (isFrontDeskWorkingDay(cur)) count += 1
  cur = addDaysYmd(cur, 1)
 }
 return count
}

export function isStudentLeaveMakeupOverdue(leaveDate: string, today: string): boolean {
 return today > addDaysYmd(leaveDate, STUDENT_LEAVE_MAKEUP_SLA_DAYS)
}

export function isTeacherCancelMakeupOverdue(cancelDate: string, today: string): boolean {
 return (
  frontDeskWorkingDaysAfter(cancelDate, today) > TEACHER_CANCEL_MAKEUP_SLA_WORKING_DAYS
 )
}

export function isTeacherAbsenceReason(reason: string | null | undefined): boolean {
 const text = String(reason ?? "")
 if (text.startsWith("校舍假期")) return false
 return text.includes("老師") || text.includes("導師")
}

export type StudentLeaveReminderRow = {
 leaveDate: string
 leaveReason: string | null
 makeupType: string | null
 makeupDate: string | null
 makeupScheduleId: string | null
 status: string | null
 classKind: string | null
}

export function isOverdueStudentLeaveMakeup(row: StudentLeaveReminderRow, today: string): boolean {
 if (row.classKind === "homework") return false
 if (isTeacherAbsenceReason(row.leaveReason)) return false
 if (!isStudentLeaveMakeupOverdue(row.leaveDate, today)) return false
 return leaveNeedsMakeupDate({
  makeupType: row.makeupType,
  makeupDate: row.makeupDate,
  makeupScheduleId: row.makeupScheduleId,
  status: row.status,
 })
}

export type TeacherCancelReminderRow = {
 id: string
 scheduledDate: string
 cancelReason: string | null
 classKind: string | null
}

export type MakeupRemarkRow = {
 remarks: string | null
 status: string | null
}

export function coveredCancelledScheduleIds(makeups: MakeupRemarkRow[]): Set<string> {
 const ids = new Set<string>()
 for (const row of makeups) {
  if (String(row.status ?? "").includes("取消")) continue
  const id = parseMakeupOfScheduleId(row.remarks)
  if (id) ids.add(id)
 }
 return ids
}

export function isOverdueTeacherCancelWithoutMakeup(
 row: TeacherCancelReminderRow,
 coveredIds: Set<string>,
 today: string
): boolean {
 if (row.classKind === "homework") return false
 if (!isTeacherAbsenceReason(row.cancelReason)) return false
 if (coveredIds.has(row.id.toLowerCase())) return false
 return isTeacherCancelMakeupOverdue(row.scheduledDate, today)
}

export type AdminSlaReminderKind = "leave" | "cancel" | "trial"

export const ADMIN_SLA_REMINDER_KINDS: AdminSlaReminderKind[] = ["leave", "cancel", "trial"]

export const ADMIN_SLA_REMINDER_KIND_LABEL: Record<AdminSlaReminderKind, string> = {
 leave: "請假",
 cancel: "補回",
 trial: "收款",
}

/** 提醒短標：請假橙、補回藍、收款紅。 */
export const ADMIN_SLA_REMINDER_KIND_TONE: Record<AdminSlaReminderKind, TagTone> = {
 leave: "warning",
 cancel: "info",
 trial: "error",
}

export type AdminSlaReminderItem = {
 id: string
 kind: AdminSlaReminderKind
 href: string
 text: string
 sortDate: string
}

/** 按日期由新到舊（最新在上）；同一天試堂收款在前。 */
export function compareAdminSlaReminders(a: AdminSlaReminderItem, b: AdminSlaReminderItem): number {
 if (a.sortDate !== b.sortDate) return a.sortDate > b.sortDate ? -1 : 1
 const rank = (kind: AdminSlaReminderKind) => (kind === "trial" ? 0 : 1)
 const byKind = rank(a.kind) - rank(b.kind)
 if (byKind !== 0) return byKind
 return a.text < b.text ? -1 : a.text > b.text ? 1 : 0
}

/** 三類都失敗才當整段載入失敗；否則點名缺了哪一類。 */
export function formatAdminSlaReminderFailure(failedKinds: readonly AdminSlaReminderKind[]): string | null {
 if (failedKinds.length === 0) return null
 const unique = ADMIN_SLA_REMINDER_KINDS.filter((kind) => failedKinds.includes(kind))
 if (unique.length >= ADMIN_SLA_REMINDER_KINDS.length) return "提醒未能載入。"
 const names = unique.map((kind) => ADMIN_SLA_REMINDER_KIND_LABEL[kind]).join("、")
 return `有部分提醒未能載入（缺${names}）。`
}

/** 與試堂頁「前往收款」相同：帶學生、班別與試堂價到收款登記。 */
export function trialUnpaidCollectHref(input: {
 studentId: string | null
 classId: string | null
 trialType: string | null
}): string {
 if (!input.studentId) return "/TrialSessions"
 return paymentsReceiveHref({
  studentId: input.studentId,
  trials: [{ classId: input.classId ?? "", trialType: input.trialType }],
 })
}

/** 打開該班排程，並進入這一堂的「安排補堂」。 */
export function teacherCancelMakeupHref(input: {
 classId: string | null
 scheduleId: string
 scheduledDate: string
}): string {
 if (!input.classId || !input.scheduleId) {
  return `/Schedule?view=day&date=${input.scheduledDate}`
 }
 const q = new URLSearchParams({
  tab: "schedule",
  makeup: input.scheduleId,
 })
 return `/Classes/${input.classId}?${q.toString()}`
}

export function reminderMonthDay(ymd: string): string {
 const [, month, day] = ymd.split("-").map(Number)
 if (!month || !day) return ymd
 return `${month}/${day}`
}

/** 班別顯示碼的年級，例如 2627-MATHS4001-A → 中四。 */
export function gradeLabelFromClassCourseCode(code: string | null | undefined): string | null {
 const match = (code ?? "").trim().match(COURSE_CODE_REGEX)
 if (!match?.[3]) return null
 return gradeLabelFromCourseCode(match[3])
}

export function reminderClassPhrase(grade: string | null, subject: string | null): string {
 const g = (grade ?? "").trim()
 const s = (subject ?? "").trim()
 if (!g) return s
 if (s.startsWith(g)) return s
 return `${g}${s}`
}

export function formatStudentLeaveReminderText(input: {
 teacherName: string | null
 gradeLabel: string | null
 subject: string | null
 studentName: string | null
 leaveDate: string
}): string {
 const who = [input.teacherName?.trim(), reminderClassPhrase(input.gradeLabel, input.subject)]
  .filter(Boolean)
  .join(" ")
 const student = input.studentName?.trim() || "學生"
 const date = reminderMonthDay(input.leaveDate)
 const head = who ? `${who} · ${student}` : student
 return `${head} ${date} 請假，尚未安排補堂`
}

export function formatTeacherCancelReminderText(input: {
 teacherName: string | null
 gradeLabel: string | null
 subject: string | null
 scheduledDate: string
}): string {
 const who = [input.teacherName?.trim(), reminderClassPhrase(input.gradeLabel, input.subject)]
  .filter(Boolean)
  .join(" ")
 const date = reminderMonthDay(input.scheduledDate)
 const head = who || "課堂"
 return `${head} ${date} 因老師請假取消，尚未安排補回`
}

export function formatTrialUnpaidReminderText(input: {
 studentName: string | null
 gradeLabel: string | null
 subject: string | null
 trialDate: string
}): string {
 const student = input.studentName?.trim() || "學生"
 const phrase = reminderClassPhrase(input.gradeLabel, input.subject)
 const date = reminderMonthDay(input.trialDate)
 const klass = phrase ? `${phrase}試堂 ` : "試堂 "
 return `${student} ${klass}${date} 仍未收款`
}

export type TrialUnpaidReminderRow = {
 trialDate: string
 status: string | null
 paymentId: string | null
 paymentStatus: string | null
}

/** 今日要追的試堂：試堂日是今日，或下一個工作日（含兩者之間的星期日）。 */
export function isTrialUnpaidOnChaseWindow(row: TrialUnpaidReminderRow, today: string): boolean {
 const status = String(row.status ?? "")
 if (status.includes("取消") || status.includes("已完成")) return false
 if (trialReceiptGate({ paymentId: row.paymentId, paymentStatus: row.paymentStatus }) === "received") {
  return false
 }
 const chaseThrough = nextFrontDeskWorkingDay(today)
 return row.trialDate >= today && row.trialDate <= chaseThrough
}
