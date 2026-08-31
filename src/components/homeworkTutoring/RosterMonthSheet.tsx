import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"

import { HomeworkDutyMonthCalendar } from "./HomeworkDutyMonthCalendar"
import {
  HOMEWORK_DEFAULT_ROOM_B,
  WEEKDAY_OPTIONS,
  assignedTeacherIds,
  buildMonthDutyDays,
  closeSecondHomeworkRoom,
  defaultRoomForNextAssignment,
  dutyAssignments,
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
    <ul className="space-y-0.5">
      {list.map((a, i) => (
        <li key={`${a.teacherId}-${a.room}-${i}`} className="tabular-nums">
          {formatAssignmentLine(a, teachers)}
        </li>
      ))}
    </ul>
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
  onPublish,
}: {
  yearMonth: string
  onYearMonthChange: (yearMonth: string) => void
  dutyDays: HomeworkDutyDay[]
  onDutyDaysChange: Dispatch<SetStateAction<HomeworkDutyDay[]>>
  monthStatus: Record<string, MonthRosterState>
  onMonthStatusChange: (yearMonth: string, state: MonthRosterState) => void
  avail: AllTeacherAvailability
  teachers?: readonly HomeworkTeacherRow[]
  holidays?: HomeworkHoliday[]
  students?: readonly HomeworkStudentRow[]
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
  const published = (monthStatus[yearMonth] ?? "未編更") === "已編更"

  const monthHolidays = useMemo(
    () => holidaysInYearMonth(yearMonth, holidays),
    [yearMonth, holidays]
  )

  const monthDays = useMemo(
    () => buildMonthDutyDays(yearMonth, dutyDays, monthHolidays).map(withSyncedLegacyTeachers),
    [yearMonth, dutyDays, monthHolidays]
  )

  const upsertDay = (next: HomeworkDutyDay) => {
    const synced = withSyncedLegacyTeachers(next)
    onDutyDaysChange((prev) =>
      prev.some((d) => d.date === synced.date)
        ? prev.map((d) => (d.date === synced.date ? synced : d))
        : [...prev, synced]
    )
  }

  const goMonth = (delta: number) => {
    onYearMonthChange(clampMonth(shiftYearMonth(yearMonth, delta)))
  }

  const weekdayOf = (day: HomeworkDutyDay): Weekday | null =>
    WEEKDAY_OPTIONS.includes(day.weekday as Weekday) ? (day.weekday as Weekday) : null

  const expectedCount = (day: HomeworkDutyDay): number =>
    studentsComingOnWeekday([...students], weekdayOf(day)).length

  const openSecondAllWeekdays = () => {
    const monthNum = Number(yearMonth.split("-")[1])
    const updated = monthDays.map((d) =>
      d.holiday || isSecondRoomOpen(d) ? d : openSecondHomeworkRoom(d)
    )
    onDutyDaysChange((prev) => {
      const others = prev.filter((d) => Number(d.date.split("/")[0]) !== monthNum)
      return [...others, ...updated]
    })
    pushBanner({
      title: "已加開第二課室",
      tone: "success",
      message: `本月平日已加開 ${HOMEWORK_DEFAULT_ROOM_B}。請再派導師，然後儲存以寫入佔室。`,
    })
  }

  const saveMonth = async () => {
    const monthLabel = formatYearMonthLabel(yearMonth)
    const ok = await confirmDialog(
      published
        ? {
            title: "儲存當值變更？",
            description: `${monthLabel} 將更新當值老師，並重寫課室佔用（15:15 起）。`,
            confirmText: "儲存變更",
            cancelText: "取消",
            tone: "warning",
          }
        : {
            title: "確定本月編更？",
            description: `${monthLabel} 儲存後即確定編更，並寫入課室佔用（15:15 起）。未派人的日子會顯示暫時空缺。`,
            confirmText: "確定編更",
            cancelText: "取消",
            tone: "warning",
          }
    )
    if (ok !== true) return
    setSaving(true)
    setSaveError(null)
    try {
      if (onPublish) {
        await onPublish(yearMonth, monthDays)
      }
      const monthNum = Number(yearMonth.split("-")[1])
      onDutyDaysChange((prev) => {
        const others = prev.filter((d) => Number(d.date.split("/")[0]) !== monthNum)
        return [...others, ...monthDays]
      })
      onMonthStatusChange(yearMonth, "已編更")
      pushBanner({
        title: "已儲存",
        tone: "success",
        message: published
          ? `${monthLabel} 當值已更新，課室佔用已寫入排程。`
          : `${monthLabel} 編更已確定，課室佔用已寫入排程。`,
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
    return teachersAvailableOnDay(avail, day.date, teachers).filter((t) => !assigned.has(t.id))
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
          {published ? "已編更" : "未編更"}
        </Tag>
        <TabsList className="ml-auto w-full justify-start sm:w-auto">
          <TabsTrigger value="list">列表</TabsTrigger>
          <TabsTrigger value="calendar">月曆</TabsTrigger>
        </TabsList>
      </div>

      <p className="text-xs text-muted-foreground">
        {published
          ? "已確定的當值清單。預設一間課室（17D）；人數多或當日需要先加開第二間。改派後請按「儲存變更」寫入課室佔用。"
          : "未編更：預設一間課室（17D）。儲存後即確定本月編更，並只佔已開的房。"}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          loading={saving}
          loadingText="儲存中…"
          onClick={() => void saveMonth()}
        >
          {published ? "儲存變更" : "儲存"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={openSecondAllWeekdays}>
          本月平日加開 {HOMEWORK_DEFAULT_ROOM_B}
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
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">日期</th>
                <th className="px-3 py-2 font-medium">約到校</th>
                <th className="px-3 py-2 font-medium">課室</th>
                <th className="px-3 py-2 font-medium">當值</th>
                <th className="px-3 py-2 font-medium">{published ? "可頂替" : "已報更"}</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {monthDays.map((d) => {
                const subs = substituteTeachers(avail, d.date, assignedTeacherIds(d), teachers)
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
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {d.holiday ? "—" : `${expectedCount(d)} 人`}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.holiday ? "—" : openedHomeworkRoomNames(d).join("／")}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.holiday ? "—" : <DutyPeopleLines day={d} teachers={teachers} published={published} />}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
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
                        改
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
          onSelectDutyDay={openEdit}
          dayCaption={(d) =>
            d.holiday ? null : (
              <span className="text-muted-foreground">約 {expectedCount(d)} 人</span>
            )
          }
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
            <DialogTitle>編輯當值 — {editDay?.date}</DialogTitle>
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
                當日約 {expectedCount(editDay)} 人到校
                <span className="text-muted-foreground">（跟慣常到校星期；唔會自動加開）</span>
              </p>
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
                    onClick={() => setEditDay(openSecondHomeworkRoom(editDay))}
                  >
                    加開 {HOMEWORK_DEFAULT_ROOM_B}
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
                      className="rounded-lg border border-border p-3"
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
                  <option value="">選擇已報更同事</option>
                  {addOptions(editDay).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}（{formatAvailLabel(getAvailEntry(avail, t.id, editDay.date))}）
                    </option>
                  ))}
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
