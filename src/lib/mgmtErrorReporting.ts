import { appendMgmtSystemError, type AppendMgmtSystemErrorInput } from "@/services/mgmtGodViewQueries"
import { isSupabaseConfigured } from "@/lib/supabaseClient"

const THROTTLE_MS = 60_000
const QUEUE_KEY = "mingxue_admin_mgmt_error_queue_v1"
const MAX_QUEUE = 50
const MAX_DETAIL_LEN = 4000

const throttleMap = new Map<string, number>()

/** 移除或遮罩 detail 中可能之個資（僅啟發式，非完整 DLP） */
export function sanitizeErrorDetail(raw: string | null | undefined): string | null {
 if (raw == null || raw === "") return null
 let s = String(raw).slice(0, MAX_DETAIL_LEN)
 s = s.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]")
 s = s.replace(/(?:\+852|852)?[\s-]?\d{4}[\s-]?\d{4}/g, "[redacted-phone]")
 s = s.replace(/\b\d{8}\b/g, "[redacted-num]")
 return s
}

function throttlePass(source: string, message: string): boolean {
 const key = `${source}\u0000${message}`
 const now = Date.now()
 const prev = throttleMap.get(key) ?? 0
 if (now - prev < THROTTLE_MS) return false
 throttleMap.set(key, now)
 return true
}

function queuePush(input: AppendMgmtSystemErrorInput): void {
 try {
  const raw = localStorage.getItem(QUEUE_KEY)
  const arr: AppendMgmtSystemErrorInput[] = raw ? (JSON.parse(raw) as AppendMgmtSystemErrorInput[]) : []
  arr.push({
   ...input,
   detail: sanitizeErrorDetail(input.detail ?? undefined),
  })
  while (arr.length > MAX_QUEUE) arr.shift()
  localStorage.setItem(QUEUE_KEY, JSON.stringify(arr))
 } catch {
  /* ignore quota / parse */
 }
}

/** App 啟動時嘗試送出 localStorage 佇列（Supabase 已設定時） */
export async function flushMgmtErrorQueue(): Promise<void> {
 if (!isSupabaseConfigured || typeof localStorage === "undefined") return
 try {
  const raw = localStorage.getItem(QUEUE_KEY)
  if (!raw) return
  const arr: AppendMgmtSystemErrorInput[] = JSON.parse(raw) as AppendMgmtSystemErrorInput[]
  localStorage.removeItem(QUEUE_KEY)
  for (const item of arr) {
   const ok = await appendMgmtSystemError({
    ...item,
    detail: sanitizeErrorDetail(item.detail ?? undefined),
   })
   if (!ok) {
    queuePush(item)
    break
   }
  }
 } catch {
  /* ignore */
 }
}

export function userMessageFromUnknown(e: unknown): string {
 if (e instanceof Error) return e.message
 if (e && typeof e === "object" && "message" in e) {
  return String((e as { message: unknown }).message)
 }
 return "發生錯誤，請稍後再試。"
}

function detailFromUnknown(e: unknown): string | null {
 if (e instanceof Error && e.stack) return sanitizeErrorDetail(e.stack)
 return null
}

export type ReportUserFacingErrorOptions = {
 source: string
 severity?: string
 /** 畫面紅字區塊（與多頁 `setErr` 慣例一致） */
 setErr?: (msg: string | null) => void
 /** 覆寫顯示與上報之短句 */
 userMessage?: string
 /** 額外附帶於 detail（會經 sanitize） */
 detailFrom?: unknown
}

/**
 * 於 UI `catch` 使用：可選 `setErr` 顯示紅字，並節流後寫入 `mgmt_system_errors`；
 * 未設定 Supabase 或寫入失敗時寫入 localStorage 佇列。
 * 僅在 UI 層呼叫，避免與 service 雙寫。
 */
export function reportUserFacingError(e: unknown, opt: ReportUserFacingErrorOptions): void {
 const message = opt.userMessage ?? userMessageFromUnknown(e)
 opt.setErr?.(message)
 if (!throttlePass(opt.source, message)) return
 const detail =
  opt.detailFrom != null
   ? sanitizeErrorDetail(String(opt.detailFrom))
   : detailFromUnknown(e)
 const input: AppendMgmtSystemErrorInput = {
  severity: opt.severity ?? "error",
  source: opt.source,
  message,
  detail,
 }
 void (async () => {
  if (!isSupabaseConfigured) {
   queuePush(input)
   return
  }
  const ok = await appendMgmtSystemError({
   ...input,
   detail: sanitizeErrorDetail(input.detail ?? undefined),
  })
  if (!ok) queuePush(input)
 })()
}
