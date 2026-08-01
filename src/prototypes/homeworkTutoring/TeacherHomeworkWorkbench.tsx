import { useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  MOCK_AVAIL_DATES,
  MOCK_DUTY_DAYS,
  MOCK_HOLIDAYS,
  MOCK_ROSTER_MONTH_LABEL,
  MOCK_SPLIT_NOTE,
  MOCK_SUBMIT_DEADLINE_NOTE,
  MOCK_TEACHERS,
  cycleDutySlot,
  dutyLabel,
  myDutyDays,
  type DutySlot,
  type RosterPublishStatus,
  type SubmitStatus,
} from "./mockData"
import { RoleTabNav, SubmitStatusTag } from "./sharedUi"

type TeacherTab = "submit" | "myDuty" | "holidays"

const TABS: { value: TeacherTab; label: string }[] = [
  { value: "submit", label: "功輔報更" },
  { value: "myDuty", label: "我的當值" },
  { value: "holidays", label: "放假日" },
]

export function TeacherHomeworkWorkbench({
  teacherId,
  avail,
  setAvail,
  submitStatus,
  setSubmitStatus,
  rosterPublishStatus,
}: {
  teacherId: string
  avail: Record<string, Record<string, DutySlot>>
  setAvail: Dispatch<SetStateAction<Record<string, Record<string, DutySlot>>>>
  submitStatus: Record<string, SubmitStatus>
  setSubmitStatus: Dispatch<SetStateAction<Record<string, SubmitStatus>>>
  rosterPublishStatus: RosterPublishStatus
}) {
  const { pushBanner } = useAppBanner()
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<TeacherTab>("submit")
  const teacher = MOCK_TEACHERS.find((t) => t.id === teacherId)
  const myStatus = submitStatus[teacherId] ?? "未交"
  const locked = rosterPublishStatus === "已發布"
  const row = avail[teacherId] ?? {}

  const duties = useMemo(() => myDutyDays(teacherId, MOCK_DUTY_DAYS), [teacherId])

  const cycle = (date: string) => {
    if (locked || myStatus === "已提交") {
      pushBanner({
        title: "無法修改",
        tone: "warning",
        message: locked
          ? "月工作表已發布，本月報更已鎖定。"
          : "已提交後請先「撤回修改」再改。",
      })
      return
    }
    setAvail((prev) => {
      const cur = prev[teacherId]?.[date] ?? "—"
      return {
        ...prev,
        [teacherId]: { ...(prev[teacherId] ?? {}), [date]: cycleDutySlot(cur) },
      }
    })
    if (myStatus === "未交") {
      setSubmitStatus((s) => ({ ...s, [teacherId]: "草稿" }))
    }
  }

  const saveDraft = () => {
    if (locked) return
    setSubmitStatus((s) => ({ ...s, [teacherId]: "草稿" }))
    pushBanner({ title: "已儲存", tone: "success", message: "草稿已儲存（沙盒記憶體）。" })
  }

  const submit = () => {
    if (locked) return
    setSubmitStatus((s) => ({ ...s, [teacherId]: "已提交" }))
    pushBanner({
      title: "已提交",
      tone: "success",
      message: `${MOCK_ROSTER_MONTH_LABEL} 報更已提交，行政可於編更進度查看。`,
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
        「老師檔期規劃」專科班頁。{MOCK_SPLIT_NOTE}
      </div>

      <RoleTabNav
        tabs={TABS}
        value={tab}
        onChange={setTab}
        isMobile={isMobile}
        ariaLabel="老師功輔分頁"
      />

      {tab === "submit" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{MOCK_ROSTER_MONTH_LABEL} 報更</h2>
            <SubmitStatusTag status={locked ? "已提交" : myStatus} />
            {locked ? (
              <Tag tone="info" size="sm">
                已鎖定
              </Tag>
            ) : null}
            <span className="text-sm text-muted-foreground">{teacher?.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{MOCK_SUBMIT_DEADLINE_NOTE}</p>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[320px] text-center text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  {MOCK_AVAIL_DATES.map((d) => (
                    <th key={d} className="px-2 py-2 font-medium">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {MOCK_AVAIL_DATES.map((d) => {
                    const slot = row[d] ?? "—"
                    return (
                      <td key={d} className="px-1 py-2">
                        <button
                          type="button"
                          disabled={locked || myStatus === "已提交"}
                          onClick={() => cycle(d)}
                          className={cn(
                            "w-full min-h-12 rounded-lg border px-1 py-2 text-xs font-medium sm:text-sm",
                            slot === "—"
                              ? "border-border bg-muted/30 text-muted-foreground"
                              : "border-primary/30 bg-primary/10 text-foreground",
                            (locked || myStatus === "已提交") && "opacity-70"
                          )}
                        >
                          {slot === "—" ? "不可" : slot}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">點格循環：全日 → 上節 → 下節 → 不可</p>

          <div
            className={cn(
              "flex flex-wrap gap-2",
              isMobile && "sticky bottom-0 z-10 border-t border-border bg-background/95 py-3 backdrop-blur"
            )}
          >
            <Button
              type="button"
              variant="outline"
              disabled={locked || myStatus === "已提交"}
              onClick={saveDraft}
            >
              儲存草稿
            </Button>
            {myStatus === "已提交" && !locked ? (
              <Button type="button" variant="outline" onClick={withdraw}>
                撤回修改
              </Button>
            ) : (
              <Button type="button" disabled={locked || myStatus === "已提交"} onClick={submit}>
                提交
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {tab === "myDuty" ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">我的當值（{MOCK_DUTY_DAYS[0] ? "2026年9月已發布示範" : ""}）</h2>
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
                    課室 {d.room} · 15:15–19:30 · {dutyLabel(d)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "holidays" ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">功輔放假日（唯讀）</h2>
          <ul className="space-y-2">
            {MOCK_HOLIDAYS.map((h) => (
              <li
                key={h.date}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm shadow-sm"
              >
                <div>
                  <p className="font-medium tabular-nums">{h.date}</p>
                  <p className="text-muted-foreground">{h.label}</p>
                </div>
                <Tag tone="default" size="sm">
                  功輔放假
                </Tag>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
