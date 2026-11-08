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

/**
 * 不在 Edge Function 組 PDF。中文 PDF 由 GitHub Actions 的 Python
 * 以系統中文字型（新細明體或 Noto CJK）產生並寄出。
 * 時段在這裡檢查；傳給 Actions 的 scheduled 固定為 false，
 * 避免 Runner 排隊稍遲又被 11:30 擋下。
 */
async function dispatchWorkflow(input: {
  sendDay: string
  dryRun: boolean
  force: boolean
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = Deno.env.get("GITHUB_DISPATCH_TOKEN")?.trim() ?? ""
  if (!token) return { ok: false, message: "未設定 GITHUB_DISPATCH_TOKEN，無法觸發寄出。" }
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "mainhope-admin-pdf-reports",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          dry_run: input.dryRun ? "true" : "false",
          send_day: input.sendDay,
          scheduled: "false",
          force: input.force ? "true" : "false",
        },
      }),
    },
  )
  if (response.status === 204) return { ok: true }
  const detail = (await response.text()).slice(0, 180)
  return { ok: false, message: `GitHub 觸發失敗（${response.status}）：${detail}` }
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

  const dispatched = await dispatchWorkflow({ sendDay: day, dryRun, force })
  if (!dispatched.ok) return jsonResponse({ error: dispatched.message, send_day: day }, 502)
  return jsonResponse({
    ok: true,
    send_day: day,
    dispatched: true,
    dry_run: dryRun,
  })
})
