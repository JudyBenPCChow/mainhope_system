/** 解析逗號分隔的多值欄位（支援半形、全形逗號） */
export function parseMultiValueField(raw: string | null | undefined): string[] {
 if (!raw?.trim()) return []
 const seen = new Set<string>()
 const out: string[] = []
 for (const part of raw.split(/[,，]/)) {
  const t = part.trim()
  if (!t || seen.has(t)) continue
  seen.add(t)
  out.push(t)
 }
 return out
}

/** 多值欄位寫入 DB；空陣列回傳 null */
export function joinMultiValueField(values: string[]): string | null {
 const seen = new Set<string>()
 const out: string[] = []
 for (const v of values) {
  const t = v.trim()
  if (!t || seen.has(t)) continue
  seen.add(t)
  out.push(t)
 }
 return out.length > 0 ? out.join(",") : null
}
