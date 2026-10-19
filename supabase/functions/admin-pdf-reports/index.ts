import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { corsHeaders, jsonResponse } from "../_shared/cors.ts"
import {
  authorizeCron,
  hkClock,
  hkWeekday,
  inMinuteWindow,
  isYmd,
  serviceClient,
} from "../_shared/scheduledEmailLedger.ts"

const JOBS = ["trial-followup-pdf", "tuition-chase-pdf"] as const
const RECIPIENT = "526956762@qq.com"
const REPO = "JudyBenPCChow/mainhope_system"
const WORKFLOW = "admin-pdf-reports.yml"

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
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: "不是星期二或星期五",
        send_day: day,
      })
    }
    if (!inMinuteWindow(clock, 10 * 60, 11 * 60 + 30)) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: "不在香港 10:00–11:30",
        send_day: day,
      })
    }
  }

  const admin = serviceClient()
  if (!admin) return jsonResponse({ error: "缺少 SUPABASE_URL 或 SERVICE_ROLE_KEY" }, 500)

  const { data: rows, error } = await admin
    .from("scheduled_email_sends")
    .select("job_key, status")
    .eq("target_date", day)
    .eq("recipient", RECIPIENT)
    .in("job_key", [...JOBS])
  if (error) return jsonResponse({ error: error.message }, 500)

  const sentJobs = new Set(
    (rows ?? []).filter((row) => row.status === "sent").map((row) => String(row.job_key)),
  )
  if (!force && JOBS.every((job) => sentJobs.has(job))) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "兩封 PDF 本日已寄出",
      send_day: day,
    })
  }

  if (dryRun) {
    return jsonResponse({
      ok: true,
      dry_run: true,
      send_day: day,
      already_sent: [...sentJobs],
    })
  }

  const token = Deno.env.get("GITHUB_DISPATCH_TOKEN")?.trim() ?? ""
  if (!token) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "未設定 GITHUB_DISPATCH_TOKEN，本次不觸發 PDF",
      send_day: day,
    })
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          send_day: day,
          scheduled: "true",
          force: force ? "true" : "false",
          dry_run: "false",
        },
      }),
    },
  )
  if (!res.ok) {
    const detail = await res.text()
    return jsonResponse({ error: `GitHub 觸發失敗（${res.status}）：${detail.slice(0, 300)}` }, 502)
  }

  return jsonResponse({
    ok: true,
    dispatched: true,
    send_day: day,
  })
})
