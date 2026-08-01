import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { cn } from "@/lib/utils"

import {
  MOCK_RECALC_DIFF,
  buildExcludedFollowUps,
  buildMonthReadiness,
  buildRosterSummary,
  formatHkd,
  hardBlockAnomalies,
  listNotRolledLessons,
  listSubstituteLessons,
  sortTeachersForDisplay,
  summarizePayrollMonth,
  teacherBillableHc,
  teacherClassCount,
  teacherLessonCount,
  teacherMomPct,
  type ManualAdjustment,
  type PayrollMonthMock,
  type PayrollMode,
  type PayrollRunStatus,
  type PayrollTeacherRow,
  type ReviewAudit,
  type TeacherSubmitState,
  type WfhMockState,
} from "./mockData"
import { downloadPayrollMockCsv } from "./mockCsv"
import { downloadPayrollPayslipPdf } from "./mockPayslipPdf"
import {
  ModeStreamsPanel,
  SalaryEvidencePanel,
  SplitAuditPanel,
  SummaryTile,
  TeacherLessonStats,
  TeacherPayFooter,
  VersionBar,
  statusTag,
  type LessonVerifyTarget,
} from "./payrollShared"

const PAGE_SIZE = 8

type FilterKey = "all" | "anomaly" | "unreviewed" | "reviewed" | "sub" | PayrollMode

type Props = {
  month: PayrollMonthMock
  status: PayrollRunStatus
  teachers: PayrollTeacherRow[]
  adjustments: ManualAdjustment[]
  reviewedIds: Set<string>
  reviewAudits: ReviewAudit[]
  excludedIds: Set<string>
  teacherSubmits: TeacherSubmitState[]
  onToggleReviewed: (id: string) => void
  onToggleExcluded: (id: string) => void
  onStatusChange: (next: PayrollRunStatus, meta?: Partial<PayrollMonthMock>) => void
  onAddAdjustment: (adj: ManualAdjustment) => void
  onCodyChange: (hours: number | null, status: WfhMockState["status"]) => void
  onRecalc: () => void
  onSubmitTeacher: (teacherId: string) => void
  monthSelect: ReactNode
}

const SUBMIT_CHECKS = [
  { id: "all", label: "已核對全部教師的逐節計薪明細（或已排除者）" },
  { id: "split", label: "已確認分成制原價池（Mark Yu、Christine Fan）" },
  { id: "sub", label: "已確認代堂歸屬（Liam ↔ Kenneth）" },
  { id: "cody", label: "已確認 Cody 工時申報／排除狀態" },
  { id: "mpf", label: "已確認 MPF（Mark、Christine、Sophie、Katie）" },
  { id: "excl", label: "已知悉已排除項目將由 Mark Yu 跟進" },
] as const

