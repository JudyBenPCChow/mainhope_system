import { classMeetingLabel, formatScheduleLine } from "@/lib/trialInvitePublicFlow"
import { addDaysYmd, todayYmdLocal } from "@/lib/weekdayUtils"
import type { TrialInviteClassOption } from "@/services/trialInviteQueries"

/** 與班別科目名稱一致，寫入潛在客戶有興趣科目。 */
export const HOMEWORK_INTEREST_SUBJECT = "功課輔導"

/** 公開頁可選試堂日子：今天起最多未來 N 日（含今天）。 */
export const HOMEWORK_PUBLIC_DATE_WINDOW_DAYS = 30

export type HomeworkDateChoice = {
  classId: string
  scheduleId: string
  date: string
  meetingLabel: string
  line: string
}

/** 功課輔導班公開頁可選日子。不套專科人數上限；只列未來最多 30 日的堂次。 */
export function homeworkDateChoices(
  classes: TrialInviteClassOption[],
  today = todayYmdLocal()
): HomeworkDateChoice[] {
  const maxDate = addDaysYmd(today, HOMEWORK_PUBLIC_DATE_WINDOW_DAYS)
  const rows: HomeworkDateChoice[] = []
  for (const cls of classes) {
    if (cls.class_kind !== "homework") continue
    const meetingLabel = classMeetingLabel(cls)
    for (const sch of cls.schedules) {
      const scheduleId = sch.id.trim()
      const date = sch.scheduled_date.slice(0, 10)
      if (!scheduleId || !date) continue
      if (date < today || date > maxDate) continue
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
