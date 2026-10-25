import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import {
  authorizeCron,
  claimScheduledEmail,
  finishScheduledEmail,
  hkClock,
  hkWeekday,
  inMinuteWindow,
  isYmd,
  serviceClient,
} from "../_shared/scheduledEmailLedger.ts"
import { buildTrialPdf, buildTuitionPdf } from "./pdf.ts"
import { buildTrialPayload, buildTuitionPayload, type Row } from "./payload.ts"

const JOBS = ["trial-followup-pdf", "tuition-chase-pdf"] as const
const RECIPIENT = "526956762@qq.com"
const TO = [RECIPIENT]
const CC = ["markyu@mainhope.edu.hk", "cfan@mainhope.edu.hk"]
type JobKey = (typeof JOBS)[number]

function nextSendDate(sentOn: string): string {
  const date = new Date(`${sentOn}T12:00:00+08:00`)
  const weekday = date.getUTCDay()
  const add = weekday === 2 ? 3 : weekday === 5 ? 4 : 1
  if (weekday === 2 || weekday === 5) {
    date.setUTCDate(date.getUTCDate() + add)
  } else {
    for (let i = 1; i <= 7; i += 1) {
      const candidate = new Date(date.getTime())
      candidate.setUTCDate(date.getUTCDate() + i)
      if (candidate.getUTCDay() === 2 || candidate.getUTCDay() === 5) {
        date.setTime(candidate.getTime())
        break
      }
    }
  }
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  const names = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
  return `${y}年${m}月${d}日（${names[date.getUTCDay()]}）`
}

function footer(sentOn: string): string {
  return [
    `下次發送日期：${nextSendDate(sentOn)}上午10:00`,
    "本電郵自動逢星期二及五產生。",
    "",
    "(以上乃系統發出之提醒，切勿回覆本電郵）",
  ].join("\n")
}

function zhDay(ymd: string): string {
  const [, month, day] = ymd.split("-")
  return `${Number(month)}月${Number(day)}日`
}

function slashDm(ymd: string): string {
  const [, month, day] = ymd.split("-")
  return `${Number(day)}/${Number(month)}`
}

function hkd(amount: number): string {
  return Math.round(amount).toLocaleString("en-US")
}

function trialText(payload: ReturnType<typeof buildTrialPayload>, sentOn: string): string {
  return [
    "前台／行政同事︰",
    "",
    `附件為截至${zhDay(sentOn)}的試堂名單，請查閱並跟進。`,
    "",
    `一、待跟進轉化（已試堂、該科尚未轉正）：${payload.followUpRows.length} 人`,
    `二、未來試堂（查庫日及以後、非取消）：${payload.upcomingRows.length} 人`,
    `其他跟進（取消等不入上表者）：${payload.otherFollowups.length} 項`,
    "",
    "轉正後請在試堂頁標「已轉化」。",
    "",
    footer(sentOn),
  ].join("\n")
}

function tuitionText(payload: ReturnType<typeof buildTuitionPayload>, sentOn: string): string {
  const [year, month] = payload.homeworkBillingMonth.split("-")
  return [
    "前台／行政同事︰",
    "",
    `附件為截至${zhDay(sentOn)}的未繳學費清單。`,
    "",
    `專科${payload.periodLabel}：${payload.studentCount} 人，HKD ${hkd(payload.totalAmount)}（尚未計入逾期罰款；每科每月最高 $50）`,
    `功輔${Number(year)}年${Number(month)}月月費：${payload.homeworkStudentCount} 人，HKD ${hkd(payload.homeworkTotalAmount)}（休學不計；不適用逾期罰款）`,
    `合計：${payload.combinedStudentCount} 人，HKD ${hkd(payload.combinedTotalAmount)}`,
    "",
    footer(sentOn),
  ].join("\n")
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  const size = 0x8000
  for (let i = 0; i < bytes.length; i += size) {
    binary += String.fromCharCode(...bytes.subarray(i, i + size))
  }
  return btoa(binary)
}

