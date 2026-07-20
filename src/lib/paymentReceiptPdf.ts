import type { PaymentFull } from "@/services/paymentQueries"

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

function waitForImages(root: ParentNode): Promise<void> {
 const imgs = Array.from(root.querySelectorAll("img"))
 if (imgs.length === 0) return Promise.resolve()
 return Promise.all(
  imgs.map(
   (img) =>
    img.complete
     ? Promise.resolve()
     : new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true })
        img.addEventListener("error", () => resolve(), { once: true })
       })
  )
 ).then(() => undefined)
}

function loadIframeDocument(html: string): Promise<{ iframe: HTMLIFrameElement; doc: Document }> {
 return new Promise((resolve, reject) => {
  const iframe = document.createElement("iframe")
  iframe.setAttribute("title", "收據 PDF 產生")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText =
   "position:fixed;left:-10000px;top:0;width:210mm;min-height:297mm;border:0;opacity:0;pointer-events:none"
  document.body.appendChild(iframe)

  const cleanupOnError = (err: Error) => {
   iframe.remove()
   reject(err)
  }

  iframe.onload = () => {
   const doc = iframe.contentDocument
   if (!doc) {
    cleanupOnError(new Error("無法讀取收據內容"))
    return
   }
   void waitForImages(doc)
    .then(() => resolve({ iframe, doc }))
    .catch((e) => cleanupOnError(e instanceof Error ? e : new Error(String(e))))
  }

  iframe.onerror = () => cleanupOnError(new Error("收據載入失敗"))
  iframe.srcdoc = html
 })
}

/** 將收據 HTML 轉成 A4 PDF Blob（多頁自動切分）。 */
export async function buildPaymentReceiptPdfBlob(html: string): Promise<Blob> {
 const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
  import("html2canvas"),
  import("jspdf"),
 ])

 const { iframe, doc } = await loadIframeDocument(html)
 try {
  const sheet = (doc.querySelector(".sheet") as HTMLElement | null) ?? doc.body
  await new Promise<void>((r) => requestAnimationFrame(() => r()))

  const canvas = await html2canvas(sheet, {
   scale: 2,
   useCORS: true,
   allowTaint: true,
   backgroundColor: "#ffffff",
   logging: false,
   windowWidth: sheet.scrollWidth,
   windowHeight: sheet.scrollHeight,
  })

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const imgWidth = A4_WIDTH_MM
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  const imgData = canvas.toDataURL("image/jpeg", 0.92)

  let heightLeft = imgHeight
  let position = 0
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
  heightLeft -= A4_HEIGHT_MM

  while (heightLeft > 1) {
   position = heightLeft - imgHeight
   pdf.addPage()
   pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
   heightLeft -= A4_HEIGHT_MM
  }

  return pdf.output("blob")
 } finally {
  iframe.remove()
 }
}

export function paymentReceiptPdfFilename(p: PaymentFull): string {
 const no = (p.receiptNumber ?? p.id.slice(0, 8)).replace(/[^\w\-]+/g, "_")
 const name = p.studentName.trim().replace(/[\\/:*?"<>|]+/g, "_") || "學生"
 return `收據_${no}_${name}.pdf`
}

export function downloadBlob(blob: Blob, filename: string): void {
 const url = URL.createObjectURL(blob)
 const a = document.createElement("a")
 a.href = url
 a.download = filename
 a.rel = "noopener"
 document.body.appendChild(a)
 a.click()
 a.remove()
 window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
