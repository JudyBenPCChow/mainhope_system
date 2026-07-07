import type { SupabaseClient } from "jsr:@supabase/supabase-js@2"
import { applyLlmSlotParse } from "./apoPoLlmSlotParse.ts"
import {
  APO_PO_GRADE_LABELS,
  APO_PO_TIME_SLOTS,
  APO_PO_WEEKDAYS,
  gradeLabelToCourseCode,
} from "./apoPoScheduleConstants.ts"
import type { CreateClassSlots, PoChatResult, PoChoice, PoPendingExecute } from "./apoPoTypes.ts"

const CHOICE_PREFIX = "__apo_choice__"

export function isApoChoiceMessage(text: string): boolean {
  return text.trim().startsWith(CHOICE_PREFIX)
}

export function parseApoChoice(text: string): { field: string; value: string } | null {
  const t = text.trim()
  if (!t.startsWith(CHOICE_PREFIX)) return null
  const rest = t.slice(CHOICE_PREFIX.length)
  const sep = rest.indexOf("__")
  if (sep <= 0) return null
  const field = rest.slice(0, sep)
  const value = rest.slice(sep + 2)
  if (!field || !value) return null
  return { field, value }
}

export function buildChoicePayload(field: string, value: string): string {
  return `${CHOICE_PREFIX}${field}__${value}`
}

export function isCreateClassIntent(text: string): boolean {
  const t = text.trim()
  if (/取消|唔開|唔要|停止/.test(t)) return false
  return /開班|新增班別|開新班|建立班別|加個班|開一個班/.test(t)
}

/** 用戶直接講班別資料（唔講「開班」）時仍進入開班流程 */
export function isLikelyCreateClassDetails(text: string): boolean {
  const t = text.trim()
  if (t.length < 8) return false
  const hasGrade = /升中|中[一二三四五六]|小[一二三四五六]|\bF\.\d|DSE/i.test(t)
  const hasSubject = /數學|英文|中文|物理|化學|經濟|會計|通識|生物|MATH|ENG/i.test(t)
  const hasSchedule = /星期|週|Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d{1,2}:\d{2}/i.test(t)
  const hasTeacher = /教|老師|Mr\.|Ms\.|Miss/i.test(t)
  return (hasGrade && hasSubject) || (hasSubject && (hasSchedule || hasTeacher))
}

export function isCancelWorkflow(text: string): boolean {
  return /^(取消|唔要|停止|結束)$/.test(text.trim()) || /取消開班|唔開班/.test(text.trim())
}

type SlotField =
  | "academic_year_id"
  | "subject_id"
  | "grade_label"
  | "course_id"
  | "teacher_id"
  | "day_of_week"
  | "time_slot"
  | "consecutive_lesson"

const SLOT_ORDER: SlotField[] = [
  "academic_year_id",
  "subject_id",
  "grade_label",
  "course_id",
  "teacher_id",
  "day_of_week",
  "time_slot",
  "consecutive_lesson",
]

function nextMissing(slots: CreateClassSlots): SlotField | null {
  for (const f of SLOT_ORDER) {
    if (f === "consecutive_lesson") {
      if (slots.consecutive_lesson === undefined) return f
      continue
    }
    if (f === "teacher_id") {
      if (slots.teacher_id === undefined) return f
      continue
    }
    if (!slots[f]) return f
  }
  return null
}

function isComplete(slots: CreateClassSlots): boolean {
  return nextMissing(slots) === null
}

function parseWeekdays(text: string): string | null {
  const t = text.trim()
  const found: string[] = []
  const alias: Record<string, string> = {
    週一: "星期一",
    週二: "星期二",
    週三: "星期三",
    週四: "星期四",
    週五: "星期五",
    週六: "星期六",
    週日: "星期日",
    周一: "星期一",
    周二: "星期二",
    周三: "星期三",
    周四: "星期四",
    周五: "星期五",
    周六: "星期六",
    周日: "星期日",
  }
  for (const day of APO_PO_WEEKDAYS) {
    if (t.includes(day) || t.includes(day.replace("星期", ""))) found.push(day)
  }
  for (const [k, v] of Object.entries(alias)) {
    if (t.includes(k) && !found.includes(v)) found.push(v)
  }
  if (found.length === 0) return null
  return found.join(",")
}

