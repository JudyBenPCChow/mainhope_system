import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { downloadHomeworkDutyCalendarIcs } from "@/lib/homeworkDutyCalendarExport"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { MONTH_CALENDAR_WEEK_HEADERS, padMonthCalendarDays } from "@/lib/monthCalendar"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

import { BulkCustomTimeDialog } from "./availEditor"
import { HomeworkDutyMonthCalendar } from "./HomeworkDutyMonthCalendar"
import {
  SUBMIT_DEADLINE_NOTE,
  academicYearMonthBounds,
  clampYearMonth,
  currentYearMonth,
  formatAvailLabel,
  formatYearMonthLabel,
  holidaysInYearMonth,
  listRosterMonthDays,
  myDutyDays,
  myDutyRoomLabel,
  shiftYearMonth,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type AvailEntry,
  type HomeworkDutyDay,
  type HomeworkHoliday,
  type HomeworkTeacherRow,
  type RosterPublishStatus,
} from "@/lib/homeworkTutoringUi"
import type { TeacherPageId } from "./homeworkTutoringSectionNav"
import { SubmitStatusTag } from "./sharedUi"

export function TeacherHomeworkWorkbench({
  tab,
  teacherId,
  teacherDisplayName,
  avail,
  setAvail,
  submitStatus,
  onPersistTeacherAvail,
  rosterPublishStatus,
  dutyDays = [],
  rosterMonthKey = currentYearMonth(),
  onRosterMonthChange,
  academicYearLabel = "2627",
  holidays = [],
  teachers = [],
}: {
  tab: TeacherPageId
  onTabChange: (tab: TeacherPageId) => void
  teacherId: string
  teacherDisplayName?: string
  avail: AllTeacherAvailability
  setAvail: Dispatch<SetStateAction<AllTeacherAvailability>>
  submitStatus: AllTeacherSubmitStatus
  onPersistTeacherAvail: (teacherId: string, status: "草稿" | "已提交") => Promise<void>
  rosterPublishStatus: RosterPublishStatus
  dutyDays?: HomeworkDutyDay[]
  rosterMonthKey?: string
  onRosterMonthChange?: (yearMonth: string) => void
  academicYearLabel?: string
  holidays?: HomeworkHoliday[]
  teachers?: readonly HomeworkTeacherRow[]
}) {
  const { pushBanner } = useAppBanner()
  const isMobile = useIsMobile()
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [customOpen, setCustomOpen] = useState(false)
  const [persisting, setPersisting] = useState(false)
  const myStatus = submitStatus[teacherId] ?? "未交"
  const locked = rosterPublishStatus === "已發布"
  const readOnly = locked || myStatus === "已提交"
  const row = avail[teacherId] ?? {}
  const monthLabel = formatYearMonthLabel(rosterMonthKey)
  const monthBounds = academicYearMonthBounds(academicYearLabel)
  const atMonthMin = rosterMonthKey <= monthBounds.min
  const atMonthMax = rosterMonthKey >= monthBounds.max

  const goDutyMonth = (delta: number) => {
    if (!onRosterMonthChange) return
    onRosterMonthChange(
      clampYearMonth(shiftYearMonth(rosterMonthKey, delta), monthBounds.min, monthBounds.max)
    )
  }

  const monthHolidays = useMemo(
    () => holidaysInYearMonth(rosterMonthKey, holidays),
    [rosterMonthKey, holidays]
  )

  const rosterDays = useMemo(
    () => listRosterMonthDays(rosterMonthKey, monthHolidays),
    [rosterMonthKey, monthHolidays]
  )

  const duties = useMemo(() => myDutyDays(teacherId, dutyDays), [teacherId, dutyDays])

  const dutyEmptyHint =
    rosterPublishStatus !== "已發布"
      ? "本月尚未有已發布的當值。"
      : duties.length === 0
        ? "本月未編入你的當值。"
        : null

  const canAddToIosCalendar = rosterPublishStatus === "已發布" && duties.length > 0

  const addToIosCalendar = () => {
    if (!canAddToIosCalendar) {
      pushBanner({
        title: "無法加入月曆",
        tone: "warning",
        message: dutyEmptyHint ?? "本月沒有你的當值。",
      })
      return
    }
    try {
      downloadHomeworkDutyCalendarIcs({
        teacherId,
        yearMonth: rosterMonthKey,
        days: dutyDays,
      })
      pushBanner({
        title: "已下載日曆檔",
        tone: "success",
        message: "請以 Safari 或「檔案」開啟 .ics，再加入日曆。再按一次可能重複。",
      })
    } catch (e) {
      reportUserFacingError(e, {
        source: "TeacherHomeworkWorkbench.addToIosCalendar",
        userMessage: formatUnknownError(e),
      })
      pushBanner({
        title: "無法加入月曆",
        tone: "error",
        message: formatUnknownError(e),
      })
    }
  }

  const calendarCells = useMemo(() => padMonthCalendarDays(rosterDays), [rosterDays])

  const selectableKeys = useMemo(
    () => rosterDays.filter((d) => d.selectable).map((d) => d.key),
    [rosterDays]
  )

  const selectedCount = selected.size

  const ensureEditable = () => {
    if (readOnly) {
      pushBanner({
        title: "無法修改",
        tone: "warning",
        message: locked
          ? "該月編更已確定，報更已鎖定。"
          : "已提交後請先「撤回修改」再改。",
      })
      return false
    }
    return true
  }

  const persistDraftOrSubmit = async (status: "草稿" | "已提交") => {
    setPersisting(true)
    try {
      await onPersistTeacherAvail(teacherId, status)
      return true
    } catch (e) {
      pushBanner({
        title: "儲存失敗",
        tone: "error",
        message: formatUnknownError(e),
      })
      return false
    } finally {
      setPersisting(false)
    }
  }

  const applyToSelected = async (entry: AvailEntry | null) => {
    if (!ensureEditable()) return
    if (selectedCount === 0) {
      pushBanner({ title: "請先剔選日子", tone: "warning", message: "先剔選要設定的日子。" })
      return
    }
    setAvail((prev) => {
      const nextRow = { ...(prev[teacherId] ?? {}) }
      for (const key of selected) {
        if (entry == null) delete nextRow[key]
        else nextRow[key] = entry
      }
      return { ...prev, [teacherId]: nextRow }
    })
    const ok = await persistDraftOrSubmit("草稿")
    if (!ok) return
    setSelected(new Set())
    pushBanner({
      title: "已套用",
      tone: "success",
      message:
        entry == null
          ? `已清除 ${selectedCount} 日報更。`
          : entry.kind === "full"
            ? `已將 ${selectedCount} 日設為全節。`
            : `已將 ${selectedCount} 日設為 ${entry.start}–${entry.end}。`,
    })
  }

  const toggleDay = (key: string) => {
    if (!ensureEditable()) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAllWeekdays = () => {
    if (!ensureEditable()) return
    setSelected(new Set(selectableKeys))
  }

  const clearSelection = () => setSelected(new Set())

  const saveDraft = async () => {
    if (locked) return
    const ok = await persistDraftOrSubmit("草稿")
    if (!ok) return
    pushBanner({ title: "已儲存", tone: "success", message: "草稿已儲存。" })
  }

  const submit = async () => {
    if (locked) return
    const ok = await persistDraftOrSubmit("已提交")
    if (!ok) return
    setSelected(new Set())
    pushBanner({
      title: "已提交",
      tone: "success",
      message: `${monthLabel} 報更已提交。`,
    })
  }

  const withdraw = async () => {
    if (locked) return
    const ok = await persistDraftOrSubmit("草稿")
    if (!ok) return
    pushBanner({ title: "已撤回", tone: "info", message: "已改回草稿，可繼續修改。" })
  }

  return (
    <div className="space-y-4">
      {tab === "submit" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{monthLabel} 報更</h2>
            <SubmitStatusTag status={locked ? "已提交" : myStatus} />
            {locked ? (
              <Tag tone={statusToTagTone("已鎖定")} size="sm">
                已鎖定
              </Tag>
            ) : null}
            {teacherDisplayName ? (
              <span className="text-sm text-muted-foreground">{teacherDisplayName}</span>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">{SUBMIT_DEADLINE_NOTE}</p>

          <div
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm",
              isMobile && "sticky top-0 z-10 bg-background/95 backdrop-blur"
            )}
          >
            <span className="text-sm text-muted-foreground">
              已剔 <span className="font-medium tabular-nums text-foreground">{selectedCount}</span>{" "}
              日
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly}
              onClick={selectAllWeekdays}
            >
              剔全部平日
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly || selectedCount === 0}
              onClick={clearSelection}
            >
              取消剔選
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={readOnly || persisting || selectedCount === 0}
              onClick={() => void applyToSelected({ kind: "full" })}
            >
              設為全節
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly || persisting || selectedCount === 0}
              onClick={() => {
                if (!ensureEditable()) return
                setCustomOpen(true)
              }}
            >
              輸入時間
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={readOnly || persisting || selectedCount === 0}
              onClick={() => void applyToSelected(null)}
            >
              清除報更
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
              {MONTH_CALENDAR_WEEK_HEADERS.map((h) => (
                <div key={h} className="px-1 py-2">
                  {h}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map((day, idx) => {
                if (!day) {
                  return <div key={`pad-${idx}`} className="min-h-[4.5rem] border-b border-r border-border/60 bg-muted/10" />
                }
                const entry = row[day.key] ?? null
                const isSelected = selected.has(day.key)
                const label = formatAvailLabel(entry)
                const canPick = day.selectable && !readOnly

                return (
                  <button
                    key={day.key}
                    type="button"
                    disabled={!canPick && !day.selectable}
                    onClick={() => {
                      if (!day.selectable) return
                      toggleDay(day.key)
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${day.key} 星期${day.weekdayChar}${entry ? `，${label}` : "，未報"}${isSelected ? "，已剔" : ""}`}
                    className={cn(
                      "relative flex min-h-[4.5rem] flex-col items-start gap-1 border-b border-r border-border/60 p-1.5 text-left transition-colors sm:p-2",
                      !day.selectable && "bg-muted/20 text-muted-foreground",
                      day.selectable && Boolean(entry) && "bg-warning/15",
                      day.selectable && !readOnly && !entry && "hover:bg-muted/30",
                      day.selectable && !readOnly && Boolean(entry) && "hover:bg-warning/25",
                      isSelected && "ring-2 ring-inset ring-primary",
                      isSelected && !entry && "bg-primary/10",
                      readOnly && day.selectable && "opacity-80"
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-1">
                      <span className="text-sm font-medium tabular-nums">{day.day}</span>
                      {day.selectable ? (
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-transparent"
                          )}
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                    </span>
                    {!day.selectable ? (
                      day.weekdayIndex === 0 || day.weekdayIndex === 6 ? (
                        <span className="text-[10px] text-muted-foreground">週末</span>
                      ) : day.holidayLabel ? (
                        <span className="text-[10px] text-muted-foreground">放假</span>
                      ) : null
                    ) : entry ? (
                      <span className="text-[10px] font-medium leading-tight text-foreground sm:text-xs">
                        {label}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">未報</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            顯示整月日子；已填（全節或指定時間）以淡橙色標示。平日可剔選後批量「設為全節」或「輸入時間」。週末不可剔。
          </p>

          <div
            className={cn(
              "flex flex-wrap gap-2",
              isMobile && "sticky bottom-0 z-10 border-t border-border bg-background/95 py-3 backdrop-blur"
            )}
          >
            <Button
              type="button"
              variant="outline"
              disabled={readOnly || persisting}
              loading={persisting}
              loadingText="儲存中…"
              onClick={() => void saveDraft()}
            >
              儲存草稿
            </Button>
            {myStatus === "已提交" && !locked ? (
              <Button
                type="button"
                variant="outline"
                disabled={persisting}
                loading={persisting}
                loadingText="儲存中…"
                onClick={() => void withdraw()}
              >
                撤回修改
              </Button>
            ) : (
              <Button
                type="button"
                disabled={readOnly || persisting}
                loading={persisting}
                loadingText="儲存中…"
                onClick={() => void submit()}
              >
                提交
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {tab === "myDuty" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={atMonthMin}
              onClick={() => goDutyMonth(-1)}
              aria-label="上一個月"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[7.5rem] text-center text-base font-semibold tabular-nums">
              {monthLabel}
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={atMonthMax}
              onClick={() => goDutyMonth(1)}
              aria-label="下一個月"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={!canAddToIosCalendar}
              onClick={addToIosCalendar}
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              添加至 iOS 月曆
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            只加入畫面顯示月份、屬於你的當值。下載後以 Safari 或「檔案」開啟並加入日曆。
          </p>

          {dutyEmptyHint ? (
            <p className="text-sm text-muted-foreground">{dutyEmptyHint}</p>
          ) : (
            <ul className="space-y-2">
              {duties.map((d) => (
                <li
                  key={d.date}
                  className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <p className="font-medium tabular-nums">
                    {d.date}（{d.weekday}）
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {myDutyRoomLabel(d, teacherId)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <HomeworkDutyMonthCalendar
            yearMonth={rosterMonthKey}
            holidays={monthHolidays}
            dutyDays={dutyDays}
            teachers={teachers}
            highlightTeacherId={teacherId}
            showIdleLabels={locked}
          />
        </div>
      ) : null}

      <BulkCustomTimeDialog
        open={customOpen}
        count={selectedCount}
        onOpenChange={setCustomOpen}
        onSave={(start, end) => void applyToSelected({ kind: "custom", start, end })}
      />
    </div>
  )
}
