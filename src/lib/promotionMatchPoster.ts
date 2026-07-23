import posterBackgroundUrl from "@/assets/promotion-match-poster-bg.png"

export type PromotionPosterClass = {
  label: string
  subject?: string | null
  /** 合併顯示用（兼容舊呼叫）；有 dayOfWeek／timeSlot 時優先用分欄 */
  schedule?: string | null
  dayOfWeek?: string | null
  timeSlot?: string | null
  teacherName?: string | null
}

export type PromotionPosterInput = {
  classes: PromotionPosterClass[]
}

/** 每張宣傳海報最多展示的班別數；超過則分頁產生多張圖 */
export const POSTER_CLASSES_PER_IMAGE = 4

export type PosterLayoutMode = "large" | "standard" | "grid"

export type CardLayoutSpec = {
  mode: PosterLayoutMode
  cols: number
  rows: number
  cardW: number
  cardH: number
  gapX: number
  gapY: number
  contentX: number
  contentAreaTop: number
  contentAreaHeight: number
  startY: number
  contentW: number
  titleSize: number
  subSize: number
  compact: boolean
  centered: boolean
  compactMetaMaxH: number
  cardPad: number
  cardRadius: number
}

export type PosterCanvasSpec = {
  width: number
  height: number
  sidePad: number
  contentAreaTop: number
  contentAreaBottom: number
  contentTopPad: number
  contentBottomPad: number
  scaleX: number
  scaleY: number
}

/** 背景模板原圖尺寸（819×1024） */
export const POSTER_BACKGROUND_SIZE = { width: 819, height: 1024 } as const

const LAYOUT_REF_WIDTH = 1080
const LAYOUT_REF_HEIGHT = 1080

/** 依背景原圖尺寸等比縮放版面常數（參考 1080 設計稿） */
export function buildPosterCanvasSpec(
  width: number,
  height: number
): PosterCanvasSpec {
  const scaleX = width / LAYOUT_REF_WIDTH
  const scaleY = height / LAYOUT_REF_HEIGHT
  return {
    width,
    height,
    sidePad: Math.round(48 * scaleX),
    contentAreaTop: Math.round(318 * scaleY),
    contentAreaBottom: Math.round(900 * scaleY),
    contentTopPad: Math.round(16 * scaleY),
    contentBottomPad: Math.round(16 * scaleY),
    scaleX,
    scaleY,
  }
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  數學: { bg: "#e6f0ff", text: "#1d4ed8" },
  物理: { bg: "#fdeee6", text: "#c2410c" },
  化學: { bg: "#eafaf0", text: "#15803d" },
  英文: { bg: "#f3eafd", text: "#7e22ce" },
  中文: { bg: "#fdf0f3", text: "#be185d" },
  通識: { bg: "#eef7fa", text: "#0e7490" },
  生物: { bg: "#ecfccb", text: "#3f6212" },
  經濟: { bg: "#fce7f3", text: "#9d174d" },
  "企業、會計與財務概論": { bg: "#fef3c7", text: "#92400e" },
  財務概論: { bg: "#fef3c7", text: "#92400e" },
  企會財: { bg: "#fef3c7", text: "#92400e" },
  企業: { bg: "#fef3c7", text: "#92400e" },
  BAFS: { bg: "#fef3c7", text: "#92400e" },
  會計: { bg: "#fef3c7", text: "#92400e" },
}

const DEFAULT_SUBJECT_COLOR = { bg: "#f1f0ec", text: "#57534e" }

const SUBJECT_COLOR_KEYWORDS = Object.keys(SUBJECT_COLORS).sort(
  (a, b) => b.length - a.length
)

const PALETTE = {
  navy: "#243357",
  navyDeep: "#1a2540",
  accent: "#e87722",
  accentSoft: "#f3ebdb",
  bg: "#f7f5f0",
  card: "#ffffff",
  cardBorder: "#e5e0d5",
  ink: "#1c2438",
  muted: "#6b7280",
  mutedLight: "#9b9791",
  tagBlue: "#e9edf5",
  white: "#ffffff",
} as const

const FONT =
  "'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', 'Hiragino Sans GB', sans-serif"

const CLASS_CODE_SUFFIX_RE = /\s*[（(]([^）)]+)[）)]\s*$/
const CLASS_CODE_STRIP_RE = /\s*[（(][^）)]+[）)]\s*$/

