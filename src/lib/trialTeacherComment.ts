/** 試堂老師評語：上線日（香港日）。當日及以前不催老師回填。 */
export const TRIAL_TEACHER_COMMENT_LIVE_DATE = "2026-10-23"

export const TRIAL_TEACHER_COMMENT_MAX_CHARS = 80

export const TRIAL_TEACHER_COMMENT_SOFT_CHARS = 30

export function commentCharCount(text: string): number {
  return Array.from(text).length
}

export function clampTrialTeacherComment(text: string): string {
  return Array.from(text).slice(0, TRIAL_TEACHER_COMMENT_MAX_CHARS).join("")
}

/** 空白字元不算已寫。 */
export function hasNonBlankTrialComment(text: string): boolean {
  return text.trim().length > 0
}

export function isWrittenTrialComment(at: string | null | undefined): boolean {
  return Boolean(at && String(at).trim())
}

export function commentCountTone(count: number): "muted" | "warning" {
  return count <= TRIAL_TEACHER_COMMENT_SOFT_CHARS ? "muted" : "warning"
}

export function commentCountLabel(count: number): string {
  return `${count}／約 ${TRIAL_TEACHER_COMMENT_SOFT_CHARS} · 上限 ${TRIAL_TEACHER_COMMENT_MAX_CHARS}`
}

/** 試堂日晚於上線日才催老師（表單／待辦／「評語未到」）。 */
export function isTeacherCommentNudgeInScope(
  trialDateYmd: string,
  liveDateYmd = TRIAL_TEACHER_COMMENT_LIVE_DATE
): boolean {
  return trialDateYmd > liveDateYmd
}

export function newPendingTrialCommentIds(beforeIds: string[], afterIds: string[]): string[] {
  const seen = new Set(beforeIds)
  return afterIds.filter((id) => id && !seen.has(id))
}

/** 評語尚未撰寫時，複製到該老師 WhatsApp 群組的文案。 */
export function trialCommentWhatsappDraft(input: {
  studentName: string | null
  gradeLabel: string
  trialDate: string
  subject: string | null
}): string {
  const name = input.studentName?.trim() || "學生"
  const grade = input.gradeLabel.trim()
  const gradePart = grade && grade !== "—" ? `（${grade}）` : ""
  const date = input.trialDate.trim()
  const subject = input.subject?.trim() ?? ""
  const subjectPart = subject && subject !== "—" ? subject : ""
  const when = [date, subjectPart].filter(Boolean).join(" ")
  const whenPart = when ? ` ${when}` : ""
  return `${name}${gradePart}${whenPart}試堂已出席，請撰寫約 30 字評語，說明學習情況，以及補習如何幫到這位學生。謝謝。`
}

/** 有老師署名用老師姓名。職員代貼沒有老師編號時用此標籤。 */
export function trialCommentAuthorLabel(name: string | null | undefined): string {
  const trimmed = name?.trim()
  return trimmed ? trimmed : "職員代貼"
}

export function formatTrialTeacherCommentAt(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("zh-HK", { dateStyle: "short", timeStyle: "short" })
}
