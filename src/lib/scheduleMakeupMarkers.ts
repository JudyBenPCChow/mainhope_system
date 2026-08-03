/** remarks 標記：用於查重「此取消堂是否已安排過補回」 */
export function makeupOfRemarkMarker(cancelledScheduleId: string): string {
 return `makeup_of=${cancelledScheduleId}`
}

const MAKEUP_OF_ID_RE =
 /makeup_of=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

/** 從補回加堂 remarks 解析原取消堂 id（跨期點名期數繼承用） */
export function parseMakeupOfScheduleId(remarks: string | null | undefined): string | null {
 const m = String(remarks ?? "").match(MAKEUP_OF_ID_RE)
 return m?.[1]?.toLowerCase() ?? null
}

export function remarksIndicateMakeupOf(
 remarks: string | null | undefined,
 cancelledId: string
): boolean {
 return String(remarks ?? "").includes(makeupOfRemarkMarker(cancelledId))
}
