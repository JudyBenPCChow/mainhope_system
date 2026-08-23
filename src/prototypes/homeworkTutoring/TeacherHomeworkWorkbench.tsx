import { useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

import { BulkCustomTimeDialog } from "./availEditor"
import {
  MOCK_DUTY_DAYS,
  MOCK_ROSTER_DAYS,
  MOCK_ROSTER_MONTH_LABEL,
  MOCK_SPLIT_NOTE,
  MOCK_SUBMIT_DEADLINE_NOTE,
  MOCK_SUBJECT_TEACHERS,
  formatAvailLabel,
  formatSession,
  myDutyDays,
  myDutyDivisionLabel,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type AvailEntry,
  type RosterPublishStatus,
} from "./mockData"
import type { TeacherPageId } from "./sandboxNav"
import { SubmitStatusTag } from "./sharedUi"

const WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"] as const

export function TeacherHomeworkWorkbench({
  tab,
  teacherId,
  avail,
  setAvail,
  submitStatus,
  setSubmitStatus,
  rosterPublishStatus,
}: {
  tab: TeacherPageId
  onTabChange: (tab: TeacherPageId) => void
  teacherId: string
  avail: AllTeacherAvailability
  setAvail: Dispatch<SetStateAction<AllTeacherAvailability>>
  submitStatus: AllTeacherSubmitStatus
  setSubmitStatus: Dispatch<SetStateAction<AllTeacherSubmitStatus>>
  rosterPublishStatus: RosterPublishStatus
}) {
  const { pushBanner } = useAppBanner()
  const isMobile = useIsMobile()
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [customOpen, setCustomOpen] = useState(false)
  const teacher = MOCK_SUBJECT_TEACHERS.find((t) => t.id === teacherId)
  const myStatus = submitStatus[teacherId] ?? "未交"
  const locked = rosterPublishStatus === "已發布"
  const readOnly = locked || myStatus === "已提交"
  const row = avail[teacherId] ?? {}

  const duties = useMemo(() => myDutyDays(teacherId, MOCK_DUTY_DAYS), [teacherId])

  const calendarCells = useMemo(() => {
    const first = MOCK_ROSTER_DAYS[0]
    if (!first) return []
    const pad = first.weekdayIndex
    return [...Array.from({ length: pad }, () => null), ...MOCK_ROSTER_DAYS]
  }, [])

  const selectableKeys = useMemo(
    () => MOCK_ROSTER_DAYS.filter((d) => d.selectable).map((d) => d.key),
    []
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

  const markDraft = () => {
    if (myStatus === "未交") {
      setSubmitStatus((s) => ({ ...s, [teacherId]: "草稿" }))
    }
  }

  const applyToSelected = (entry: AvailEntry | null) => {
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
    markDraft()
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

  const saveDraft = () => {
    if (locked) return
    setSubmitStatus((s) => ({ ...s, [teacherId]: "草稿" }))
    pushBanner({ title: "已儲存", tone: "success", message: "草稿已儲存（沙盒記憶體）。" })
  }

  const submit = () => {
    if (locked) return
    setSubmitStatus((s) => ({ ...s, [teacherId]: "已提交" }))
    setSelected(new Set())
    pushBanner({
      title: "已提交",
      tone: "success",
      message: `${MOCK_ROSTER_MONTH_LABEL} 報更已提交；行政會分配當日中／小學部。`,
    })
  }

  const withdraw = () => {
    if (locked) return
    setSubmitStatus((s) => ({ ...s, [teacherId]: "草稿" }))
    pushBanner({ title: "已撤回", tone: "info", message: "已改回草稿，可繼續修改。" })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground sm:px-4">
        此為功輔當值報更，<span className="font-medium text-foreground">不是</span>
        「老師檔期規劃」專科班頁。只須報一次更；中／小學由行政分配。{MOCK_SPLIT_NOTE}
      </div>

      {tab === "submit" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{MOCK_ROSTER_MONTH_LABEL} 報更</h2>
            <SubmitStatusTag status={locked ? "已提交" : myStatus} />
            {locked ? (
              <Tag tone={statusToTagTone("已鎖定")} size="sm">
                已鎖定
              </Tag>
            ) : null}
            <span className="text-sm text-muted-foreground">{teacher?.name}</span>
          </div>

          <p className="text-xs text-muted-foreground">{MOCK_SUBMIT_DEADLINE_NOTE}</p>

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
              disabled={readOnly || selectedCount === 0}
              onClick={() => applyToSelected({ kind: "full" })}
            >
              設為全節
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly || selectedCount === 0}
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
              disabled={readOnly || selectedCount === 0}
              onClick={() => applyToSelected(null)}
            >
              清除報更
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
              {WEEK_HEADERS.map((h) => (
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
            <Button type="button" variant="outline" disabled={readOnly} onClick={saveDraft}>
              儲存草稿
            </Button>
            {myStatus === "已提交" && !locked ? (
              <Button type="button" variant="outline" onClick={withdraw}>
                撤回修改
              </Button>
            ) : (
              <Button type="button" disabled={readOnly} onClick={submit}>
                提交
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {tab === "myDuty" ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">我的當值（2026年9月已發布示範）</h2>
          {duties.length === 0 ? (
            <p className="text-sm text-muted-foreground">本月尚未有已發布的當值。</p>
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
                    班時間 {formatSession(d)} · {myDutyDivisionLabel(d, teacherId)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <BulkCustomTimeDialog
        open={customOpen}
        count={selectedCount}
        onOpenChange={setCustomOpen}
        onSave={(start, end) => applyToSelected({ kind: "custom", start, end })}
      />
    </div>
  )
}
