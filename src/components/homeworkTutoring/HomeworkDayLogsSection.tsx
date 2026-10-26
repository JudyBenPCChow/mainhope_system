import { useState } from "react"

import { HW_PATH } from "@/lib/homeworkTutoringNav"
import { cn } from "@/lib/utils"
import type {
  HomeworkDutyDay,
  HomeworkHoliday,
  HomeworkStudentRow,
  HomeworkTeacherRow,
  Weekday,
} from "@/lib/homeworkTutoringUi"

import { HomeworkDayLogStudentGallery } from "./HomeworkDayLogStudentGallery"
import { HomeworkDayLogTodayPanel } from "./HomeworkDayLogTodayPanel"

type DayLogsView = "today" | "all"

type Props = {
  students: HomeworkStudentRow[]
  hwTeachers: HomeworkTeacherRow[]
  todayDuty: HomeworkDutyDay | null
  todayWeekday: Weekday | null
  holidays: HomeworkHoliday[]
  academicYearLabel: string
  canDelete: boolean
  preferredTeacherId?: string | null
  /** 圖庫返回與進單生的列表路徑。 */
  listPath?: string
}

/** 功課紀錄：今日名冊（漸進到離）｜全部學生圖庫 */
export function HomeworkDayLogsSection({
  students,
  hwTeachers,
  todayDuty,
  todayWeekday,
  holidays,
  academicYearLabel,
  canDelete,
  preferredTeacherId,
  listPath = HW_PATH.dayLogs,
}: Props) {
  const [view, setView] = useState<DayLogsView>("today")

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-1.5 border-b border-border pb-3"
        role="tablist"
        aria-label="功課紀錄檢視"
      >
        <ViewTab active={view === "today"} onClick={() => setView("today")} label="今日" />
        <ViewTab active={view === "all"} onClick={() => setView("all")} label="全部學生" />
      </div>

      {view === "today" ? (
        <HomeworkDayLogTodayPanel
          students={students}
          hwTeachers={hwTeachers}
          todayDuty={todayDuty}
          todayWeekday={todayWeekday}
          holidays={holidays}
          academicYearLabel={academicYearLabel}
          canDelete={canDelete}
          preferredTeacherId={preferredTeacherId}
        />
      ) : (
        <HomeworkDayLogStudentGallery students={students} listPath={listPath} />
      )}
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}
