/** Payroll DB／計算 mode 保持不變；所有使用者可見位置經此轉成員工用語。 */
export function payrollModeLabel(mode: string): string {
 if (mode === "兼職 HC") return "兼職人頭"
 if (mode === "特別 HC") return "特別人頭"
 return mode
}
