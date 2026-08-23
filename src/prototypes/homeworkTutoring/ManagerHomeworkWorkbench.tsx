import { useMemo } from "react"

import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"

import {
  MOCK_DUTY_DAYS,
  MOCK_ROSTER_MONTH_LABEL,
  MOCK_SUBJECT_TEACHERS,
  countSubmitProgress,
  formatSession,
  teacherName,
  unpaidFeeRows,
  type AllTeacherSubmitStatus,
  type MockFeeRow,
  type MockStudent,
  type MockTeacher,
  type RosterPublishStatus,
} from "./mockData"
import type { ManagerPageId } from "./sandboxNav"
import { SubmitStatusTag, SummaryTile } from "./sharedUi"

export function ManagerHomeworkWorkbench({
  tab,
  onTabChange,
  students,
  fees,
  submitStatus,
  rosterPublishStatus,
  hwTeachers,
  hwAccessIds,
  onToggleHwAccess,
  onSwitchToAdmin,
}: {
  tab: ManagerPageId
  onTabChange: (tab: ManagerPageId) => void
  students: MockStudent[]
  fees: MockFeeRow[]
  submitStatus: AllTeacherSubmitStatus
  rosterPublishStatus: RosterPublishStatus
  hwTeachers: MockTeacher[]
  hwAccessIds: ReadonlySet<string>
  onToggleHwAccess: (teacherId: string, next: boolean) => void
  onSwitchToAdmin?: () => void
}) {
  const progress = useMemo(
    () => countSubmitProgress(submitStatus, hwTeachers),
    [submitStatus, hwTeachers]
  )
  const unpaid = useMemo(() => unpaidFeeRows(students, fees), [students, fees])
  const dutyCovered = MOCK_DUTY_DAYS.filter((d) => !d.holiday).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        管理層視角：偏監督與異常關注，少做日常代填。
      </p>

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
                  <Button type="button" size="sm" variant="outline" onClick={() => onTabChange("progress")}>
                    查看進度
                  </Button>
                </li>
              ) : null}
              {unpaid.length > 0 ? (
                <li className="flex flex-wrap items-center justify-between gap-2">
                  <span>有 {unpaid.length} 人未繳本月月費</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => onTabChange("fees")}>
                    查看名單
                  </Button>
                </li>
              ) : null}
              {progress.missing === 0 && unpaid.length === 0 ? (
                <li>目前無緊急關注項（沙盒示範）。</li>
              ) : null}
            </ul>
          </section>

          {onSwitchToAdmin ? (
            <Button type="button" variant="outline" onClick={onSwitchToAdmin}>
              切換至行政工作台
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === "duty" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">本月當值一覽（唯讀）</h2>
            <Tag tone={statusToTagTone(rosterPublishStatus)} size="sm">
              {rosterPublishStatus === "已發布" ? "九月示範已發布" : rosterPublishStatus}
            </Tag>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">日期</th>
                  <th className="px-3 py-2 font-medium">班時間</th>
                  <th className="px-3 py-2 font-medium">中學部</th>
                  <th className="px-3 py-2 font-medium">小學部</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DUTY_DAYS.map((d) => (
                  <tr key={d.date} className="border-t border-border">
                    <td className="px-3 py-2.5 tabular-nums">
                      {d.date}
                      <span className="text-muted-foreground">（{d.weekday}）</span>
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
                      {d.holiday
                        ? "—"
                        : `${teacherName(d.secondaryTeacherId)} · ${d.secondaryRoom ?? "—"}`}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.holiday
                        ? "—"
                        : `${teacherName(d.primaryTeacherId)} · ${d.primaryRoom ?? "—"}`}
                    </td>
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
            老師只報一次更；中／小學由行政分配。代填請切換行政工作台。
          </p>
          <ul className="space-y-2">
            {hwTeachers.map((t) => {
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
          {hwTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚未剔選任何有功課輔導班入口的老師。</p>
          ) : null}
          {onSwitchToAdmin ? (
            <Button type="button" variant="outline" size="sm" onClick={onSwitchToAdmin}>
              前往行政代填／發布
            </Button>
          ) : null}
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
                  <div className="flex shrink-0 items-center gap-2">
                    <Tag tone={statusToTagTone(row.status)} size="sm">
                      未收款
                    </Tag>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link
                        to={`/Payments?studentId=${encodeURIComponent(row.studentId)}&mode=receive`}
                      >
                        收款
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "access" ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">功課輔導側欄入口</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              剔選專科老師。獲選者登入後，系統側欄會出現一級「功課輔導」，打開後有功輔報更、我的當值。未剔選者側欄不顯示。沙盒即時生效；尚未寫入正式側欄。
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            已剔選 {hwAccessIds.size}／{MOCK_SUBJECT_TEACHERS.length} 位
          </p>
          <ul className="space-y-2">
            {MOCK_SUBJECT_TEACHERS.map((t) => {
              const checked = hwAccessIds.has(t.id)
              return (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => onToggleHwAccess(t.id, next)}
                      aria-label={`${t.name}可在側欄進入功課輔導`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">專科 · {t.subject}</p>
                    </div>
                    <Tag
                      tone={statusToTagTone(checked ? "側欄有功課輔導" : "無入口")}
                      size="sm"
                    >
                      {checked ? "側欄有功課輔導" : "無入口"}
                    </Tag>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
