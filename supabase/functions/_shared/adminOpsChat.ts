import type { SupabaseClient } from "jsr:@supabase/supabase-js@2"

import {
  APO_PO_TIME_SLOTS,
  APO_PO_WEEKDAYS,
  classifyAdminOpsIntent,
  extractCourseCodes,
  gradeLabelToCourseCode,
  isCancelWorkflow,
  llmClassifyAndExtract,
  parseFirstLessonDate,
  parseGrade,
  parseTimeSlot,
  parseWeekdays,
} from "./adminOpsIntent.ts"
import {
  buildChoicePayload,
  EMPTY_ADMIN_OPS_CONTEXT,
  parseChoice,
  type AdminOpsChatContext,
  type AdminOpsChatResult,
  type AdminOpsChoice,
  type AdminOpsPendingExecute,
  type AdminOpsSlots,
  type AdminOpsWorkflow,
  type CreateClassScheduleSlots,
} from "./adminOpsTypes.ts"

type IncomingMessage = { role: "user" | "assistant"; content: string }

function result(partial: Omit<AdminOpsChatResult, "suggestions" | "choices"> & {
  suggestions?: string[]
  choices?: AdminOpsChoice[]
}): AdminOpsChatResult {
  return {
    suggestions: partial.suggestions ?? ["取消"],
    choices: partial.choices ?? [],
    pendingExecute: partial.pendingExecute ?? null,
    reply: partial.reply,
    opsContext: partial.opsContext,
  }
}

function idleHelp(): AdminOpsChatResult {
  return result({
    reply:
      "請說明要做的班務。第一波可以：\n" +
      "• 取消沒有學生的班（硬刪排程，不標取消）\n" +
      "• 改固定時段（同星期只改鐘；改逢星期才重生）\n" +
      "• 兩個班對調時間\n" +
      "• 開新班並排堂（可指定首堂、可少於 40 堂、可一併報讀一人）\n" +
      "• 取消空班後同一格開另一科\n\n" +
      "若只說「改時間」，請先講是整班、這名學生，還是私人課程。學生轉時間與請假請用既有頁面。明學IT狗不會代改。",
    suggestions: ["取消沒有學生的班", "改固定時段", "開新班並排堂"],
    opsContext: { ...EMPTY_ADMIN_OPS_CONTEXT },
    pendingExecute: null,
  })
}

type ClassHit = {
  id: string
  course_code_full: string
  subject: string
  day_of_week: string | null
  time_slot: string | null
  classroom_id: string | null
  teacher_id: string | null
}

async function lookupClasses(admin: SupabaseClient, code: string): Promise<ClassHit[]> {
  const { data } = await admin
    .from("classes")
    .select("id, course_code_full, subject, day_of_week, time_slot, classroom_id, teacher_id")
    .ilike("course_code_full", `%${code}%`)
    .limit(8)
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: String(r.id),
      course_code_full: String(r.course_code_full ?? ""),
      subject: String(r.subject ?? ""),
      day_of_week: r.day_of_week != null ? String(r.day_of_week) : null,
      time_slot: r.time_slot != null ? String(r.time_slot) : null,
      classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
      teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
    }
  })
}

function classChoices(field: string, hits: ClassHit[]): AdminOpsChoice[] {
  return hits.map((h) => ({
    id: `${field}-${h.id}`,
    label: h.course_code_full || h.subject,
    payload: buildChoicePayload(field, h.id, h.course_code_full || h.subject),
  }))
}

async function resolveClassFromText(
  admin: SupabaseClient,
  text: string
): Promise<{ hit?: ClassHit; choices?: AdminOpsChoice[]; error?: string }> {
  const codes = extractCourseCodes(text)
  if (codes.length === 0) return {}
  const hits = await lookupClasses(admin, codes[0]!)
  if (hits.length === 1) return { hit: hits[0] }
  if (hits.length > 1) return { choices: classChoices("class_id", hits) }
  return { error: `找不到班碼「${codes[0]}」。` }
}

function weekdaysEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  return String(a ?? "").replace(/星期/g, "") === String(b ?? "").replace(/星期/g, "") && Boolean(a) && Boolean(b)
    ? String(a).includes(String(b).replace("星期", "")) || String(b).includes(String(a).replace("星期", ""))
    : String(a ?? "").trim() === String(b ?? "").trim()
}

