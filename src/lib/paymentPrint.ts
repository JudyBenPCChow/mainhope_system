import { buildPaymentAmountBreakdown } from "@/lib/paymentAmountBreakdown"
import { formatMgmtRoleLabel } from "@/lib/mgmtRole"
import { formatStudentGradeCode } from "@/lib/studentGrade"
import type { PaymentFull } from "@/services/paymentQueries"

const COMPANY = {
 nameZh: "明學教育",
 nameEn: "Main Hope Education",
 legalName: "明學教育有限公司 MAIN HOPE EDUCATION LTD.",
 tel: "9484-9539 / 3705-5140",
 edNo: "620211",
 addressEn: "Shop No.11, 2/F, Belair Monte, 3 Ma Sik Road, Fanling, N.T., HK",
 addressZh: "粉嶺綠悠軒商場 2 樓 11 號",
} as const

const PRINT_TITLE = "Payment Receipt"

function escHtml(s: string) {
 return s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
}

function hkd(n: number): string {
 const rounded = Math.round(n * 100) / 100
 if (Number.isInteger(rounded)) return `HKD$ ${rounded}`
 return `HKD$ ${rounded.toFixed(2)}`
}

const RECEIPT_WIDTH_MM = 88

function buildPrintStyles(): string {
 return `
  @page{size:${RECEIPT_WIDTH_MM}mm auto;margin:0}
  *{box-sizing:border-box}
  html,body{width:${RECEIPT_WIDTH_MM}mm;margin:0;padding:0}
  body{font-family:"Helvetica Neue",Arial,"PingFang TC","Microsoft JhengHei",sans-serif;color:#111;line-height:1.3;font-size:9px}
  .sheet{width:${RECEIPT_WIDTH_MM}mm;padding:2.5mm 2mm}
  .header{display:flex;gap:2mm;align-items:flex-start;margin-bottom:2.5mm}
  .logo-box{width:14mm;height:14mm;border:1px dashed #bbb;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#999;font-size:7px;flex-shrink:0}
  .company{min-width:0;flex:1}
  .company h2{margin:0;font-size:13px;font-weight:700;letter-spacing:.01em;line-height:1.15}
  .company .en{margin:0.5mm 0 1mm;font-size:8px;font-weight:600;line-height:1.2}
  .company .legal,.company .contact{font-size:7px;color:#222;line-height:1.25;word-break:break-word}
  .doc-title{margin:1.5mm 0 2.5mm;text-align:center;font-size:11px;font-weight:700;text-decoration:underline}
  .meta-top{display:flex;justify-content:space-between;gap:1.5mm;margin-bottom:1.5mm;font-size:8px;word-break:break-word}
  .meta-top .date{font-weight:700;text-align:right}
  .student-block{text-align:right;margin-bottom:2mm}
  .student-block .name{margin:0.5mm 0;font-size:14px;font-weight:700;line-height:1.1;word-break:break-word}
  .student-block .line{font-size:8px}
  table.items{width:100%;border-collapse:collapse;margin-top:1.5mm;font-size:7px;table-layout:fixed}
  table.items th,table.items td{border:1px solid #222;padding:1mm 0.8mm;vertical-align:top;word-break:break-word}
  table.items th{font-weight:700;text-align:left;background:#fff}
  table.items th:nth-child(1),table.items td:nth-child(1){width:38%}
  table.items th:nth-child(2),table.items td:nth-child(2){width:24%}
  table.items th:nth-child(3),table.items td:nth-child(3){width:14%}
  table.items th:nth-child(4),table.items td:nth-child(4){width:24%}
  table.items td.num{text-align:right}
  table.items tr.discount td{font-style:italic}
  .summary{margin-top:2.5mm;display:flex;justify-content:flex-end}
  .summary table{border-collapse:collapse;font-size:8px;width:100%}
  .summary td{padding:0.4mm 0}
  .summary td.label{text-align:right;padding-right:2mm;white-space:nowrap}
  .summary td.value{text-align:right;font-weight:700;width:42%}
  .footer{margin-top:4mm;display:flex;flex-direction:column;align-items:center;gap:2.5mm}
  .stamp{width:22mm;height:22mm;border:1px dashed #bbb;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#999;font-size:8px;flex-shrink:0}
  .signatures{font-size:7.5px;width:100%}
  .signatures .line{margin-bottom:1.5mm;word-break:break-word}
  .signatures .sig{margin-top:4mm;border-top:1px solid #222;padding-top:1mm}
  @media print{
   html,body{width:${RECEIPT_WIDTH_MM}mm}
   .sheet{width:${RECEIPT_WIDTH_MM}mm}
  }
 `
}

