import { classMeetingLabel, formatScheduleLine } from "@/lib/trialInvitePublicFlow"
import type { TrialInviteClassOption } from "@/services/trialInviteQueries"

/** 與班別科目名稱一致，寫入潛在客戶有興趣科目。 */
export const HOMEWORK_INTEREST_SUBJECT = "功課輔導"

export type HomeworkDateChoice = {
  classId: string
  scheduleId: string
  date: string
  meetingLabel: string
  line: string
}

/** 功課輔導班公開頁可選日子。不套專科人數上限；只列目錄已帶回的未來堂次。 */
export function homeworkDateChoices(classes: TrialInviteClassOption[]): HomeworkDateChoice[] {
  const rows: HomeworkDateChoice[] = []
  for (const cls of classes) {
    if (cls.class_kind !== "homework") continue
    const meetingLabel = classMeetingLabel(cls)
    for (const sch of cls.schedules) {
      const scheduleId = sch.id.trim()
      const date = sch.scheduled_date.slice(0, 10)
      if (!scheduleId || !date) continue
      rows.push({
        classId: cls.id,
        scheduleId,
        date,
        meetingLabel,
        line: formatScheduleLine(sch),
      })
    }
  }
  rows.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    return a.line.localeCompare(b.line, "zh-Hant")
  })
  const seen = new Set<string>()
  return rows.filter((row) => {
    if (seen.has(row.scheduleId)) return false
    seen.add(row.scheduleId)
    return true
  })
}
