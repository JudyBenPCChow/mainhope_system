import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import {
 consecutivePairFromFirstTimeSlot,
 isConsecutiveClass,
 newConsecutiveGroupId,
 slotIndexFromTimeSlot,
 timeBoundsForSlotIndex,
} from "@/lib/consecutiveLesson"
import { supabase } from "@/lib/supabaseClient"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { recordInboxEvent } from "@/services/inboxEventWrite"
import { syncDeclarationsAfterSchedulesAdded } from "@/services/entitlementQueries"
import {
 applySoftCancelScheduleSideEffects,
 type SoftCancelScheduleOptions,
} from "@/services/scheduleLifecycleQueries"
import {
 availabilityTimeSlotForStartTime,
 markAvailabilityForScheduleDates,
 releaseAvailabilitySlotForSchedule,
} from "@/services/teacherAvailabilityQueries"

/**
 * 排程列寫入（加堂／連堂／補堂／私人課程預約／課室占用共用）。
 * 只寫 `schedules.*`；代堂只改該堂 `schedules.teacher_id`，**不准**寫 `classes.teacher_id`。
 */

export async function nextSessionNumberForClass(classId: string): Promise<number> {
 if (!supabase) return 1
 const { data, error } = await supabase
  .from("schedules")
  .select("session_number")
  .eq("class_id", classId)
  .order("session_number", { ascending: false })
  .limit(1)
 if (error) throw error
 const max = (data ?? [])[0] as { session_number?: number | null } | undefined
 return (max?.session_number != null ? Number(max.session_number) : 0) + 1
}

export async function insertScheduleRow(
 opts: {
  class_id: string | null
  teacher_id: string | null
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  status?: string
  classroom_id?: string | null
  remarks?: string | null
  is_extra_lesson?: boolean
  session_number?: number | null
  consecutive_group_id?: string | null
  consecutive_slot_index?: number | null
 },
 flags?: { skipInboxEvent?: boolean; skipDeclarationSync?: boolean }
): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase
  .from("schedules")
  .insert({
   class_id: opts.class_id,
   teacher_id: opts.teacher_id,
   classroom_id: opts.classroom_id ?? null,
   scheduled_date: opts.scheduled_date,
   start_time: opts.start_time ?? null,
   end_time: opts.end_time ?? null,
   status: opts.status ?? "正常",
   remarks: opts.remarks ?? null,
   is_extra_lesson: opts.is_extra_lesson ?? false,
   session_number: opts.session_number ?? null,
   consecutive_group_id: opts.consecutive_group_id ?? null,
   consecutive_slot_index: opts.consecutive_slot_index ?? null,
  })
  .select("id")
  .single()
 if (error) throw error
 const id = String((data as { id: string }).id)
 void logMgmtAuditAction({
  action: "新增排程",
  detail: `schedule_id=${id}; class_id=${opts.class_id ?? "null"}; date=${opts.scheduled_date}`,
 })
 if (!flags?.skipInboxEvent) {
  void recordInboxEvent({
   eventType: "schedule_created",
   title: `新增排程（${String(opts.scheduled_date).slice(0, 10)}）`,
   body: null,
   actionPath: `/Schedule/${id}`,
   classId: opts.class_id,
   scheduleId: id,
   audienceTeacherIds: [opts.teacher_id],
   payload: { scheduledDate: opts.scheduled_date },
  })
 }
 // Wave 2：gated 學年補缺宣告（補回／批次可 skip，改由呼叫端一次同步）
 if (opts.class_id && !flags?.skipDeclarationSync) {
  try {
   await syncDeclarationsAfterSchedulesAdded(opts.class_id)
  } catch (err) {
   console.error("syncDeclarationsAfterSchedulesAdded failed", opts.class_id, err)
  }
 }
 return id
}

export async function insertScheduleForClass(
 classId: string,
 teacherId: string | null,
 row: {
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  status?: string
  classroom_id?: string | null
  is_extra_lesson?: boolean
  session_number?: number | null
 },
 flags?: { skipInboxEvent?: boolean }
): Promise<void> {
 assertAcademicYearEditableForDate(row.scheduled_date)
 await insertScheduleRow(
  {
   class_id: classId,
   teacher_id: teacherId,
   scheduled_date: row.scheduled_date,
   start_time: row.start_time,
   end_time: row.end_time,
   status: row.status,
   classroom_id: row.classroom_id,
   is_extra_lesson: row.is_extra_lesson,
   session_number: row.session_number,
  },
  flags
 )
}