function parseTimeSlot(text: string): string | null {
  const t = text.trim()
  for (const slot of APO_PO_TIME_SLOTS) {
    if (t.includes(slot) || t.includes(slot.replace(/–/g, "-"))) return slot
  }
  const hm = t.match(/(\d{1,2}):(\d{2})/)
  if (hm) {
    const target = `${hm[1].padStart(2, "0")}:${hm[2]}`
    const hit = APO_PO_TIME_SLOTS.find((s) => s.startsWith(target))
    if (hit) return hit
  }
  return null
}

function parseGrade(text: string): string | null {
  const t = text.trim()
  if (/升中三|中三/.test(t)) return "中三"
  if (/升中二|中二/.test(t) && !/升中三/.test(t)) return "中二"
  if (/升中一|中一/.test(t) && !/升中[二三]/.test(t)) return "中一"
  for (const g of APO_PO_GRADE_LABELS) {
    if (t.includes(g)) return g
  }
  return null
}

async function resolveTeacherByName(
  admin: SupabaseClient,
  text: string
): Promise<{ id: string; label: string } | null> {
  const nameMatch = text.match(/([A-Za-z][A-Za-z\s.'-]{1,40})/)
  if (!nameMatch?.[1]) return null
  const q = nameMatch[1].trim()
  const { data } = await admin
    .from("teachers")
    .select("id, full_name, english_name")
    .or(`english_name.ilike.%${q}%,full_name.ilike.%${q}%`)
    .eq("status", "active")
    .limit(5)
  const rows = data ?? []
  if (rows.length !== 1) return null
  const r = rows[0] as Record<string, unknown>
  const label = String(r.english_name ?? r.full_name ?? "老師")
  return { id: String(r.id), label }
}

async function resolveSubjectByName(
  admin: SupabaseClient,
  text: string
): Promise<{ id: string; name: string; code: string } | null> {
  const hints = ["數學", "中文", "英文", "通識", "物理", "化學", "生物", "經濟", "歷史", "地理"]
  let hint: string | null = null
  for (const h of hints) {
    if (text.includes(h)) {
      hint = h
      break
    }
  }
  if (!hint) return null
  const { data } = await admin
    .from("subjects")
    .select("id, name_zh, code")
    .ilike("name_zh", `%${hint}%`)
    .limit(5)
  const rows = data ?? []
  if (rows.length !== 1) return null
  const r = rows[0] as Record<string, unknown>
  return {
    id: String(r.id),
    name: String(r.name_zh),
    code: String(r.code ?? ""),
  }
}

async function applyNaturalLanguage(
  admin: SupabaseClient,
  text: string,
  slots: CreateClassSlots
): Promise<CreateClassSlots> {
  const out = { ...slots }

  if (!out.academic_year_id) {
    const { data: years } = await admin
      .from("academic_years")
      .select("id, label, is_current")
      .order("start_date", { ascending: false })
      .limit(12)
    for (const row of years ?? []) {
      const r = row as Record<string, unknown>
      const label = String(r.label ?? "")
      if (label && text.includes(label)) {
        out.academic_year_id = String(r.id)
        out.academic_year_label = label
        break
      }
    }
    if (!out.academic_year_id && /暑期|暑假/.test(text)) {
      const summer = (years ?? []).find((y) => {
        const label = String((y as Record<string, unknown>).label ?? "")
        return /暑期|暑假|SM/i.test(label)
      }) as Record<string, unknown> | undefined
      if (summer) {
        out.academic_year_id = String(summer.id)
        out.academic_year_label = String(summer.label)
      }
    }
  }

  if (!out.subject_id) {
    const sub = await resolveSubjectByName(admin, text)
    if (sub) {
      out.subject_id = sub.id
      out.subject_name = sub.name
      out.subject_code = sub.code
    }
  }

  if (!out.grade_label) {
    const g = parseGrade(text)
    if (g) {
      out.grade_label = g
      out.grade_code = gradeLabelToCourseCode(g) ?? undefined
    }
  }

  if (!out.course_id && out.subject_id && out.grade_code) {
    const { data: courses } = await admin
      .from("courses")
      .select("id, course_name, course_seq, grade_code")
      .eq("subject_id", out.subject_id)
      .eq("grade_code", out.grade_code)
      .order("course_seq")
      .limit(20)
    const rows = courses ?? []
    if (rows.length === 1) {
      const r = rows[0] as Record<string, unknown>
      out.course_id = String(r.id)
      out.course_label = String(r.course_name ?? `課程 ${r.course_seq}`)
    } else {
      for (const row of rows) {
        const r = row as Record<string, unknown>
        const name = String(r.course_name ?? "")
        if (name && text.includes(name)) {
          out.course_id = String(r.id)
          out.course_label = name
          break
        }
      }
    }
  }

  if (!out.teacher_id) {
    const teacher = await resolveTeacherByName(admin, text)
    if (teacher) {
      out.teacher_id = teacher.id
      out.teacher_label = teacher.label
    }
  }

  if (!out.day_of_week) {
    const dow = parseWeekdays(text)
    if (dow) out.day_of_week = dow
  }

  if (!out.time_slot) {
    const slot = parseTimeSlot(text)
    if (slot) out.time_slot = slot
  }

  if (out.consecutive_lesson === undefined) {
    if (/連堂|兩節/.test(text)) out.consecutive_lesson = true
    if (/唔連堂|單節|一節/.test(text)) out.consecutive_lesson = false
  }

  if (!out.status) out.status = "進行中"

  return out
}

function applyChoiceToSlots(
  slots: CreateClassSlots,
  field: string,
  value: string,
  label?: string
): CreateClassSlots {
  const out = { ...slots }
  switch (field) {
    case "academic_year_id":
      out.academic_year_id = value
      out.academic_year_label = label ?? out.academic_year_label
      break
    case "subject_id":
      out.subject_id = value
      out.subject_name = label ?? out.subject_name
      break
    case "grade_label":
      out.grade_label = value
      out.grade_code = gradeLabelToCourseCode(value) ?? undefined
      out.course_id = undefined
      out.course_label = undefined
      break
    case "course_id":
      out.course_id = value
      out.course_label = label ?? out.course_label
      break
    case "teacher_id":
      if (value === "__skip__") {
        out.teacher_id = ""
        out.teacher_label = "（未指定）"
      } else {
        out.teacher_id = value
        out.teacher_label = label ?? out.teacher_label
      }
      break
    case "day_of_week":
      out.day_of_week = value
      break
    case "time_slot":
      out.time_slot = value
      break
    case "consecutive_lesson":
      out.consecutive_lesson = value === "true"
      break
    default:
      break
  }
  if (!out.status) out.status = "進行中"
  return out
}

async function loadChoices(
  admin: SupabaseClient,
  field: SlotField,
  slots: CreateClassSlots
): Promise<PoChoice[]> {
  switch (field) {
    case "academic_year_id": {
      const { data } = await admin
        .from("academic_years")
        .select("id, label, is_current")
        .order("start_date", { ascending: false })
        .limit(8)
      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        const label = String(r.label ?? "")
        const id = String(r.id)
        const current = r.is_current ? "（當前）" : ""
        return {
          id: `ay-${id}`,
          label: `${label}${current}`,
          payload: buildChoicePayload("academic_year_id", id) + `__label__${label}`,
        }
      })
    }
    case "subject_id": {
      const { data } = await admin.from("subjects").select("id, name_zh").order("name_zh").limit(24)
      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        const label = String(r.name_zh ?? "")
        const id = String(r.id)
        return {
          id: `sub-${id}`,
          label,
          payload: buildChoicePayload("subject_id", id) + `__label__${label}`,
        }
      })
    }
    case "grade_label":
      return APO_PO_GRADE_LABELS.map((g) => ({
        id: `grade-${g}`,
        label: g,
        payload: buildChoicePayload("grade_label", g),
      }))
    case "course_id": {
      if (!slots.subject_id || !slots.grade_code) return []
      const { data } = await admin
        .from("courses")
        .select("id, course_name, course_seq")
        .eq("subject_id", slots.subject_id)
        .eq("grade_code", slots.grade_code)
        .order("course_seq")
        .limit(16)
      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        const label = String(r.course_name ?? `課程 ${r.course_seq}`)
        const id = String(r.id)
        return {
          id: `course-${id}`,
          label,
          payload: buildChoicePayload("course_id", id) + `__label__${label}`,
        }
      })
    }
    case "teacher_id": {
      const { data } = await admin
        .from("teachers")
        .select("id, full_name, english_name")
        .eq("status", "active")
        .order("english_name")
        .limit(20)
      const choices = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        const en = String(r.english_name ?? "").trim()
        const zh = String(r.full_name ?? "").trim()
        const label = en && zh ? `${en}（${zh}）` : en || zh || "老師"
        const id = String(r.id)
        return {
          id: `teacher-${id}`,
          label,
          payload: buildChoicePayload("teacher_id", id) + `__label__${label}`,
        }
      })
      choices.push({
        id: "teacher-skip",
        label: "暫不指定老師",
        payload: buildChoicePayload("teacher_id", "__skip__"),
      })
      return choices
    }
    case "day_of_week":
      return APO_PO_WEEKDAYS.map((d) => ({
        id: `dow-${d}`,
        label: d,
        payload: buildChoicePayload("day_of_week", d),
      }))
    case "time_slot":
      return APO_PO_TIME_SLOTS.map((slot) => ({
        id: `slot-${slot}`,
        label: slot,
        payload: buildChoicePayload("time_slot", slot),
      }))
    case "consecutive_lesson":
      return [
        { id: "consec-no", label: "否（單節）", payload: buildChoicePayload("consecutive_lesson", "false") },
        { id: "consec-yes", label: "是（連堂 2 節）", payload: buildChoicePayload("consecutive_lesson", "true") },
      ]
    default:
      return []
  }
}

