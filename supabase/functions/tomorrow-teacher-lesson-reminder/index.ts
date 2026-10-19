import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import {
  addDaysYmd,
  authorizeCron,
  claimScheduledEmail,
  finishScheduledEmail,
  hkClock,
  inMinuteWindow,
  isYmd,
} from "../_shared/scheduledEmailLedger.ts"

const CN_COUNT = [
  "零",
  "一",
  "兩",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
]

type LeaveDetail = {
  student_name: string
  leave_reason: string | null
  makeup_type: string | null
  leave_remarks: string | null
  makeup_scheduled_date: string | null
  bucket: string
}

type LessonPayload = {
  schedule_id: string
  start_time: string | null
  end_time: string | null
  subject: string | null
  course_code_full: string | null
  course_name: string | null
  classroom_name: string | null
  is_extra_lesson: boolean
  original_teacher_name: string | null
  schedule_remarks: string | null
  no_teaching_needed?: boolean
  student_names: string[]
  zoom_or_record_names: string[]
  leave_names: string[]
  leave_details: LeaveDetail[]
}

/** 無人現場應到且無需錄影／Zoom（含空班、全員僅事假／病假）→ 標明不用上堂 */
function isNoTeachingNeeded(lesson: LessonPayload): boolean {
  if (lesson.no_teaching_needed === true) return true
  const attending = (lesson.student_names ?? []).filter((n) => String(n).trim()).length
  const zoom = (lesson.zoom_or_record_names ?? []).filter((n) => String(n).trim()).length
  return attending === 0 && zoom === 0
}

type TeacherPayload = {
  teacher_id: string
  teacher_name: string | null
  teacher_english_name: string | null
  /** teachers.honorific：Ms.／Mr.；缺則 Mr./Ms. */
  honorific?: string | null
  notification_email: string | null
  lessons: LessonPayload[]
}

/** 自動排程由香港曆日此日起寄出（含當日）；10/12 已人手寄過，自 10/13 起自動 */
const AUTO_SEND_FROM_YMD = "2026-10-13"
/** 此日（含）起自動排程改香港 17:37，寄出翌日課堂。18:00／20:00 舊槽一律略過。 */
const SEND_AT_1737_FROM_YMD = "2026-10-20"

function hkYmd(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>
  return `${parts.year}-${parts.month}-${parts.day}`
}

function hkTomorrowYmd(d = new Date()): string {
  const today = new Date(`${hkYmd(d)}T12:00:00+08:00`)
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const y = tomorrow.getUTCFullYear()
  const m = String(tomorrow.getUTCMonth() + 1).padStart(2, "0")
  const day = String(tomorrow.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatHm(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim()
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t || "—"
  return `${m[1].padStart(2, "0")}:${m[2]}`
}

function cnCount(n: number): string {
  if (n >= 0 && n < CN_COUNT.length) return CN_COUNT[n]!
  return String(n)
}

function joinNames(names: string[] | null | undefined): string {
  return (names ?? []).map((n) => String(n).trim()).filter(Boolean).join("、")
}

const WEEKDAY_ZH = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]

function displayName(t: TeacherPayload): string {
  return String(t.teacher_english_name ?? t.teacher_name ?? "").trim() || "老師"
}

function honorific(t: TeacherPayload): "Ms." | "Mr." | "Mr./Ms." {
  const raw = String(t.honorific ?? "").trim()
  if (raw === "Ms." || raw === "Mr.") return raw
  return "Mr./Ms."
}

function salutation(t: TeacherPayload): string {
  return `${honorific(t)} ${displayName(t)}`
}

function formatYmdZh(ymd: string | null | undefined): string | null {
  const m = String(ymd ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return `${Number(m[2])}月${Number(m[3])}日`
}

/** 2026-10-16 → 16/10（主旨用；不補零） */
function formatYmdSlashDm(ymd: string): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ymd
  return `${Number(m[3])}/${Number(m[2])}`
}

/** 2026-10-16 → 2026年10月16日星期五 */
function formatYmdFullZhWithWeekday(ymd: string): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ymd
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const weekday = WEEKDAY_ZH[new Date(`${ymd}T12:00:00+08:00`).getUTCDay()] ?? ""
  return `${y}年${mo}月${d}日${weekday}`
}

