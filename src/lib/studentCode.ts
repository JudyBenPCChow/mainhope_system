// 學生編號（student_code）生成規則 — 全域單一真實來源。
// 規則說明見 docs/policies/enrollment/STUDENT_CODE.md。
//
// 重點：
// - 學號為「純數字」字串（目前為 8 位，皆以 2026 起頭，為歷史匯入批次年份）。
// - 舊資料庫的 SNFNL 學號不再使用，僅保留在 students.old_student_id 供對照。
// - 新學號 = 目前所有「純數字」學號的最大值 + 1，補零至固定寬度，確保唯一且遞增。

/** 學號固定位數（與既有資料一致，皆為 8 位）。 */
export const STUDENT_CODE_WIDTH = 8

/** 是否為合法的「純數字」學號（允許前後空白，內容須全為數字）。 */
export function isNumericStudentCode(code: string | null | undefined): boolean {
  return /^\d+$/.test((code ?? "").trim())
}

type CodeHolder = { student_code?: string | null }

function readCode(item: CodeHolder | string | null | undefined): string {
  if (item == null) return ""
  if (typeof item === "string") return item
  return item.student_code ?? ""
}

/**
 * 依現有學生清單算出「下一個」學號。
 *
 * - 只看純數字學號（忽略空值與任何舊格式如 SNFNL****）。
 * - 取最大值 +1，並補零至 {@link STUDENT_CODE_WIDTH} 位。
 * - 清單為空或全無數字學號時，從 1 起算（00000001）。
 *
 * 注意：此函式僅依「傳入清單」計算，無法防止多端同時新增造成的競態；
 * 寫入端應對 student_code 唯一鍵衝突做重試（見 StudentsListPage.onAddStudent）。
 */
export function nextStudentCode(
  existing: Array<CodeHolder | string | null | undefined>
): string {
  let max = 0
  for (const item of existing) {
    const s = readCode(item).trim()
    if (!/^\d+$/.test(s)) continue
    const n = Number(s)
    if (Number.isFinite(n) && n > max) max = n
  }
  return String(max + 1).padStart(STUDENT_CODE_WIDTH, "0")
}
