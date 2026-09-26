import { supabase } from "@/lib/supabaseClient"
import type {
  TrialInviteClassOption,
  TrialInviteElectiveOption,
  TrialInviteScheduleOption,
} from "@/services/trialInviteQueries"

export type AdTrialCatalog = {
  grade: string
  requiresElectiveSurvey: boolean
  electiveOptions: TrialInviteElectiveOption[]
  classes: TrialInviteClassOption[]
}

function rpcError(error: { message?: string } | null): Error {
  return new Error(error?.message ?? "操作失敗")
}

function asSchedule(raw: Record<string, unknown>): TrialInviteScheduleOption {
  return {
    id: String(raw.id ?? ""),
    scheduled_date: String(raw.scheduled_date ?? "").slice(0, 10),
    start_time: String(raw.start_time ?? "").slice(0, 5),
    end_time: String(raw.end_time ?? "").slice(0, 5),
    session_number:
      raw.session_number == null || raw.session_number === ""
        ? null
        : Number(raw.session_number),
  }
}

function asClass(raw: Record<string, unknown>): TrialInviteClassOption {
  const schedulesRaw = Array.isArray(raw.schedules) ? raw.schedules : []
  return {
    id: String(raw.id ?? ""),
    class_kind: String(raw.class_kind ?? ""),
    subject: String(raw.subject ?? ""),
    subject_code: String(raw.subject_code ?? "").toUpperCase(),
    subject_category: String(raw.subject_category ?? "other"),
    course_code_full: String(raw.course_code_full ?? ""),
    course_name: String(raw.course_name ?? ""),
    teacher_name: String(raw.teacher_name ?? ""),
    day_of_week: String(raw.day_of_week ?? "").trim(),
    time_slot: String(raw.time_slot ?? "").trim(),
    schedules: schedulesRaw.map((s) => asSchedule((s ?? {}) as Record<string, unknown>)),
  }
}

function asElective(raw: Record<string, unknown>): TrialInviteElectiveOption {
  const name = String(raw.name_zh ?? "")
  return {
    code: String(raw.code ?? "").toUpperCase(),
    name_zh: name,
    short_name: String(raw.short_name ?? name),
    offered: raw.offered === true ? true : raw.offered === false ? false : undefined,
  }
}

/** 8 位香港電話；可帶 852。 */
export function adTrialPhoneLooksValid(raw: string): boolean {
  const digits = raw.replace(/\D/g, "")
  return /^852\d{8}$/.test(digits) || /^\d{8}$/.test(digits)
}

export async function getAdTrialCatalog(grade: string): Promise<AdTrialCatalog> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("ad_trial_catalog_get", {
    p_grade: grade.trim(),
  })
  if (error) throw rpcError(error)
  const raw = (data ?? {}) as Record<string, unknown>
  const classesRaw = Array.isArray(raw.classes) ? raw.classes : []
  const electivesRaw = Array.isArray(raw.elective_subject_options)
    ? raw.elective_subject_options
    : []
  return {
    grade: String(raw.grade ?? ""),
    requiresElectiveSurvey: raw.requires_elective_survey === true,
    electiveOptions: electivesRaw.map((e) => asElective((e ?? {}) as Record<string, unknown>)),
    classes: classesRaw.map((c) => asClass((c ?? {}) as Record<string, unknown>)),
  }
}

type AdPublicSubmitBase = {
  fullName: string
  school: string
  grade: string
  phone: string
  note: string
  company: string
  contactMethod: "WhatsApp" | "WeChat"
  wechatId: string
  /** Cloudflare Turnstile token；未啟用 widget 時可空字串 */
  turnstileToken: string
  /** 預設 +852；與 production leads.phone_country_code 對齊 */
  phoneCountryCode?: "+852" | "+86"
}

async function readAdPublicSubmitError(error: unknown, response?: Response): Promise<string | null> {
  const res = response ?? (error as { context?: Response } | null)?.context
  if (!res || typeof res.json !== "function") return null
  try {
    const body = (await res.clone().json()) as { error?: unknown }
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim()
  } catch {
    // ignore
  }
  return null
}

async function invokeAdPublicSubmit(body: Record<string, unknown>): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error, response } = await supabase.functions.invoke("ad-public-submit", { body })
  if (error) {
    const detail = await readAdPublicSubmitError(error, response ?? undefined)
    throw new Error(detail || error.message || "提交失敗")
  }
  if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
    throw new Error(String((data as { error: unknown }).error))
  }
}

export async function submitAdTrial(
  input: AdPublicSubmitBase & {
    lines: { class_id: string; schedule_id: string }[]
    electedSubjectCodes: string[]
  }
): Promise<void> {
  await invokeAdPublicSubmit({
    mode: "trial",
    turnstileToken: input.turnstileToken,
    fullName: input.fullName.trim(),
    school: input.school.trim(),
    grade: input.grade.trim(),
    phone: input.phone.trim(),
    note: input.note.trim(),
    company: input.company,
    contactMethod: input.contactMethod,
    wechatId: input.wechatId.trim(),
    phoneCountryCode: input.phoneCountryCode ?? "+852",
    lines: input.lines,
    electedSubjectCodes: input.electedSubjectCodes
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean),
  })
}

export async function submitAdTrialInterest(
  input: AdPublicSubmitBase & { subjects: string[] }
): Promise<void> {
  await invokeAdPublicSubmit({
    mode: "interest",
    turnstileToken: input.turnstileToken,
    fullName: input.fullName.trim(),
    school: input.school.trim(),
    grade: input.grade.trim(),
    phone: input.phone.trim(),
    note: input.note.trim(),
    company: input.company,
    contactMethod: input.contactMethod,
    wechatId: input.wechatId.trim(),
    phoneCountryCode: input.phoneCountryCode ?? "+852",
    subjects: input.subjects.map((s) => s.trim()).filter(Boolean),
  })
}
