import { createClient } from "jsr:@supabase/supabase-js@2"

export type HkClock = { ymd: string; hour: number; minute: number }

type RpcError = { message: string }
type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: RpcError | null }>
}

export function authorizeCron(req: Request): boolean {
  const secrets = [
    Deno.env.get("SCHEDULED_EMAIL_CRON_SECRET"),
    Deno.env.get("TOMORROW_LESSON_CRON_SECRET"),
    Deno.env.get("MISSING_ROLL_CALL_CRON_SECRET"),
  ].map((s) => String(s ?? "").trim()).filter(Boolean)
  if (secrets.length === 0) return false
  const auth = req.headers.get("authorization")?.trim() ?? ""
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : ""
  const headerSecret = req.headers.get("x-cron-secret")?.trim() ?? ""
  return secrets.includes(bearer) || secrets.includes(headerSecret)
}

export function hkClock(d = new Date()): HkClock {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  }
}

export function addDaysYmd(ymd: string, days: number): string {
  const base = new Date(`${ymd}T12:00:00+08:00`)
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
  const y = next.getUTCFullYear()
  const m = String(next.getUTCMonth() + 1).padStart(2, "0")
  const day = String(next.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function inMinuteWindow(clock: HkClock, startMin: number, endMin: number): boolean {
  const mins = clock.hour * 60 + clock.minute
  return mins >= startMin && mins <= endMin
}

export function hkWeekday(ymd: string): number {
  return new Date(`${ymd}T12:00:00+08:00`).getUTCDay()
}

export function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function serviceClient(): ReturnType<typeof createClient> | null {
  const url = Deno.env.get("SUPABASE_URL")?.trim()
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function claimScheduledEmail(
  admin: RpcClient,
  jobKey: string,
  targetDate: string,
  recipient: string,
): Promise<"send" | "skip"> {
  const { data, error } = await admin.rpc("claim_scheduled_email_send", {
    p_job_key: jobKey,
    p_target_date: targetDate,
    p_recipient: recipient,
  })
  if (error) throw new Error(error.message)
  if (data !== "send" && data !== "skip") {
    throw new Error("寄出紀錄回應無法辨識")
  }
  return data
}

export async function finishScheduledEmail(
  admin: RpcClient,
  jobKey: string,
  targetDate: string,
  recipient: string,
  ok: boolean,
  resendId: string | null,
  errorText: string | null,
): Promise<void> {
  const { error } = await admin.rpc("finish_scheduled_email_send", {
    p_job_key: jobKey,
    p_target_date: targetDate,
    p_recipient: recipient,
    p_ok: ok,
    p_resend_id: resendId,
    p_error: errorText,
  })
  if (error) throw new Error(error.message)
}
