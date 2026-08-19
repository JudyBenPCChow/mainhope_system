import type { MgmtRole } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"

export type InboxWriteEventType =
 | "schedule_created"
 | "schedule_updated"
 | "schedule_cancelled"
 | "schedule_substitute"
 | "class_updated"
 | "class_teacher_changed"
 | "leave_created"
 | "trial_confirmed"
 | "system_update"

export type InboxEventCategory = "ops" | "system"

export type RecordInboxEventInput = {
 eventType: InboxWriteEventType
 title: string
 body?: string | null
 actionPath?: string | null
 classId?: string | null
 scheduleId?: string | null
 studentId?: string | null
 audienceTeacherIds?: Array<string | null | undefined>
 /** 空或省略＝全部人（僅系統通知有意義）；ops 預設空 */
 audienceRoles?: MgmtRole[] | "all"
 category?: InboxEventCategory
 payload?: Record<string, unknown>
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
 const out: string[] = []
 const seen = new Set<string>()
 for (const raw of ids) {
  const id = raw?.trim()
  if (!id || seen.has(id)) continue
  seen.add(id)
  out.push(id)
 }
 return out
}

function normalizeAudienceRoles(
 audience: MgmtRole[] | "all" | undefined
): string[] {
 if (audience == null || audience === "all") return []
 const allowed: MgmtRole[] = ["admin", "manager", "finance", "alien", "teacher"]
 return audience.filter((r) => allowed.includes(r))
}

/** 寫入收件匣事件（失敗只 console，不阻斷主流程） */
export async function recordInboxEvent(input: RecordInboxEventInput): Promise<void> {
 if (!supabase) return
 try {
  const category = input.category ?? (input.eventType === "system_update" ? "system" : "ops")
  const { error } = await supabase.from("inbox_events").insert({
   event_type: input.eventType,
   title: input.title,
   body: input.body ?? null,
   action_path: input.actionPath ?? null,
   class_id: input.classId ?? null,
   schedule_id: input.scheduleId ?? null,
   student_id: input.studentId ?? null,
   audience_teacher_ids: uniqueIds(input.audienceTeacherIds ?? []),
   audience_roles: normalizeAudienceRoles(input.audienceRoles),
   category,
   payload: input.payload ?? {},
  })
  if (error) console.warn("[recordInboxEvent]", error.message)
 } catch (e) {
  console.warn("[recordInboxEvent]", e)
 }
}

export type PublishSystemNoticeInput = {
 title: string
 body?: string | null
 actionPath?: string | null
 /** all＝全部人；或指定角色 */
 audience: "all" | MgmtRole[]
}

/** 發佈系統通知。寫入成敗由 RLS（`system_notice.publish`）決定。 */
export async function publishSystemNotice(input: PublishSystemNoticeInput): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const title = input.title.trim()
 if (!title) throw new Error("請填寫標題")
 const audienceRoles = normalizeAudienceRoles(input.audience)
 if (input.audience !== "all" && audienceRoles.length === 0) {
  throw new Error("請至少指定一個可見角色，或改選全部人")
 }
 const { error } = await supabase.from("inbox_events").insert({
  event_type: "system_update",
  category: "system",
  title,
  body: input.body?.trim() || null,
  action_path: input.actionPath?.trim() || null,
  audience_teacher_ids: [],
  audience_roles: audienceRoles,
  payload: {},
 })
 if (error) throw error
}