/** 由班別 time_slot 推導起迄；若呼叫端已給 start/end 則優先使用。 */
function resolveScheduleTimesFromClassSlot(
 timeSlot: string | null | undefined,
 explicitStart?: string | null,
 explicitEnd?: string | null
): { start: string | null; end: string | null } {
 if (explicitStart && explicitEnd) {
  return { start: explicitStart, end: explicitEnd }
 }
 const raw = (timeSlot ?? "").trim()
 if (!raw) {
  return { start: explicitStart ?? null, end: explicitEnd ?? null }
 }
 const idx = slotIndexFromTimeSlot(raw)
 if (idx != null) {
  const bounds = timeBoundsForSlotIndex(idx)
  return { start: bounds.start, end: bounds.end }
 }
 const parts = raw.split(/\u2013|-/)
 if (parts.length >= 2) {
  const start = parts[0]!.trim()
  const end = parts[1]!.trim()
  if (start && end) return { start, end }
 }
 return { start: explicitStart ?? null, end: explicitEnd ?? null }
}

/** 依班別設定建立單堂或連堂（2 筆）排程，回傳建立的 schedule id */
export type ClassSessionScheduleInput = {
 teacher_id: string | null
 time_slot: string | null
 lesson_slots_per_session: number
 classroom_id: string | null
}

export async function insertSchedulesForClassSession(
 classId: string,
 cls: ClassSessionScheduleInput,
 row: {
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  status?: string
  classroom_id?: string | null
  session_number?: number | null
 }
): Promise<string[]> {
 assertAcademicYearEditableForDate(row.scheduled_date)
 const classroomId = row.classroom_id ?? cls.classroom_id ?? null
 const teacherId = cls.teacher_id

 if (!isConsecutiveClass(cls.lesson_slots_per_session)) {
  const { start, end } = resolveScheduleTimesFromClassSlot(
   cls.time_slot,
   row.start_time,
   row.end_time
  )
  if (!start || !end) {
   throw new Error("請選擇時段後再建立排程（缺少開始／結束時間）。")
  }
  const id = await insertScheduleRow({
   class_id: classId,
   teacher_id: teacherId,
   scheduled_date: row.scheduled_date,
   start_time: start,
   end_time: end,
   status: row.status,
   classroom_id: classroomId,
   session_number: row.session_number ?? null,
  })
  return [id]
 }

 const pair = consecutivePairFromFirstTimeSlot(cls.time_slot ?? row.start_time ?? "")
 if (!pair) {
  throw new Error("連堂班別需選擇可連續兩格的起始時段。")
 }

 let sessionStart = row.session_number ?? null
 if (sessionStart == null) {
  sessionStart = await nextSessionNumberForClass(classId)
 }

 const groupId = newConsecutiveGroupId()
 const id1 = await insertScheduleRow(
  {
   class_id: classId,
   teacher_id: teacherId,
   scheduled_date: row.scheduled_date,
   start_time: pair.slot1.start,
   end_time: pair.slot1.end,
   status: row.status,
   classroom_id: classroomId,
   session_number: sessionStart,
   consecutive_group_id: groupId,
   consecutive_slot_index: 1,
  },
  { skipInboxEvent: true, skipDeclarationSync: true }
 )
 const id2 = await insertScheduleRow(
  {
   class_id: classId,
   teacher_id: teacherId,
   scheduled_date: row.scheduled_date,
   start_time: pair.slot2.start,
   end_time: pair.slot2.end,
   status: row.status,
   classroom_id: classroomId,
   session_number: sessionStart + 1,
   consecutive_group_id: groupId,
   consecutive_slot_index: 2,
  },
  { skipInboxEvent: true, skipDeclarationSync: true }
 )
 try {
  await syncDeclarationsAfterSchedulesAdded(classId)
 } catch (err) {
  console.error("syncDeclarationsAfterSchedulesAdded failed", classId, err)
 }
 void recordInboxEvent({
  eventType: "schedule_created",
  title: `新增排程（連堂・${String(row.scheduled_date).slice(0, 10)}）`,
  body: "已建立連堂兩節",
  actionPath: `/Schedule/${id1}`,
  classId,
  scheduleId: id1,
  audienceTeacherIds: [teacherId],
  payload: { consecutive: true, scheduleIds: [id1, id2] },
 })
 return [id1, id2]
}