async function sendEmail(input: {
  subject: string
  text: string
  filename: string
  pdf: Uint8Array
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim() ?? ""
  const from = Deno.env.get("RESEND_FROM")?.trim() || "明學教育 <noreply@mainhope.edu.hk>"
  if (!apiKey) return { ok: false, message: "未設定 RESEND_API_KEY，無法寄出通知。" }
  const response = await fetch("https://api.resend.com/emails", {
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
      attachments: [{ filename: input.filename, content: bytesToBase64(input.pdf) }],
    }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = (payload as { message?: string })?.message
      || (payload as { error?: string })?.error
      || `寄信失敗（${response.status}）`
    return { ok: false, message: String(message) }
  }
  return { ok: true, id: String((payload as { id?: string }).id ?? "") }
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : []
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

  let force = false
  let dryRun = false
  let scheduled = false
  let sendDay: string | null = null
  try {
    const body = await req.json().catch(() => ({})) as {
      force?: unknown
      dry_run?: unknown
      scheduled?: unknown
      send_day?: unknown
    }
    force = body?.force === true
    dryRun = body?.dry_run === true
    scheduled = body?.scheduled === true
    const raw = String(body?.send_day ?? "").trim()
    sendDay = isYmd(raw) ? raw : null
  } catch {
    force = false
  }

  const clock = hkClock()
  const day = sendDay ?? clock.ymd
  if (!force && !dryRun && sendDay && sendDay !== clock.ymd) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "已過香港當日，不再寄出",
      send_day: sendDay,
      today_hk: clock.ymd,
    })
  }
  if (!force && !dryRun && scheduled) {
    const weekday = hkWeekday(day)
    if (weekday !== 2 && weekday !== 5) {
      return jsonResponse({ ok: true, skipped: true, reason: "不是星期二或星期五", send_day: day })
    }
    if (!inMinuteWindow(clock, 10 * 60, 11 * 60 + 30)) {
      return jsonResponse({ ok: true, skipped: true, reason: "不在香港 10:00–11:30", send_day: day })
    }
  }

  const admin = serviceClient()
  if (!admin) return jsonResponse({ error: "缺少 SUPABASE_URL 或 SERVICE_ROLE_KEY" }, 500)

  const { data: sentRows, error: sentError } = await admin
    .from("scheduled_email_sends")
    .select("job_key, status")
    .eq("target_date", day)
    .eq("recipient", RECIPIENT)
    .in("job_key", [...JOBS])
  if (sentError) return jsonResponse({ error: sentError.message }, 500)
  const sentJobs = new Set(
    (sentRows ?? []).filter((row) => row.status === "sent").map((row) => String(row.job_key)),
  )
  if (!force && !dryRun && JOBS.every((job) => sentJobs.has(job))) {
    return jsonResponse({ ok: true, skipped: true, reason: "兩封 PDF 本日已寄出", send_day: day })
  }

  const { data: sources, error: sourceError } = await admin.rpc("admin_pdf_report_sources")
  if (sourceError) return jsonResponse({ error: `查詢失敗：${sourceError.message}` }, 500)
  const bag = (sources ?? {}) as Record<string, unknown>
  const trial = buildTrialPayload(day, rows(bag.trials))
  const tuition = buildTuitionPayload(day, day.slice(0, 7), {
    enrollments: rows(bag.enrollments),
    pools: rows(bag.pools),
    decls: rows(bag.decls),
    payments: rows(bag.payments),
    homework: rows(bag.homework),
  })

  let trialPdf: Uint8Array
  let tuitionPdf: Uint8Array
  try {
    trialPdf = await buildTrialPdf(trial)
    tuitionPdf = await buildTuitionPdf(tuition)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: `PDF 失敗：${message}` }, 500)
  }

  if (dryRun) {
    return jsonResponse({
      ok: true,
      dry_run: true,
      send_day: day,
      trial: {
        follow: trial.followUpRows.length,
        upcoming: trial.upcomingRows.length,
        other: trial.otherFollowups.length,
        pdf_bytes: trialPdf.byteLength,
      },
      tuition: {
        students: tuition.studentCount,
        pools: tuition.poolCount,
        amount: Math.round(tuition.totalAmount),
        homework_students: tuition.homeworkStudentCount,
        homework_amount: Math.round(tuition.homeworkTotalAmount),
        combined_students: tuition.combinedStudentCount,
        combined_amount: Math.round(tuition.combinedTotalAmount),
        pdf_bytes: tuitionPdf.byteLength,
      },
    })
  }

  const jobs: Array<{ key: JobKey; subject: string; text: string; filename: string; pdf: Uint8Array }> = [
    {
      key: "trial-followup-pdf",
      subject: `【系統報告】試堂及轉正（${slashDm(day)})`,
      text: trialText(trial, day),
      filename: `試堂及轉正_${day}.pdf`,
      pdf: trialPdf,
    },
    {
      key: "tuition-chase-pdf",
      subject: `【系統報告】追收學費清單（${slashDm(day)})`,
      text: tuitionText(tuition, day),
      filename: `追收學費清單_${day}.pdf`,
      pdf: tuitionPdf,
    },
  ]

  const results: Array<Record<string, unknown>> = []
  for (const job of jobs) {
    if (!force) {
      try {
        const action = await claimScheduledEmail(admin, job.key, day, RECIPIENT)
        if (action === "skip") {
          results.push({ job: job.key, ok: true, skipped: "已寄出" })
          continue
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return jsonResponse({ error: `寄出紀錄失敗：${message}`, results }, 500)
      }
    }
    const sent = await sendEmail({
      subject: job.subject,
      text: job.text,
      filename: job.filename,
      pdf: job.pdf,
    })
    if (!force) {
      try {
        await finishScheduledEmail(
          admin,
          job.key,
          day,
          RECIPIENT,
          sent.ok,
          sent.ok ? sent.id : null,
          sent.ok ? null : sent.message,
        )
      } catch (err) {
        console.error("finish scheduled email failed", job.key, err)
      }
    }
    results.push(sent.ok
      ? { job: job.key, ok: true, resend_id: sent.id }
      : { job: job.key, ok: false, error: sent.message })
  }

  const failed = results.filter((row) => row.ok === false)
  return jsonResponse({
    ok: failed.length === 0,
    send_day: day,
    results,
  }, failed.length === 0 ? 200 : 502)
})
