import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import {
 consecutivePairFromFirstTimeSlot,
 newConsecutiveGroupId,
} from "@/lib/consecutiveLesson"
import { formatStudentNameList } from "@/lib/scheduleDisplay"
import {
 makeupOfRemarkMarker,
 remarksIndicateMakeupOf,
} from "@/lib/scheduleMakeupMarkers"
import { supabase } from "@/lib/supabaseClient"
import { timeSlotSelectValueFromStored } from "@/components/classes/classesUi"
import { parseTimeSlotBounds } from "@/services/batchScheduleHelpers"
import {
 fetchConsecutiveScheduleIds,
 fetchScheduleStudentHintsForClass,
 insertScheduleRow,
 nextSessionNumberForClass,
} from "@/services/classQueries"
import { recordInboxEvent } from "@/services/inboxEventWrite"

export {
 makeupOfRemarkMarker,
 parseMakeupOfScheduleId,
 remarksIndicateMakeupOf,
} from "@/lib/scheduleMakeupMarkers"

type CancelledSlotRow = {
 id: string
 class_id: string | null
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 cancel_reason: string | null
 teacher_id: string | null
 classroom_id: string | null
 session_number: number | null
 consecutive_group_id: string | null
 consecutive_slot_index: number | null
 remarks: string | null
}

async function loadCancelledSlots(scheduleId: string): Promise<CancelledSlotRow[]> {
 if (!supabase) throw new Error("Supabase 未設定")
 const ids = await fetchConsecutiveScheduleIds(scheduleId)
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, class_id, scheduled_date, start_time, end_time, status, cancel_reason, teacher_id, classroom_id, session_number, consecutive_group_id, consecutive_slot_index, remarks"
  )
  .in("id", ids)
  .order("consecutive_slot_index", { ascending: true })
 if (error) throw error
 const rows = (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  return {
   id: String(r.id),
   class_id: r.class_id != null ? String(r.class_id) : null,
   scheduled_date: String(r.scheduled_date ?? "").slice(0, 10),
   start_time: r.start_time != null ? String(r.start_time) : null,
   end_time: r.end_time != null ? String(r.end_time) : null,
   status: String(r.status ?? ""),
   cancel_reason: r.cancel_reason != null ? String(r.cancel_reason) : null,
   teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
   classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
   session_number:
    r.session_number != null && !Number.isNaN(Number(r.session_number))
     ? Number(r.session_number)
     : null,
   consecutive_group_id:
    r.consecutive_group_id != null ? String(r.consecutive_group_id) : null,
   consecutive_slot_index:
    r.consecutive_slot_index != null && !Number.isNaN(Number(r.consecutive_slot_index))
     ? Number(r.consecutive_slot_index)
     : null,
   remarks: r.remarks != null ? String(r.remarks) : null,
  } satisfies CancelledSlotRow
 })
 rows.sort((a, b) => {
  const sa = a.consecutive_slot_index ?? 0
  const sb = b.consecutive_slot_index ?? 0
  if (sa !== sb) return sa - sb
  return (a.start_time ?? "").localeCompare(b.start_time ?? "")
 })
 return rows
}

/** 查同班是否已有補回此取消堂（或連堂組內任一節）的加堂 */
export async function findExistingMakeupScheduleIds(
 classId: string,
 cancelledScheduleIds: string[]
): Promise<string[]> {
 if (!supabase || cancelledScheduleIds.length === 0) return []
 const { data, error } = await supabase
  .from("schedules")
  .select("id, remarks, status")
  .eq("class_id", classId)
 if (error) throw error
 const found: string[] = []
 for (const row of data ?? []) {
  const r = row as { id: string; remarks: string | null; status: string }
  if (String(r.status ?? "").includes("取消")) continue
  for (const cid of cancelledScheduleIds) {
   if (remarksIndicateMakeupOf(r.remarks, cid)) {
    found.push(String(r.id))
    break
   }
  }
 }
 return found
}

export type MakeupPreview = {
 cancelledScheduleIds: string[]
 originalDate: string
 /** 原堂第一節時段（供表單預填） */
 originalTimeSlot: string
 cancelReason: string | null
 isConsecutive: boolean
 attendingNames: string[]
 /** 單堂報讀且選了被取消堂、將改掛到新堂的人數 */
 singleSessionMoveCount: number
 alreadyHasMakeupIds: string[]
}

function timeSlotLabelFromBounds(start: string | null, end: string | null): string {
 if (!start?.trim() || !end?.trim()) return ""
 const raw = `${start.trim().slice(0, 5)}–${end.trim().slice(0, 5)}`
 return timeSlotSelectValueFromStored(raw) || raw
}

function resolveMakeupTimeBounds(
 timeSlot: string,
 slotCount: number
): Array<{ start: string; end: string }> {
 const trimmed = timeSlot.trim()
 if (!trimmed) throw new Error("請選擇補堂時段")
 if (slotCount <= 1) {
  const b = parseTimeSlotBounds(trimmed)
  if (!b.start || !b.end) throw new Error("補堂時段無效")
  return [b]
 }
 const pair = consecutivePairFromFirstTimeSlot(trimmed)
 if (!pair) {
  throw new Error("連堂補回請選擇可連續兩格的起始時段（最後一格無法連堂）")
 }
 return [
  { start: pair.slot1.start, end: pair.slot1.end },
  { start: pair.slot2.start, end: pair.slot2.end },
 ]
}

