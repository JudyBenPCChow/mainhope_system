import { useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { cn } from "@/lib/utils"

import {
  buildExcludedFollowUps,
  buildManagerSpotChecks,
  formatHkd,
  listSubstituteLessons,
  sortTeachersForDisplay,
  summarizePayrollMonth,
  teacherBillableHc,
  teacherClassCount,
  teacherLessonCount,
  teacherMomPct,
  type ManualAdjustment,
  type PayrollMonthMock,
  type PayrollRunStatus,
  type PayrollTeacherRow,
  type TeacherSubmitState,
  type WfhMockState,
} from "./mockData"
import { downloadPayrollMockCsv } from "./mockCsv"
import {
  ModeStreamsPanel,
  SalaryEvidencePanel,
  SplitAuditPanel,
  SummaryTile,
  TeacherLessonStats,
  TeacherPayFooter,
  VersionBar,
  statusTag,
} from "./payrollShared"

type Props = {
  month: PayrollMonthMock
  status: PayrollRunStatus
  teachers: PayrollTeacherRow[]
  adjustments: ManualAdjustment[]
  excludedIds: Set<string>
  teacherSubmits: TeacherSubmitState[]
  codyStatus: WfhMockState["status"]
  codyHours: number | null
  onStatusChange: (next: PayrollRunStatus, meta?: Partial<PayrollMonthMock>) => void
  onResolveAdjustment: (id: string, status: "approved" | "rejected", note?: string) => void
  onResolveTeacherSubmit: (
    teacherId: string,
    next: "accepted" | "returned",
    note?: string
  ) => void
  onCodyApprove: (hours: number) => void
  monthSelect: ReactNode
}

export function ManagerPayrollView({
  month,
  status,
  teachers: rawTeachers,
  adjustments,
  excludedIds,
  teacherSubmits,
  codyStatus,
  codyHours,
  onStatusChange,
  onResolveAdjustment,
  onResolveTeacherSubmit,
  onCodyApprove,
  monthSelect,
}: Props) {
  const { pushBanner } = useAppBanner()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDrill, setShowDrill] = useState(false)
  const [returnNote, setReturnNote] = useState("")
  const [spotDone, setSpotDone] = useState<Set<string>>(() => new Set())
  const [codyApproveHours, setCodyApproveHours] = useState("")

  const teachers = useMemo(() => sortTeachersForDisplay(rawTeachers), [rawTeachers])
  const monthForSummary = useMemo(
    () => ({ ...month, teachers: rawTeachers }),
    [month, rawTeachers]
  )
  const summary = useMemo(() => summarizePayrollMonth(monthForSummary), [monthForSummary])
  const anomalyRows = teachers.filter((t) => t.anomalies.length > 0)
  const pending = status === "待管理層核實"
  const settled = status === "已結算"
  const selected = selectedId ? (teachers.find((t) => t.id === selectedId) ?? null) : null
  const pendingAdj = adjustments.filter((a) => a.status === "pending")
  const subs = useMemo(() => listSubstituteLessons(rawTeachers), [rawTeachers])
  const followUps = useMemo(
    () => buildExcludedFollowUps(rawTeachers, excludedIds),
    [rawTeachers, excludedIds]
  )
  const spotChecks = useMemo(() => buildManagerSpotChecks(rawTeachers), [rawTeachers])
  const allSpotsDone = spotChecks.every((c) => spotDone.has(c.id))
  const codyNeedsApprove = codyStatus === "submitted" && (codyHours ?? 0) > 0
  const pendingTeacherSubs = teacherSubmits.filter((s) => s.status === "submitted")

  const overview = useMemo(
    () =>
      teachers.map((t) => ({
        id: t.id,
        name: t.name,
        mode: t.mode,
        lessons: teacherLessonCount(t),
        billableHc: teacherBillableHc(t),
        gross: t.gross,
        change: teacherMomPct(t),
        anomalies: t.anomalies,
        excluded: excludedIds.has(t.id),
        crossMode: Boolean(t.modeStreams?.length),
      })),
    [teachers, excludedIds]
  )

  return (
    <div className="flex flex-col gap-4 pb-24">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">計糧核實</h1>
            <Tag tone="default" size="sm">
              管理層
            </Tag>
            {statusTag(status)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            核准工時／調整、完成強制抽查後再結算。不可只看總額按核准。
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {monthSelect}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const filename = downloadPayrollMockCsv(monthForSummary, "formal")
              pushBanner({
                tone: "success",
                title: "已下載銀行格式 CSV（示範）",
                message: filename,
              })
            }}
          >
            <Download className="h-4 w-4" aria-hidden />
            匯出正式 CSV
          </Button>
        </div>
      </header>

      <VersionBar calc={month.calc} />

      <section
        className={cn(
          "rounded-xl border px-4 py-4 shadow-sm",
          pending
            ? "border-info/40 bg-info/5"
            : settled
              ? "border-border bg-card"
              : "border-warning/35 bg-warning/5"
        )}
      >
        {pending ? (
          <>
            <p className="text-sm font-medium text-foreground">待你核實 · {month.monthLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              財務 {month.submittedBy ?? "—"} 於 {month.submittedAt ?? "—"} 提交 · 版本 #
              {month.calc?.version ?? "—"}
              {excludedIds.size > 0 ? ` · 已排除 ${excludedIds.size} 人` : ""}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryTile label="總薪酬" value={formatHkd(summary.gross)} />
              <SummaryTile label="實發" value={formatHkd(summary.net)} />
              <SummaryTile label="僱員強積金" value={formatHkd(summary.employeeMpf)} />
              <SummaryTile
                label="待核准調整"
                value={String(pendingAdj.length)}
                warn={pendingAdj.length > 0}
              />
            </div>
          </>
        ) : settled ? (
          <>
            <p className="text-sm font-medium">已結算 · {month.monthLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              版本 #{month.calc?.version} · 示範月份唯讀；已排除項仍列於下方。
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">財務尚未提交</p>
            <p className="mt-1 text-sm text-muted-foreground">
              目前狀態：{status}。可先核准已申報的 Cody 工時，或切換財務完成提交。
            </p>
          </>
        )}
      </section>

      {pendingTeacherSubs.length > 0 || teacherSubmits.length > 0 ? (
        <section className="space-y-2 rounded-xl border border-info/40 bg-card px-3 py-3 sm:px-4">
          <h2 className="text-sm font-medium">
            單人送核佇列（{pendingTeacherSubs.length} 待核實）
          </h2>
          <p className="text-xs text-muted-foreground">
            財務可逐老師送核；你可先收妥已送者，無需等全月一次提交。
          </p>
          <ul className="space-y-2">
            {teacherSubmits.map((s) => {
              const t = teachers.find((x) => x.id === s.teacherId)
              if (!t) return null
              return (
                <li
                  key={s.teacherId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <button
                      type="button"
                      className="font-medium underline-offset-2 hover:underline"
                      onClick={() => {
                        setSelectedId(t.id)
                        setShowDrill(true)
                      }}
                    >
                      {t.name}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {formatHkd(t.gross)} · {s.submittedBy} · {s.submittedAt}
                      {s.status === "accepted"
                        ? " · 已收下"
                        : s.status === "returned"
                          ? ` · 已退回${s.returnNote ? `：${s.returnNote}` : ""}`
                          : " · 待核實"}
                    </p>
                  </div>
                  {s.status === "submitted" ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onResolveTeacherSubmit(s.teacherId, "accepted")
                          pushBanner({
                            tone: "success",
                            title: `已收下 ${t.name}`,
                            message: "可繼續核實其他人。",
                          })
                        }}
                      >
                        收下此人
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onResolveTeacherSubmit(
                            s.teacherId,
                            "returned",
                            "請補齊點名／重核後再送"
                          )
                          pushBanner({
                            tone: "info",
                            title: `已退回 ${t.name}`,
                            message: "財務可修正後再單人送核。",
                          })
                        }}
                      >
                        退回財務
                      </Button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {followUps.length > 0 ? (
        <section className="rounded-xl border border-warning/40 bg-warning/5 px-3 py-3 sm:px-4">
          <h2 className="text-sm font-medium">已排除待跟進（不因提交而消失）</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {followUps.map((f) => (
              <li key={f.teacherId}>
                {f.teacherName}：{f.reason} → 移交 {f.handoffTo}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {codyNeedsApprove || codyStatus === "approved" ? (
        <section className="space-y-2 rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
          <h2 className="text-sm font-medium">Cody 工時核准（職責分離）</h2>
          {codyStatus === "approved" ? (
            <p className="text-sm text-muted-foreground">
              已核准 {codyHours} 小時 · {formatHkd((codyHours ?? 0) * 60)}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                財務已申報 {codyHours} 小時，待你核准（Cody 本人不可核准）。
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-muted-foreground">確認時數</span>
                  <Input
                    type="number"
                    className="w-32"
                    value={codyApproveHours || String(codyHours ?? "")}
                    onChange={(e) => setCodyApproveHours(e.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  onClick={() => {
                    const h = Number(codyApproveHours || codyHours)
                    if (!Number.isFinite(h) || h <= 0) {
                      pushBanner({
                        tone: "warning",
                        title: "時數無效",
                        message: "請確認大於 0。",
                      })
                      return
                    }
                    onCodyApprove(h)
                    setSpotDone((prev) => new Set(prev).add("spot-cody-wfh"))
                    pushBanner({
                      tone: "success",
                      title: "已核准 Cody 工時",
                      message: `${h} 小時已計入總薪酬。`,
                    })
                  }}
                >
                  核准並計入
                </Button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {pendingAdj.length > 0 ? (
        <section className="space-y-2 rounded-xl border border-info/40 bg-card px-3 py-3 sm:px-4">
          <h2 className="text-sm font-medium">人手調整待核准（{pendingAdj.length}）</h2>
          <ul className="space-y-3">
            {pendingAdj.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm"
              >
                <p className="font-medium">
                  {a.teacherName}：{formatHkd(a.fromAmount)} → {formatHkd(a.toAmount)}
                </p>
                <p className="mt-1 text-muted-foreground">{a.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.createdBy} · {a.createdAt}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!pending && status !== "財務審閱中"}
                    onClick={() => {
                      onResolveAdjustment(a.id, "approved")
                      pushBanner({
                        tone: "success",
                        title: "已核准調整",
                        message: `${a.teacherName} 總薪酬已更新為 ${formatHkd(a.toAmount)}`,
                      })
                    }}
                  >
                    核准
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!pending && status !== "財務審閱中"}
                    onClick={() => {
                      onResolveAdjustment(a.id, "rejected", "管理層退回調整（示範）")
                      pushBanner({
                        tone: "info",
                        title: "已拒絕調整",
                        message: a.teacherName,
                      })
                    }}
                  >
                    拒絕
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pending ? (
        <section className="space-y-2 rounded-xl border border-info/40 bg-card px-3 py-3 sm:px-4">
          <h2 className="text-sm font-medium">
            強制抽查（{spotDone.size}/{spotChecks.length}）— 完成後方可結算
          </h2>
          <ul className="space-y-2">
            {spotChecks.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  className="text-left font-medium underline-offset-2 hover:underline"
                  onClick={() => {
                    setSelectedId(c.teacherId)
                    setShowDrill(true)
                    window.setTimeout(() => {
                      document
                        .getElementById("manager-teacher-detail")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                      document
                        .getElementById("split-audit-anchor")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }, 80)
                  }}
                >
                  {c.label}
                </button>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={spotDone.has(c.id)}
                    onChange={() =>
                      setSpotDone((prev) => {
                        const next = new Set(prev)
                        if (next.has(c.id)) next.delete(c.id)
                        else next.add(c.id)
                        return next
                      })
                    }
                  />
                  已抽查確認
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {anomalyRows.length > 0 && (pending || !settled) ? (
        <section className="rounded-xl border border-warning/40 bg-card px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
            財務標註仍須注意（{anomalyRows.length} 人）
            {subs.length > 0 ? ` · 代堂 ${subs.length} 節` : ""}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {anomalyRows.flatMap((t) =>
              t.anomalies.map((msg) => (
                <li key={`${t.id}-${msg}`}>
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => {
                      setSelectedId(t.id)
                      setShowDrill(true)
                    }}
                  >
                    {t.name}：{msg}
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">同事薪酬摘要</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[40rem] table-fixed text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">同事</th>
                <th className="px-3 py-2.5 font-medium">模式</th>
                <th className="px-3 py-2.5 font-medium">堂數</th>
                <th className="px-3 py-2.5 font-medium">扣堂</th>
                <th className="px-3 py-2.5 font-medium">總薪酬</th>
                <th className="px-3 py-2.5 font-medium">較上月</th>
                <th className="px-3 py-2.5 font-medium">注意</th>
              </tr>
            </thead>
            <tbody>
              {overview.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "cursor-pointer border-b border-border last:border-0 hover:bg-muted/30",
                    selectedId === row.id ? "bg-info/5" : null,
                    row.excluded ? "opacity-60" : null
                  )}
                  onClick={() => {
                    setSelectedId(row.id)
                    setShowDrill(false)
                  }}
                >
                  <td className="px-3 py-2.5 font-medium">
                    {row.name}
                    {row.excluded ? (
                      <span className="ml-1 text-xs text-muted-foreground">（排除）</span>
                    ) : null}
                    {row.gross === 0 ? (
                      <span className="ml-1 text-xs text-muted-foreground">$0</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.mode}
                    {row.crossMode ? (
                      <span className="block text-[10px] text-info">跨模式</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{row.lessons || "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold">
                    {row.lessons > 0 ? row.billableHc : "—"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold">
                    {formatHkd(row.gross)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                    {row.change == null ? "—" : `${row.change > 0 ? "+" : ""}${row.change}%`}
                  </td>
                  <td className="px-3 py-2.5">
                    {row.anomalies.length > 0 ? (
                      <Tag tone="warning" size="sm">
                        有
                      </Tag>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section
          id="manager-teacher-detail"
          className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm scroll-mt-24"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">{selected.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selected.mode} · 堂 {teacherLessonCount(selected)} · 班{" "}
                {teacherClassCount(selected)} · {formatHkd(selected.gross)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDrill((v) => !v)}
            >
              {showDrill ? "收合堂數明細" : "展開堂數明細（抽查）"}
            </Button>
          </div>
          <SalaryEvidencePanel teacher={selected} />
          <ModeStreamsPanel teacher={selected} />
          <div id="split-audit-anchor">
            <SplitAuditPanel teacher={selected} />
          </div>
          {showDrill ? (
            <>
              <TeacherLessonStats teacher={selected} compact={false} />
              <TeacherPayFooter teacher={selected} />
            </>
          ) : (
            <TeacherLessonStats teacher={selected} compact />
          )}
        </section>
      ) : null}

      {pending ? (
        <section className="space-y-2 rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              退回財務時必填原因
            </span>
            <textarea
              className="min-h-[4.5rem] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="例：Billy 未點名須補齊後再提交"
            />
          </label>
        </section>
      ) : null}

      <footer className="sticky bottom-0 z-10 -mx-3 border-t border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {pending
              ? !allSpotsDone
                ? "請先完成全部強制抽查"
                : pendingAdj.length > 0
                  ? "尚有調整未處理 — 建議先核准／拒絕再結算"
                  : codyNeedsApprove
                    ? "Cody 工時待核准"
                    : "可核實結算或退回"
              : settled
                ? "已結算（示範唯讀）"
                : "尚無可核實的提交"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={!pending}
              onClick={() => {
                if (!returnNote.trim()) {
                  pushBanner({
                    tone: "warning",
                    title: "請填寫退回原因",
                    message: "管理層退回時必須說明原因。",
                  })
                  return
                }
                onStatusChange("財務審閱中", {
                  returnReason: returnNote.trim(),
                  submittedBy: undefined,
                  submittedAt: undefined,
                })
                setReturnNote("")
                setSpotDone(new Set())
                pushBanner({
                  tone: "info",
                  title: "已退回財務",
                  message: "可切換至財務工作台查看。",
                })
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              退回財務
            </Button>
            <Button
              type="button"
              className="flex-1 sm:flex-none"
              disabled={!pending || !allSpotsDone || codyNeedsApprove}
              onClick={() => {
                onStatusChange("已結算", { returnReason: undefined })
                pushBanner({
                  tone: "success",
                  title: "已核實並結算",
                  message: `版本 #${month.calc?.version} 已凍結（示範）。`,
                })
              }}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              核實並結算
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