/** 依 canvas 量度把文字折行（繁中亦可）。 */
export function wrapCanvasText(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number
): string[] {
  const raw = text.trim()
  if (!raw) return []
  if (ctx.measureText(raw).width <= maxWidth) return [raw]

  const lines: string[] = []
  let current = ""
  for (const ch of raw) {
    const next = current + ch
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current)
      current = ch
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

export function getPosterLayoutMode(classCount: number): PosterLayoutMode {
  if (classCount <= 2) return "large"
  if (classCount <= POSTER_CLASSES_PER_IMAGE) return "standard"
  return "grid"
}

/** 將班別依每張最多 4 班切成多頁（5–8 → 2 張，9–12 → 3 張…） */
export function chunkPosterClasses<T>(
  classes: T[],
  perImage: number = POSTER_CLASSES_PER_IMAGE
): T[][] {
  const size = Math.max(1, perImage)
  if (classes.length === 0) return []
  const pages: T[][] = []
  for (let i = 0; i < classes.length; i += size) {
    pages.push(classes.slice(i, i + size))
  }
  return pages
}

export function extractClassCode(label: string): string | null {
  const match = CLASS_CODE_SUFFIX_RE.exec(label.trim())
  return match?.[1]?.trim() ?? null
}

export function displayClassTitle(label: string): string {
  const trimmed = label.trim()
  const withoutCode = trimmed.replace(CLASS_CODE_STRIP_RE, "").trim()
  return withoutCode || trimmed
}

const TIME_RANGE_RE =
  /(\d{1,2}:\d{2})\s*[–—\-至到]\s*(\d{1,2}:\d{2})/
const TIME_ONLY_RE = /\d{1,2}:\d{2}/

/** 將時間字串正規成「14:00 - 15:00」 */
export function formatPosterTimeSlot(raw: string | null | undefined): string {
  const t = (raw ?? "").trim()
  if (!t) return ""
  const range = TIME_RANGE_RE.exec(t)
  if (range) return `${range[1]} - ${range[2]}`
  return t.replace(/\s*[–—]\s*/g, " - ")
}

/** 星期顯示：補上「逢」前綴（已有則不重複） */
export function formatPosterWeekday(raw: string | null | undefined): string {
  const day = (raw ?? "").trim()
  if (!day) return ""
  if (day.startsWith("逢")) return day
  return `逢${day}`
}

/**
 * 拆成海報用的「逢星期」與「時段」兩行。
 * 優先用獨立欄位；否則從合併 schedule 字串解析。
 */
export function splitPosterSchedule(cls: {
  schedule?: string | null
  dayOfWeek?: string | null
  timeSlot?: string | null
}): { weekday: string; time: string } {
  const dayField = (cls.dayOfWeek ?? "").trim()
  const timeField = formatPosterTimeSlot(cls.timeSlot)
  if (dayField || timeField) {
    return {
      weekday: formatPosterWeekday(dayField) || "—",
      time: timeField || "—",
    }
  }

  const raw = (cls.schedule ?? "").trim().replace(/\s+/g, " ")
  if (!raw) return { weekday: "—", time: "—" }

  const range = TIME_RANGE_RE.exec(raw)
  if (range) {
    const time = `${range[1]} - ${range[2]}`
    const dayPart = raw.slice(0, range.index).trim().replace(/[，,]$/, "")
    return {
      weekday: formatPosterWeekday(dayPart) || "—",
      time,
    }
  }

  const timeOnly = TIME_ONLY_RE.exec(raw)
  if (timeOnly && timeOnly.index !== undefined && timeOnly.index > 0) {
    return {
      weekday: formatPosterWeekday(raw.slice(0, timeOnly.index).trim()) || "—",
      time: formatPosterTimeSlot(raw.slice(timeOnly.index)) || "—",
    }
  }

  if (TIME_ONLY_RE.test(raw) && !/星期|週|周/.test(raw)) {
    return { weekday: "—", time: formatPosterTimeSlot(raw) || raw }
  }

  return { weekday: formatPosterWeekday(raw) || raw, time: "—" }
}

/** 在可用寬度內盡量放大文字字級 */
function fitTextFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  preferredSize: number,
  minSize: number,
  weight = 700
): number {
  let size = preferredSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT}`
    if (ctx.measureText(text).width <= maxWidth) return size
    size -= 1
  }
  return minSize
}

export function getSubjectTagStyle(subject: string | null | undefined): {
  bg: string
  text: string
} {
  const s = (subject ?? "").trim()
  if (!s) return DEFAULT_SUBJECT_COLOR

  for (const keyword of SUBJECT_COLOR_KEYWORDS) {
    if (s.includes(keyword)) return SUBJECT_COLORS[keyword]
  }

  if (/English|EN(?![A-Za-z])/i.test(s)) return SUBJECT_COLORS.英文
  if (/Chinese|中國語文/i.test(s)) return SUBJECT_COLORS.中文
  if (/Physics/i.test(s)) return SUBJECT_COLORS.物理
  if (/Chem/i.test(s)) return SUBJECT_COLORS.化學
  if (/Bio/i.test(s)) return SUBJECT_COLORS.生物
  if (/Math|MATH/i.test(s)) return SUBJECT_COLORS.數學
  if (/Econ/i.test(s)) return SUBJECT_COLORS.經濟

  return DEFAULT_SUBJECT_COLOR
}

function getContentAreaBounds(spec: PosterCanvasSpec) {
  const contentAreaTop = spec.contentAreaTop + spec.contentTopPad
  const contentAreaBottom = spec.contentAreaBottom - spec.contentBottomPad
  const contentAreaHeight = contentAreaBottom - contentAreaTop
  return { contentAreaTop, contentAreaBottom, contentAreaHeight }
}

export function computeCardLayout(
  classCount: number,
  spec: PosterCanvasSpec = buildPosterCanvasSpec(
    POSTER_BACKGROUND_SIZE.width,
    POSTER_BACKGROUND_SIZE.height
  )
): CardLayoutSpec {
  const mode = getPosterLayoutMode(classCount)
  const { contentAreaTop, contentAreaHeight } = getContentAreaBounds(spec)
  const contentX = spec.sidePad
  const contentW = spec.width - spec.sidePad * 2
  const { scaleX, scaleY } = spec

  let cols = 1
  let gapX = 0
  let gapY = Math.round(14 * scaleY)
  // 橫向列卡：較扁，方便 4 班直向堆疊
  let prefMinH = Math.round(96 * scaleY)
  let prefMaxH = Math.round(118 * scaleY)
  let titleSize = Math.round(22 * scaleY)
  let subSize = Math.round(16 * scaleY)
  let compact = false

  if (mode === "standard") {
    gapY = Math.round(10 * scaleY)
    prefMinH = Math.round(82 * scaleY)
    prefMaxH = Math.round(98 * scaleY)
    titleSize = Math.round(18 * scaleY)
    subSize = Math.round(14 * scaleY)
  } else if (mode === "grid") {
    cols = 2
    gapX = Math.round(16 * scaleX)
    gapY = Math.round(10 * scaleY)
    prefMinH = Math.round(86 * scaleY)
    prefMaxH = Math.round(118 * scaleY)
    compact = true
  }

  const rows = Math.ceil(classCount / cols)
  const cardW = cols === 2 ? (contentW - gapX) / cols : contentW
  const preferredBlockH = rows * prefMaxH + (rows - 1) * gapY

  let cardH = prefMaxH
  let startY = contentAreaTop
  let centered = false

  if (preferredBlockH < contentAreaHeight) {
    centered = true
    const totalCardsHeight = preferredBlockH
    startY = contentAreaTop + (contentAreaHeight - totalCardsHeight) / 2
  } else {
    cardH = (contentAreaHeight - (rows - 1) * gapY) / rows
    if (cardH > prefMaxH) cardH = prefMaxH
    if (cardH < prefMinH) cardH = Math.max(Math.round(72 * scaleY), cardH)
    startY = contentAreaTop
  }

  if (mode === "grid") {
    titleSize = cardH >= Math.round(100 * scaleY) ? Math.round(22 * scaleY) : Math.round(19 * scaleY)
    subSize = cardH >= Math.round(100 * scaleY) ? Math.round(16 * scaleY) : Math.round(14 * scaleY)
  }

  return {
    mode,
    cols,
    rows,
    cardW,
    cardH,
    gapX,
    gapY,
    contentX,
    contentAreaTop,
    contentAreaHeight,
    startY,
    contentW,
    titleSize,
    subSize,
    compact,
    centered,
    compactMetaMaxH: Math.round(102 * scaleY),
    cardPad: compact
      ? Math.round(12 * scaleY)
      : mode === "standard"
        ? Math.round(12 * scaleY)
        : Math.round(14 * scaleY),
    cardRadius: Math.round(18 * scaleY),
  }
}

function loadPosterBackground(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("無法載入宣傳海報背景"))
    img.src = posterBackgroundUrl
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawClockIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = size / 2
  ctx.strokeStyle = PALETTE.accent
  ctx.fillStyle = PALETTE.accentSoft
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + r, y + r)
  ctx.lineTo(x + r, y + r - r * 0.45)
  ctx.moveTo(x + r, y + r)
  ctx.lineTo(x + r + r * 0.35, y + r)
  ctx.stroke()
}

function drawPersonIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = size / 2
  ctx.strokeStyle = PALETTE.navy
  ctx.fillStyle = PALETTE.tagBlue
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + r, y + r - 2, r * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = PALETTE.navy
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + r, y + r + r * 0.55, r * 0.38, Math.PI, 0)
  ctx.stroke()
}

function drawPillTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW: number,
  text: string,
  bg: string,
  icon: "clock" | "person",
  fontSize: number,
  options?: { fillWidth?: boolean; fontWeight?: number; padX?: number; padY?: number }
) {
  const fillWidth = options?.fillWidth ?? false
  const fontWeight = options?.fontWeight ?? 600
  const padX = options?.padX ?? Math.max(10, Math.round(fontSize * 0.45))
  const padY = options?.padY ?? Math.max(6, Math.round(fontSize * 0.28))
  const iconSize = Math.round(fontSize + (fillWidth ? 8 : 6))
  const gap = Math.max(8, Math.round(fontSize * 0.35))
  ctx.font = `${fontWeight} ${fontSize}px ${FONT}`
  const label = text.trim() || "—"
  const lines = wrapCanvasText(ctx, label, maxW - iconSize - padX * 2 - gap).slice(0, 1)
  const line = lines[0] ?? "—"
  const textW = ctx.measureText(line).width
  const contentW = iconSize + gap + textW + padX * 2
  const w = fillWidth ? maxW : Math.min(maxW, contentW)
  const h = iconSize + padY * 2

  ctx.fillStyle = bg
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()

  if (icon === "clock") drawClockIcon(ctx, x + padX, y + padY, iconSize)
  else drawPersonIcon(ctx, x + padX, y + padY, iconSize)

  ctx.fillStyle = PALETTE.ink
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(line, x + padX + iconSize + gap, y + h / 2)
  return { w, h }
}

function drawNumberBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
  size: number
) {
  const grad = ctx.createRadialGradient(x, y, 2, x, y, size)
  grad.addColorStop(0, "#f6a623")
  grad.addColorStop(1, PALETTE.accent)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = PALETTE.white
  ctx.font = `800 ${Math.round(size * 0.72)}px ${FONT}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(String(index + 1).padStart(2, "0"), x, y + 1)
}

