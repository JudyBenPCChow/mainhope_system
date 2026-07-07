/** 過濾回覆中不應向用戶提及的舊版／演進歷史用語 */

const LEGACY_PATTERNS: RegExp[] = [
  /（?唔好同舊版[^）\n]*）?/g,
  /（?勿與舊版[^）\n]*）?/g,
  /舊版[^。\n；;]{0,60}[。；;]?/g,
  /legacy\s*欄位[^。\n]*[。]?/gi,
  /legacy[^。\n]{0,40}[。]?/gi,
  /以往版本[^。\n]*[。]?/g,
  /舊系統[^。\n]*[。]?/g,
]

export function stripLegacyMentions(reply: string): string {
  let text = reply
  for (const re of LEGACY_PATTERNS) {
    text = text.replace(re, "")
  }
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
}

/** 介面唔支援 Markdown，剷走常見加粗／斜體 */
export function stripMarkdown(reply: string): string {
  return reply
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
}

export function sanitizeUserFacingReply(reply: string): string {
  return stripMarkdown(stripLegacyMentions(reply))
}

export const APO_NO_LEGACY_REPLY_RULE = `
回覆用戶時只描述**現行系統**的頁面、欄位同流程；**禁止**提及舊版、以往版本、legacy、系統演進或「以前點稱」等（用戶無需知道內部重構歷史）。
`.trim()
