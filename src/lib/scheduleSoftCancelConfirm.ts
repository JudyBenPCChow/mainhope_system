import type { ConfirmResult } from "@/lib/appConfirm"
import { hitsHaveBillable } from "@/services/attendanceLifecycleQueries"
import {
 formatSoftCancelImpactSummary,
 previewSoftCancelScheduleImpact,
 type SoftCancelScheduleOptions,
} from "@/services/scheduleLifecycleQueries"

type ConfirmFn = (opts: {
 title: string
 description: string
 confirmText?: string
 cancelText?: string
 alternateText?: string
 tone?: "default" | "warning" | "destructive"
 alternateTone?: "default" | "warning" | "destructive"
 confirmInput?: { label: string; expected: string; placeholder?: string }
}) => Promise<ConfirmResult>

/**
 * O3 UI：取消排程前預覽；預設保留出席、强制取消未結案試堂。
 * 回傳 abort 或傳入 updateSchedule 嘅 options。
 */
export async function resolveSoftCancelScheduleOptions(
 confirmDialog: ConfirmFn,
 scheduleIds: string[]
): Promise<SoftCancelScheduleOptions | "abort"> {
 const impact = await previewSoftCancelScheduleImpact(scheduleIds)
 const hasImpact =
  impact.makeupLeaves.length > 0 ||
  impact.openTrials.length > 0 ||
  impact.attendanceHits.length > 0

 if (!hasImpact) {
  return { cancelOpenTrials: true, attendanceAction: "keep" }
 }

 const summary = formatSoftCancelImpactSummary(impact)
 const billable = hitsHaveBillable(impact.attendanceHits)

 if (impact.attendanceHits.length === 0) {
  const ok = await confirmDialog({
   title: "取消排程",
   description: `${summary}\n\n確定取消此排程？`,
   confirmText: impact.openTrials.length > 0 ? "取消排程並取消試堂" : "確認取消排程",
   cancelText: "返回",
   tone: "destructive",
  })
  return ok === true
   ? { cancelOpenTrials: true, attendanceAction: "keep" }
   : "abort"
 }

 // 有出席：預設保留（與退讀一致）；alternate＝刪
 const result = await confirmDialog({
  title: "取消排程（此堂已有出席）",
  description: `${summary}\n\n預設保留出席（已上堂數不變）。若堂從未上過，可改選一併刪除。`,
  confirmText: "保留出席並取消排程",
  alternateText: billable ? "⚠️ 一併刪除計費出席" : "一併刪除出席",
  cancelText: "返回",
  tone: "warning",
  alternateTone: "destructive",
 })
 if (result === true) {
  return { cancelOpenTrials: true, attendanceAction: "keep" }
 }
 if (result === "alternate") {
  const surname =
   impact.attendanceHits.find((h) => h.studentName)?.studentName?.trim().slice(0, 1) ?? ""
  const second = await confirmDialog({
   title: "確認刪除出席？",
   description: "將刪除此堂出席列並減少已上堂數（若為計費狀態）。確定？",
   confirmText: billable ? "⚠️ 確認刪除計費出席" : "確認刪除出席",
   cancelText: "返回",
   tone: "destructive",
   ...(billable && surname
    ? {
       confirmInput: {
        label: `請輸入任一學生姓氏「${surname}」以確認`,
        expected: surname,
        placeholder: surname,
       },
      }
    : {}),
  })
  if (second !== true) return "abort"
  return {
   cancelOpenTrials: true,
   attendanceAction: "delete",
   deleteAttendanceIds: impact.attendanceHits.map((h) => h.id),
  }
 }
 return "abort"
}
