import type { AdminOpsIntent } from "@/lib/adminOpsAssistant/types"

const COURSE_CODE_RE = /\b(?:\d{4}-)?[A-Z][A-Z0-9]*\d{4}-[A-Z]\b/i

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

/** 用戶說「改時間」但未表明整班／學生／私人時，先問清。 */
export function isAmbiguousTimeChange(text: string): boolean {
  const t = text.trim()
  if (!/(改時間|改時段|改鐘|轉時間|對調)/.test(t)) return false
  if (/整班|固定時段|逢星期|班別/.test(t)) return false
  if (/這名學生|呢個學生|轉班|轉去另一班|私人/.test(t)) return false
  if (extractCourseCodes(t).length >= 1 && /(班|時段|逢星期|星期)/.test(t)) return false
  if (/對調/.test(t)) return false
  return /^(幫我)?(改|轉)(時間|時段|鐘)/.test(t) || t === "改時間" || t === "轉時間"
}

export function classifyAdminOpsIntent(text: string): AdminOpsIntent {
  const t = text.trim()
  if (!t) return "unknown"
  if (/^(取消|停止|結束|唔要)$/.test(t) || /取消目前|不要繼續/.test(t)) return "cancel"

  if (
    /(同一格|同格|同一時段).*(開|加)/.test(t) ||
    /(取消|刪|硬刪).*(再開|另開|開另一)/.test(t)
  ) {
    return "replace_empty_slot"
  }

  if (/對調|交換時段|交換時間/.test(t)) return "swap_slots"

  if (
    /(取消|刪除|刪|硬刪).*(空班|沒有學生|無人報讀|冇學生|沒學生)/.test(t) ||
    /(空班|沒有學生的班).*(取消|刪)/.test(t) ||
    t === "取消沒有學生的班"
  ) {
    return "delete_empty_class"
  }

  if (
    /開新班|開班並排|加班.*排|新班.*排堂|開新班並排堂/.test(t) ||
    t === "開新班並排堂" ||
    (/開(新)?班/.test(t) && /排(好)?堂|少於\s*40|首堂/.test(t))
  ) {
    return "create_class_schedule"
  }

  if (/開(新)?班|新增班別/.test(t) && !/阿Po|外星人/.test(t)) {
    return "create_class_schedule"
  }

  if (isAmbiguousTimeChange(t)) return "clarify_scope"

  if (
    /改固定時段|改逢星期|改鐘|只改鐘|改上課時間|改時段/.test(t) ||
    t === "改固定時段"
  ) {
    return "change_fixed_slot"
  }

  if (extractCourseCodes(t).length >= 1 && /(改|移|換).*(星期|時段|課室|鐘)/.test(t)) {
    return "change_fixed_slot"
  }

  return "unknown"
}