function onlyCancelledSlots(slots: CancelledSlotRow[]): CancelledSlotRow[] {
 return slots.filter((s) => s.status.includes("取消"))
}

/** 安排補堂前預覽（名單／是否已安排） */
export async function previewMakeupForCancelledSchedule(
 cancelledScheduleId: string
): Promise<MakeupPreview> {
 const allSlots = await loadCancelledSlots(cancelledScheduleId)
 const slots = onlyCancelledSlots(allSlots)
 if (slots.length === 0) throw new Error("僅已取消的排程可安排補堂")
 const primary = slots[0]!
 if (!primary.class_id) throw new Error("此排程無班別，無法安排補堂")
 const cancelledIds = slots.map((s) => s.id)
 const alreadyHasMakeupIds = await findExistingMakeupScheduleIds(primary.class_id, cancelledIds)
 const hints = await fetchScheduleStudentHintsForClass(
  primary.class_id,
  slots.map((s) => ({ id: s.id, scheduled_date: s.scheduled_date }))
 )
 const nameSet = new Set<string>()
 for (const s of slots) {
  for (const n of hints.get(s.id)?.attendingNames ?? []) nameSet.add(n)
 }
 const singleSessionMoveCount = await countSingleSessionEnrollmentsOnSchedules(cancelledIds)
 return {
  cancelledScheduleIds: cancelledIds,
  originalDate: primary.scheduled_date,
  originalTimeSlot: timeSlotLabelFromBounds(primary.start_time, primary.end_time),
  cancelReason: primary.cancel_reason,
  isConsecutive: slots.length > 1,
  attendingNames: [...nameSet].sort((a, b) => a.localeCompare(b, "zh-Hant")),
  singleSessionMoveCount,
  alreadyHasMakeupIds,
 }
}

async function countSingleSessionEnrollmentsOnSchedules(scheduleIds: string[]): Promise<number> {
 if (!supabase || scheduleIds.length === 0) return 0
 const { data, error } = await supabase
  .from("student_enrollment_sessions")
  .select("enrollment_id, schedule_id")
  .in("schedule_id", scheduleIds)
 if (error) throw error
 return new Set((data ?? []).map((r) => String((r as { enrollment_id: string }).enrollment_id))).size
}

/**
 * 將單堂報讀從已取消堂改掛到新補回堂（避免 boundLessons 重複計算取消＋新堂）。
 * old→new 成對對應（連堂各節對各節）。
 */
async function remountSingleSessionSelections(
 pairs: Array<{ oldId: string; newId: string }>
): Promise<number> {
 if (!supabase || pairs.length === 0) return 0
 const oldIds = pairs.map((p) => p.oldId)
 const { data, error } = await supabase
  .from("student_enrollment_sessions")
  .select("enrollment_id, schedule_id")
  .in("schedule_id", oldIds)
 if (error) throw error
 if (!data || data.length === 0) return 0

 const newByOld = new Map(pairs.map((p) => [p.oldId, p.newId]))
 const enrollmentIds = new Set<string>()
 const inserts: { enrollment_id: string; schedule_id: string }[] = []
 const deleteKeys: { enrollment_id: string; schedule_id: string }[] = []

 for (const row of data) {
  const r = row as { enrollment_id: string; schedule_id: string }
  const eid = String(r.enrollment_id)
  const oldSid = String(r.schedule_id)
  const newSid = newByOld.get(oldSid)
  if (!newSid) continue
  enrollmentIds.add(eid)
  deleteKeys.push({ enrollment_id: eid, schedule_id: oldSid })
  inserts.push({ enrollment_id: eid, schedule_id: newSid })
 }

 for (const d of deleteKeys) {
  const { error: delErr } = await supabase
   .from("student_enrollment_sessions")
   .delete()
   .eq("enrollment_id", d.enrollment_id)
   .eq("schedule_id", d.schedule_id)
  if (delErr) throw delErr
 }

 if (inserts.length > 0) {
  // 若新堂已被選過則略過衝突
  const { error: insErr } = await supabase
   .from("student_enrollment_sessions")
   .upsert(inserts, { onConflict: "enrollment_id,schedule_id", ignoreDuplicates: true })
  if (insErr) throw insErr
 }

 return enrollmentIds.size
}

export type ArrangeMakeupResult = {
 newScheduleIds: string[]
 attendingNames: string[]
 singleSessionMoved: number
 primaryScheduleId: string
 newDate: string
}

/**
 * 為已取消排程安排同班補回加堂：新建 is_extra_lesson 排程，單堂選堂改掛到新堂。
 * 不批量建立 leave_makeup（避免請假管理灌水）。
 * 暑期跨期補堂：點名期數沿用原取消堂日期（見 scheduleRosterQueries enrollmentEligibilityDate）。
 */
