import {
  APO_PO_GRADE_LABELS,
  APO_PO_TIME_SLOTS,
  APO_PO_WEEKDAYS,
  gradeLabelToCourseCode,
} from "./apoPoScheduleConstants.ts"
import { callDeepSeekJson, parseJsonObject } from "./apoPoDeepSeek.ts"
import type { AdminOpsWorkflow } from "./adminOpsTypes.ts"

const COURSE_CODE_RE = /\b(?:\d{4}-)?[A-Z][A-Z0-9]*\d{4}-[A-Z]\b/gi

export function extractCourseCodes(text: string): string[] {
  const found: string[] = []
  const re = new RegExp(COURSE_CODE_RE.source, "gi")
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const code = m[0].toUpperCase()
    if (!found.includes(code)) found.push(code)
  }
  return found
}

export function parseWeekdays(text: string): string | null {
  const t = text.trim()
  const found: string[] = []
  const alias: Record<string, string> = {
    週一: "星期一",
    週二: "星期二",
    週三: "星期三",
    週四: "星期四",
    週五: "星期五",
    週六: "星期六",
    週日: "星期日",
  }
  for (const day of APO_PO_WEEKDAYS) {
    if (t.includes(day) || t.includes(day.replace("星期", ""))) found.push(day)
  }
  for (const [k, v] of Object.entries(alias)) {
    if (t.includes(k) && !found.includes(v)) found.push(v)
  }
  if (found.length === 0) return null
  return found.join(",")
}

export function parseTimeSlot(text: string): string | null {
  const t = text.trim()
  for (const slot of APO_PO_TIME_SLOTS) {
    if (t.includes(slot) || t.includes(slot.replace(/–/g, "-"))) return slot
  }
  const hm = t.match(/(\d{1,2}):(\d{2})/)
  if (hm) {
    const target = `${hm[1]!.padStart(2, "0")}:${hm[2]}`
    const hit = APO_PO_TIME_SLOTS.find((s) => s.startsWith(target))
    if (hit) return hit
  }
  return null
}

export function parseGrade(text: string): string | null {
  const t = text.trim()
  if (/升中三|中三/.test(t)) return "中三"
  if (/升中二|中二/.test(t) && !/升中三/.test(t)) return "中二"
  if (/升中一|中一/.test(t) && !/升中[二三]/.test(t)) return "中一"
  for (const g of APO_PO_GRADE_LABELS) {
    if (t.includes(g)) return g
  }
  return null
}

export function parseFirstLessonDate(text: string): string | null {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]!
  const slash = text.match(/\b(\d{1,2})[\/月](\d{1,2})日?\b/)
  if (slash) {
    const m = Number(slash[1])
    const d = Number(slash[2])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const year = m >= 7 ? 2026 : 2027
      return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    }
  }
  return null
}

export function isCancelWorkflow(text: string): boolean {
  return /^(取消|停止|結束|唔要)$/.test(text.trim()) || /取消目前|不要繼續/.test(text.trim())
}

export function classifyAdminOpsIntent(text: string): AdminOpsWorkflow | "cancel" | "unknown" {
  const t = text.trim()
  if (!t) return "unknown"
  if (isCancelWorkflow(t)) return "cancel"
  if (/(同一格|同格|同一時段).*(開|加)/.test(t) || /(取消|刪|硬刪).*(再開|另開|開另一)/.test(t)) {
    return "replace_empty_slot"
  }
  if (/對調|交換時段|交換時間/.test(t)) return "swap_slots"
  if (
    /(取消|刪除|刪|硬刪).*(空班|沒有學生|無人報讀|冇學生|沒學生)/.test(t) ||
    t === "取消沒有學生的班"
  ) {
    return "delete_empty_class"
  }
  if (/開新班並排堂|開班並排|加班.*排|新班.*排堂/.test(t) || /開(新)?班/.test(t)) {
    return "create_class_schedule"
  }
  if (/^(幫我)?(改|轉)(時間|時段|鐘)$/.test(t) || t === "改時間" || t === "轉時間") {
    return "clarify_scope"
  }
  if (/改固定時段|改逢星期|改鐘|改上課時間|改時段/.test(t) || t === "改固定時段") {
    return "change_fixed_slot"
  }
  if (extractCourseCodes(t).length >= 1 && /(改|移|換).*(星期|時段|課室|鐘)/.test(t)) {
    return "change_fixed_slot"
  }
  return "unknown"
}

export { gradeLabelToCourseCode, APO_PO_WEEKDAYS, APO_PO_TIME_SLOTS }

export async function llmClassifyAndExtract(
  apiKey: string,
  userText: string
): Promise<{ workflow?: string; course_codes?: string[]; day_of_week?: string; time_slot?: string } | null> {
  const result = await callDeepSeekJson(
    apiKey,
    `你是明學教育行政班務助手的分流器。只輸出 JSON。workflow 只能是：delete_empty_class, change_fixed_slot, swap_slots, create_class_schedule, replace_empty_slot, clarify_scope, unknown。不要組 SQL。書面語。`,
    userText,
    { maxTokens: 250, temperature: 0 }
  )
  if (!result.ok) return null
  const obj = parseJsonObject(result.raw)
  if (!obj) return null
  return {
    workflow: typeof obj.workflow === "string" ? obj.workflow : undefined,
    course_codes: Array.isArray(obj.course_codes)
      ? obj.course_codes.map((c) => String(c))
      : undefined,
    day_of_week: typeof obj.day_of_week === "string" ? obj.day_of_week : undefined,
    time_slot: typeof obj.time_slot === "string" ? obj.time_slot : undefined,
  }
}
