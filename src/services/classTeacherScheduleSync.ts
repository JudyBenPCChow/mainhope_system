/**
 * 更換任教老師：已有老師只改尚未開始的堂；空白老師可回填；代堂只改原任。
 */
import { formatUnknownError } from "@/lib/formatUnknownError"
import {
  civilHm,
  civilYmd,
  partitionSchedulesForClassTeacherSync,
  type ClassTeacherSyncScheduleRow,
} from "@/lib/classTeacherScheduleSync"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"

export async function syncFutureSchedulesForClassTeacherChange(
  classId: string,
  nextTeacherId: string | null,
  now = new Date()
): Promise<number> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, status, scheduled_date, start_time, teacher_id, original_teacher_id, consecutive_group_id"
    )
    .eq("class_id", classId)
  if (error) throw new Error(formatUnknownError(error))

  const rows: ClassTeacherSyncScheduleRow[] = ((data ?? []) as Record<string, unknown>[]).map(
    (raw) => ({
      id: String(raw.id),
      status: raw.status != null ? String(raw.status) : null,
      scheduledDate: String(raw.scheduled_date ?? "").slice(0, 10),
      startTime: raw.start_time != null ? String(raw.start_time) : null,
      teacherId: raw.teacher_id != null ? String(raw.teacher_id) : null,
      originalTeacherId:
        raw.original_teacher_id != null ? String(raw.original_teacher_id) : null,
      consecutiveGroupId:
        raw.consecutive_group_id != null ? String(raw.consecutive_group_id) : null,
    })
  )
  const { directIds, substituteIds } = partitionSchedulesForClassTeacherSync(
    rows,
    nextTeacherId,
    civilYmd(now),
    civilHm(now)
  )

  let synced = 0
  if (directIds.length > 0) {
    await forEachIdChunk(directIds, DEFAULT_ID_CHUNK, async (slice) => {
      const { error: upErr, count } = await supabase!
        .from("schedules")
        .update({ teacher_id: nextTeacherId }, { count: "exact" })
        .in("id", slice)
      if (upErr) throw new Error(formatUnknownError(upErr))
      synced += count ?? slice.length
    })
  }
  if (substituteIds.length > 0) {
    await forEachIdChunk(substituteIds, DEFAULT_ID_CHUNK, async (slice) => {
      const { error: upErr, count } = await supabase!
        .from("schedules")
        .update({ original_teacher_id: nextTeacherId }, { count: "exact" })
        .in("id", slice)
      if (upErr) throw new Error(formatUnknownError(upErr))
      synced += count ?? slice.length
    })
  }
  return synced
}
