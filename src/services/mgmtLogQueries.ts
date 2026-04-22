import { supabase } from "@/lib/supabaseClient"
import type { MgmtAuditLogRow, MgmtSystemErrorRow } from "@/services/mgmtGodViewQueries"

const PAGE_SIZE = 100

/** 避免 ilike 模式注入：移除 % 與 _ */
function sanitizeIlikeFragment(s: string): string {
 return s.replace(/%/g, "").replace(/_/g, "").trim()
}

function ymdStartIso(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 if (!y || !m || !d) return new Date(0).toISOString()
 return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

/** 結束日當天 23:59:59.999（含當日） */
function ymdEndInclusiveIso(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 if (!y || !m || !d) return new Date().toISOString()
 return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

export type MgmtAuditLogFilters = {
 dateFrom: string | null
 dateTo: string | null
 role: string | null
 actorContains: string | null
 pathContains: string | null
 actionContains: string | null
 offset?: number
}

export async function fetchMgmtAuditLogsFiltered(f: MgmtAuditLogFilters): Promise<MgmtAuditLogRow[]> {
 if (!supabase) return []
 const offset = f.offset ?? 0
 let q = supabase
  .from("mgmt_audit_log")
  .select("id, created_at, actor_label, role, action, path, detail")
  .order("created_at", { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1)

 if (f.dateFrom?.trim()) {
  q = q.gte("created_at", ymdStartIso(f.dateFrom.trim()))
 }
 if (f.dateTo?.trim()) {
  q = q.lte("created_at", ymdEndInclusiveIso(f.dateTo.trim()))
 }
 if (f.role && f.role !== "all") {
  q = q.eq("role", f.role)
 }
 const actor = f.actorContains ? sanitizeIlikeFragment(f.actorContains) : ""
 if (actor.length > 0) {
  q = q.ilike("actor_label", `%${actor}%`)
 }
 const pathP = f.pathContains ? sanitizeIlikeFragment(f.pathContains) : ""
 if (pathP.length > 0) {
  q = q.ilike("path", `%${pathP}%`)
 }
 const actP = f.actionContains ? sanitizeIlikeFragment(f.actionContains) : ""
 if (actP.length > 0) {
  q = q.ilike("action", `%${actP}%`)
 }

 const { data, error } = await q
 if (error) throw error
 return (data ?? []) as MgmtAuditLogRow[]
}

export type MgmtSystemErrorFilters = {
 dateFrom: string | null
 dateTo: string | null
 role: string | null
 actorContains: string | null
 pathContains: string | null
 sourceContains: string | null
 messageContains: string | null
 unresolvedOnly?: boolean
 offset?: number
}

export async function fetchMgmtSystemErrorsFiltered(f: MgmtSystemErrorFilters): Promise<MgmtSystemErrorRow[]> {
 if (!supabase) return []
 const offset = f.offset ?? 0
 let q = supabase
  .from("mgmt_system_errors")
  .select("id, created_at, severity, source, message, detail, resolved_at, actor_label, role, path")
  .order("created_at", { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1)

 if (f.dateFrom?.trim()) {
  q = q.gte("created_at", ymdStartIso(f.dateFrom.trim()))
 }
 if (f.dateTo?.trim()) {
  q = q.lte("created_at", ymdEndInclusiveIso(f.dateTo.trim()))
 }
 if (f.role && f.role !== "all") {
  q = q.eq("role", f.role)
 }
 const actor = f.actorContains ? sanitizeIlikeFragment(f.actorContains) : ""
 if (actor.length > 0) {
  q = q.ilike("actor_label", `%${actor}%`)
 }
 const pathP = f.pathContains ? sanitizeIlikeFragment(f.pathContains) : ""
 if (pathP.length > 0) {
  q = q.ilike("path", `%${pathP}%`)
 }
 const src = f.sourceContains ? sanitizeIlikeFragment(f.sourceContains) : ""
 if (src.length > 0) {
  q = q.ilike("source", `%${src}%`)
 }
 const msg = f.messageContains ? sanitizeIlikeFragment(f.messageContains) : ""
 if (msg.length > 0) {
  q = q.ilike("message", `%${msg}%`)
 }
 if (f.unresolvedOnly) {
  q = q.is("resolved_at", null)
 }

 const { data, error } = await q
 if (error) throw error
 return (data ?? []) as MgmtSystemErrorRow[]
}

export { PAGE_SIZE as MGMT_LOG_PAGE_SIZE }