function drawClassCard(
  ctx: CanvasRenderingContext2D,
  cls: PromotionPosterClass,
  index: number,
  x: number,
  y: number,
  layout: CardLayoutSpec
) {
  const { cardW, cardH, titleSize, subSize, compact, cardPad, cardRadius } = layout
  const pad = cardPad
  const radius = cardRadius

  ctx.save()
  ctx.shadowColor = "rgba(28, 36, 56, 0.12)"
  ctx.shadowBlur = compact ? 8 : 12
  ctx.shadowOffsetY = compact ? 2 : 4
  ctx.fillStyle = PALETTE.card
  roundRect(ctx, x, y, cardW, cardH, radius)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = PALETTE.cardBorder
  ctx.lineWidth = 1
  roundRect(ctx, x, y, cardW, cardH, radius)
  ctx.stroke()

  const title = displayClassTitle(cls.label)
  const code = extractClassCode(cls.label)
  const { weekday, time } = splitPosterSchedule(cls)
  const teacher = cls.teacherName?.trim() || "—"

  // 手繪排版：橫向三欄 ——① 班別｜逢星期＋時間｜老師 pill
  const badgeSize = Math.min(compact ? 16 : 20, Math.round(cardH * 0.28))
  const colGap = Math.max(8, Math.round(cardW * 0.018))
  const teacherColW = Math.round(cardW * (compact ? 0.26 : 0.24))
  const scheduleColW = Math.round(cardW * (compact ? 0.3 : 0.32))
  const leftColW = cardW - pad * 2 - badgeSize - colGap * 3 - scheduleColW - teacherColW

  const badgeX = x + pad + badgeSize / 2
  const badgeY = y + cardH / 2
  drawNumberBadge(ctx, badgeX, badgeY, index, badgeSize)

  const leftX = x + pad + badgeSize + colGap
  const scheduleX = leftX + leftColW + colGap
  const teacherColX = scheduleX + scheduleColW + colGap

  const innerH = cardH - pad * 2
  const lineGap = Math.max(3, Math.round(innerH * 0.08))

  // 左欄：班名（上）＋代碼（下）
  let classTitleSize = titleSize
  let codeSize = Math.max(11, subSize - 1)
  ctx.font = `700 ${classTitleSize}px ${FONT}`
  let titleLine = wrapCanvasText(ctx, title, leftColW).slice(0, 1)[0] ?? title
  classTitleSize = fitTextFontSize(ctx, titleLine, leftColW, classTitleSize, 13)
  ctx.font = `700 ${classTitleSize}px ${FONT}`
  titleLine = wrapCanvasText(ctx, title, leftColW).slice(0, 1)[0] ?? title
  if (code) {
    codeSize = fitTextFontSize(ctx, code, leftColW, codeSize, 10, 600)
  }

  const leftBlockH = classTitleSize + (code ? lineGap + codeSize : 0)
  let leftY = y + (cardH - leftBlockH) / 2

  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillStyle = PALETTE.ink
  ctx.font = `700 ${classTitleSize}px ${FONT}`
  ctx.fillText(titleLine, leftX, leftY)
  if (code) {
    ctx.fillStyle = PALETTE.muted
    ctx.font = `600 ${codeSize}px ${FONT}`
    ctx.fillText(code, leftX, leftY + classTitleSize + lineGap)
  }

  // 中欄：逢星期（上）＋時段（下），放大填滿欄寬
  const weekdayPreferred = Math.min(
    Math.round(titleSize * 1.15),
    Math.round(innerH * 0.38)
  )
  const timePreferred = Math.min(
    Math.round(titleSize * 1.25),
    Math.round(innerH * 0.42)
  )
  const weekdaySize = fitTextFontSize(ctx, weekday, scheduleColW, weekdayPreferred, 12)
  const timeSize = fitTextFontSize(ctx, time, scheduleColW, timePreferred, 13)
  const scheduleBlockH = weekdaySize + lineGap + timeSize
  const scheduleTop = y + (cardH - scheduleBlockH) / 2

  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillStyle = PALETTE.ink
  ctx.font = `700 ${weekdaySize}px ${FONT}`
  ctx.fillText(weekday, scheduleX, scheduleTop)
  ctx.fillStyle = PALETTE.navyDeep
  ctx.font = `700 ${timeSize}px ${FONT}`
  ctx.fillText(time, scheduleX, scheduleTop + weekdaySize + lineGap)

  // 右欄：老師名稱 pill（垂直置中）
  const teacherFont = Math.max(
    12,
    fitTextFontSize(
      ctx,
      teacher,
      Math.max(40, teacherColW - 36),
      Math.max(13, subSize),
      11,
      600
    )
  )
  const teacherPadY = Math.max(4, Math.round(teacherFont * 0.22))
  const teacherH = teacherFont + 6 + teacherPadY * 2
  const teacherY = y + (cardH - teacherH) / 2
  drawPillTag(
    ctx,
    teacherColX,
    teacherY,
    teacherColW,
    teacher,
    PALETTE.tagBlue,
    "person",
    teacherFont,
    { padY: teacherPadY }
  )
}

