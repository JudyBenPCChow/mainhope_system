import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { payrollModeLabel } from "@/lib/payroll/modeLabel"
import {
  payrollAttendanceRecordsPath,
  payrollScheduleVerifyPath,
} from "@/lib/payroll/returnNav"
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
  teacherNotRolledCount,
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

type FilterKey = "all" | "anomaly" | "unreviewed" | "reviewed" | "sub" | "homework" | PayrollMode

type Props = {
  month: PayrollMonthMock
  status: PayrollRunStatus
  teachers: PayrollTeacherRow[]
  adjustments: ManualAdjustment[]
  reviewedIds: Set<string>
  reviewAudits: ReviewAudit[]
  excludedIds: Set<string>
  waitingRollCallIds: Set<string>
  teacherSubmits: TeacherSubmitState[]
  onToggleReviewed: (id: string) => void
  onToggleExcluded: (id: string) => void
  onMarkRollCallWaiting: (teacherId: string) => void
  onRemindRollcall: (target: LessonVerifyTarget) => void
  onStatusChange: (next: PayrollRunStatus, meta?: Partial<PayrollMonthMock>) => void
  onAddAdjustment: (adj: ManualAdjustment) => void
  onCodyChange: (hours: number | null, status: WfhMockState["status"]) => void
  onHomeworkHoursChange: (teacherId: string, save: { kind: "override"; hours: number } | { kind: "clear" }) => void
  onRecalc: () => void
  onSubmitTeacher: (teacherId: string) => void
  onSelectionChange?: (teacherId: string, lessonId: string | null) => void
  initialTeacherId?: string | null
  initialLessonId?: string | null
  monthSelect: ReactNode
  compactHeader?: boolean
}

