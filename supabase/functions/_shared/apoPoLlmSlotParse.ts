import type { SupabaseClient } from "jsr:@supabase/supabase-js@2"
import { callDeepSeekJson, parseJsonObject } from "./apoPoDeepSeek.ts"
import {
  APO_PO_GRADE_LABELS,
  APO_PO_TIME_SLOTS,
  gradeLabelToCourseCode,
} from "./apoPoScheduleConstants.ts"
import type { CreateClassSlots } from "./apoPoTypes.ts"

export type ParseCandidates = {
  academicYears: Array<{ id: string; label: string }>
  subjects: Array<{ id: string; name_zh: string; code: string }>
  courses: Array<{ id: string; course_name: string; grade_code: string }>
  teachers: Array<{ id: string; english_name: string; full_name: string }>
  timeSlots: string[]
  gradeLabels: string[]
}

type LlmExtract = {
  academic_year_label?: string | null
  subject_name?: string | null
  grade_label?: string | null
  course_name?: string | null
  teacher_name?: string | null
  day_of_week?: string | null
  time_slot_hint?: string | null
  consecutive_lesson?: boolean | null
  teacher_skip?: boolean | null
}

function norm(s: unknown): string {
  return String(s ?? "").trim()
}

function includesLoose(hay: string, needle: string): boolean {
  const a = hay.trim().toLowerCase()
  const b = needle.trim().toLowerCase()
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

export async function loadParseCandidates(
  admin: SupabaseClient,
  slots: CreateClassSlots
): Promise<ParseCandidates> {
  const [{ data: years }, { data: subjects }, { data: teachers }] = await Promise.all([
    admin
      .from("academic_years")
      .select("id, label")
      .order("start_date", { ascending: false })
      .limit(12),
    admin.from("subjects").select("id, name_zh, code").order("name_zh").limit(40),
    admin
      .from("teachers")
      .select("id, full_name, english_name")
      .eq("status", "active")
      .order("english_name")
      .limit(40),
  ])

  let courses: ParseCandidates["courses"] = []
  if (slots.subject_id && slots.grade_code) {
    const { data } = await admin
      .from("courses")
      .select("id, course_name, grade_code")
      .eq("subject_id", slots.subject_id)
      .eq("grade_code", slots.grade_code)
      .order("course_seq")
      .limit(24)
    courses = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        course_name: String(r.course_name ?? ""),
        grade_code: String(r.grade_code ?? ""),
      }
    })
  }

  return {
    academicYears: (years ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return { id: String(r.id), label: String(r.label ?? "") }
    }),
    subjects: (subjects ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        name_zh: String(r.name_zh ?? ""),
        code: String(r.code ?? ""),
      }
    }),
    courses,
    teachers: (teachers ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id),
        english_name: String(r.english_name ?? ""),
        full_name: String(r.full_name ?? ""),
      }
    }),
    timeSlots: [...APO_PO_TIME_SLOTS],
    gradeLabels: [...APO_PO_GRADE_LABELS],
  }
}

function buildParseSystemPrompt(candidates: ParseCandidates, slots: CreateClassSlots): string {
  return `你是明學補習社「阿Po」的資料抽取助手。用戶正在以對話方式新增班別。

**鐵則**：
- 只從用戶訊息抽取欄位，不可捏造。
- 只可輸出候選清單內存在的學年、科目、課程、老師；唔肯定就填 null。
- 年級只可為：${candidates.gradeLabels.join("、")}
- 時段 time_slot_hint 只可填「開始時間」如 11:30（系統會對應標準時段），或 null。
- day_of_week 用「星期一,星期二」格式，最多七日。
- teacher_skip：用戶明確話唔指定老師時為 true。

目前已填（勿重複抽取已有值，除非用戶明確要改）：
${JSON.stringify(slots)}

候選學年：${candidates.academicYears.map((y) => y.label).join("、") || "（無）"}
候選科目：${candidates.subjects.map((s) => s.name_zh).join("、") || "（無）"}
${candidates.courses.length > 0 ? `候選課程：${candidates.courses.map((c) => c.course_name).join("、")}` : "課程候選：尚未有（需先有科目+年級）"}
候選老師（英文／中文）：${candidates.teachers.slice(0, 20).map((t) => `${t.english_name || t.full_name}`).join("、") || "（無）"}

輸出單一 JSON（不要 markdown）：
{
  "academic_year_label": string | null,
  "subject_name": string | null,
  "grade_label": string | null,
  "course_name": string | null,
  "teacher_name": string | null,
  "day_of_week": string | null,
  "time_slot_hint": string | null,
  "consecutive_lesson": boolean | null,
  "teacher_skip": boolean | null
}`.trim()
}

function matchTimeSlot(hint: string): string | null {
  const t = hint.trim()
  if (!t) return null
  for (const slot of APO_PO_TIME_SLOTS) {
    if (includesLoose(slot, t) || slot.replace(/–/g, "-").includes(t.replace(/–/g, "-"))) return slot
  }
  const hm = t.match(/(\d{1,2}):(\d{2})/)
  if (hm) {
    const target = `${hm[1].padStart(2, "0")}:${hm[2]}`
    return APO_PO_TIME_SLOTS.find((s) => s.startsWith(target)) ?? null
  }
  return null
}

