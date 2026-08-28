/** 日記帳附件：檔名／大小／類型規則。不含 React／DB。 */

export const EXPENSE_ATTACHMENT_BUCKET = "expense-journal-attachments"
export const EXPENSE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const EXPENSE_ATTACHMENT_ACCEPT =
  "image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "application/pdf"])

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "pdf"])

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
}

export function expenseAttachmentValidationError(file: File): string | null {
  if (file.size <= 0) return "附件檔案空白"
  if (file.size > EXPENSE_ATTACHMENT_MAX_BYTES) return "附件不可超過 10MB"
  const mime = file.type.trim().toLowerCase()
  const ext = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  if ((mime && ALLOWED_MIME.has(mime)) || ALLOWED_EXT.has(ext)) return null
  return "只接受 JPG、PNG 或 PDF"
}

export function expenseAttachmentContentType(file: File): string | undefined {
  const mime = file.type.trim().toLowerCase()
  if (mime && ALLOWED_MIME.has(mime)) return mime
  const ext = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  return MIME_BY_EXT[ext]
}

/** Storage 物件檔名只准英數與少數符號；畫面顯示用原檔名。 */
export function sanitizeExpenseAttachmentFilename(name: string): string {
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