async function handleDelete(
  admin: SupabaseClient,
  text: string,
  slots: AdminOpsSlots,
  choice: ReturnType<typeof parseChoice>
): Promise<AdminOpsChatResult> {
  const next = { ...slots }
  if (choice?.field === "class_id") {
    next.class_id = choice.value
    next.class_label = choice.label
  } else if (!next.class_id) {
    const resolved = await resolveClassFromText(admin, text)
    if (resolved.error) {
      return result({
        reply: resolved.error,
        opsContext: { workflow: "delete_empty_class", slots: next },
        pendingExecute: null,
      })
    }
    if (resolved.choices) {
      return result({
        reply: "對到多個班，請選要硬刪的空班：",
        choices: resolved.choices,
        opsContext: { workflow: "delete_empty_class", slots: next },
        pendingExecute: null,
      })
    }
    if (resolved.hit) {
      next.class_id = resolved.hit.id
      next.class_label = resolved.hit.course_code_full
    }
  }
  if (!next.class_id) {
    return result({
      reply: "請提供要取消的班碼，例如 2627-CHIS1001-B。有報讀或點名會中止；空班將硬刪排程，不標取消。",
      opsContext: { workflow: "delete_empty_class", slots: next },
      pendingExecute: null,
    })
  }
  const pending: AdminOpsPendingExecute = {
    workflow: "delete_empty_class",
    classId: String(next.class_id),
    previewLines: [`班碼：${String(next.class_label ?? next.class_id)}`, "將硬刪排程（不標取消）。確認後才寫入。"],
  }
  return result({
    reply: "請核對預覽。確認後才會硬刪此空班；有報讀或點名會被拒絕。",
    suggestions: ["取消"],
    opsContext: { workflow: "delete_empty_class", slots: next },
    pendingExecute: pending,
  })
}

