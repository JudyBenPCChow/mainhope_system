import {
  classifyScheduleRowForSlotChange,
  colleagueNoticeDraft,
  emptyClassHardDeleteGate,
  forbiddenPadDates,
  lessonCountPreviewLine,
  rankClassroomCandidates,
  regenerateSlotChangeGate,
  slotChangeWriteMode,
  specialistLastLessonYmd,
  specialistLessonDatesFromFirst,
} from "@/lib/adminOpsAssistant/rules"
import type {
  AdminOpsPendingExecute,
  CreateClassScheduleSlots,
  SlotChangeWriteMode,
} from "@/lib/adminOpsAssistant/types"
import { timeSlotSelectValueFromStored } from "@/lib/classTimeSlot"
import { consecutivePairFromFirstTimeSlot, isConsecutiveClass } from "@/lib/consecutiveLesson"
import { formatClassLabel } from "@/lib/courseLabel"
import { intervalsOverlapMinutes, LESSON_SLOT_DURATION_MIN, parseHm } from "@/lib/lessonSlots"
import { todayYmdLocal } from "@/lib/weekdayUtils"
import { supabase } from "@/lib/supabaseClient"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import {
  deleteClass,
  getClassById,
  insertClass,
  updateClass,
  type ClassRecord,
} from "@/services/classQueries"
import { fetchClassrooms } from "@/services/classroomQueries"
import { executeBatchSchedules, parseTimeSlotBounds } from "@/services/batchScheduleHelpers"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { fetchEnrollmentCountByClass } from "@/services/scheduleQueries"
import { deleteSchedule, updateSchedule } from "@/services/scheduleWriteQueries"
import { insertEnrollment } from "@/services/studentQueries"
import {
  fetchAcademicYearsWithDates,
  markAvailabilityForScheduleDates,
  releaseAvailabilityForClass,
  releaseAvailabilitySlotForSchedule,
  type AcademicYearRange,
} from "@/services/teacherAvailabilityQueries"

type ClassScheduleRow = {
  id: string
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
  remarks: string | null
  classroom_id: string | null
  teacher_id: string | null
  consecutive_slot_index: number | null
}

export type AdminOpsExecuteResult = {
  message: string
  noticeDraft?: string
  nextPending?: AdminOpsPendingExecute | null
}

function classLabel(cls: Pick<ClassRecord, "subject" | "course_code_full" | "course_name">): string {
  return formatClassLabel({
    subject: cls.subject,
    courseCode: cls.course_code_full,
    courseName: cls.course_name,
  })
}

async function fetchClassSchedules(classId: string): Promise<ClassScheduleRow[]> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, scheduled_date, start_time, end_time, status, remarks, classroom_id, teacher_id, consecutive_slot_index"
    )
    .eq("class_id", classId)
    .order("scheduled_date", { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: String(r.id),
      scheduled_date: String(r.scheduled_date ?? "").slice(0, 10),
      start_time: r.start_time != null ? String(r.start_time) : null,
      end_time: r.end_time != null ? String(r.end_time) : null,
      status: String(r.status ?? ""),
      remarks: r.remarks != null ? String(r.remarks) : null,
      classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
      teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
      consecutive_slot_index: r.consecutive_slot_index != null ? Number(r.consecutive_slot_index) : null,
    }
  })
}

async function attendanceCountForScheduleIds(ids: string[]): Promise<number> {
  if (!supabase || ids.length === 0) return 0
  let total = 0
  await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("attendance_details")
      .select("id")
      .in("schedule_id", slice)
    if (error) throw error
    total += (data ?? []).length
    return data ?? []
  })
  return total
}

