import { useEffect, useState } from "react"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildDemoPaymentReceiptDocumentHtml } from "@/lib/paymentPrint"

/** 免登入：A4 收據模擬示範（含 logo、請假、Portal QR） */
export default function ReceiptDemo() {
 const [html, setHtml] = useState<string>("")
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

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

 return (
  <div className="min-h-screen bg-[#ececec] text-foreground">
   <div className="sticky top-0 z-10 border-b border-border/60 bg-white/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3">
     <div>
      <h1 className="text-base font-semibold tracking-tight">收款收據 · 模擬示範</h1>
      <p className="text-xs text-muted-foreground">
       A4 · 已付款排程 · 請假紀錄 · 學生自助平台 QR（假資料）
      </p>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onPrint} disabled={!html}>
       <Printer className="h-4 w-4" />
       列印示範
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
       <a href="https://mainhope.edu.hk/" target="_blank" rel="noopener noreferrer">
        官網
       </a>
      </Button>
     </div>
    </div>
   </div>
   <div className="mx-auto max-w-[860px] px-3 py-5">
    {loading ? (
     <p className="text-sm text-muted-foreground">產生示範收據中…</p>
    ) : err ? (
     <p className="text-sm text-destructive">{err}</p>
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