async function handleChangeSlot(
  admin: SupabaseClient,
  text: string,
  slots: AdminOpsSlots,
  choice: ReturnType<typeof parseChoice>
): Promise<AdminOpsChatResult> {
  const next = { ...slots }
  if (choice?.field === "class_id") {
    next.class_id = choice.value
    next.class_label = choice.label
  } else if (choice?.field === "new_day_of_week") {
    next.new_day_of_week = choice.value
  } else if (choice?.field === "new_time_slot") {
    next.new_time_slot = choice.value
  } else if (choice?.field === "keep_historical") {
    next.keep_cancelled_and_makeup = choice.value === "true"
  } else if (choice?.field === "classroom_id") {
    next.new_classroom_id = choice.value === "__keep__" ? undefined : choice.value
    next.new_classroom_label = choice.label
  } else {
    if (!next.class_id) {
      const resolved = await resolveClassFromText(admin, text)
      if (resolved.error) {
        return result({
          reply: resolved.error,
          opsContext: { workflow: "change_fixed_slot", slots: next },
          pendingExecute: null,
        })
      }
      if (resolved.choices) {
        return result({
          reply: "對到多個班，請選要改時段的班：",
          choices: resolved.choices,
          opsContext: { workflow: "change_fixed_slot", slots: next },
          pendingExecute: null,
        })
      }
      if (resolved.hit) {
        next.class_id = resolved.hit.id
        next.class_label = resolved.hit.course_code_full
        next.current_day_of_week = resolved.hit.day_of_week
        next.current_time_slot = resolved.hit.time_slot
        next.current_classroom_id = resolved.hit.classroom_id
      }
    }
    const dow = parseWeekdays(text)
    if (dow) next.new_day_of_week = dow.split(",")[0]
    const slot = parseTimeSlot(text)
    if (slot) next.new_time_slot = slot
    if (/保留取消|保留補回|不用搬歷史/.test(text)) next.keep_cancelled_and_makeup = true
  }

  if (!next.class_id) {
    return result({
      reply: "請提供班碼，並說明新的逢星期與時段。同一逢星期只改鐘會保留排程列 id；改逢星期才重生。",
      opsContext: { workflow: "change_fixed_slot", slots: next },
      pendingExecute: null,
    })
  }
  if (!next.new_day_of_week) {
    return result({
      reply: "請選新的逢星期：",
      choices: APO_PO_WEEKDAYS.map((d) => ({
        id: `dow-${d}`,
        label: d,
        payload: buildChoicePayload("new_day_of_week", d),
      })),
      opsContext: { workflow: "change_fixed_slot", slots: next },
      pendingExecute: null,
    })
  }
  if (!next.new_time_slot) {
    return result({
      reply: "請選新時段：",
      choices: APO_PO_TIME_SLOTS.map((s) => ({
        id: `slot-${s}`,
        label: s,
        payload: buildChoicePayload("new_time_slot", s),
      })),
      opsContext: { workflow: "change_fixed_slot", slots: next },
      pendingExecute: null,
    })
  }

  let currentDow = String(next.current_day_of_week ?? "")
  if (!currentDow && next.class_id) {
    const { data } = await admin
      .from("classes")
      .select("day_of_week, time_slot, classroom_id, course_code_full")
      .eq("id", String(next.class_id))
      .maybeSingle()
    if (data) {
      const r = data as Record<string, unknown>
      currentDow = String(r.day_of_week ?? "")
      next.current_day_of_week = currentDow
      next.current_time_slot = r.time_slot
      next.current_classroom_id = r.classroom_id
      next.class_label = String(r.course_code_full ?? next.class_label ?? "")
    }
  }

  const sameDow = weekdaysEqual(currentDow, String(next.new_day_of_week))
  const mode = sameDow ? "update_times" : "regenerate_dates"
  if (mode === "regenerate_dates" && next.keep_cancelled_and_makeup !== true) {
    return result({
      reply: "改逢星期會換日期網。已有的取消堂與補回列不會一併搬移。請確認保留那些歷史列後才重生。",
      choices: [
        {
          id: "keep-yes",
          label: "保留取消堂與補回，繼續",
          payload: buildChoicePayload("keep_historical", "true"),
        },
      ],
      opsContext: { workflow: "change_fixed_slot", slots: next },
      pendingExecute: null,
    })
  }

  const pending: AdminOpsPendingExecute = {
    workflow: "change_fixed_slot",
    classId: String(next.class_id),
    mode,
    newDayOfWeek: String(next.new_day_of_week),
    newTimeSlot: String(next.new_time_slot),
    newClassroomId: next.new_classroom_id ? String(next.new_classroom_id) : null,
    keepCancelledAndMakeup: mode === "update_times" ? true : next.keep_cancelled_and_makeup === true,
    previewLines: [
      `班碼：${String(next.class_label ?? "")}`,
      `寫法：${mode === "update_times" ? "只 UPDATE 日後列" : "重生日期網"}`,
      `逢星期：${currentDow || "—"} → ${String(next.new_day_of_week)}`,
      `時段：${String(next.current_time_slot ?? "—")} → ${String(next.new_time_slot)}`,
    ],
  }
  return result({
    reply: "請核對預覽。確認後才寫入。同星期改鐘不會整表刪建。",
    opsContext: { workflow: "change_fixed_slot", slots: next },
    pendingExecute: pending,
  })
}

async function handleSwap(
  admin: SupabaseClient,
  text: string,
  slots: AdminOpsSlots,
  choice: ReturnType<typeof parseChoice>
): Promise<AdminOpsChatResult> {
  const next = { ...slots }
  if (choice?.field === "class_a_id") {
    next.class_a_id = choice.value
    next.class_a_label = choice.label
  } else if (choice?.field === "class_b_id") {
    next.class_b_id = choice.value
    next.class_b_label = choice.label
  } else {
    const codes = extractCourseCodes(text)
    if (codes[0] && !next.class_a_id) {
      const hits = await lookupClasses(admin, codes[0])
      if (hits.length === 1) {
        next.class_a_id = hits[0]!.id
        next.class_a_label = hits[0]!.course_code_full
      } else if (hits.length > 1) {
        return result({
          reply: "請選第一個班：",
          choices: classChoices("class_a_id", hits),
          opsContext: { workflow: "swap_slots", slots: next },
          pendingExecute: null,
        })
      }
    }
    if (codes[1] && !next.class_b_id) {
      const hits = await lookupClasses(admin, codes[1])
      if (hits.length === 1) {
        next.class_b_id = hits[0]!.id
        next.class_b_label = hits[0]!.course_code_full
      } else if (hits.length > 1) {
        return result({
          reply: "請選第二個班：",
          choices: classChoices("class_b_id", hits),
          opsContext: { workflow: "swap_slots", slots: next },
          pendingExecute: null,
        })
      }
    }
  }
  if (!next.class_a_id || !next.class_b_id) {
    return result({
      reply: "請提供兩個班碼，例如「2627-ENGS2001-A 與 2627-M2S4001-A 對調時間」。兩邊各走改時段閘。",
      opsContext: { workflow: "swap_slots", slots: next },
      pendingExecute: null,
    })
  }
  const pending: AdminOpsPendingExecute = {
    workflow: "swap_slots",
    classAId: String(next.class_a_id),
    classBId: String(next.class_b_id),
    previewLines: [
      `班 A：${String(next.class_a_label ?? next.class_a_id)}`,
      `班 B：${String(next.class_b_label ?? next.class_b_id)}`,
    ],
  }
  return result({
    reply: "請核對兩個班的對調預覽。確認後才寫入；取消堂與補回列不會對調。",
    opsContext: { workflow: "swap_slots", slots: next },
    pendingExecute: pending,
  })
}

