/** 共用列表：表頭篩選／排序輔助（領域頁自備欄位規則） */

export type SortDir = "asc" | "desc"

export type HeaderFilterOption = { value: string; label: string }

export function countActiveFilters(values: Record<string, string>): number {
 return Object.values(values).reduce((n, v) => n + (v.trim() ? 1 : 0), 0)
}

export function emptyFiltersForKeys<K extends string>(keys: readonly K[]): Record<K, string> {
 return Object.fromEntries(keys.map((k) => [k, ""])) as Record<K, string>
}

/** 空值永遠排最後（與方向無關） */
export function emptyLast(aEmpty: boolean, bEmpty: boolean): number | null {
 if (aEmpty && bEmpty) return 0
 if (aEmpty) return 1
 if (bEmpty) return -1
 return null
}

export function dirMul(dir: SortDir): number {
 return dir === "asc" ? 1 : -1
}

export function uniqueSortedTexts(values: Iterable<string>): string[] {
 const set = new Set<string>()
 for (const v of values) {
  const t = v.trim()
  if (t) set.add(t)
 }
 return [...set].sort((a, b) => a.localeCompare(b, "zh-Hant"))
}

export function containsIgnoreCase(hay: string | null | undefined, q: string): boolean {
 if (!q) return true
 return (hay ?? "").toLowerCase().includes(q)
}
