import QRCode from "qrcode"

import { MAINHOPE_LOGO_DATA_URL } from "@/lib/mainhopeLogoDataUrl"
import { buildPaymentAmountBreakdown } from "@/lib/paymentAmountBreakdown"
import { buildPortalActivateUrl, getPortalBaseUrl } from "@/lib/portalConfig"
import { PAYMENT_STATUS, type PaymentFull } from "@/services/paymentQueries"
import {
 createPortalInviteForStudent,
 fetchPortalInvitesForStudent,
} from "@/services/portalInviteQueries"

const COMPANY = {
 nameZh: "明學教育",
 nameEn: "Main Hope Education",
 legalName: "明學教育有限公司 MAIN HOPE EDUCATION LTD.",
 website: "https://mainhope.edu.hk/",
 tel: "3705-5140",
 whatsapp: "9484-9539",
 email: "",
 edNo: "620211",
 addressZh: "粉嶺綠悠軒商場 2 樓 11 號",
 addressEn: "Shop No.11, 2/F, Belair Monte, 3 Ma Sik Road, Fanling, N.T., HK",
} as const

/** 品牌色（對齊官網 logo） */
const BRAND = {
 ink: "#243357",
 accent: "#e87722",
 headerBg: "#eef1f6",
 panelBg: "#f7f8fb",
 border: "#d5dbe8",
 muted: "#5a6578",
 deduct: "#b45309",
} as const

const PRINT_TITLE = "收據"

export type PaymentReceiptOptions = {
 portalInviteUrl?: string
 portalQrDataUrl?: string | null
}

function escHtml(s: string) {
 return s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
}

function hkd(n: number): string {
 const rounded = Math.round(n * 100) / 100
 return `HK$${rounded.toLocaleString("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 })}`
}

function isReceivedStatus(status: string): boolean {
 return status === PAYMENT_STATUS.received || status.includes("已收")
}

function docTitleFor(): string {
 return "收據"
}

function openingLineFor(p: PaymentFull): string {
 return isReceivedStatus(p.status) ? "茲收到下列款項︰" : "茲開立下列應繳款項︰"
}

function discountStepLabel(step: {
 name: string
 percentOff: number | null
 amountOff: number | null
}): string {
 const bits = [step.name]
 if (step.percentOff != null && step.percentOff > 0) bits.push(`減免 ${step.percentOff}%`)
 else if (step.amountOff != null && step.amountOff > 0) bits.push(`減 ${hkd(step.amountOff)}`)
 return bits.join(" · ")
}

