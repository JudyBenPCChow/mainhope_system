import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  CheckCircle2,
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
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { cn } from "@/lib/utils"

import {
  buildMonthReadiness,
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
  teacherPresentTotal,
  type ManualAdjustment,
  type PayrollMonthMock,
  type PayrollMode,
  type PayrollRunStatus,
  type PayrollTeacherRow,
  type WfhMockState,
} from "./mockData"
import { downloadPayrollMockCsv } from "./mockCsv"
import {
  SplitAuditPanel,
  SummaryTile,
  TeacherLessonStats,
  TeacherPayFooter,
  statusTag,
} from "./payrollShared"

type Props = {
  month: PayrollMonthMock
  status: PayrollRunStatus
  teachers: PayrollTeacherRow[]
  adjustments: ManualAdjustment[]
  reviewedIds: Set<string>
  excludedIds: Set<string>
  onToggleReviewed: (id: string) => void
  onToggleExcluded: (id: string) => void
  onStatusChange: (next: PayrollRunStatus, meta?: Partial<PayrollMonthMock>) => void
  onAddAdjustment: (adj: ManualAdjustment) => void
  onCodyChange: (hours: number | null, status: WfhMockState["status"]) => void
  monthSelect: ReactNode
}

export function FinancePayrollView({
  month,
  status,
  teachers: rawTeachers,
  adjustments,
  reviewedIds,
  excludedIds,
  onToggleReviewed,
  onToggleExcluded,
  onStatusChange,
  onAddAdjustment,
  onCodyChange,
  monthSelect,
}: Props) {
  const { pushBanner } = useAppBanner()
  const [selectedId, setSelectedId] = useState("billy")
  const [highlightLessonId, setHighlightLessonId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "anomaly" | "unreviewed" | "sub" | PayrollMode>("all")
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [submitOpen, setSubmitOpen] = useState(false)
  const [codyHoursInput, setCodyHoursInput] = useState("")
  const [recalcNote, setRecalcNote] = useState<string | null>(null)

  const teachers = useMemo(() => sortTeachersForDisplay(rawTeachers), [rawTeachers])
  const monthForSummary = useMemo(
    () => ({ ...month, teachers: rawTeachers }),
    [month, rawTeachers]
  )
  const summary = useMemo(() => summarizePayrollMonth(monthForSummary), [monthForSummary])
  const readiness = useMemo(() => buildMonthReadiness(rawTeachers), [rawTeachers])
  const notRolled = useMemo(() => listNotRolledLessons(rawTeachers), [rawTeachers])
  const substitutes = useMemo(() => listSubstituteLessons(rawTeachers), [rawTeachers])
  const hardBlocks = useMemo(() => hardBlockAnomalies(rawTeachers), [rawTeachers])
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
      if (filter === "sub") {
        return substitutes.some((s) => s.teacherId === t.id)
      }
      if (filter !== "all") return t.mode === filter
      return true
    })
  }, [teachers, filter, reviewedIds, substitutes])

  const reviewedCount = teachers.filter((t) => reviewedIds.has(t.id)).length
  const pendingAdj = adjustments.filter((a) => a.status === "pending")

  const unresolvedHard = [...blockedTeacherIds].filter((id) => !excludedIds.has(id))
  const canSubmit = editable && unresolvedHard.length === 0

  useEffect(() => {
    if (!highlightLessonId) return
    const el = document.getElementById(`lesson-${highlightLessonId}`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightLessonId, selectedId])

  const jumpToLesson = (teacherId: string, lessonId: string) => {
    setSelectedId(teacherId)
    setHighlightLessonId(lessonId)
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">計糧工作台</h1>
            <Tag tone="info" size="sm">
              財務
            </Tag>
            {statusTag(status)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            先清齊備度與異常，逐人核對後提交管理層。不可直接結算。
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {monthSelect}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={!editable}
              onClick={() => {
                setRecalcNote(
                  `示範重算：未點名 ${notRolled.length} 節；代堂 ${substitutes.length} 節；異常 ${hardBlocks.length} 項硬阻擋相關。`
                )
                pushBanner({
                  tone: "success",
                  title: "已重新計算（示範）",
                  message: "正式版會對照最新點名重算並顯示差額。",
                })
              }}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              重新計算
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => {
                const filename = downloadPayrollMockCsv(monthForSummary, "preview")
                pushBanner({
                  tone: "success",
                  title: "已下載對帳 CSV（示範）",
                  message: filename,
                })
              }}
            >
              <Download className="h-4 w-4" aria-hidden />
              對帳 CSV
            </Button>
          </div>
        </div>
      </header>

      {month.returnReason ? (
        <div className="rounded-xl border border-destructive/35 bg-destructive/5 px-3 py-3 text-sm sm:px-4">
          <p className="font-medium text-destructive">管理層已退回</p>
          <p className="mt-1 text-muted-foreground">{month.returnReason}</p>
        </div>
      ) : null}

      {!editable ? (
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground sm:px-4">
          {status === "待管理層核實"
            ? `已提交核實（${month.submittedBy ?? "財務"} · ${month.submittedAt ?? "—"}）。本頁暫為唯讀。`
            : "此月份已結算，財務工作台唯讀。"}
        </div>
      ) : null}

      {recalcNote ? (
        <p className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {recalcNote}
        </p>
      ) : null}

      {/* 齊備度 */}
      <section className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">本月齊備度</h2>
          <p className="text-xs text-muted-foreground">
            已審 {reviewedCount}/{teachers.length}
            {excludedIds.size > 0 ? ` · 排除提交 ${excludedIds.size} 人` : ""}
          </p>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {readiness.map((r) => (
            <li
              key={r.key}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                r.ok ? "border-border bg-muted/20" : "border-warning/40 bg-warning/5"
              )}
            >
              <div className="flex items-center gap-2">
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
                )}
                <span className="font-medium">{r.label}</span>
                {r.hard && !r.ok ? (
                  <Tag tone="error" size="sm">
                    硬
                  </Tag>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryTile label="總薪酬" value={formatHkd(summary.gross)} hint={month.monthLabel} />
        <SummaryTile
          label="僱員強積金"
          value={formatHkd(summary.employeeMpf)}
          hint={`僱主另供 ${formatHkd(summary.employerMpf)}`}
        />
        <SummaryTile label="實發總額" value={formatHkd(summary.net)} />
        <SummaryTile
          label="堂數／扣堂"
          value={`${summary.lessonCount}`}
          hint={`扣堂 ${summary.billableHc} 人次`}
        />
        <SummaryTile
          label="待處理異常"
          value={String(summary.anomalyCount)}
          hint={unresolvedHard.length > 0 ? `${unresolvedHard.length} 人硬阻擋未排除` : "可提交"}
          warn={summary.anomalyCount > 0}
        />
      </section>

      {/* 異常＋deep-link */}
      {(hardBlocks.length > 0 || notRolled.length > 0 || substitutes.length > 0) && (
        <section className="rounded-xl border border-warning/40 bg-card px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
            異常與待核對
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {notRolled.map((n) => (
              <li key={n.lessonId}>
                <button
                  type="button"
                  className="text-left underline-offset-2 hover:underline"
                  onClick={() => jumpToLesson(n.teacherId, n.lessonId)}
                >
                  未點名：{n.teacherName} · {n.className} · {n.date}
                </button>
              </li>
            ))}
            {rawTeachers
              .filter((t) => t.anomalies.length > 0)
              .flatMap((t) =>
                t.anomalies.map((msg) => (
                  <li key={`${t.id}-${msg}`}>
                    <button
                      type="button"
                      className="text-left underline-offset-2 hover:underline"
                      onClick={() => {
                        setSelectedId(t.id)
                        const hit = notRolled.find((n) => n.teacherId === t.id)
                        setHighlightLessonId(hit?.lessonId ?? null)
                      }}
                    >
                      {t.name}：{msg}
                    </button>
                  </li>
                ))
              )}
            {substitutes.slice(0, 6).map((s) => (
              <li key={`${s.lessonId}-sub`}>
                <button
                  type="button"
                  className="text-left underline-offset-2 hover:underline"
                  onClick={() => jumpToLesson(s.teacherId, s.lessonId)}
                >
                  代堂：{s.teacherName}{" "}
                  {s.direction === "given" ? `代入（代 ${s.peer}）` : `代出（${s.peer}）`} ·{" "}
                  {s.date}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 篩選 */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "全部"],
            ["anomaly", "異常"],
            ["unreviewed", "未審"],
            ["sub", "含代堂"],
            ["分成制", "分成制"],
            ["兼職 HC", "兼職 HC"],
            ["固定月薪", "固定月薪"],
          ] as const
        ).map(([v, label]) => (
          <Button
            key={v}
            type="button"
            size="sm"
            variant={filter === v ? "default" : "outline"}
            onClick={() => setFilter(v)}
          >
            {label}
          </Button>
        ))}
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">同事堂數總覽</h2>
          <p className="text-xs text-muted-foreground">勾「已審」／硬阻擋可「排除提交」</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[52rem] table-fixed text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-2 py-2.5 font-medium">已審</th>
                <th className="px-2 py-2.5 font-medium">同事</th>
                <th className="px-2 py-2.5 font-medium">模式</th>
                <th className="px-2 py-2.5 font-medium">堂數</th>
                <th className="px-2 py-2.5 font-medium">扣堂</th>
                <th className="px-2 py-2.5 font-medium">總薪酬</th>
                <th className="px-2 py-2.5 font-medium">較上月</th>
                <th className="px-2 py-2.5 font-medium">異常</th>
                <th className="px-2 py-2.5 font-medium">提交</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const mom = teacherMomPct(row)
                const blocked = blockedTeacherIds.has(row.id)
                const excluded = excludedIds.has(row.id)
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      row.id === selected?.id ? "bg-info/5" : "hover:bg-muted/30",
                      row.anomalies.length > 0 && row.id !== selected?.id ? "bg-warning/5" : null
                    )}
                  >
                    <td className="px-2 py-2.5">
                      <input
                        type="checkbox"
                        checked={reviewedIds.has(row.id)}
                        disabled={!editable}
                        onChange={() => onToggleReviewed(row.id)}
                        aria-label={`${row.name} 已審`}
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        type="button"
                        className="font-medium underline-offset-2 hover:underline"
                        onClick={() => setSelectedId(row.id)}
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">{row.mode}</td>
                    <td className="px-2 py-2.5 tabular-nums">{teacherLessonCount(row) || "—"}</td>
                    <td className="px-2 py-2.5 tabular-nums font-semibold">
                      {teacherLessonCount(row) > 0 ? teacherBillableHc(row) : "—"}
                    </td>
                    <td className="px-2 py-2.5 tabular-nums font-semibold">
                      {formatHkd(row.gross)}
                    </td>
                    <td className="px-2 py-2.5 tabular-nums text-muted-foreground">
                      {mom == null ? "—" : `${mom > 0 ? "+" : ""}${mom}%`}
                    </td>
                    <td className="px-2 py-2.5">
                      {row.anomalies.length > 0 ? (
                        <Tag tone="warning" size="sm">
                          有
                        </Tag>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      {blocked ? (
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={excluded}
                            disabled={!editable}
                            onChange={() => onToggleExcluded(row.id)}
                          />
                          排除
                        </label>
                      ) : (
                        <span className="text-xs text-muted-foreground">納入</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <label className="block min-w-[12rem] flex-1">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                選擇同事（明細）
              </span>
              <Select
                value={selected.id}
                onChange={(e) => {
                  setSelectedId(e.target.value)
                  setHighlightLessonId(null)
                }}
                aria-label="選擇同事"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.anomalies.length > 0 ? `⚠ ${t.name}` : t.name}
                    {reviewedIds.has(t.id) ? " ✓" : ""}
                  </option>
                ))}
              </Select>
            </label>
            <div className="ml-auto flex flex-wrap gap-3 text-sm">
              <SummaryTile
                label="堂數"
                value={String(teacherLessonCount(selected))}
                hint={`班 ${teacherClassCount(selected)}`}
              />
              <SummaryTile
                label="扣堂人次"
                value={String(teacherBillableHc(selected))}
                hint={`出席 ${teacherPresentTotal(selected)}`}
              />
              <SummaryTile label="總薪酬" value={formatHkd(selected.gross)} />
            </div>
          </div>

          {selected.id === "cody" && editable ? (
            <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold">Cody 在家工作時數</h3>
              <p className="text-xs text-muted-foreground">
                狀態：
                {selected.wfh?.status === "approved"
                  ? "已核准"
                  : selected.wfh?.status === "submitted"
                    ? "已申報待核准"
                    : "未申報"}
                {selected.wfh?.hours != null ? ` · ${selected.wfh.hours} 小時` : ""}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-muted-foreground">時數</span>
                  <Input
                    type="number"
                    className="w-32"
                    value={codyHoursInput}
                    onChange={(e) => setCodyHoursInput(e.target.value)}
                    placeholder="例如 36"
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
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
                      title: "已申報工時（示範）",
                      message: "待管理層核准後才計入總薪酬。可先排除 Cody 提交其餘同事。",
                    })
                  }}
                >
                  申報工時
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const h = Number(codyHoursInput) || selected.wfh?.hours || 0
                    if (h <= 0) {
                      pushBanner({
                        tone: "warning",
                        title: "請先填時數",
                        message: "示範：核准前需有時數。",
                      })
                      return
                    }
                    onCodyChange(h, "approved")
                    pushBanner({
                      tone: "success",
                      title: "已核准工時（示範）",
                      message: `$${60 * h} 已計入 Cody 總薪酬。`,
                    })
                  }}
                >
                  示範核准並計入
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {selected.name}　堂數與薪酬明細
            </h2>
            <SplitAuditPanel teacher={selected} />
            <TeacherLessonStats
              teacher={selected}
              highlightLessonId={highlightLessonId}
            />
            <TeacherPayFooter teacher={selected} />
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
          </div>
        </section>
      ) : null}

      {pendingAdj.length > 0 ? (
        <section className="rounded-xl border border-info/35 bg-info/5 px-3 py-3 text-sm sm:px-4">
          <p className="font-medium">待管理層核准的調整（{pendingAdj.length}）</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {pendingAdj.map((a) => (
              <li key={a.id}>
                {a.teacherName}：{formatHkd(a.fromAmount)} → {formatHkd(a.toAmount)} — {a.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請人手調整</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            同事：{selected?.name ?? "—"} · 現行 {formatHkd(selected?.gross)}
          </p>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-muted-foreground">調整後金額</span>
            <Input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-muted-foreground">原因（必填）</span>
            <textarea
              className="min-h-[5rem] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </label>
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
                    message: "調整後金額須為數字，原因必填。",
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
                  message: "請切換至管理層核實台核准；核准前金額不變。",
                })
              }}
            >
              送出申請
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認提交管理層核實</DialogTitle>
          </DialogHeader>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>總薪酬（納入者）：{formatHkd(summary.gross)}</li>
            <li>實發：{formatHkd(summary.net)}</li>
            <li>
              已審 {reviewedCount}/{teachers.length}
              {reviewedCount < teachers.length ? "（仍有未審，可繼續提交）" : ""}
            </li>
            <li>排除提交：{excludedIds.size} 人</li>
            <li>待核准調整：{pendingAdj.length} 項（一併交管理層）</li>
            <li>未點名：{notRolled.length} 節</li>
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubmitOpen(false)}>
              返回
            </Button>
            <Button
              type="button"
              onClick={() => {
                onStatusChange("待管理層核實", {
                  submittedBy: "財務（示範）",
                  submittedAt: new Date().toLocaleString("zh-HK"),
                  returnReason: undefined,
                })
                setSubmitOpen(false)
                pushBanner({
                  tone: "success",
                  title: "已提交管理層核實",
                  message: "可切換預覽身份至「管理層」。",
                })
              }}
            >
              確認提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="sticky bottom-0 z-10 -mx-3 border-t border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {canSubmit
              ? "硬阻擋已清或已排除 — 可提交核實"
              : `尚有 ${unresolvedHard.length} 人硬阻擋未排除，無法提交`}
          </p>
          <Button
            type="button"
            className="sm:min-w-[10rem]"
            disabled={!canSubmit}
            onClick={() => setSubmitOpen(true)}
          >
            <Send className="h-4 w-4" aria-hidden />
            提交管理層核實
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
