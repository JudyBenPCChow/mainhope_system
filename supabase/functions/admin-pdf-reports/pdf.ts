import { PDFDocument, rgb, type PDFFont, type PDFPage } from "https://esm.sh/pdf-lib@1.17.1"
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1"

import type { TrialPayload, TuitionPayload } from "./payload.ts"

const MM = 72 / 25.4
const FONT_URL =
  "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/TC/NotoSansTC-Regular.otf"

const INK = rgb(0x20 / 255, 0x20 / 255, 0x20 / 255)
const MUTED = rgb(0x5f / 255, 0x5f / 255, 0x5f / 255)
const LINE = rgb(0xbd / 255, 0xbd / 255, 0xbd / 255)
const HEADER = rgb(0xd9 / 255, 0xd9 / 255, 0xd9 / 255)
const HEADER_SOFT = rgb(0xe9 / 255, 0xec / 255, 0xef / 255)
const ALT = rgb(0xf7 / 255, 0xf7 / 255, 0xf7 / 255)
const ACCENT = rgb(0x31 / 255, 0x5f / 255, 0x66 / 255)

type Align = "left" | "center" | "right"

let fontBytes: Uint8Array | null = null

async function loadFontBytes(): Promise<Uint8Array> {
  if (fontBytes) return fontBytes
  const response = await fetch(FONT_URL)
  if (!response.ok) throw new Error(`中文字型下載失敗（${response.status}）`)
  fontBytes = new Uint8Array(await response.arrayBuffer())
  return fontBytes
}

const missingGlyphs = new Set<string>()

function glyph(font: PDFFont, ch: string): string {
  if (missingGlyphs.has(ch)) return "□"
  try {
    font.widthOfTextAtSize(ch, 10)
    return ch
  } catch {
    missingGlyphs.add(ch)
    return "□"
  }
}

function wrap(font: PDFFont, value: string, size: number, width: number): string[] {
  const paragraphs = String(value ?? "").split("\n")
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const safe = [...paragraph].map((ch) => glyph(font, ch)).join("")
    if (!safe) {
      lines.push("")
      continue
    }
    let current = ""
    for (const ch of safe) {
      const next = current + ch
      if (current && font.widthOfTextAtSize(next, size) > width) {
        lines.push(current)
        current = ch
      } else {
        current = next
      }
    }
    lines.push(current)
  }
  return lines.length > 0 ? lines : [""]
}

class Sheet {
  doc: PDFDocument
  font: PDFFont
  pageWidth: number
  pageHeight: number
  marginX: number
  marginTop: number
  marginBottom: number
  page: PDFPage
  y: number

  constructor(
    doc: PDFDocument,
    font: PDFFont,
    pageWidth: number,
    pageHeight: number,
    marginX: number,
    marginTop: number,
    marginBottom: number,
  ) {
    this.doc = doc
    this.font = font
    this.pageWidth = pageWidth
    this.pageHeight = pageHeight
    this.marginX = marginX
    this.marginTop = marginTop
    this.marginBottom = marginBottom
    this.page = doc.addPage([pageWidth, pageHeight])
    this.y = pageHeight - marginTop
  }

  contentWidth(): number {
    return this.pageWidth - this.marginX * 2
  }

  nextPage(): void {
    this.page = this.doc.addPage([this.pageWidth, this.pageHeight])
    this.y = this.pageHeight - this.marginTop
  }

  ensure(height: number): void {
    if (this.y - height < this.marginBottom) this.nextPage()
  }

  text(value: string, size: number, opts?: { align?: Align; color?: ReturnType<typeof rgb>; gap?: number }): void {
    const lines = wrap(this.font, value, size, this.contentWidth())
    const leading = size + 3
    this.ensure(lines.length * leading)
    for (const line of lines) {
      const width = this.font.widthOfTextAtSize(line, size)
      const align = opts?.align ?? "left"
      const x = align === "center"
        ? this.marginX + (this.contentWidth() - width) / 2
        : align === "right"
        ? this.pageWidth - this.marginX - width
        : this.marginX
      this.page.drawText(line, {
        x,
        y: this.y - size,
        size,
        font: this.font,
        color: opts?.color ?? INK,
      })
      this.y -= leading
    }
    this.y -= opts?.gap ?? 2
  }

  gap(mm: number): void {
    this.y -= mm * MM
  }

  table(headers: string[], rows: string[][], widthsMm: number[], opts?: { size?: number; header?: ReturnType<typeof rgb>; zebra?: boolean }): void {
    const size = opts?.size ?? 8
    const pad = 3
    const widths = widthsMm.map((mm) => mm * MM)
    const drawRow = (cells: string[], header: boolean, zebra: boolean) => {
      const wrapped = cells.map((cell, index) => wrap(this.font, cell, size, Math.max(8, widths[index] - pad * 2)))
      const height = Math.max(...wrapped.map((lines) => lines.length)) * (size + 3) + pad * 2
      if (this.y - height < this.marginBottom) this.nextPage()
      let x = this.marginX
      const top = this.y
      cells.forEach((_, index) => {
        this.page.drawRectangle({
          x,
          y: top - height,
          width: widths[index],
          height,
          color: header ? (opts?.header ?? HEADER) : zebra ? ALT : rgb(1, 1, 1),
          borderColor: LINE,
          borderWidth: 0.4,
        })
        let textY = top - pad - size
        for (const line of wrapped[index]) {
          this.page.drawText(line, { x: x + pad, y: textY, size, font: this.font, color: INK })
          textY -= size + 3
        }
        x += widths[index]
      })
      this.y -= height
    }
    drawRow(headers, true, false)
    rows.forEach((row, index) => drawRow(row, false, Boolean(opts?.zebra) && index % 2 === 1))
  }
}