export async function updateSchedule(
 id: string,
 patch: Partial<{
  status: string
  cancel_reason: string | null
  is_extra_lesson: boolean
  start_time: string | null
  end_time: string | null
  classroom_id: string | null
  remarks: string | null
  teaching_notes: string | null
  session_number: number | null
  scheduled_date: string
  teacher_id: string | null
 }>,
 /** O3：軟取消時試堂／出席閘門選項 */
 options?: SoftCancelScheduleOptions
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: sched, error: fetchErr } = await supabase
  .from("schedules")
  .select("scheduled_date, teacher_id, start_time, end_time, class_id, status")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!sched) throw new Error("找不到排程")
 const prev = sched as {
  scheduled_date?: string
  teacher_id?: string | null
  start_time?: string | null
  end_time?: string | null
  class_id?: string | null
  status?: string | null
 }
 const dateForGuard =
  patch.scheduled_date != null
   ? String(patch.scheduled_date).slice(0, 10)
   : String(prev.scheduled_date ?? "")
 assertAcademicYearEditableForDate(dateForGuard)
 if (patch.scheduled_date != null) {
  assertAcademicYearEditableForDate(String(prev.scheduled_date ?? ""))
 }

 const nowCancelled =
  patch.status !== undefined &&
  patch.status.includes("取消") &&
  !String(prev.status ?? "").includes("取消")

 // O3：先副作用（清調堂／取消試堂／出席閘門），再改 status
 if (nowCancelled) {
  await applySoftCancelScheduleSideEffects([id], {
   cancel_reason: patch.cancel_reason,
   ...options,
  })
 }

 const { error } = await supabase
  .from("schedules")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw error

 if (patch.status !== undefined && patch.status !== prev.status) {
  const becameCancelled = patch.status.includes("取消")
  const wasCancelled = String(prev.status ?? "").includes("取消")
  if (becameCancelled && !wasCancelled) {
   await releaseAvailabilitySlotForSchedule({
    teacherId: prev.teacher_id ?? null,
    scheduledDate: String(prev.scheduled_date ?? ""),
    startTime: prev.start_time ?? null,
   })
  } else if (!becameCancelled && wasCancelled && prev.teacher_id && prev.class_id) {
   const timeSlot = availabilityTimeSlotForStartTime(prev.start_time ?? null)
   if (timeSlot) {
    await markAvailabilityForScheduleDates({
     classId: prev.class_id,
     teacherId: prev.teacher_id,
     timeSlot,
     dates: [String(prev.scheduled_date ?? "").slice(0, 10)],
    })
   }
  }
 }

 const dateChanged =
  patch.scheduled_date != null &&
  String(patch.scheduled_date).slice(0, 10) !== String(prev.scheduled_date ?? "").slice(0, 10)
 const startChanged =
  patch.start_time !== undefined && patch.start_time !== (prev.start_time ?? null)
 const endChanged =
  patch.end_time !== undefined && patch.end_time !== (prev.end_time ?? null)
 const teacherChanged =
  patch.teacher_id !== undefined && (patch.teacher_id ?? null) !== (prev.teacher_id ?? null)
 const material = nowCancelled || dateChanged || teacherChanged || startChanged || endChanged

 if (material) {
  const dateLabel = String(patch.scheduled_date ?? prev.scheduled_date ?? "").slice(0, 10)
  void recordInboxEvent({
   eventType: nowCancelled ? "schedule_cancelled" : "schedule_updated",
   title: nowCancelled ? `排程已取消（${dateLabel}）` : `排程已更新（${dateLabel}）`,
   body: nowCancelled
    ? patch.cancel_reason
      ? `原因：${patch.cancel_reason}`
      : null
    : [
       dateChanged ? `日期變更` : null,
       startChanged || endChanged ? `時間變更` : null,
       teacherChanged ? `實際授課老師變更` : null,
      ]
       .filter(Boolean)
       .join(" · ") || null,
   actionPath: `/Schedule/${id}`,
   classId: prev.class_id ?? null,
   scheduleId: id,
   audienceTeacherIds: [prev.teacher_id, patch.teacher_id],
   payload: { dateChanged, teacherChanged, cancelled: nowCancelled },
  })
 }

 void logMgmtAuditAction({
  action: "更新排程",
  detail: `schedule_id=${id}; patch=${JSON.stringify(patch)}`,
 })
}

export async function deleteSchedule(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: sched, error: fetchErr } = await supabase
  .from("schedules")
  .select("scheduled_date, teacher_id, start_time")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!sched) throw new Error("找不到排程")
 const prev = sched as {
  scheduled_date?: string
  teacher_id?: string | null
  start_time?: string | null
 }
 assertAcademicYearEditableForDate(String(prev.scheduled_date ?? ""))
 const { error } = await supabase.from("schedules").delete().eq("id", id)
 if (error) throw error
 await releaseAvailabilitySlotForSchedule({
  teacherId: prev.teacher_id ?? null,
  scheduledDate: String(prev.scheduled_date ?? ""),
  startTime: prev.start_time ?? null,
 })
 void logMgmtAuditAction({
  action: "刪除排程",
  detail: `schedule_id=${id}`,
 })
}
