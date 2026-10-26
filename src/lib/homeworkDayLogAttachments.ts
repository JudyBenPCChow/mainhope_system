/** 功輔每日紀錄：附件規則與壓縮（純工具，無 React／DB）。 */

export const HW_DAY_LOG_ATTACHMENT_BUCKET = "homework-day-log-attachments"
export const HW_DAY_LOG_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const HW_DAY_LOG_ATTACHMENT_MAX_PER_DAY = 10
export const HW_DAY_LOG_ATTACHMENT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
export const HW_DAY_LOG_IMAGE_MAX_EDGE = 2048
export const HW_DAY_LOG_JPEG_QUALITY = 0.82

export type HwDayLogAttachmentKind = "handbook" | "dictation" | "other"
export type HwHandbookStatus = "has_photo" | "no_handbook" | "no_homework"
export type HwFollowupKind = "homework" | "dictation"

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"])
const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
}

export function hwDayLogAttachmentValidationError(file: File): string | null {
  if (file.size <= 0) return "附件檔案空白"
  if (file.size > HW_DAY_LOG_ATTACHMENT_MAX_BYTES) return "附件不可超過 10MB"
  const mime = file.type.trim().toLowerCase()
  const ext = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  if ((mime && ALLOWED_MIME.has(mime)) || ALLOWED_EXT.has(ext)) return null
  return "只接受 JPG、PNG、WebP 或 HEIC"
}

export function hwDayLogAttachmentContentType(file: File): string | undefined {
  const mime = file.type.trim().toLowerCase()
  if (mime && ALLOWED_MIME.has(mime)) return mime
  const ext = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  return MIME_BY_EXT[ext]
}

export function sanitizeHwDayLogAttachmentFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "")
  const lastDot = base.lastIndexOf(".")
  const extRaw = lastDot >= 0 ? base.slice(lastDot + 1) : ""
  const stemRaw = lastDot >= 0 ? base.slice(0, lastDot) : base
  const ext = extRaw.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toLowerCase()
  const stem = stemRaw
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^[._-]+/, "")
    .slice(0, 60)
  const safeStem = stem || "attachment"
  return ext ? `${safeStem}.${ext}` : safeStem
}

/** 瀏覽器端縮圖；失敗則回傳原檔。 */
export async function compressHwDayLogImage(file: File): Promise<File> {
  const mime = hwDayLogAttachmentContentType(file) ?? file.type
  if (!mime.startsWith("image/") || mime.includes("heic") || mime.includes("heif")) {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(
      1,
      HW_DAY_LOG_IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height)
    )
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", HW_DAY_LOG_JPEG_QUALITY)
    )
    if (!blob || blob.size <= 0) return file
    const base = sanitizeHwDayLogAttachmentFilename(file.name).replace(/\.[^.]+$/, "")
    return new File([blob], `${base || "photo"}.jpg`, { type: "image/jpeg" })
  } catch {
    return file
  }
}

export function buildHwDayLogStoragePath(opts: {
  academicYearLabel: string
  studentId: string
  logDate: string
  kind: HwDayLogAttachmentKind
  fileName: string
}): string {
  const year = opts.academicYearLabel.replace(/[^A-Za-z0-9_-]/g, "") || "year"
  const safeName = sanitizeHwDayLogAttachmentFilename(opts.fileName)
  return `${year}/${opts.studentId}/${opts.logDate}/${opts.kind}_${crypto.randomUUID()}-${safeName}`
}