const SUBMIT_CHECKS = [
  { id: "all", label: "已核對全部教師的逐節計薪明細（或已排除者）" },
  { id: "split", label: "已確認分成制原價池（Mark Yu、Christine Fan）" },
  { id: "sub", label: "已確認代堂歸屬（Liam ↔ Kenneth）" },
  { id: "homework", label: "已核對功輔時薪／Christine 功輔佣金（或確認本月無功輔）" },
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
  waitingRollCallIds,
  onToggleReviewed,
  onToggleExcluded,
  onMarkRollCallWaiting,
  onRemindRollcall,
  onStatusChange,
  onAddAdjustment,
  onCodyChange,
  onHomeworkHoursChange,
  onRecalc,
  teacherSubmits,
  onSubmitTeacher,
  onSelectionChange,
  initialTeacherId,
  initialLessonId,
  monthSelect,
  compactHeader = false,
}: Props) {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(initialTeacherId ?? "")
  const [highlightLessonIds, setHighlightLessonIds] = useState<Set<string>>(
    () => new Set(initialLessonId ? [initialLessonId] : [])
  )
  const [filter, setFilter] = useState<FilterKey>("all")
  const [page, setPage] = useState(0)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  /** 桌面：收合左欄名單，擴大右欄審核 */
  const [listCollapsed, setListCollapsed] = useState(false)
  const [workTab, setWorkTab] = useState("overview")
  const [detailTab, setDetailTab] = useState("summary")
  const [anomalyOpen, setAnomalyOpen] = useState(true)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [submitOpen, setSubmitOpen] = useState(false)
  const [diffOpen, setDiffOpen] = useState(false)
  const [submitChecks, setSubmitChecks] = useState<Record<string, boolean>>({})
  const [submitDeclare, setSubmitDeclare] = useState(false)
  const [codyHoursInput, setCodyHoursInput] = useState("")
  const [homeworkHoursInput, setHomeworkHoursInput] = useState("")
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
      if (filter === "homework") {
        return (
          (t.homework != null &&
            (t.homework.amount > 0 || t.homework.rosterHours > 0 || t.homework.overridden)) ||
          t.homeworkCommission != null
        )
      }
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

  useEffect(() => {
    if (selected?.homework) setHomeworkHoursInput(String(selected.homework.billedHours))
    else setHomeworkHoursInput("")
  }, [selected?.id, selected?.homework?.billedHours])

  const reviewedCount = teachers.filter((t) => reviewedIds.has(t.id)).length
  const unreviewedCount = teachers.length - reviewedCount
  const pendingAdj = adjustments.filter((a) => a.status === "pending")
  const unresolvedHard = [...blockedTeacherIds].filter((id) => !excludedIds.has(id))
  const canSubmit = editable && unresolvedHard.length === 0
  const allSubmitChecksOk = SUBMIT_CHECKS.every((c) => submitChecks[c.id])

  useEffect(() => {
    const first = [...highlightLessonIds][0]
    if (!first) return
    const t = window.setTimeout(() => {
      document.getElementById(`lesson-${first}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 80)
    return () => window.clearTimeout(t)
  }, [highlightLessonIds, selectedId])

  const selectTeacher = (id: string, lessonId?: string | null) => {
    setSelectedId(id)
    setHighlightLessonIds(new Set(lessonId ? [lessonId] : []))
    setMobileShowDetail(true)
    setWorkTab("review")
    if (lessonId) setDetailTab("lessons")
    onSelectionChange?.(id, lessonId ?? null)
  }

  const jumpToLesson = (teacherId: string, lessonId: string) => {
    selectTeacher(teacherId, lessonId)
  }

  const jumpToTeacherNotRolled = (teacher: PayrollTeacherRow) => {
    const ids = new Set<string>()
    for (const g of teacher.grades) {
      for (const c of g.classes) {
        for (const l of c.lessons) if (l.notRolled) ids.add(l.id)
      }
    }
    setSelectedId(teacher.id)
    setHighlightLessonIds(ids)
    setMobileShowDetail(true)
    setWorkTab("review")
    setDetailTab("lessons")
    onSelectionChange?.(teacher.id, [...ids][0] ?? null)
  }

  const openVerify = (target: LessonVerifyTarget) => {
    const sid = target.lesson.scheduleId ?? target.lesson.id
    navigate(
      payrollScheduleVerifyPath({
        scheduleId: sid,
        month: month.monthKey,
        teacherId: target.teacherId,
        lessonId: target.lesson.id,
      })
    )
  }

  const hardNotReady = readiness.some((r) => r.hard && !r.ok)

  const runRecalc = () => {
    void (async () => {
      const ok = await confirmDialog({
        title: "確定重新計算？",
        description: "版本會遞增，並清空本版所有「已審」標記，須重新審核。",
        confirmText: "重算",
        cancelText: "取消",
        tone: "warning",
      })
      if (!ok) return
      onRecalc()
      setDiffOpen(true)
      pushBanner({
        tone: "success",
        title: "已重新計算（示範）",
        message: "版本已遞增；已審標記已清空（須對新版重審）。",
      })
    })()
  }

  const codyEstimate =
    Number(codyHoursInput) > 0 ? Math.round(Number(codyHoursInput) * 60 * 100) / 100 : null

  const leftPane = (
    <aside className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">審閱名單</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="hidden h-7 px-2 text-xs lg:inline-flex"
          onClick={() => setListCollapsed(true)}
          aria-label="收合名單"
          title="收合名單，擴大右側明細"
        >
          <PanelLeftClose className="h-3.5 w-3.5" aria-hidden />
          收合
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["all", "全部"],
            ["unreviewed", "未審"],
            ["reviewed", "已審"],
            ["anomaly", "異常"],
            ["sub", "代堂"],
            ["分成制", "分成"],
            ["兼職 HC", "人頭"],
            ["homework", "功輔"],
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
        顯示 {filtered.length}/{teachers.length} 人 · 第 {safePage + 1}/{pageCount} 頁 · 異常優先
      </p>
      <StaggerList as="ul" className="space-y-1">
        {pageRows.map((row) => {
          const reviewed = reviewedIds.has(row.id)
          const hasAnomaly = row.anomalies.length > 0
          const blocked = blockedTeacherIds.has(row.id)
          const excluded = excludedIds.has(row.id)
          return (
            <StaggerItem key={row.id} as="li">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
                  row.id === selected?.id
                    ? "border-[var(--brand-primary)] bg-white ring-2 ring-[var(--brand-primary)]/25"
                    : "border-border bg-card",
                  !reviewed && hasAnomaly
                    ? "border-l-[3px] border-l-destructive"
                    : reviewed
                      ? "border-l-[3px] border-l-success"
                      : "border-l-[3px] border-l-warning"
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "min-w-0 flex-1 truncate text-left font-medium",
                    row.id === selected?.id && "font-semibold text-[var(--brand-primary)]"
                  )}
                  onClick={() => selectTeacher(row.id)}
                >
                  {row.name}
                  {excluded ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">（排除）</span>
                  ) : null}
                  {row.homework && (row.homework.billedHours > 0 || row.homework.overridden) ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      功輔 {row.homework.billedHours} 小時
                    </span>
                  ) : null}
                </button>
                {teacherNotRolledCount(row) > 0 ? (
                  <button
                    type="button"
                    className="shrink-0 text-[10px] font-medium text-warning underline-offset-2 hover:underline"
                    onClick={() => jumpToTeacherNotRolled(row)}
                  >
                    未點名 {teacherNotRolledCount(row)}
                  </button>
                ) : null}
                {waitingRollCallIds.has(row.id) && teacherNotRolled(row) ? (
                  <span className="shrink-0 text-[10px] text-muted-foreground">已請補點</span>
                ) : null}
                <button
                  type="button"
                  className="shrink-0"
                  disabled={!editable}
                  title={reviewed ? "點擊改回未審" : "點擊標記已審"}
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
                        : "僅表示你已核對；送核請用「結算」分頁「送出此人」。",
                    })
                  }}
                >
                  {reviewed ? (
                    <Tag tone="success" size="sm">
                      已審
                    </Tag>
                  ) : (
                    <Tag tone="warning" size="sm">
                      未審
                    </Tag>
                  )}
                </button>
                {blocked ? (
                  <label
                    className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={excluded}
                      disabled={!editable}
                      onChange={() => onToggleExcluded(row.id)}
                    />
                    排除
                  </label>
                ) : null}
              </div>
            </StaggerItem>
          )
        })}
      </StaggerList>
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
    </aside>
  )

  const rightPane = selected ? (
    <section id="payroll-teacher-detail" className="min-h-0 space-y-3">
      <div className="sticky top-0 z-[1] -mx-3 border-b border-border bg-background/95 px-3 pb-3 pt-1 backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground">薪酬明細 · 目前選中</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {listCollapsed ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="hidden h-7 px-2 text-xs lg:inline-flex"
                onClick={() => setListCollapsed(false)}
              >
                <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden />
                展開名單
              </Button>
            ) : null}
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
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-semibold text-white"
            aria-hidden
          >
            {selected.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("")}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold tracking-tight text-[var(--brand-primary)]">
              {selected.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Tag tone="default" size="sm">
                {payrollModeLabel(selected.mode)}
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
            </div>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5 text-right">
            <span className="text-lg font-bold tabular-nums">{formatHkd(selected.gross)}</span>
            <span className="text-xs text-muted-foreground">
              堂 {teacherLessonCount(selected)} · 班 {teacherClassCount(selected)} · 扣堂{" "}
              {teacherBillableHc(selected)}
            </span>
          </div>
        </div>
      </div>

      <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="summary">摘要</TabsTrigger>
          <TabsTrigger value="lessons">
            堂數
            {selected.anomalies.length > 0 ? (
              <span className="ml-1 text-[10px] text-warning">!</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="evidence">分成／證據</TabsTrigger>
          <TabsTrigger value="settle">結算</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-3">
          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <h3 className="text-sm font-semibold">薪酬來源摘要</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {selected.personalSplit ? (
                <li className="flex justify-between gap-2">
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => setDetailTab("evidence")}
                  >
                    個人分成 {Math.round(selected.personalSplit.rate * 100)}%
                  </button>
                  <span className="tabular-nums font-medium">
                    {formatHkd(selected.personalSplit.amount)}
                  </span>
                </li>
              ) : null}
              {selected.commissionPool ? (
                <li className="flex justify-between gap-2">
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => setDetailTab("evidence")}
                  >
                    {selected.commissionPool.label}
                  </button>
                  <span className="tabular-nums font-medium">
                    {formatHkd(selected.commissionPool.amount)}
                  </span>
                </li>
              ) : null}
              {selected.homework ? (
                <li className="flex justify-between gap-2">
                  <span>
                    功輔時薪 {selected.homework.billedHours} 小時 × ${selected.homework.rate}
                    {selected.homework.overridden ? "（已修正）" : ""}
                  </span>
                  <span className="tabular-nums font-medium">{formatHkd(selected.homework.amount)}</span>
                </li>
              ) : null}
              {selected.homeworkCommission ? (
                <li className="flex justify-between gap-2">
                  <span>
                    功輔佣金（報讀 {selected.homeworkCommission.enrolledCount} 人）
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatHkd(selected.homeworkCommission.amount)}
                  </span>
                </li>
              ) : null}
              {selected.modeStreams?.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => setDetailTab("evidence")}
                  >
                    {s.label}
                  </button>
                  <span className="tabular-nums font-medium">{formatHkd(s.amount)}</span>
                </li>
              ))}
              {selected.salaryEvidence ? (
                <li className="flex justify-between gap-2">
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => setDetailTab("evidence")}
                  >
                    固定月薪
                  </button>
                  <span className="tabular-nums font-medium">
                    {formatHkd(selected.salaryEvidence.amount)}
                  </span>
                </li>
              ) : null}
              {!selected.personalSplit &&
              !selected.commissionPool &&
              !selected.homework &&
              !selected.homeworkCommission &&
              !selected.modeStreams?.length &&
              !selected.salaryEvidence ? (
                <li className="flex justify-between gap-2">
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => setDetailTab("lessons")}
                  >
                    授課小計（見堂數）
                  </button>
                  <span className="tabular-nums font-medium">{formatHkd(selected.gross)}</span>
                </li>
              ) : null}
            </ul>
            {editable && selected.homework ? (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  編更 {selected.homework.rosterHours} 小時。財務可改本月合計工時（放假／惡劣天氣已當 0）。
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-muted-foreground">修正工時</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.25"
                      className="w-28"
                      value={homeworkHoursInput}
                      onChange={(e) => setHomeworkHoursInput(e.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const h = Number(homeworkHoursInput)
                      if (!Number.isFinite(h) || h < 0) {
                        pushBanner({
                          tone: "warning",
                          title: "請輸入有效時數",
                          message: "須為 0 或以上的數字。",
                        })
                        return
                      }
                      onHomeworkHoursChange(selected.id, { kind: "override", hours: h })
                    }}
                  >
                    儲存工時
                  </Button>
                  {selected.homework.overridden ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onHomeworkHoursChange(selected.id, { kind: "clear" })}
                    >
                      還原編更
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <p className="mt-3 border-t border-border pt-2 text-sm font-semibold tabular-nums">
              合計 {formatHkd(selected.gross)}
            </p>
            {selected.anomalies.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-warning">
                {selected.anomalies.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="lessons">
          <TeacherLessonStats
            teacher={selected}
            highlightLessonIds={highlightLessonIds}
            onVerify={openVerify}
            onRemindRollcall={onRemindRollcall}
            onJumpNotRolled={() => jumpToTeacherNotRolled(selected)}
          />
          {editable && teacherNotRolled(selected) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={waitingRollCallIds.has(selected.id)}
                onClick={() => onMarkRollCallWaiting(selected.id)}
              >
                標已請補點、等重算
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    payrollAttendanceRecordsPath({
                      month: month.monthKey,
                      teacherId: selected.id,
                    })
                  )
                }
              >
                開出席紀錄（該月）
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-3">
          <SalaryEvidencePanel teacher={selected} />
          <ModeStreamsPanel teacher={selected} />
          <div id="split-audit-anchor">
            <SplitAuditPanel teacher={selected} />
          </div>
          {!selected.salaryEvidence &&
          !selected.modeStreams?.length &&
          !selected.personalSplit &&
          !selected.commissionPool ? (
            <p className="text-sm text-muted-foreground">此人無分成／固定月薪證據面板；請睇堂數分頁。</p>
          ) : null}
        </TabsContent>

        <TabsContent value="settle" className="space-y-3">
          <TeacherPayFooter teacher={selected} />
          <div className="flex flex-wrap gap-2 pb-2">
            <Button
              type="button"
              variant="outline"
              disabled={pdfBusy}
              onClick={() => {
                void (async () => {
                  setPdfBusy(true)
                  try {
                    const filename = await downloadPayrollPayslipPdf(monthForSummary, [selected])
                    pushBanner({
                      tone: "success",
                      title: "已下載此人工資單 PDF",
                      message: filename,
                    })
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
        </TabsContent>
      </Tabs>
    </section>
  ) : (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground">薪酬明細</p>
      <p className="text-sm text-muted-foreground">喺左欄名單揀一位同事開始審核。</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 pb-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        {!compactHeader ? (
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
        ) : null}
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
        <div role="alert" className="rounded-xl border border-destructive/35 bg-destructive/5 px-3 py-2 text-sm">
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

      <Tabs value={workTab} onValueChange={setWorkTab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">本月概覽</TabsTrigger>
          <TabsTrigger value="review">
            逐人審核
            {unreviewedCount > 0 ? (
              <span className="ml-1 text-[10px] text-warning">{unreviewedCount}</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="adjust">調整與工時</TabsTrigger>
          <TabsTrigger value="submit">提交</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <div className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
            <p className="text-sm font-medium">建議流程</p>
            <p className="mt-1 text-sm text-muted-foreground">
              齊備檢查 → 逐人審核 → 調整／工時 → 提交
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hardNotReady ? (
                <Button type="button" size="sm" onClick={() => setAnomalyOpen(true)}>
                  先處理齊備／異常
                </Button>
              ) : unreviewedCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setFilter("unreviewed")
                    setWorkTab("review")
                  }}
                >
                  開始審核（未審 {unreviewedCount}）
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => setWorkTab("submit")}>
                  前往提交
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setWorkTab("review")}
              >
                打開逐人審核
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card px-3 py-3">
            <h2 className="text-sm font-semibold">齊備度</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              母名單 {roster.total} 人 · $0 {roster.zeroHour} 人
              {excludedIds.size > 0 ? ` · 排除 ${excludedIds.size}` : ""} · 已審{" "}
              {reviewedCount}/{teachers.length}
            </p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {readiness.map((r) => (
                <li
                  key={r.key}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs",
                    r.ok
                      ? "border-border bg-muted/20"
                      : r.hard
                        ? "border-destructive/45 bg-destructive/5"
                        : "border-warning/40 bg-warning/5"
                  )}
                >
                  <span className="font-medium">{r.label}</span>
                  {!r.ok ? (
                    <span className="ml-1 inline-block">
                      <Tag tone={r.hard ? "error" : "warning"} size="sm">
                        {r.hard ? "必須處理" : "建議處理"}
                      </Tag>
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-muted-foreground">{r.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <SummaryTile
              label="未審批"
              value={String(unreviewedCount)}
              hint="點此前往篩選"
              warn={unreviewedCount > 0}
              onClick={() => {
                setFilter("unreviewed")
                setWorkTab("review")
              }}
            />
            <SummaryTile
              label="已審批"
              value={String(reviewedCount)}
              hint={`${reviewedCount}/${teachers.length}`}
              onClick={() => {
                setFilter("reviewed")
                setWorkTab("review")
              }}
            />
            <SummaryTile
              label="異常"
              value={String(summary.anomalyCount)}
              hint={
                unresolvedHard.length > 0
                  ? `硬阻擋 ${unresolvedHard.length} 人`
                  : "點此篩選"
              }
              warn={summary.anomalyCount > 0}
              onClick={() => {
                setFilter("anomaly")
                setWorkTab("review")
              }}
            />
            <SummaryTile
              label="已送核"
              value={String(
                teacherSubmits.filter(
                  (s) => s.status === "submitted" || s.status === "accepted"
                ).length
              )}
              hint="前往提交分頁"
              onClick={() => setWorkTab("submit")}
            />
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
                          onRemindRollcall({
                            lesson: {
                              id: n.lessonId,
                              date: n.date,
                              startTime: "",
                              endTime: "",
                              billableHc: 0,
                              amount: 0,
                              presentStudents: [],
                              absentStudents: [],
                              notRolled: true,
                              scheduleId: n.lessonId,
                            },
                            className: n.className,
                            teacherId: n.teacherId,
                            teacherName: n.teacherName,
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
                        <li
                          key={`${t.id}-${msg}`}
                          className="rounded-md border border-border px-2 py-1.5"
                        >
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
              </ul>
            </details>
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-3">
          <div
            className={cn(
              "overflow-hidden rounded-xl border border-border lg:grid lg:items-stretch",
              listCollapsed
                ? "lg:grid-cols-[3.5rem_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(16rem,34%)_minmax(0,1fr)]"
            )}
          >
            {listCollapsed ? (
              <div className="hidden bg-brand-bg lg:flex lg:max-h-[calc(100svh-10rem)] lg:flex-col lg:items-center lg:gap-3 lg:border-r lg:border-border lg:px-1.5 lg:py-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => setListCollapsed(false)}
                  aria-label="展開名單"
                >
                  <PanelLeftOpen className="h-4 w-4" aria-hidden />
                </Button>
                <span
                  className="text-[11px] font-semibold tracking-wide text-muted-foreground"
                  style={{ writingMode: "vertical-rl" }}
                >
                  審閱名單
                </span>
                {unreviewedCount > 0 ? (
                  <Tag tone="warning" size="sm">
                    未審 {unreviewedCount}
                  </Tag>
                ) : (
                  <Tag tone="success" size="sm">
                    齊
                  </Tag>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "bg-brand-bg p-3 lg:max-h-[calc(100svh-10rem)] lg:overflow-y-auto lg:border-r lg:border-border",
                  mobileShowDetail ? "hidden lg:block" : "block"
                )}
              >
                {leftPane}
              </div>
            )}
            <div
              className={cn(
                "border-l-[3px] border-l-[var(--brand-primary)] bg-background p-3 lg:max-h-[calc(100svh-10rem)] lg:overflow-y-auto",
                mobileShowDetail ? "block" : "hidden lg:block"
              )}
            >
              {rightPane}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adjust" className="space-y-3">
          <div className="space-y-2 rounded-xl border border-border bg-card p-3 sm:p-4">
            <h2 className="text-sm font-semibold">Cody 在家工作時數</h2>
            <p className="text-xs text-muted-foreground">
              財務只可申報；核准由管理層處理。亦可喺「逐人審核」揀 Cody。
            </p>
            {editable ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">此月份唯讀。</p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-card p-3 sm:p-4">
            <h2 className="text-sm font-semibold">人手調整</h2>
            <p className="text-xs text-muted-foreground">
              待管理層核准 {pendingAdj.length} 項。申請可喺逐人「結算」分頁發起。
            </p>
            {adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">本月尚未有調整申請。</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {adjustments.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border px-3 py-2">
                    <p className="font-medium">
                      {a.teacherName}：{formatHkd(a.fromAmount)} → {formatHkd(a.toAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.status} · {a.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {editable && selected ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdjustAmount(selected.gross != null ? String(selected.gross) : "")
                  setAdjustReason("")
                  setAdjustOpen(true)
                }}
              >
                為目前選中同事申請調整
              </Button>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-3">
          <div className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
            <h2 className="text-sm font-semibold">提交前摘要</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                總薪酬 {formatHkd(summary.gross)} · 實發 {formatHkd(summary.net)}
              </li>
              <li>
                已審 {reviewedCount}/{teachers.length} · 硬阻擋未排除 {unresolvedHard.length} ·
                待調整 {pendingAdj.length}
              </li>
            </ul>
            {followUps.length > 0 ? (
              <div className="mt-2 rounded-md border border-warning/40 bg-warning/5 px-2 py-1.5 text-xs">
                <p className="font-medium">已排除待跟進</p>
                {followUps.map((f) => (
                  <p key={f.teacherId} className="text-muted-foreground">
                    {f.teacherName} → {f.handoffTo}
                  </p>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {canSubmit
                  ? `可提交全月 · 未審 ${unreviewedCount} 人（仍可提交）`
                  : `硬阻擋未排除 ${unresolvedHard.length} 人，無法全月提交`}
              </p>
              <Button type="button" disabled={!canSubmit} onClick={() => setSubmitOpen(true)}>
                <Send className="h-4 w-4" aria-hidden />
                提交全月核實
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
            <h2 className="text-sm font-semibold">
              單人送核佇列（
              {teacherSubmits.filter((s) => s.status === "submitted").length} 待管理層）
            </h2>
            {teacherSubmits.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                尚未單人送核。可喺逐人「結算」分頁送出。
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {teacherSubmits.map((s) => {
                  const t = teachers.find((x) => x.id === s.teacherId)
                  return (
                    <li
                      key={s.teacherId}
                      className="flex flex-wrap justify-between gap-2 rounded-md border border-border px-2 py-1.5"
                    >
                      <button
                        type="button"
                        className="font-medium underline-offset-2 hover:underline"
                        onClick={() => selectTeacher(s.teacherId)}
                      >
                        {t?.name ?? s.teacherId}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {s.status} · {s.submittedAt}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
          <Textarea
            className="min-h-[5rem]"
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
            <span>我已覆核以上項目，並對提交的數字負責。</span>
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
