import { supabase } from "@/lib/supabaseClient"
import { normalizeStudentGrade } from "@/lib/studentGrade"
import { allocateNextStudentCode, insertStudent, isUniqueViolation } from "@/services/studentQueries"

export type LeadSource = "ad_trial" | "phone" | "front_desk" | "website" | "other"
export type LeadStatus = "new" | "contacted" | "converted" | "closed"

export type LeadIntention = {
  id: string
  classId: string | null
  scheduleId: string | null
  classLabel: string
  scheduledDate: string | null
  startTime: string | null
  endTime: string | null
}

export type LeadRow = {
  id: string
  fullName: string
  school: string
  grade: string
  phone: string
  contactMethod: "WhatsApp" | "WeChat"
  wechatId: string
  note: string
  source: LeadSource
  status: LeadStatus
  electedSubjectCodes: string[]
  interestedSubjects: string[]
  convertedStudentId: string | null
  createdAt: string
  intentions: LeadIntention[]
}

export type PhoneMatch = { kind: "student" | "lead"; id: string; label: string }

const SOURCES = new Set<LeadSource>(["ad_trial", "phone", "front_desk", "website", "other"])
const STATUSES = new Set<LeadStatus>(["new", "contacted", "converted", "closed"])

function asSource(raw: unknown): LeadSource {
  const s = String(raw ?? "")
  return SOURCES.has(s as LeadSource) ? (s as LeadSource) : "other"
}

function asStatus(raw: unknown): LeadStatus {
  const s = String(raw ?? "")
  return STATUSES.has(s as LeadStatus) ? (s as LeadStatus) : "new"
}

export function leadPhoneDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (/^852\d{8}$/.test(digits)) return digits.slice(3)
  if (/^\d{8}$/.test(digits)) return digits
  return null
}

function mapLead(row: Record<string, unknown>, intentions: LeadIntention[]): LeadRow {
  const codes = Array.isArray(row.elected_subject_codes)
    ? row.elected_subject_codes.map((c) => String(c ?? "").trim().toUpperCase()).filter(Boolean)
    : []
  return {
    id: String(row.id ?? ""),
    fullName: String(row.full_name ?? ""),
    school: String(row.school ?? ""),
    grade: String(row.grade ?? ""),
    phone: String(row.phone ?? ""),
    contactMethod: row.contact_method === "WeChat" ? "WeChat" : "WhatsApp",
    wechatId: row.wechat_id != null ? String(row.wechat_id) : "",
    note: row.note != null ? String(row.note) : "",
    source: asSource(row.source),
    status: asStatus(row.status),
    electedSubjectCodes: codes,
    interestedSubjects: Array.isArray(row.interested_subjects)
      ? row.interested_subjects.map((s) => String(s ?? "").trim()).filter(Boolean)
      : [],
    convertedStudentId: row.converted_student_id != null ? String(row.converted_student_id) : null,
    createdAt: String(row.created_at ?? ""),
    intentions,
  }
}

export async function fetchLeads(status: LeadStatus): Promise<LeadRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, school, grade, phone, contact_method, wechat_id, note, source, status, elected_subject_codes, interested_subjects, converted_student_id, created_at"
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw error
  const rows = (data ?? []) as Record<string, unknown>[]
  const ids = rows.map((r) => String(r.id))
  const byLead = new Map<string, LeadIntention[]>()
  if (ids.length > 0) {
    const { data: lines, error: lineErr } = await supabase
      .from("lead_trial_intentions")
      .select("id, lead_id, class_id, schedule_id, class_label, scheduled_date, start_time, end_time")
      .in("lead_id", ids)
    if (lineErr) throw lineErr
    for (const raw of lines ?? []) {
      const line = raw as Record<string, unknown>
      const leadId = String(line.lead_id ?? "")
      const list = byLead.get(leadId) ?? []
      list.push({
        id: String(line.id ?? ""),
        classId: line.class_id != null ? String(line.class_id) : null,
        scheduleId: line.schedule_id != null ? String(line.schedule_id) : null,
        classLabel: String(line.class_label ?? ""),
        scheduledDate: line.scheduled_date != null ? String(line.scheduled_date) : null,
        startTime: line.start_time != null ? String(line.start_time).slice(0, 5) : null,
        endTime: line.end_time != null ? String(line.end_time).slice(0, 5) : null,
      })
      byLead.set(leadId, list)
    }
  }
  return rows.map((row) => mapLead(row, byLead.get(String(row.id)) ?? []))
}

export async function insertManualLead(input: {
  fullName: string
  school: string
  grade: string
  phone: string
  note: string
  source: Exclude<LeadSource, "ad_trial" | "website">
}): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const phone = leadPhoneDigits(input.phone)
  const grade = normalizeStudentGrade(input.grade)
  if (!input.fullName.trim()) throw new Error("請填寫姓名")
  if (!grade || grade === "GD" || grade === "NA") throw new Error("請選擇年級")
  if (!phone) throw new Error("請填寫 8 位聯絡電話")
  const { error } = await supabase.from("leads").insert({
    full_name: input.fullName.trim(),
    school: input.school.trim(),
    grade,
    phone,
    phone_normalized: phone,
    note: input.note.trim() || null,
    source: input.source,
    status: "new",
  })
  if (error) throw error
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("leads").update({ status }).eq("id", id)
  if (error) throw error
}