export async function arrangeMakeupForCancelledSchedule(opts: {
 cancelledScheduleId: string
 newDate: string
 /** 補堂時段（標準 75 分鐘格；連堂為第一節起始時段） */
 timeSlot: string
}): Promise<ArrangeMakeupResult> {
 const newDate = opts.newDate.trim().slice(0, 10)
 if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
  throw new Error("請選擇有效的補堂日期")
 }
 assertAcademicYearEditableForDate(newDate)

 const allSlots = await loadCancelledSlots(opts.cancelledScheduleId)
 const slots = onlyCancelledSlots(allSlots)
 if (slots.length === 0) throw new Error("僅已取消的排程可安排補堂")
 const primary = slots[0]!
 if (!primary.class_id) throw new Error("此排程無班別，無法安排補堂")

 const cancelledIds = slots.map((s) => s.id)
 const existing = await findExistingMakeupScheduleIds(primary.class_id, cancelledIds)
 if (existing.length > 0) {
  throw new Error("此取消堂已安排過補回排程，請勿重複建立。可至未來排程查看加堂。")
 }

 const timeBounds = resolveMakeupTimeBounds(opts.timeSlot, slots.length)

 const hints = await fetchScheduleStudentHintsForClass(
  primary.class_id,
  slots.map((s) => ({ id: s.id, scheduled_date: s.scheduled_date }))
 )
 const nameSet = new Set<string>()
 for (const s of slots) {
  for (const n of hints.get(s.id)?.attendingNames ?? []) nameSet.add(n)
 }
 const attendingNames = [...nameSet].sort((a, b) => a.localeCompare(b, "zh-Hant"))

 let sessionStart = await nextSessionNumberForClass(primary.class_id)
 const reasonHint = primary.cancel_reason?.trim()
 const newScheduleIds: string[] = []
 const pairs: Array<{ oldId: string; newId: string }> = []

 if (slots.length === 1) {
  const s = slots[0]!
  const bounds = timeBounds[0]!
  const remark = [
   makeupOfRemarkMarker(s.id),
   `補回 ${s.scheduled_date}`,
   reasonHint ? `原因：${reasonHint}` : null,
  ]
   .filter(Boolean)
   .join("；")
  const id = await insertScheduleRow(
   {
    class_id: primary.class_id,
    teacher_id: s.teacher_id,
    classroom_id: s.classroom_id,
    scheduled_date: newDate,
    start_time: bounds.start,
    end_time: bounds.end,
    status: "正常",
    is_extra_lesson: true,
    session_number: sessionStart,
    remarks: remark,
   },
   { skipInboxEvent: true }
  )
  newScheduleIds.push(id)
  pairs.push({ oldId: s.id, newId: id })
 } else {
  const groupId = newConsecutiveGroupId()
  for (let i = 0; i < slots.length; i++) {
   const s = slots[i]!
   const bounds = timeBounds[i] ?? timeBounds[timeBounds.length - 1]!
   const remark = [
    makeupOfRemarkMarker(s.id),
    `補回 ${s.scheduled_date}`,
    reasonHint ? `原因：${reasonHint}` : null,
   ]
    .filter(Boolean)
    .join("；")
   const id = await insertScheduleRow(
    {
     class_id: primary.class_id,
     teacher_id: s.teacher_id,
     classroom_id: s.classroom_id,
     scheduled_date: newDate,
     start_time: bounds.start,
     end_time: bounds.end,
     status: "正常",
     is_extra_lesson: true,
     session_number: sessionStart + i,
     consecutive_group_id: groupId,
     consecutive_slot_index: s.consecutive_slot_index ?? i + 1,
     remarks: remark,
    },
    { skipInboxEvent: true }
   )
   newScheduleIds.push(id)
   pairs.push({ oldId: s.id, newId: id })
  }
 }

 const singleSessionMoved = await remountSingleSessionSelections(pairs)
 const primaryNewId = newScheduleIds[0]!

 void recordInboxEvent({
  eventType: "schedule_created",
  title: `已安排補回加堂（${newDate}）`,
  body: [
   `補回取消堂 ${primary.scheduled_date}`,
   `時段：${opts.timeSlot.trim()}`,
   reasonHint ? `原因：${reasonHint}` : null,
   attendingNames.length > 0 ? `原應出席：${formatStudentNameList(attendingNames)}` : null,
   slots.length > 1 ? `連堂 ${slots.length} 節` : null,
   singleSessionMoved > 0 ? `單堂選堂改掛 ${singleSessionMoved} 人` : null,
  ]
   .filter(Boolean)
   .join("。"),
  actionPath: `/Schedule/${primaryNewId}`,
  classId: primary.class_id,
  scheduleId: primaryNewId,
  audienceTeacherIds: [primary.teacher_id],
  payload: {
   makeupOf: cancelledIds,
   newScheduleIds,
   newDate,
   timeSlot: opts.timeSlot.trim(),
  },
 })

 return {
  newScheduleIds,
  attendingNames,
  singleSessionMoved,
  primaryScheduleId: primaryNewId,
  newDate,
 }
}
