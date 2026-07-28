import {
 buildPaymentReceiptPdfBlob,
 downloadBlob,
 paymentReceiptPdfFilename,
} from "@/lib/paymentReceiptPdf"
import { buildPaymentReceiptDocumentHtmlAsync } from "@/lib/paymentPrint"
import {
 ensureReceiptDownloadDirectory,
 isReceiptFolderPickerAbortError,
 RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH,
 writeBlobToDirectory,
} from "@/lib/receiptDownloadFolder"
import type { PaymentFull } from "@/services/paymentQueries"

export type DownloadPaymentReceiptResult =
 | { kind: "saved_to_folder"; filename: string; folderPath: string }
 | { kind: "browser_download"; filename: string; folderPath: string }
 | { kind: "cancelled" }

export type DownloadPaymentReceiptOptions = {
 /**
  * 已在點擊手勢內取得的目錄（建議先呼叫 resolveReceiptDownloadDirectoryForClick）。
  * 傳入後不再彈資料夾選擇器。
  */
 directory?: FileSystemDirectoryHandle | null
}

/**
 * 產生收據 PDF 並下載。
 * 支援 File System Access 的瀏覽器：寫入已授權的 OneDrive「學生收據」資料夾；
 * 否則改為瀏覽器一般下載。
 */
export async function downloadPaymentReceipt(
 p: PaymentFull,
 options?: DownloadPaymentReceiptOptions
): Promise<DownloadPaymentReceiptResult> {
 let dir: FileSystemDirectoryHandle | null
 if (options && "directory" in options) {
  dir = options.directory ?? null
 } else {
  try {
   dir = await ensureReceiptDownloadDirectory()
  } catch (e) {
   if (isReceiptFolderPickerAbortError(e)) return { kind: "cancelled" }
   dir = null
  }
 }

 const html = await buildPaymentReceiptDocumentHtmlAsync(p)
 const blob = await buildPaymentReceiptPdfBlob(html)
 const filename = paymentReceiptPdfFilename(p)

 if (dir) {
  try {
   await writeBlobToDirectory(dir, filename, blob)
   return {
    kind: "saved_to_folder",
    filename,
    folderPath: RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH,
   }
  } catch {
   // 寫入失敗則退回一般下載
  }
 }

 downloadBlob(blob, filename)
 return {
  kind: "browser_download",
  filename,
  folderPath: RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH,
 }
}

/** 在點擊手勢內先確保資料夾；取消選取回傳 cancelled。 */
export async function resolveReceiptDownloadDirectoryForClick(): Promise<
 | { kind: "ok"; directory: FileSystemDirectoryHandle | null }
 | { kind: "cancelled" }
> {
 try {
  const directory = await ensureReceiptDownloadDirectory()
  return { kind: "ok", directory }
 } catch (e) {
  if (isReceiptFolderPickerAbortError(e)) return { kind: "cancelled" }
  return { kind: "ok", directory: null }
 }
}
