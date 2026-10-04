import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toDutyMdKey } from "@/lib/homeworkTutoringSchedules"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"

import {
  HomeworkDutyMonthCalendar,
  type HomeworkCalendarDivisionLane,
} from "./HomeworkDutyMonthCalendar"
import {
  HOMEWORK_DIVISION_LABEL,
  HOMEWORK_DIVISION_ORDER,
  homeworkDefaultRoomA,
  homeworkDefaultRoomB,
  WEEKDAY_OPTIONS,
  assignedTeacherIds,
  buildMonthDutyDays,
  closeSecondHomeworkRoom,
  crossDivisionDutyClashes,
  defaultRoomForNextAssignment,
  dutyAssignments,
  dutyDaysByMdKey,
  dutyKeyMonth,
  formatAvailLabel,
  formatAssignmentLine,
  formatYearMonthLabel,
  getAvailEntry,
  holidaysInYearMonth,
  isSecondRoomOpen,
  makeAssignmentFromAvail,
  openSecondHomeworkRoom,
  openedHomeworkRoomNames,
  roomBLabel,
  studentsComingOnWeekday,
  shiftYearMonth,
  substituteTeachers,
  teacherName,
  teachersAvailableOnDay,
  withSyncedLegacyTeachers,
  type AllTeacherAvailability,
  type HomeworkCompanionRoster,
  type HomeworkDivision,
  type HomeworkDutyAssignment,
  type HomeworkDutyDay,
  type HomeworkHoliday,
  type HomeworkStudentRow,
  type HomeworkTeacherRow,
  type MonthRosterState,
  type Weekday,
} from "@/lib/homeworkTutoringUi"

type SheetView = "list" | "calendar"

const MONTH_MIN = "2026-07"
const MONTH_MAX = "2027-06"

function clampMonth(yearMonth: string): string {
  if (yearMonth < MONTH_MIN) return MONTH_MIN
  if (yearMonth > MONTH_MAX) return MONTH_MAX
  return yearMonth
}

function assignmentInvalid(a: HomeworkDutyAssignment): boolean {
  return !a.start || !a.end || a.start >= a.end
}

function DutyPeopleLines({
  day,
  teachers,
  published,
}: {
  day: HomeworkDutyDay
  teachers: readonly HomeworkTeacherRow[]
  published: boolean
}) {
  const list = dutyAssignments(day)
  if (list.length === 0) {
    return (
      <span className={published ? "text-warning" : "text-muted-foreground"}>
        {published ? "暫時空缺" : "—"}
      </span>
    )
  }
  return (
    <span className="block space-y-0.5">
      {list.map((a, i) => (
        <span key={`${a.teacherId}-${a.room}-${i}`} className="block tabular-nums">
          {formatAssignmentLine(a, teachers)}
        </span>
      ))}
    </span>
  )
}

function DutyCellButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="-mx-2 -my-1 block w-[calc(100%+1rem)] rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}

