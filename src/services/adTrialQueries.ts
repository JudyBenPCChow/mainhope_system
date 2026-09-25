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

export async function submitAdTrial(input: {
  fullName: string
  school: string
  grade: string
  phone: string
  note: string
  lines: { class_id: string; schedule_id: string }[]
  electedSubjectCodes: string[]
  company: string
  contactMethod: "WhatsApp" | "WeChat"
  wechatId: string
}): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.rpc("ad_trial_submit", {
    p_full_name: input.fullName.trim(),
    p_school: input.school.trim(),
    p_grade: input.grade.trim(),
    p_phone: input.phone.trim(),
    p_note: input.note.trim() || null,
    p_lines: input.lines,
    p_elected_subject_codes: input.electedSubjectCodes
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean),
    p_company: input.company,
    p_contact_method: input.contactMethod,
    p_wechat_id: input.contactMethod === "WeChat" ? input.wechatId.trim() : null,
  })
  if (error) throw rpcError(error)
}

export async function submitAdTrialInterest(input: {
  fullName: string
  school: string
  grade: string
  phone: string
  note: string
  subjects: string[]
  company: string
  contactMethod: "WhatsApp" | "WeChat"
  wechatId: string
}): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.rpc("ad_trial_interest_submit", {
    p_full_name: input.fullName.trim(),
    p_school: input.school.trim(),
    p_grade: input.grade.trim(),
    p_phone: input.phone.trim(),
    p_note: input.note.trim() || null,
    p_subjects: input.subjects.map((s) => s.trim()).filter(Boolean),
    p_company: input.company,
    p_contact_method: input.contactMethod,
    p_wechat_id: input.contactMethod === "WeChat" ? input.wechatId.trim() : null,
  })
  if (error) throw rpcError(error)
}