async function lookupCurrentYear(admin: SupabaseClient): Promise<{ id: string; label: string } | null> {
  const { data } = await admin
    .from("academic_years")
    .select("id, label, is_current")
    .eq("is_current", true)
    .maybeSingle()
  if (!data) return null
  const r = data as Record<string, unknown>
  return { id: String(r.id), label: String(r.label ?? "") }
}

async function handleCreate(
  admin: SupabaseClient,
  text: string,
  slots: AdminOpsSlots,
  choice: ReturnType<typeof parseChoice>
): Promise<AdminOpsChatResult> {
  const next: CreateClassScheduleSlots = { ...(slots as CreateClassScheduleSlots) }
  if (choice) {
    const v = choice.value
    const label = choice.label
    switch (choice.field) {
      case "academic_year_id":
        next.academic_year_id = v
        next.academic_year_label = label
        break
      case "subject_id":
        next.subject_id = v
        next.subject_name = label
        break
      case "grade_label":
        next.grade_label = v
        next.grade_code = gradeLabelToCourseCode(v) ?? undefined
        next.course_id = undefined
        next.course_label = undefined
        break
      case "course_id":
        next.course_id = v
        next.course_label = label
        break
      case "teacher_id":
        next.teacher_id = v
        next.teacher_label = label
        break
      case "day_of_week":
        next.day_of_week = v
        break
      case "time_slot":
        next.time_slot = v
        break
      case "classroom_id":
        if (v === "__skip__") {
          next.classroom_id = undefined
          next.classroom_label = "未編課室"
        } else {
          next.classroom_id = v
          next.classroom_label = label
        }
        break
      case "consecutive_lesson":
        next.consecutive_lesson = v === "true"
        break
      case "enroll_student_id":
        if (v !== "__skip__") {
          next.enroll_student_id = v
          next.enroll_student_label = label
        }
        break
      default:
        break
    }
  } else {
    if (!next.academic_year_label && /2627/.test(text)) {
      const year = await lookupCurrentYear(admin)
      if (year) {
        next.academic_year_id = year.id
        next.academic_year_label = year.label
      }
    }
    const g = parseGrade(text)
    if (g) {
      next.grade_label = g
      next.grade_code = gradeLabelToCourseCode(g) ?? undefined
    }
    const dow = parseWeekdays(text)
    if (dow) next.day_of_week = dow.split(",")[0]
    const slot = parseTimeSlot(text)
    if (slot) next.time_slot = slot
    const first = parseFirstLessonDate(text)
    if (first) next.first_lesson_date = first
    if (/連堂/.test(text)) next.consecutive_lesson = true
    if (/單節|不連堂/.test(text)) next.consecutive_lesson = false
    if (!next.subject_id) {
      const hints = ["數學", "中文", "英文", "物理", "化學", "生物", "企會財", "M2", "歷史"]
      const hint = hints.find((h) => text.includes(h))
      if (hint) {
        const { data } = await admin.from("subjects").select("id, name_zh").ilike("name_zh", `%${hint}%`).limit(5)
        const rows = data ?? []
        if (rows.length === 1) {
          const r = rows[0] as Record<string, unknown>
          next.subject_id = String(r.id)
          next.subject_name = String(r.name_zh)
        }
      }
    }
  }

  if (!next.academic_year_id) {
    const year = await lookupCurrentYear(admin)
    if (year) {
      next.academic_year_id = year.id
      next.academic_year_label = year.label
    }
  }
  if (!next.subject_id) {
    const { data } = await admin.from("subjects").select("id, name_zh").order("name_zh").limit(20)
    return result({
      reply: "請選科目：",
      choices: (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        const id = String(r.id)
        const label = String(r.name_zh ?? "")
        return { id: `sub-${id}`, label, payload: buildChoicePayload("subject_id", id, label) }
      }),
      opsContext: { workflow: "create_class_schedule", slots: next },
      pendingExecute: null,
    })
  }
  if (!next.grade_label) {
    return result({
      reply: "請選年級：",
      choices: ["中一", "中二", "中三", "中四", "中五", "中六"].map((g) => ({
        id: `grade-${g}`,
        label: g,
        payload: buildChoicePayload("grade_label", g),
      })),
      opsContext: { workflow: "create_class_schedule", slots: next },
      pendingExecute: null,
    })
  }
  if (!next.course_id && next.subject_id && next.grade_code) {
    const { data } = await admin
      .from("courses")
      .select("id, course_name")
      .eq("subject_id", next.subject_id)
      .eq("grade_code", next.grade_code)
      .order("course_seq")
      .limit(16)
    const rows = data ?? []
    if (rows.length === 1) {
      const r = rows[0] as Record<string, unknown>
      next.course_id = String(r.id)
      next.course_label = String(r.course_name ?? "")
    } else {
      return result({
        reply: "請選課程模板：",
        choices: rows.map((row) => {
          const r = row as Record<string, unknown>
          const id = String(r.id)
          const label = String(r.course_name ?? "")
          return { id: `course-${id}`, label, payload: buildChoicePayload("course_id", id, label) }
        }),
        opsContext: { workflow: "create_class_schedule", slots: next },
        pendingExecute: null,
      })
    }
  }
  if (!next.teacher_id) {
    const nameMatch = text.match(/([A-Za-z][A-Za-z\s.'-]{1,40})/)
    if (nameMatch?.[1]) {
      const q = nameMatch[1].trim()
      const { data } = await admin
        .from("teachers")
        .select("id, full_name, english_name")
        .or(`english_name.ilike.%${q}%,full_name.ilike.%${q}%`)
        .eq("status", "active")
        .limit(5)
      const rows = data ?? []
      if (rows.length === 1) {
        const r = rows[0] as Record<string, unknown>
        next.teacher_id = String(r.id)
        next.teacher_label = String(r.english_name ?? r.full_name ?? "")
      }
    }
  }
  if (!next.teacher_id) {
    const { data } = await admin
      .from("teachers")
      .select("id, full_name, english_name")
      .eq("status", "active")
      .order("english_name")
      .limit(16)
    return result({
      reply: "排堂須指定任教老師：",
      choices: (data ?? []).map((row) => {
        const r = row as Record<string, unknown>
        const id = String(r.id)
        const en = String(r.english_name ?? "").trim()
        const zh = String(r.full_name ?? "").trim()
        const label = en && zh ? `${en}（${zh}）` : en || zh
        return { id: `teacher-${id}`, label, payload: buildChoicePayload("teacher_id", id, label) }
      }),
      opsContext: { workflow: "create_class_schedule", slots: next },
      pendingExecute: null,
    })
  }
  if (!next.day_of_week) {
    return result({
      reply: "請選逢星期：",
      choices: APO_PO_WEEKDAYS.map((d) => ({
        id: `dow-${d}`,
        label: d,
        payload: buildChoicePayload("day_of_week", d),
      })),
      opsContext: { workflow: "create_class_schedule", slots: next },
      pendingExecute: null,
    })
  }
  if (!next.time_slot) {
    return result({
      reply: "請選時段：",
      choices: APO_PO_TIME_SLOTS.map((s) => ({
        id: `slot-${s}`,
        label: s,
        payload: buildChoicePayload("time_slot", s),
      })),
      opsContext: { workflow: "create_class_schedule", slots: next },
      pendingExecute: null,
    })
  }
  if (next.consecutive_lesson === undefined) {
    return result({
      reply: "是否連堂（2 節）？",
      choices: [
        { id: "consec-no", label: "否（單節）", payload: buildChoicePayload("consecutive_lesson", "false") },
        { id: "consec-yes", label: "是（連堂）", payload: buildChoicePayload("consecutive_lesson", "true") },
      ],
      opsContext: { workflow: "create_class_schedule", slots: next },
      pendingExecute: null,
    })
  }
  if (!next.classroom_id && !next.classroom_label) {
    const { data } = await admin.from("classrooms").select("id, name, is_online").eq("is_online", false).order("name").limit(12)
    const choices: AdminOpsChoice[] = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      const id = String(r.id)
      const label = String(r.name ?? "")
      return { id: `room-${id}`, label, payload: buildChoicePayload("classroom_id", id, label) }
    })
    choices.push({
      id: "room-skip",
      label: "暫不編課室",
      payload: buildChoicePayload("classroom_id", "__skip__", "未編課室"),
    })
    return result({
      reply: "請選課室（平日不佔 17D；17K 已停用；17E 平日最後才用）：",
      choices,
      opsContext: { workflow: "create_class_schedule", slots: next },
      pendingExecute: null,
    })
  }

  const pending: AdminOpsPendingExecute = {
    workflow: "create_class_schedule",
    slots: next,
    previewLines: [
      `課程：${next.course_label ?? "—"}`,
      `逢星期：${next.day_of_week ?? "—"}`,
      `時段：${next.time_slot ?? "—"}`,
      `老師：${next.teacher_label ?? "—"}`,
      `首堂：${next.first_lesson_date ?? "今日起第一個可排日"}`,
      "堂數按校曆實際可排；可少於 40，不會補建已過日期。",
    ],
  }
  return result({
    reply: "請核對開班並排堂預覽。確認後才寫入。班號字母不重排，亦不會改時間表方案版。",
    opsContext: { workflow: "create_class_schedule", slots: next },
    pendingExecute: pending,
  })
}

