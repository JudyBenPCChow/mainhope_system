import {
 openWhatsAppWithPrefilledText,
} from "@/lib/whatsappReminder"
import {
 buildPaymentReceiptPdfBlob,
 downloadBlob,
 paymentReceiptPdfFilename,
} from "@/lib/paymentReceiptPdf"
import { buildPaymentReceiptDocumentHtmlAsync } from "@/lib/paymentPrint"
import type { PaymentFull } from "@/services/paymentQueries"

function hkd(n: number): string {
 const rounded = Math.round(n * 100) / 100
 return `HK$${rounded.toLocaleString("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 })}`
}

/** 預填給家長的收據 WhatsApp 訊息 */
export function buildPaymentReceiptWhatsAppMessage(p: PaymentFull): string {
 const who = p.studentName.trim() || "同學"
 const lines: string[] = [
  `您好，這裡是明學補習社。`,
  "",
  `附件為「${who}」的繳費收據：`,
  `單號：${p.receiptNumber ?? "—"}`,
  `日期：${p.paymentDate || "—"}`,
  `金額：${hkd(p.totalAmount)}`,
 ]
 if (p.paymentMethod?.trim()) lines.push(`繳費方式：${p.paymentMethod.trim()}`)
 lines.push("")
 lines.push(`請查收 PDF 收據。如有疑問請回覆此訊息，謝謝！`)
 return lines.join("\n")
}

export type SendReceiptWhatsAppResult =
 | { kind: "shared" }
 | { kind: "downloaded" }
 | { kind: "cancelled" }
 | { kind: "no_phone" }
 | { kind: "wa_failed" }

async function trySharePdfFile(file: File, text: string): Promise<"shared" | "cancelled" | "unsupported"> {
 const nav = navigator as Navigator & {
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
 }
 if (typeof nav.share !== "function" || typeof nav.canShare !== "function") return "unsupported"
 const data: ShareData = { files: [file], title: file.name, text }
 try {
  if (!nav.canShare(data)) return "unsupported"
  await nav.share(data)
  return "shared"
 } catch (e) {
  if (e instanceof DOMException && e.name === "AbortError") return "cancelled"
  return "unsupported"
 }
}

/**
 * 產生收據 PDF，優先以系統分享（手機可直送 WhatsApp）；
 * 否則下載 PDF 並開啟 wa.me 預填訊息（使用者需自行附加檔案後發送）。
 */
export async function sendPaymentReceiptViaWhatsApp(
 p: PaymentFull,
 contactPhone: string | null | undefined
): Promise<SendReceiptWhatsAppResult> {
 const phone = contactPhone?.trim() || null
 if (!phone) return { kind: "no_phone" }

 const html = await buildPaymentReceiptDocumentHtmlAsync(p)
 const blob = await buildPaymentReceiptPdfBlob(html)
 const filename = paymentReceiptPdfFilename(p)
 const file = new File([blob], filename, { type: "application/pdf" })
 const message = buildPaymentReceiptWhatsAppMessage(p)

 const shareResult = await trySharePdfFile(file, message)
 if (shareResult === "shared") return { kind: "shared" }
 if (shareResult === "cancelled") return { kind: "cancelled" }

 downloadBlob(blob, filename)
 const opened = openWhatsAppWithPrefilledText(phone, message)
 if (!opened) return { kind: "wa_failed" }
 return { kind: "downloaded" }
}