async function document(landscape: boolean): Promise<{ doc: PDFDocument; sheet: Sheet }> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  // pdf-lib + fontkit 對 CJK 再 subset 會把字形映錯（畫面上變符號亂碼；文字抽取仍似正常）。
  // NotoSansTC SubsetOTF 已是繁中子集，直接整份嵌入即可。
  const font = await doc.embedFont(await loadFontBytes(), { subset: false })
  const pageWidth = landscape ? 841.89 : 595.28
  const pageHeight = landscape ? 595.28 : 841.89
  const marginX = (landscape ? 10 : 19.1) * MM
  const marginY = (landscape ? 10 : 25.4) * MM
  return {
    doc,
    sheet: new Sheet(doc, font, pageWidth, pageHeight, marginX, marginY, marginY),
  }
}

function money(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  return Math.round(n).toLocaleString("en-US")
}

function g(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return "0"
  return String(Math.round(n * 1000) / 1000)
}

export async function buildTrialPdf(payload: TrialPayload): Promise<Uint8Array> {
  const { doc, sheet } = await document(false)
  doc.setTitle("試堂名單（跟進轉化）")
  doc.setAuthor("明學教育")
  sheet.text("明學教育 · 試堂名單（未來試堂＋跟進轉化）", 14, { align: "center", gap: 4 })
  sheet.text(`${payload.periodCaption}　｜　查庫日 ${payload.asOf}　｜`, 9, { align: "center", color: MUTED, gap: 8 })
  sheet.text("一、待跟進轉化（已試堂、該科尚未轉正）", 12, { gap: 2 })
  sheet.text("點名已為「現場」，系統結果仍待跟進。轉正後請在試堂頁標「已轉化」。右欄「跟進」可手寫結果或下次聯絡日。", 11, { gap: 4 })
  const widths = [9, 20, 13, 23, 42, 32, 32.8]
  const follow = payload.followUpRows.map((row, index) => [
    String(index + 1),
    row.studentName,
    row.grade,
    row.contact || "—",
    `${row.classLabel}\n${row.teacher || "—"}`,
    `${row.trialDate}\n${row.time}`,
    row.actionHint || "跟進轉正",
  ])
  sheet.table(["#", "學生", "級別", "聯絡電話", "試堂班別", "試堂日", "跟進狀態"], follow, widths, { size: 9 })
  sheet.gap(4)
  sheet.text("二、未來試堂（自查庫日起）", 12, { gap: 2 })
  sheet.text("請核對出單／上紙；試堂當日完成點名後，改入上表跟進轉化。", 11, { gap: 4 })
  const upcoming = payload.upcomingRows.map((row, index) => [
    String(index + 1),
    row.studentName,
    row.grade,
    row.contact || "—",
    `${row.classLabel}\n${row.teacher || "—"}`,
    `${row.trialDate}\n${row.time}`,
    [row.trialType, row.payment || "—"].filter(Boolean).join(" · "),
  ])
  sheet.table(["#", "學生", "級別", "聯絡電話", "試堂班別", "試堂日", "時間"], upcoming, widths, { size: 9 })
  if (payload.otherFollowups.length > 0) {
    sheet.gap(4)
    sheet.text("其他跟進", 14, { gap: 3 })
    payload.otherFollowups.forEach((item, index) => sheet.text(`${index + 1}. ${item}`, 12, { gap: 2 }))
  }
  return doc.save()
}