function buildPrintableHtml(bodyHtml: string): string {
 return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"/><meta name="viewport" content="width=${RECEIPT_WIDTH_MM}mm"/><title>${escHtml(PRINT_TITLE)}</title><style>${buildPrintStyles()}</style></head><body>${bodyHtml}</body></html>`
}

/** 以隱藏 iframe 列印，避免 popup + document.write 在部分瀏覽器出現空白頁 */
function openPrintableDocument(bodyHtml: string): boolean {
 const html = buildPrintableHtml(bodyHtml)
 const iframe = document.createElement("iframe")
 iframe.setAttribute("title", PRINT_TITLE)
 iframe.setAttribute("aria-hidden", "true")
 iframe.style.cssText =
  `position:fixed;left:-10000px;top:0;width:${RECEIPT_WIDTH_MM}mm;min-height:200mm;border:0;opacity:0;pointer-events:none`
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

function buildItemsTableHtml(p: PaymentFull): string {
 const itemRows = p.details
  .map((d) => {
   const courseName = d.courseName || d.classLabel
   return `<tr>
    <td>${escHtml(courseName)}</td>
    <td>${escHtml(d.courseCode ?? "—")}</td>
    <td class="num">${d.lessonCount ?? "—"}</td>
    <td class="num">${d.amount != null ? hkd(d.amount) : "—"}</td>
   </tr>`
  })
  .join("")

 const breakdown = buildPaymentAmountBreakdown(p)
 const discountRows = breakdown.discountSteps
  .filter((step) => (step.amountDeducted ?? 0) > 0)
  .map(
   (step) =>
    `<tr class="discount"><td colspan="3">Discount · ${escHtml(step.name)}</td><td class="num">-${Math.round(step.amountDeducted ?? 0)}</td></tr>`
  )
  .join("")

 return `<table class="items">
  <thead>
   <tr>
    <th>Course Name</th>
    <th>班別編碼</th>
    <th>堂數</th>
    <th>HKD</th>
   </tr>
  </thead>
  <tbody>
   ${itemRows || `<tr><td colspan="4">—</td></tr>`}
   ${discountRows}
  </tbody>
 </table>`
}

function buildPrintBody(p: PaymentFull): string {
 const grade = formatStudentGradeCode(p.studentGrade)
 const total = hkd(p.totalAmount)
 const handler = formatMgmtRoleLabel()

 return `<div class="sheet">
  <div class="header">
   <div class="logo-box" aria-hidden="true">LOGO</div>
   <div class="company">
    <h2>${escHtml(COMPANY.nameZh)}</h2>
    <div class="en">${escHtml(COMPANY.nameEn)}</div>
    <div class="legal">${escHtml(COMPANY.legalName)}</div>
    <div class="contact">TEL: ${escHtml(COMPANY.tel)}</div>
    <div class="contact">ED No.: ${escHtml(COMPANY.edNo)}</div>
    <div class="contact">Address: ${escHtml(COMPANY.addressEn)} ${escHtml(COMPANY.addressZh)}</div>
   </div>
  </div>

  <div class="doc-title">${PRINT_TITLE}</div>

  <div class="meta-top">
   <div>Payment No: <strong>${escHtml(p.receiptNumber ?? "—")}</strong></div>
   <div class="date">Date: ${escHtml(p.paymentDate)}</div>
  </div>

  <div class="student-block">
   <div class="line">Student No: ${escHtml(p.studentCode ?? "—")}</div>
   <div class="name">${escHtml(p.studentName)}</div>
   <div class="line">Grade: ${escHtml(grade)}</div>
  </div>

  ${buildItemsTableHtml(p)}

  <div class="summary">
   <table>
    <tr><td class="label">Net-Total:</td><td class="value">${total}</td></tr>
    <tr><td class="label">Paid-by:</td><td class="value">${escHtml(p.paymentMethod ?? "—")}</td></tr>
    <tr><td class="label">Round Total:</td><td class="value">${total}</td></tr>
   </table>
  </div>

  <div class="footer">
   <div class="stamp" aria-hidden="true">印章</div>
   <div class="signatures">
    <div class="line">Received by: ${escHtml(handler)}</div>
    <div class="line">Name of Supervisor:</div>
    <div class="sig">Supervisor/Authorized Signature:</div>
   </div>
  </div>
 </div>`
}

/** 開啟瀏覽器列印視窗；待繳與已收款使用同一收據樣式。 */
export function printPayment(p: PaymentFull, _kind?: "invoice" | "receipt"): boolean {
 return openPrintableDocument(buildPrintBody(p))
}

/** 待繳／待收款與已收款皆列印同一收據樣式。 */
export function printPaymentForStatus(
 p: PaymentFull,
 _status: string,
 _pendingStatuses: readonly string[]
): boolean {
 return printPayment(p)
}
