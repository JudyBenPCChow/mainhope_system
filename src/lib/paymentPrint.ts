import { buildPaymentAmountBreakdown } from "@/lib/paymentAmountBreakdown"
import type { PaymentFull } from "@/services/paymentQueries"

function money(n: number) {
 return new Intl.NumberFormat("zh-Hant", { style: "currency", currency: "HKD" }).format(n)
}

function escHtml(s: string) {
 return s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
}

function buildPrintableHtml(title: string, bodyHtml: string): string {
 return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"/><title>${escHtml(title)}</title>
<style>
 body{font-family:ui-sans-serif,system-ui,sans-serif;padding:28px;max-width:720px;margin:0 auto;color:#111;line-height:1.5}
 h1{font-size:22px;margin:0 0 8px;font-weight:700}
 .sub{color:#555;font-size:14px;margin-bottom:20px}
 .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eee;font-size:15px}
 .label{color:#666;flex-shrink:0}
 .val{text-align:right;word-break:break-all}
 table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
 th,td{border:1px solid #ddd;padding:8px;text-align:left}
 th{background:#f6f6f6}
 .totals{margin-top:16px;border-top:2px solid #ddd;padding-top:12px}
 .totals .row{border-bottom:none;padding:6px 0;font-size:15px}
 .totals .row.deduction .val{color:#b45309}
 .totals .row.total{margin-top:8px;padding-top:10px;border-top:1px solid #ddd;font-size:18px;font-weight:700}
 @media print{body{padding:12px}}
</style></head><body>${bodyHtml}</body></html>`
}

/** 以隱藏 iframe 列印，避免 popup + document.write 在部分瀏覽器出現空白頁 */
function openPrintableDocument(title: string, bodyHtml: string): boolean {
 const html = buildPrintableHtml(title, bodyHtml)
 const iframe = document.createElement("iframe")
 iframe.setAttribute("title", title)
 iframe.setAttribute("aria-hidden", "true")
 iframe.style.cssText =
  "position:fixed;left:-10000px;top:0;width:800px;height:1200px;border:0;opacity:0;pointer-events:none"
 document.body.appendChild(iframe)

 const frameWin = iframe.contentWindow
 const frameDoc = iframe.contentDocument ?? frameWin?.document
 if (!frameWin || !frameDoc) {
  iframe.remove()
  return false
 }

 frameDoc.open()
 frameDoc.write(html)
 frameDoc.close()

 const cleanup = () => {
  window.setTimeout(() => iframe.remove(), 500)
 }

 const runPrint = () => {
  try {
   frameWin.focus()
   frameWin.print()
  } catch {
   cleanup()
   return
  }
  frameWin.addEventListener("afterprint", cleanup, { once: true })
  window.setTimeout(cleanup, 60_000)
 }

 if (frameDoc.readyState === "complete") {
  window.setTimeout(runPrint, 150)
 } else {
  iframe.onload = () => window.setTimeout(runPrint, 150)
 }

 return true
}

function buildAmountTotalsHtml(p: PaymentFull): string {
 const breakdown = buildPaymentAmountBreakdown(p)
 const rows = breakdown.lines
  .map((line) => {
   const cls =
    line.tone === "total" ? "row total" : line.tone === "deduction" ? "row deduction" : "row"
   const displayAmount =
    line.tone === "deduction" ? `-${money(Math.abs(line.amount))}` : money(line.amount)
   return `<div class="${cls}"><span class="label">${escHtml(line.label)}</span><span class="val">${displayAmount}</span></div>`
  })
  .join("")
 return `<div class="totals">${rows}</div>`
}

function buildPrintBody(p: PaymentFull, kind: "invoice" | "receipt"): string {
 const isInvoice = kind === "invoice"
 const headTitle = isInvoice ? "繳費通知單" : "收款收據"
 const sub = isInvoice
  ? "請家長／學生依下列金額繳付；繳款後請保留收據。"
  : "茲收到下列款項，此據。"

 const lines =
  p.details.length === 0
   ? ""
   : `<table><thead><tr><th>項目</th><th>堂數</th><th>金額</th></tr></thead><tbody>${p.details
     .map(
      (d) =>
       `<tr><td>${escHtml(d.classLabel)}</td><td>${d.lessonCount ?? "—"}</td><td>${d.amount != null ? money(d.amount) : "—"}</td></tr>`
     )
     .join("")}</tbody></table>`

 return `
  <h1>${escHtml(headTitle)}</h1>
  <div class="sub">${escHtml(sub)}</div>
  <div class="row"><span class="label">單據編號</span><span class="val">${escHtml(p.receiptNumber ?? "—")}</span></div>
  <div class="row"><span class="label">學生</span><span class="val">${escHtml(p.studentName)}${p.studentCode ? `（${escHtml(p.studentCode)}）` : ""}</span></div>
  <div class="row"><span class="label">日期</span><span class="val">${escHtml(p.paymentDate)}</span></div>
  <div class="row"><span class="label">狀態</span><span class="val">${escHtml(p.status)}</span></div>
  <div class="row"><span class="label">繳費方式</span><span class="val">${escHtml(p.paymentMethod ?? "—")}</span></div>
  ${p.remarks ? `<div class="row"><span class="label">備註</span><span class="val">${escHtml(p.remarks)}</span></div>` : ""}
  ${lines}
  ${buildAmountTotalsHtml(p)}
 `
}

/** 開啟瀏覽器列印視窗（通知單或收據）；使用者可另存為 PDF。 */
export function printPayment(p: PaymentFull, kind: "invoice" | "receipt"): boolean {
 const title = kind === "invoice" ? "繳費通知單" : "收款收據"
 return openPrintableDocument(title, buildPrintBody(p, kind))
}

/** 待繳／待收款狀態應列印通知單，其餘列印收據。 */
export function printPaymentForStatus(
 p: PaymentFull,
 status: string,
 pendingStatuses: readonly string[]
): boolean {
 const pending = pendingStatuses.includes(status)
 return printPayment(p, pending ? "invoice" : "receipt")
}
