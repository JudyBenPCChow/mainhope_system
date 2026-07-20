import { useState } from "react"
import { MessageCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAppBanner } from "@/lib/appBanner"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { sendPaymentReceiptViaWhatsApp } from "@/lib/paymentReceiptWhatsApp"
import { cn } from "@/lib/utils"
import { fetchPaymentFull, type PaymentFull } from "@/services/paymentQueries"

type Props = {
 /** 已載入的完整單據；與 paymentId 二擇一（優先用 payment） */
 payment?: PaymentFull | null
 paymentId?: string
 contactPhone?: string | null
 compact?: boolean
 label?: string
 className?: string
 size?: "sm" | "default" | "icon"
}

/**
 * 產生 PDF 收據並以 WhatsApp 傳送給家長。
 * 手機優先系統分享；桌面則下載 PDF 並開啟預填對話。
 */
export function PaymentReceiptWhatsAppButton({
 payment,
 paymentId,
 contactPhone,
 compact,
 label = "WhatsApp",
 className,
 size = "sm",
}: Props) {
 const { pushBanner } = useAppBanner()
 const [busy, setBusy] = useState(false)

 const resolvedPhone = (contactPhone ?? payment?.contactPhone)?.trim() || null
 const knownMissingPhone =
  (contactPhone !== undefined && !contactPhone?.trim() && !payment?.contactPhone?.trim()) ||
  (payment != null && !payment.contactPhone?.trim() && contactPhone === undefined)
 const disabled = busy || (!payment && !paymentId) || knownMissingPhone

 const title = knownMissingPhone || (!resolvedPhone && payment)
  ? "學生資料無 WhatsApp／學生電話／家長電話，請至學生檔案補齊"
  : busy
    ? "正在產生 PDF 收據…"
    : "產生 PDF 收據並以 WhatsApp 傳送給家長"

 const onClick = async (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (busy || disabled) return

  setBusy(true)
  try {
   let full = payment ?? null
   if (!full) {
    if (!paymentId) return
    full = await fetchPaymentFull(paymentId)
    if (!full) {
     pushBanner({ tone: "error", title: "找不到單據", message: "無法產生收據。" })
     return
    }
   }
   const phone = (contactPhone ?? full.contactPhone)?.trim() || null
   if (!phone) {
    pushBanner({
     tone: "warning",
     title: "沒有聯絡電話",
     message: "請先至學生檔案填寫 WhatsApp 或家長電話。",
    })
    return
   }
   const result = await sendPaymentReceiptViaWhatsApp(full, phone)
   if (result.kind === "cancelled") return
   if (result.kind === "no_phone") {
    pushBanner({
     tone: "warning",
     title: "沒有聯絡電話",
     message: "請先至學生檔案填寫 WhatsApp 或家長電話。",
    })
    return
   }
   if (result.kind === "wa_failed") {
    pushBanner({
     tone: "warning",
     title: "無法開啟 WhatsApp",
     message: "PDF 已下載，請檢查電話號碼格式後再試。",
    })
    return
   }
   if (result.kind === "shared") {
    pushBanner({
     tone: "success",
     title: "已開啟分享",
     message: "請選擇 WhatsApp 並確認傳送收據。",
    })
    return
   }
   pushBanner({
    tone: "success",
    title: "已下載 PDF 並開啟 WhatsApp",
    message: "請在 WhatsApp 附加剛下載的收據檔案後發送。",
   })
  } catch (err) {
   reportUserFacingError(err, {
    source: "PaymentReceiptWhatsAppButton",
    userMessage: "產生或傳送收據失敗，請稍後再試。",
   })
   pushBanner({
    tone: "error",
    title: "傳送失敗",
    message: err instanceof Error ? err.message : "產生或傳送收據失敗，請稍後再試。",
   })
  } finally {
   setBusy(false)
  }
 }

 return (
  <Button
   type="button"
   variant="outline"
   size={compact ? "icon" : size}
   className={cn(
    "border-success/40 text-success hover:bg-success hover:text-success-foreground",
    compact && "h-8 w-8 shrink-0",
    className
   )}
   disabled={disabled}
   title={title}
   aria-label={title}
   onClick={(e) => void onClick(e)}
  >
   {busy ? (
    <Loader2 className={cn("h-4 w-4 animate-spin", !compact && "mr-1.5 shrink-0")} aria-hidden />
   ) : (
    <MessageCircle className={cn("h-4 w-4", !compact && "mr-1.5 shrink-0")} aria-hidden />
   )}
   {!compact ? (busy ? "產生中…" : label) : null}
  </Button>
 )
}
