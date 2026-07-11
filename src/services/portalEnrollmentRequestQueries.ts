import { formatUnknownError } from "@/lib/formatUnknownError"
import { supabase } from "@/lib/supabaseClient"

export type PortalEnrollmentRequestStatus =
 | "submitted"
 | "approved"
 | "rejected"
 | "cancelled"

export type PortalEnrollmentRequestLine = {
 id: string
 classId: string
 enrollmentPeriod: string | null
 scheduleIds: string[]
 unitPrice: number | null
 lessonCount: number
 lineSubtotal: number
 classLabel: string | null
}

export type PortalEnrollmentRequestRow = {
 id: string
 studentId: string
 studentName: string
 studentCode: string | null
 status: PortalEnrollmentRequestStatus
 estimatedSubtotal: number
 estimatedTotal: number
 parentNote: string | null
 staffNote: string | null
 paymentId: string | null
 reviewedAt: string | null
 createdAt: string
 lines: PortalEnrollmentRequestLine[]
}

export const PORTAL_ENROLLMENT_STATUS_LABEL: Record<PortalEnrollmentRequestStatus, string> = {
 submitted: "待審核",
 approved: "已核准",
 rejected: "已拒絕",
 cancelled: "已取消",
}

function num(v: unknown, fallback = 0): number {
 if (v == null || v === "") return fallback
 const n = typeof v === "number" ? v : Number(v)
 return Number.isFinite(n) ? n : fallback
}

function asStatus(raw: unknown): PortalEnrollmentRequestStatus {
 const s = String(raw ?? "")
 if (s === "approved" || s === "rejected" || s === "cancelled" || s === "submitted") return s
 return "submitted"
}

function mapLine(r: Record<string, unknown>): PortalEnrollmentRequestLine {
 const scheduleRaw = r.schedule_ids
 const scheduleIds = Array.isArray(scheduleRaw)
  ? scheduleRaw.map((x) => String(x)).filter(Boolean)
  : []
 return {
  id: String(r.id),
  classId: String(r.class_id),
  enrollmentPeriod: r.enrollment_period != null ? String(r.enrollment_period) : null,
  scheduleIds,
  unitPrice: r.unit_price != null ? num(r.unit_price) : null,
  lessonCount: Math.max(0, Math.floor(num(r.lesson_count))),
  lineSubtotal: num(r.line_subtotal),
  classLabel: r.class_label != null ? String(r.class_label) : null,
 }
}

function mapRequest(r: Record<string, unknown>): PortalEnrollmentRequestRow {
 const st = r.students as Record<string, unknown> | null
 const linesRaw = r.portal_enrollment_request_lines
 const linesArr = Array.isArray(linesRaw) ? linesRaw : []
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  studentName: st?.full_name != null ? String(st.full_name) : "—",
  studentCode: st?.student_code != null ? String(st.student_code) : null,
  status: asStatus(r.status),
  estimatedSubtotal: num(r.estimated_subtotal),
  estimatedTotal: num(r.estimated_total),
  parentNote: r.parent_note != null ? String(r.parent_note) : null,
  staffNote: r.staff_note != null ? String(r.staff_note) : null,
  paymentId: r.payment_id != null ? String(r.payment_id) : null,
  reviewedAt: r.reviewed_at != null ? String(r.reviewed_at) : null,
  createdAt: String(r.created_at ?? ""),
  lines: linesArr.map((x) => mapLine(x as Record<string, unknown>)),
 }
}

export type PortalEnrollmentRequestListQuery = {
 /** `submitted` = 待審核；omit / empty = 全部 */
 status?: PortalEnrollmentRequestStatus | ""
 limit?: number
}

export async function fetchPortalEnrollmentRequests(
 opts: PortalEnrollmentRequestListQuery = {}
): Promise<PortalEnrollmentRequestRow[]> {
 if (!supabase) return []
 const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500)

 let q = supabase
  .from("portal_enrollment_requests")
  .select(
   [
    "id",
    "student_id",
    "status",
    "estimated_subtotal",
    "estimated_total",
    "parent_note",
    "staff_note",
    "payment_id",
    "reviewed_at",
    "created_at",
    "students ( id, full_name, student_code )",
    "portal_enrollment_request_lines ( id, class_id, enrollment_period, schedule_ids, unit_price, lesson_count, line_subtotal, class_label, created_at )",
   ].join(", ")
  )
  .order("created_at", { ascending: false })
  .limit(limit)

 if (opts.status) {
  q = q.eq("status", opts.status)
 }

 const { data, error } = await q
 if (error) throw new Error(formatUnknownError(error))

 return (data ?? []).map((row) => {
  const mapped = mapRequest(row as Record<string, unknown>)
  mapped.lines = [...mapped.lines].sort((a, b) => a.classLabel?.localeCompare(b.classLabel ?? "", "zh-HK") ?? 0)
  return mapped
 })
}

export function summarizeRequestLines(lines: PortalEnrollmentRequestLine[]): string {
 if (lines.length === 0) return "—"
 return lines
  .map((l) => {
   const label = l.classLabel?.trim() || "班別"
   const period = l.enrollmentPeriod ? `（${l.enrollmentPeriod}）` : ""
   return `${label}${period}`
  })
  .join("、")
}

export async function reviewRequest(
 requestId: string,
 approve: boolean,
 staffNote?: string | null
): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const note = staffNote?.trim() ? staffNote.trim() : null
 const { data, error } = await supabase.rpc("review_portal_enrollment_request", {
  p_request_id: requestId,
  p_approve: approve,
  p_staff_note: note,
 })
 if (error) throw new Error(formatUnknownError(error))
 return data != null ? String(data) : requestId
}
