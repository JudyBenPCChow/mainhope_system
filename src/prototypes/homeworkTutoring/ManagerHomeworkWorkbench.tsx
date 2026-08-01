import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { statusToTagTone } from "@/lib/statusTag"

import {
  MOCK_DUTY_DAYS,
  MOCK_ROSTER_MONTH_LABEL,
  MOCK_TEACHERS,
  countSubmitProgress,
  dutyLabel,
  unpaidFeeRows,
  type MockFeeRow,
  type MockStudent,
  type RosterPublishStatus,
  type SubmitStatus,
} from "./mockData"
import { RoleTabNav, SubmitStatusTag, SummaryTile } from "./sharedUi"

type MgrTab = "home" | "duty" | "progress" | "fees"

const TABS: { value: MgrTab; label: string }[] = [
  { value: "home", label: "監督首屏" },
  { value: "duty", label: "本月當值" },
  { value: "progress", label: "報更進度" },
  { value: "fees", label: "月費異常" },
]

export function ManagerHomeworkWorkbench({
  students,
  fees,
  submitStatus,
  rosterPublishStatus,
  onSwitchToAdmin,
}: {
  students: MockStudent[]
  fees: MockFeeRow[]
  submitStatus: Record<string, SubmitStatus>
  rosterPublishStatus: RosterPublishStatus
  onSwitchToAdmin: () => void
}) {
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<MgrTab>("home")
  const progress = useMemo(() => countSubmitProgress(submitStatus), [submitStatus])
  const unpaid = useMemo(() => unpaidFeeRows(students, fees), [students, fees])
  const dutyCovered = MOCK_DUTY_DAYS.filter((d) => d.mode !== "放假").length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        管理層視角：偏監督與異常關注，少做日常代填。需要完整操作時可切換至行政工作台。
      </p>

      <RoleTabNav
        tabs={TABS}
        value={tab}
        onChange={setTab}
        isMobile={isMobile}
        ariaLabel="管理層功輔分頁"
      />

      {tab === "home" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile
              label="報更齊交"
              value={progress.rateLabel}
              hint={`${progress.missing} 人未交 · ${progress.draft} 草稿`}
            />
            <SummaryTile label="本月未繳" value={String(unpaid.length)} />
            <SummaryTile
              label="當值覆蓋"
              value={`${dutyCovered} 日`}
              hint={rosterPublishStatus === "已發布" ? "十月編更已發布" : "十月編更仍為草稿"}
            />
            <SummaryTile
              label="需關注"
              value={String(progress.missing + unpaid.length)}
              hint="未交報更＋未繳"
            />
          </div>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">關注項</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {progress.missing > 0 ? (
                <li className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {MOCK_ROSTER_MONTH_LABEL} 尚有 {progress.missing} 位老師未交報更
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setTab("progress")}>
                    查看進度
                  </Button>
                </li>
              ) : null}
              {unpaid.length > 0 ? (
                <li className="flex flex-wrap items-center justify-between gap-2">
                  <span>有 {unpaid.length} 人未繳本月月費</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setTab("fees")}>
                    查看名單
                  </Button>
                </li>
              ) : null}
              {progress.missing === 0 && unpaid.length === 0 ? (
                <li>目前無緊急關注項（沙盒示範）。</li>
              ) : null}
            </ul>
          </section>

          <Button type="button" variant="outline" onClick={onSwitchToAdmin}>
            切換至行政工作台
          </Button>
        </div>
      ) : null}

      {tab === "duty" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">本月當值一覽（唯讀）</h2>
            <Tag
              tone={rosterPublishStatus === "已發布" ? "success" : "warning"}
              size="sm"
            >
              {rosterPublishStatus === "已發布" ? "九月示範已發布" : rosterPublishStatus}
            </Tag>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">日期</th>
                  <th className="px-3 py-2 font-medium">課室</th>
                  <th className="px-3 py-2 font-medium">當值</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DUTY_DAYS.map((d) => (
                  <tr key={d.date} className="border-t border-border">
                    <td className="px-3 py-2.5 tabular-nums">
                      {d.date}
                      <span className="text-muted-foreground">（{d.weekday}）</span>
                      {d.holiday ? (
                        <Tag tone="default" size="sm" className="ml-2">
                          功輔放假
                        </Tag>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">{d.room ?? "—"}</td>
                    <td className="px-3 py-2.5">{dutyLabel(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "progress" ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{MOCK_ROSTER_MONTH_LABEL} 報更進度</h2>
          <p className="text-xs text-muted-foreground">
            監督用列表。代填請切換行政工作台。
          </p>
          <ul className="space-y-2">
            {MOCK_TEACHERS.map((t) => {
              const st = submitStatus[t.id] ?? "未交"
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <span className="font-medium">{t.name}</span>
                  <SubmitStatusTag status={st} />
                </li>
              )
            })}
          </ul>
          <Button type="button" variant="outline" size="sm" onClick={onSwitchToAdmin}>
            前往行政代填／發布
          </Button>
        </div>
      ) : null}

      {tab === "fees" ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">月費異常（未收款）</h2>
          {unpaid.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前無未繳（沙盒）。</p>
          ) : (
            <ul className="space-y-2">
              {unpaid.map((row) => (
                <li
                  key={row.studentId}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm"
                >
                  <div>
                    <p className="font-medium">{row.student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.student.code} · 每週{row.student.plan} · 應繳 {row.amountLabel}
                    </p>
                  </div>
                  <Tag tone={statusToTagTone("未收款")} size="sm">
                    未收款
                  </Tag>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
