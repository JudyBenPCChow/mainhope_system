import { downloadBlob } from "@/lib/paymentReceiptPdf"

import {
  classAbsentTotal,
  classKindLabel,
  classPresentTotal,
  gradeAbsentTotal,
  gradeLessonCount,
  gradePresentTotal,
  lessonAbsentCount,
  lessonPresentCount,
  teacherAbsentTotal,
  teacherCategoryTotals,
  teacherClassCount,
  teacherGradeKindRows,
  teacherLessonCount,
  teacherPresentTotal,
  type CategoryTotals,
  type SecondaryClassBlock,
  type SecondaryTeacherBlock,
} from "@/services/secondaryAttendanceReportQueries"

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function categoryRowsHtml(cats: CategoryTotals[], overallPresent: number, overallAbsent: number): string {
  const body = cats
    .map(
      (b) => `<tr>
    <td class="left">${esc(b.label)}</td>
    <td class="num">${b.gradeIds.size}</td>
    <td class="num">${b.classCount}</td>
    <td class="num">${b.lessonCount}</td>
    <td class="num strong">${b.presentVisits}</td>
    <td class="num">${b.absentVisits}</td>
  </tr>`
    )
    .join("")
  const sum = (pick: (c: CategoryTotals) => number) => cats.reduce((s, c) => s + pick(c), 0)
  return `${body}
  <tr class="total-row">
    <td class="left">合計</td>
    <td class="num">—</td>
    <td class="num">${sum((c) => c.classCount)}</td>
    <td class="num">${sum((c) => c.lessonCount)}</td>
    <td class="num strong">${overallPresent}</td>
    <td class="num">${overallAbsent}</td>
  </tr>`
}

function classTableHtml(c: SecondaryClassBlock): string {
  const kind = classKindLabel(c.classKind)
  const lessonRows = c.lessons
    .map((l) => {
      if (l.notRolled) {
        return `<tr>
          <td class="left nowrap">${esc(l.date)}</td>
          <td class="left nowrap">${esc(l.startTime)}–${esc(l.endTime)}</td>
          <td class="num">—</td>
          <td class="num">—</td>
          <td class="left"><span class="badge">未點名</span></td>
          <td class="left muted">尚無點名紀錄</td>
        </tr>`
      }
      const present = lessonPresentCount(l)
      const absent = lessonAbsentCount(l)
      const presentNames = l.presentStudents.map((n) => esc(n)).join("、") || "—"
      const absentNames = l.absentStudents.map((n) => esc(n)).join("、") || "—"
      const note = l.makeupOrTrialNote ? `<div class="note">${esc(l.makeupOrTrialNote)}</div>` : ""
      return `<tr>
        <td class="left nowrap">${esc(l.date)}</td>
        <td class="left nowrap">${esc(l.startTime)}–${esc(l.endTime)}</td>
        <td class="num strong">${present}</td>
        <td class="num">${absent}</td>
        <td class="left names">${presentNames}${note}</td>
        <td class="left names">${absentNames}</td>
      </tr>`
    })
    .join("")

  return `<table class="data class-table" cellspacing="0" cellpadding="0">
    <colgroup>
      <col style="width:12%" /><col style="width:12%" /><col style="width:8%" />
      <col style="width:8%" /><col style="width:30%" /><col style="width:30%" />
    </colgroup>
    <thead>
      <tr class="class-title">
        <th colspan="6" class="left">
          ${esc(c.name)}
          <span class="sub">\u3000${kind} · 本班出席 ${classPresentTotal(c)} 人次 · 缺席 ${classAbsentTotal(c)} 人次 · ${c.lessons.length} 堂</span>
        </th>
      </tr>
      <tr>
        <th class="left">日期</th>
        <th class="left">時段</th>
        <th class="num">出席</th>
        <th class="num">缺席</th>
        <th class="left">出席學生</th>
        <th class="left">缺席學生</th>
      </tr>
    </thead>
    <tbody>${lessonRows}</tbody>
  </table>`
}

