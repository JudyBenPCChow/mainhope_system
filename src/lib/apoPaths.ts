import { flattenNav, NAV_STRUCTURE } from "@/lib/navStructure"
import type { ApoPathHint } from "@/services/apoChatQueries"

const PATH_LABELS = new Map<string, string>()
for (const item of flattenNav(NAV_STRUCTURE)) {
 if (!PATH_LABELS.has(item.path)) PATH_LABELS.set(item.path, item.label)
}

/** 系統內可跳轉路由（長路徑優先匹配，例如 /Classes/New） */
const SORTED_PATHS = [...PATH_LABELS.keys()].sort((a, b) => b.length - a.length)

export function labelForApoPath(path: string): string {
 return PATH_LABELS.get(path) ?? path.replace(/^\//, "")
}

const LABEL_TO_PATH = new Map<string, string>()
for (const [path, label] of PATH_LABELS) {
 LABEL_TO_PATH.set(label, path)
}

const LABEL_PATTERNS = [...LABEL_TO_PATH.keys()].sort((a, b) => b.length - a.length)

export function extractPathsFromText(text: string): ApoPathHint[] {
 const found: ApoPathHint[] = []
 const seen = new Set<string>()

 for (const path of SORTED_PATHS) {
  if (!text.includes(path) || seen.has(path)) continue
  seen.add(path)
  found.push({ path, label: labelForApoPath(path) })
 }

 for (const label of LABEL_PATTERNS) {
  const path = LABEL_TO_PATH.get(label)
  if (!path || seen.has(path)) continue
  if (!text.includes(label)) continue
  seen.add(path)
  found.push({ path, label })
 }

 return found
}

export function mergePathHints(primary: ApoPathHint[] | undefined, text: string): ApoPathHint[] {
 const map = new Map<string, ApoPathHint>()
 for (const p of primary ?? []) {
  if (p.path) map.set(p.path, { path: p.path, label: p.label || labelForApoPath(p.path) })
 }
 for (const p of extractPathsFromText(text)) {
  if (!map.has(p.path)) map.set(p.path, p)
 }
 return [...map.values()]
}

/** 移除「路徑：/XXX」等冗餘行，按鈕會另顯示 */
export function cleanReplyPathNoise(text: string): string {
 return text
  .replace(/^[ \t]*路徑[：:]\s*\/[^\n]+\s*$/gim, "")
  .replace(/[ \t]*[（(]?\s*路徑[：:]\s*\/[A-Za-z][\w/]*\s*[）)]?/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim()
}

export function enrichApoReply(
 reply: string,
 paths: ApoPathHint[] | undefined
): { reply: string; paths: ApoPathHint[] } {
 const merged = mergePathHints(paths, reply)
 return { reply: cleanReplyPathNoise(reply), paths: merged }
}
