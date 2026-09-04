import type { LucideIcon } from "lucide-react"

import {
 filterNavForRole,
 flattenNav,
 NAV_STRUCTURE,
 type NavLeafDef,
 type Role,
} from "@/lib/navStructure"

export const MAX_PINNED_PAGES = 12

export type PinnablePage = {
 href: string
 label: string
 icon: LucideIcon
}

type SecondaryPinSpec = {
 pickSearch: (search: URLSearchParams) => URLSearchParams
 labelFor: (search: URLSearchParams) => string | null
}

function parseSearch(search: string): URLSearchParams {
 return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
}

function hrefWithSearch(pathname: string, search: URLSearchParams): string {
 const q = search.toString()
 return q ? `${pathname}?${q}` : pathname
}

const STUDENTS_PIN: SecondaryPinSpec = {
 pickSearch: (search) => {
  const next = new URLSearchParams()
  next.set("scope", search.get("scope") === "roster" ? "roster" : "active")
  return next
 },
 labelFor: (search) => (search.get("scope") === "roster" ? "學生名冊" : "活躍"),
}

const SCHEDULE_PIN: SecondaryPinSpec = {
 pickSearch: (search) => {
  const next = new URLSearchParams()
  const view = search.get("view")
  next.set("view", view === "day" || view === "list" || view === "byDate" ? view : "byDate")
  return next
 },
 labelFor: (search) => {
  const view = search.get("view")
  if (view === "day") return "日視圖"
  if (view === "list") return "表格"
  return "清單"
 },
}

function secondaryPinSpec(pathname: string): SecondaryPinSpec | null {
 if (pathname === "/Students") return STUDENTS_PIN
 if (pathname === "/Schedule") return SCHEDULE_PIN
 return null
}

export function splitNavItemPath(itemPath: string): { pathname: string; search: string } {
 const q = itemPath.indexOf("?")
 if (q < 0) return { pathname: itemPath, search: "" }
 return { pathname: itemPath.slice(0, q), search: itemPath.slice(q + 1) }
}

/** 分數愈高愈貼近目前畫面；0 代表不符。帶 query 的項目（例如日視圖）優先於純路徑。 */
export function navLeafMatchScore(pathname: string, search: string, itemPath: string): number {
 const { pathname: itemPathname, search: itemSearch } = splitNavItemPath(itemPath)
 if (itemPathname === "/Home") return pathname === "/Home" ? 1000 : 0
 if (!(pathname === itemPathname || pathname.startsWith(`${itemPathname}/`))) return 0

 const want = new URLSearchParams(itemSearch)
 const have = parseSearch(search)
 for (const [key, value] of want) {
  if (have.get(key) !== value) return 0
 }
 let score = itemPathname.length
 if (itemSearch) score += 1000 + itemSearch.length
 if (pathname === itemPathname) score += 50
 return score
}

export function pinnableLeavesForRole(role: Role): NavLeafDef[] {
 const leaves = flattenNav(filterNavForRole(role, NAV_STRUCTURE))
 const seen = new Set<string>()
 const out: NavLeafDef[] = []
 for (const leaf of leaves) {
  if (seen.has(leaf.path)) continue
  seen.add(leaf.path)
  out.push(leaf)
 }
 return out
}

export function findPinnableNavLeaf(
 pathname: string,
 search: string,
 role: Role
): NavLeafDef | null {
 let best: NavLeafDef | null = null
 let bestScore = 0
 for (const leaf of pinnableLeavesForRole(role)) {
  const score = navLeafMatchScore(pathname, search, leaf.path)
  if (score > bestScore) {
   best = leaf
   bestScore = score
  }
 }
 return best
}

export function normalizePinnableHref(href: string): string {
 const trimmed = href.trim()
 if (!trimmed.startsWith("/")) return trimmed
 const { pathname, search } = splitNavItemPath(trimmed)
 const spec = secondaryPinSpec(pathname)
 if (!spec) return pathname
 return hrefWithSearch(pathname, spec.pickSearch(parseSearch(search)))
}

export function buildPinnablePage(
 pathname: string,
 search: string,
 role: Role
): PinnablePage | null {
 const leaf = findPinnableNavLeaf(pathname, search, role)
 if (!leaf) return null
 const { pathname: leafPath } = splitNavItemPath(leaf.path)
 const spec = secondaryPinSpec(leafPath)
 const onListPage = pathname === leafPath
 if (!spec || !onListPage) {
  return { href: normalizePinnableHref(leaf.path), label: leaf.label, icon: leaf.icon }
 }
 const picked = spec.pickSearch(parseSearch(search))
 const extra = spec.labelFor(picked)
 const href = hrefWithSearch(leafPath, picked)
 const label = extra && extra !== leaf.label ? `${leaf.label} · ${extra}` : leaf.label
 return { href, label, icon: leaf.icon }
}

export function parsePinnedPagePaths(raw: unknown): string[] {
 if (raw == null || raw === "") return []
 let items: unknown[] = []
 if (Array.isArray(raw)) {
  items = raw
 } else if (typeof raw === "string") {
  try {
   const parsed: unknown = JSON.parse(raw)
   if (!Array.isArray(parsed)) return []
   items = parsed
  } catch {
   return []
  }
 } else {
  return []
 }
 const out: string[] = []
 const seen = new Set<string>()
 for (const item of items) {
  if (typeof item !== "string") continue
  const path = normalizePinnableHref(item)
  if (!path.startsWith("/") || seen.has(path)) continue
  seen.add(path)
  out.push(path)
  if (out.length >= MAX_PINNED_PAGES) break
 }
 return out
}

export function togglePinnedPagePaths(current: readonly string[], itemPath: string): string[] {
 const target = normalizePinnableHref(itemPath)
 if (!target.startsWith("/")) return parsePinnedPagePaths([...current])
 const existing = parsePinnedPagePaths([...current])
 if (existing.includes(target)) return existing.filter((item) => item !== target)
 return [target, ...existing.filter((item) => item !== target)].slice(0, MAX_PINNED_PAGES)
}

export function parseHiddenDefaultPaths(raw: unknown): string[] {
 return parsePinnedPagePaths(raw)
}

export function hideDefaultHomeActionPath(current: readonly string[], itemPath: string): string[] {
 const target = normalizePinnableHref(itemPath)
 if (!target.startsWith("/")) return parseHiddenDefaultPaths([...current])
 const existing = parseHiddenDefaultPaths([...current])
 if (existing.includes(target)) return existing
 return [...existing, target].slice(0, MAX_PINNED_PAGES)
}

export function visibleDefaultHomeActionPaths(
 tilePaths: readonly string[],
 pinned: readonly string[],
 hidden: readonly string[]
): string[] {
 const pinnedSet = new Set(parsePinnedPagePaths([...pinned]))
 const hiddenSet = new Set(parseHiddenDefaultPaths([...hidden]))
 return tilePaths.filter((path) => {
  const href = normalizePinnableHref(path)
  return href.startsWith("/") && !pinnedSet.has(href) && !hiddenSet.has(href)
 })
}

export function resolvePinnedPages(paths: readonly string[], role: Role): PinnablePage[] {
 const out: PinnablePage[] = []
 const seen = new Set<string>()
 for (const raw of paths) {
  const href = normalizePinnableHref(raw)
  if (!href.startsWith("/") || seen.has(href)) continue
  const { pathname, search } = splitNavItemPath(href)
  const page = buildPinnablePage(pathname, search, role)
  if (!page) continue
  seen.add(page.href)
  out.push(page)
 }
 return out
}
