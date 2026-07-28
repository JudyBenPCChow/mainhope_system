import { supabase } from "@/lib/supabaseClient"

export type InboxWriteEventType =
 | "schedule_created"
 | "schedule_updated"
 | "schedule_cancelled"
 | "schedule_substitute"
 | "class_updated"
 | "class_teacher_changed"
 | "leave_created"

export type RecordInboxEventInput = {
 eventType: InboxWriteEventType
 title: string
 body?: string | null
 actionPath?: string | null
 classId?: string | null
 scheduleId?: string | null
 studentId?: string | null
 audienceTeacherIds?: Array<string | null | undefined>
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

/** 寫入收件匣事件（失敗只 console，不阻斷主流程） */
export async function recordInboxEvent(input: RecordInboxEventInput): Promise<void> {
 if (!supabase) return
 try {
  const { error } = await supabase.from("inbox_events").insert({
   event_type: input.eventType,
   title: input.title,
   body: input.body ?? null,
   action_path: input.actionPath ?? null,
   class_id: input.classId ?? null,
   schedule_id: input.scheduleId ?? null,
   student_id: input.studentId ?? null,
   audience_teacher_ids: uniqueIds(input.audienceTeacherIds ?? []),
   payload: input.payload ?? {},
  })
  if (error) console.warn("[recordInboxEvent]", error.message)
 } catch (e) {
  console.warn("[recordInboxEvent]", e)
 }
}
