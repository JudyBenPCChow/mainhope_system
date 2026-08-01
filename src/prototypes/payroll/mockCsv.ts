import {
  formatHkd,
  teacherBillableHc,
  teacherLessonCount,
  type PayrollMonthMock,
} from "./mockData"

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** 假銀行帳號（僅示範） */
function mockBankAccount(name: string): string {
  let n = 0
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i)
  return `012-${String(10000000 + (n % 89999999)).padStart(8, "0")}`
}

/** 產生計糧 mock CSV（UTF-8 BOM）並觸發下載 */
export function downloadPayrollMockCsv(
  month: PayrollMonthMock,
  kind: "preview" | "formal"
): string {
  const lines: string[] = []

  if (kind === "formal") {
    lines.push(
      ["收款人姓名", "銀行帳號", "實發金額", "幣別", "備註"].map(csvEscape).join(",")
    )
    for (const t of month.teachers) {
      if (t.net == null && t.gross == null) continue
      lines.push(
        [
          t.name,
          mockBankAccount(t.name),
          t.net ?? t.gross ?? "",
          "HKD",
          t.anomalies[0] ?? month.monthLabel,
        ]
          .map(csvEscape)
          .join(",")
      )
    }
  } else {
    lines.push(
      [
        "月份",
        "狀態",
        "姓名",
        "薪酬模式",
        "堂數",
        "扣堂人次",
        "總薪酬",
        "僱員強積金",
        "僱主強積金",
        "實收",
        "異常備註",
      ]
        .map(csvEscape)
        .join(",")
    )
    for (const t of month.teachers) {
      lines.push(
        [
          month.monthLabel,
          month.status,
          t.name,
          t.mode,
          teacherLessonCount(t),
          teacherBillableHc(t),
          t.gross ?? "",
          t.employeeMpf,
          t.employerMpf,
          t.net ?? "",
          t.anomalies.join("；"),
        ]
          .map(csvEscape)
          .join(",")
      )
    }
    const totalGross = month.teachers.reduce((s, t) => s + (t.gross ?? 0), 0)
    const totalNet = month.teachers.reduce((s, t) => s + (t.net ?? 0), 0)
    lines.push("")
    lines.push(
      ["合計", "", "", "", "", "", totalGross, "", "", totalNet, ""]
        .map(csvEscape)
        .join(",")
    )
    lines.push(`# 對帳用示範檔 · 總薪酬 ${formatHkd(totalGross)}／實發 ${formatHkd(totalNet)}`)
  }

  const bom = "\uFEFF"
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  const tag = kind === "formal" ? "銀行轉賬" : "對帳"
  const filename = `明學計糧_${month.monthKey}_${tag}_示範.csv`
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return filename
}
