import type { ConfirmResult } from "@/lib/appConfirm"
import {
 formatAttendanceHitsDescription,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import { previewScheduleCancelImpact } from "@/services/classQueries"

type ConfirmDialogFn = (options: {
 title: string
 description?: string
 confirmText?: string
 cancelText?: string
 alternateText?: string
 tone?: "default" | "warning" | "destructive"
}) => Promise<ConfirmResult>

/** O3：取消排程前 Confirm；回傳 null＝中止 */
export async function resolveScheduleCancelOptions(
 confirmDialog: ConfirmDialogFn,
 scheduleId: string
): Promise<{ cancelOpenTrials?: boolean; deleteAttendanceIds?: string[] } | null> {
 const impact = await previewScheduleCancelImpact(scheduleId)
 const parts: string[] = []
 if (impact.makeupLeaveIds.length > 0) {
  parts.push(`將有 ${impact.makeupLeaveIds.length} 筆調堂改回「待安排」。`)
 }
 if (impact.openTrialIds.length > 0) {
  parts.push(
   `尚有開著的試堂：${impact.openTrialLabels.join("、") || impact.openTrialIds.length + " 筆"}。`
  )
 }
 if (impact.attendanceHits.length > 0) {
  parts.push(formatAttendanceHitsDescription(impact.attendanceHits))
 }

 let cancelOpenTrials = false
 if (impact.openTrialIds.length > 0) {
  const trialChoice = await confirmDialog({
   title: "取消課堂：試堂",
   description: `${parts.filter((p) => p.includes("試堂")).join("\n")}\n\n是否一併將試堂改為「取消」？`,
   confirmText: "一併取消試堂",
   alternateText: "保留試堂狀態",
   cancelText: "中止取消課堂",
   tone: "warning",
  })
  if (trialChoice === false) return null
  cancelOpenTrials = trialChoice === true
 }

 let deleteAttendanceIds: string[] | undefined
 if (impact.attendanceHits.length > 0) {
  const attChoice = await confirmDialog({
   title: "取消課堂：出席紀錄",
   description: `${formatAttendanceHitsDescription(impact.attendanceHits)}\n\n一併刪除會影響已上堂數。`,
   confirmText: "一併刪除出席",
   alternateText: "保留出席",
   cancelText: "中止取消課堂",
   tone: "destructive",
  })
  if (attChoice === false) return null
  if (attChoice === true) {
   deleteAttendanceIds = impact.attendanceHits.map((h: AttendanceLifecycleHit) => h.id)
  }
 } else if (impact.makeupLeaveIds.length > 0 && impact.openTrialIds.length === 0) {
  const ok = await confirmDialog({
   title: "取消課堂",
   description: parts.join("\n") || "確定取消此課堂？",
   confirmText: "確認取消",
   tone: "warning",
  })
  if (!ok) return null
 }

 return { cancelOpenTrials, deleteAttendanceIds }
}