function buildRemarks(lesson: LessonPayload): string {
  const parts: string[] = []
  const zoom = (lesson.zoom_or_record_names ?? []).map((n) => String(n).trim()).filter(Boolean)
  if (zoom.length > 0) parts.push(`請錄影給${zoom.join("、")}`)

  for (const d of lesson.leave_details ?? []) {
    if (d.bucket === "zoom_or_record") continue
    const name = String(d.student_name ?? "").trim()
    if (!name) continue
    const custom = String(d.leave_remarks ?? "").trim()
    if (custom) {
      parts.push(custom)
      continue
    }
    const reason = String(d.leave_reason ?? "").trim() || "請假"
    const makeupDay = formatYmdZh(d.makeup_scheduled_date)
    if (makeupDay) {
      parts.push(`${name}因${reason}請假，將於${makeupDay}補回此堂`)
    } else {
      parts.push(`${name}因${reason}請假`)
    }
  }

  const original = String(lesson.original_teacher_name ?? "").trim()
  if (original) parts.push(`代堂（原：${original}）`)
  if (lesson.is_extra_lesson) parts.push("加堂")

  return parts.join("；")
}

function buildTeacherEmailText(
  t: TeacherPayload,
  targetDateYmd: string,
): { subject: string; text: string } {
  const lessons = [...(t.lessons ?? [])].sort((a, b) =>
    formatHm(a.start_time).localeCompare(formatHm(b.start_time)),
  )
  const n = lessons.length
  const who = salutation(t)
  const name = displayName(t)
  const subject =
    `【明學教育】明日(${formatYmdSlashDm(targetDateYmd)}）課堂提醒（${name}）`

  const blocks = lessons.map((lesson, i) => {
    const code = String(lesson.course_code_full ?? "").trim()
    const course =
      String(lesson.course_name ?? lesson.subject ?? "課堂").trim() || "課堂"
    const baseTitle = code ? `${code} ${course}` : course
    const idle = isNoTeachingNeeded(lesson)
    const title = idle ? `${baseTitle} 【不用上堂】` : baseTitle
    const time = `${formatHm(lesson.start_time)}-${formatHm(lesson.end_time)}`
    const room = String(lesson.classroom_name ?? "").trim()
    const lines = [
      `${i + 1}. ${title}`,
      `時間︰${time}`,
      `課堂︰${room}`,
    ]
    if (idle) lines.push("狀態︰不用上堂")
    lines.push(
      `學生名單︰${joinNames(lesson.student_names)}`,
      `錄影／zoom名單︰${joinNames(lesson.zoom_or_record_names)}`,
      `事假／病假名單︰${joinNames(lesson.leave_names)}`,
      `備註（如有）︰${buildRemarks(lesson)}`,
    )
    return lines.join("\n")
  })

  const text = [
    who,
    "",
    `明天(${formatYmdFullZhWithWeekday(targetDateYmd)}），閣下有${cnCount(n)}節排程紀錄。`,
    "",
    blocks.join("\n\n"),
    "",
    "煩請上堂後及時點名，方便前台同事跟進。如有問題，請聯絡Christine Fan",
    "（此乃系統自動生成提醒，請勿回覆本電郵）",
  ].join("\n")

  return { subject, text }
}


const BCC_ADMIN = ["cfan@mainhope.edu.hk"]

