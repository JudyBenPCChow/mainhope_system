/** 私人班：班別負責老師 vs 各堂排程老師一致性（時間表依排程老師） */

export type ScheduleTeacherFields = {
 status: string
 teacher_id: string | null
 original_teacher_id: string | null
}

export type ClassTeacherMismatchSummary = {
 /** 未取消排程總數 */
 activeCount: number
 /** 與班別老師不一致的堂數（含排程老師為空、不同老師、代堂原任不符） */
 mismatchCount: number
 /** 排程老師為空（無代堂）的堂數 */
 nullScheduleTeacherCount: number
 /** 排程老師有值但與班別老師不同（無代堂） */
 differentTeacherCount: number
 /** 有代堂且原任老師與班別老師不同 */
 substituteOriginalMismatchCount: number
}

function isCancelledStatus(status: string): boolean {
 return status.includes("取消")
}

function hasSubstitute(row: ScheduleTeacherFields): boolean {
 return row.original_teacher_id != null && String(row.original_teacher_id).trim() !== ""
}

/**
 * 統計單一私人班「班別老師」與未取消排程老師的落差。
 * classTeacherId 為 null 時：只統計有排程老師／代堂標記的堂（班別未指定時不計「空老師」為不一致）。
 */
export function summarizeClassTeacherScheduleMismatch(
 classTeacherId: string | null | undefined,
 schedules: ScheduleTeacherFields[]
): ClassTeacherMismatchSummary {
 const classTid = classTeacherId?.trim() || null
 let activeCount = 0
 let mismatchCount = 0
 let nullScheduleTeacherCount = 0
 let differentTeacherCount = 0
 let substituteOriginalMismatchCount = 0

 for (const row of schedules) {
  if (isCancelledStatus(String(row.status ?? ""))) continue
  activeCount += 1
  const subst = hasSubstitute(row)
  if (subst) {
   if (classTid && row.original_teacher_id !== classTid) {
    mismatchCount += 1
    substituteOriginalMismatchCount += 1
   }
   continue
  }
  const schedTid = row.teacher_id?.trim() || null
  if (!classTid) continue
  if (schedTid == null) {
   mismatchCount += 1
   nullScheduleTeacherCount += 1
  } else if (schedTid !== classTid) {
   mismatchCount += 1
   differentTeacherCount += 1
  }
 }

 return {
  activeCount,
  mismatchCount,
  nullScheduleTeacherCount,
  differentTeacherCount,
  substituteOriginalMismatchCount,
 }
}