function buildPrintStyles(): string {
 return `
  @page {
    size: A4 portrait;
    margin: 14mm 16mm 18mm 16mm;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    color: #111;
    font-family: "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media screen {
    body {
      background: #ececec;
      padding: 16px 12px 28px;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 16mm 16mm 18mm;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,.08);
    }
  }
  @media print {
    body { background: #fff; }
    .sheet {
      width: auto;
      min-height: auto;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 2px solid ${BRAND.ink};
  }
  .brand {
    min-width: 0;
    flex: 1;
  }
  .brand-logo {
    display: block;
    height: 72px;
    width: auto;
    max-width: 320px;
    object-fit: contain;
    object-position: left center;
    margin: 0 0 8px;
  }
  .brand .contact {
    margin: 0;
    font-size: 9pt;
    color: ${BRAND.muted};
    line-height: 1.45;
  }
  .brand .contact a {
    color: ${BRAND.ink};
    text-decoration: none;
  }
  .doc-meta {
    text-align: right;
    flex-shrink: 0;
  }
  .doc-meta .title {
    margin: 0 0 6px;
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: ${BRAND.ink};
  }
  .doc-meta .receipt-no {
    margin: 0;
    display: inline-block;
    padding: 3px 10px;
    border-radius: 4px;
    background: ${BRAND.headerBg};
    border: 1px solid ${BRAND.border};
    font-size: 10pt;
    font-variant-numeric: tabular-nums;
    color: ${BRAND.ink};
  }
  .opening {
    margin: 0 0 12px;
    padding: 8px 12px;
    font-size: 11pt;
    font-weight: 600;
    color: ${BRAND.ink};
    background: ${BRAND.panelBg};
    border-left: 4px solid ${BRAND.accent};
  }
  .section {
    margin-bottom: 16px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid ${BRAND.border};
  }
  .section-title {
    margin: 0;
    font-size: 12pt;
    font-weight: 700;
    color: ${BRAND.ink};
    padding-left: 8px;
    border-left: 3px solid ${BRAND.accent};
  }
  .section-meta {
    font-size: 9pt;
    color: ${BRAND.muted};
    text-align: right;
  }
  .kv-panel {
    border: 1px solid ${BRAND.border};
    border-radius: 6px;
    background: ${BRAND.panelBg};
    padding: 8px 14px;
  }
  .kv {
    width: 100%;
    border-collapse: collapse;
  }
  .kv th, .kv td {
    padding: 5px 0;
    vertical-align: top;
    font-size: 10.5pt;
    border-bottom: 1px dashed #e2e6ef;
  }
  .kv tr:last-child th, .kv tr:last-child td {
    border-bottom: 0;
  }
  .kv th {
    width: 22%;
    text-align: left;
    font-weight: 600;
    color: ${BRAND.muted};
  }
  .kv td {
    text-align: right;
    color: #111;
    font-weight: 500;
  }
  table.data {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    border: 1px solid ${BRAND.border};
    border-radius: 4px;
    overflow: hidden;
  }
  table.data th, table.data td {
    padding: 7px 8px;
    border-bottom: 1px solid ${BRAND.border};
    vertical-align: top;
  }
  table.data thead th {
    background: ${BRAND.ink};
    color: #fff;
    font-weight: 700;
    text-align: left;
    border-bottom: 1px solid ${BRAND.ink};
  }
  table.data td.num, table.data th.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  table.data td.center, table.data th.center {
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  table.data tbody tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  table.data.zebra tbody tr:nth-child(even) td {
    background: ${BRAND.panelBg};
  }
  .amount-box {
    margin-top: 10px;
    margin-left: auto;
    width: min(100%, 320px);
    border: 1px solid ${BRAND.border};
    border-radius: 6px;
    overflow: hidden;
    background: #fff;
  }
  .amount-box .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 7px 12px;
    font-size: 10.5pt;
    border-bottom: 1px solid #eef0f4;
  }
  .amount-box .row:last-child { border-bottom: 0; }
  .amount-box .row .label { color: ${BRAND.muted}; }
  .amount-box .row .value {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: #111;
  }
  .amount-box .row.discount .label,
  .amount-box .row.discount .value {
    color: ${BRAND.deduct};
    font-weight: 500;
  }
  .amount-box .row.subtotal {
    background: ${BRAND.panelBg};
  }
  .amount-box .row.subtotal .label {
    font-weight: 700;
    color: ${BRAND.ink};
  }
  .amount-box .row.net {
    background: ${BRAND.ink};
  }
  .amount-box .row.net .label,
  .amount-box .row.net .value {
    color: #fff;
    font-size: 12.5pt;
    font-weight: 700;
  }
  .footnote {
    margin: 8px 0 0;
    font-size: 9pt;
    color: #666;
  }
  .portal-invite {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 22px;
    padding: 14px;
    border: 1px solid ${BRAND.border};
    border-radius: 8px;
    background: ${BRAND.panelBg};
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .portal-invite .qr {
    width: 112px;
    height: 112px;
    flex-shrink: 0;
    border: 1px solid ${BRAND.border};
    border-radius: 4px;
    background: #fff;
  }
  .portal-invite .copy {
    min-width: 0;
  }
  .portal-invite .copy h3 {
    margin: 0 0 4px;
    font-size: 11pt;
    font-weight: 700;
    color: ${BRAND.ink};
  }
  .portal-invite .copy p {
    margin: 0 0 4px;
    font-size: 9.5pt;
    color: #333;
    line-height: 1.4;
  }
  .portal-invite .copy .note {
    font-weight: 600;
    color: ${BRAND.ink};
  }
  .portal-invite .copy .url {
    font-size: 8.5pt;
    color: ${BRAND.muted};
    word-break: break-all;
  }
 `
}

