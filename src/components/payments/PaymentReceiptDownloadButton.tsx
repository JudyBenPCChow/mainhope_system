import { useState } from "react"
import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAppBanner } from "@/lib/appBanner"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 downloadPaymentReceipt,
 resolveReceiptDownloadDirectoryForClick,
} from "@/lib/paymentReceiptDownload"
import { RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH } from "@/lib/receiptDownloadFolder"
import { cn } from "@/lib/utils"
import { fetchPaymentFull, type PaymentFull } from "@/services/paymentQueries"

type Props = {
 /** 已載入的完整單據；與 paymentId 二擇一（優先用 payment） */
 payment?: PaymentFull | null
 paymentId?: string
 compact?: boolean
 label?: string
 className?: string
 size?: "sm" | "default" | "icon"
}

/**
 * 產生 PDF 收據並下載至接待處 OneDrive「學生收據」資料夾（首次需選取授權）。
 */
export function PaymentReceiptDownloadButton({
 payment,
 paymentId,
 compact,
 label = "下載收據",
 className,
 size = "sm",
}: Props) {
 const { pushBanner } = useAppBanner()
 const [busy, setBusy] = useState(false)

 const disabled = busy || (!payment && !paymentId)
 const title = busy
  ? "正在產生 PDF 收據…"
  : `下載收據 PDF 至：${RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH}`

 const onClick = async (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (busy || disabled) return

  setBusy(true)
  try {
   // 先確保資料夾（需保留點擊手勢，再去做較慢的 PDF 產生）
   const dirResult = await resolveReceiptDownloadDirectoryForClick()
   if (dirResult.kind === "cancelled") return

   let full = payment ?? null
   if (!full) {
    if (!paymentId) return
    full = await fetchPaymentFull(paymentId)
    if (!full) {
     pushBanner({ tone: "error", title: "找不到單據", message: "無法產生收據。" })
     return
    }
   }

   const result = await downloadPaymentReceipt(full, { directory: dirResult.directory })
   if (result.kind === "cancelled") return
   if (result.kind === "saved_to_folder") {
    pushBanner({
     tone: "success",
     title: "收據已儲存",
     message: `已存到學生收據資料夾：${result.filename}`,
    })
    return
   }
   pushBanner({
    tone: "success",
    title: "收據已下載",
    message: `已下載 ${result.filename}。若要固定存到 OneDrive，請用 Chrome 首次選取：${result.folderPath}`,
   })
  } catch (err) {
   reportUserFacingError(err, {
    source: "PaymentReceiptDownloadButton",
    userMessage: "下載收據失敗，請稍後再試。",
   })
   pushBanner({
    tone: "error",
    title: "下載失敗",
    message: err instanceof Error ? err.message : "下載收據失敗，請稍後再試。",
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
   className={cn(compact && "h-8 w-8 shrink-0", className)}
   disabled={disabled}
   title={title}
   aria-label={title}
   onClick={(e) => void onClick(e)}
  >
   {busy ? (
    <Loader2 className={cn("h-4 w-4 animate-spin", !compact && "mr-1.5 shrink-0")} aria-hidden />
   ) : (
    <Download className={cn("h-4 w-4", !compact && "mr-1.5 shrink-0")} aria-hidden />
   )}
   {!compact ? (busy ? "下載中…" : label) : null}
  </Button>
 )
}
