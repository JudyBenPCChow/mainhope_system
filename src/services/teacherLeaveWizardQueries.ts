import { updateSchedule } from "@/services/classQueries"
import {
  fetchLeaveStudentIdsForSchedules,
} from "@/services/attendanceQueries"
import {
  insertLeaveMakeupForSchedule,
  TEACHER_ABSENCE_LEAVE_REASON,
  updateLeaveMakeupRecord,
} from "@/services/leaveQueries"
import {
  assignScheduleSubstitute,
  fetchDayViewRosterBySchedules,
  fetchSchedulesInRange,
  type ScheduleManageRow,
} from "@/services/scheduleQueries"
import { recordInboxEvent } from "@/services/inboxEventWrite"
import { supabase } from "@/lib/supabaseClient"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"

export type TeacherLeaveStudentKind = "expected" | "leave" | "makeup"

export type TeacherLeaveStudent = {
  studentId: string
  fullName: string
  kind: TeacherLeaveStudentKind
  leaveReason?: string | null
  leaveMakeup?: string | null
  /** 已請假／來補堂對應的 leave_makeup_records.id（拆補堂用） */
  leaveRecordId?: string
  makeupFromHint?: string | null
}

export type TeacherLeaveLessonUnit = {
  primaryScheduleId: string
  scheduleIds: string[]
  classId: string | null
  classLabel: string
  room: string | null
  startTime: string | null
  endTime: string | null
  consecutive: boolean
  alreadySubstituted: boolean
  currentTeacherName: string | null
  students: TeacherLeaveStudent[]
}

export type TeacherLeaveDayDecision =
  | { action: "keep" }
  | { action: "substitute"; substituteTeacherId: string }
  | { action: "cancel" }

export type TeacherLeaveExecuteItem = {
  primaryScheduleId: string
  decision: TeacherLeaveDayDecision
}

export type TeacherLeaveExecuteResult = {
  substituted: Array<{ primaryScheduleId: string; classLabel: string; substituteTeacherId: string }>
  cancelled: Array<{
    primaryScheduleId: string
    classLabel: string
    followUpNames: string[]
    skippedLeaveNames: string[]
    makeupResetNames: string[]
  }>
  kept: Array<{ primaryScheduleId: string; classLabel: string }>
  errors: string[]
}

type LeaveRowDetail = {
  id: string
  studentId: string
  scheduleId: string | null
  classId: string
  leaveDate: string
  leaveReason: string | null
  makeupType: string | null
  fullName: string
}

type MakeupTargetRow = {
  id: string
  studentId: string
  fullName: string
  makeupScheduleId: string
  remarks: string | null
  leaveDate: string
  classLabelHint: string | null
}

function isCancelledStatus(status: string): boolean {
  return status.includes("取消")
}

function groupSchedulesIntoUnits(rows: ScheduleManageRow[]): ScheduleManageRow[][] {
  const active = rows.filter((r) => !isCancelledStatus(r.status))
  const byGroup = new Map<string, ScheduleManageRow[]>()
  const order: string[] = []
  for (const r of active) {
    const key = r.consecutive_group_id ?? r.id
    if (!byGroup.has(key)) {
      byGroup.set(key, [])
      order.push(key)
    }
    byGroup.get(key)!.push(r)
  }
  return order.map((key) => {
    const list = byGroup.get(key)!
    list.sort((a, b) => (a.consecutive_slot_index ?? 0) - (b.consecutive_slot_index ?? 0))
    return list
  })
}

async function fetchLeaveDetailsForSchedules(
  schedules: { id: string; class_id: string | null; scheduled_date: string }[]
): Promise<LeaveRowDetail[]> {
  if (!supabase || schedules.length === 0) return []
  const dates = [...new Set(schedules.map((s) => s.scheduled_date))]
  const classIds = [
    ...new Set(schedules.map((s) => s.class_id).filter((x): x is string => x != null && x !== "")),
  ]
  if (classIds.length === 0) return []

  const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("leave_makeup_records")
      .select(
        "id, student_id, schedule_id, class_id, leave_date, leave_reason, makeup_type, students ( full_name )"
      )
      .in("class_id", slice)
      .in("leave_date", dates)
    if (error) throw error
    return data ?? []
  })

  const out: LeaveRowDetail[] = []
  for (const data of chunks) {
    for (const row of data) {
      const r = row as Record<string, unknown>
      const st = r.students as Record<string, unknown> | null
      out.push({
        id: String(r.id),
        studentId: String(r.student_id),
        scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
        classId: String(r.class_id),
        leaveDate: String(r.leave_date),
        leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
        makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
        fullName: st?.full_name != null ? String(st.full_name) : "—",
      })
    }
  }
  return out
}