function fieldPrompt(field: SlotField): string {
  switch (field) {
    case "academic_year_id":
      return "請揀學年（可按下面按鈕，或直接講學年名稱）："
    case "subject_id":
      return "請揀科目："
    case "grade_label":
      return "請揀年級："
    case "course_id":
      return "請揀課程模板（班名會跟課程）："
    case "teacher_id":
      return "請揀負責老師（可選「暫不指定」）："
    case "day_of_week":
      return "請揀上課星期（可多日請分開講或揀主要一日；亦可打字如「星期三,星期五」）："
    case "time_slot":
      return "請揀上課時段："
    case "consecutive_lesson":
      return "是否連堂（2 節）？"
    default:
      return "請補充資料："
  }
}

function buildPreviewLines(slots: CreateClassSlots): string[] {
  return [
    `學年：${slots.academic_year_label ?? "—"}`,
    `課程／班名：${slots.course_label ?? slots.subject_name ?? "—"}`,
    `年級：${slots.grade_label ?? "—"}`,
    `老師：${slots.teacher_label ?? "（未指定）"}`,
    `星期：${slots.day_of_week ?? "—"}`,
    `時段：${slots.time_slot ?? "—"}`,
    `連堂：${slots.consecutive_lesson ? "是" : "否"}`,
    `狀態：${slots.status ?? "進行中"}`,
  ]
}

