/** 查詢／廣告「有興趣科目」名稱（非 subjects.code）。 */

export function normalizeInterestedSubjects(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    const label = String(item ?? "").trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push(label)
    if (out.length >= 20) break
  }
  return out
}

export function formatInterestedSubjects(subjects: string[]): string {
  const normalized = normalizeInterestedSubjects(subjects)
  return normalized.length > 0 ? normalized.join("、") : "—"
}

/** 編輯用：一行一科，或用 、／, 分隔。 */
export function parseInterestedSubjectsText(raw: string): string[] {
  const parts = raw
    .split(/[\n、,，;；]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return normalizeInterestedSubjects(parts)
}

export function interestedSubjectsToTextarea(subjects: string[]): string {
  return normalizeInterestedSubjects(subjects).join("\n")
}
