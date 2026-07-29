/**
 * 下期學費文字提醒（唔再建立收據式「待繳費／通知單」）。
 * WhatsApp／WeChat 仍須人手按發送。
 */

import {
  openPrimaryMessagingTarget,
  resolvePrimaryMessagingTarget,
  type StudentPhoneFields,
} from "@/lib/whatsappReminder"

export function buildNextTuitionReminderText(opts: {
  studentName: string
  classLabels?: string[]
  /** 例：2026年10月 */
  periodLabel?: string | null
}): string {
  const name = opts.studentName.trim() || "貴子弟"
  const period = opts.periodLabel?.trim()
  const classes =
    (opts.classLabels ?? []).map((c) => c.trim()).filter(Boolean).join("、") || null
  const lines = [
    `您好，明學補習社提醒：請盡快為${name}繳付${period ? `${period}之` : "下期"}學費。`,
  ]
  if (classes) lines.push(`班別：${classes}`)
  lines.push("繳費後請向職員確認入帳。如有查詢請回覆本訊息，謝謝。")
  return lines.join("\n")
}

/** 開啟家長／學生通訊並預填下期學費提醒 */
export async function openNextTuitionReminder(
  student: StudentPhoneFields & { full_name?: string | null },
  opts?: { classLabels?: string[]; periodLabel?: string | null }
): Promise<"whatsapp" | "wechat" | false> {
  const target = resolvePrimaryMessagingTarget(student)
  if (!target) return false
  const text = buildNextTuitionReminderText({
    studentName: student.full_name?.trim() || "貴子弟",
    classLabels: opts?.classLabels,
    periodLabel: opts?.periodLabel,
  })
  return openPrimaryMessagingTarget(target, text)
}