async function enrichSlotsFromDb(
  admin: SupabaseClient,
  slots: CreateClassSlots,
  field: string,
  value: string
): Promise<CreateClassSlots> {
  const out = { ...slots }
  if (field === "subject_id" && value) {
    const { data } = await admin.from("subjects").select("name_zh, code").eq("id", value).maybeSingle()
    if (data) {
      const r = data as Record<string, unknown>
      out.subject_name = String(r.name_zh ?? "")
      out.subject_code = String(r.code ?? "")
    }
  }
  if (field === "academic_year_id" && value) {
    const { data } = await admin.from("academic_years").select("label").eq("id", value).maybeSingle()
    if (data) out.academic_year_label = String((data as Record<string, unknown>).label ?? "")
  }
  return out
}

function parseChoiceWithLabel(payload: string): { field: string; value: string; label?: string } | null {
  const labelIdx = payload.indexOf("__label__")
  const core = labelIdx >= 0 ? payload.slice(0, labelIdx) : payload
  const label = labelIdx >= 0 ? payload.slice(labelIdx + "__label__".length) : undefined
  const parsed = parseApoChoice(core)
  if (!parsed) return null
  return { ...parsed, label }
}

export type CreateClassTurnOpts = {
  apiKey?: string | null
  history?: Array<{ role: "user" | "assistant"; content: string }>
}

