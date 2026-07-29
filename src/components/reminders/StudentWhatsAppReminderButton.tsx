import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAppBanner } from "@/lib/appBanner"
import { cn } from "@/lib/utils"
import {
 buildLessonReminderMessage,
 openPrimaryMessagingTarget,
 type LessonReminderPayload,
 type PrimaryMessagingTarget,
} from "@/lib/whatsappReminder"

type Props = {
 /** 第一聯絡人目標；缺則按鈕停用 */
 messagingTarget?: PrimaryMessagingTarget | null
 /** @deprecated 請傳 messagingTarget；僅 WhatsApp 電話時仍可用 */
 contactPhone?: string | null
 payload: LessonReminderPayload
 /** 僅圖示，適合表格內 */
 compact?: boolean
 /** 非 compact 時顯示的按鈕文字，預設依 channel */
 label?: string
 className?: string
}

/**
 * 依第一聯絡人偏好：WhatsApp 開 wa.me 預填；WeChat 複製 ID。
 */
export function StudentWhatsAppReminderButton({
 messagingTarget,
 contactPhone,
 payload,
 compact,
 label,
 className,
}: Props) {
 const { pushBanner } = useAppBanner()
 const target: PrimaryMessagingTarget | null =
  messagingTarget ??
  (contactPhone?.trim()
   ? {
      person: "家長",
      channel: "WhatsApp",
      phone: contactPhone.trim(),
      phoneCountryCode: "+852",
      wechatId: null,
     }
   : null)

 const channel = target?.channel ?? "WhatsApp"
 const canSend =
  channel === "WeChat" ? Boolean(target?.wechatId?.trim()) : Boolean(target?.phone?.trim())
 const buttonLabel = label ?? (channel === "WeChat" ? "WeChat" : "WhatsApp")
 const title = !canSend
  ? channel === "WeChat"
    ? "第一聯絡人偏好 WeChat，但未有 WeChat ID，請至學生檔案補齊"
    : "第一聯絡人未有電話，請至學生檔案補齊"
  : channel === "WeChat"
    ? `複製第一聯絡人（${target?.person}）WeChat ID`
    : `開啟 WhatsApp（第一聯絡人：${target?.person}；已預填提醒文字）`

 return (
  <Button
   type="button"
   variant="outline"
   size={compact ? "icon" : "sm"}
   className={cn(
    channel === "WeChat"
     ? "border-sky-500/40 text-sky-700 hover:bg-sky-600 hover:text-white"
     : "border-success/40 text-success hover:bg-success",
    compact && "h-8 w-8 shrink-0",
    className
   )}
   disabled={!canSend}
   title={title}
   aria-label={title}
   onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!target) return
    const msg = buildLessonReminderMessage(payload)
    void openPrimaryMessagingTarget(target, msg).then((result) => {
     if (result === "wechat") {
      pushBanner({
       tone: "success",
       title: "已複製 WeChat ID",
       message: target.wechatId ?? "",
      })
     }
    })
   }}
  >
   <MessageCircle className={cn("h-4 w-4", !compact && "mr-1.5 shrink-0")} aria-hidden />
   {!compact ? buttonLabel : null}
  </Button>
 )
}
