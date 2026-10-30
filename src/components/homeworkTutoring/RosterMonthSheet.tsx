import {
  Fragment,
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
  findDutyDay,
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

function upsertDutyDay(prev: HomeworkDutyDay[], next: HomeworkDutyDay): HomeworkDutyDay[] {
  const synced = withSyncedLegacyTeachers(next)
  const key = toDutyMdKey(synced.date)
  return prev.some((d) => toDutyMdKey(d.date) === key)
    ? prev.map((d) => (toDutyMdKey(d.date) === key ? synced : d))
    : [...prev, synced]
}

function replaceMonthDutyDays(
  prev: HomeworkDutyDay[],
  yearMonth: string,
  monthDays: HomeworkDutyDay[]
): HomeworkDutyDay[] {
  const monthNum = Number(yearMonth.split("-")[1])
  const others = prev.filter((d) => dutyKeyMonth(d.date) !== monthNum)
  return [...others, ...monthDays]
}

type RosterSide = {
  division: HomeworkDivision
  label: string
  published: boolean
  roomA: string
  roomB: string
  monthDays: HomeworkDutyDay[]
  students: readonly HomeworkStudentRow[]
  editable: boolean
  /** 儲存後沿用本頁學部的編更狀態回呼 */
  ownsMonthStatus: boolean
  onDutyDaysChange?: Dispatch<SetStateAction<HomeworkDutyDay[]>>
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
  onCompanionDutyDaysChange,
  onPublishCompanion,
  dirtyDivisions: dirtyDivisionsProp,
  onDirtyDivisionsChange,
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
  /** 另一學部同月資料；有寫入回呼時可在本頁直接修改 */
  companion?: HomeworkCompanionRoster | null
  onCompanionDutyDaysChange?: Dispatch<SetStateAction<HomeworkDutyDay[]>>
  /** 儲存另一學部本月編更（寫入該學部課室佔用） */
  onPublishCompanion?: (yearMonth: string, monthDays: HomeworkDutyDay[]) => Promise<void>
  /** 未儲存學部；放在外層，離開月工作表再返回仍看得到 */
  dirtyDivisions?: readonly HomeworkDivision[]
  onDirtyDivisionsChange?: (next: HomeworkDivision[]) => void
  /** 確定編更／已編更後改派：持久化＋寫 schedules 佔室 */
  onPublish?: (yearMonth: string, monthDays: HomeworkDutyDay[]) => Promise<void>
}) {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const [view, setView] = useState<SheetView>("list")
  const [editTarget, setEditTarget] = useState<{
    division: HomeworkDivision
    day: HomeworkDutyDay
  } | null>(null)
  const [addTeacherId, setAddTeacherId] = useState("")
  const [savingDivision, setSavingDivision] = useState<HomeworkDivision | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [localDirtyDivisions, setLocalDirtyDivisions] = useState<HomeworkDivision[]>([])
  const dirtyList = dirtyDivisionsProp ?? localDirtyDivisions
  const setDirtyList = onDirtyDivisionsChange ?? setLocalDirtyDivisions
  const dirtyDivisions = useMemo(() => new Set(dirtyList), [dirtyList])
  const published = (monthStatus[yearMonth] ?? "未編更") === "已編更"
  const roomA = homeworkDefaultRoomA(division)
  const roomB = homeworkDefaultRoomB(division)
  const editDay = editTarget?.day ?? null

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

  const markDirty = (target: HomeworkDivision) => {
    if (dirtyDivisions.has(target)) return
    setDirtyList([...dirtyList, target])
  }

  const clearDirty = (target: HomeworkDivision) => {
    if (!dirtyDivisions.has(target)) return
    setDirtyList(dirtyList.filter((item) => item !== target))
  }

  const goMonth = async (delta: number) => {
    const next = clampMonth(shiftYearMonth(yearMonth, delta))
    if (next === yearMonth || savingDivision) return
    if (dirtyDivisions.size > 0) {
      const ok = await confirmDialog({
        title: "更換月份？",
        description: "本頁有未儲存的編更，更換月份後會消失。",
        confirmText: "更換",
        cancelText: "留在本月",
        tone: "warning",
      })
      if (ok !== true) return
    }
    setDirtyList([])
    onYearMonthChange(next)
  }

  const weekdayOf = (day: HomeworkDutyDay): Weekday | null =>
    WEEKDAY_OPTIONS.includes(day.weekday as Weekday) ? (day.weekday as Weekday) : null

  const activeLabel = HOMEWORK_DIVISION_LABEL[division]
  const companionByKey = useMemo(() => {
    if (!companion || companion.yearMonth !== yearMonth) return null
    const days = buildMonthDutyDays(yearMonth, companion.dutyDays, monthHolidays, {
      division: companion.division,
      roomA: companion.classroomName ?? homeworkDefaultRoomA(companion.division),
    }).map(withSyncedLegacyTeachers)
    return dutyDaysByMdKey(days)
  }, [companion, yearMonth, monthHolidays])

  const countStudents = (list: readonly HomeworkStudentRow[], day: HomeworkDutyDay): number =>
    studentsComingOnWeekday([...list], weekdayOf(day)).length

  const activeSide: RosterSide = {
    division,
    label: activeLabel,
    published,
    roomA,
    roomB,
    monthDays,
    students,
    editable: true,
    ownsMonthStatus: true,
    onDutyDaysChange,
  }
  const companionSide: RosterSide | null =
    companion && companionByKey
      ? {
          division: companion.division,
          label: HOMEWORK_DIVISION_LABEL[companion.division],
          published: companion.status === "已編更",
          roomA: companion.classroomName ?? homeworkDefaultRoomA(companion.division),
          roomB: homeworkDefaultRoomB(companion.division),
          monthDays: [...companionByKey.values()],
          students: companion.students,
          editable: Boolean(onCompanionDutyDaysChange && onPublishCompanion),
          ownsMonthStatus: false,
          onDutyDaysChange: onCompanionDutyDaysChange,
        }
      : null
  const editors = [activeSide, ...(companionSide ? [companionSide] : [])].sort(
    (a, b) => HOMEWORK_DIVISION_ORDER.indexOf(a.division) - HOMEWORK_DIVISION_ORDER.indexOf(b.division)
  )
  const bothEditable = editors.filter((side) => side.editable).length > 1

  const sideByDivision = (target: HomeworkDivision): RosterSide | null =>
    editors.find((side) => side.division === target) ?? null

  const otherSideOf = (target: HomeworkDivision): RosterSide | null =>
    editors.find((side) => side.division !== target) ?? null

  const openSecondAllWeekdays = (side: RosterSide) => {
    if (!side.editable || !side.onDutyDaysChange || savingDivision === side.division) return
    const updated = side.monthDays.map((d) =>
      d.holiday || isSecondRoomOpen(d) ? d : openSecondHomeworkRoom(d, side.roomB)
    )
    side.onDutyDaysChange((prev) => replaceMonthDutyDays(prev, yearMonth, updated))
    markDirty(side.division)
    pushBanner({
      title: "已加開第二課室",
      tone: "success",
      message: `${side.label}本月平日已加開 ${side.roomB}。請再派導師，然後儲存以寫入佔室。`,
    })
  }

  const saveSide = async (side: RosterSide) => {
    if (!side.editable || savingDivision) return
    const monthLabel = formatYearMonthLabel(yearMonth)
    const ok = await confirmDialog(
      side.published
        ? {
            title: `儲存${side.label}當值變更？`,
            description: `${side.label} ${monthLabel} 將更新當值老師，並重寫課室佔用（15:15 起）。`,
            confirmText: "儲存變更",
            cancelText: "取消",
            tone: "warning",
          }
        : {
            title: `確定${side.label}本月編更？`,
            description: `${side.label} ${monthLabel} 儲存後即確定編更，並寫入課室佔用（15:15 起）。未派人的日子會顯示暫時空缺。`,
            confirmText: "確定編更",
            cancelText: "取消",
            tone: "warning",
          }
    )
    if (ok !== true) return
    setSavingDivision(side.division)
    setSaveError(null)
    try {
      const publishFn = side.ownsMonthStatus ? onPublish : onPublishCompanion
      if (!publishFn || !side.onDutyDaysChange) {
        throw new Error("無法儲存編更：未接上寫入。請重新整理頁面後再試。")
      }
      await publishFn(yearMonth, side.monthDays)
      side.onDutyDaysChange((prev) => replaceMonthDutyDays(prev, yearMonth, side.monthDays))
      if (side.ownsMonthStatus) await onMonthStatusChange(yearMonth, "已編更")
      clearDirty(side.division)
      pushBanner({
        title: "已儲存",
        tone: "success",
        message: side.published
          ? `${side.label} ${monthLabel} 當值已更新，課室佔用已寫入排程。`
          : `${side.label} ${monthLabel} 編更已確定，課室佔用已寫入排程。`,
      })
    } catch (err) {
      const message = formatUnknownError(err)
      reportUserFacingError(err, {
        source: "RosterMonthSheet.saveSide",
        setErr: setSaveError,
        userMessage: message,
      })
      pushBanner({
        title: "儲存失敗",
        tone: "error",
        message,
      })
    } finally {
      setSavingDivision(null)
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
    const editing = editTarget ? sideByDivision(editTarget.division) : null
    const other = editing ? otherSideOf(editing.division) : null
    const otherDay = other ? findDutyDay(other.monthDays, day.date) : undefined
    const elsewhere = dutyAssignments(otherDay).filter((a) => a.teacherId === t.id)
    const base = reported
      ? `${t.name}（${formatAvailLabel(getAvailEntry(avail, t.id, day.date))}）`
      : `${t.name}（未報更）`
    return elsewhere.length > 0 && other
      ? `${base}｜已在${other.label} ${elsewhere.map((a) => `${a.start}–${a.end}`).join("、")}`
      : base
  }

  const reportedLine = (day: HomeworkDutyDay, sidePublished: boolean) => {
    const submitted = teachersAvailableOnDay(avail, day.date, teachers)
    if (submitted.length === 0) return sidePublished ? "—" : "當日未有報更"
    return submitted
      .map((t) => `${t.name}（${formatAvailLabel(getAvailEntry(avail, t.id, day.date))}）`)
      .join("、")
  }

  const showSubstitutes = editors.length > 0 && editors.every((side) => side.published)

  const openEdit = (side: RosterSide, day: HomeworkDutyDay) => {
    if (!side.editable || day.holiday || savingDivision === side.division) return
    setEditTarget({ division: side.division, day: withSyncedLegacyTeachers(day) })
    setAddTeacherId("")
  }

  const calendarLanes: HomeworkCalendarDivisionLane[] = editors.map((side) => ({
    division: side.division,
    dutyDays: side.monthDays,
    defaultRoom: side.roomA,
    emptyLabel: side.published ? "暫時空缺" : "—",
    countOf: (day) => countStudents(side.students, day),
    onSelect: side.editable ? (day) => openEdit(side, day) : undefined,
    selectLabel: (d) => `修改${side.label} ${d.date} 當值`,
  }))

  const editAssignments = editDay ? dutyAssignments(editDay) : []
  const editInvalid = editAssignments.some(assignmentInvalid)
  const roomChoices = editDay ? openedHomeworkRoomNames(editDay) : []

  const patchEditDay = (next: HomeworkDutyDay) => {
    setEditTarget((cur) => (cur ? { ...cur, day: next } : cur))
  }

  const patchEditAssignment = (index: number, patch: Partial<HomeworkDutyAssignment>) => {
    if (!editDay) return
    const next = dutyAssignments(editDay).map((a, i) => (i === index ? { ...a, ...patch } : a))
    patchEditDay({ ...editDay, assignments: next })
  }

  const removeEditAssignment = (index: number) => {
    if (!editDay) return
    patchEditDay({
      ...editDay,
      assignments: dutyAssignments(editDay).filter((_, i) => i !== index),
    })
  }

  const addEditAssignment = (teacherId: string) => {
    if (!editDay || !teacherId) return
    const entry = getAvailEntry(avail, teacherId, editDay.date)
    const room = defaultRoomForNextAssignment(editDay)
    patchEditDay({
      ...editDay,
      assignments: [...dutyAssignments(editDay), makeAssignmentFromAvail(teacherId, entry, room)],
    })
    setAddTeacherId("")
  }

  const editSide = editTarget ? sideByDivision(editTarget.division) : null
  const otherEditSide = editSide ? otherSideOf(editSide.division) : null
  const otherEditDay =
    editDay && otherEditSide ? (findDutyDay(otherEditSide.monthDays, editDay.date) ?? null) : null

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
          disabled={yearMonth <= MONTH_MIN || savingDivision !== null}
          onClick={() => void goMonth(-1)}
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
          disabled={yearMonth >= MONTH_MAX || savingDivision !== null}
          onClick={() => void goMonth(1)}
          aria-label="下一個月"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {editors.map((side) => (
          <span key={side.division} className="inline-flex items-center gap-1">
            <Tag tone={statusToTagTone(side.published ? "已編更" : "未編更")} size="sm">
              {side.label}
              {side.published ? "已編更" : "未編更"}
            </Tag>
            {dirtyDivisions.has(side.division) ? (
              <span className="text-xs text-warning">未儲存</span>
            ) : null}
          </span>
        ))}
        <TabsList className="ml-auto w-full justify-start sm:w-auto">
          <TabsTrigger value="list">列表</TabsTrigger>
          <TabsTrigger value="calendar">月曆</TabsTrigger>
        </TabsList>
      </div>

      <p className="text-xs text-muted-foreground">
        {bothEditable ? (
          <>
            中學部與小學部可在本頁同時修改，並各自儲存。預設各一間課室（
            {editors.map((side) => `${side.label} ${side.roomA}`).join("、")}
            ）。按當值老師一格即可修改該學部。儲存後只寫入該學部的課室佔用。
          </>
        ) : (
          <>
            正在編輯 <span className="font-medium text-foreground">{activeLabel}</span>
            {published
              ? `：已確定的當值清單。預設一間課室（${roomA}）；人數多或當日需要先加開第二間。改派後請按「儲存變更」寫入課室佔用。`
              : `：未編更，預設一間課室（${roomA}）。儲存後即確定本月編更，並只佔已開的房。`}
            按當值老師一格即可修改。
          </>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        {editors
          .filter((side) => side.editable)
          .map((side) => (
            <Fragment key={side.division}>
              <Button
                type="button"
                size="sm"
                loading={savingDivision === side.division}
                loadingText="儲存中…"
                disabled={savingDivision !== null && savingDivision !== side.division}
                onClick={() => void saveSide(side)}
              >
                {side.published ? `儲存${side.label}變更` : `儲存${side.label}`}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={savingDivision === side.division}
                onClick={() => openSecondAllWeekdays(side)}
              >
                {side.label}本月平日加開 {side.roomB}
              </Button>
            </Fragment>
          ))}
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
            className={`w-full text-left text-sm ${editors.length > 1 ? "min-w-[1040px]" : "min-w-[640px]"}`}
          >
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th rowSpan={2} className="px-3 py-2 align-bottom font-medium">
                  日期
                </th>
                {editors.map((side) => (
                  <th
                    key={side.division}
                    colSpan={3}
                    className="border-l border-border bg-primary/10 px-3 pt-2 pb-1 font-semibold text-foreground"
                  >
                    {side.label}
                  </th>
                ))}
                <th rowSpan={2} className="border-l border-border px-3 py-2 align-bottom font-medium">
                  {showSubstitutes ? "可頂替" : "已報更"}
                </th>
                <th rowSpan={2} className="px-3 py-2 align-bottom font-medium">
                  操作
                </th>
              </tr>
              <tr>
                {editors.map((side) => (
                  <Fragment key={side.division}>
                    <th className="border-l border-border bg-primary/10 px-3 pb-2 font-medium">
                      到校人數
                    </th>
                    <th className="bg-primary/10 px-3 pb-2 font-medium">課室</th>
                    <th className="bg-primary/10 px-3 pb-2 font-medium">當值老師</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthDays.map((d) => {
                const rowDays = editors.map((side) => ({
                  side,
                  day: findDutyDay(side.monthDays, d.date) ?? null,
                }))
                const subs = substituteTeachers(
                  avail,
                  d.date,
                  rowDays.flatMap(({ day }) => assignedTeacherIds(day)),
                  teachers
                )
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
                    {rowDays.map(({ side, day: cellDay }) => {
                      const other = rowDays.find((row) => row.side.division !== side.division)
                      const clashes = crossDivisionDutyClashes(cellDay, other?.day)
                      const canEdit = side.editable && !d.holiday && Boolean(cellDay)
                      return (
                        <Fragment key={side.division}>
                          <td className="border-l border-border bg-primary/5 px-3 py-2.5 tabular-nums">
                            {d.holiday || !cellDay ? "—" : `${countStudents(side.students, cellDay)} 人`}
                          </td>
                          <td className="bg-primary/5 px-3 py-2.5">
                            {d.holiday || !cellDay ? (
                              "—"
                            ) : (
                              <>
                                {openedHomeworkRoomNames(cellDay).join("／")}
                                {clashes.sharedRooms.length > 0 && other ? (
                                  <p className="mt-0.5 text-xs text-warning">
                                    與{other.side.label}同用 {clashes.sharedRooms.join("／")}
                                  </p>
                                ) : null}
                              </>
                            )}
                          </td>
                          <td className="bg-primary/5 px-3 py-2.5">
                            {d.holiday || !cellDay ? (
                              "—"
                            ) : canEdit ? (
                              <>
                                <DutyCellButton
                                  label={`修改${side.label} ${d.date} 當值`}
                                  onClick={() => openEdit(side, cellDay)}
                                >
                                  <DutyPeopleLines
                                    day={cellDay}
                                    teachers={teachers}
                                    published={side.published}
                                  />
                                </DutyCellButton>
                                {clashes.overlappingTeacherIds.length > 0 && other ? (
                                  <p className="mt-0.5 text-xs text-warning">
                                    {clashes.overlappingTeacherIds
                                      .map((id) => teacherName(id, teachers))
                                      .join("、")}
                                    同時段已在{other.side.label}當值
                                  </p>
                                ) : null}
                              </>
                            ) : (
                              <DutyPeopleLines
                                day={cellDay}
                                teachers={teachers}
                                published={side.published}
                              />
                            )}
                          </td>
                        </Fragment>
                      )
                    })}
                    <td className="border-l border-border px-3 py-2.5 text-muted-foreground">
                      {d.holiday
                        ? "—"
                        : showSubstitutes
                          ? subs.length > 0
                            ? subs
                                .map(
                                  (t) =>
                                    `${t.name}（${formatAvailLabel(getAvailEntry(avail, t.id, d.date))}）`
                                )
                                .join("、")
                            : "—"
                          : reportedLine(d, false)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-start gap-1">
                        {rowDays.map(({ side, day: cellDay }) =>
                          side.editable ? (
                            <Button
                              key={side.division}
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={Boolean(d.holiday) || !cellDay || savingDivision === side.division}
                              onClick={() => cellDay && openEdit(side, cellDay)}
                            >
                              {editors.length > 1 ? `改${side.label}` : "修改"}
                            </Button>
                          ) : null
                        )}
                      </div>
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
            setEditTarget(null)
            setAddTeacherId("")
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              編輯{editSide?.label ?? ""}當值 — {editDay?.date}
            </DialogTitle>
            {editDay ? (
              <p className="text-sm text-muted-foreground">
                時段默認跟報更，可改。可排多於一位；唔使全日都有人。預設一間課室；人數多先加開第二間。
              </p>
            ) : null}
          </DialogHeader>
          {editDay ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {reportedLine(editDay, editSide?.published ?? false)}
              </p>
              <p className="text-sm">
                {editSide?.label}當日約 {editSide ? countStudents(editSide.students, editDay) : 0} 人到校
                <span className="text-muted-foreground">（跟慣常到校星期；唔會自動加開）</span>
              </p>
              {otherEditSide && otherEditDay ? (
                <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {otherEditSide.label}
                  {dirtyDivisions.has(otherEditSide.division) ? "（本頁尚未儲存）" : ""}：約{" "}
                  {countStudents(otherEditSide.students, otherEditDay)} 人；課室{" "}
                  {openedHomeworkRoomNames(otherEditDay).join("／")}；當值{" "}
                  {dutyAssignments(otherEditDay)
                    .map((a) => formatAssignmentLine(a, teachers))
                    .join("、") || (otherEditSide.published ? "暫時空缺" : "尚未排人")}
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
                    onClick={() => patchEditDay(closeSecondHomeworkRoom(editDay))}
                  >
                    收起 {roomBLabel(editDay)}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      patchEditDay(openSecondHomeworkRoom(editDay, editSide?.roomB ?? roomB))
                    }
                  >
                    加開 {editSide?.roomB ?? roomB}
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
                setEditTarget(null)
                setAddTeacherId("")
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={editInvalid || !editSide?.editable}
              onClick={() => {
                if (!editDay || !editSide?.onDutyDaysChange || editInvalid) return
                editSide.onDutyDaysChange((prev) => upsertDutyDay(prev, editDay))
                markDirty(editSide.division)
                const savedLabel = editSide.label
                const wasPublished = editSide.published
                setEditTarget(null)
                setAddTeacherId("")
                pushBanner({
                  title: "已更新本頁",
                  tone: "success",
                  message: wasPublished
                    ? `${savedLabel}當值已改在本頁。請按「儲存${savedLabel}變更」寫入課室佔用。`
                    : `${savedLabel}當值已改在本頁。請按「儲存${savedLabel}」確定本月編更。`,
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