function countFilledSlots(slots: CreateClassSlots): number {
  let n = 0
  if (slots.academic_year_id) n++
  if (slots.subject_id) n++
  if (slots.grade_label) n++
  if (slots.course_id) n++
  if (slots.teacher_id !== undefined) n++
  if (slots.day_of_week) n++
  if (slots.time_slot) n++
  if (slots.consecutive_lesson !== undefined) n++
  return n
}

export async function handleCreateClassTurn(
  admin: SupabaseClient,
  userText: string,
  slots: CreateClassSlots,
  opts?: CreateClassTurnOpts
): Promise<PoChatResult> {
  let nextSlots = { ...slots }
  const beforeCount = countFilledSlots(nextSlots)

  const choice = parseChoiceWithLabel(userText.trim())
  if (choice) {
    nextSlots = applyChoiceToSlots(nextSlots, choice.field, choice.value, choice.label)
    nextSlots = await enrichSlotsFromDb(admin, nextSlots, choice.field, choice.value)
  } else {
    nextSlots = await applyNaturalLanguage(admin, userText, nextSlots)
    const apiKey = opts?.apiKey?.trim()
    if (apiKey && userText.trim().length >= 2) {
      const history = opts?.history ?? []
      nextSlots = await applyLlmSlotParse(apiKey, admin, userText, nextSlots, history)
      if (!nextSlots.course_id && nextSlots.subject_id && nextSlots.grade_code) {
        nextSlots = await applyNaturalLanguage(admin, userText, nextSlots)
      }
    }
  }

  const afterCount = countFilledSlots(nextSlots)
  const filledNew = afterCount > beforeCount

  if (isComplete(nextSlots)) {
    const previewLines = buildPreviewLines(nextSlots)
    const pending: PoPendingExecute = {
      workflow: "create_class",
      slots: nextSlots,
      previewLines,
    }
    return {
      reply:
        "我已整理好以下班別資料。請核對後按「確認建立」；如有錯請講「取消」或「改學年」等重新開始。\n\n" +
        previewLines.map((l) => `• ${l}`).join("\n"),
      suggestions: ["取消"],
      choices: [],
      poContext: { workflow: "create_class", slots: nextSlots },
      pendingExecute: pending,
    }
  }

  const missing = nextMissing(nextSlots)!
  const choices = await loadChoices(admin, missing, nextSlots)

  let ack = ""
  if (choice) {
    ack = "收到。"
  } else if (filledNew) {
    ack = "明白，我已根據你講嘅嘢填咗部分資料。"
  } else if (userText.length > 4) {
    ack = "收到。"
  }

  return {
    reply: `${ack}${fieldPrompt(missing)}`,
    suggestions: missing === "day_of_week" ? ["星期三,星期五"] : ["取消"],
    choices: choices.slice(0, 12),
    poContext: { workflow: "create_class", slots: nextSlots },
    pendingExecute: null,
  }
}

export function startCreateClassReply(): PoChatResult {
  return {
    reply:
      "好，我幫你開新班別。你可以一次過用自然語言講，例如：「暑期升中三數學班，Mark Yu 教，星期三星期五 11:30」；我會幫你解析，未齊嘅再用按鈕揀。\n\n請先揀學年：",
    suggestions: ["取消"],
    choices: [],
    poContext: { workflow: "create_class", slots: { status: "進行中" } },
    pendingExecute: null,
  }
}

export async function enrichStartCreateClass(
  admin: SupabaseClient
): Promise<PoChatResult> {
  const base = startCreateClassReply()
  const choices = await loadChoices(admin, "academic_year_id", {})
  return { ...base, choices }
}
