import {
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
 LESSON_SLOT_INDICES,
} from "@/lib/lessonSlots"
import { enumerateDatesForWeekday } from "@/lib/weekdayUtils"
import { timeSlotSelectValueFromStored, weekdaysFromStored } from "@/components/classes/classesUi"
import {
 insertScheduleForClass,
 nextSessionNumberForClass,
 type ClassRecord,
} from "@/services/classQueries"
import { slotIsFreeForBooking } from "@/services/roomBookingQueries"
import {
 canonicalAvailabilityTimeSlot,
 datesWithAvailability,
 isAvailabilitySlotFree,
 markAvailabilityForScheduleDates,
 type AcademicYearRange,
} from "@/services/teacherAvailabilityQueries"

export type BatchScheduleCandidate = {
 date: string
 hasAvailability: boolean
 checked: boolean
 roomConflict: boolean
 slotTaken: boolean
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
 let availSet = new Set<string>()
 if (teacherId && cls.day_of_week && cls.time_slot) {
  const weekdays = weekdaysFromStored(cls.day_of_week)
  const timeSlot = canonicalAvailabilityTimeSlot(cls.time_slot)
  const avail = await datesWithAvailability({
   teacherId,
   academicYearId: year.id,
   dayOfWeek: weekdays,
   timeSlot,
  })
  availSet = new Set(avail)
 }
 return allDates.map((date) => ({
  date,
  hasAvailability: availSet.has(date),
  checked: availSet.has(date),
  roomConflict: false,
  slotTaken: false,
 }))
}

export async function checkRoomConflictsForDates(params: {
 dates: string[]
 timeSlot: string
 classroomId: string | null
}): Promise<Set<string>> {
 const conflicts = new Set<string>()
 if (!params.classroomId) return conflicts
 const { start, end } = parseTimeSlotBounds(params.timeSlot)
 for (const date of params.dates) {
  const free = await slotIsFreeForBooking({
   classroomId: params.classroomId,
   scheduledDate: date,
   startTime: start,
   endTime: end,
  })
  if (!free) conflicts.add(date)
 }
 return conflicts
}

export type BatchScheduleResult = {
 createdDates: string[]
 skippedDates: { date: string; reason: string }[]
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
 const timeSlot = cls.time_slot ?? ""
 const { start, end } = parseTimeSlotBounds(timeSlot)
 const createdDates: string[] = []
 const skippedDates: { date: string; reason: string }[] = []
 let nextSession = await nextSessionNumberForClass(classId)

 for (const date of dates.sort()) {
  if (teacherId && cls.time_slot) {
   const free = await isAvailabilitySlotFree({
    teacherId,
    availableDate: date,
    timeSlot: cls.time_slot,
   })
   if (!free) {
    skippedDates.push({ date, reason: "檔期已被分配" })
    continue
   }
  }
  if (classroomId) {
   const roomOk = await slotIsFreeForBooking({
    classroomId,
    scheduledDate: date,
    startTime: start,
    endTime: end,
   })
   if (!roomOk) {
    skippedDates.push({ date, reason: "課室已被佔用" })
    continue
   }
  }
  try {
   await insertScheduleForClass(classId, teacherId, {
    scheduled_date: date,
    start_time: start,
    end_time: end,
    classroom_id: classroomId,
    session_number: nextSession,
   })
   nextSession += 1
   createdDates.push(date)
  } catch (e) {
   skippedDates.push({
    date,
    reason: e instanceof Error ? e.message : "建立失敗",
   })
  }
 }

 if (markAvailability && teacherId && cls.time_slot && createdDates.length > 0) {
  await markAvailabilityForScheduleDates({
   classId,
   teacherId,
   timeSlot: cls.time_slot,
   dates: createdDates,
  })
 }

 return { createdDates, skippedDates }
}
