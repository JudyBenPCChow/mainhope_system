import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

import { corsHeaders, jsonResponse } from "../_shared/cors.ts"

const TO = ["526956762@qq.com"]
const CC = ["cfan@mainhope.edu.hk", "markyu@mainhope.edu.hk"]

const WEEKDAY_ZH = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]

type LessonRow = {
  teacher_name: string | null
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  subject: string | null
  course_code_full: string | null
  course_name: string | null
}

function hkNowParts(d = new Date()): {
  y: number
  m: number
  day: number
  ymd: string
} {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>
  const y = Number(parts.year)
  const m = Number(parts.month)
  const day = Number(parts.day)
  return {
    y,
    m,
    day,
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

function monthBoundsHk(now = new Date()): { start: string; endExclusive: string } {
  const { y, m } = hkNowParts(now)
  const start = `${y}-${String(m).padStart(2, "0")}-01`
  const nextM = m === 12 ? 1 : m + 1
  const nextY = m === 12 ? y + 1 : y
  const endExclusive = `${nextY}-${String(nextM).padStart(2, "0")}-01`
  return { start, endExclusive }
}

function formatHm(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim()
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t || "—"
  return `${m[1].padStart(2, "0")}:${m[2]}`
}

function formatLessonLine(row: LessonRow): string {
  const d = new Date(`${row.scheduled_date}T12:00:00+08:00`)
  const month = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const weekday = WEEKDAY_ZH[d.getUTCDay()] ?? ""
  const course =
    String(row.course_name ?? row.subject ?? "課堂").trim() || "課堂"
  const code = String(row.course_code_full ?? "").trim()
  const codePart = code ? `（${code}）` : ""
  return `${month}月${day}日（${weekday}）${formatHm(row.start_time)}–${formatHm(row.end_time)}　${course}${codePart}`
}

function teacherLabel(name: string | null | undefined): string {
  const t = String(name ?? "").trim()
  return t || "（未指定老師）"
}

function buildAdminReport(rows: LessonRow[], asOf: { m: number; day: number }): {
  subject: string
  text: string
  teacherCount: number
  lessonCount: number
} {
  const monthLabel = `${asOf.m}月`
  const subject = `系統報告︰${monthLabel}尚未點名紀錄報告`

  if (rows.length === 0) {
    return {
      subject,
      text: [
        "前台／行政同事︰",
        "",
        `截至${asOf.m}月${asOf.day}日資料庫顯示，本月暫無尚未完成點名之課堂。`,
        "",
        "(以上乃系統發出之提醒，切勿回覆本電郵）",
      ].join("\n"),
      teacherCount: 0,
      lessonCount: 0,
    }
  }

  const byTeacher = new Map<string, LessonRow[]>()
  for (const row of rows) {
    const key = teacherLabel(row.teacher_name)
    const list = byTeacher.get(key) ?? []
    list.push(row)
    byTeacher.set(key, list)
  }

  const sortedTeachers = [...byTeacher.entries()].sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length
    return a[0].localeCompare(b[0], "zh-Hant")
  })

  const blocks: string[] = []
  for (const [name, lessons] of sortedTeachers) {
    const lines = [...lessons]
      .sort((a, b) => {
        if (a.scheduled_date !== b.scheduled_date) {
          return a.scheduled_date.localeCompare(b.scheduled_date)
        }
        return formatHm(a.start_time).localeCompare(formatHm(b.start_time))
      })
      .map(formatLessonLine)
    blocks.push([name, ...lines].join("\n"))
  }

  const text = [
    "前台／行政同事︰",
    "",
    `截至${asOf.m}月${asOf.day}日資料庫顯示，以下老師尚未完成點名。`,
    "－－－－－－－－－－－－－－",
    "",
    blocks.join("\n\n"),
    "",
    "－－－－－－－－－－－－－－",
    "",
    "(以上乃系統發出之提醒，切勿回覆本電郵）",
  ].join("\n")

  return {
    subject,
    text,
    teacherCount: sortedTeachers.length,
    lessonCount: rows.length,
  }
}

function authorize(req: Request): boolean {
  const expected = Deno.env.get("MISSING_ROLL_CALL_CRON_SECRET")?.trim()
  if (!expected) return false
  const auth = req.headers.get("authorization")?.trim() ?? ""
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : ""
  const headerSecret = req.headers.get("x-cron-secret")?.trim() ?? ""
  return bearer === expected || headerSecret === expected
}

async function sendAdminEmail(input: {
  subject: string
  text: string
}): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim()
  const from = Deno.env.get("RESEND_FROM")?.trim() || "明學教育 <noreply@mainhope.edu.hk>"
  if (!apiKey) {
    return { ok: false, message: "未設定 RESEND_API_KEY，無法寄出通知。" }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: TO,
      cc: CC,
      subject: input.subject,
      text: input.text,
    }),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (payload as { message?: string })?.message ||
      (payload as { error?: string })?.error ||
      `寄信失敗（${res.status}）`
    console.error("missing-roll-call-admin-report Resend failed", res.status, payload)
    return { ok: false, message: String(message) }
  }
  return { ok: true, id: String((payload as { id?: string }).id ?? "") || undefined }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers":
          `${corsHeaders["Access-Control-Allow-Headers"]}, x-cron-secret`,
      },
    })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "僅支援 POST" }, 405)
  }
  if (!authorize(req)) {
    return jsonResponse({ error: "未授權" }, 401)
  }

  let dryRun = false
  try {
    const body = await req.json().catch(() => ({})) as { dry_run?: unknown }
    dryRun = body?.dry_run === true
  } catch {
    dryRun = false
  }

  const url = Deno.env.get("SUPABASE_URL")?.trim()
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim()
  if (!url || !serviceKey) {
    return jsonResponse({ error: "缺少 SUPABASE_URL 或 SERVICE_ROLE_KEY" }, 500)
  }

  const asOf = hkNowParts()
  const bounds = monthBoundsHk()
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin.rpc("list_missing_roll_call_lessons", {
    p_month_start: bounds.start,
    p_month_end_exclusive: bounds.endExclusive,
  })
  if (error) {
    console.error("list_missing_roll_call_lessons failed", error)
    return jsonResponse({ error: `查詢失敗：${error.message}` }, 500)
  }

  const rows = (data ?? []) as LessonRow[]
  const report = buildAdminReport(rows, { m: asOf.m, day: asOf.day })

  if (dryRun) {
    return jsonResponse({
      ok: true,
      dry_run: true,
      as_of: asOf.ymd,
      month_start: bounds.start,
      teacher_count: report.teacherCount,
      lesson_count: report.lessonCount,
      subject: report.subject,
      text: report.text,
    })
  }

  const sent = await sendAdminEmail({
    subject: report.subject,
    text: report.text,
  })
  if (!sent.ok) {
    return jsonResponse({ error: sent.message }, 502)
  }

  return jsonResponse({
    ok: true,
    as_of: asOf.ymd,
    month_start: bounds.start,
    teacher_count: report.teacherCount,
    lesson_count: report.lessonCount,
    resend_id: sent.id ?? null,
    to: TO,
    cc: CC,
  })
})