async function handleReplace(
  admin: SupabaseClient,
  text: string,
  slots: AdminOpsSlots,
  choice: ReturnType<typeof parseChoice>
): Promise<AdminOpsChatResult> {
  const next = { ...slots }
  const codes = extractCourseCodes(text)
  if (choice?.field === "delete_class_id") {
    next.delete_class_id = choice.value
    next.delete_class_label = choice.label
  } else if (!next.delete_class_id && codes[0]) {
    const hits = await lookupClasses(admin, codes[0])
    if (hits.length === 1) {
      next.delete_class_id = hits[0]!.id
      next.delete_class_label = hits[0]!.course_code_full
      next.inherit_day = hits[0]!.day_of_week
      next.inherit_slot = hits[0]!.time_slot
      next.inherit_room = hits[0]!.classroom_id
    } else if (hits.length > 1) {
      return result({
        reply: "請選要取消的空班：",
        choices: classChoices("delete_class_id", hits),
        opsContext: { workflow: "replace_empty_slot", slots: next },
        pendingExecute: null,
      })
    }
  }
  if (!next.delete_class_id) {
    return result({
      reply: "請提供要取消的空班班碼。確認刪除後，會再請你確認同一格要開的新班。",
      opsContext: { workflow: "replace_empty_slot", slots: next },
      pendingExecute: null,
    })
  }
  const create: CreateClassScheduleSlots = {
    ...(typeof next.create === "object" && next.create ? (next.create as CreateClassScheduleSlots) : {}),
    day_of_week: String(next.inherit_day ?? ""),
    time_slot: String(next.inherit_slot ?? ""),
    classroom_id: next.inherit_room ? String(next.inherit_room) : undefined,
  }
  if (!create.course_id) {
    const created = await handleCreate(admin, text, create, choice)
    if (!created.pendingExecute || created.pendingExecute.workflow !== "create_class_schedule") {
      return result({
        reply: `將先硬刪空班 ${String(next.delete_class_label ?? "")}。請繼續補齊同一格新班資料。\n\n${created.reply}`,
        choices: created.choices,
        suggestions: created.suggestions,
        opsContext: {
          workflow: "replace_empty_slot",
          slots: { ...next, create: created.opsContext.slots },
        },
        pendingExecute: null,
      })
    }
    const pending: AdminOpsPendingExecute = {
      workflow: "replace_empty_slot",
      step: "delete",
      deleteClassId: String(next.delete_class_id),
      createSlots: created.pendingExecute.slots ?? create,
      previewLines: [
        `第一步：硬刪空班 ${String(next.delete_class_label ?? "")}`,
        "第二步（稍後另確認）：同一格開新班",
        ...(created.pendingExecute.previewLines ?? []),
      ],
    }
    return result({
      reply: "此操作有兩張確認卡。請先確認硬刪空班；成功後再確認開新班。",
      opsContext: { workflow: "replace_empty_slot", slots: { ...next, create: pending.createSlots } },
      pendingExecute: pending,
    })
  }
  const pending: AdminOpsPendingExecute = {
    workflow: "replace_empty_slot",
    step: "delete",
    deleteClassId: String(next.delete_class_id),
    createSlots: create,
    previewLines: [`第一步：硬刪 ${String(next.delete_class_label ?? "")}`, "第二步：同一格開新班"],
  }
  return result({
    reply: "請先確認硬刪空班；之後會再請你確認開新班。",
    opsContext: { workflow: "replace_empty_slot", slots: next },
    pendingExecute: pending,
  })
}