export async function findPhoneMatches(phone: string, exceptLeadId?: string): Promise<PhoneMatch[]> {
  if (!supabase) return []
  const digits = leadPhoneDigits(phone)
  if (!digits) return []
  const like = `%${digits}`
  const [students, leads] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, student_code")
      .or(`whatsapp.ilike.${like},parent_phone.ilike.${like},student_phone.ilike.${like}`)
      .limit(8),
    supabase
      .from("leads")
      .select("id, full_name, status")
      .eq("phone_normalized", digits)
      .limit(8),
  ])
  if (students.error) throw students.error
  if (leads.error) throw leads.error
  const out: PhoneMatch[] = []
  for (const raw of students.data ?? []) {
    const row = raw as Record<string, unknown>
    out.push({
      kind: "student",
      id: String(row.id ?? ""),
      label: [row.full_name, row.student_code].filter(Boolean).join(" · ") || "學生",
    })
  }
  for (const raw of leads.data ?? []) {
    const row = raw as Record<string, unknown>
    const id = String(row.id ?? "")
    if (exceptLeadId && id === exceptLeadId) continue
    out.push({
      kind: "lead",
      id,
      label: `${String(row.full_name ?? "潛在客戶")}（${String(row.status ?? "")}）`,
    })
  }
  return out
}

export async function staleAdIntentions(intentions: LeadIntention[]): Promise<string[]> {
  if (!supabase) return []
  const stale: string[] = []
  for (const line of intentions) {
    const label = line.classLabel || "想試堂次"
    if (!line.scheduleId || !line.classId) {
      stale.push(`${label}：堂次已不存在`)
      continue
    }
    const { data, error } = await supabase
      .from("schedules")
      .select(
        "id, scheduled_date, status, ad_trial_excluded, class_id, classes ( ad_trial_listed, class_kind, status, academic_years ( is_current ) )"
      )
      .eq("id", line.scheduleId)
      .maybeSingle()
    if (error) throw error
    const row = data as Record<string, unknown> | null
    const cls =
      row?.classes && typeof row.classes === "object" && !Array.isArray(row.classes)
        ? (row.classes as Record<string, unknown>)
        : null
    const year =
      cls?.academic_years && typeof cls.academic_years === "object" && !Array.isArray(cls.academic_years)
        ? (cls.academic_years as Record<string, unknown>)
        : null
    const today = new Date().toISOString().slice(0, 10)
    const date = String(row?.scheduled_date ?? "")
    const open =
      row &&
      String(row.class_id ?? "") === line.classId &&
      date >= today &&
      !String(row.status ?? "").includes("取消") &&
      row.ad_trial_excluded !== true &&
      cls?.ad_trial_listed === true &&
      (cls.class_kind === "group" || cls.class_kind === "homework") &&
      !String(cls.status ?? "").includes("已結束") &&
      year?.is_current === true
    if (!open) {
      stale.push(`${label}：已不能按廣告目錄排堂`)
      continue
    }
    const { count, error: countErr } = await supabase
      .from("student_class_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", line.classId)
      .eq("status", "就讀中")
    if (countErr) throw countErr
    if ((count ?? 0) > 5) stale.push(`${label}：就讀中已超過 5 人`)
  }
  return stale
}

export async function convertLeadToStudent(lead: LeadRow): Promise<string> {
  if (!supabase) throw new Error("Supabase 未設定")
  const grade = normalizeStudentGrade(lead.grade)
  if (!grade || grade === "GD" || grade === "NA") throw new Error("年級無法寫入學生主檔")
  const wechat = lead.contactMethod === "WeChat"
  const phone = leadPhoneDigits(lead.phone)
  if (wechat) {
    if (!lead.wechatId.trim()) throw new Error("WeChat ID 無法寫入學生主檔")
  } else if (!phone) {
    throw new Error("電話無法寫入學生主檔")
  }
  const contactFields = wechat
    ? {
        parent_wechat_id: lead.wechatId.trim(),
        parent_preferred_contact_method: "WeChat" as const,
      }
    : {
        whatsapp: phone,
        parent_phone: phone,
        parent_phone_country_code: "852",
        parent_preferred_contact_method: "WhatsApp" as const,
      }
  let code = await allocateNextStudentCode()
  let student
  try {
    student = await insertStudent({
      full_name: lead.fullName.trim(),
      school: lead.school.trim() || null,
      grade,
      student_code: code,
      registration_status: "非注冊",
      ...contactFields,
      elected_subject_codes: lead.electedSubjectCodes,
      remarks: lead.note.trim() || null,
    })
  } catch (e) {
    if (!isUniqueViolation(e)) throw e
    code = await allocateNextStudentCode()
    student = await insertStudent({
      full_name: lead.fullName.trim(),
      school: lead.school.trim() || null,
      grade,
      student_code: code,
      registration_status: "非注冊",
      ...contactFields,
      elected_subject_codes: lead.electedSubjectCodes,
      remarks: lead.note.trim() || null,
    })
  }
  const { error } = await supabase
    .from("leads")
    .update({
      status: "converted",
      converted_student_id: student.id,
      converted_at: new Date().toISOString(),
    })
    .eq("id", lead.id)
  if (error) throw error
  return student.id
}
