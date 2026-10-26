import { useNavigate } from "react-router-dom"
import { NotebookPen } from "lucide-react"

import { HomeworkDayLogStudentPage } from "@/components/homeworkTutoring/HomeworkDayLogStudentPage"
import { HomeworkDayLogsSection } from "@/components/homeworkTutoring/HomeworkDayLogsSection"
import { HW_DAY_LOGS_PATH } from "@/lib/homeworkTutoringNav"
import type {
  HomeworkDutyDay,
  HomeworkHoliday,
  HomeworkStudentRow,
  HomeworkTeacherRow,
  Weekday,
} from "@/lib/homeworkTutoringUi"

type Props = {
  loading: boolean
  loadError: string | null
  students: HomeworkStudentRow[]
  hwTeachers: HomeworkTeacherRow[]
  todayDuty: HomeworkDutyDay | null
  todayWeekday: Weekday | null
  todayCount: number
  holidayLabel: string | null
  holidays: HomeworkHoliday[]
  academicYearLabel: string
  preferredTeacherId: string | null
  studentId: string | null
  student: HomeworkStudentRow | null
}

function dayLogsSubtitle(opts: {
  loading: boolean
  todayCount: number
  holidayLabel: string | null
}): string {
  if (opts.loading) return "今日學生的到達、更新與離開。"
  if (opts.holidayLabel) return "今日功輔放假，通常無需寫紀錄。"
  if (opts.todayCount <= 0) return "今日無名冊應到學生。"
  return `今日應到 ${opts.todayCount} 人。到達時建檔，上課期間逐步更新，離開時再記離開。`
}

/** 老師功課紀錄獨立頁殼：每日到離紀錄，不套功輔行政眉題或報更／當值分頁。 */
export function TeacherHomeworkDayLogsShell({
  loading,
  loadError,
  students,
  hwTeachers,
  todayDuty,
  todayWeekday,
  todayCount,
  holidayLabel,
  holidays,
  academicYearLabel,
  preferredTeacherId,
  studentId,
  student,
}: Props) {
  const navigate = useNavigate()
  const subtitle = dayLogsSubtitle({ loading, todayCount, holidayLabel })

  return (
    <div className="space-y-4">
      <header>
        <div className="flex items-center gap-2">
          <NotebookPen className="h-6 w-6 text-primary" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">功課紀錄</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </header>

      {loading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}
      {loadError ? (
        <p role="alert" className="text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {!loading && !loadError && studentId ? (
        student ? (
          <HomeworkDayLogStudentPage
            student={student}
            hwTeachers={hwTeachers}
            todayDuty={todayDuty}
            holidays={holidays}
            academicYearLabel={academicYearLabel}
            canDelete={false}
            preferredTeacherId={preferredTeacherId}
            listPath={HW_DAY_LOGS_PATH}
          />
        ) : (
          <div className="space-y-3 rounded-xl border border-dashed border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">找不到此學生的功輔報讀紀錄。</p>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => navigate(HW_DAY_LOGS_PATH)}
            >
              返回圖庫
            </button>
          </div>
        )
      ) : null}

      {!loading && !loadError && !studentId ? (
        <HomeworkDayLogsSection
          students={students}
          hwTeachers={hwTeachers}
          todayDuty={todayDuty}
          todayWeekday={todayWeekday}
          holidays={holidays}
          academicYearLabel={academicYearLabel}
          canDelete={false}
          preferredTeacherId={preferredTeacherId}
          listPath={HW_DAY_LOGS_PATH}
        />
      ) : null}
    </div>
  )
}
