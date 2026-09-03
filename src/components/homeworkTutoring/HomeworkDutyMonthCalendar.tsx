import { useMemo, type ReactNode } from "react"
import { ArrowDown } from "lucide-react"

import { Tag } from "@/components/ui/tag"
import {
  MonthCalendar,
  type MonthCalendarTone,
} from "@/components/ui/month-calendar"
import {
  emptyDutyFromRosterDay,
  formatAssignmentHours,
  formatCalendarAssignmentLine,
  holidaysInYearMonth,
  homeworkDutyRoomCards,
  homeworkDutyRoomIdleLabel,
  isTeacherOnDutyDay,
  listRosterMonthDays,
  myDutyCalendarTone,
  teacherName,
  dutyDaysByMdKey,
  type HomeworkDutyDay,
  type HomeworkHoliday,
  type HomeworkTeacherRow,
  type RosterDay,
} from "@/lib/homeworkTutoringUi"

function dutyTone(opts: {
  day: RosterDay
  duty: HomeworkDutyDay | undefined
  highlightTeacherId?: string
}): MonthCalendarTone {
  const mapped = myDutyCalendarTone({
    selectable: opts.day.selectable,
    holidayLabel: opts.day.holidayLabel,
    isMine: opts.highlightTeacherId
      ? isTeacherOnDutyDay(opts.duty, opts.highlightTeacherId)
      : false,
  })
  if (mapped === "closed") return "closed"
  if (mapped === "mine") return "accent"
  return "info"
}

function dutyAriaLabel(
  day: RosterDay,
  duty: HomeworkDutyDay | undefined,
  teachers: readonly HomeworkTeacherRow[]
): string {
  if (!day.selectable || day.holidayLabel) {
    return `${day.key} 星期${day.weekdayChar}，${day.holidayLabel ? "放假" : "週末"}`
  }
  const lines = homeworkDutyRoomCards(duty).flatMap((c) =>
    c.assignments.map((a) => formatCalendarAssignmentLine(a, teachers))
  )
  if (lines.length === 0) return `${day.key} 星期${day.weekdayChar}，未排`
  return `${day.key} 星期${day.weekdayChar}，${lines.join("、")}`
}

/** 月視格內：每室一卡、同房交接以下箭顯示。 */
export function HomeworkDutyCalendarRoomCards({
  duty,
  teachers,
  showIdleLabels,
}: {
  duty: HomeworkDutyDay | undefined
  teachers: readonly HomeworkTeacherRow[]
  showIdleLabels: boolean
}) {
  const roomCards = homeworkDutyRoomCards(duty)
  if (roomCards.length === 0) {
    return <span className="text-muted-foreground">未排</span>
  }
  return (
    <>
      {roomCards.map((card) => (
        <div
          key={card.room}
          className="relative rounded-md border border-border bg-card px-1.5 pb-1.5 pt-5 shadow-sm"
        >
          <Tag
            size="sm"
            tone={card.room === "17D" ? "success" : "info"}
            className="absolute right-1 top-1 px-1.5 py-0 text-[9px] font-semibold leading-4"
          >
            {card.room}
          </Tag>
          {card.assignments.length > 0 ? (
            card.assignments.map((a, i) => (
              <div key={`${a.teacherId}-${a.start}-${i}`}>
                {i > 0 ? (
                  <div className="flex justify-start py-1 text-foreground" aria-label="交接">
                    <ArrowDown className="h-4 w-4 stroke-[2.5]" aria-hidden />
                  </div>
                ) : null}
                <p className="pr-8 text-[1.3em] font-bold leading-tight text-foreground">
                  {teacherName(a.teacherId, teachers)}
                </p>
                <p className="tabular-nums text-foreground/55">{formatAssignmentHours(a)}</p>
              </div>
            ))
          ) : (
            <p className="pr-8 text-muted-foreground">
              {showIdleLabels && duty ? homeworkDutyRoomIdleLabel(duty, card.room) : "—"}
            </p>
          )}
        </div>
      ))}
    </>
  )
}

export function HomeworkDutyMonthCalendar({
  yearMonth,
  holidays = [],
  dutyDays,
  teachers,
  highlightTeacherId,
  showIdleLabels = false,
  onSelectDutyDay,
  dayCaption,
}: {
  yearMonth: string
  holidays?: readonly HomeworkHoliday[]
  dutyDays: readonly HomeworkDutyDay[]
  teachers: readonly HomeworkTeacherRow[]
  /** 有值時，該老師當值日用 accent 底（老師「我的當值」） */
  highlightTeacherId?: string
  /** 已編更／已發布時，空房顯示暫時空缺或不啟用 */
  showIdleLabels?: boolean
  onSelectDutyDay?: (day: HomeworkDutyDay) => void
  dayCaption?: (day: HomeworkDutyDay) => ReactNode
}) {
  const monthHolidays = useMemo(
    () => holidaysInYearMonth(yearMonth, [...holidays]),
    [yearMonth, holidays]
  )
  const rosterDays = useMemo(
    () => listRosterMonthDays(yearMonth, monthHolidays),
    [yearMonth, monthHolidays]
  )
  const dutyByKey = useMemo(() => dutyDaysByMdKey(dutyDays), [dutyDays])

  return (
    <MonthCalendar
      days={rosterDays}
      getTone={(day) =>
        dutyTone({
          day,
          duty: dutyByKey.get(day.key),
          highlightTeacherId,
        })
      }
      getAriaLabel={(day) => dutyAriaLabel(day, dutyByKey.get(day.key), teachers)}
      isDayInteractive={(day) =>
        Boolean(onSelectDutyDay) && day.selectable && !day.holidayLabel
      }
      onDayClick={
        onSelectDutyDay
          ? (day) => {
              onSelectDutyDay(dutyByKey.get(day.key) ?? emptyDutyFromRosterDay(day))
            }
          : undefined
      }
      renderBody={(day) => {
        const duty = dutyByKey.get(day.key)
        if (day.holidayLabel) return <span>放假</span>
        if (!day.selectable) return <span>週末</span>
        return (
          <>
            {duty && dayCaption ? dayCaption(duty) : null}
            <HomeworkDutyCalendarRoomCards
              duty={duty}
              teachers={teachers}
              showIdleLabels={showIdleLabels}
            />
          </>
        )
      }}
    />
  )
}
