/** 班別狀態含「已結束」：日常清單與新增報讀不再列入。明示篩選「已結束」仍可查。 */
export function isEndedClassStatus(status: string | null | undefined): boolean {
 return String(status ?? "").includes("已結束")
}