function buildPrintableHtml(bodyHtml: string, title = PRINT_TITLE): string {
 return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escHtml(title)}</title><style>${buildPrintStyles()}</style></head><body>${bodyHtml}</body></html>`
}

function openPrintableDocument(bodyHtml: string, title = PRINT_TITLE): boolean {
 const html = buildPrintableHtml(bodyHtml, title)
 const iframe = document.createElement("iframe")
 iframe.setAttribute("title", title)
 iframe.setAttribute("aria-hidden", "true")
 iframe.style.cssText =
  "position:fixed;left:-10000px;top:0;width:210mm;min-height:297mm;border:0;opacity:0;pointer-events:none"
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

function buildChargesTableHtml(p: PaymentFull): string {
 const breakdown = buildPaymentAmountBreakdown(p)
 const itemRows = p.details
  .map((d) => {
   const name = d.courseName || d.classLabel
   const withCode = d.courseCode ? `${name} (${d.courseCode})` : name
   return `<tr>
    <td>${escHtml(withCode)}</td>
    <td class="center">${d.lessonCount != null ? escHtml(String(d.lessonCount)) : "—"}</td>
    <td class="num">${d.amount != null ? escHtml(hkd(d.amount)) : "—"}</td>
    <td>${escHtml(d.description?.trim() || "—")}</td>
   </tr>`
  })
  .join("")

 const discountRows = breakdown.discountSteps
  .filter((step) => (step.amountDeducted ?? 0) > 0)
  .map(
   (step) =>
    `<div class="row discount">
      <span class="label">優惠 · ${escHtml(discountStepLabel(step))}</span>
      <span class="value">−${escHtml(hkd(step.amountDeducted ?? 0))}</span>
    </div>`
  )
  .join("")

 return `<table class="data">
  <thead>
   <tr>
    <th>項目</th>
    <th class="center">堂數</th>
    <th class="num">金額</th>
    <th>備註</th>
   </tr>
  </thead>
  <tbody>
   ${itemRows || `<tr><td colspan="4">—</td></tr>`}
  </tbody>
 </table>
 <div class="amount-box">
  <div class="row subtotal">
   <span class="label">合計（正價）</span>
   <span class="value">${escHtml(hkd(breakdown.subtotal))}</span>
  </div>
  ${discountRows}
  <div class="row net">
   <span class="label">折實價</span>
   <span class="value">${escHtml(hkd(breakdown.total))}</span>
  </div>
 </div>`
}

function buildPortalInviteSectionHtml(
 url: string,
 qrDataUrl: string | null,
 studentName: string
): string {
 const who = studentName.trim() || "該學生"
 const qrHtml = qrDataUrl
  ? `<img class="qr" src="${qrDataUrl}" alt="${escHtml(`${who} 專屬開通 QR code`)}" width="112" height="112" />`
  : `<div class="qr" aria-hidden="true" style="display:flex;align-items:center;justify-content:center;font-size:8pt;color:#888;text-align:center;padding:8px">QR</div>`
 return `<section class="portal-invite">
  ${qrHtml}
  <div class="copy">
   <h3>開通家長查閱帳戶</h3>
   <p>請用手機掃描此 QR code，為「${escHtml(who)}」開設家長查閱帳戶（設定電郵與密碼），可查看課堂時間表、出席與繳費資料。</p>
   <p class="note">此開通碼僅供「${escHtml(who)}」使用，請勿轉傳或與其他學生共用。</p>
   <p class="url">${escHtml(url)}</p>
  </div>
 </section>`
}

function buildContactLines(): string {
 const website = `<a href="${escHtml(COMPANY.website)}" target="_blank" rel="noopener noreferrer">${escHtml(COMPANY.website)}</a>`
 const lines = [
  `地址：${COMPANY.addressZh}`,
  `電話：${COMPANY.tel}`,
  COMPANY.whatsapp ? `WhatsApp：${COMPANY.whatsapp}` : "",
  COMPANY.email ? `電郵：${COMPANY.email}` : "",
  `網站：${website}`,
 ].filter(Boolean)
 return lines
  .map((line) => {
   // website line already contains safe escaped HTML anchor
   if (line.startsWith("網站：")) return `<p class="contact">${line}</p>`
   return `<p class="contact">${escHtml(line)}</p>`
  })
  .join("")
}

function buildPrintBody(p: PaymentFull, opts: PaymentReceiptOptions = {}): string {
 const studentLabel = p.studentCode ? `${p.studentName} (${p.studentCode})` : p.studentName
 const title = docTitleFor()
 const portalUrl = opts.portalInviteUrl?.trim() || getPortalBaseUrl() || COMPANY.website
 const portalQr = opts.portalQrDataUrl?.trim() || null

 return `<div class="sheet">
  <header class="header">
   <div class="brand">
    <img class="brand-logo" src="${MAINHOPE_LOGO_DATA_URL}" alt="${escHtml(`${COMPANY.nameZh} ${COMPANY.nameEn}`)}" />
    ${buildContactLines()}
   </div>
   <div class="doc-meta">
    <div class="title">${escHtml(title)}</div>
    <div class="receipt-no">${escHtml(p.receiptNumber ?? "—")}</div>
   </div>
  </header>

  <p class="opening">${escHtml(openingLineFor(p))}</p>

  <section class="section">
   <div class="kv-panel">
    <table class="kv">
     <tr><th>學生</th><td>${escHtml(studentLabel)}</td></tr>
     <tr><th>收款日期</th><td>${escHtml(p.paymentDate || "—")}</td></tr>
     <tr><th>繳費方式</th><td>${escHtml(p.paymentMethod ?? "—")}</td></tr>
     <tr><th>備註</th><td>${escHtml(p.remarks?.trim() || "—")}</td></tr>
    </table>
   </div>
  </section>

  <section class="section">
   ${buildChargesTableHtml(p)}
  </section>

  ${buildPortalInviteSectionHtml(portalUrl, portalQr, p.studentName)}
 </div>`
}

async function buildPortalQrDataUrl(url: string): Promise<string | null> {
 try {
  return await QRCode.toDataURL(url, {
   width: 224,
   margin: 1,
   errorCorrectionLevel: "M",
   color: { dark: BRAND.ink, light: "#ffffff" },
  })
 } catch {
  return null
 }
}

/**
 * 解析該生專屬開通連結（含 token）。
 * 優先使用既有未過期邀請；若無則自動產生一筆，避免收據 QR 落到通用首頁。
 */
async function resolvePortalInviteUrl(studentId: string): Promise<string> {
 if (!studentId.trim()) {
  return getPortalBaseUrl() || COMPANY.website
 }
 try {
  const invites = await fetchPortalInvitesForStudent(studentId)
  const active = invites.find((i) => i.isActive && i.activateUrl)
  if (active?.activateUrl) return active.activateUrl

  const created = await createPortalInviteForStudent(studentId)
  if (created.activateUrl) return created.activateUrl
 } catch {
  // ignore — 改用 portal 首頁
 }
 const base = getPortalBaseUrl()
 if (base) return base
 return COMPANY.website
}

async function loadReceiptExtras(p: PaymentFull): Promise<PaymentReceiptOptions> {
 const portalInviteUrl = await resolvePortalInviteUrl(p.studentId)
 const portalQrDataUrl = await buildPortalQrDataUrl(portalInviteUrl)
 return { portalInviteUrl, portalQrDataUrl }
}

/** 完整收據 HTML（預覽 iframe／列印共用）。可傳入已查好的 Portal QR。 */
export function buildPaymentReceiptDocumentHtml(
 p: PaymentFull,
 opts: PaymentReceiptOptions = {}
): string {
 return buildPrintableHtml(buildPrintBody(p, opts), docTitleFor())
}

/** 查 Portal QR 後產生完整收據 HTML。 */
export async function buildPaymentReceiptDocumentHtmlAsync(p: PaymentFull): Promise<string> {
 const extras = await loadReceiptExtras(p)
 return buildPaymentReceiptDocumentHtml(p, extras)
}

/** 開啟瀏覽器列印視窗；待繳與已收款使用同一收據樣式（A4，可分頁）。 */
export async function printPayment(
 p: PaymentFull,
 kind?: "invoice" | "receipt",
 opts?: PaymentReceiptOptions
): Promise<boolean> {
 void kind
 const extras =
  opts?.portalQrDataUrl && opts?.portalInviteUrl
   ? opts
   : { ...(await loadReceiptExtras(p)), ...opts }
 return openPrintableDocument(buildPrintBody(p, extras), docTitleFor())
}

/** 待繳／待收款與已收款皆列印同一收據樣式。 */
export async function printPaymentForStatus(
 p: PaymentFull,
 status: string,
 pendingStatuses: readonly string[]
): Promise<boolean> {
 void status
 void pendingStatuses
 return printPayment(p)
}

/** 模擬示範用假資料收據（含 logo、Portal QR）。 */
export async function buildDemoPaymentReceiptDocumentHtml(): Promise<string> {
 const demo: PaymentFull = {
  id: "demo-payment",
  studentId: "demo-student",
  studentName: "陳小明",
  studentCode: "STU-2024-0188",
  contactPhone: "91234567",
  receiptNumber: "RC-20260720-0142",
  paymentDate: "2026-07-20",
  totalAmount: 4320,
  subtotalAmount: 4800,
  paymentMethod: "轉數快",
  status: PAYMENT_STATUS.received,
  remarks: "家長已確認下學期繼續報讀",
  createdAt: "2026-07-20T10:00:00+08:00",
  discountId: "demo-discount",
  discountName: "早鳥九折",
  studentGrade: "中三",
  details: [
   {
    id: "d1",
    classId: "c1",
    classLabel: "中文專班 (CHI-S3-A)",
    courseName: "中文專班",
    courseCode: "CHI-S3-A",
    lessonCount: 8,
    amount: 3200,
    description: "7-8 月堂費",
   },
   {
    id: "d2",
    classId: "c2",
    classLabel: "英文小組 (ENG-S3-B)",
    courseName: "英文小組",
    courseCode: "ENG-S3-B",
    lessonCount: 4,
    amount: 1600,
    description: null,
   },
  ],
  discountApplications: [
   {
    sortOrder: 0,
    discountId: "demo-discount",
    name: "早鳥九折",
    percentOff: 10,
    amountOff: null,
    amountDeducted: 480,
   },
  ],
  discountPercentOff: 10,
  discountAmountOff: null,
 }

 const demoToken = "demo-chenxiaoming-activate-only"
 const portalInviteUrl =
  buildPortalActivateUrl(demoToken) ??
  `${getPortalBaseUrl() || "https://mainhopeportal.vercel.app"}/activate?token=${encodeURIComponent(demoToken)}`
 const portalQrDataUrl = await buildPortalQrDataUrl(portalInviteUrl)
 return buildPaymentReceiptDocumentHtml(demo, { portalInviteUrl, portalQrDataUrl })
}
