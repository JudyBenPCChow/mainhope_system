import { forEachIdChunk, DEFAULT_ID_CHUNK } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"

export type ContactUpdateStatus =
  | "open"
  | "submitted"
  | "approved"
  | "expired"
  | "voided"

/** 公開表單可改欄（baseline／payload） */
export type ContactUpdateFormPayload = {
  primary_contact_person: string
  student_phone: string
  student_phone_country_code: string
  student_preferred_contact_method: string
  student_wechat_id: string
  parent_phone: string
  parent_phone_country_code: string
  parent_preferred_contact_method: string
  parent_wechat_id: string
}

export type ContactUpdateIdentity = {
  full_name: string
  student_code: string
  grade: string
  school: string
}

export type ContactUpdateTokenRow = {
  id: string
  token: string
  student_id: string
  status: ContactUpdateStatus
  baseline: ContactUpdateFormPayload
  payload: ContactUpdateFormPayload
  expires_at: string
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  reused?: boolean
}

export type ContactUpdatePublicSession = ContactUpdateTokenRow & {
  identity: ContactUpdateIdentity
  form: ContactUpdateFormPayload
}

function emptyForm(): ContactUpdateFormPayload {
  return {
    primary_contact_person: "家長",
    student_phone: "",
    student_phone_country_code: "+852",
    student_preferred_contact_method: "WhatsApp",
    student_wechat_id: "",
    parent_phone: "",
    parent_phone_country_code: "+852",
    parent_preferred_contact_method: "WhatsApp",
    parent_wechat_id: "",
  }
}

function asForm(raw: unknown): ContactUpdateFormPayload {
  const o =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const base = emptyForm()
  return {
    primary_contact_person: String(o.primary_contact_person ?? base.primary_contact_person),
    student_phone: String(o.student_phone ?? ""),
    student_phone_country_code: String(o.student_phone_country_code ?? "+852"),
    student_preferred_contact_method: String(
      o.student_preferred_contact_method ?? "WhatsApp"
    ),
    student_wechat_id: String(o.student_wechat_id ?? ""),
    parent_phone: String(o.parent_phone ?? ""),
    parent_phone_country_code: String(o.parent_phone_country_code ?? "+852"),
    parent_preferred_contact_method: String(
      o.parent_preferred_contact_method ?? "WhatsApp"
    ),
    parent_wechat_id: String(o.parent_wechat_id ?? ""),
  }
}

function asTokenRow(raw: Record<string, unknown>): ContactUpdateTokenRow {
  return {
    id: String(raw.id ?? ""),
    token: String(raw.token ?? ""),
    student_id: String(raw.student_id ?? ""),
    status: String(raw.status ?? "open") as ContactUpdateStatus,
    baseline: asForm(raw.baseline),
    payload: asForm(raw.payload),
    expires_at: String(raw.expires_at ?? ""),
    submitted_at: raw.submitted_at != null ? String(raw.submitted_at) : null,
    approved_at: raw.approved_at != null ? String(raw.approved_at) : null,
    created_at: String(raw.created_at ?? ""),
    reused: raw.reused === true,
  }
}

function rpcError(error: { message?: string } | null): Error {
  return new Error(error?.message ?? "操作失敗")
}

export function contactUpdatePublicUrl(token: string, origin = window.location.origin): string {
  return `${origin}/ContactUpdate/${encodeURIComponent(token)}`
}

/** 批量建立／重用進行中連結 */
export async function createContactUpdateTokens(
  studentIds: string[]
): Promise<ContactUpdateTokenRow[]> {
  if (!supabase) throw new Error("Supabase 未設定")
  const ids = [...new Set(studentIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return []

  const chunks = await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!.rpc("contact_update_create", {
      p_student_ids: slice,
    })
    if (error) throw rpcError(error)
    const arr = Array.isArray(data) ? data : []
    return arr.map((row) => asTokenRow((row ?? {}) as Record<string, unknown>))
  })
  return chunks.flat()
}

export async function getContactUpdateSession(
  token: string
): Promise<ContactUpdatePublicSession> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("contact_update_get", {
    p_token: token.trim(),
  })
  if (error) throw rpcError(error)
  const raw = (data ?? {}) as Record<string, unknown>
  const identityRaw =
    raw.identity && typeof raw.identity === "object" && !Array.isArray(raw.identity)
      ? (raw.identity as Record<string, unknown>)
      : {}
  return {
    ...asTokenRow(raw),
    identity: {
      full_name: String(identityRaw.full_name ?? ""),
      student_code: String(identityRaw.student_code ?? ""),
      grade: String(identityRaw.grade ?? ""),
      school: String(identityRaw.school ?? ""),
    },
    form: asForm(raw.form ?? raw.baseline),
  }
}

export async function submitContactUpdateSession(
  token: string,
  payload: ContactUpdateFormPayload
): Promise<ContactUpdateTokenRow> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("contact_update_submit", {
    p_token: token.trim(),
    p_payload: payload,
  })
  if (error) throw rpcError(error)
  return asTokenRow((data ?? {}) as Record<string, unknown>)
}

export async function approveContactUpdateToken(token: string): Promise<ContactUpdateTokenRow> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("contact_update_approve", {
    p_token: token.trim(),
  })
  if (error) throw rpcError(error)
  return asTokenRow((data ?? {}) as Record<string, unknown>)
}

export async function voidContactUpdateToken(token: string): Promise<ContactUpdateTokenRow> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("contact_update_void", {
    p_token: token.trim(),
  })
  if (error) throw rpcError(error)
  return asTokenRow((data ?? {}) as Record<string, unknown>)
}

/** 職員列表：按學生 id 查最新／進行中 token（RLS） */
export async function fetchContactUpdateTokensByStudentIds(
  studentIds: string[]
): Promise<ContactUpdateTokenRow[]> {
  if (!supabase) throw new Error("Supabase 未設定")
  const ids = [...new Set(studentIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return []

  const chunks = await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("contact_update_tokens")
      .select(
        "id, token, student_id, status, baseline, payload, expires_at, submitted_at, approved_at, created_at"
      )
      .in("student_id", slice)
      .order("created_at", { ascending: false })
    if (error) throw rpcError(error)
    return (data ?? []).map((row) => asTokenRow(row as Record<string, unknown>))
  })

  // 每位學生只留最新一條（列表已按 created_at desc）
  const byStudent = new Map<string, ContactUpdateTokenRow>()
  for (const row of chunks.flat()) {
    if (!byStudent.has(row.student_id)) byStudent.set(row.student_id, row)
  }
  return [...byStudent.values()]
}

export { emptyForm as emptyContactUpdateForm, asForm as contactUpdateFormFromUnknown }
