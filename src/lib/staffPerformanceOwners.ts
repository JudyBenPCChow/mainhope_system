/**
 * 老闆／合夥人：非一般員工，預設不計入員工績效加總與排行，以免拉高人均／佔比。
 * 可於篩選列關閉「排除老闆」以重新納入。
 */
const OWNER_NAME_PATTERNS: RegExp[] = [
  /^mark\s*yu$/i,
  /^christine\s*fan$/i,
]

const OWNER_ABBRS = new Set(["cfan", "myu", "mark"])

export function isStaffPerformanceOwner(opts: {
  fullName?: string | null
  abbr?: string | null
}): boolean {
  const name = (opts.fullName ?? "").trim()
  if (name) {
    const normalized = name.replace(/\s+/g, " ")
    if (OWNER_NAME_PATTERNS.some((re) => re.test(normalized))) return true
  }
  const abbr = (opts.abbr ?? "").trim().toLowerCase()
  if (abbr && OWNER_ABBRS.has(abbr)) return true
  return false
}