export async function handleAdminOpsChat(
  admin: SupabaseClient,
  messages: IncomingMessage[],
  opsContext: AdminOpsChatContext,
  opts?: { apiKey?: string | null }
): Promise<AdminOpsChatResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? ""
  if (isCancelWorkflow(lastUser) || classifyAdminOpsIntent(lastUser) === "cancel") {
    return result({
      reply: "已取消目前工作。可以重新說明要改的班或排程。",
      suggestions: ["取消沒有學生的班", "改固定時段", "開新班並排堂"],
      opsContext: { ...EMPTY_ADMIN_OPS_CONTEXT },
      pendingExecute: null,
    })
  }

  const choice = parseChoice(lastUser)
  let workflow: AdminOpsWorkflow = opsContext.workflow && opsContext.workflow !== "idle" ? opsContext.workflow : "idle"
  if (choice?.field === "scope") {
    if (choice.value === "whole_class") workflow = "change_fixed_slot"
    else if (choice.value === "student") {
      return result({
        reply: "學生個人改去另一班請用產品「轉時間」，不是整班改時。本助手第一波不代做。",
        opsContext: { ...EMPTY_ADMIN_OPS_CONTEXT },
        pendingExecute: null,
      })
    } else if (choice.value === "private") {
      return result({
        reply: "私人課程改期請到私人課程頁，不是專科整班改時。",
        opsContext: { ...EMPTY_ADMIN_OPS_CONTEXT },
        pendingExecute: null,
      })
    }
  }

  if (workflow === "idle" || workflow === "clarify_scope") {
    let intent = classifyAdminOpsIntent(lastUser)
    if (intent === "unknown" && opts?.apiKey) {
      const llm = await llmClassifyAndExtract(opts.apiKey, lastUser)
      if (llm?.workflow && llm.workflow !== "unknown") {
        intent = llm.workflow as typeof intent
      }
    }
    if (intent === "clarify_scope") {
      return result({
        reply: "你說的「改時間」是指哪一種？",
        choices: [
          { id: "scope-class", label: "整班改固定時段", payload: buildChoicePayload("scope", "whole_class") },
          { id: "scope-student", label: "這名學生轉時間", payload: buildChoicePayload("scope", "student") },
          { id: "scope-private", label: "私人課程改期", payload: buildChoicePayload("scope", "private") },
        ],
        opsContext: { workflow: "clarify_scope", slots: {} },
        pendingExecute: null,
      })
    }
    if (intent === "unknown" || intent === "cancel") return idleHelp()
    workflow = intent
  }

  const slots = opsContext.slots ?? {}
  if (workflow === "delete_empty_class") return await handleDelete(admin, lastUser, slots, choice)
  if (workflow === "change_fixed_slot") return await handleChangeSlot(admin, lastUser, slots, choice)
  if (workflow === "swap_slots") return await handleSwap(admin, lastUser, slots, choice)
  if (workflow === "create_class_schedule") return await handleCreate(admin, lastUser, slots, choice)
  if (workflow === "replace_empty_slot") return await handleReplace(admin, lastUser, slots, choice)
  return idleHelp()
}
