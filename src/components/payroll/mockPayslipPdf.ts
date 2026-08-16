import { downloadBlob } from "@/lib/paymentReceiptPdf"
import { MAINHOPE_LOGO_DATA_URL } from "@/lib/mainhopeLogoDataUrl"
import { payrollModeLabel } from "@/lib/payroll/modeLabel"

import {
  isPresentStatus,
  studentHcStatusLabel,
  teacherBillableHc,
  teacherLessonCount,
  type PayrollLesson,
  type PayrollMonthMock,
  type PayrollTeacherRow,
  type StudentHcRow,
} from "./mockData"

const BRAND = {
  ink: "#243357",
  accent: "#e87722",
  headerBg: "#eef1f6",
  panelBg: "#f7f8fb",
  border: "#d5dbe8",
  muted: "#5a6578",
} as const

const COMPANY = {
  nameZh: "明學教育",
  nameEn: "Main Hope Education",
  addressZh: "粉嶺綠悠軒商場 2 樓 11 號",
  tel: "3705-5140",
  website: "https://mainhope.edu.hk/",
} as const

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function hkd(n: number | null | undefined): string {
  if (n == null) return "—"
  return `HK$${n.toLocaleString("en-HK", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function groupPresentByMode(rows: StudentHcRow[]): string {
  const buckets: Record<string, string[]> = {
    in_person: [],
    zoom: [],
    recording: [],
    leave_billable: [],
  }
  for (const r of rows) {
    if (!isPresentStatus(r.status)) continue
    buckets[r.status]?.push(r.name)
  }
  const parts: string[] = []
  if (buckets.in_person!.length) parts.push(`現場 ${buckets.in_person!.join("、")}`)
  if (buckets.zoom!.length) parts.push(`Zoom ${buckets.zoom!.join("、")}`)
  if (buckets.recording!.length) parts.push(`錄影 ${buckets.recording!.join("、")}`)
  if (buckets.leave_billable!.length) parts.push(`請假計入 ${buckets.leave_billable!.join("、")}`)
  return parts.join("<br/>") || "—"
}

function buildStyles(): string {
  return `
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; color: #111;
    font-family: "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt; line-height: 1.45;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  #measure-root { width: 734px; padding: 0 8px; }
  .pdf-page {
    width: 794px; min-height: 1123px; padding: 28px 30px 48px;
    background: #fff; position: relative;
  }
  .page-foot {
    position: absolute; left: 30px; right: 30px; bottom: 18px;
    font-size: 8pt; color: ${BRAND.muted};
    border-top: 1px solid ${BRAND.border}; padding-top: 6px;
    display: flex; justify-content: space-between;
  }
  .header {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
    margin-bottom: 12px; padding-bottom: 12px;
    border-bottom: 2px solid ${BRAND.ink};
  }
  .brand-logo { display: block; height: 56px; width: auto; max-width: 280px; object-fit: contain; margin: 0 0 6px; }
  .contact { margin: 0; font-size: 8.5pt; color: ${BRAND.muted}; line-height: 1.4; }
  .doc-meta { text-align: right; flex-shrink: 0; }
  .doc-meta .title {
    margin: 0 0 6px; font-size: 20pt; font-weight: 700;
    letter-spacing: 0.14em; color: ${BRAND.ink};
  }
  .doc-meta .badge {
    display: inline-block; padding: 3px 10px; border-radius: 4px;
    background: ${BRAND.headerBg}; border: 1px solid ${BRAND.border};
    font-size: 9pt; font-variant-numeric: tabular-nums; color: ${BRAND.ink};
  }
  .opening {
    margin: 0 0 12px; padding: 8px 12px; font-size: 10.5pt; font-weight: 600;
    color: ${BRAND.ink}; background: ${BRAND.panelBg}; border-left: 4px solid ${BRAND.accent};
  }
  .section { margin-bottom: 14px; }
  .section-head {
    display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
    margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid ${BRAND.border};
  }
  .section-title {
    margin: 0; font-size: 11.5pt; font-weight: 700; color: ${BRAND.ink};
    padding-left: 8px; border-left: 3px solid ${BRAND.accent};
  }
  .section-meta { font-size: 8.5pt; color: ${BRAND.muted}; text-align: right; }
  .kv-panel {
    border: 1px solid ${BRAND.border}; border-radius: 6px;
    background: ${BRAND.panelBg}; padding: 6px 12px;
  }
  .kv { width: 100%; border-collapse: collapse; }
  .kv th, .kv td {
    padding: 4px 0; vertical-align: top; font-size: 9.5pt;
    border-bottom: 1px dashed #e2e6ef;
  }
  .kv tr:last-child th, .kv tr:last-child td { border-bottom: 0; }
  .kv th { width: 28%; text-align: left; font-weight: 600; color: ${BRAND.muted}; }
  .kv td { text-align: right; font-weight: 500; }
  table.data {
    width: 100%; border-collapse: collapse; font-size: 9pt;
    border: 1px solid ${BRAND.border}; border-radius: 4px; overflow: hidden;
  }
  table.data th, table.data td {
    padding: 6px 7px; border-bottom: 1px solid ${BRAND.border}; vertical-align: top;
  }
  table.data thead th {
    background: ${BRAND.ink}; color: #fff; font-weight: 700; text-align: left;
  }
  table.data td.num, table.data th.num {
    text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  table.data tbody tr:nth-child(even) td { background: ${BRAND.panelBg}; }
  table.data .total-row td {
    background: ${BRAND.headerBg} !important; font-weight: 700; color: ${BRAND.ink};
  }
  .amount-box {
    margin-top: 10px; margin-left: auto; width: min(100%, 280px);
    border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden; background: #fff;
  }
  .amount-box .row {
    display: flex; justify-content: space-between; gap: 12px;
    padding: 6px 12px; font-size: 9.5pt; border-bottom: 1px solid #eef0f4;
  }
  .amount-box .row:last-child { border-bottom: 0; }
  .amount-box .row .label { color: ${BRAND.muted}; }
  .amount-box .row .value { font-variant-numeric: tabular-nums; font-weight: 600; }
  .amount-box .row.net { background: ${BRAND.ink}; }
  .amount-box .row.net .label, .amount-box .row.net .value {
    color: #fff; font-size: 11pt; font-weight: 700;
  }
  .badge-warn {
    display: inline-block; padding: 1px 6px; border-radius: 3px;
    background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; font-size: 8.5pt; font-weight: 600;
  }
  .names { font-size: 8.5pt; color: #333; line-height: 1.35; }
  .muted { color: ${BRAND.muted}; font-size: 8.5pt; }
  .footnote { margin: 8px 0 0; font-size: 8.5pt; color: #666; }
  .keep-block { margin-bottom: 10px; }
  .teacher-title {
    margin: 0 0 6px; font-size: 13pt; font-weight: 700; color: ${BRAND.ink};
  }
  `
}

function docHeaderHtml(month: PayrollMonthMock, generatedAt: string, pageKind: string): string {
  const ver = month.calc?.version ?? "—"
  return `<header class="header">
    <div class="brand">
      <img class="brand-logo" src="${MAINHOPE_LOGO_DATA_URL}" alt="${esc(COMPANY.nameZh)}" />
      <p class="contact">地址：${esc(COMPANY.addressZh)}</p>
      <p class="contact">電話：${esc(COMPANY.tel)} · ${esc(COMPANY.website)}</p>
    </div>
    <div class="doc-meta">
      <div class="title">工資單</div>
      <div class="badge">${esc(month.monthLabel)} · v#${esc(String(ver))}</div>
      <p class="muted" style="margin:6px 0 0;text-align:right">${esc(pageKind)}<br/>產生 ${esc(generatedAt)}</p>
    </div>
  </header>`
}

function lessonRowHtml(cName: string, l: PayrollLesson): string {
  if (l.notRolled) {
    return `<tr>
      <td>${esc(l.date)}<br/><span class="muted">${esc(l.startTime)}–${esc(l.endTime)}</span></td>
      <td>${esc(cName)}</td>
      <td colspan="3"><span class="badge-warn">未點名 · 未計薪</span></td>
      <td class="num">${hkd(0)}</td>
    </tr>`
  }
  const rows = l.studentRows ?? []
  const presentHtml = groupPresentByMode(rows)
  const noShow = rows.filter((r) => r.status === "no_show").map((r) => esc(r.name)).join("、") || "—"
  const nonBill =
    rows
      .filter((r) => !r.countsTowardHc)
      .map((r) => `${esc(r.name)}（${esc(studentHcStatusLabel(r.status))}）`)
      .join("、") || "—"
  return `<tr>
    <td>${esc(l.date)}<br/><span class="muted">${esc(l.startTime)}–${esc(l.endTime)}</span></td>
    <td>${esc(cName)}${l.formula ? `<br/><span class="muted">${esc(l.formula)}</span>` : ""}</td>
    <td class="names">${presentHtml}</td>
    <td class="names">${noShow}</td>
    <td class="names">${nonBill}</td>
    <td class="num">${hkd(l.amount)}<br/><span class="muted">計薪 ${l.billableHc}${l.rosterCount != null ? `／${l.rosterCount}` : ""}</span></td>
  </tr>`
}

function teacherDetailBlocks(t: PayrollTeacherRow): string {
  const kpi = `<div class="keep-block">
    <p class="teacher-title">${esc(t.name)}\u3000${esc(payrollModeLabel(t.mode))}</p>
    <div class="kv-panel">
      <table class="kv">
        <tr><th>總薪酬</th><td>${hkd(t.gross)}</td></tr>
        <tr><th>僱員強積金</th><td>${hkd(t.employeeMpf)}</td></tr>
        <tr><th>實收</th><td>${hkd(t.net)}</td></tr>
        <tr><th>堂數／計薪扣堂</th><td>${teacherLessonCount(t) || "—"} 堂 · ${teacherBillableHc(t)} 人次</td></tr>
        <tr><th>上月對照</th><td>${hkd(t.previousGross)}</td></tr>
        <tr><th>備註</th><td>${esc(t.anomalies[0] ?? "—")}</td></tr>
      </table>
    </div>
  </div>`

  if (t.grades.length === 0) {
    const lineRows =
      t.lines
        .map(
          (l) =>
            `<tr><td>${esc(l.label)}${l.note ? `<br/><span class="muted">${esc(l.note)}</span>` : ""}</td><td class="num">${hkd(l.amount)}</td></tr>`
        )
        .join("") || `<tr><td colspan="2">本月無授課堂次</td></tr>`
    return `${kpi}
    <div class="keep-block section">
      <div class="section-head"><h2 class="section-title">薪酬項目</h2></div>
      <table class="data">
        <thead><tr><th>項目</th><th class="num">金額</th></tr></thead>
        <tbody>${lineRows}</tbody>
      </table>
      <div class="amount-box">
        <div class="row"><span class="label">總薪酬</span><span class="value">${hkd(t.gross)}</span></div>
        <div class="row"><span class="label">僱員強積金</span><span class="value">${hkd(t.employeeMpf)}</span></div>
        <div class="row net"><span class="label">實收</span><span class="value">${hkd(t.net)}</span></div>
      </div>
    </div>`
  }

  const lessonBlocks = t.grades
    .map((g) => {
      const rows = g.classes
        .flatMap((c) => c.lessons.map((l) => lessonRowHtml(c.name, l)))
        .join("")
      return `<div class="keep-block section">
        <div class="section-head">
          <h2 class="section-title">${esc(g.gradeLabel)}</h2>
          <span class="section-meta">${g.classes.length} 班</span>
        </div>
        <table class="data">
          <thead>
            <tr>
              <th style="width:14%">日期</th>
              <th style="width:20%">班別</th>
              <th style="width:28%">出席（現場／Zoom／錄影）</th>
              <th style="width:14%">缺席·照扣堂</th>
              <th style="width:14%">缺席·不扣堂</th>
              <th class="num" style="width:10%">金額</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    })
    .join("")

  const extraLines =
    t.lines.length > 0
      ? `<div class="keep-block section">
          <div class="section-head"><h2 class="section-title">其他項目</h2></div>
          <table class="data">
            <thead><tr><th>項目</th><th class="num">金額</th></tr></thead>
            <tbody>${t.lines
              .map(
                (l) =>
                  `<tr><td>${esc(l.label)}${l.note ? `<br/><span class="muted">${esc(l.note)}</span>` : ""}</td><td class="num">${hkd(l.amount)}</td></tr>`
              )
              .join("")}</tbody>
          </table>
        </div>`
      : ""

  return `${kpi}${lessonBlocks}${extraLines}
  <div class="keep-block">
    <div class="amount-box">
      <div class="row"><span class="label">總薪酬</span><span class="value">${hkd(t.gross)}</span></div>
      <div class="row"><span class="label">僱員強積金</span><span class="value">${hkd(t.employeeMpf)}</span></div>
      <div class="row net"><span class="label">實收</span><span class="value">${hkd(t.net)}</span></div>
    </div>
  </div>`
}

function summaryPageBlocks(month: PayrollMonthMock, teachers: PayrollTeacherRow[], generatedAt: string): string {
  const ver = month.calc?.version ?? "—"
  const totalGross = teachers.reduce((s, t) => s + (t.gross ?? 0), 0)
  const totalNet = teachers.reduce((s, t) => s + (t.net ?? 0), 0)
  const totalMpf = teachers.reduce((s, t) => s + t.employeeMpf, 0)
  const rows = teachers
    .map(
      (t) => `<tr>
      <td>${esc(t.name)}</td>
      <td>${esc(payrollModeLabel(t.mode))}</td>
      <td class="num">${teacherLessonCount(t) || "—"}</td>
      <td class="num">${teacherLessonCount(t) > 0 ? teacherBillableHc(t) : "—"}</td>
      <td class="num">${hkd(t.gross)}</td>
      <td class="num">${hkd(t.employeeMpf)}</td>
      <td class="num">${hkd(t.net)}</td>
      <td class="muted">${esc(t.anomalies[0] ?? "—")}</td>
    </tr>`
    )
    .join("")

  return `
  <div class="keep-block">
    ${docHeaderHtml(month, generatedAt, "審批用 · 項目總表")}
    <p class="opening">茲編製下列計糧工資項目，供財務審批及管理層核實︰</p>
    <div class="kv-panel" style="margin-bottom:12px">
      <table class="kv">
        <tr><th>計糧月份</th><td>${esc(month.monthLabel)}</td></tr>
        <tr><th>計算版本</th><td>#${esc(String(ver))}</td></tr>
        <tr><th>資料截止</th><td>${esc(month.calc?.dataCutoffAt ?? "—")}</td></tr>
        <tr><th>本檔人數</th><td>${teachers.length} 人</td></tr>
      </table>
    </div>
  </div>
  <div class="keep-block section">
    <div class="section-head">
      <h2 class="section-title">工資項目細明</h2>
      <span class="section-meta">其後頁為各同事出席與金額</span>
    </div>
    <table class="data">
      <thead>
        <tr>
          <th>同事</th><th>模式</th>
          <th class="num">堂數</th><th class="num">計薪人頭</th>
          <th class="num">總薪酬</th><th class="num">僱員強積金</th><th class="num">實收</th><th>備註</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="4">合計</td>
          <td class="num">${hkd(totalGross)}</td>
          <td class="num">${hkd(totalMpf)}</td>
          <td class="num">${hkd(totalNet)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <div class="amount-box">
      <div class="row"><span class="label">總薪酬合計</span><span class="value">${hkd(totalGross)}</span></div>
      <div class="row"><span class="label">僱員強積金合計</span><span class="value">${hkd(totalMpf)}</span></div>
      <div class="row net"><span class="label">實發合計</span><span class="value">${hkd(totalNet)}</span></div>
    </div>
    <p class="footnote">計薪規則：現場／Zoom／錄影／no show 計入；病假／事假不計入人頭費與分成基數。本單據為審批用示範檔。</p>
  </div>`
}

function buildHtml(month: PayrollMonthMock, teachers: PayrollTeacherRow[]): string {
  const generatedAt = new Date().toLocaleString("zh-HK")
  const teacherPages = teachers
    .map(
      (t) => `<div class="keep-block">
      ${docHeaderHtml(month, generatedAt, `明細 · ${t.name}`)}
    </div>${teacherDetailBlocks(t)}`
    )
    .join("")

  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"/><style>${buildStyles()}</style></head>
<body>
  <div id="measure-root">${summaryPageBlocks(month, teachers, generatedAt)}${teacherPages}</div>
  <div id="pages-root"></div>
</body></html>`
}

async function buildPayslipPdfBlob(html: string, footerBase: string): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  const iframe = document.createElement("iframe")
  iframe.setAttribute("title", "計糧工資單 PDF")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;min-height:1200px;border:0;opacity:0;pointer-events:none"
  document.body.appendChild(iframe)

  try {
    const doc = await new Promise<Document>((resolve, reject) => {
      iframe.onload = () => {
        const d = iframe.contentDocument
        if (!d) reject(new Error("無法讀取 PDF 內容"))
        else resolve(d)
      }
      iframe.onerror = () => reject(new Error("PDF 內容載入失敗"))
      iframe.srcdoc = html
    })

    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    // 等 logo 載入
    await Promise.all(
      Array.from(doc.images).map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.addEventListener("load", () => res(), { once: true })
                img.addEventListener("error", () => res(), { once: true })
              })
      )
    )

    const measureRoot = doc.getElementById("measure-root")
    const pagesRoot = doc.getElementById("pages-root")
    if (!measureRoot || !pagesRoot) throw new Error("工資單結構不完整")

    const blocks = Array.from(measureRoot.querySelectorAll<HTMLElement>(".keep-block"))
    const PAGE_CONTENT_H = 980
    const GAP = 8
    const pages: HTMLElement[] = []
    let current: HTMLElement | null = null
    let used = 0

    const newPage = () => {
      const page = doc.createElement("div")
      page.className = "pdf-page"
      pagesRoot.appendChild(page)
      pages.push(page)
      current = page
      used = 0
      return page
    }

    for (const block of blocks) {
      const h = Math.ceil(block.getBoundingClientRect().height)
      if (!current) newPage()
      if (used > 0 && used + GAP + h > PAGE_CONTENT_H) newPage()
      current!.appendChild(block.cloneNode(true))
      used += (used > 0 ? GAP : 0) + h
    }
    measureRoot.remove()

    pages.forEach((page, i) => {
      const foot = doc.createElement("div")
      foot.className = "page-foot"
      foot.innerHTML = `<span>${esc(footerBase)}</span><span>第 ${i + 1} / ${pages.length} 頁</span>`
      page.appendChild(foot)
    })

    await new Promise<void>((r) => requestAnimationFrame(() => r()))

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const marginX = 0
    const marginY = 0
    const contentW = 210

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]!
      const canvas = await html2canvas(page, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794,
        windowHeight: Math.max(page.scrollHeight, 1123),
      })
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      const imgH = (canvas.height * contentW) / canvas.width
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, "JPEG", marginX, marginY, contentW, imgH)
    }

    return pdf.output("blob")
  } finally {
    iframe.remove()
  }
}

/** 下載審批用工資單 PDF（對齊學費收據品牌排版） */
export async function downloadPayrollPayslipPdf(
  month: PayrollMonthMock,
  teachers: PayrollTeacherRow[]
): Promise<string> {
  const html = buildHtml(month, teachers)
  const ver = month.calc?.version ?? 0
  const footer = `${COMPANY.nameZh} · 計糧工資單（審批用）· ${month.monthLabel} · v#${ver}`
  const blob = await buildPayslipPdfBlob(html, footer)
  const filename =
    teachers.length === 1
      ? `明學計糧工資單_${month.monthKey}_v${ver}_${teachers[0]!.name.replace(/[\\/:*?"<>|]+/g, "_")}.pdf`
      : `明學計糧工資單_${month.monthKey}_v${ver}_${teachers.length}人.pdf`
  downloadBlob(blob, filename)
  return filename
}
