import posterBackgroundUrl from "@/assets/promotion-match-poster-bg.png"

export type PromotionPosterClass = {
  label: string
  subject?: string | null
  schedule?: string | null
  teacherName?: string | null
}

export type PromotionPosterInput = {
  classes: PromotionPosterClass[]
}

/** 是否在卡片右上角顯示科目標籤 */
export const SHOW_SUBJECT_TAG = true

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

const SUBJECT_TAG_MAX_WIDTH_RATIO = 0.35

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
  if (classCount <= 4) return "standard"
  return "grid"
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

function truncateSubjectTagText(
  ctx: CanvasRenderingContext2D,
  subject: string,
  maxTextWidth: number,
  fontSize: number
): { text: string; fontSize: number } {
  const raw = subject.trim()
  if (!raw) return { text: "—", fontSize }

  const measure = (text: string, size: number) => {
    ctx.font = `700 ${size}px ${FONT}`
    return ctx.measureText(text).width
  }

  if (measure(raw, fontSize) <= maxTextWidth) {
    return { text: raw, fontSize }
  }

  if (fontSize > 12) {
    return truncateSubjectTagText(ctx, raw, maxTextWidth, fontSize - 2)
  }

  let clipped = ""
  for (const ch of raw) {
    if (measure(clipped + ch + "…", 12) > maxTextWidth) break
    clipped += ch
  }
  return { text: clipped ? `${clipped}…` : "…", fontSize: 12 }
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
  let gapY = Math.round(18 * scaleY)
  let prefMinH = Math.round(140 * scaleY)
  let prefMaxH = Math.round(160 * scaleY)
  let titleSize = Math.round(30 * scaleY)
  let subSize = Math.round(20 * scaleY)
  let compact = false

  if (mode === "standard") {
    gapY = Math.round(12 * scaleY)
    prefMinH = Math.round(110 * scaleY)
    prefMaxH = Math.round(130 * scaleY)
    titleSize = Math.round(26 * scaleY)
    subSize = Math.round(18 * scaleY)
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
    cardPad: compact ? Math.round(16 * scaleY) : Math.round(22 * scaleY),
    cardRadius: Math.round(16 * scaleY),
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
  fontSize: number
) {
  const iconSize = fontSize + 6
  const padX = 10
  const padY = 6
  ctx.font = `600 ${fontSize}px ${FONT}`
  const label = text.trim() || "—"
  const lines = wrapCanvasText(ctx, label, maxW - iconSize - padX * 2 - 8).slice(0, 1)
  const line = lines[0] ?? "—"
  const textW = ctx.measureText(line).width
  const w = Math.min(maxW, iconSize + 8 + textW + padX * 2)
  const h = iconSize + padY * 2

  ctx.fillStyle = bg
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()

  if (icon === "clock") drawClockIcon(ctx, x + padX, y + padY, iconSize)
  else drawPersonIcon(ctx, x + padX, y + padY, iconSize)

  ctx.fillStyle = PALETTE.ink
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(line, x + padX + iconSize + 8, y + h / 2)
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

function measureSubjectTagBox(
  ctx: CanvasRenderingContext2D,
  subject: string,
  cardW: number
): { width: number; height: number; text: string; fontSize: number } {
  const tagPadX = 16
  const tagH = 28
  const maxTagW = cardW * SUBJECT_TAG_MAX_WIDTH_RATIO
  const maxTextW = maxTagW - tagPadX * 2
  const { text, fontSize } = truncateSubjectTagText(ctx, subject, maxTextW, 14)
  ctx.font = `700 ${fontSize}px ${FONT}`
  const textW = ctx.measureText(text).width
  const width = Math.min(maxTagW, textW + tagPadX * 2)
  return { width, height: tagH, text, fontSize }
}

function drawSubjectTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  subject: string,
  cardW: number,
  measured?: ReturnType<typeof measureSubjectTagBox>
) {
  const style = getSubjectTagStyle(subject)
  const tagPadX = 16
  const box = measured ?? measureSubjectTagBox(ctx, subject, cardW)
  const { width: w, height: tagH, text, fontSize } = box

  ctx.font = `700 ${fontSize}px ${FONT}`
  ctx.fillStyle = style.bg
  roundRect(ctx, x - w, y, w, tagH, tagH / 2)
  ctx.fill()
  ctx.fillStyle = style.text
  ctx.textAlign = "right"
  ctx.textBaseline = "middle"
  ctx.fillText(text, x - tagPadX, y + tagH / 2)
}

function drawClassCard(
  ctx: CanvasRenderingContext2D,
  cls: PromotionPosterClass,
  index: number,
  x: number,
  y: number,
  layout: CardLayoutSpec
) {
  const { cardW, cardH, titleSize, subSize, compact, compactMetaMaxH, cardPad, cardRadius } =
    layout
  const pad = cardPad
  const radius = cardRadius

  ctx.save()
  ctx.shadowColor = "rgba(28, 36, 56, 0.12)"
  ctx.shadowBlur = compact ? 10 : 14
  ctx.shadowOffsetY = compact ? 3 : 5
  ctx.fillStyle = PALETTE.card
  roundRect(ctx, x, y, cardW, cardH, radius)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = PALETTE.cardBorder
  ctx.lineWidth = 1
  roundRect(ctx, x, y, cardW, cardH, radius)
  ctx.stroke()

  const badgeSize = compact ? 18 : 22
  drawNumberBadge(ctx, x + (compact ? 20 : 24), y + (compact ? 20 : 24), index, badgeSize)

  const title = displayClassTitle(cls.label)
  const code = extractClassCode(cls.label)
  const textX = x + pad + (compact ? 8 : 12)
  const badgeClearance = compact ? 8 : 12
  const subjectTagBox =
    SHOW_SUBJECT_TAG && cls.subject?.trim() && !compact
      ? measureSubjectTagBox(ctx, cls.subject, cardW)
      : null
  const subjectGap = subjectTagBox ? 14 : 0
  const textMaxW =
    cardW -
    pad * 2 -
    badgeClearance -
    (subjectTagBox ? subjectTagBox.width + subjectGap : 0)

  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillStyle = PALETTE.ink
  ctx.font = `700 ${titleSize}px ${FONT}`
  const titleLines = wrapCanvasText(ctx, title, textMaxW).slice(0, compact ? 1 : 2)
  let cursorY = y + pad + (compact ? 4 : 8)
  for (const line of titleLines) {
    ctx.fillText(line, textX, cursorY)
    cursorY += titleSize + 4
  }

  if (code && !compact) {
    ctx.fillStyle = PALETTE.mutedLight
    ctx.font = `500 ${subSize - 2}px ${FONT}`
    ctx.fillText(code, textX, cursorY + 2)
    cursorY += subSize + 6
  } else {
    cursorY += 6
  }

  if (SHOW_SUBJECT_TAG && cls.subject?.trim() && !compact && subjectTagBox) {
    drawSubjectTag(
      ctx,
      x + cardW - pad,
      y + pad,
      cls.subject,
      cardW,
      subjectTagBox
    )
  }

  const schedule = (cls.schedule?.trim() || "—").replace(/\s+/g, " ")
  const teacher = cls.teacherName?.trim() || "—"

  if (compact && cardH < compactMetaMaxH) {
    ctx.fillStyle = PALETTE.muted
    ctx.font = `500 ${subSize}px ${FONT}`
    const meta = `${schedule} · ${teacher}`
    const metaLine = wrapCanvasText(ctx, meta, textMaxW).slice(0, 1)[0] ?? "—"
    ctx.textBaseline = "bottom"
    ctx.fillText(metaLine, textX, y + cardH - pad)
    ctx.textBaseline = "top"
    return
  }

  const tagMaxW = compact ? (cardW - pad * 2) / 2 - 6 : 260
  const tagY = y + cardH - pad - (compact ? 30 : 34)

  drawPillTag(ctx, textX, tagY, tagMaxW, schedule, PALETTE.accentSoft, "clock", subSize)
  drawPillTag(
    ctx,
    textX + tagMaxW + (compact ? 10 : 14),
    tagY,
    tagMaxW,
    teacher,
    PALETTE.tagBlue,
    "person",
    compact ? subSize - 1 : subSize
  )
}

/**
 * 以 Canvas 產生宣傳海報（data URL）。
 * 背景以原圖像素尺寸 1:1 繪製，僅在中間區域疊加班別卡片文字。
 */
export async function renderPromotionMatchPoster(
  input: PromotionPosterInput
): Promise<string> {
  const classes = input.classes.filter((c) => c.label.trim())
  if (classes.length === 0) {
    throw new Error("請先選擇至少一個推薦班別")
  }

  const background = await loadPosterBackground()
  const spec = buildPosterCanvasSpec(background.naturalWidth, background.naturalHeight)

  const canvas = document.createElement("canvas")
  canvas.width = spec.width
  canvas.height = spec.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("瀏覽器不支援 Canvas")

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(background, 0, 0)

  const layout = computeCardLayout(classes.length, spec)

  classes.forEach((cls, index) => {
    const col = index % layout.cols
    const row = Math.floor(index / layout.cols)
    const x = layout.contentX + col * (layout.cardW + layout.gapX)
    const y = layout.startY + row * (layout.cardH + layout.gapY)
    drawClassCard(ctx, cls, index, x, y, layout)
  })

  return canvas.toDataURL("image/png")
}

/** 測試／預覽用：產生指定班別數量的假資料 */
export function buildSamplePosterClasses(count: number): PromotionPosterClass[] {
  const samples: PromotionPosterClass[] = [
    {
      label: "Summer S5 Math M2 Class (26SM-M2M5013-A)",
      subject: "數學延伸部分（單）",
      schedule: "星期一 18:00-19:30",
      teacherName: "Mr. Ng",
    },
    {
      label: "Summer S5 Physics Class (26SM-PHYS5015-A)",
      subject: "物理",
      schedule: "星期三 17:45-19:00",
      teacherName: "Dr. Lam",
    },
    {
      label: "Summer S5 Chinese Class (26SM-CHIS5008-A)",
      subject: "中國語文",
      schedule: "星期二 11:30-12:45",
      teacherName: "Christine Fan",
    },
    {
      label: "Summer S5 English Class (26SM-ENGS5009-A)",
      subject: "English Language",
      schedule: "星期三 17:45-19:00",
      teacherName: "Mr. Lee",
    },
    {
      label: "Summer S5 Chemistry Class (26SM-CHEM5010-A)",
      subject: "化學",
      schedule: "星期四 19:15-20:30",
      teacherName: "Dr. Wong",
    },
    {
      label: "Summer S5 Biology Class (26SM-BIO5011-A)",
      subject: "生物",
      schedule: "星期五 16:00-17:15",
      teacherName: "Ms. Chan",
    },
    {
      label: "Summer S5 Economics Class (26SM-ECON5014-A)",
      subject: "經濟",
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
      schedule: "星期一、星期二 11:30",
      teacherName: "Rafael Ling",
    },
  ]
}