function renderPosterPage(
  background: HTMLImageElement,
  pageClasses: PromotionPosterClass[],
  indexOffset: number
): string {
  const spec = buildPosterCanvasSpec(background.naturalWidth, background.naturalHeight)
  const canvas = document.createElement("canvas")
  canvas.width = spec.width
  canvas.height = spec.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("瀏覽器不支援 Canvas")

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(background, 0, 0)

  const layout = computeCardLayout(pageClasses.length, spec)

  pageClasses.forEach((cls, index) => {
    const col = index % layout.cols
    const row = Math.floor(index / layout.cols)
    const x = layout.contentX + col * (layout.cardW + layout.gapX)
    const y = layout.startY + row * (layout.cardH + layout.gapY)
    drawClassCard(ctx, cls, indexOffset + index, x, y, layout)
  })

  return canvas.toDataURL("image/png")
}

/**
 * 以 Canvas 產生宣傳海報（data URL 陣列）。
 * 每張最多 4 班；超過則依序分頁（5–8 → 2 張，9–12 → 3 張…）。
 * 背景以原圖像素尺寸 1:1 繪製，僅在中間區域疊加班別卡片文字。
 */
export async function renderPromotionMatchPoster(
  input: PromotionPosterInput
): Promise<string[]> {
  const classes = input.classes.filter((c) => c.label.trim())
  if (classes.length === 0) {
    throw new Error("請先選擇至少一個推薦班別")
  }

  const background = await loadPosterBackground()
  const pages = chunkPosterClasses(classes, POSTER_CLASSES_PER_IMAGE)

  return pages.map((pageClasses, pageIndex) =>
    renderPosterPage(background, pageClasses, pageIndex * POSTER_CLASSES_PER_IMAGE)
  )
}