export async function buildTuitionPdf(payload: TuitionPayload): Promise<Uint8Array> {
  const { doc, sheet } = await document(true)
  const [billYear, billMonth] = payload.homeworkBillingMonth.split("-")
  const monthLabel = `${Number(billYear)}年${Number(billMonth)}月`
  doc.setTitle(`未交學費名單（專科第二期＋功輔${monthLabel}）`)
  doc.setAuthor("明學教育")
  sheet.text(`明學教育 · 未交學費名單（專科第二期＋功輔${monthLabel}）`, 14, { align: "center", gap: 3 })
  sheet.text(`${payload.periodCaption}　｜　功輔按 ${monthLabel}月費　｜　查庫日 ${payload.asOf}`, 9, {
    align: "center",
    color: MUTED,
    gap: 2,
  })
  sheet.text(
    `合計 ${payload.combinedStudentCount} 人　｜　專科 HKD ${money(payload.totalAmount)}＋功輔 HKD ${money(payload.homeworkTotalAmount)}＝ HKD ${money(payload.combinedTotalAmount)}　｜　專科金額尚未計入逾期罰款（每科每月最高 $50；功輔不適用）`,
    8,
    { align: "center", color: MUTED, gap: 3 },
  )
  sheet.text("專科口徑與系統「學費追收」相同：本期要交＝max(0, 本期還會扣 − 尚餘可扣堂數)，含已上課未付款。功輔以繳費紀錄覆蓋月份為準（已收款且未作廢）；休學不計。", 8, { color: MUTED, gap: 4 })
  sheet.text("一、專科 · 常規第二期總表", 11, { color: ACCENT, gap: 2 })
  sheet.text(
    `學生 ${payload.studentCount} 人／${payload.poolCount} 組別　｜　要交合共 ${g(payload.totalDueLessons)} 堂　｜　學費小計 HKD ${money(payload.totalAmount)}`,
    8,
    { color: MUTED, gap: 3 },
  )
  const widths = [10, 22, 20, 12, 32, 16, 22, 142]
  const rows = (payload.rows as Array<Record<string, unknown>>).map((row, index) => [
    String(index + 1),
    String(row.studentCode ?? ""),
    String(row.studentName ?? ""),
    String(row.grade ?? ""),
    String(row.poolLabel ?? ""),
    g(row.dueLessons),
    money(row.amount),
    String(row.detailSummary ?? ""),
  ])
  sheet.table(["#", "學號", "學生", "年級", "組別", "要交堂數", "金額（HKD）", "科／堂／日期"], rows, widths, {
    size: 8,
    header: HEADER_SOFT,
    zebra: true,
  })
  sheet.gap(3)
  sheet.text("二、專科 · 逐人明細", 11, { color: ACCENT, gap: 2 })
  for (const row of payload.rows as Array<Record<string, unknown>>) {
    const arrears = Number(row.arrears) || 0
    let head = `${row.studentCode ?? ""} ${row.studentName ?? ""}（${row.grade || "—"}）— ${row.poolLabel ?? ""}　｜　尚餘 ${g(row.remaining)}　｜　還會扣 ${g(row.pending)}　｜　要交 ${g(row.dueLessons)} 堂　｜　HKD ${money(row.amount)}`
    if (arrears > 0) head += `　｜　已上課未付款 ${g(arrears)} 堂`
    sheet.text(head, 9, { gap: 1 })
    const lines = Array.isArray(row.chargeLines) ? row.chargeLines as Array<Record<string, unknown>> : []
    for (const charge of lines) {
      const kind = String(charge.kind ?? "")
      const prefix = kind === "已上課未付款" ? "〔已上課未付款〕" : ""
      const when = kind === "已上課未付款"
        ? String(charge.dateLabel ?? "")
        : `${charge.dateLabel ?? ""} ${charge.time ?? ""}`.trim()
      const unitPrice = charge.unitPrice == null ? null : Number(charge.unitPrice)
      const priceBit = unitPrice != null && Number.isFinite(unitPrice)
        ? ` @$${g(unitPrice)} = $${money(charge.amount)}`
        : charge.amount != null
        ? ` = $${money(charge.amount)}`
        : ""
      sheet.text(`• ${prefix}${when} ${charge.subject ?? ""} × ${g(charge.units)}堂${priceBit}`, 8, { gap: 1 })
    }
  }
  const homework = payload.homeworkRows as Array<Record<string, unknown>>
  if (homework.length > 0) {
    sheet.gap(3)
    sheet.text(`三、功課輔導班 · ${monthLabel}未繳`, 11, { color: ACCENT, gap: 2 })
    sheet.text(
      `學生 ${payload.homeworkStudentCount} 人　｜　月費小計 HKD ${money(payload.homeworkTotalAmount)}　｜　已繳以單據覆蓋月份為準；價目跟日數檔（中學部小學生跟中一價）`,
      8,
      { color: MUTED, gap: 3 },
    )
    sheet.table(
      ["#", "學號", "學生", "年級", "日數檔", "金額（HKD）", "說明"],
      homework.map((row, index) => [
        String(index + 1),
        String(row.studentCode ?? ""),
        String(row.studentName ?? ""),
        String(row.grade ?? ""),
        String(row.dayPlan ?? ""),
        money(row.amount),
        `${row.detailSummary ?? ""}；${row.lastPaidNote ?? ""}`.replace(/；$/, ""),
      ]),
      [10, 22, 22, 14, 16, 24, 168],
      { size: 8, header: HEADER_SOFT, zebra: true },
    )
  }
  const pages = doc.getPages()
  pages.forEach((page, index) => {
    page.drawText("明學教育 · 學費追收 · 專科第二期＋功輔", {
      x: 10 * MM,
      y: 6 * MM,
      size: 8,
      font: sheet.font,
      color: MUTED,
    })
    const label = `第 ${index + 1} 頁`
    const width = sheet.font.widthOfTextAtSize(label, 8)
    page.drawText(label, {
      x: page.getWidth() - 10 * MM - width,
      y: 6 * MM,
      size: 8,
      font: sheet.font,
      color: MUTED,
    })
  })
  return doc.save()
}
