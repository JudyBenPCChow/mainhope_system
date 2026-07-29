import { useEffect, useState } from "react"
import { Download, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatUnknownError } from "@/lib/formatUnknownError"
import {
 buildDemoPaymentReceiptDocumentHtml,
 getDemoPaymentFull,
} from "@/lib/paymentPrint"
import {
 buildPaymentReceiptPdfBlob,
 downloadBlob,
 paymentReceiptPdfFilename,
} from "@/lib/paymentReceiptPdf"

function formatBytes(n: number): string {
 if (n < 1024) return `${n} B`
 if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
 return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 免登入：A4 收據模擬示範。
 * 「jsPDF 手寫文字 PDF」已否決（無 logo、版面不如現況）；正式下載仍為截圖 PDF。
 * 若要可選文字且保留版面，需另做 HTML→列印引擎／headless PDF（尚未實作）。
 */
export default function ReceiptDemo() {
 const [html, setHtml] = useState<string>("")
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [busy, setBusy] = useState(false)
 const [lastResult, setLastResult] = useState<string | null>(null)

 useEffect(() => {
  let cancelled = false
  void (async () => {
   try {
    const doc = await buildDemoPaymentReceiptDocumentHtml()
    if (!cancelled) {
     setHtml(doc)
     setErr(null)
    }
   } catch (e) {
    if (!cancelled) setErr(e instanceof Error ? e.message : "無法產生示範收據")
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()
  return () => {
   cancelled = true
  }
 }, [])

 const onPrint = () => {
  if (!html) return
  const iframe = document.createElement("iframe")
  iframe.setAttribute("title", "收據示範列印")
  iframe.style.cssText =
   "position:fixed;left:-10000px;top:0;width:210mm;min-height:297mm;border:0;opacity:0;pointer-events:none"
  document.body.appendChild(iframe)
  const win = iframe.contentWindow
  const doc = iframe.contentDocument ?? win?.document
  if (!win || !doc) {
   iframe.remove()
   return
  }
  doc.open()
  doc.write(html)
  doc.close()
  const cleanup = () => window.setTimeout(() => iframe.remove(), 500)
  const run = () => {
   try {
    win.focus()
    win.print()
   } catch {
    cleanup()
    return
   }
   win.addEventListener("afterprint", cleanup, { once: true })
   window.setTimeout(cleanup, 60_000)
  }
  window.setTimeout(run, 150)
 }

 const onDownloadRaster = async () => {
  if (!html || busy) return
  setBusy(true)
  setLastResult(null)
  try {
   const blob = await buildPaymentReceiptPdfBlob(html)
   const filename = paymentReceiptPdfFilename(getDemoPaymentFull()).replace(
    /\.pdf$/i,
    "_截圖PDF現況.pdf"
   )
   downloadBlob(blob, filename)
   setLastResult(`已下載：${filename}（${formatBytes(blob.size)}）`)
  } catch (e) {
   setErr(formatUnknownError(e))
  } finally {
   setBusy(false)
  }
 }

 return (
  <div className="min-h-screen bg-[#ececec] text-foreground">
   <div className="sticky top-0 z-10 border-b border-border/60 bg-white/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3">
     <div>
      <h1 className="text-base font-semibold tracking-tight">收款收據 · 模擬示範</h1>
      <p className="text-xs text-muted-foreground">
       A4 · 與正式下載相同版面（含 logo、Portal QR）
      </p>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button
       type="button"
       size="sm"
       onClick={() => void onDownloadRaster()}
       disabled={!html || busy}
      >
       {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
       ) : (
        <Download className="h-4 w-4" aria-hidden />
       )}
       下載 PDF（現況）
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onPrint} disabled={!html}>
       <Printer className="h-4 w-4" />
       列印／另存 PDF
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
       <a href="https://mainhope.edu.hk/" target="_blank" rel="noopener noreferrer">
        官網
       </a>
      </Button>
     </div>
    </div>
   </div>

   <div className="mx-auto max-w-[860px] space-y-4 px-3 py-5">
    <section
     className="rounded-lg border border-border bg-white p-4 text-sm shadow-sm"
     aria-label="PDF 說明"
    >
     <p className="text-muted-foreground">
      正式「下載收據」為截圖式 PDF（版面＝預覽，含 logo）。曾試作 jsPDF
      手寫文字 PDF，因<strong className="font-medium text-foreground">無法保留 logo
      與現有版面</strong>已否決。若日後要「可選文字＋同版面」，需改走瀏覽器／伺服器列印引擎輸出
      PDF，而非重畫一版。
     </p>
     <p className="mt-2 text-xs text-muted-foreground">
      可選：「列印／另存 PDF」→ 系統對話框選「儲存為 PDF」，通常可選字且版面接近預覽。
     </p>
     {lastResult ? (
      <p className="mt-3 text-xs text-foreground" role="status">
       {lastResult}
      </p>
     ) : null}
    </section>

    {loading ? (
     <p className="text-sm text-muted-foreground">產生示範收據中…</p>
    ) : err ? (
     <p className="text-sm text-destructive" role="alert">
      {err}
     </p>
    ) : (
     <iframe
      title="收據模擬示範"
      className="h-[min(92vh,1180px)] w-full rounded-md border border-border bg-white shadow-sm"
      srcDoc={html}
     />
    )}
   </div>
  </div>
 )
}