async function sendEmail(input: {
  to: string[]
  subject: string
  text: string
  /** 預設 BCC 行政；模擬／正式均加，除非明確關閉 */
  bcc?: string[] | null
}): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim()
  const from = Deno.env.get("RESEND_FROM")?.trim() || "明學教育 <noreply@mainhope.edu.hk>"
  if (!apiKey) return { ok: false, message: "未設定 RESEND_API_KEY，無法寄出通知。" }
  if (input.to.length === 0) return { ok: false, message: "未設定收件人。" }

  const bcc = input.bcc === null
    ? []
    : (input.bcc ?? BCC_ADMIN).map((e) => e.trim()).filter(Boolean)
  // 避免 To 與 BCC 重複
  const toSet = new Set(input.to.map((e) => e.trim().toLowerCase()))
  const bccUnique = bcc.filter((e) => !toSet.has(e.toLowerCase()))

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      ...(bccUnique.length ? { bcc: bccUnique } : {}),
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
    console.error("tomorrow-teacher-lesson-reminder Resend failed", res.status, payload)
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
  if (req.method !== "POST") return jsonResponse({ error: "僅支援 POST" }, 405)
  if (!authorizeCron(req)) return jsonResponse({ error: "未授權" }, 401)

  let dryRun = false
  let force = false
  let simulateTo: string | null = null
  let targetDate: string | null = null
  let slot: "1737" | "skip" | null = null
  let sendDay: string | null = null
  try {
    const body = await req.json().catch(() => ({})) as {
      dry_run?: unknown
      force?: unknown
      simulate_to?: unknown
      target_date?: unknown
      send_day?: unknown
      slot?: unknown
    }
    dryRun = body?.dry_run === true
    force = body?.force === true
    const sim = String(body?.simulate_to ?? "").trim().replace(/＠/g, "@")
    simulateTo = sim.includes("@") ? sim : null
    const td = String(body?.target_date ?? "").trim()
    targetDate = isYmd(td) ? td : null
    const sd = String(body?.send_day ?? "").trim()
    sendDay = isYmd(sd) ? sd : null
    const rawSlot = String(body?.slot ?? "").trim()
    if (rawSlot === "1737") slot = "1737"
    else if (rawSlot) slot = "skip"
  } catch {
    dryRun = false
  }

  const url = Deno.env.get("SUPABASE_URL")?.trim()
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim()
  if (!url || !serviceKey) {
    return jsonResponse({ error: "缺少 SUPABASE_URL 或 SERVICE_ROLE_KEY" }, 500)
  }

  // 自動 cron：香港 AUTO_SEND_FROM_YMD 起真寄；人手 force／dry_run／simulate 不受限。
  // slot 由 Actions 帶入：1737＝香港 17:37。18／20／retired 等舊槽略過。未帶 slot 的人手呼叫仍照寄。
  const todayHk = hkYmd()
  if (!force && !dryRun && !simulateTo && todayHk < AUTO_SEND_FROM_YMD) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: `自動寄出由 ${AUTO_SEND_FROM_YMD} 起；今日香港 ${todayHk} 未開始`,
      today_hk: todayHk,
    })
  }
  if (!force && !dryRun && !simulateTo && slot === "skip") {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "已改為香港 17:37；略過舊排程",
      today_hk: todayHk,
      slot,
    })
  }
  if (!force && !dryRun && !simulateTo && slot === "1737" && todayHk < SEND_AT_1737_FROM_YMD) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: `香港 17:37 由 ${SEND_AT_1737_FROM_YMD} 起；今日香港 ${todayHk} 未開始`,
      today_hk: todayHk,
      slot,
    })
  }
  if (!force && !dryRun && !simulateTo && slot === "1737") {
    const clock = hkClock()
    if (sendDay && sendDay !== clock.ymd) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: "已過香港當日，不再寄出",
        send_day: sendDay,
        today_hk: clock.ymd,
      })
    }
    if (!inMinuteWindow(clock, 17 * 60 + 30, 19 * 60 + 30)) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: "不在香港 17:30–19:30",
        today_hk: clock.ymd,
      })
    }
    const day = sendDay ?? clock.ymd
    const expected = addDaysYmd(day, 1)
    if (targetDate && targetDate !== expected) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: "目標上課日與發送日不一致",
        send_day: day,
        target_date: targetDate,
      })
    }
    targetDate = expected
  }

  const dateYmd = targetDate ?? hkTomorrowYmd()
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin.rpc("teacher_tomorrow_lesson_email_payload", {
    p_date: dateYmd,
  })
  if (error) {
    console.error("teacher_tomorrow_lesson_email_payload failed", error)
    return jsonResponse({ error: `查詢失敗：${error.message}` }, 500)
  }

  const teachers = (Array.isArray(data) ? data : []) as TeacherPayload[]

  const emails = teachers.map((t) => {
    const built = buildTeacherEmailText(t, dateYmd)
    return {
      teacher_id: t.teacher_id,
      teacher_name: t.teacher_name,
      teacher_english_name: t.teacher_english_name,
      honorific: t.honorific ?? null,
      notification_email: t.notification_email,
      lesson_count: t.lessons?.length ?? 0,
      subject: built.subject,
      text: built.text,
    }
  })

  if (dryRun) {
    return jsonResponse({
      ok: true,
      dry_run: true,
      target_date: dateYmd,
      teacher_count: emails.length,
      lesson_count: emails.reduce((n, e) => n + e.lesson_count, 0),
      emails,
    })
  }

  if (simulateTo) {
    const digest = [
      `【模擬】明日課堂提醒預覽（目標日 ${dateYmd}）`,
      `共 ${emails.length} 位老師、${emails.reduce((n, e) => n + e.lesson_count, 0)} 堂。`,
      "以下為各老師將收到的正文（正式環境會分拆寄出）。",
      "",
      ...emails.flatMap((e, i) => [
        "==========",
        `（模擬 ${i + 1}/${emails.length}）主旨：${e.subject}`,
        `原定收件：${e.notification_email || "（無 notification_email）"}`,
        "",
        e.text,
        "",
      ]),
    ].join("\n")

    const sent = await sendEmail({
      to: [simulateTo],
      subject: `【模擬】明日課堂提醒預覽（${dateYmd}・${emails.length}位老師）`,
      text: digest,
    })
    if (!sent.ok) return jsonResponse({ error: sent.message }, 502)
    return jsonResponse({
      ok: true,
      simulate_to: simulateTo,
      target_date: dateYmd,
      teacher_count: emails.length,
      lesson_count: emails.reduce((n, e) => n + e.lesson_count, 0),
      resend_id: sent.id ?? null,
    })
  }

  const results: Array<{
    teacher_id: string
    to: string | null
    ok: boolean
    skipped?: string
    resend_id?: string | null
    error?: string
  }> = []

  for (const e of emails) {
    const to = String(e.notification_email ?? "").trim()
    if (!to) {
      results.push({
        teacher_id: e.teacher_id,
        to: null,
        ok: false,
        skipped: "無 notification_email",
      })
      continue
    }
    if (!force && !dryRun && !simulateTo) {
      try {
        const action = await claimScheduledEmail(admin, "tomorrow-lesson", dateYmd, to)
        if (action === "skip") {
          results.push({
            teacher_id: e.teacher_id,
            to,
            ok: true,
            skipped: "已寄出",
          })
          continue
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return jsonResponse({ error: `寄出紀錄失敗：${message}` }, 500)
      }
    }
    const sent = await sendEmail({ to: [to], subject: e.subject, text: e.text })
    if (!force && !dryRun && !simulateTo) {
      try {
        await finishScheduledEmail(
          admin,
          "tomorrow-lesson",
          dateYmd,
          to,
          sent.ok,
          sent.ok ? sent.id ?? null : null,
          sent.ok ? null : sent.message,
        )
      } catch (err) {
        console.error("finish tomorrow-lesson failed", err)
      }
    }
    if (!sent.ok) {
      results.push({
        teacher_id: e.teacher_id,
        to,
        ok: false,
        error: sent.message,
      })
      continue
    }
    results.push({
      teacher_id: e.teacher_id,
      to,
      ok: true,
      resend_id: sent.id ?? null,
    })
  }

  return jsonResponse({
    ok: true,
    target_date: dateYmd,
    teacher_count: emails.length,
    sent: results.filter((r) => r.ok && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.ok && !r.skipped).length,
    results,
  })
})
