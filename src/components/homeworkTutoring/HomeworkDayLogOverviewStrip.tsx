import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { formatUnknownError } from "@/lib/formatUnknownError"
import {
  homeworkDayLogPhase,
  todayYmdLocal,
} from "@/lib/homeworkDayLogDates"
import {
  studentsComingOnWeekday,
  type HomeworkStudentRow,
  type Weekday,
} from "@/lib/homeworkTutoringUi"
import { listHomeworkDayLogsForDate } from "@/services/homeworkDayLogQueries"

type Props = {
  students: HomeworkStudentRow[]
  todayWeekday: Weekday | null
  onGoDayLogs: () => void
}

/** Overview／監督首屏：今日功輔紀錄迷你進度。 */
export function HomeworkDayLogOverviewStrip({
  students,
  todayWeekday,
  onGoDayLogs,
}: Props) {
  const logDate = todayYmdLocal()
  const coming = useMemo(
    () => studentsComingOnWeekday(students, todayWeekday),
    [students, todayWeekday]
  )
  const [openCount, setOpenCount] = useState(0)
  const [leftCount, setLeftCount] = useState(0)
  const [noneCount, setNoneCount] = useState(coming.length)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const logs = await listHomeworkDayLogsForDate(logDate)
        if (cancelled) return
        const byId = new Map(logs.map((l) => [l.studentId, l]))
        let open = 0
        let left = 0
        let none = 0
        for (const s of coming) {
          const phase = homeworkDayLogPhase(byId.get(s.id))
          if (phase === "open") open += 1
          else if (phase === "left") left += 1
          else none += 1
        }
        setOpenCount(open)
        setLeftCount(left)
        setNoneCount(none)
        setErr(null)
      } catch (e) {
        if (!cancelled) setErr(formatUnknownError(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [coming, logDate])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div>
        <p className="text-sm font-medium">功課紀錄</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          應到 {coming.length} · 進行中 {openCount} · 已離開 {leftCount}
          {noneCount > 0 ? ` · 未建檔 ${noneCount}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          到達時建檔，上課期間逐步更新與拍照，離開時再記離開。
        </p>
        {err ? <p className="mt-1 text-xs text-destructive">{err}</p> : null}
      </div>
      <Button type="button" onClick={onGoDayLogs}>
        前往功課紀錄
      </Button>
    </div>
  )
}
