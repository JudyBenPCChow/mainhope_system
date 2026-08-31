import type { ConfirmOptions, ConfirmResult } from "@/lib/appConfirm"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"

/** 有未清事項時須輸入此字以強制畢業（非硬擋）。 */
export const FORCE_GRADUATE_CONFIRM_TEXT = "強制畢業"

export type GraduationBlockers = {
 pendingPaymentCount: number
 openPendingLessonCount: number
 leaveAwaitingMakeupCount: number
 activeEnrollmentCount: number
}

export function emptyGraduationBlockers(): GraduationBlockers {
 return {
  pendingPaymentCount: 0,
  openPendingLessonCount: 0,
  leaveAwaitingMakeupCount: 0,
  activeEnrollmentCount: 0,
 }
}

export function isOpenPendingLessonForGraduation(status: string): boolean {
 const s = status.trim()
 return s === "待補" || s === "已安排"
}

export function graduationHasWarnings(b: GraduationBlockers): boolean {
 return (
  b.pendingPaymentCount > 0 ||
  b.openPendingLessonCount > 0 ||
  b.leaveAwaitingMakeupCount > 0 ||
  b.activeEnrollmentCount > 0
 )
}

export function formatGraduationWarningItems(b: GraduationBlockers): string[] {
 const items: string[] = []
 if (b.pendingPaymentCount > 0) items.push(`待繳費／待收款 ${b.pendingPaymentCount} 筆`)
 if (b.openPendingLessonCount > 0) items.push(`待補堂 ${b.openPendingLessonCount} 筆`)
 if (b.leaveAwaitingMakeupCount > 0) items.push(`未處理請假 ${b.leaveAwaitingMakeupCount} 筆`)
 if (b.activeEnrollmentCount > 0) items.push(`就讀中報讀 ${b.activeEnrollmentCount} 個`)
 return items
}

export function formatGraduationConfirmDescription(studentName: string, b: GraduationBlockers): string {
 const hide = `標為已畢業後，「${studentName}」會從日常名單隱藏（資料仍在，詳細頁與單據仍可查）。`
 if (!graduationHasWarnings(b)) return hide
 return `${hide}目前仍有：${formatGraduationWarningItems(b).join("；")}。可強制畢業，但須輸入「${FORCE_GRADUATE_CONFIRM_TEXT}」。`
}

type ConfirmFn = (options: ConfirmOptions) => Promise<ConfirmResult>

/**
 * 標已畢業前確認。有未清繳費／待補／請假／就讀中報讀時為警告＋二次確認，非硬擋。
 * @returns true＝可繼續
 */
export async function confirmGraduateStudent(
 confirmDialog: ConfirmFn,
 opts: {
  studentName: string
  blockers: GraduationBlockers
 }
): Promise<boolean> {
 const hasWarn = graduationHasWarnings(opts.blockers)
 const result = await confirmDialog({
  title: hasWarn ? "仍有未清事項" : "標為已畢業",
  description: formatGraduationConfirmDescription(opts.studentName, opts.blockers),
  confirmText: hasWarn ? "強制畢業" : "確認已畢業",
  cancelText: "取消",
  tone: hasWarn ? "destructive" : "warning",
  confirmInput: hasWarn
   ? {
      label: `請輸入「${FORCE_GRADUATE_CONFIRM_TEXT}」以確認`,
      expected: FORCE_GRADUATE_CONFIRM_TEXT,
      placeholder: FORCE_GRADUATE_CONFIRM_TEXT,
     }
   : undefined,
 })
 if (result !== true) return false
 return true
}

/** 儲存成功後先寫稽核（確認當下寫會變成假紀錄）。 */
export function logGraduateStudentChange(opts: {
 forced: boolean
 studentId: string
 studentName: string
 blockers: GraduationBlockers
 source: string
}): void {
 void logMgmtAuditAction({
  action: opts.forced ? "student_force_graduate" : "student_mark_graduated",
  detail: JSON.stringify({
   studentId: opts.studentId,
   studentName: opts.studentName,
   blockers: opts.blockers,
   source: opts.source,
  }),
 })
}

/** 新增學生時直接標已畢業（尚無欠費可查）。 */
export async function confirmCreateGraduatedStudent(
 confirmDialog: ConfirmFn,
 opts: { studentName: string }
): Promise<boolean> {
 const result = await confirmDialog({
  title: "新增為已畢業",
  description: `「${opts.studentName}」將標為已畢業，不會出現在日常名單（資料仍在）。確定？`,
  confirmText: "確認已畢業",
  cancelText: "取消",
  tone: "warning",
 })
 if (result !== true) return false
 return true
}

export function logCreateGraduatedStudent(opts: { studentName: string; source: string }): void {
 void logMgmtAuditAction({
  action: "student_create_graduated",
  detail: JSON.stringify({ studentName: opts.studentName, source: opts.source }),
 })
}

/** 改回中學階段＝undo，重新進入日常名單。 */
export async function confirmUngraduateStudent(
 confirmDialog: ConfirmFn,
 opts: { studentName: string }
): Promise<boolean> {
 const result = await confirmDialog({
  title: "改回中學階段",
  description: `「${opts.studentName}」將重新出現在日常名單。確定改回中學階段？`,
  confirmText: "改回中學階段",
  cancelText: "取消",
  tone: "warning",
 })
 if (result !== true) return false
 return true
}

export function logUngraduateStudentChange(opts: {
 studentId: string
 studentName: string
 source: string
}): void {
 void logMgmtAuditAction({
  action: "student_unmark_graduated",
  detail: JSON.stringify({
   studentId: opts.studentId,
   studentName: opts.studentName,
   source: opts.source,
  }),
 })
}
