/**
 * 學費追收：已繳堂數列結餘索引。
 * 讀不到該組別列 ≠ 尚餘 0（假欠）。私人課程池可能沒有學年欄。
 */
import type { EntitlementNamespace } from "@/lib/entitlementNamespace"

export type EntitlementPoolRemainingRow = {
 studentId: string
 academicYearId: string | null
 courseGroup: string
 namespaceKey: string
 remainingLessons: number
}

export type TuitionChaseRemainingIndex = {
 /** studentId|academicYearId|courseGroup|namespaceKey */
 byYearKey: Map<string, number>
 /** 私人：studentId|namespaceKey（學年可空） */
 byPrivateNs: Map<string, number>
}

export function tuitionChaseYearPoolKey(
 studentId: string,
 academicYearId: string,
 ns: Pick<EntitlementNamespace, "courseGroup" | "namespaceKey">
): string {
 return `${studentId}|${academicYearId}|${ns.courseGroup}|${ns.namespaceKey}`
}

function privateNsKey(studentId: string, namespaceKey: string): string {
 return `${studentId}|${namespaceKey}`
}

function addRemaining(map: Map<string, number>, key: string, n: number): void {
 map.set(key, (map.get(key) ?? 0) + n)
}

export function indexEntitlementPoolRemainings(
 rows: readonly EntitlementPoolRemainingRow[],
 currentYearIds: ReadonlySet<string>
): TuitionChaseRemainingIndex {
 const byYearKey = new Map<string, number>()
 const byPrivateNs = new Map<string, number>()
 for (const row of rows) {
  if (row.courseGroup === "homework" || row.courseGroup === "trial") continue
  const sid = row.studentId.trim()
  const nsKey = row.namespaceKey.trim()
  if (!sid || !nsKey) continue
  const remaining = Number.isFinite(row.remainingLessons) ? row.remainingLessons : 0
  const yearId = (row.academicYearId ?? "").trim()
  if (yearId && currentYearIds.has(yearId)) {
   addRemaining(
    byYearKey,
    tuitionChaseYearPoolKey(sid, yearId, {
     courseGroup: row.courseGroup as EntitlementNamespace["courseGroup"],
     namespaceKey: nsKey,
    }),
    remaining
   )
  }
  if (row.courseGroup === "private") {
   addRemaining(byPrivateNs, privateNsKey(sid, nsKey), remaining)
  }
 }
 return { byYearKey, byPrivateNs }
}

/**
 * 找到該組別已繳堂數列則回傳尚餘（可為 0 或負）。
 * 找不到 → `undefined`，不可當 0。
 */
export function lookupTuitionChaseRemaining(
 index: TuitionChaseRemainingIndex,
 opts: {
  studentId: string
  academicYearId: string
  namespace: Pick<EntitlementNamespace, "courseGroup" | "namespaceKey">
 }
): number | undefined {
 const yearKey = tuitionChaseYearPoolKey(
  opts.studentId,
  opts.academicYearId,
  opts.namespace
 )
 if (index.byYearKey.has(yearKey)) return index.byYearKey.get(yearKey)
 if (opts.namespace.courseGroup === "private") {
  const privKey = privateNsKey(opts.studentId, opts.namespace.namespaceKey)
  if (index.byPrivateNs.has(privKey)) return index.byPrivateNs.get(privKey)
 }
 return undefined
}
