export function normalizeElectedSubjectCodes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    const code = String(item ?? "").trim().toUpperCase()
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out
}

export function formatElectedSubjectLabels(
  codes: string[],
  options: { code: string; name_zh: string }[]
): string {
  const normalized = normalizeElectedSubjectCodes(codes)
  if (normalized.length === 0) return "—"
  const labelByCode = new Map(
    options.map((opt) => [opt.code.trim().toUpperCase(), opt.name_zh.trim() || opt.code])
  )
  return normalized.map((code) => labelByCode.get(code) || code).join("、")
}