export function FinancePayrollView({
  month,
  status,
  teachers: rawTeachers,
  adjustments,
  reviewedIds,
  reviewAudits: _reviewAudits,
  excludedIds,
  onToggleReviewed,
  onToggleExcluded,
  onStatusChange,
  onAddAdjustment,
  onCodyChange,
  onRecalc,
  teacherSubmits,
  onSubmitTeacher,
  monthSelect,
}: Props) {
  const { pushBanner } = useAppBanner()
  const [selectedId, setSelectedId] = useState("billy")
  const [highlightLessonId, setHighlightLessonId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [page, setPage] = useState(0)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [readinessOpen, setReadinessOpen] = useState(true)
  const [anomalyOpen, setAnomalyOpen] = useState(true)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [submitOpen, setSubmitOpen] = useState(false)
  const [diffOpen, setDiffOpen] = useState(false)
  const [submitChecks, setSubmitChecks] = useState<Record<string, boolean>>({})
  const [submitDeclare, setSubmitDeclare] = useState(false)
  const [codyHoursInput, setCodyHoursInput] = useState("")
  const [verifyTarget, setVerifyTarget] = useState<LessonVerifyTarget | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [singleSubmitOpen, setSingleSubmitOpen] = useState(false)

  const teachers = useMemo(() => sortTeachersForDisplay(rawTeachers), [rawTeachers])
  const monthForSummary = useMemo(
    () => ({ ...month, teachers: rawTeachers }),
    [month, rawTeachers]
  )
  const summary = useMemo(() => summarizePayrollMonth(monthForSummary), [monthForSummary])
  const readiness = useMemo(() => buildMonthReadiness(rawTeachers), [rawTeachers])
  const roster = useMemo(() => buildRosterSummary(rawTeachers), [rawTeachers])
  const notRolled = useMemo(() => listNotRolledLessons(rawTeachers), [rawTeachers])
  const substitutes = useMemo(() => listSubstituteLessons(rawTeachers), [rawTeachers])
  const hardBlocks = useMemo(() => hardBlockAnomalies(rawTeachers), [rawTeachers])
  const followUps = useMemo(
    () => buildExcludedFollowUps(rawTeachers, excludedIds),
    [rawTeachers, excludedIds]
  )
  const editable = status === "草稿" || status === "財務審閱中"
  const selected = teachers.find((t) => t.id === selectedId) ?? teachers[0] ?? null

  const blockedTeacherIds = useMemo(() => {
    const ids = new Set<string>()
    for (const t of rawTeachers) {
      if (t.missingRate) ids.add(t.id)
      if (t.id === "cody" && !(t.wfh?.status === "approved" && (t.wfh.hours ?? 0) > 0)) {
        ids.add(t.id)
      }
      if (teacherNotRolled(t)) ids.add(t.id)
    }
    return ids
  }, [rawTeachers])

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      if (filter === "anomaly") return t.anomalies.length > 0
      if (filter === "unreviewed") return !reviewedIds.has(t.id)
      if (filter === "reviewed") return reviewedIds.has(t.id)
      if (filter === "sub") return substitutes.some((s) => s.teacherId === t.id)
      if (filter !== "all") return t.mode === filter
      return true
    })
  }, [teachers, filter, reviewedIds, substitutes])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    setPage(0)
  }, [filter])

  const reviewedCount = teachers.filter((t) => reviewedIds.has(t.id)).length
  const unreviewedCount = teachers.length - reviewedCount
  const pendingAdj = adjustments.filter((a) => a.status === "pending")
  const unresolvedHard = [...blockedTeacherIds].filter((id) => !excludedIds.has(id))
  const canSubmit = editable && unresolvedHard.length === 0
  const allSubmitChecksOk = SUBMIT_CHECKS.every((c) => submitChecks[c.id])

  useEffect(() => {
    if (!highlightLessonId) return
    const t = window.setTimeout(() => {
      document.getElementById(`lesson-${highlightLessonId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 80)
    return () => window.clearTimeout(t)
  }, [highlightLessonId, selectedId])

  const selectTeacher = (id: string, lessonId?: string | null) => {
    setSelectedId(id)
    setHighlightLessonId(lessonId ?? null)
    setMobileShowDetail(true)
  }

  const jumpToLesson = (teacherId: string, lessonId: string) => {
    selectTeacher(teacherId, lessonId)
  }

  const runRecalc = () => {
    onRecalc()
    setDiffOpen(true)
    pushBanner({
      tone: "success",
      title: "已重新計算（示範）",
      message: "版本已遞增；已審標記已清空（須對新版重審）。",
    })
  }

  const codyEstimate =
    Number(codyHoursInput) > 0 ? Math.round(Number(codyHoursInput) * 60 * 100) / 100 : null

  const leftPane = (
    <aside className="flex min-h-0 flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">審閱名單</p>
      <details
        open={readinessOpen}
        onToggle={(e) => setReadinessOpen((e.target as HTMLDetailsElement).open)}
        className="rounded-xl border border-border bg-card px-3 py-2"
      >
        <summary className="cursor-pointer text-sm font-medium">
          齊備度 · 已審 {reviewedCount}/{teachers.length}
          {unreviewedCount > 0 ? (
            <button
              type="button"
              className="ml-2 text-xs font-normal text-warning underline-offset-2 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                setFilter("unreviewed")
              }}
            >
              未審 {unreviewedCount}
            </button>
          ) : null}
        </summary>
        <ul className="mt-2 grid gap-1.5">
          {readiness.map((r) => (
            <li
              key={r.key}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs",
                r.ok ? "border-border bg-muted/20" : "border-warning/40 bg-warning/5"
              )}
            >
              <span className="font-medium">{r.label}</span>
              <span className="ml-1 text-muted-foreground">— {r.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">
          母名單 {roster.total} 人 · $0 {roster.zeroHour} 人
          {excludedIds.size > 0 ? ` · 排除 ${excludedIds.size}` : ""}
        </p>
      </details>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="text-left"
          onClick={() => setFilter("unreviewed")}
          aria-label="篩選未審批"
        >
          <SummaryTile
            label="未審批"
            value={String(unreviewedCount)}
            hint={`共 ${teachers.length} 人`}
            warn={unreviewedCount > 0}
          />
        </button>
        <button
          type="button"
          className="text-left"
          onClick={() => setFilter("reviewed")}
          aria-label="篩選已審批"
        >
          <SummaryTile
            label="已審批"
            value={String(reviewedCount)}
            hint={`${reviewedCount}/${teachers.length}`}
          />
        </button>
        <button
          type="button"
          className="text-left"
          onClick={() => setFilter("anomaly")}
          aria-label="篩選異常"
        >
          <SummaryTile
            label="異常"
            value={String(summary.anomalyCount)}
            hint={
              unresolvedHard.length > 0
                ? `硬阻擋 ${unresolvedHard.length} 人`
                : "可點擊篩選"
            }
            warn={summary.anomalyCount > 0}
          />
        </button>
        <button
          type="button"
          className="text-left"
          onClick={() => setFilter("all")}
          aria-label="顯示全部"
        >
          <SummaryTile
            label="已送核"
            value={String(
              teacherSubmits.filter((s) => s.status === "submitted" || s.status === "accepted")
                .length
            )}
            hint={`待管理層 ${teacherSubmits.filter((s) => s.status === "submitted").length}`}
          />
        </button>
      </div>

      {(hardBlocks.length > 0 || notRolled.length > 0 || substitutes.length > 0) && (
        <details
          open={anomalyOpen}
          onToggle={(e) => setAnomalyOpen((e.target as HTMLDetailsElement).open)}
          className="rounded-xl border border-warning/40 bg-card px-3 py-2"
        >
          <summary className="cursor-pointer text-sm font-medium">
            異常／待核對（{notRolled.length + hardBlocks.length}）
          </summary>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            {notRolled.map((n) => (
              <li key={n.lessonId} className="rounded-md border border-border px-2 py-1.5">
                <p className="font-medium text-foreground">
                  未點名：{n.teacherName} · {n.date}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => jumpToLesson(n.teacherId, n.lessonId)}
                  >
                    直達課節
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={!editable}
                    onClick={() =>
                      pushBanner({
                        tone: "success",
                        title: "已發送點名提醒（示範）",
                        message: `${n.teacherName} · ${n.className}（${n.date}）`,
                      })
                    }
                  >
                    提醒點名
                  </Button>
                </div>
              </li>
            ))}
            {rawTeachers
              .filter((t) => t.anomalies.length > 0)
              .flatMap((t) =>
                t.anomalies.map((msg) => {
                  const hit =
                    notRolled.find((n) => n.teacherId === t.id) ??
                    substitutes.find((s) => s.teacherId === t.id)
                  return (
                    <li key={`${t.id}-${msg}`} className="rounded-md border border-border px-2 py-1.5">
                      <p>
                        {t.name}：{msg}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => selectTeacher(t.id)}
                        >
                          檢視教師
                        </Button>
                        {hit ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => jumpToLesson(t.id, hit.lessonId)}
                          >
                            直達課節
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })
              )}
            {substitutes.slice(0, 4).map((s) => (
              <li key={`${s.lessonId}-sub`}>
                <button
                  type="button"
                  className="text-left underline-offset-2 hover:underline"
                  onClick={() => jumpToLesson(s.teacherId, s.lessonId)}
                >
                  代堂：{s.teacherName} · {s.date}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {followUps.length > 0 ? (
        <div className="rounded-xl border border-warning/40 bg-warning/5 px-3 py-2 text-xs">
          <p className="font-medium">已排除待跟進</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {followUps.map((f) => (
              <li key={f.teacherId}>
                {f.teacherName} → {f.handoffTo}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", "全部"],
              ["unreviewed", "未審"],
              ["reviewed", "已審"],
              ["anomaly", "異常"],
              ["sub", "代堂"],
              ["分成制", "分成"],
              ["兼職 HC", "HC"],
            ] as const
          ).map(([v, label]) => (
            <Button
              key={v}
              type="button"
              size="sm"
              className="h-7"
              variant={filter === v ? "default" : "outline"}
              onClick={() => setFilter(v)}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          顯示 {filtered.length}/{teachers.length} 人 · 第 {safePage + 1}/{pageCount} 頁
        </p>
        <p className="rounded-md border border-border bg-background/80 px-2 py-1.5 text-[11px] text-muted-foreground">
          「已審」＝已核對完此人薪酬。唔等於送交管理層；送核請用「送出此人」。
        </p>

        <ul className="space-y-1.5">
          {pageRows.map((row) => {
            const reviewed = reviewedIds.has(row.id)
            const hasAnomaly = row.anomalies.length > 0
            const blocked = blockedTeacherIds.has(row.id)
            const excluded = excludedIds.has(row.id)
            const sub = teacherSubmits.find((s) => s.teacherId === row.id)
            const mom = teacherMomPct(row)
            return (
              <li key={row.id}>
                <div
                  className={cn(
                    "rounded-lg border bg-card px-2.5 py-2 text-sm shadow-sm transition-colors",
                    row.id === selected?.id ? "border-info ring-1 ring-info/30" : "border-border",
                    !reviewed && hasAnomaly
                      ? "border-l-[3px] border-l-destructive"
                      : reviewed
                        ? "border-l-[3px] border-l-success"
                        : "border-l-[3px] border-l-warning"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectTeacher(row.id)}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{row.name}</span>
                        {reviewed ? (
                          <Tag tone="success" size="sm">
                            已審
                          </Tag>
                        ) : (
                          <Tag tone="warning" size="sm">
                            未審
                          </Tag>
                        )}
                        {hasAnomaly ? (
                          <Tag tone="warning" size="sm">
                            異常
                          </Tag>
                        ) : null}
                        {sub?.status === "submitted" ? (
                          <Tag tone="info" size="sm">
                            已送核
                          </Tag>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.mode} · {formatHkd(row.gross)}
                        {mom != null ? ` · ${mom > 0 ? "+" : ""}${mom}%` : ""}
                        {teacherLessonCount(row) > 0
                          ? ` · ${teacherLessonCount(row)} 堂／扣堂 ${teacherBillableHc(row)}`
                          : ""}
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        variant={reviewed ? "outline" : "default"}
                        disabled={!editable}
                        title={
                          reviewed
                            ? "取消：改回未審（本版審計紀錄會移除）"
                            : "確認：你已核對完此人薪酬明細"
                        }
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleReviewed(row.id)
                          pushBanner({
                            tone: reviewed ? "info" : "success",
                            title: reviewed
                              ? `已取消「${row.name}」已審`
                              : `已標記「${row.name}」為已審`,
                            message: reviewed
                              ? "此人重新計入未審批。"
                              : "僅表示你已核對；若要交管理層，請再用「送出此人」。",
                          })
                        }}
                      >
                        {reviewed ? "取消已審" : "標記已審"}
                      </Button>
                      {blocked ? (
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={excluded}
                            disabled={!editable}
                            onChange={() => onToggleExcluded(row.id)}
                          />
                          排除提交
                        </label>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            上一頁
          </Button>
          <span className="text-xs text-muted-foreground">
            {safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            下一頁
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </aside>
  )

  const rightPane = selected ? (
    <section id="payroll-teacher-detail" className="min-h-0 space-y-3">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">薪酬明細</p>
      <div className="sticky top-0 z-[1] -mx-1 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-1 py-2 backdrop-blur">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="lg:hidden"
          onClick={() => setMobileShowDetail(false)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          返回列表
        </Button>
        <h2 className="text-base font-semibold">{selected.name}</h2>
        <Tag tone="default" size="sm">
          {selected.mode}
        </Tag>
        {reviewedIds.has(selected.id) ? (
          <Tag tone="success" size="sm">
            已審
          </Tag>
        ) : (
          <Tag tone="warning" size="sm">
            未審
          </Tag>
        )}
        <div className="ml-auto flex flex-wrap gap-3 text-xs sm:text-sm">
          <span>
            堂 {teacherLessonCount(selected)} · 班 {teacherClassCount(selected)}
          </span>
          <span>扣堂 {teacherBillableHc(selected)}</span>
          <span className="font-semibold">{formatHkd(selected.gross)}</span>
        </div>
      </div>

      {selected.id === "cody" && editable ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <h3 className="text-sm font-semibold">Cody 在家工作時數</h3>
          <p className="text-xs text-warning">財務只可申報；核准由管理層處理。</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">時數</span>
              <Input
                type="number"
                className="w-28"
                value={codyHoursInput}
                onChange={(e) => setCodyHoursInput(e.target.value)}
              />
            </label>
            {codyEstimate != null ? (
              <p className="pb-2 text-sm tabular-nums text-muted-foreground">
                預估 {formatHkd(codyEstimate)}
              </p>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                const h = Number(codyHoursInput)
                if (!Number.isFinite(h) || h <= 0) {
                  pushBanner({
                    tone: "warning",
                    title: "請輸入有效時數",
                    message: "須為大於 0 的數字。",
                  })
                  return
                }
                onCodyChange(h, "submitted")
                pushBanner({
                  tone: "info",
                  title: "已提交工時予管理層核准",
                  message: "金額待核准後才計入。",
                })
              }}
            >
              提交工時予管理層核准
            </Button>
          </div>
        </div>
      ) : null}

      <SalaryEvidencePanel teacher={selected} />
      <ModeStreamsPanel teacher={selected} />
      <div id="split-audit-anchor">
        <SplitAuditPanel teacher={selected} />
      </div>
      <TeacherLessonStats
        teacher={selected}
        highlightLessonId={highlightLessonId}
        onVerify={setVerifyTarget}
        onRemindRollcall={(target) =>
          pushBanner({
            tone: "success",
            title: "已發送點名提醒（示範）",
            message: `${target.teacherName} · ${target.className}（${target.lesson.date}）`,
          })
        }
      />
      <TeacherPayFooter teacher={selected} />

      <div className="flex flex-wrap gap-2 pb-4">
        <Button
          type="button"
          variant="outline"
          disabled={pdfBusy}
          onClick={() => {
            void (async () => {
              setPdfBusy(true)
              try {
                const filename = await downloadPayrollPayslipPdf(monthForSummary, [selected])
                pushBanner({ tone: "success", title: "已下載此人工資單 PDF", message: filename })
              } catch {
                pushBanner({ tone: "error", title: "PDF 下載失敗", message: "請重試。" })
              } finally {
                setPdfBusy(false)
              }
            })()
          }}
        >
          <Download className="h-4 w-4" aria-hidden />
          工資單 PDF
        </Button>
        {editable ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAdjustAmount(selected.gross != null ? String(selected.gross) : "")
              setAdjustReason("")
              setAdjustOpen(true)
            }}
          >
            申請人手調整
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={
            (blockedTeacherIds.has(selected.id) && !excludedIds.has(selected.id)) ||
            teacherSubmits.find((s) => s.teacherId === selected.id)?.status === "submitted"
          }
          onClick={() => setSingleSubmitOpen(true)}
        >
          <Send className="h-4 w-4" aria-hidden />
          送出此人予管理層
        </Button>
        {editable ? (
          <Button
            type="button"
            variant={reviewedIds.has(selected.id) ? "outline" : "default"}
            onClick={() => onToggleReviewed(selected.id)}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {reviewedIds.has(selected.id) ? "取消已審" : "標記已審"}
          </Button>
        ) : null}
      </div>
    </section>
  ) : (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">薪酬明細</p>
      <p className="text-sm text-muted-foreground">喺名單揀一位同事，睇計薪細節。</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 pb-24">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">計糧工作台</h1>
            <Tag tone="info" size="sm">
              財務
            </Tag>
            {statusTag(status)}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {monthSelect}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!editable} onClick={runRecalc}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              重算
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const filename = downloadPayrollMockCsv(monthForSummary, "preview")
                pushBanner({ tone: "success", title: "已下載對帳 CSV", message: filename })
              }}
            >
              <Download className="h-4 w-4" aria-hidden />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pdfBusy}
              onClick={() => {
                void (async () => {
                  setPdfBusy(true)
                  try {
                    const filename = await downloadPayrollPayslipPdf(
                      monthForSummary,
                      rawTeachers.filter((t) => !excludedIds.has(t.id))
                    )
                    pushBanner({ tone: "success", title: "已下載工資單 PDF", message: filename })
                  } catch {
                    pushBanner({ tone: "error", title: "PDF 失敗", message: "請重試。" })
                  } finally {
                    setPdfBusy(false)
                  }
                })()
              }}
            >
              <Download className="h-4 w-4" aria-hidden />
              工資單
            </Button>
          </div>
        </div>
      </header>

      <VersionBar calc={month.calc} onViewDiff={() => setDiffOpen(true)} />

      {month.returnReason ? (
        <div className="rounded-xl border border-destructive/35 bg-destructive/5 px-3 py-2 text-sm">
          <p className="font-medium text-destructive">管理層已退回</p>
          <p className="text-muted-foreground">{month.returnReason}</p>
        </div>
      ) : null}

      {!editable ? (
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {status === "待管理層核實"
            ? `已提交核實（${month.submittedBy ?? "財務"} · 版本 #${month.calc?.version ?? "—"}）。`
            : "此月份已結算，唯讀。"}
        </div>
      ) : null}

      {/* 桌面：左右分欄（底色對比）；手機：列表／明細互斥 */}
      <div className="overflow-hidden rounded-xl border border-border lg:grid lg:grid-cols-[minmax(18rem,38%)_minmax(0,1fr)] lg:items-stretch">
        <div
          className={cn(
            "bg-brand-bg p-3 lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto lg:border-r lg:border-border",
            mobileShowDetail ? "hidden lg:block" : "block"
          )}
        >
          {leftPane}
        </div>
        <div
          className={cn(
            "border-l-[3px] border-l-[var(--brand-primary)] bg-background p-3 lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto",
            mobileShowDetail ? "block" : "hidden lg:block"
          )}
        >
          {rightPane}
        </div>
      </div>

      {pendingAdj.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          待管理層核准調整 {pendingAdj.length} 項
        </p>
      ) : null}

      {/* dialogs */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請人手調整</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selected?.name} · {formatHkd(selected?.gross)}
          </p>
          <Input
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            aria-invalid={adjustAmount !== "" && !Number.isFinite(Number(adjustAmount))}
            className={
              adjustAmount !== "" && !Number.isFinite(Number(adjustAmount))
                ? "border-destructive"
                : undefined
            }
          />
          <textarea
            className="min-h-[5rem] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="原因（必填）"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                const to = Number(adjustAmount)
                if (!selected || !Number.isFinite(to) || !adjustReason.trim()) {
                  pushBanner({
                    tone: "warning",
                    title: "請填妥金額與原因",
                    message: "調整後金額須為有效數字。",
                  })
                  return
                }
                onAddAdjustment({
                  id: `adj_${Date.now()}`,
                  teacherId: selected.id,
                  teacherName: selected.name,
                  fromAmount: selected.gross,
                  toAmount: to,
                  reason: adjustReason.trim(),
                  createdBy: "財務（示範）",
                  createdAt: new Date().toLocaleString("zh-HK"),
                  status: "pending",
                })
                setAdjustOpen(false)
                pushBanner({
                  tone: "success",
                  title: "已送出調整申請",
                  message: "待管理層核准。",
                })
              }}
            >
              送出申請
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={verifyTarget != null} onOpenChange={(o) => !o && setVerifyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>查證排程／點名表</DialogTitle>
          </DialogHeader>
          {verifyTarget ? (
            <div className="space-y-2 text-sm">
              <p>
                {verifyTarget.teacherName} · {verifyTarget.className}
              </p>
              <p className="text-muted-foreground">
                {verifyTarget.lesson.date} {verifyTarget.lesson.startTime}–
                {verifyTarget.lesson.endTime}
              </p>
              <p className="text-xs text-muted-foreground">
                正式版：/Schedule/{verifyTarget.lesson.scheduleId} 、 /Attendance
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" onClick={() => setVerifyTarget(null)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={singleSubmitOpen} onOpenChange={setSingleSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>送出單人予管理層</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selected?.name} · {formatHkd(selected?.gross)}。建議先下載工資單 PDF。
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSingleSubmitOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!selected) return
                if (!reviewedIds.has(selected.id)) onToggleReviewed(selected.id)
                onSubmitTeacher(selected.id)
                setSingleSubmitOpen(false)
                pushBanner({
                  tone: "success",
                  title: `已送出 ${selected.name}`,
                  message: "可切換至管理層查看佇列。",
                })
              }}
            >
              確認送出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>重算差異</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            版本 #{month.calc?.version}（{month.calc?.computedAt}）
            {month.calc?.previousVersion != null
              ? ` ← #${month.calc.previousVersion}`
              : ""}
          </p>
          <ul className="space-y-2 text-sm">
            {MOCK_RECALC_DIFF.map((d, i) => (
              <li key={i} className="rounded-lg border border-border px-3 py-2">
                <p className="font-medium">
                  {d.teacherName} — {d.lessonLabel}
                </p>
                <p className="text-muted-foreground">
                  {d.field}：{d.before} → {d.after}
                  {d.amountDelta !== 0
                    ? `（${d.amountDelta > 0 ? "+" : ""}${formatHkd(d.amountDelta)}）`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">審核狀態已重置，請重審受影響教師。</p>
          <DialogFooter>
            <Button type="button" onClick={() => setDiffOpen(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={submitOpen}
        onOpenChange={(o) => {
          setSubmitOpen(o)
          if (!o) {
            setSubmitDeclare(false)
            setSubmitChecks({})
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>確認提交管理層核實</DialogTitle>
          </DialogHeader>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              版本 #{month.calc?.version} · 截止 {month.calc?.dataCutoffAt}
            </li>
            <li>
              總薪酬 {formatHkd(summary.gross)} · 實發 {formatHkd(summary.net)}
            </li>
            <li>
              已審 {reviewedCount}/{teachers.length} · 排除 {followUps.length} · 待調整{" "}
              {pendingAdj.length}
            </li>
          </ul>
          <div className="space-y-2 rounded-lg border border-border px-3 py-2 text-sm">
            <p className="font-medium">提交前確認</p>
            {SUBMIT_CHECKS.map((c) => (
              <label key={c.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(submitChecks[c.id])}
                  onChange={(e) =>
                    setSubmitChecks((prev) => ({ ...prev, [c.id]: e.target.checked }))
                  }
                />
                <span>{c.label}</span>
              </label>
            ))}
            {followUps.map((f) => (
              <p key={f.teacherId} className="pl-6 text-xs text-muted-foreground">
                • {f.teacherName} — {f.reason}
              </p>
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={submitDeclare}
              onChange={(e) => setSubmitDeclare(e.target.checked)}
            />
            <span>
              本人（Cody Cheong）確認以上項目已如實核對；如有遺漏願承擔責任。
            </span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubmitOpen(false)}>
              返回
            </Button>
            <Button
              type="button"
              disabled={!submitDeclare || !allSubmitChecksOk}
              onClick={() => {
                onStatusChange("待管理層核實", {
                  submittedBy: "Cody Cheong（財務示範）",
                  submittedAt: new Date().toLocaleString("zh-HK"),
                  returnReason: undefined,
                })
                setSubmitOpen(false)
                pushBanner({
                  tone: "success",
                  title: "已提交予管理層核實",
                  message: "Mark Yu／Christine 將收到通知（示範）。",
                })
              }}
            >
              確認提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="sticky bottom-0 z-10 -mx-3 border-t border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {canSubmit
              ? `可提交 · 未審 ${unreviewedCount} 人`
              : `硬阻擋未排除 ${unresolvedHard.length} 人`}
          </p>
          <Button type="button" disabled={!canSubmit} onClick={() => setSubmitOpen(true)}>
            <Send className="h-4 w-4" aria-hidden />
            提交全月核實
          </Button>
        </div>
      </footer>
    </div>
  )
}

function teacherNotRolled(t: PayrollTeacherRow): boolean {
  for (const g of t.grades) {
    for (const c of g.classes) {
      for (const l of c.lessons) if (l.notRolled) return true
    }
  }
  return false
}