function groundExtract(
  extract: LlmExtract,
  candidates: ParseCandidates,
  slots: CreateClassSlots
): CreateClassSlots {
  const out: CreateClassSlots = { ...slots }
  let gradeChanged = false

  const yearLabel = norm(extract.academic_year_label)
  if (yearLabel && !out.academic_year_id) {
    const hit =
      candidates.academicYears.find((y) => y.label === yearLabel) ??
      candidates.academicYears.find((y) => includesLoose(y.label, yearLabel))
    if (hit) {
      out.academic_year_id = hit.id
      out.academic_year_label = hit.label
    }
  }

  const subName = norm(extract.subject_name)
  if (subName && !out.subject_id) {
    const hit =
      candidates.subjects.find((s) => s.name_zh === subName) ??
      candidates.subjects.find((s) => includesLoose(s.name_zh, subName))
    if (hit) {
      out.subject_id = hit.id
      out.subject_name = hit.name_zh
      out.subject_code = hit.code
    }
  }

  const grade = norm(extract.grade_label)
  if (grade && APO_PO_GRADE_LABELS.includes(grade as (typeof APO_PO_GRADE_LABELS)[number])) {
    if (!out.grade_label) {
      out.grade_label = grade
      out.grade_code = gradeLabelToCourseCode(grade) ?? undefined
      gradeChanged = true
    }
  }

  if (gradeChanged) {
    out.course_id = undefined
    out.course_label = undefined
  }

  const courseName = norm(extract.course_name)
  if (courseName && !out.course_id && candidates.courses.length > 0) {
    const hits = candidates.courses.filter(
      (c) => c.course_name === courseName || includesLoose(c.course_name, courseName)
    )
    if (hits.length === 1) {
      out.course_id = hits[0].id
      out.course_label = hits[0].course_name
    }
  }

  if (extract.teacher_skip === true && out.teacher_id === undefined) {
    out.teacher_id = ""
    out.teacher_label = "（未指定）"
  } else {
    const tName = norm(extract.teacher_name)
    if (tName && out.teacher_id === undefined) {
      const hits = candidates.teachers.filter(
        (t) =>
          includesLoose(t.english_name, tName) ||
          includesLoose(t.full_name, tName) ||
          includesLoose(`${t.english_name} ${t.full_name}`, tName)
      )
      if (hits.length === 1) {
        const t = hits[0]
        out.teacher_id = t.id
        out.teacher_label =
          t.english_name && t.full_name ? `${t.english_name}（${t.full_name}）` : t.english_name || t.full_name
      }
    }
  }

  const dow = norm(extract.day_of_week)
  if (dow && !out.day_of_week) {
    out.day_of_week = dow
  }

  const slotHint = norm(extract.time_slot_hint)
  if (slotHint && !out.time_slot) {
    const matched = matchTimeSlot(slotHint)
    if (matched) out.time_slot = matched
  }

  if (
    out.consecutive_lesson === undefined &&
    extract.consecutive_lesson !== null &&
    extract.consecutive_lesson !== undefined
  ) {
    out.consecutive_lesson = Boolean(extract.consecutive_lesson)
  }

  if (!out.status) out.status = "進行中"
  return out
}

async function groundWithCourseReload(
  admin: SupabaseClient,
  extract: LlmExtract,
  candidates: ParseCandidates,
  slots: CreateClassSlots
): Promise<CreateClassSlots> {
  let grounded = groundExtract(extract, candidates, slots)
  if (!grounded.course_id && norm(extract.course_name) && grounded.subject_id && grounded.grade_code) {
    const candidates2 = await loadParseCandidates(admin, grounded)
    grounded = groundExtract(extract, candidates2, grounded)
  }
  return grounded
}

type HistoryMsg = { role: "user" | "assistant"; content: string }

/** LLM 解析用戶自然語言，並對齊候選清單（只填空缺欄位） */
export async function applyLlmSlotParse(
  apiKey: string,
  admin: SupabaseClient,
  userText: string,
  slots: CreateClassSlots,
  history: HistoryMsg[]
): Promise<CreateClassSlots> {
  const candidates = await loadParseCandidates(admin, slots)
  const system = buildParseSystemPrompt(candidates, slots)

  const recent = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "用戶" : "阿Po"}：${m.content}`)
    .join("\n")

  const userContent = `對話上文（參考）：
${recent || "（無）"}

本則用戶訊息：
${userText}`

  const result = await callDeepSeekJson(apiKey, system, userContent, { maxTokens: 450, temperature: 0.05 })
  if (!result.ok) {
    console.warn("apo-po LLM slot parse failed", result.detail)
    return slots
  }

  const parsed = parseJsonObject(result.raw)
  if (!parsed) {
    console.warn("apo-po LLM slot parse invalid JSON", result.raw.slice(0, 200))
    return slots
  }

  const extract: LlmExtract = {
    academic_year_label: parsed.academic_year_label as string | null,
    subject_name: parsed.subject_name as string | null,
    grade_label: parsed.grade_label as string | null,
    course_name: parsed.course_name as string | null,
    teacher_name: parsed.teacher_name as string | null,
    day_of_week: parsed.day_of_week as string | null,
    time_slot_hint: parsed.time_slot_hint as string | null,
    consecutive_lesson:
      parsed.consecutive_lesson === null || parsed.consecutive_lesson === undefined
        ? null
        : Boolean(parsed.consecutive_lesson),
    teacher_skip:
      parsed.teacher_skip === null || parsed.teacher_skip === undefined
        ? null
        : Boolean(parsed.teacher_skip),
  }

  return groundWithCourseReload(admin, extract, candidates, slots)
}
