import { todayYmdLocal } from "@/lib/weekdayUtils"
import { supabase } from "@/lib/supabaseClient"

export type MgmtAuditLogRow = {
 id: string
 created_at: string
 actor_label: string
 role: string
 action: string
 path: string | null
 detail: string | null
}

export type MgmtSystemErrorRow = {
 id: string
 created_at: string
 severity: string
 source: string
 message: string
 detail: string | null
 resolved_at: string | null
 actor_label?: string | null
 role?: string | null
 path?: string | null
}

function localDayBoundsIso(ymd: string): { startIso: string; endIso: string } {
 const [y, m, d] = ymd.split("-").map(Number)
 if (!y || !m || !d) {
  const now = new Date()
  return {
   startIso: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
   endIso: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(),
  }
 }
 const start = new Date(y, m - 1, d, 0, 0, 0, 0)
 const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0)
 return { startIso: start.toISOString(), endIso: end.toISOString() }
}

/** 本機「今日」區間內的稽核紀錄，最多 limit 筆（新→舊） */
export async function fetchTodayMgmtAuditLogs(limit = 20): Promise<MgmtAuditLogRow[]> {
 if (!supabase) return []
 const ymd = todayYmdLocal()
 const { startIso, endIso } = localDayBoundsIso(ymd)
 const { data, error } = await supabase
  .from("mgmt_audit_log")
  .select("id, created_at, actor_label, role, action, path, detail")
  .gte("created_at", startIso)
  .lt("created_at", endIso)
  .order("created_at", { ascending: false })
  .limit(limit)
 if (error) throw error
 return (data ?? []) as MgmtAuditLogRow[]
}

/** 最近系統錯誤／問題紀錄，最多 limit 筆（新→舊） */
export async function fetchRecentMgmtSystemErrors(limit = 20): Promise<MgmtSystemErrorRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("mgmt_system_errors")
  .select("id, created_at, severity, source, message, detail, resolved_at, actor_label, role, path")
  .order("created_at", { ascending: false })
  .limit(limit)
 if (error) throw error
 return (data ?? []) as MgmtSystemErrorRow[]
}

export type AppendMgmtAuditInput = {
 action: string
 path?: string | null
 detail?: string | null
}

/** 寫入一筆稽核（登入／操作）；失敗時靜默不擋流程。actor／role 由 DB 蓋過。 */
export async function appendMgmtAuditLog(input: AppendMgmtAuditInput): Promise<void> {
 if (!supabase) return
 const { error } = await supabase.from("mgmt_audit_log").insert({
  actor_label: "",
  role: "",
  action: input.action,
  path: input.path ?? null,
  detail: input.detail ?? null,
 })
 if (error) console.warn("[mgmt_audit_log]", error.message)
}

/**
 * 依目前登入身分寫入操作稽核（不擋主流程）。
 * `path` 預設為 `window.location.pathname`。
 */
export async function logMgmtAuditAction(input: {
 action: string
 path?: string | null
 detail?: string | null
}): Promise<void> {
 const path =
  input.path ??
  (typeof window !== "undefined" ? window.location.pathname : null) ??
  "/"
 await appendMgmtAuditLog({
  action: input.action,
  path,
  detail: input.detail ?? null,
 })
}

/** 寫入稽核；失敗則拋錯（刪計費出席等不可靜默略過的路徑） */
export async function logMgmtAuditActionOrThrow(input: {
 action: string
 path?: string | null
 detail?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定，無法寫入稽核")
 const path =
  input.path ??
  (typeof window !== "undefined" ? window.location.pathname : null) ??
  "/"
 const { error } = await supabase.from("mgmt_audit_log").insert({
  actor_label: "",
  role: "",
  action: input.action,
  path,
  detail: input.detail ?? null,
 })
 if (error) throw new Error(`稽核寫入失敗，已中止操作：${error.message}`)
}

export type AppendMgmtSystemErrorInput = {
 severity: string
 source: string
 message: string
 detail?: string | null
 path?: string | null
}

/** 寫入系統報錯／問題（失敗不擋主流程）；附目前登入身分與路徑。回傳是否寫入成功（供離線佇列重試）。 */
export async function appendMgmtSystemError(input: AppendMgmtSystemErrorInput): Promise<boolean> {
 if (!supabase) return false
 const path =
  input.path ??
  (typeof window !== "undefined" ? window.location.pathname : null) ??
  null
 const { error } = await supabase.from("mgmt_system_errors").insert({
  severity: input.severity,
  source: input.source,
  message: input.message,
  detail: input.detail ?? null,
  actor_label: "",
  role: "",
  path,
 })
 if (error) {
  console.warn("[mgmt_system_errors]", error.message)
  return false
 }
 return true
}