export function RosterMonthSheet({
  yearMonth,
  onYearMonthChange,
  dutyDays,
  onDutyDaysChange,
  monthStatus,
  onMonthStatusChange,
  avail,
  teachers = [],
  holidays = [],
  students = [],
  division = "secondary",
  companion = null,
  onEditCompanionDay,
  initialEditDate = null,
  onInitialEditHandled,
  onPublish,
}: {
  yearMonth: string
  onYearMonthChange: (yearMonth: string) => void
  dutyDays: HomeworkDutyDay[]
  onDutyDaysChange: Dispatch<SetStateAction<HomeworkDutyDay[]>>
  monthStatus: Record<string, MonthRosterState>
  onMonthStatusChange: (yearMonth: string, state: MonthRosterState) => void | Promise<void>
  avail: AllTeacherAvailability
  teachers?: readonly HomeworkTeacherRow[]
  holidays?: HomeworkHoliday[]
  students?: readonly HomeworkStudentRow[]
  division?: HomeworkDivision
  /** 另一學部同月資料；本頁只顯示，修改須切換學部 */
  companion?: HomeworkCompanionRoster | null
  /** 點對照學部當值格：切換學部後開該日編輯 */
  onEditCompanionDay?: (date: string) => void
  /** 載入後自動開啟編輯的日期（M/D） */
  initialEditDate?: string | null
  onInitialEditHandled?: () => void
  /** 確定編更／已編更後改派：持久化＋寫 schedules 佔室 */
  onPublish?: (yearMonth: string, monthDays: HomeworkDutyDay[]) => Promise<void>
}) {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const [view, setView] = useState<SheetView>("list")
  const [editDay, setEditDay] = useState<HomeworkDutyDay | null>(null)
  const [addTeacherId, setAddTeacherId] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const published = (monthStatus[yearMonth] ?? "未編更") === "已編更"
  const roomA = homeworkDefaultRoomA(division)
  const roomB = homeworkDefaultRoomB(division)

  const monthHolidays = useMemo(
    () => holidaysInYearMonth(yearMonth, holidays),
    [yearMonth, holidays]
  )

  const monthDays = useMemo(
    () =>
      buildMonthDutyDays(yearMonth, dutyDays, monthHolidays, { division, roomA }).map(
        withSyncedLegacyTeachers
      ),
    [yearMonth, dutyDays, monthHolidays, division, roomA]
  )

  const upsertDay = (next: HomeworkDutyDay) => {
    const synced = withSyncedLegacyTeachers(next)
    const key = toDutyMdKey(synced.date)
    onDutyDaysChange((prev) =>
      prev.some((d) => toDutyMdKey(d.date) === key)
        ? prev.map((d) => (toDutyMdKey(d.date) === key ? synced : d))
        : [...prev, synced]
    )
    setDirty(true)
  }

  const goMonth = (delta: number) => {
    setDirty(false)
    onYearMonthChange(clampMonth(shiftYearMonth(yearMonth, delta)))
  }

  const weekdayOf = (day: HomeworkDutyDay): Weekday | null =>
    WEEKDAY_OPTIONS.includes(day.weekday as Weekday) ? (day.weekday as Weekday) : null

  const expectedCount = (day: HomeworkDutyDay): number =>
    studentsComingOnWeekday([...students], weekdayOf(day)).length

  const activeLabel = HOMEWORK_DIVISION_LABEL[division]
  const companionLabel = companion ? HOMEWORK_DIVISION_LABEL[companion.division] : ""
  const companionPublished = companion?.status === "已編更"
  const companionByKey = useMemo(() => {
    if (!companion || companion.yearMonth !== yearMonth) return null
    const days = buildMonthDutyDays(yearMonth, companion.dutyDays, monthHolidays, {
      division: companion.division,
      roomA: companion.classroomName ?? homeworkDefaultRoomA(companion.division),
    }).map(withSyncedLegacyTeachers)
    return dutyDaysByMdKey(days)
  }, [companion, yearMonth, monthHolidays])

  const companionDayOf = (day: HomeworkDutyDay): HomeworkDutyDay | null =>
    companionByKey?.get(toDutyMdKey(day.date) ?? "") ?? null

  const companionCount = (day: HomeworkDutyDay): number =>
    companion ? studentsComingOnWeekday(companion.students, weekdayOf(day)).length : 0

  const companionAssignmentOf = (day: HomeworkDutyDay, teacherId: string) =>
    dutyAssignments(companionDayOf(day)).filter((a) => a.teacherId === teacherId)

  const divisionGroups = HOMEWORK_DIVISION_ORDER.filter(
    (d) => d === division || (companion != null && d === companion.division)
  )

  const openSecondAllWeekdays = () => {
    const monthNum = Number(yearMonth.split("-")[1])
    const updated = monthDays.map((d) =>
      d.holiday || isSecondRoomOpen(d) ? d : openSecondHomeworkRoom(d, roomB)
    )
    onDutyDaysChange((prev) => {
      const others = prev.filter((d) => dutyKeyMonth(d.date) !== monthNum)
      return [...others, ...updated]
    })
    setDirty(true)
    pushBanner({
      title: "已加開第二課室",
      tone: "success",
      message: `${activeLabel}本月平日已加開 ${roomB}。請再派導師，然後儲存以寫入佔室。`,
    })
  }

  const saveMonth = async () => {
    const monthLabel = formatYearMonthLabel(yearMonth)
    const ok = await confirmDialog(
      published
        ? {
            title: `儲存${activeLabel}當值變更？`,
            description: `${activeLabel} ${monthLabel} 將更新當值老師，並重寫課室佔用（15:15 起）。`,
            confirmText: "儲存變更",
            cancelText: "取消",
            tone: "warning",
          }
        : {
            title: `確定${activeLabel}本月編更？`,
            description: `${activeLabel} ${monthLabel} 儲存後即確定編更，並寫入課室佔用（15:15 起）。未派人的日子會顯示暫時空缺。`,
            confirmText: "確定編更",
            cancelText: "取消",
            tone: "warning",
          }
    )
    if (ok !== true) return
    setSaving(true)
    setSaveError(null)
    try {
      if (!onPublish) {
        throw new Error("無法儲存編更：未接上寫入。請重新整理頁面後再試。")
      }
      await onPublish(yearMonth, monthDays)
      const monthNum = Number(yearMonth.split("-")[1])
      onDutyDaysChange((prev) => {
        const others = prev.filter((d) => dutyKeyMonth(d.date) !== monthNum)
        return [...others, ...monthDays]
      })
      await onMonthStatusChange(yearMonth, "已編更")
      setDirty(false)
      pushBanner({
        title: "已儲存",
        tone: "success",
        message: published
          ? `${activeLabel} ${monthLabel} 當值已更新，課室佔用已寫入排程。`
          : `${activeLabel} ${monthLabel} 編更已確定，課室佔用已寫入排程。`,
      })
    } catch (err) {
      const message = formatUnknownError(err)
      reportUserFacingError(err, {
        source: "RosterMonthSheet.saveMonth",
        setErr: setSaveError,
        userMessage: message,
      })
      pushBanner({
        title: "儲存失敗",
        tone: "error",
        message,
      })
    } finally {
      setSaving(false)
    }
  }

  const addOptions = (day: HomeworkDutyDay) => {
    const assigned = new Set(assignedTeacherIds(day))
    const reported = teachersAvailableOnDay(avail, day.date, teachers).filter(
      (t) => !assigned.has(t.id)
    )
    const reportedIds = new Set(reported.map((t) => t.id))
    const unreported = teachers.filter((t) => !assigned.has(t.id) && !reportedIds.has(t.id))
    return { reported, unreported }
  }

  const addOptionLabel = (day: HomeworkDutyDay, t: HomeworkTeacherRow, reported: boolean) => {
    const elsewhere = companionAssignmentOf(day, t.id)
    const base = reported
      ? `${t.name}（${formatAvailLabel(getAvailEntry(avail, t.id, day.date))}）`
      : `${t.name}（未報更）`
    return elsewhere.length > 0
      ? `${base}｜已在${companionLabel} ${elsewhere.map((a) => `${a.start}–${a.end}`).join("、")}`
      : base
  }

  const reportedLine = (day: HomeworkDutyDay) => {
    const submitted = teachersAvailableOnDay(avail, day.date, teachers)
    if (submitted.length === 0) return published ? "—" : "當日未有報更"
    return submitted
      .map((t) => `${t.name}（${formatAvailLabel(getAvailEntry(avail, t.id, day.date))}）`)
      .join("、")
  }

  const openEdit = (day: HomeworkDutyDay) => {
    setEditDay(withSyncedLegacyTeachers(day))
    setAddTeacherId("")
  }

  useEffect(() => {
    if (!initialEditDate) return
    const want = toDutyMdKey(initialEditDate)
    const target = monthDays.find((d) => toDutyMdKey(d.date) === want)
    if (target && !target.holiday) openEdit(target)
    onInitialEditHandled?.()
  }, [initialEditDate, monthDays, onInitialEditHandled])

  const editCompanionDay = async (day: HomeworkDutyDay) => {
    if (!onEditCompanionDay) return
    if (dirty) {
      const ok = await confirmDialog({
        title: `切換到${companionLabel}？`,
        description: `本頁${activeLabel}有未儲存的改動，切換後會消失。`,
        confirmText: "切換",
        cancelText: "留在本頁",
        tone: "warning",
      })
      if (ok !== true) return
    }
    onEditCompanionDay(day.date)
  }

  const activeLane: HomeworkCalendarDivisionLane = {
    division,
    dutyDays: monthDays,
    defaultRoom: roomA,
    emptyLabel: published ? "暫時空缺" : "—",
    countOf: expectedCount,
    onSelect: openEdit,
    selectLabel: (d) => `修改${activeLabel} ${d.date} 當值`,
  }
  const companionLane: HomeworkCalendarDivisionLane | null =
    companion && companionByKey
      ? {
          division: companion.division,
          dutyDays: [...companionByKey.values()],
          defaultRoom: companion.classroomName ?? homeworkDefaultRoomA(companion.division),
          emptyLabel: companionPublished ? "暫時空缺" : "未編更",
          countOf: companionCount,
          onSelect: onEditCompanionDay ? (d) => void editCompanionDay(d) : undefined,
          selectLabel: (d) => `切換到${companionLabel}並修改 ${d.date} 當值`,
        }
      : null
  const calendarLanes = [activeLane, ...(companionLane ? [companionLane] : [])].sort(
    (a, b) => HOMEWORK_DIVISION_ORDER.indexOf(a.division) - HOMEWORK_DIVISION_ORDER.indexOf(b.division)
  )

  const editAssignments = editDay ? dutyAssignments(editDay) : []
  const editInvalid = editAssignments.some(assignmentInvalid)
  const roomChoices = editDay ? openedHomeworkRoomNames(editDay) : []

  const patchEditAssignment = (index: number, patch: Partial<HomeworkDutyAssignment>) => {
    if (!editDay) return
    const next = dutyAssignments(editDay).map((a, i) => (i === index ? { ...a, ...patch } : a))
    setEditDay({ ...editDay, assignments: next })
  }

  const removeEditAssignment = (index: number) => {
    if (!editDay) return
    setEditDay({
      ...editDay,
      assignments: dutyAssignments(editDay).filter((_, i) => i !== index),
    })
  }

  const addEditAssignment = (teacherId: string) => {
    if (!editDay || !teacherId) return
    const entry = getAvailEntry(avail, teacherId, editDay.date)
    const room = defaultRoomForNextAssignment(editDay)
    setEditDay({
      ...editDay,
      assignments: [...dutyAssignments(editDay), makeAssignmentFromAvail(teacherId, entry, room)],
    })
    setAddTeacherId("")
  }

  return (
    <Tabs
      value={view}
      onValueChange={(v) => {
        if (v === "list" || v === "calendar") setView(v)
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={yearMonth <= MONTH_MIN}
          onClick={() => goMonth(-1)}
          aria-label="上一個月"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="min-w-[7.5rem] text-center text-base font-semibold tabular-nums">
          {formatYearMonthLabel(yearMonth)}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={yearMonth >= MONTH_MAX}
          onClick={() => goMonth(1)}
          aria-label="下一個月"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Tag tone={statusToTagTone(published ? "已編更" : "未編更")} size="sm">
          {activeLabel}{published ? "已編更" : "未編更"}
        </Tag>
        {companion ? (
          <Tag tone={statusToTagTone(companionPublished ? "已編更" : "未編更")} size="sm">
            {companionLabel}{companionPublished ? "已編更" : "未編更"}
          </Tag>
        ) : null}
        <TabsList className="ml-auto w-full justify-start sm:w-auto">
          <TabsTrigger value="list">列表</TabsTrigger>
          <TabsTrigger value="calendar">月曆</TabsTrigger>
        </TabsList>
      </div>

      <p className="text-xs text-muted-foreground">
        正在編輯 <span className="font-medium text-foreground">{activeLabel}</span>
        {published
          ? `：已確定的當值清單。預設一間課室（${roomA}）；人數多或當日需要先加開第二間。改派後請按「儲存變更」寫入課室佔用。`
          : `：未編更，預設一間課室（${roomA}）。儲存後即確定本月編更，並只佔已開的房。`}
        {`按當值老師一格即可修改${
          companion ? `；按${companionLabel}一格會先切換到${companionLabel}` : ""
        }。`}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          loading={saving}
          loadingText="儲存中…"
          onClick={() => void saveMonth()}
        >
          {published ? `儲存${activeLabel}變更` : `儲存${activeLabel}`}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={openSecondAllWeekdays}>
          {activeLabel}本月平日加開 {roomB}
        </Button>
      </div>
      {saveError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {saveError}
        </div>
      ) : null}

      <TabsContent value="list" className="mt-0">
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table
            className={`w-full text-left text-sm ${divisionGroups.length > 1 ? "min-w-[1040px]" : "min-w-[640px]"}`}
          >
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th rowSpan={2} className="px-3 py-2 align-bottom font-medium">
                  日期
                </th>
                {divisionGroups.map((g) => (
                  <th
                    key={g}
                    colSpan={3}
                    className={`border-l border-border px-3 pt-2 pb-1 font-semibold ${
                      g === division ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {HOMEWORK_DIVISION_LABEL[g]}
                    <span className="ml-2 font-normal">
                      {g === division ? "（編輯中）" : "（對照）"}
                    </span>
                  </th>
                ))}
                <th rowSpan={2} className="border-l border-border px-3 py-2 align-bottom font-medium">
                  {published ? "可頂替" : "已報更"}
                </th>
                <th rowSpan={2} className="px-3 py-2 align-bottom font-medium">
                  操作
                </th>
              </tr>
              <tr>
                {divisionGroups.map((g) => (
                  <Fragment key={g}>
                    <th
                      className={`border-l border-border px-3 pb-2 font-medium ${g === division ? "bg-primary/10" : ""}`}
                    >
                      到校人數
                    </th>
                    <th className={`px-3 pb-2 font-medium ${g === division ? "bg-primary/10" : ""}`}>課室</th>
                    <th className={`px-3 pb-2 font-medium ${g === division ? "bg-primary/10" : ""}`}>
                      當值老師
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthDays.map((d) => {
                const other = companionDayOf(d)
                const subs = substituteTeachers(
                  avail,
                  d.date,
                  [...assignedTeacherIds(d), ...assignedTeacherIds(other)],
                  teachers
                )
                const clashes = crossDivisionDutyClashes(d, other)
                return (
                  <tr key={d.date} className="border-t border-border">
                    <td className="px-3 py-2.5 tabular-nums">
                      {d.date}（{d.weekday}）
                      {d.holiday ? (
                        <Tag tone={statusToTagTone("功輔放假")} size="sm" className="ml-2">
                          功輔放假
                        </Tag>
                      ) : null}
                    </td>
                    {divisionGroups.map((g) =>
                      g === division ? (
                        <Fragment key={g}>
                          <td className="border-l border-border bg-primary/5 px-3 py-2.5 tabular-nums">
                            {d.holiday ? "—" : `${expectedCount(d)} 人`}
                          </td>
                          <td className="bg-primary/5 px-3 py-2.5">
                            {d.holiday ? (
                              "—"
                            ) : (
                              <>
                                {openedHomeworkRoomNames(d).join("／")}
                                {clashes.sharedRooms.length > 0 ? (
                                  <p className="mt-0.5 text-xs text-warning">
                                    與{companionLabel}同用 {clashes.sharedRooms.join("／")}
                                  </p>
                                ) : null}
                              </>
                            )}
                          </td>
                          <td className="bg-primary/5 px-3 py-2.5">
                            {d.holiday ? (
                              "—"
                            ) : (
                              <>
                                <DutyCellButton
                                  label={`修改${activeLabel} ${d.date} 當值`}
                                  onClick={() => openEdit(d)}
                                >
                                  <DutyPeopleLines day={d} teachers={teachers} published={published} />
                                </DutyCellButton>
                                {clashes.overlappingTeacherIds.length > 0 ? (
                                  <p className="mt-0.5 text-xs text-warning">
                                    {clashes.overlappingTeacherIds
                                      .map((id) => teacherName(id, teachers))
                                      .join("、")}
                                    同時段已在{companionLabel}當值
                                  </p>
                                ) : null}
                              </>
                            )}
                          </td>
                        </Fragment>
                      ) : (
                        <Fragment key={g}>
                          <td className="border-l border-border px-3 py-2.5 tabular-nums text-muted-foreground">
                            {d.holiday || !other ? "—" : `${companionCount(d)} 人`}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {d.holiday || !other ? "—" : openedHomeworkRoomNames(other).join("／")}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {d.holiday || !other ? (
                              "—"
                            ) : onEditCompanionDay ? (
                              <DutyCellButton
                                label={`切換到${companionLabel}並修改 ${d.date} 當值`}
                                onClick={() => void editCompanionDay(d)}
                              >
                                {companionPublished ? (
                                  <DutyPeopleLines day={other} teachers={teachers} published />
                                ) : (
                                  "未編更"
                                )}
                              </DutyCellButton>
                            ) : companionPublished ? (
                              <DutyPeopleLines day={other} teachers={teachers} published />
                            ) : (
                              "未編更"
                            )}
                          </td>
                        </Fragment>
                      )
                    )}
                    <td className="border-l border-border px-3 py-2.5 text-muted-foreground">
                      {d.holiday
                        ? "—"
                        : published
                          ? subs.length > 0
                            ? subs
                                .map(
                                  (t) =>
                                    `${t.name}（${formatAvailLabel(getAvailEntry(avail, t.id, d.date))}）`
                                )
                                .join("、")
                            : "—"
                          : reportedLine(d)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={Boolean(d.holiday)}
                        onClick={() => openEdit(d)}
                      >
                        改{companion ? activeLabel : ""}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </TabsContent>
      <TabsContent value="calendar" className="mt-0">
        <HomeworkDutyMonthCalendar
          yearMonth={yearMonth}
          holidays={holidays}
          dutyDays={monthDays}
          teachers={teachers}
          showIdleLabels={published}
          lanes={calendarLanes}
        />
      </TabsContent>

      <Dialog
        open={Boolean(editDay)}
        onOpenChange={(o) => {
          if (!o) {
            setEditDay(null)
            setAddTeacherId("")
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              編輯{activeLabel}當值 — {editDay?.date}
            </DialogTitle>
            {editDay ? (
              <p className="text-sm text-muted-foreground">
                時段默認跟報更，可改。可排多於一位；唔使全日都有人。預設一間課室；人數多先加開第二間。
              </p>
            ) : null}
          </DialogHeader>
          {editDay ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{reportedLine(editDay)}</p>
              <p className="text-sm">
                {activeLabel}當日約 {expectedCount(editDay)} 人到校
                <span className="text-muted-foreground">（跟慣常到校星期；唔會自動加開）</span>
              </p>
              {companion && companionDayOf(editDay) ? (
                <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {companionLabel}對照：約 {companionCount(editDay)} 人；課室{" "}
                  {openedHomeworkRoomNames(companionDayOf(editDay)!).join("／")}；當值{" "}
                  {companionPublished
                    ? dutyAssignments(companionDayOf(editDay))
                        .map((a) => formatAssignmentLine(a, teachers))
                        .join("、") || "暫時空缺"
                    : "未編更"}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  已開：{openedHomeworkRoomNames(editDay).join("／")}
                </span>
                {isSecondRoomOpen(editDay) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditDay(closeSecondHomeworkRoom(editDay))}
                  >
                    收起 {roomBLabel(editDay)}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditDay(openSecondHomeworkRoom(editDay, roomB))}
                  >
                    加開 {roomB}
                  </Button>
                )}
              </div>
              {editAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">尚未排任何人。</p>
              ) : (
                <ul className="space-y-3">
                  {editAssignments.map((a, i) => (
                    <li
                      key={`${a.teacherId}-${a.room}-${i}`}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{teacherName(a.teacherId, teachers)}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEditAssignment(i)}
                        >
                          移除
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          <span>開始</span>
                          <Input
                            type="time"
                            value={a.start}
                            onChange={(e) => patchEditAssignment(i, { start: e.target.value })}
                            className="h-11 tabular-nums"
                          />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          <span>結束</span>
                          <Input
                            type="time"
                            value={a.end}
                            onChange={(e) => patchEditAssignment(i, { end: e.target.value })}
                            className="h-11 tabular-nums"
                          />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          <span>課室</span>
                          <Select
                            value={a.room}
                            onChange={(e) => patchEditAssignment(i, { room: e.target.value })}
                          >
                            {roomChoices.map((room) => (
                              <option key={room} value={room}>
                                {room}
                              </option>
                            ))}
                          </Select>
                        </label>
                      </div>
                      {assignmentInvalid(a) ? (
                        <p role="alert" className="mt-2 text-xs text-destructive">
                          結束時間須晚於開始時間。
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>加入老師</span>
                <Select
                  value={addTeacherId}
                  onChange={(e) => addEditAssignment(e.target.value)}
                >
                  <option value="">選擇同事</option>
                  {(() => {
                    const { reported, unreported } = addOptions(editDay)
                    return [
                      reported.length > 0 ? (
                        <optgroup key="reported" label="已報更">
                          {reported.map((t) => (
                            <option key={t.id} value={t.id}>
                              {addOptionLabel(editDay, t, true)}
                            </option>
                          ))}
                        </optgroup>
                      ) : null,
                      unreported.length > 0 ? (
                        <optgroup key="unreported" label="未報更（預設全節，可改）">
                          {unreported.map((t) => (
                            <option key={t.id} value={t.id}>
                              {addOptionLabel(editDay, t, false)}
                            </option>
                          ))}
                        </optgroup>
                      ) : null,
                    ]
                  })()}
                </Select>
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditDay(null)
                setAddTeacherId("")
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={editInvalid}
              onClick={() => {
                if (!editDay || editInvalid) return
                upsertDay(editDay)
                setEditDay(null)
                setAddTeacherId("")
                pushBanner({
                  title: "已更新本頁",
                  tone: "success",
                  message: published
                    ? "當值已改在本頁。請按「儲存變更」寫入課室佔用。"
                    : "當值已改在本頁。請按「儲存」確定本月編更。",
                })
              }}
            >
              更新本頁
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