async function fetchMakeupTargetRows(scheduleIds: string[]): Promise<MakeupTargetRow[]> {
  if (!supabase || scheduleIds.length === 0) return []
  const { data, error } = await supabase
    .from("leave_makeup_records")
    .select(
      "id, student_id, makeup_schedule_id, remarks, leave_date, students ( full_name ), classes ( subject, course_code_full, courses ( course_name ) )"
    )
    .in("makeup_schedule_id", scheduleIds)
  if (error) throw error
  const out: MakeupTargetRow[] = []
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    const cls = r.classes as Record<string, unknown> | null
    const course = cls?.courses as Record<string, unknown> | null
    const hintParts = [
      cls?.subject != null ? String(cls.subject) : null,
      course?.course_name != null ? String(course.course_name) : null,
      r.leave_date != null ? String(r.leave_date) : null,
    ].filter(Boolean)
    out.push({
      id: String(r.id),
      studentId: String(r.student_id),
      fullName: st?.full_name != null ? String(st.full_name) : "—",
      makeupScheduleId: String(r.makeup_schedule_id),
      remarks: r.remarks != null ? String(r.remarks) : null,
      leaveDate: String(r.leave_date ?? ""),
      classLabelHint: hintParts.length ? hintParts.join(" · ") : null,
    })
  }
  return out
}

function leaveAppliesToSchedule(
  leave: LeaveRowDetail,
  s: { id: string; class_id: string | null; scheduled_date: string }
): boolean {
  const linked = leave.scheduleId != null && leave.scheduleId === s.id
  const sameClassDate = s.class_id === leave.classId && s.scheduled_date === leave.leaveDate
  return linked || sameClassDate
}

/**
 * 載入某老師某日可處理堂次（已取消除外），連堂合併為一單位，並分類學生。
 */
export async function loadTeacherLeaveDay(
  teacherId: string,
  ymd: string
): Promise<TeacherLeaveLessonUnit[]> {
  if (!teacherId || !ymd) return []
  const rows = await fetchSchedulesInRange(ymd, ymd, { teacherId })
  const groups = groupSchedulesIntoUnits(rows)
  if (groups.length === 0) return []

  const flat = groups.flat()
  const scheduleKeys = flat.map((s) => ({
    id: s.id,
    class_id: s.class_id,
    scheduled_date: s.scheduled_date,
  }))

  const [rosterMap, leaveIdsMap, leaveDetails, makeupTargets] = await Promise.all([
    fetchDayViewRosterBySchedules(scheduleKeys),
    fetchLeaveStudentIdsForSchedules(scheduleKeys),
    fetchLeaveDetailsForSchedules(scheduleKeys),
    fetchMakeupTargetRows(flat.map((s) => s.id)),
  ])

  const units: TeacherLeaveLessonUnit[] = []
  for (const group of groups) {
    const primary = group[0]!
    const scheduleIds = group.map((g) => g.id)
    const last = group[group.length - 1]!

    const leaveStudentIds = new Set<string>()
    for (const sid of scheduleIds) {
      for (const id of leaveIdsMap.get(sid) ?? []) leaveStudentIds.add(id)
    }

    const makeupOnUnit = makeupTargets.filter((m) => scheduleIds.includes(m.makeupScheduleId))
    const makeupStudentIds = new Set(makeupOnUnit.map((m) => m.studentId))

    // 合併各 slot roster（連堂通常相同）
    const rosterById = new Map<string, string>()
    for (const sid of scheduleIds) {
      for (const st of rosterMap.get(sid) ?? []) {
        if (!rosterById.has(st.studentId)) rosterById.set(st.studentId, st.fullName)
      }
    }

    const students: TeacherLeaveStudent[] = []
    const seen = new Set<string>()

    for (const m of makeupOnUnit) {
      if (seen.has(m.studentId)) continue
      seen.add(m.studentId)
      students.push({
        studentId: m.studentId,
        fullName: m.fullName,
        kind: "makeup",
        leaveRecordId: m.id,
        makeupFromHint: m.classLabelHint,
      })
    }

    for (const leave of leaveDetails) {
      const applies = scheduleKeys.some(
        (sk) => scheduleIds.includes(sk.id) && leaveAppliesToSchedule(leave, sk)
      )
      if (!applies) continue
      if (seen.has(leave.studentId)) continue
      // 若同時是來補堂，已在 makeup 欄
      if (makeupStudentIds.has(leave.studentId)) continue
      seen.add(leave.studentId)
      students.push({
        studentId: leave.studentId,
        fullName: leave.fullName,
        kind: "leave",
        leaveRecordId: leave.id,
        leaveReason: leave.leaveReason,
        leaveMakeup: leave.makeupType,
      })
    }

    for (const [studentId, fullName] of rosterById) {
      if (seen.has(studentId)) continue
      if (leaveStudentIds.has(studentId)) {
        // 有 leave id 但 leaveDetails 漏了名字時仍標已請假
        seen.add(studentId)
        students.push({ studentId, fullName, kind: "leave" })
        continue
      }
      if (makeupStudentIds.has(studentId)) continue
      seen.add(studentId)
      students.push({ studentId, fullName, kind: "expected" })
    }

    students.sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))

    units.push({
      primaryScheduleId: primary.id,
      scheduleIds,
      classId: primary.class_id,
      classLabel: primary.classLabel,
      room: primary.classroom_name,
      startTime: primary.start_time,
      endTime: last.end_time ?? primary.end_time,
      consecutive: group.length > 1 || primary.consecutive_group_id != null,
      alreadySubstituted: primary.original_teacher_id != null,
      currentTeacherName: primary.teacher_name,
      students,
    })
  }

  units.sort((a, b) => String(a.startTime ?? "").localeCompare(String(b.startTime ?? "")))
  return units
}

