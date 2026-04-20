import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  buildLessonReminderMessage,
  openWhatsAppWithPrefilledText,
  type LessonReminderPayload,
} from "@/lib/whatsappReminder"

type Props = {
  contactPhone: string | null
  payload: LessonReminderPayload
  /** 僅圖示，適合表格內 */
  compact?: boolean
  /** 非 compact 時顯示的按鈕文字，預設「WhatsApp」 */
  label?: string
  className?: string
}

/**
 * 以 wa.me 開啟 WhatsApp 並預填提醒文字；使用者須在 WhatsApp 內自行按發送。
 */
export function StudentWhatsAppReminderButton({
  contactPhone,
  payload,
  compact,
  label = "WhatsApp",
  className,
}: Props) {
  const disabled = !contactPhone?.trim()
  const title = disabled
    ? "學生資料無 WhatsApp／家長電話／電話，請至學生檔案補齊"
    : "開啟 WhatsApp（已預填提醒文字，請自行確認後發送）"

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "sm"}
      className={cn(
        "border-emerald-600/40 text-emerald-800 hover:bg-emerald-50",
        compact && "h-8 w-8 shrink-0",
        className
      )}
      disabled={disabled}
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!contactPhone) return
        const msg = buildLessonReminderMessage(payload)
        openWhatsAppWithPrefilledText(contactPhone, msg)
      }}
    >
      <MessageCircle className={cn("h-4 w-4", !compact && "mr-1.5 shrink-0")} aria-hidden />
      {!compact ? label : null}
    </Button>
  )
}
