import { formatUnknownError } from "@/lib/formatUnknownError"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export type AiReportType = "overdue_tuition"

export type OverdueTuitionRow = {
  student_id: string
  student_code: string | null
  full_name: string | null
  english_name: string | null
  grade: string | null
  enrollment_status: string | null
  activity_status: string | null
  paid_lessons: number
  attended_lessons: number
  lesson_gap: number
}

export type OverdueTuitionStats = {
  total_count: number
  total_lesson_gap: number
  avg_lesson_gap: number
  max_lesson_gap: number
  by_grade: { grade: string; count: number; lesson_gap: number }[]
}

export type FetchAiReportInput = {
  reportType: AiReportType
  includeSummary?: boolean
}

export type FetchAiReportResult =
  | {
      ok: true
      reportType: AiReportType
      generatedAt: string
      hkDate: string
      totalCount: number
      records: OverdueTuitionRow[]
      stats: OverdueTuitionStats
      summary: string
      summarySource: "template" | "llm"
    }
  | { ok: false; message: string }

function normalizeRow(raw: unknown): OverdueTuitionRow | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const studentId = String(o.student_id ?? "").trim()
  if (!studentId) return null
  return {
    student_id: studentId,
    student_code: o.student_code != null ? String(o.student_code) : null,
    full_name: o.full_name != null ? String(o.full_name) : null,
    english_name: o.english_name != null ? String(o.english_name) : null,
    grade: o.grade != null ? String(o.grade) : null,
    enrollment_status: o.enrollment_status != null ? String(o.enrollment_status) : null,
    activity_status: o.activity_status != null ? String(o.activity_status) : null,
    paid_lessons: Number(o.paid_lessons ?? 0),
    attended_lessons: Number(o.attended_lessons ?? 0),
    lesson_gap: Number(o.lesson_gap ?? 0),
  }
}

function normalizeStats(raw: unknown): OverdueTuitionStats {
  if (!raw || typeof raw !== "object") {
    return {
      total_count: 0,
      total_lesson_gap: 0,
      avg_lesson_gap: 0,
      max_lesson_gap: 0,
      by_grade: [],
    }
  }
  const o = raw as Record<string, unknown>
  const byGrade = Array.isArray(o.by_grade)
    ? o.by_grade
        .map((item) => {
          if (!item || typeof item !== "object") return null
          const g = item as Record<string, unknown>
          return {
            grade: String(g.grade ?? ""),
            count: Number(g.count ?? 0),
            lesson_gap: Number(g.lesson_gap ?? 0),
          }
        })
        .filter((x): x is { grade: string; count: number; lesson_gap: number } => x !== null)
    : []
  return {
    total_count: Number(o.total_count ?? 0),
    total_lesson_gap: Number(o.total_lesson_gap ?? 0),
    avg_lesson_gap: Number(o.avg_lesson_gap ?? 0),
    max_lesson_gap: Number(o.max_lesson_gap ?? 0),
    by_grade: byGrade,
  }
}

async function readFunctionErrorBody(error: unknown, response?: Response): Promise<string | null> {
  const res = response ?? (error as { context?: Response } | null)?.context
  if (!res || typeof res.json !== "function") return null
  try {
    const body = (await res.clone().json()) as { error?: unknown }
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim()
  } catch {
    // ignore
  }
  return null
}

/** 呼叫 Edge Function「ai-report」；需已登入 Supabase Auth（JWT 由 invoke 自動帶入） */
export async function fetchAiReport(input: FetchAiReportInput): Promise<FetchAiReportResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: "尚未設定 Supabase（VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY），無法生成報表。",
    }
  }

  const { data, error, response } = await supabase.functions.invoke("ai-report", {
    body: {
      reportType: input.reportType,
      includeSummary: input.includeSummary ?? true,
    },
  })

  if (error) {
    const detail = await readFunctionErrorBody(error, response)
    if (detail) return { ok: false, message: detail }
    return { ok: false, message: formatUnknownError(error) }
  }

  if (!data || typeof data !== "object") {
    return { ok: false, message: "報表回覆格式異常，請稍後再試。" }
  }

  const payload = data as Record<string, unknown>
  if (typeof payload.error === "string" && payload.error.trim()) {
    return { ok: false, message: payload.error.trim() }
  }
  if (payload.ok !== true) {
    return { ok: false, message: "報表生成失敗，請稍後再試。" }
  }

  const records = Array.isArray(payload.records)
    ? payload.records.map(normalizeRow).filter((r): r is OverdueTuitionRow => r !== null)
    : []

  const summarySource = payload.summarySource === "llm" ? "llm" : "template"

  return {
    ok: true,
    reportType: "overdue_tuition",
    generatedAt: String(payload.generatedAt ?? ""),
    hkDate: String(payload.hkDate ?? ""),
    totalCount: Number(payload.totalCount ?? 0),
    records,
    stats: normalizeStats(payload.stats),
    summary: String(payload.summary ?? "").trim(),
    summarySource,
  }
}

export function exportOverdueTuitionCsv(rows: OverdueTuitionRow[]): string {
  const headers = [
    "學號",
    "中文姓名",
    "英文姓名",
    "年級",
    "已繳堂數",
    "已出席堂數",
    "欠堂數",
    "報讀狀態",
    "活躍狀態",
  ]
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
    return v
  }
  const lines = [headers.join(",")]
  for (const r of rows) {
    lines.push(
      [
        r.student_code ?? "",
        r.full_name ?? "",
        r.english_name ?? "",
        r.grade ?? "",
        String(r.paid_lessons),
        String(r.attended_lessons),
        String(r.lesson_gap),
        r.enrollment_status ?? "",
        r.activity_status ?? "",
      ]
        .map((c) => escape(c))
        .join(",")
    )
  }
  return lines.join("\n")
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
