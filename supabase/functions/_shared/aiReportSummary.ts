import type { OverdueTuitionReport } from "./aiReportData.ts"

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
const DEEPSEEK_MODEL = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-chat"

export async function summarizeOverdueTuitionWithLlm(
  apiKey: string,
  report: OverdueTuitionReport
): Promise<string | null> {
  const sample = report.records.slice(0, 12).map((r) => ({
    name: r.full_name ?? r.english_name ?? r.student_code,
    grade: r.grade,
    paid_lessons: r.paid_lessons,
    attended_lessons: r.attended_lessons,
    lesson_gap: r.lesson_gap,
  }))

  const system = `你是明學教育內部報表助理。根據提供的追收學費統計，撰寫繁體中文摘要（3～5 段）。
規則：
- 只根據數據陳述，不可捏造學生或金額
- 先講整體人數與欠堂總量，再講重點年級或個案
- 語氣專業簡潔，結尾提醒以繳費紀錄為準
- 不可建議直接修改資料庫或自動收款
- 直接輸出純文字，不要 JSON 或 markdown`

  const user = JSON.stringify({
    hk_date: report.hk_date,
    stats: report.stats,
    sample_students: sample,
  })

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    })

    if (!res.ok) return null
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = String(data.choices?.[0]?.message?.content ?? "").trim()
    return text.length > 0 ? text.slice(0, 2500) : null
  } catch {
    return null
  }
}
