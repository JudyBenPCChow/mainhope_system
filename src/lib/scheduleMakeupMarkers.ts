/** remarks 標記：用於查重「此取消堂是否已安排過補回」 */
export function makeupOfRemarkMarker(cancelledScheduleId: string): string {
 return `makeup_of=${cancelledScheduleId}`
}

const MAKEUP_OF_ID_RE =
 /makeup_of=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

/** 安排補堂寫入的「補回 YYYY-MM-DD」；原堂讀取失敗時作期數判定後備 */
const MAKEUP_ORIGINAL_DATE_RE = /補回\s*(\d{4}-\d{2}-\d{2})/

/** 從補回加堂 remarks 解析原取消堂 id（跨期點名期數繼承用） */
export function parseMakeupOfScheduleId(remarks: string | null | undefined): string | null {
 const m = String(remarks ?? "").match(MAKEUP_OF_ID_RE)
 return m?.[1]?.toLowerCase() ?? null
}

/** 從 remarks 解析原取消堂日期（例：補回 2026-07-26） */
export function parseMakeupOriginalDate(remarks: string | null | undefined): string | null {
 const m = String(remarks ?? "").match(MAKEUP_ORIGINAL_DATE_RE)
 const date = m?.[1] ?? null
 return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

export function remarksIndicateMakeupOf(
 remarks: string | null | undefined,
 cancelledId: string
): boolean {
 return String(remarks ?? "").includes(makeupOfRemarkMarker(cancelledId))
}