async function enrollmentCountByStatuses(classId: string, statuses: string[]): Promise<number> {
  if (!supabase) return 0
  const { count, error } = await supabase
    .from("student_class_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId)
    .in("status", statuses)
  if (error) throw error
  return count ?? 0
}

export async function findClassByCourseCode(code: string): Promise<ClassRecord> {
  if (!supabase) throw new Error("Supabase 未設定")
  const needle = code.trim()
  if (!needle) throw new Error("請提供班碼。")
  const { data, error } = await supabase
    .from("classes")
    .select("id, course_code_full")
    .ilike("course_code_full", `%${needle}%`)
    .limit(8)
  if (error) throw error
  const rows = data ?? []
  if (rows.length === 0) throw new Error(`找不到班碼「${needle}」。`)
  if (rows.length > 1) {
    const labels = rows
      .map((r) => String((r as { course_code_full?: string }).course_code_full ?? ""))
      .filter(Boolean)
    throw new Error(`班碼「${needle}」對到多個班：${labels.join("、")}。請寫完整班碼。`)
  }
  const cls = await getClassById(String((rows[0] as { id: string }).id))
  if (!cls) throw new Error(`找不到班碼「${needle}」。`)
  return cls
}

function sessionBounds(timeSlot: string, consecutive: boolean): Array<{ start: string; end: string }> {
  if (consecutive) {
    const pair = consecutivePairFromFirstTimeSlot(timeSlot)
    if (!pair) throw new Error("連堂班別需選擇可連續兩格的起始時段。")
    return [
      { start: pair.slot1.start, end: pair.slot1.end },
      { start: pair.slot2.start, end: pair.slot2.end },
    ]
  }
  return [parseTimeSlotBounds(timeSlot)]
}

async function slotFree(params: {
  classroomId: string
  scheduledDate: string
  startTime: string
  endTime: string
  excludeScheduleIds?: Set<string>
}): Promise<boolean> {
  if (!supabase) return false
  const slotA = parseHm(params.startTime) ?? 0
  const slotB = parseHm(params.endTime) ?? slotA + LESSON_SLOT_DURATION_MIN
  const { data: sched } = await supabase
    .from("schedules")
    .select("id, start_time, end_time, status")
    .eq("classroom_id", params.classroomId)
    .eq("scheduled_date", params.scheduledDate)
  for (const row of sched ?? []) {
    const s = row as { id: string; start_time: string | null; end_time: string | null; status: string }
    if (params.excludeScheduleIds?.has(s.id)) continue
    if (String(s.status ?? "").includes("取消")) continue
    const a = parseHm(s.start_time)
    const b = parseHm(s.end_time)
    if (a == null || b == null) continue
    const bEff = b <= a ? a + LESSON_SLOT_DURATION_MIN : b
    if (intervalsOverlapMinutes(slotA, slotB, a, bEff)) return false
  }
  return true
}

async function datesConflictingForRoom(opts: {
  classroomId: string
  dates: string[]
  timeSlot: string
  consecutive: boolean
  excludeScheduleIds: Set<string>
}): Promise<string[]> {
  const bounds = sessionBounds(opts.timeSlot, opts.consecutive)
  const conflicts: string[] = []
  for (const date of opts.dates) {
    for (const { start, end } of bounds) {
      const free = await slotFree({
        classroomId: opts.classroomId,
        scheduledDate: date,
        startTime: start,
        endTime: end,
        excludeScheduleIds: opts.excludeScheduleIds,
      })
      if (!free) {
        conflicts.push(date)
        break
      }
    }
  }
  return conflicts
}

async function suggestRooms(opts: {
  weekday: string
  currentRoomId: string | null
  dates: string[]
  timeSlot: string
  consecutive: boolean
  excludeScheduleIds: Set<string>
}): Promise<Array<{ id: string; name: string; note: string }>> {
  const rooms = await fetchClassrooms()
  const ranked = rankClassroomCandidates(rooms, {
    weekday: opts.weekday,
    currentRoomId: opts.currentRoomId,
  })
  const out: Array<{ id: string; name: string; note: string }> = []
  for (const room of ranked) {
    const conflicts = await datesConflictingForRoom({
      classroomId: room.id,
      dates: opts.dates,
      timeSlot: opts.timeSlot,
      consecutive: opts.consecutive,
      excludeScheduleIds: opts.excludeScheduleIds,
    })
    if (conflicts.length === 0) {
      const note =
        room.tier === "keep"
          ? "現室可用，維持"
          : room.tier === "last_resort"
            ? "平日功輔第二室，最後才用"
            : "此時段全數可排"
      out.push({ id: room.id, name: room.name, note })
    }
    if (out.length >= 5) break
  }
  return out
}

async function yearRangeForClass(cls: ClassRecord): Promise<AcademicYearRange> {
  const years = await fetchAcademicYearsWithDates()
  const hit =
    years.find((y) => y.id === cls.academic_year_id) ??
    years.find((y) => y.label === cls.academic_year_label) ??
    years.find((y) => y.is_current)
  if (!hit) throw new Error("找不到學年，無法排堂。")
  const last = specialistLastLessonYmd(hit.label)
  return last && last < hit.end_date ? { ...hit, end_date: last } : hit
}

function noticeFor(cls: Pick<ClassRecord, "subject" | "course_code_full" | "course_name" | "day_of_week" | "time_slot">): string {
  return colleagueNoticeDraft({
    courseName: (cls.course_name ?? cls.subject).trim(),
    courseCode: cls.course_code_full ?? "",
    dayOfWeek: cls.day_of_week ?? "",
    timeSlot: cls.time_slot ?? "",
  })
}

export async function previewDeleteEmptyClass(classId: string): Promise<{
  previewLines: string[]
  blockedReason: string | null
}> {
  const cls = await getClassById(classId)
  if (!cls) throw new Error("找不到班別")
  const schedules = await fetchClassSchedules(classId)
  const enrollMap = await fetchEnrollmentCountByClass([classId])
  const studying = enrollMap.get(classId) ?? 0
  const paused = await enrollmentCountByStatuses(classId, ["休學"])
  const activeEnroll = studying + paused
  const attendanceCount = await attendanceCountForScheduleIds(schedules.map((s) => s.id))
  const withdrawn = await enrollmentCountByStatuses(classId, ["退讀", "退選"])
  const gate = emptyClassHardDeleteGate({
    activeEnrollmentCount: activeEnroll,
    attendanceCount,
  })
  const lines = [
    `班碼：${cls.course_code_full ?? "—"}`,
    `課程：${classLabel(cls)}`,
    `逢星期：${cls.day_of_week ?? "—"}`,
    `時段：${cls.time_slot ?? "—"}`,
    `課室：${cls.classroom_name ?? "未編課室"}`,
    `老師：${cls.teacher_name ?? "—"}`,
    `就讀中報讀：${activeEnroll} 人`,
    `已點名列：${attendanceCount}`,
    `將硬刪排程：${schedules.length} 列（直接刪列，不標取消）`,
  ]
  if (withdrawn > 0) lines.push(`曾有退讀／退選：${withdrawn} 筆（仍允許硬刪空班）`)
  if (!gate.ok) return { previewLines: lines, blockedReason: gate.reason }
  return { previewLines: lines, blockedReason: null }
}

export async function executeDeleteEmptyClass(classId: string): Promise<AdminOpsExecuteResult> {
  const preview = await previewDeleteEmptyClass(classId)
  if (preview.blockedReason) throw new Error(preview.blockedReason)
  const cls = await getClassById(classId)
  if (!cls) throw new Error("找不到班別")
  const schedules = await fetchClassSchedules(classId)
  for (const row of schedules) {
    await deleteSchedule(row.id)
  }
  await releaseAvailabilityForClass(classId)
  await deleteClass(classId)
  await logMgmtAuditAction({
    action: "admin_ops.hard_delete_empty_class",
    detail: `class_id=${classId}; code=${cls.course_code_full ?? ""}; schedules=${schedules.length}`,
  })
  return {
    message:
      `已硬刪空班 ${classLabel(cls)}。排程 ${schedules.length} 列已直接刪除，沒有標成取消，不會進入補堂跟進。`,
    noticeDraft: noticeFor(cls),
  }
}

function classifiedRows(schedules: ClassScheduleRow[], todayYmd: string, mode: SlotChangeWriteMode) {
  const update: ClassScheduleRow[] = []
  const keep: ClassScheduleRow[] = []
  const del: ClassScheduleRow[] = []
  const past: ClassScheduleRow[] = []
  for (const row of schedules) {
    const action = classifyScheduleRowForSlotChange({
      scheduledDate: row.scheduled_date,
      status: row.status,
      remarks: row.remarks,
      todayYmd,
      mode,
    })
    if (action === "update") update.push(row)
    else if (action === "keep") keep.push(row)
    else if (action === "delete_for_regen") del.push(row)
    else past.push(row)
  }
  return { update, keep, del, past }
}

export async function previewChangeFixedSlot(opts: {
  classId: string
  newDayOfWeek: string
  newTimeSlot: string
  newClassroomId: string | null
  keepCancelledAndMakeup: boolean
  /** true：連 null 也當成「先不編課室」（對調中途用） */
  classroomExplicit?: boolean
}): Promise<{ previewLines: string[]; blockedReason: string | null; mode: SlotChangeWriteMode }> {
  const cls = await getClassById(opts.classId)
  if (!cls) throw new Error("找不到班別")
  const mode = slotChangeWriteMode(cls.day_of_week, opts.newDayOfWeek)
  const today = todayYmdLocal()
  const schedules = await fetchClassSchedules(opts.classId)
  const groups = classifiedRows(schedules, today, mode)
  const rowsNeedingWrite = mode === "update_times" ? groups.update : groups.del
  const attendanceCount = await attendanceCountForScheduleIds(rowsNeedingWrite.map((s) => s.id))
  const consecutive = isConsecutiveClass(cls.lesson_slots_per_session)
  const timeSlot = timeSlotSelectValueFromStored(opts.newTimeSlot) || opts.newTimeSlot
  const keepCancelled = groups.keep.filter((r) => String(r.status).includes("取消")).length
  const keepMakeup = groups.keep.length - keepCancelled

  let blocked: string | null = null
  if (mode === "regenerate_dates") {
    const gate = regenerateSlotChangeGate({
      attendanceOnRowsToDelete: attendanceCount,
      keptCancelledCount: keepCancelled,
      keptMakeupCount: keepMakeup,
      userConfirmedKeepHistorical: opts.keepCancelledAndMakeup,
    })
    if (!gate.ok) blocked = gate.reason
  } else if (attendanceCount > 0) {
    blocked = "日後要改鐘的堂次已有點名，不可只改時段。請改走單堂取消／補回。"
  }

  const firstDate =
    mode === "regenerate_dates"
      ? (cls.start_date && cls.start_date > today ? cls.start_date : today)
      : today
  const generated =
    mode === "regenerate_dates"
      ? specialistLessonDatesFromFirst({
          academicYearLabel: cls.academic_year_label ?? "2627",
          weekday: opts.newDayOfWeek,
          firstDateYmd: firstDate,
        })
      : { dates: [...new Set(groups.update.map((r) => r.scheduled_date))].sort(), calendarTarget: 40, lastLessonYmd: specialistLastLessonYmd(cls.academic_year_label) }

  const exclude = new Set(rowsNeedingWrite.map((r) => r.id))
  const classroomId = opts.classroomExplicit ? opts.newClassroomId : opts.newClassroomId || cls.classroom_id
  let roomLine = `課室：${cls.classroom_name ?? "未編課室"}`
  let suggestions: Array<{ id: string; name: string; note: string }> = []
  if (classroomId && generated.dates.length > 0) {
    const conflicts = await datesConflictingForRoom({
      classroomId,
      dates: generated.dates,
      timeSlot,
      consecutive,
      excludeScheduleIds: exclude,
    })
    if (conflicts.length === 0) {
      roomLine = opts.newClassroomId
        ? `課室：將改為你指定的課室（現室／指定室可用）`
        : `課室：現室可用，維持 ${cls.classroom_name ?? classroomId}`
    } else {
      suggestions = await suggestRooms({
        weekday: opts.newDayOfWeek,
        currentRoomId: cls.classroom_id,
        dates: generated.dates,
        timeSlot,
        consecutive,
        excludeScheduleIds: exclude,
      })
      roomLine = `課室：現室在 ${conflicts.length} 日撞期。可改用：${
        suggestions.length > 0
          ? suggestions.map((s) => `${s.name}（${s.note}）`).join("、")
          : "暫無全數可排的空室"
      }`
      if (!opts.newClassroomId) {
        blocked = blocked ?? "現室撞期。請在對話中指定空室後再確認。"
      }
    }
  }

  const lines = [
    `班碼：${cls.course_code_full ?? "—"}`,
    `課程：${classLabel(cls)}`,
    `寫法：${mode === "update_times" ? "逢星期不變，只 UPDATE 日後未取消、非補回列（保留列 id）" : "改逢星期，刪未開始列後按校曆重生（不整表刪建）"}`,
    `逢星期：${cls.day_of_week ?? "—"} → ${opts.newDayOfWeek}`,
    `時段：${cls.time_slot ?? "—"} → ${timeSlot}`,
    roomLine,
    `老師：${cls.teacher_name ?? "—"}`,
    mode === "update_times"
      ? `將改堂數：${groups.update.length}；保留取消／補回：${groups.keep.length}；過去列不動：${groups.past.length}`
      : `將刪後重生：${groups.del.length} 列；${lessonCountPreviewLine(generated.dates.length, generated.calendarTarget)}；保留取消／補回：${groups.keep.length}`,
    `就讀中報讀：${(await fetchEnrollmentCountByClass([cls.id])).get(cls.id) ?? 0} 人`,
    `受影響列已點名：${attendanceCount}`,
    `取消堂與補回：${opts.keepCancelledAndMakeup || groups.keep.length === 0 ? "保留原列、不搬移" : "尚未確認保留"}`,
  ]
  return { previewLines: lines, blockedReason: blocked, mode }
}

async function applyNewTimesToRows(
  rows: ClassScheduleRow[],
  timeSlot: string,
  consecutive: boolean,
  classroomId: string | null
): Promise<void> {
  const bounds = sessionBounds(timeSlot, consecutive)
  for (const row of rows) {
    const idx = consecutive && row.consecutive_slot_index === 2 ? 1 : 0
    const bound = bounds[Math.min(idx, bounds.length - 1)]!
    await updateSchedule(row.id, {
      start_time: bound.start,
      end_time: bound.end,
      classroom_id: classroomId,
    })
    await releaseAvailabilitySlotForSchedule({
      teacherId: row.teacher_id,
      scheduledDate: row.scheduled_date,
      startTime: row.start_time,
    })
  }
}

export async function executeChangeFixedSlot(opts: {
  classId: string
  newDayOfWeek: string
  newTimeSlot: string
  newClassroomId: string | null
  keepCancelledAndMakeup: boolean
  classroomExplicit?: boolean
}): Promise<AdminOpsExecuteResult> {
  const preview = await previewChangeFixedSlot(opts)
  if (preview.blockedReason) throw new Error(preview.blockedReason)
  const cls = await getClassById(opts.classId)
  if (!cls) throw new Error("找不到班別")
  const timeSlot = timeSlotSelectValueFromStored(opts.newTimeSlot) || opts.newTimeSlot
  const consecutive = isConsecutiveClass(cls.lesson_slots_per_session)
  const today = todayYmdLocal()
  const schedules = await fetchClassSchedules(opts.classId)
  const mode = preview.mode
  const groups = classifiedRows(schedules, today, mode)
  const classroomId = opts.classroomExplicit ? opts.newClassroomId : opts.newClassroomId || cls.classroom_id
  const year = await yearRangeForClass(cls)

  if (mode === "update_times") {
    await updateClass(cls.id, {
      time_slot: timeSlot,
      classroom_id: classroomId,
    })
    await applyNewTimesToRows(groups.update, timeSlot, consecutive, classroomId)
    if (cls.teacher_id && groups.update.length > 0) {
      await markAvailabilityForScheduleDates({
        classId: cls.id,
        teacherId: cls.teacher_id,
        timeSlot,
        dates: [...new Set(groups.update.map((r) => r.scheduled_date))],
      })
    }
  } else {
    const firstDate = cls.start_date && cls.start_date > today ? cls.start_date : today
    const generated = specialistLessonDatesFromFirst({
      academicYearLabel: cls.academic_year_label ?? year.label,
      weekday: opts.newDayOfWeek,
      firstDateYmd: firstDate,
    })
    const pad = forbiddenPadDates({
      proposedDates: generated.dates,
      todayYmd: today,
      lastLessonYmd: generated.lastLessonYmd,
    })
    if (pad.past.length > 0 || pad.afterLast.length > 0) {
      throw new Error("不可為湊滿 40 堂而補建已過日期或排在最後上課日之後。")
    }
    await updateClass(cls.id, {
      day_of_week: opts.newDayOfWeek,
      time_slot: timeSlot,
      classroom_id: classroomId,
      start_date: generated.dates[0] ?? cls.start_date,
      end_date: generated.dates[generated.dates.length - 1] ?? cls.end_date,
    })
    for (const row of groups.del) {
      await deleteSchedule(row.id)
    }
    const updated = await getClassById(cls.id)
    if (!updated) throw new Error("找不到班別")
    if (generated.dates.length > 0) {
      await executeBatchSchedules({
        classId: cls.id,
        cls: updated,
        year,
        dates: generated.dates,
        classroomId,
        markAvailability: true,
      })
    }
  }

  const after = await getClassById(cls.id)
  await logMgmtAuditAction({
    action: "admin_ops.change_fixed_slot",
    detail: `class_id=${cls.id}; mode=${mode}; ${cls.day_of_week} ${cls.time_slot} → ${opts.newDayOfWeek} ${timeSlot}`,
  })
  const n = after ?? cls
  return {
    message:
      mode === "update_times"
        ? `已改鐘：${classLabel(n)} 逢星期不變，日後未取消、非補回列已 UPDATE，列 id 保留。`
        : `已改逢星期：${classLabel(n)} 已按校曆重生堂次，取消堂與補回列保留。`,
    noticeDraft: noticeFor(n),
  }
}

export async function previewSwapSlots(
  classAId: string,
  classBId: string
): Promise<{ previewLines: string[]; blockedReason: string | null }> {
  if (classAId === classBId) throw new Error("對調需要兩個不同的班。")
  const [a, b] = await Promise.all([getClassById(classAId), getClassById(classBId)])
  if (!a || !b) throw new Error("找不到要對調的班別")
  const previewA = await previewChangeFixedSlot({
    classId: a.id,
    newDayOfWeek: b.day_of_week ?? "",
    newTimeSlot: b.time_slot ?? "",
    newClassroomId: b.classroom_id,
    keepCancelledAndMakeup: true,
  })
  const previewB = await previewChangeFixedSlot({
    classId: b.id,
    newDayOfWeek: a.day_of_week ?? "",
    newTimeSlot: a.time_slot ?? "",
    newClassroomId: a.classroom_id,
    keepCancelledAndMakeup: true,
  })
  const lines = [
    `班 A：${classLabel(a)} ${a.day_of_week ?? "—"} ${a.time_slot ?? "—"} ${a.classroom_name ?? "未編課室"}`,
    `班 B：${classLabel(b)} ${b.day_of_week ?? "—"} ${b.time_slot ?? "—"} ${b.classroom_name ?? "未編課室"}`,
    "兩邊各走改時段閘（同星期改鐘只 UPDATE；改逢星期才重生）。",
    "— A 預覽 —",
    ...previewA.previewLines,
    "— B 預覽 —",
    ...previewB.previewLines,
  ]
  return {
    previewLines: lines,
    blockedReason: previewA.blockedReason ?? previewB.blockedReason,
  }
}

export async function executeSwapSlots(classAId: string, classBId: string): Promise<AdminOpsExecuteResult> {
  const preview = await previewSwapSlots(classAId, classBId)
  if (preview.blockedReason) throw new Error(preview.blockedReason)
  const [a, b] = await Promise.all([getClassById(classAId), getClassById(classBId)])
  if (!a || !b) throw new Error("找不到要對調的班別")
  const aTarget = {
    day: b.day_of_week ?? "",
    slot: b.time_slot ?? "",
    room: b.classroom_id,
  }
  const bTarget = {
    day: a.day_of_week ?? "",
    slot: a.time_slot ?? "",
    room: a.classroom_id,
  }
  await executeChangeFixedSlot({
    classId: a.id,
    newDayOfWeek: aTarget.day,
    newTimeSlot: aTarget.slot,
    newClassroomId: null,
    keepCancelledAndMakeup: true,
    classroomExplicit: true,
  })
  await executeChangeFixedSlot({
    classId: b.id,
    newDayOfWeek: bTarget.day,
    newTimeSlot: bTarget.slot,
    newClassroomId: null,
    keepCancelledAndMakeup: true,
    classroomExplicit: true,
  })
  if (aTarget.room) {
    await executeChangeFixedSlot({
      classId: a.id,
      newDayOfWeek: aTarget.day,
      newTimeSlot: aTarget.slot,
      newClassroomId: aTarget.room,
      keepCancelledAndMakeup: true,
    })
  }
  if (bTarget.room) {
    await executeChangeFixedSlot({
      classId: b.id,
      newDayOfWeek: bTarget.day,
      newTimeSlot: bTarget.slot,
      newClassroomId: bTarget.room,
      keepCancelledAndMakeup: true,
    })
  }
  const [afterA, afterB] = await Promise.all([getClassById(a.id), getClassById(b.id)])
  const notice = [afterA ? noticeFor(afterA) : "", afterB ? noticeFor(afterB) : ""].filter(Boolean).join("\n\n")
  return {
    message: `已對調 ${classLabel(a)} 與 ${classLabel(b)} 的固定時段。兩邊取消堂與補回列均未搬移。`,
    noticeDraft: notice,
  }
}

export async function previewCreateClassSchedule(slots: CreateClassScheduleSlots): Promise<{
  previewLines: string[]
  blockedReason: string | null
}> {
  if (!slots.course_id) return { previewLines: ["尚未選課程模板"], blockedReason: "請先選課程模板。" }
  if (!slots.day_of_week || !slots.time_slot) {
    return { previewLines: ["尚未齊逢星期／時段"], blockedReason: "請提供逢星期與時段。" }
  }
  if (!slots.teacher_id) {
    return { previewLines: ["尚未指定老師"], blockedReason: "排全年堂次須指定任教老師。" }
  }
  const today = todayYmdLocal()
  const first = slots.first_lesson_date && slots.first_lesson_date > today ? slots.first_lesson_date : today
  const generated = specialistLessonDatesFromFirst({
    academicYearLabel: slots.academic_year_label ?? "2627",
    weekday: slots.day_of_week,
    firstDateYmd: first,
  })
  const pad = forbiddenPadDates({
    proposedDates: generated.dates,
    todayYmd: today,
    lastLessonYmd: generated.lastLessonYmd,
  })
  let blocked: string | null = null
  if (pad.past.length > 0 || pad.afterLast.length > 0) {
    blocked = "不可為湊滿 40 堂而補建已過日期或排在最後上課日之後。"
  }
  const consecutive = Boolean(slots.consecutive_lesson)
  const timeSlot = timeSlotSelectValueFromStored(slots.time_slot) || slots.time_slot
  let roomLine = `課室：${slots.classroom_label ?? "未編課室"}`
  if (slots.classroom_id && generated.dates.length > 0) {
    const conflicts = await datesConflictingForRoom({
      classroomId: slots.classroom_id,
      dates: generated.dates,
      timeSlot,
      consecutive,
      excludeScheduleIds: new Set(),
    })
    if (conflicts.length > 0) {
      const suggestions = await suggestRooms({
        weekday: slots.day_of_week,
        currentRoomId: slots.classroom_id,
        dates: generated.dates,
        timeSlot,
        consecutive,
        excludeScheduleIds: new Set(),
      })
      roomLine = `課室撞期 ${conflicts.length} 日。建議：${
        suggestions.map((s) => `${s.name}（${s.note}）`).join("、") || "暫無空室"
      }`
      blocked = blocked ?? "指定課室撞期。請改選空室後再確認。"
    }
  }
  const lines = [
    `學年：${slots.academic_year_label ?? "—"}`,
    `課程：${slots.course_label ?? slots.subject_name ?? "—"}`,
    `年級：${slots.grade_label ?? "—"}`,
    `老師：${slots.teacher_label ?? "—"}`,
    `逢星期：${slots.day_of_week}`,
    `時段：${timeSlot}`,
    `連堂：${consecutive ? "是" : "否"}`,
    roomLine,
    `首堂：${generated.dates[0] ?? first}`,
    lessonCountPreviewLine(generated.dates.length, generated.calendarTarget),
    `一併報讀：${slots.enroll_student_label ?? "無"}`,
  ]
  return { previewLines: lines, blockedReason: blocked }
}

export async function executeCreateClassSchedule(
  slots: CreateClassScheduleSlots
): Promise<AdminOpsExecuteResult> {
  const preview = await previewCreateClassSchedule(slots)
  if (preview.blockedReason) throw new Error(preview.blockedReason)
  if (!slots.course_id || !slots.day_of_week || !slots.time_slot || !slots.teacher_id) {
    throw new Error("開班資料未齊。")
  }
  const today = todayYmdLocal()
  const first = slots.first_lesson_date && slots.first_lesson_date > today ? slots.first_lesson_date : today
  const generated = specialistLessonDatesFromFirst({
    academicYearLabel: slots.academic_year_label ?? "2627",
    weekday: slots.day_of_week,
    firstDateYmd: first,
  })
  const timeSlot = timeSlotSelectValueFromStored(slots.time_slot) || slots.time_slot
  const created = await insertClass({
    subject: slots.subject_name || slots.course_label || "專科班",
    course_id: slots.course_id,
    academic_year_id: slots.academic_year_id ?? null,
    academic_year_label: slots.academic_year_label ?? null,
    day_of_week: slots.day_of_week,
    time_slot: timeSlot,
    lesson_slots_per_session: slots.consecutive_lesson ? 2 : 1,
    teacher_id: slots.teacher_id,
    classroom_id: slots.classroom_id ?? null,
    start_date: generated.dates[0] ?? first,
    end_date: generated.dates[generated.dates.length - 1] ?? null,
    status: "進行中",
  })
  const year = await yearRangeForClass(created)
  let createdCount = 0
  if (generated.dates.length > 0) {
    const result = await executeBatchSchedules({
      classId: created.id,
      cls: created,
      year,
      dates: generated.dates,
      classroomId: slots.classroom_id ?? created.classroom_id,
      markAvailability: true,
    })
    createdCount = result.createdDates.length
  }
  if (slots.enroll_student_id) {
    await insertEnrollment(slots.enroll_student_id, created.id)
  }
  await logMgmtAuditAction({
    action: "admin_ops.create_class_schedule",
    detail: `class_id=${created.id}; code=${created.course_code_full ?? ""}; lessons=${createdCount}`,
  })
  return {
    message:
      `已開班並排堂：${classLabel(created)}。實際 ${createdCount} 堂` +
      (createdCount < 40 ? "（少於校曆目標 40，沒有補建已過日期）。" : "。") +
      (slots.enroll_student_label ? `\n已一併報讀：${slots.enroll_student_label}。` : ""),
    noticeDraft: noticeFor(created),
  }
}

export async function executeAdminOpsPending(
  pending: AdminOpsPendingExecute
): Promise<AdminOpsExecuteResult> {
  switch (pending.workflow) {
    case "delete_empty_class":
      return executeDeleteEmptyClass(pending.classId)
    case "change_fixed_slot":
      return executeChangeFixedSlot({
        classId: pending.classId,
        newDayOfWeek: pending.newDayOfWeek,
        newTimeSlot: pending.newTimeSlot,
        newClassroomId: pending.newClassroomId,
        keepCancelledAndMakeup: pending.keepCancelledAndMakeup,
      })
    case "swap_slots":
      return executeSwapSlots(pending.classAId, pending.classBId)
    case "create_class_schedule":
      return executeCreateClassSchedule(pending.slots)
    case "replace_empty_slot": {
      if (pending.step === "delete") {
        const deleted = await executeDeleteEmptyClass(pending.deleteClassId)
        const createPreview = await previewCreateClassSchedule(pending.createSlots)
        if (createPreview.blockedReason) {
          return {
            message: `${deleted.message}\n\n同一格開新班未能預覽：${createPreview.blockedReason}`,
            noticeDraft: deleted.noticeDraft,
            nextPending: null,
          }
        }
        const nextPending: AdminOpsPendingExecute = {
          workflow: "replace_empty_slot",
          step: "create",
          deleteClassId: pending.deleteClassId,
          createSlots: pending.createSlots,
          previewLines: createPreview.previewLines,
        }
        return {
          message: `${deleted.message}\n\n請再確認同一格開新班。`,
          noticeDraft: deleted.noticeDraft,
          nextPending,
        }
      }
      return executeCreateClassSchedule(pending.createSlots)
    }
    default:
      throw new Error("無法識別的確認操作。")
  }
}

export async function enrichPendingPreview(
  pending: AdminOpsPendingExecute
): Promise<AdminOpsPendingExecute> {
  switch (pending.workflow) {
    case "delete_empty_class": {
      const preview = await previewDeleteEmptyClass(pending.classId)
      if (preview.blockedReason) throw new Error(preview.blockedReason)
      return { ...pending, previewLines: preview.previewLines }
    }
    case "change_fixed_slot": {
      const preview = await previewChangeFixedSlot({
        classId: pending.classId,
        newDayOfWeek: pending.newDayOfWeek,
        newTimeSlot: pending.newTimeSlot,
        newClassroomId: pending.newClassroomId,
        keepCancelledAndMakeup: pending.keepCancelledAndMakeup,
      })
      if (preview.blockedReason) throw new Error(preview.blockedReason)
      return { ...pending, mode: preview.mode, previewLines: preview.previewLines }
    }
    case "swap_slots": {
      const preview = await previewSwapSlots(pending.classAId, pending.classBId)
      if (preview.blockedReason) throw new Error(preview.blockedReason)
      return { ...pending, previewLines: preview.previewLines }
    }
    case "create_class_schedule": {
      const preview = await previewCreateClassSchedule(pending.slots)
      if (preview.blockedReason) throw new Error(preview.blockedReason)
      return { ...pending, previewLines: preview.previewLines }
    }
    case "replace_empty_slot": {
      if (pending.step === "delete") {
        const preview = await previewDeleteEmptyClass(pending.deleteClassId)
        if (preview.blockedReason) throw new Error(preview.blockedReason)
        return { ...pending, previewLines: preview.previewLines }
      }
      const preview = await previewCreateClassSchedule(pending.createSlots)
      if (preview.blockedReason) throw new Error(preview.blockedReason)
      return { ...pending, previewLines: preview.previewLines }
    }
    default:
      return pending
  }
}
