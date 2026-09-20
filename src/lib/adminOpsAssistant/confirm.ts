import type { AdminOpsPendingExecute } from "@/lib/adminOpsAssistant/types"

export function adminOpsConfirmLabel(pending: AdminOpsPendingExecute): string {
  if (pending.workflow === "delete_empty_class") return "確認硬刪"
  if (pending.workflow === "replace_empty_slot" && pending.step === "delete") return "確認硬刪空班"
  if (pending.workflow === "replace_empty_slot" && pending.step === "create") return "確認開班並排堂"
  if (pending.workflow === "create_class_schedule") return "確認開班並排堂"
  if (pending.workflow === "swap_slots") return "確認對調"
  return "確認寫入"
}

export function adminOpsConfirmTitle(pending: AdminOpsPendingExecute): string {
  if (
    pending.workflow === "delete_empty_class" ||
    (pending.workflow === "replace_empty_slot" && pending.step === "delete")
  ) {
    return "確認硬刪空班？"
  }
  if (
    pending.workflow === "create_class_schedule" ||
    (pending.workflow === "replace_empty_slot" && pending.step === "create")
  ) {
    return "確認開班並排堂？"
  }
  if (pending.workflow === "swap_slots") return "確認對調兩個班的時段？"
  return "確認寫入？"
}

/** 只允許最新一則助手訊息的確認卡寫入，避免舊預覽被重按。 */
export function isActionablePendingMessage(opts: {
  messageId: string
  hasPending: boolean
  latestAssistantId: string | null | undefined
}): boolean {
  return Boolean(opts.hasPending && opts.latestAssistantId && opts.messageId === opts.latestAssistantId)
}