function buildCancelReason(note: string | null | undefined): string {
  const n = (note ?? "").trim()
  return n ? `老師請假：${n}` : "老師請假"
}

/**
 * 依逐堂決策執行：代堂／取消（建待另約＋拆補堂）／照常。
 * 盡量逐項執行；錯誤收集於 errors，不中斷其餘堂次。
 */
export async function executeTeacherLeaveDay(params: {
  leaveTeacherId: string
  leaveDate: string
  note?: string | null
  units: TeacherLeaveLessonUnit[]
  items: TeacherLeaveExecuteItem[]
}): Promise<TeacherLeaveExecuteResult> {
  const result: TeacherLeaveExecuteResult = {
    substituted: [],
    cancelled: [],
    kept: [],
    errors: [],
  }
  const unitById = new Map(params.units.map((u) => [u.primaryScheduleId, u]))
  const cancelReason = buildCancelReason(params.note)

  for (const item of params.items) {
    const unit = unitById.get(item.primaryScheduleId)
    if (!unit) {
      result.errors.push(`找不到堂次 ${item.primaryScheduleId}`)
      continue
    }

    try {
      if (item.decision.action === "keep") {
        result.kept.push({
          primaryScheduleId: unit.primaryScheduleId,
          classLabel: unit.classLabel,
        })
        continue
      }

      if (item.decision.action === "substitute") {
        await assignScheduleSubstitute(unit.primaryScheduleId, item.decision.substituteTeacherId)
        result.substituted.push({
          primaryScheduleId: unit.primaryScheduleId,
          classLabel: unit.classLabel,
          substituteTeacherId: item.decision.substituteTeacherId,
        })
        continue
      }

      // cancel
      if (!unit.classId) {
        throw new Error(`${unit.classLabel}：無班別，無法建立待另約`)
      }

      for (const sid of unit.scheduleIds) {
        await updateSchedule(sid, { status: "取消", cancel_reason: cancelReason })
      }

      const expected = unit.students.filter((s) => s.kind === "expected")
      const leaveOnly = unit.students.filter((s) => s.kind === "leave")
      const makeup = unit.students.filter((s) => s.kind === "makeup")

      for (const st of expected) {
        try {
          await insertLeaveMakeupForSchedule({
            student_id: st.studentId,
            class_id: unit.classId,
            schedule_id: unit.primaryScheduleId,
            leave_date: params.leaveDate,
            leave_reason: TEACHER_ABSENCE_LEAVE_REASON,
            makeup_type: "待安排",
            remarks: params.note?.trim()
              ? `[老師請假] ${params.note.trim()}`
              : "[老師請假]",
            status: "待補課",
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          // 重複則略過
          if (!msg.includes("已有請假")) {
            result.errors.push(`${st.fullName}（${unit.classLabel}）：${msg}`)
          }
        }
      }

      for (const st of makeup) {
        if (!st.leaveRecordId) continue
        const suffix = "原補堂因老師請假取消"
        const prev = st.makeupFromHint ?? ""
        const remarks = [prev && `原：${prev}`, suffix].filter(Boolean).join("；")
        await updateLeaveMakeupRecord(st.leaveRecordId, {
          makeup_type: "待安排",
          makeup_schedule_id: null,
          makeup_date: null,
          remarks,
        })
        // 有可刪出席時 service 會拋錯（須行政在請假管理處理）；見 O6 SOP
      }

      result.cancelled.push({
        primaryScheduleId: unit.primaryScheduleId,
        classLabel: unit.classLabel,
        followUpNames: expected.map((s) => s.fullName),
        skippedLeaveNames: leaveOnly.map((s) => s.fullName),
        makeupResetNames: makeup.map((s) => s.fullName),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      result.errors.push(`${unit.classLabel}：${msg}`)
    }
  }

  if (result.substituted.length > 0 || result.cancelled.length > 0) {
    const subIds = result.substituted.map((s) => s.substituteTeacherId)
    void recordInboxEvent({
      eventType: "schedule_updated",
      title: `老師請假日已處理（${params.leaveDate}）`,
      body: `代堂 ${result.substituted.length}、取消 ${result.cancelled.length}、照常 ${result.kept.length}`,
      actionPath: `/Schedule?view=day&date=${params.leaveDate}`,
      audienceTeacherIds: [params.leaveTeacherId, ...subIds],
      payload: {
        teacherLeaveDay: true,
        leaveDate: params.leaveDate,
        substituted: result.substituted.length,
        cancelled: result.cancelled.length,
        kept: result.kept.length,
      },
    })
  }

  return result
}
