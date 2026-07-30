/** 從用戶訊息抽取學生姓名關鍵字 */

export function extractStudentNameQuery(text: string): string | null {
  const t = text.trim()

  const patterns: RegExp[] = [
    /^([\u4e00-\u9fff]{2,4})(?:依家|而家|現在).{0,12}(?:報|讀)/,
    /^([\u4e00-\u9fff]{2,8}?)(?:今日|今天).{0,24}(?:上堂|上唔上|有冇堂|洗唔洗)/,
    /^([\u4e00-\u9fff]{2,4})\s*.{0,12}(?:報緊|讀緊|報乜|報咩|報什麼|報讀)/,
    /^([\u4e00-\u9fff]{2,8}?)\s+.{0,20}(?:狀態|請假|出席|點名|繳費|追收)/,
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+(?:今日|今天).{0,24}(?:上堂|上唔上|lesson)/i,
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+.{0,20}(?:狀態|請假|出席|點名)/i,
    /學生\s*[：:]?\s*([\u4e00-\u9fff]{2,8})/,
    /學生\s+([A-Za-z][A-Za-z\s.'-]{1,50})/i,
  ]

  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) {
      const name = m[1].trim()
      if (name.length >= 2) return name
    }
  }

  // 短問「霍健一呢／陳大文？」——當學生姓名搜尋（排除業務關鍵字）
  const bareCn = t.match(/^([\u4e00-\u9fff]{2,4})[呢呀嗎嘛？?！!\s]*$/)
  if (bareCn?.[1] && !isReservedBareQueryToken(bareCn[1])) return bareCn[1]

  const bareEn = t.match(/^([A-Za-z][A-Za-z\s.'-]{1,40}?)[?？!！\s]*$/)
  if (
    bareEn?.[1] &&
    bareEn[1].trim().length >= 2 &&
    !/\b(hi|hello|ok|help|thanks|thank you)\b/i.test(bareEn[1])
  ) {
    return bareEn[1].trim()
  }

  return null
}

/** 唔應當成學生姓名嘅短詞（系統功能／狀態詞） */
function isReservedBareQueryToken(token: string): boolean {
  return /^(?:點名|請假|報讀|試堂|出席|繳費|學費|追收|排程|班別|學生|老師|學號|在讀|活躍|待補|補課|收件匣|待辦|首頁|功能|幫助|你好|早晨|午安|謝謝|多謝)$/.test(
    token
  )
}

export function extractClassQueryFromText(text: string): string | null {
  const t = text.trim()
  const code = t.match(/\b(\d{2}[A-Z]{2}-[A-Z0-9]+(?:-[A-Z0-9]+)?)\b/i)
  if (code?.[1]) return code[1]

  const cn = t.match(/([\u4e00-\u9fffA-Za-z0-9]{2,20})\s*班.{0,12}(?:點名|名單|roster)/i)
  if (cn?.[1]) return cn[1].trim()

  const en = t.match(/班別\s*[：:]?\s*([A-Za-z0-9-]{4,40})/i)
  if (en?.[1]) return en[1].trim()

  return null
}

export function isStudentDataQuery(text: string): boolean {
  return /上堂|上唔上|有冇堂|有沒有堂|今日.*堂|今天.*堂|請假|狀態|出席|點名|繳費|追收|在讀|活躍|報讀|依家報|而家報|報緊|讀緊|報乜|報咩|報什麼/.test(
    text
  )
}

export function isClassRosterQuery(text: string): boolean {
  return /點名|名單|roster/i.test(text) && /班|ENGS|SM-|課程代碼/i.test(text)
}
