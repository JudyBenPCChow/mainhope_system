/** 排程代堂顯示與點名權限輔助 */

export type ScheduleSubstituteFields = {
 teacher_id: string | null
 teacher_name: string | null
 original_teacher_id: string | null
 original_teacher_name: string | null
}

export function isScheduleSubstituted(
 row: Pick<ScheduleSubstituteFields, "original_teacher_id">
): boolean {
 return row.original_teacher_id != null && String(row.original_teacher_id).length > 0
}

/**
 * 代堂標籤文案：
 * - 原老師視角：已指派代堂：王老師
 * - 代堂老師視角：代堂（原：李老師）
 * - 管理員／其他：代堂：王老師（原：李老師）
 */
export function formatScheduleSubstituteTag(
 row: ScheduleSubstituteFields,
 viewerTeacherId?: string | null
): string | null {
 if (!isScheduleSubstituted(row)) return null
 const current = (row.teacher_name ?? "").trim() || "—"
 const original = (row.original_teacher_name ?? "").trim() || "—"
 if (viewerTeacherId && viewerTeacherId === row.original_teacher_id) {
  return `已指派代堂：${current}`
 }
 if (viewerTeacherId && viewerTeacherId === row.teacher_id) {
  return `代堂（原：${original}）`
 }
 return `代堂：${current}（原：${original}）`
}

/** 老師身份時，僅現任排程老師可點名；admin／未限定 scope 可編輯 */
export function canTeacherEditScheduleRollCall(
 row: Pick<ScheduleSubstituteFields, "teacher_id">,
 viewerTeacherId?: string | null
): boolean {
 if (!viewerTeacherId) return true
 return row.teacher_id != null && row.teacher_id === viewerTeacherId
}
