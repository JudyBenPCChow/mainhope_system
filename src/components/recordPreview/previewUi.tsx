import { Loader2, MessageCircle } from "lucide-react"

import { useAppBanner } from "@/lib/appBanner"
import { cn } from "@/lib/utils"
import {
 openPrimaryMessagingTarget,
 type PrimaryMessagingTarget,
} from "@/lib/whatsappReminder"

export function PreviewLoading() {
 return (
  <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
   <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
   載入預覽…
  </p>
 )
}

export function PreviewError({ message }: { message: string }) {
 return (
  <p className="text-sm text-destructive" role="alert">
   {message}
  </p>
 )
}

export function PreviewCell({ label, children }: { label: string; children: React.ReactNode }) {
 return (
  <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-2">
   <span className="block text-[11px] text-muted-foreground">{label}</span>
   <span className="block truncate">{children}</span>
  </div>
 )
}

export function PhoneRow({
 label,
 value,
 action,
}: {
 label: string
 value: string | null
 action?: React.ReactNode
}) {
 return (
  <div className="flex items-center gap-1.5 text-xs">
   <span className="text-muted-foreground">{label}</span>
   <span className="font-mono tabular-nums">{value ?? "—"}</span>
   {action}
  </div>
 )
}

export function PreviewMessageButton({
 messaging,
}: {
 messaging: PrimaryMessagingTarget
}) {
 const { pushBanner } = useAppBanner()
 const isWeChat = messaging.channel === "WeChat"
 return (
  <button
   type="button"
   className={cn(
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
    isWeChat
     ? "text-sky-700 hover:bg-sky-600 hover:text-white"
     : "text-success hover:bg-success hover:text-success-foreground"
   )}
   title={isWeChat ? "複製 WeChat ID" : "開啟 WhatsApp"}
   aria-label={isWeChat ? "複製 WeChat ID" : "開啟 WhatsApp"}
   onClick={() => {
    void openPrimaryMessagingTarget(messaging).then((result) => {
     if (result === "wechat") {
      pushBanner({ tone: "success", title: "已複製 WeChat ID", message: messaging.wechatId ?? "" })
     }
    })
   }}
  >
   <MessageCircle className="h-4 w-4" aria-hidden />
  </button>
 )
}
