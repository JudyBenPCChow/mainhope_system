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
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import {
  CALENDAR_WEEK_HEADERS,
  buildMonthDutyDays,
  dutyTeacherLabel,
  formatAvailLabel,
  formatSession,
  formatYearMonthLabel,
  getAvailEntry,
  listRosterMonthDays,
  holidaysForMonth,
  shiftYearMonth,
  substituteTeachers,
  teacherName,
  teachersAvailableOnDay,
  type AllTeacherAvailability,
  type MockDutyDay,
  type MonthRosterState,
} from "./mockData"

type SheetView = "list" | "calendar"

const MONTH_MIN = "2026-07"
const MONTH_MAX = "2026-12"

function clampMonth(yearMonth: string): string {
  if (yearMonth < MONTH_MIN) return MONTH_MIN
  if (yearMonth > MONTH_MAX) return MONTH_MAX
  return yearMonth
}

function TeacherPick({
  label,
  value,
  options,
  emptyLabel,
  onChange,
}: {
  label: string
  value: string
  options: { id: string; name: string }[]
  emptyLabel: string
  onChange: (id: string) => void
}) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{emptyLabel}</option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
    </label>
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
}: {
  yearMonth: string
  onYearMonthChange: (yearMonth: string) => void
  dutyDays: MockDutyDay[]
  onDutyDaysChange: Dispatch<SetStateAction<MockDutyDay[]>>
  monthStatus: Record<string, MonthRosterState>
  onMonthStatusChange: (yearMonth: string, state: MonthRosterState) => void
  avail: AllTeacherAvailability
}) {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const [view, setView] = useState<SheetView>("list")
  const [editDay, setEditDay] = useState<MockDutyDay | null>(null)
  const published = (monthStatus[yearMonth] ?? "未編更") === "已編更"
  const emptyLabel = published ? "暫時空缺" : "未編"

  const monthDays = useMemo(
    () => buildMonthDutyDays(yearMonth, dutyDays),
    [yearMonth, dutyDays]
  )

  const calendarCells = useMemo(() => {
    const cal = listRosterMonthDays(yearMonth, holidaysForMonth(yearMonth))
    const first = cal[0]
    if (!first) return []
    const byKey = new Map(monthDays.map((d) => [d.date, d]))
    const pad = first.weekdayIndex
    return [
      ...Array.from({ length: pad }, () => null),
      ...cal.map((d) => ({ roster: d, duty: byKey.get(d.key) ?? null })),
    ]
  }, [yearMonth, monthDays])

  const upsertDay = (next: MockDutyDay) => {
    onDutyDaysChange((prev) =>
      prev.some((d) => d.date === next.date)
        ? prev.map((d) => (d.date === next.date ? next : d))
        : [...prev, next]
    )
  }

  const goMonth = (delta: number) => {
    onYearMonthChange(clampMonth(shiftYearMonth(yearMonth, delta)))
  }

  const saveMonth = async () => {
    const ok = await confirmDialog({
      title: "確定本月編更？",
      description: `${formatYearMonthLabel(yearMonth)} 儲存後即確定編更。未派人的日子會顯示暫時空缺。`,
      confirmText: "確定編更",
      cancelText: "取消",
      tone: "warning",
    })
    if (ok !== true) return
    const monthNum = Number(yearMonth.split("-")[1])
    onDutyDaysChange((prev) => {
      const others = prev.filter((d) => Number(d.date.split("/")[0]) !== monthNum)
      return [...others, ...monthDays]
    })
    onMonthStatusChange(yearMonth, "已編更")
    pushBanner({
      title: "已儲存",
      tone: "success",
      message: `${formatYearMonthLabel(yearMonth)} 編更已確定。未派人的日子會顯示暫時空缺。`,
    })
  }

  const pickOptions = (day: MockDutyDay) => {
    const submitted = teachersAvailableOnDay(avail, day.date)
    const extra = [day.secondaryTeacherId, day.primaryTeacherId].filter(
      (id): id is string => Boolean(id) && !submitted.some((t) => t.id === id)
    )
    const extraTeachers = extra.map((id) => ({ id, name: teacherName(id) }))
    return [...submitted.map((t) => ({ id: t.id, name: t.name })), ...extraTeachers]
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
          ? "已確定的當值清單。可頂替＝當日有報更但未編入的同事。"
          : "未編更：只顯示當日已報更的同事。儲存後即確定本月編更。"}
      </p>

      {!published ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void saveMonth()}>
            儲存
          </Button>
        </div>
      ) : null}

      <TabsContent value="list" className="mt-0">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">日期</th>
                <th className="px-3 py-2 font-medium">班時間</th>
                <th className="px-3 py-2 font-medium">中學</th>
                <th className="px-3 py-2 font-medium">小學</th>
                <th className="px-3 py-2 font-medium">{published ? "可頂替" : "已報更"}</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {monthDays.map((d) => {
                const submitted = teachersAvailableOnDay(avail, d.date)
                const subs = substituteTeachers(avail, d.date, [
                  d.secondaryTeacherId,
                  d.primaryTeacherId,
                ])
                const secVacant = published && !d.holiday && !d.secondaryTeacherId
                const priVacant = published && !d.holiday && !d.primaryTeacherId
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
                    <td className="px-3 py-2.5 tabular-nums">
                      {d.holiday ? "—" : formatSession(d)}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.holiday ? (
                        "—"
                      ) : published ? (
                        <span className={secVacant ? "text-warning" : undefined}>
                          {dutyTeacherLabel(d.secondaryTeacherId, true)}
                        </span>
                      ) : (
                        <Select
                          value={d.secondaryTeacherId ?? ""}
                          onChange={(e) =>
                            upsertDay({
                              ...d,
                              secondaryTeacherId: e.target.value || undefined,
                            })
                          }
                          className="w-28"
                        >
                          <option value="">{emptyLabel}</option>
                          {pickOptions(d).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.holiday ? (
                        "—"
                      ) : published ? (
                        <span className={priVacant ? "text-warning" : undefined}>
                          {dutyTeacherLabel(d.primaryTeacherId, true)}
                        </span>
                      ) : (
                        <Select
                          value={d.primaryTeacherId ?? ""}
                          onChange={(e) =>
                            upsertDay({
                              ...d,
                              primaryTeacherId: e.target.value || undefined,
                            })
                          }
                          className="w-28"
                        >
                          <option value="">{emptyLabel}</option>
                          {pickOptions(d).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {d.holiday
                        ? "—"
                        : published
                          ? subs.length > 0
                            ? subs.map((t) => t.name).join("、")
                            : "—"
                          : submitted.length > 0
                            ? submitted.map((t) => t.name).join("、")
                            : "當日未有報更"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={Boolean(d.holiday)}
                        onClick={() => setEditDay({ ...d })}
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
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
            {CALENDAR_WEEK_HEADERS.map((h) => (
              <div key={h} className="px-1 py-2">
                {h}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`pad-${idx}`}
                    className="min-h-[6.5rem] border-b border-r border-border/60 bg-muted/10"
                  />
                )
              }
              const { roster, duty } = cell
              const isWeekend = !roster.selectable && !roster.holidayLabel
              const submitted = teachersAvailableOnDay(avail, roster.key)
              const subs = duty
                ? substituteTeachers(avail, roster.key, [
                    duty.secondaryTeacherId,
                    duty.primaryTeacherId,
                  ])
                : submitted
              const canEdit = roster.selectable && !roster.holidayLabel
              return (
                <button
                  key={roster.key}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    if (!duty) return
                    setEditDay({ ...duty })
                  }}
                  className={cn(
                    "flex min-h-[6.5rem] flex-col items-start gap-0.5 border-b border-r border-border/60 p-1.5 text-left text-[11px] leading-tight sm:p-2 sm:text-xs",
                    (isWeekend || roster.holidayLabel) && "bg-muted/20 text-muted-foreground",
                    canEdit && "hover:bg-muted/30"
                  )}
                >
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {roster.day}
                  </span>
                  {roster.holidayLabel ? (
                    <span>放假</span>
                  ) : isWeekend ? (
                    <span>週末</span>
                  ) : published ? (
                    <>
                      <span
                        className={
                          duty?.secondaryTeacherId ? "text-foreground" : "text-warning"
                        }
                      >
                        中 {dutyTeacherLabel(duty?.secondaryTeacherId, true)}
                      </span>
                      <span
                        className={duty?.primaryTeacherId ? "text-foreground" : "text-warning"}
                      >
                        小 {dutyTeacherLabel(duty?.primaryTeacherId, true)}
                      </span>
                      {subs.length > 0 ? (
                        <span className="text-muted-foreground">
                          頂 {subs.map((t) => t.name).join("、")}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="text-foreground">
                        中 {dutyTeacherLabel(duty?.secondaryTeacherId, false)}
                      </span>
                      <span className="text-foreground">
                        小 {dutyTeacherLabel(duty?.primaryTeacherId, false)}
                      </span>
                      <span className="text-muted-foreground">
                        {submitted.length > 0
                          ? `報 ${submitted.map((t) => t.name).join("、")}`
                          : "未有報更"}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </TabsContent>

      <Dialog open={Boolean(editDay)} onOpenChange={(o) => !o && setEditDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>編輯當值 — {editDay?.date}</DialogTitle>
            {editDay ? (
              <p className="text-sm text-muted-foreground">
                {formatSession(editDay)}
                {published ? " · 可改派已報更同事頂替" : " · 只可選當日已報更同事"}
              </p>
            ) : null}
          </DialogHeader>
          {editDay ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {teachersAvailableOnDay(avail, editDay.date).length > 0
                  ? `當日已報更：${teachersAvailableOnDay(avail, editDay.date)
                      .map((t) => `${t.name}（${formatAvailLabel(getAvailEntry(avail, t.id, editDay.date))}）`)
                      .join("、")}`
                  : "當日未有報更"}
              </p>
              <TeacherPick
                label="中學"
                value={editDay.secondaryTeacherId ?? ""}
                options={pickOptions(editDay)}
                emptyLabel={emptyLabel}
                onChange={(id) =>
                  setEditDay({ ...editDay, secondaryTeacherId: id || undefined })
                }
              />
              <TeacherPick
                label="小學"
                value={editDay.primaryTeacherId ?? ""}
                options={pickOptions(editDay)}
                emptyLabel={emptyLabel}
                onChange={(id) =>
                  setEditDay({ ...editDay, primaryTeacherId: id || undefined })
                }
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDay(null)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!editDay) return
                upsertDay(editDay)
                setEditDay(null)
                pushBanner({ title: "已更新", tone: "success", message: "當值已更新（沙盒）。" })
              }}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
