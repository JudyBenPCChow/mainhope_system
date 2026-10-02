import { useMemo, type ReactNode } from "react"
import { Tag } from "@/components/ui/tag"
import {
  MonthCalendar,
  type MonthCalendarTone,
} from "@/components/ui/month-calendar"
import {
  HOMEWORK_DIVISION_LABEL,
  dutyAssignments,
  emptyDutyFromRosterDay,
  formatAssignmentHours,
  formatCalendarAssignmentLine,
  holidaysInYearMonth,
  homeworkDutyRoomCards,
  homeworkDutyRoomIdleLabel,
  isTeacherOnDutyDay,
  listRosterMonthDays,
  myDutyCalendarTone,
  openedHomeworkRoomNames,
  teacherName,
  dutyDaysByMdKey,
  type HomeworkDivision,
  type HomeworkDutyDay,
  type HomeworkHoliday,
  type HomeworkTeacherRow,
  type RosterDay,
} from "@/lib/homeworkTutoringUi"

/** 月工作表月曆：每學部一行卡（中學部／小學部各自課室與當值） */
export type HomeworkCalendarDivisionLane = {
  division: HomeworkDivision
  dutyDays: readonly HomeworkDutyDay[]
  defaultRoom: string
  emptyLabel: string
  countOf?: (day: HomeworkDutyDay) => number
  onSelect?: (day: HomeworkDutyDay) => void
  selectLabel?: (day: HomeworkDutyDay) => string
}

function HomeworkDutyCalendarDivisionCard({
  lane,
  duty,
  teachers,
}: {
  lane: HomeworkCalendarDivisionLane
  duty: HomeworkDutyDay
  teachers: readonly HomeworkTeacherRow[]
}) {
  const rooms = openedHomeworkRoomNames(duty)
  const people = dutyAssignments(duty)
  const count = lane.countOf?.(duty)
  const body = (
    <>
      <span className="absolute left-1.5 top-1 text-[10px] font-semibold text-foreground/70">
        {HOMEWORK_DIVISION_LABEL[lane.division]}
        {count != null ? ` · ${count} 人` : ""}
      </span>
      <Tag
        size="sm"
        tone={lane.division === "secondary" ? "success" : "info"}
        className="absolute right-1 top-1 px-1.5 py-0 text-[9px] font-semibold leading-4"
      >
        {rooms.join("／")}
      </Tag>
      {people.length > 0 ? (
        people.map((a, i) => (
          <div key={`${a.teacherId}-${a.start}-${i}`} className={i > 0 ? "mt-1.5" : undefined}>
            <p className="text-[1.3em] font-bold leading-tight text-foreground">
              {teacherName(a.teacherId, teachers)}
            </p>
            <p className="tabular-nums text-foreground/55">
              {formatAssignmentHours(a)}
              {rooms.length > 1 ? ` · ${a.room}` : ""}
            </p>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">{lane.emptyLabel}</p>
      )}
    </>
  )
  const chrome =
    "relative block w-full rounded-md border border-border bg-card px-1.5 pb-1.5 pt-5 text-left shadow-sm"
  if (!lane.onSelect) return <div className={chrome}>{body}</div>
  return (
    <button
      type="button"
      className={`${chrome} transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      aria-label={lane.selectLabel?.(duty)}
      title={lane.selectLabel?.(duty)}
      onClick={() => lane.onSelect?.(duty)}
    >
      {body}
    </button>
  )
}

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

/** 月視格內：每室一卡、同房多人按開始時間排。 */
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
              <div key={`${a.teacherId}-${a.start}-${i}`} className={i > 0 ? "mt-1.5" : undefined}>
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
  lanes,
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
  /** 有值時每日按學部分卡（各卡自行處理點擊），取代按課室分卡 */
  lanes?: readonly HomeworkCalendarDivisionLane[]
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
  const laneMaps = useMemo(
    () => (lanes ?? []).map((lane) => ({ lane, byKey: dutyDaysByMdKey(lane.dutyDays) })),
    [lanes]
  )

  if (lanes && lanes.length > 0) {
    return (
      <MonthCalendar
        days={rosterDays}
        getTone={(day) => dutyTone({ day, duty: dutyByKey.get(day.key), highlightTeacherId })}
        getAriaLabel={(day) => dutyAriaLabel(day, dutyByKey.get(day.key), teachers)}
        renderBody={(day) => {
          if (day.holidayLabel) return <span>放假</span>
          if (!day.selectable) return <span>週末</span>
          return (
            <>
              {laneMaps.map(({ lane, byKey }) => (
                <HomeworkDutyCalendarDivisionCard
                  key={lane.division}
                  lane={lane}
                  duty={byKey.get(day.key) ?? emptyDutyFromRosterDay(day, { roomA: lane.defaultRoom })}
                  teachers={teachers}
                />
              ))}
            </>
          )
        }}
      />
    )
  }

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
