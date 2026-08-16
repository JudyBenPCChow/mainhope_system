import type { ConfirmResult } from "@/lib/appConfirm"
import {
 formatAttendanceHitsDescription,
 hitsHaveBillable,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import type { EnrollmentAttendanceChangeOptions } from "@/services/studentQueries"

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
 * O4：退讀 — 有出席時預設保留；清手誤報讀 — 預設一併刪。
 */
export async function resolveEnrollmentAttendanceOptions(
 confirmDialog: ConfirmFn,
 hits: AttendanceLifecycleHit[],
 mode: "withdraw" | "purge",
 studentName: string
): Promise<EnrollmentAttendanceChangeOptions | "abort" | undefined> {
 if (hits.length === 0) return undefined
 const billable = hitsHaveBillable(hits)
 const surname = studentName.trim().slice(0, 1)
 const desc = formatAttendanceHitsDescription(hits)

 if (mode === "withdraw") {
  const result = await confirmDialog({
   title: "退讀：此生在本班已有出席",
   description: `${desc}\n\n退讀預設保留歷史出席（已扣堂數仍計）。僅在誤點名時才選刪除。`,
   confirmText: "保留出席並退讀",
   alternateText: billable ? "⚠️ 一併刪除計費出席" : "一併刪除出席",
   cancelText: "取消退讀",
   tone: "warning",
   alternateTone: "destructive",
  })
  if (result === true) return { attendanceAction: "keep" }
  if (result === "alternate") {
   const second = await confirmDialog({
    title: "確認刪除出席後退讀？",
    description: "將刪除本班出席列。確定？",
    confirmText: billable ? "⚠️ 確認刪除計費出席" : "確認刪除出席",
    cancelText: "返回",
    tone: "destructive",
    ...(billable && surname
     ? {
        confirmInput: {
         label: `請輸入學生姓氏「${surname}」以確認`,
         expected: surname,
         placeholder: surname,
        },
       }
     : {}),
   })
   if (second !== true) return "abort"
   return {
    attendanceAction: "delete",
    deleteAttendanceIds: hits.map((h) => h.id),
   }
  }
  return "abort"
 }

 // purge：預設一併刪（手誤不應留計費幽靈）
 const result = await confirmDialog({
  title: "手誤清除：此生在本班已有出席",
  description: `${desc}\n\n手誤清除預設一併刪除出席。若實際有上課，請改用退讀並保留出席。`,
  confirmText: billable ? "⚠️ 刪除出席並清除報讀" : "刪除出席並清除報讀",
  alternateText: "⚠️ 保留出席並清除報讀（將成孤兒）",
  cancelText: "取消",
  tone: "destructive",
  alternateTone: "warning",
  ...(billable && surname
   ? {
      confirmInput: {
       label: `請輸入學生姓氏「${surname}」以確認刪除計費出席`,
       expected: surname,
       placeholder: surname,
      },
     }
   : {}),
 })
 if (result === true) {
  return {
   attendanceAction: "delete",
   deleteAttendanceIds: hits.map((h) => h.id),
  }
 }
 if (result === "alternate") {
  const second = await confirmDialog({
   title: "確認保留出席？",
   description: "報讀會刪走，出席會變成孤兒（可用學生詳情單列刪）。確定保留？",
   confirmText: "確定保留出席",
   cancelText: "返回",
   tone: "warning",
  })
  if (second !== true) return "abort"
  return { attendanceAction: "keep" }
 }
 return "abort"
}
