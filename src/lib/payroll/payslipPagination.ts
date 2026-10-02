/** 表格列在分頁計畫中的半開區間 [start, end)。 */
export type RowRange = { start: number; end: number }

/**
 * 依實測高度把表格列切成若干段。
 * `measure(start, end, isLast)` 回傳該段版面高度；`isLast` 只在該段收到最後一列時為真（尾段才含表後合計）。
 * 單列已高過 `maxH` 時仍自成一段，避免空轉。
 */
export function planRowRanges(
  rowCount: number,
  measure: (start: number, end: number, isLast: boolean) => number,
  maxH: number,
): RowRange[] {
  if (rowCount <= 0) return []
  const ranges: RowRange[] = []
  let start = 0
  while (start < rowCount) {
    let best = start + 1
    let lo = start + 1
    let hi = rowCount
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const height = measure(start, mid, mid === rowCount)
      if (Number.isFinite(height) && height <= maxH) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    ranges.push({ start, end: best })
    start = best
  }
  return ranges
}
