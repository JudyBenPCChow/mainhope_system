import {
 consecutivePairFromFirstTimeSlot,
 isConsecutiveClass,
 newConsecutiveGroupId,
} from "@/lib/consecutiveLesson"
import {
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
 LESSON_SLOT_INDICES,
} from "@/lib/lessonSlots"
import { enumerateDatesForWeekday } from "@/lib/weekdayUtils"
import { timeSlotSelectValueFromStored, weekdaysFromStored } from "@/components/classes/classesUi"
import {
 insertScheduleRow,
 nextSessionNumberForClass,
 type ClassRecord,
} from "@/services/classQueries"
import { slotIsFreeForBooking } from "@/services/roomBookingQueries"
import {
 canonicalAvailabilityTimeSlot,
 datesWithAllAvailabilitySlots,
 isAvailabilitySlotFree,
 markAvailabilityForScheduleDates,
 type AcademicYearRange,
} from "@/services/teacherAvailabilityQueries"
import { fetchAcademicCalendarClosureMap } from "@/services/academicCalendarQueries"

export type BatchScheduleCandidate = {
 date: string
 hasAvailability: boolean
 checked: boolean
 roomConflict: boolean
 slotTaken: boolean
 isClosure: boolean
 closureName: string | null
}

export function parseTimeSlotBounds(timeSlot: string): { start: string; end: string } {
 const normalized = timeSlotSelectValueFromStored(timeSlot) || timeSlot.trim()
 const idx = LESSON_SLOT_INDICES.find((i) => lessonSlotLabel(i) === normalized)
 if (idx != null) {
  const a = lessonSlotStartMinute(idx)
  const b = lessonSlotEndMinute(idx)
  const fmt = (m: number) =>
   `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
  return { start: fmt(a), end: fmt(b) }
 }
 const parts = normalized.split(/\u2013|-/)
 if (parts.length >= 2) {
  return { start: parts[0]!.trim(), end: parts[1]!.trim() }
 }
 return { start: "09:00", end: "10:15" }
}

export function listCandidateDatesForClass(
 cls: Pick<ClassRecord, "day_of_week" | "start_date" | "end_date">,
 year: AcademicYearRange
): string[] {
 const weekdays = weekdaysFromStored(cls.day_of_week)
 if (weekdays.length === 0) return []
 const from = cls.start_date?.slice(0, 10) || year.start_date
 const to = cls.end_date?.slice(0, 10) || year.end_date
 const seen = new Set<string>()
 for (const dow of weekdays) {
  for (const date of enumerateDatesForWeekday(from, to, dow)) {
   seen.add(date)
  }
 }
 return [...seen].sort()
}

export async function buildBatchScheduleCandidates(params: {
 cls: ClassRecord
 year: AcademicYearRange
 teacherId: string | null
}): Promise<BatchScheduleCandidate[]> {
 const { cls, year, teacherId } = params
 const allDates = listCandidateDatesForClass(cls, year)
 const closureMap = await fetchAcademicCalendarClosureMap(year.id)
 let availSet = new Set<string>()
 if (teacherId && cls.day_of_week && cls.time_slot) {
  const weekdays = weekdaysFromStored(cls.day_of_week)
  const timeSlots = availabilityTimeSlotsForClass(cls)
  const avail = await datesWithAllAvailabilitySlots({
   teacherId,
   academicYearId: year.id,
   dayOfWeek: weekdays,
   timeSlots,
  })
  availSet = new Set(avail)
 }
 return allDates.map((date) => ({
  date,
  hasAvailability: availSet.has(date),
  checked: availSet.has(date) && !closureMap.has(date),
  roomConflict: false,
  slotTaken: false,
  isClosure: closureMap.has(date),
  closureName: closureMap.get(date)?.name ?? null,
 }))
}

function availabilityTimeSlotsForClass(cls: Pick<ClassRecord, "time_slot" | "lesson_slots_per_session">): string[] {
 if (!cls.time_slot) return []
 const first = canonicalAvailabilityTimeSlot(cls.time_slot)
 if (!isConsecutiveClass(cls.lesson_slots_per_session)) return [first]
 const pair = consecutivePairFromFirstTimeSlot(cls.time_slot)
 if (!pair) return [first]
 return [pair.slot1.timeSlot, pair.slot2.timeSlot]
}

export async function checkRoomConflictsForDates(params: {
 dates: string[]
 cls: Pick<ClassRecord, "time_slot" | "lesson_slots_per_session">
 classroomId: string | null
}): Promise<Set<string>> {
 const conflicts = new Set<string>()
 if (!params.classroomId || !params.cls.time_slot) return conflicts

 const slots = isConsecutiveClass(params.cls.lesson_slots_per_session)
  ? (() => {
     const pair = consecutivePairFromFirstTimeSlot(params.cls.time_slot!)
     if (!pair) return [parseTimeSlotBounds(params.cls.time_slot!)]
     return [
      { start: pair.slot1.start, end: pair.slot1.end },
      { start: pair.slot2.start, end: pair.slot2.end },
     ]
    })()
  : [parseTimeSlotBounds(params.cls.time_slot)]

 for (const date of params.dates) {
  for (const { start, end } of slots) {
   const free = await slotIsFreeForBooking({
    classroomId: params.classroomId,
    scheduledDate: date,
    startTime: start,
    endTime: end,
   })
   if (!free) {
    conflicts.add(date)
    break
   }
  }
 }
 return conflicts
}

export type BatchScheduleResult = {
 createdDates: string[]
 skippedDates: { date: string; reason: string }[]
}

async function isTeacherAvailableForClassOnDate(
 cls: ClassRecord,
 teacherId: string,
 date: string
): Promise<boolean> {
 if (!cls.time_slot) return true
 const slots = availabilityTimeSlotsForClass(cls)
 for (const timeSlot of slots) {
  const free = await isAvailabilitySlotFree({ teacherId, availableDate: date, timeSlot })
  if (!free) return false
 }
 return true
}

export async function executeBatchSchedules(params: {
 classId: string
 cls: ClassRecord
 year: AcademicYearRange
 dates: string[]
 classroomId: string | null
 markAvailability: boolean
}): Promise<BatchScheduleResult> {
 const { classId, cls, dates, classroomId, markAvailability } = params
 const teacherId = cls.teacher_id
 const createdDates: string[] = []
 const skippedDates: { date: string; reason: string }[] = []
 let nextSession = await nextSessionNumberForClass(classId)
 const consecutive = isConsecutiveClass(cls.lesson_slots_per_session)
 const pair = consecutive && cls.time_slot ? consecutivePairFromFirstTimeSlot(cls.time_slot) : null
 if (consecutive && !pair) {
  throw new Error("連堂班別需選擇可連續兩格的起始時段。")
 }

 for (const date of dates.sort()) {
  if (teacherId && cls.time_slot) {
   const ok = await isTeacherAvailableForClassOnDate(cls, teacherId, date)
   if (!ok) {
    skippedDates.push({ date, reason: "檔期已被分配" })
    continue
   }
  }
  if (classroomId) {
   const conflicts = await checkRoomConflictsForDates({
    dates: [date],
    cls,
    classroomId,
   })
   if (conflicts.has(date)) {
    skippedDates.push({ date, reason: "課室已被佔用" })
    continue
   }
  }
  try {
   if (consecutive && pair) {
    const groupId = newConsecutiveGroupId()
    await insertScheduleRow({
     class_id: classId,
     teacher_id: teacherId,
     scheduled_date: date,
     start_time: pair.slot1.start,
     end_time: pair.slot1.end,
     classroom_id: classroomId,
     session_number: nextSession,
     consecutive_group_id: groupId,
     consecutive_slot_index: 1,
    })
    await insertScheduleRow({
     class_id: classId,
     teacher_id: teacherId,
     scheduled_date: date,
     start_time: pair.slot2.start,
     end_time: pair.slot2.end,
     classroom_id: classroomId,
     session_number: nextSession + 1,
     consecutive_group_id: groupId,
     consecutive_slot_index: 2,
    })
    nextSession += 2
   } else {
    const { start, end } = parseTimeSlotBounds(cls.time_slot ?? "")
    await insertScheduleRow({
     class_id: classId,
     teacher_id: teacherId,
     scheduled_date: date,
     start_time: start,
     end_time: end,
     classroom_id: classroomId,
     session_number: nextSession,
    })
    nextSession += 1
   }
   createdDates.push(date)
  } catch (e) {
   skippedDates.push({
    date,
    reason: e instanceof Error ? e.message : "建立失敗",
   })
  }
 }

 if (markAvailability && teacherId && cls.time_slot && createdDates.length > 0) {
  const slots = availabilityTimeSlotsForClass(cls)
  for (const timeSlot of slots) {
   await markAvailabilityForScheduleDates({
    classId,
    teacherId,
    timeSlot,
    dates: createdDates,
   })
  }
 }

 return { createdDates, skippedDates }
}