const SHARED_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    font-family: "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Hiragino Sans GB", sans-serif;
    color: #111827;
    font-size: 11px;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
  }
  .sheet, .pdf-page {
    width: 794px;
    padding: 32px 36px 28px;
    background: #fff;
  }
  .pdf-page { min-height: 1040px; }
  .measure-root { position: absolute; left: -10000px; top: 0; width: 794px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border-spacing: 0; }
  .title-block td { vertical-align: top; padding: 0; border: none; }
  .doc-title { font-size: 20px; font-weight: 700; letter-spacing: 0.02em; margin: 0; }
  .doc-sub { margin: 6px 0 0; color: #4b5563; font-size: 11px; }
  .rule { height: 2px; background: #111827; margin: 12px 0 14px; border: none; }
  .meta-table td { border: none; padding: 2px 0; font-size: 11px; color: #374151; }
  .meta-table .label { width: 72px; color: #6b7280; }
  .kpi-table { margin: 0 0 12px; }
  .kpi-table td {
    border: 1px solid #d1d5db; padding: 9px 6px; text-align: center;
    vertical-align: middle; background: #f9fafb;
  }
  .kpi-table .k-label { display: block; font-size: 9px; color: #6b7280; margin-bottom: 3px; }
  .kpi-table .k-value { display: block; font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .kpi-table .c-jg { background: #eff6ff; }
  .kpi-table .c-sg { background: #f0fdf4; }
  .kpi-table .c-jp { background: #fff7ed; }
  .kpi-table .c-sp { background: #faf5ff; }
  .section-label {
    margin: 14px 0 8px; font-size: 12px; font-weight: 700; color: #111827;
    border-left: 3px solid #111827; padding-left: 8px;
  }
  .keep-block { margin-bottom: 12px; }
  .data th, .data td {
    border: 1px solid #d1d5db; padding: 6px 7px; vertical-align: top;
    word-wrap: break-word; overflow-wrap: anywhere;
  }
  .data th { background: #f3f4f6; font-size: 10px; font-weight: 700; color: #374151; }
  .data .left { text-align: left; }
  .data .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .data .strong { font-weight: 700; }
  .data .muted { color: #6b7280; }
  .data .nowrap { white-space: nowrap; }
  .data .names { font-size: 10px; line-height: 1.45; }
  .data .total-row td { background: #f3f4f6; font-weight: 700; }
  .class-table .class-title th {
    background: #111827; color: #fff; font-size: 11px; font-weight: 700;
    text-align: left; padding: 8px 10px;
  }
  .class-table .class-title .sub { font-weight: 400; color: #d1d5db; font-size: 10px; }
  .section-head { margin-bottom: 6px; }
  .section-head td { border: none; padding: 2px 0; }
  .badge {
    display: inline-block; padding: 1px 6px; border: 1px solid #f59e0b;
    background: #fffbeb; color: #92400e; font-size: 10px; font-weight: 700;
  }
  .note { margin-top: 4px; color: #4b5563; font-size: 9px; }
  .footer {
    margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb;
    color: #9ca3af; font-size: 9px;
  }
  .footnote { margin: 6px 0 0; color: #6b7280; font-size: 10px; }
  .page-foot { margin-top: auto; padding-top: 10px; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; }
`

/** 老師計算頁 HTML：內容拆成 keep-block，供分頁擷取（避免跨頁切斷表格） */
export function buildTeacherAttendanceCalcHtml(teacher: SecondaryTeacherBlock, monthLabel: string): string {
  const presentTotal = teacherPresentTotal(teacher)
  const absentTotal = teacherAbsentTotal(teacher)
  const lessonTotal = teacherLessonCount(teacher)
  const classTotal = teacherClassCount(teacher)
  const cats = teacherCategoryTotals(teacher)
  const byKey = Object.fromEntries(cats.map((c) => [c.key, c])) as Record<string, CategoryTotals>
  const gradeKindRows = teacherGradeKindRows(teacher)
  const generatedAt = new Date().toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  const gradeSummaryRows = gradeKindRows
    .map(
      (r) => `<tr>
      <td class="left">${esc(r.gradeLabel)}</td>
      <td class="left">${esc(classKindLabel(r.classKind))}</td>
      <td class="num">${r.classCount}</td>
      <td class="num">${r.lessonCount}</td>
      <td class="num strong">${r.presentVisits}</td>
      <td class="num">${r.absentVisits}</td>
    </tr>`
    )
    .join("")

  const detailBlocks = teacher.grades
    .map((g) => {
      const head = `<div class="keep-block">
        <table class="section-head" cellspacing="0" cellpadding="0">
          <tr>
            <td class="left"><strong>${esc(g.gradeLabel)}</strong></td>
            <td style="text-align:right" class="muted">出席 ${gradePresentTotal(g)} 人次 · 缺席 ${gradeAbsentTotal(g)} 人次 · ${g.classes.length} 班 · ${gradeLessonCount(g)} 堂</td>
          </tr>
        </table>
      </div>`
      const tables = g.classes
        .map((c) => `<div class="keep-block">${classTableHtml(c)}</div>`)
        .join("")
      return head + tables
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<style>${SHARED_CSS}</style>
</head>
<body>
  <div class="measure-root" id="measure-root">
    <div class="keep-block" data-block="cover">
      <table class="title-block" cellspacing="0" cellpadding="0">
        <tr>
          <td class="left">
            <p class="doc-title">老師中學出席計算頁</p>
            <p class="doc-sub">明學管理系統 · 行政處理用</p>
          </td>
          <td style="width:42%;text-align:right">
            <table class="meta-table" cellspacing="0" cellpadding="0" style="margin-left:auto">
              <tr><td class="label">老師</td><td><strong>${esc(teacher.name)}</strong></td></tr>
              <tr><td class="label">統計月份</td><td>${esc(monthLabel)}</td></tr>
              <tr><td class="label">產生時間</td><td>${esc(generatedAt)}</td></tr>
            </table>
          </td>
        </tr>
      </table>
      <div class="rule"></div>
      <div class="section-label">總覽（四類分計）</div>
      <table class="kpi-table" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:25%" /><col style="width:25%" /><col style="width:25%" /><col style="width:25%" />
        </colgroup>
        <tr>
          <td class="c-jg"><span class="k-label">初中專科班出席</span><span class="k-value">${byKey.juniorGroup.presentVisits}</span></td>
          <td class="c-sg"><span class="k-label">高中專科班出席</span><span class="k-value">${byKey.seniorGroup.presentVisits}</span></td>
          <td class="c-jp"><span class="k-label">初中私人課程出席</span><span class="k-value">${byKey.juniorPrivate.presentVisits}</span></td>
          <td class="c-sp"><span class="k-label">高中私人課程出席</span><span class="k-value">${byKey.seniorPrivate.presentVisits}</span></td>
        </tr>
        <tr>
          <td><span class="k-label">全月班數</span><span class="k-value">${classTotal}</span></td>
          <td><span class="k-label">全月堂數</span><span class="k-value">${lessonTotal}</span></td>
          <td><span class="k-label">全月出席人次</span><span class="k-value">${presentTotal}</span></td>
          <td><span class="k-label">全月缺席人次</span><span class="k-value">${absentTotal}</span></td>
        </tr>
      </table>
      <div class="section-label">四類分計表</div>
      <table class="data" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:24%" /><col style="width:12%" /><col style="width:12%" />
          <col style="width:12%" /><col style="width:20%" /><col style="width:20%" />
        </colgroup>
        <thead>
          <tr>
            <th class="left">類別</th>
            <th class="num">年級數</th>
            <th class="num">班數</th>
            <th class="num">堂數</th>
            <th class="num">出席人次</th>
            <th class="num">缺席人次</th>
          </tr>
        </thead>
        <tbody>${categoryRowsHtml(cats, presentTotal, absentTotal)}</tbody>
      </table>
      <p class="footnote">人次＝每堂實際出席加總。初中＝中一至中三；高中＝中四至中六。專科班／私人課程分開計算。</p>
    </div>

    <div class="keep-block" data-block="grade-summary">
      <div class="section-label">各年級 × 類型小計</div>
      <table class="data" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:14%" /><col style="width:14%" /><col style="width:12%" />
          <col style="width:12%" /><col style="width:24%" /><col style="width:24%" />
        </colgroup>
        <thead>
          <tr>
            <th class="left">年級</th>
            <th class="left">類型</th>
            <th class="num">班數</th>
            <th class="num">堂數</th>
            <th class="num">出席人次</th>
            <th class="num">缺席人次</th>
          </tr>
        </thead>
        <tbody>${gradeSummaryRows}</tbody>
      </table>
    </div>

    <div class="keep-block" data-block="detail-label">
      <div class="section-label">堂次明細（含學生名單）</div>
    </div>
    ${detailBlocks}
  </div>
  <div id="pages-root"></div>
</body>
</html>`
}

export function teacherAttendancePdfFilename(teacher: SecondaryTeacherBlock, monthLabel: string): string {
  const name = teacher.name.replace(/[\\/:*?"<>|]+/g, "_")
  const month = monthLabel.replace(/[^\d-]+/g, "")
  return `老師出席計算_${name}_${month}.pdf`
}

/**
 * 依 keep-block 高度分頁後逐頁擷取，避免整張長圖硬切造成表格斷裂／重複。
 */
async function buildCalcPagePdfBlob(html: string, footerLabel: string): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  const iframe = document.createElement("iframe")
  iframe.setAttribute("title", "老師出席計算頁 PDF")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;min-height:1200px;border:0;opacity:0;pointer-events:none"
  document.body.appendChild(iframe)

  try {
    const doc = await new Promise<Document>((resolve, reject) => {
      iframe.onload = () => {
        const d = iframe.contentDocument
        if (!d) reject(new Error("無法讀取計算頁內容"))
        else resolve(d)
      }
      iframe.onerror = () => reject(new Error("計算頁載入失敗"))
      iframe.srcdoc = html
    })

    await new Promise<void>((r) => requestAnimationFrame(() => r()))

    const measureRoot = doc.getElementById("measure-root")
    const pagesRoot = doc.getElementById("pages-root")
    if (!measureRoot || !pagesRoot) throw new Error("計算頁結構不完整")

    const blocks = Array.from(measureRoot.querySelectorAll<HTMLElement>(".keep-block"))
    const PAGE_CONTENT_H = 980
    const GAP = 8

    type PageEl = HTMLElement
    const pages: PageEl[] = []
    let current: PageEl | null = null
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
      // 單塊超過一頁：仍整塊放入（不再中切表格）
      current!.appendChild(block.cloneNode(true))
      used += (used > 0 ? GAP : 0) + h
    }

    measureRoot.remove()

    pages.forEach((page, i) => {
      const foot = doc.createElement("div")
      foot.className = "page-foot"
      foot.textContent = `${footerLabel} · 第 ${i + 1} / ${pages.length} 頁`
      page.appendChild(foot)
    })

    await new Promise<void>((r) => requestAnimationFrame(() => r()))

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const marginX = 8
    const marginY = 8
    const contentW = 210 - marginX * 2

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

export async function downloadTeacherAttendancePdf(
  teacher: SecondaryTeacherBlock,
  yearMonth: string
): Promise<void> {
  const html = buildTeacherAttendanceCalcHtml(teacher, yearMonth)
  const footer = `明學管理系統 · 老師中學出席計算頁 · ${teacher.name} · ${yearMonth}`
  const blob = await buildCalcPagePdfBlob(html, footer)
  downloadBlob(blob, teacherAttendancePdfFilename(teacher, yearMonth))
}
