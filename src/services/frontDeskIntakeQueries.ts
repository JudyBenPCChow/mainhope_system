import { supabase } from "@/lib/supabaseClient"

export type FrontDeskIntakeStatus = "open" | "submitted" | "consumed" | "expired" | "cancelled"

/** 家長／前台共用的學生基本資料稿（對齊新增學生欄位子集） */
export type FrontDeskIntakePayload = {
 full_name: string
 english_name?: string | null
 gender?: string | null
 grade?: string | null
 registration_status?: string | null
 academic_stage?: string | null
 school?: string | null
 date_of_birth?: string | null
 parent_name?: string | null
 parent_relationship?: string | null
 student_phone?: string | null
 student_phone_country_code?: string | null
 parent_phone?: string | null
 parent_phone_country_code?: string | null
 whatsapp?: string | null
 /** @deprecated 用 parent／student_preferred_contact_method */
 preferred_contact_method?: string | null
 student_preferred_contact_method?: string | null
 parent_preferred_contact_method?: string | null
 student_wechat_id?: string | null
 parent_wechat_id?: string | null
 primary_contact_person?: string | null
 address?: string | null
 remarks?: string | null
}

export type FrontDeskIntakeSession = {
 id: string
 token: string
 status: FrontDeskIntakeStatus
 payload: FrontDeskIntakePayload
 expires_at: string
 submitted_at: string | null
}

function asSession(raw: Record<string, unknown>): FrontDeskIntakeSession {
 const payloadRaw = raw.payload
 const payload =
  payloadRaw && typeof payloadRaw === "object" && !Array.isArray(payloadRaw)
   ? (payloadRaw as FrontDeskIntakePayload)
   : { full_name: "" }
 return {
  id: String(raw.id ?? ""),
  token: String(raw.token ?? ""),
  status: String(raw.status ?? "open") as FrontDeskIntakeStatus,
  payload: {
   full_name: String(payload.full_name ?? ""),
   english_name: payload.english_name ?? null,
   gender: payload.gender ?? null,
   grade: payload.grade ?? null,
   registration_status: payload.registration_status ?? null,
   academic_stage: payload.academic_stage ?? null,
   school: payload.school ?? null,
   date_of_birth: payload.date_of_birth ?? null,
   parent_name: payload.parent_name ?? null,
   parent_relationship: payload.parent_relationship ?? null,
   student_phone: payload.student_phone ?? null,
   student_phone_country_code: payload.student_phone_country_code ?? null,
   parent_phone: payload.parent_phone ?? null,
   parent_phone_country_code: payload.parent_phone_country_code ?? null,
   whatsapp: payload.whatsapp ?? null,
   preferred_contact_method: payload.preferred_contact_method ?? null,
   student_preferred_contact_method: payload.student_preferred_contact_method ?? null,
   parent_preferred_contact_method:
    payload.parent_preferred_contact_method ?? payload.preferred_contact_method ?? null,
   student_wechat_id: payload.student_wechat_id ?? null,
   parent_wechat_id: payload.parent_wechat_id ?? null,
   primary_contact_person: payload.primary_contact_person ?? null,
   address: payload.address ?? null,
   remarks: payload.remarks ?? null,
  },
  expires_at: String(raw.expires_at ?? ""),
  submitted_at: raw.submitted_at != null ? String(raw.submitted_at) : null,
 }
}

function rpcError(error: { message?: string } | null): Error {
 return new Error(error?.message ?? "操作失敗")
}

export async function createFrontDeskIntakeSession(): Promise<FrontDeskIntakeSession> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase.rpc("front_desk_intake_create")
 if (error) throw rpcError(error)
 return asSession((data ?? {}) as Record<string, unknown>)
}

export async function getFrontDeskIntakeSession(token: string): Promise<FrontDeskIntakeSession> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase.rpc("front_desk_intake_get", { p_token: token.trim() })
 if (error) throw rpcError(error)
 return asSession((data ?? {}) as Record<string, unknown>)
}

export async function submitFrontDeskIntakeSession(
 token: string,
 payload: FrontDeskIntakePayload
): Promise<FrontDeskIntakeSession> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase.rpc("front_desk_intake_submit", {
  p_token: token.trim(),
  p_payload: payload,
 })
 if (error) throw rpcError(error)
 return asSession((data ?? {}) as Record<string, unknown>)
}

export async function consumeFrontDeskIntakeSession(token: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.rpc("front_desk_intake_consume", { p_token: token.trim() })
 if (error) throw rpcError(error)
}

export function intakeParentFormUrl(token: string, origin = window.location.origin): string {
 return `${origin}/FrontDeskIntake/${encodeURIComponent(token)}`
}
