import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

import { hkTodayYmd } from "./apoDate.ts"

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

export type OverdueTuitionReport = {
  report_type: "overdue_tuition"
  generated_at: string
  hk_date: string
  total_count: number
  records: OverdueTuitionRow[]
  stats: OverdueTuitionStats
}

const PAGE_SIZE = 20
const MAX_PAGES = 50

export function createReportServiceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeRow(raw: Record<string, unknown>): OverdueTuitionRow | null {
  const studentId = String(raw.student_id ?? "").trim()
  if (!studentId) return null
  return {
    student_id: studentId,
    student_code: raw.student_code != null ? String(raw.student_code) : null,
    full_name: raw.full_name != null ? String(raw.full_name) : null,
    english_name: raw.english_name != null ? String(raw.english_name) : null,
    grade: raw.grade != null ? String(raw.grade) : null,
    enrollment_status: raw.enrollment_status != null ? String(raw.enrollment_status) : null,
    activity_status: raw.activity_status != null ? String(raw.activity_status) : null,
    paid_lessons: Number(raw.paid_lessons ?? 0),
    attended_lessons: Number(raw.attended_lessons ?? 0),
    lesson_gap: Number(raw.lesson_gap ?? 0),
  }
}

async function fetchOverdueTuitionPage(
  client: SupabaseClient,
  offset: number,
  userRole: string,
  teacherId: string | null
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; error: string }> {
  const { data, error } = await client.rpc("apo_assistant_overdue_tuition_list", {
    p_offset: offset,
    p_limit: PAGE_SIZE,
    p_user_role: userRole,
    p_teacher_id: teacherId,
  })
  if (error) return { ok: false, error: error.message }
  if (!data || typeof data !== "object") return { ok: false, error: "查詢無回傳" }
  return { ok: true, payload: data as Record<string, unknown> }
}

export async function fetchOverdueTuitionReport(
  client: SupabaseClient,
  userRole: string,
  teacherId: string | null
): Promise<{ ok: true; report: OverdueTuitionReport } | { ok: false; error: string }> {
  const records: OverdueTuitionRow[] = []
  let offset = 0
  let totalCount = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchOverdueTuitionPage(client, offset, userRole, teacherId)
    if (!result.ok) return { ok: false, error: result.error }

    const payload = result.payload
    if (payload.ok === false) {
      return { ok: false, error: String(payload.error ?? "查詢失敗") }
    }

    totalCount = Number(payload.total_count ?? 0)
    const batch = Array.isArray(payload.records) ? payload.records : []
    for (const item of batch) {
      if (!item || typeof item !== "object") continue
      const row = normalizeRow(item as Record<string, unknown>)
      if (row) records.push(row)
    }

    if (payload.has_more !== true) break
    const nextOffset = Number(payload.next_offset)
    if (!Number.isFinite(nextOffset) || nextOffset <= offset) break
    offset = nextOffset
  }

  return {
    ok: true,
    report: {
      report_type: "overdue_tuition",
      generated_at: new Date().toISOString(),
      hk_date: hkTodayYmd(),
      total_count: totalCount,
      records,
      stats: buildOverdueTuitionStats(records, totalCount),
    },
  }
}

export function buildOverdueTuitionStats(
  records: OverdueTuitionRow[],
  totalCount: number
): OverdueTuitionStats {
  const gradeMap = new Map<string, { count: number; lesson_gap: number }>()
  let totalLessonGap = 0
  let maxLessonGap = 0

  for (const row of records) {
    totalLessonGap += row.lesson_gap
    if (row.lesson_gap > maxLessonGap) maxLessonGap = row.lesson_gap
    const grade = row.grade?.trim() || "未填年級"
    const prev = gradeMap.get(grade) ?? { count: 0, lesson_gap: 0 }
    gradeMap.set(grade, {
      count: prev.count + 1,
      lesson_gap: prev.lesson_gap + row.lesson_gap,
    })
  }

  const byGrade = [...gradeMap.entries()]
    .map(([grade, v]) => ({ grade, count: v.count, lesson_gap: v.lesson_gap }))
    .sort((a, b) => b.lesson_gap - a.lesson_gap || b.count - a.count)

  const count = totalCount > 0 ? totalCount : records.length

  return {
    total_count: count,
    total_lesson_gap: totalLessonGap,
    avg_lesson_gap: records.length > 0 ? Math.round((totalLessonGap / records.length) * 10) / 10 : 0,
    max_lesson_gap: maxLessonGap,
    by_grade: byGrade,
  }
}

export function buildTemplateSummary(report: OverdueTuitionReport): string {
  const { stats, hk_date, records } = report
  if (stats.total_count === 0) {
    return `截至 ${hk_date}（香港時間），目前沒有在讀或活躍學生出現「出席堂數 ≥ 已繳堂數」的追收情況。`
  }

  const top = records.slice(0, 5)
  const topLines = top
    .map((r) => {
      const name = r.full_name?.trim() || r.english_name?.trim() || r.student_code || "（未命名）"
      return `－${name}：欠 ${r.lesson_gap} 堂（已出席 ${r.attended_lessons}／已繳 ${r.paid_lessons}）`
    })
    .join("\n")

  const gradeHint =
    stats.by_grade.length > 0
      ? `按年級計，${stats.by_grade[0].grade} 欠堂最多（${stats.by_grade[0].count} 人、共欠 ${stats.by_grade[0].lesson_gap} 堂）。`
      : ""

  return [
    `截至 ${hk_date}（香港時間），共有 ${stats.total_count} 位在讀或活躍學生需要追收學費（出席堂數已達或超過已繳堂數）。`,
    `合計欠堂 ${stats.total_lesson_gap} 堂，平均每人欠 ${stats.avg_lesson_gap} 堂，最高欠 ${stats.max_lesson_gap} 堂。`,
    gradeHint,
    top.length > 0 ? `欠堂較多學生（頭 ${top.length} 位）：\n${topLines}` : "",
    "此報表僅供內部參考；實際追收請以繳費紀錄頁面為準。",
  ]
    .filter(Boolean)
    .join("\n\n")
}