/** 測試／預覽用：產生指定班別數量的假資料 */
export function buildSamplePosterClasses(count: number): PromotionPosterClass[] {
  const samples: PromotionPosterClass[] = [
    {
      label: "Summer S5 Math M2 Class (26SM-M2M5013-A)",
      subject: "數學延伸部分（單）",
      dayOfWeek: "星期一",
      timeSlot: "18:00-19:30",
      schedule: "星期一 18:00-19:30",
      teacherName: "Mr. Ng",
    },
    {
      label: "Summer S5 Physics Class (26SM-PHYS5015-A)",
      subject: "物理",
      dayOfWeek: "星期三",
      timeSlot: "17:45-19:00",
      schedule: "星期三 17:45-19:00",
      teacherName: "Dr. Lam",
    },
    {
      label: "Summer S5 Chinese Class (26SM-CHIS5008-A)",
      subject: "中國語文",
      dayOfWeek: "星期二",
      timeSlot: "11:30-12:45",
      schedule: "星期二 11:30-12:45",
      teacherName: "Christine Fan",
    },
    {
      label: "Summer S5 English Class (26SM-ENGS5009-A)",
      subject: "English Language",
      dayOfWeek: "星期三",
      timeSlot: "17:45-19:00",
      schedule: "星期三 17:45-19:00",
      teacherName: "Mr. Lee",
    },
    {
      label: "Summer S5 Chemistry Class (26SM-CHEM5010-A)",
      subject: "化學",
      dayOfWeek: "星期四",
      timeSlot: "19:15-20:30",
      schedule: "星期四 19:15-20:30",
      teacherName: "Dr. Wong",
    },
    {
      label: "Summer S5 Biology Class (26SM-BIO5011-A)",
      subject: "生物",
      dayOfWeek: "星期五",
      timeSlot: "16:00-17:15",
      schedule: "星期五 16:00-17:15",
      teacherName: "Ms. Chan",
    },
    {
      label: "Summer S5 Economics Class (26SM-ECON5014-A)",
      subject: "經濟",
      dayOfWeek: "星期日",
      timeSlot: "14:00-15:30",
      schedule: "星期日 14:00-15:30",
      teacherName: "Ms. Cheung",
    },
  ]
  return samples.slice(0, count)
}

/** 測試／預覽用：截圖中的真實 BAFS 單班情境 */
export function buildBafsPosterSample(): PromotionPosterClass[] {
  return [
    {
      label: "暑期升中五級企會財班 (26SM-BAFSS5 008-A)",
      subject: "企業、會計與財務概論",
      dayOfWeek: "星期一、星期二",
      timeSlot: "11:30",
      schedule: "星期一、星期二 11:30",
      teacherName: "Rafael Ling",
    },
  ]
}
