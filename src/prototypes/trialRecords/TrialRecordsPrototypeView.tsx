import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { FlaskConical, Plus, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react"

import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import {
  MOCK_CLASSES,
  MOCK_LOST_REASONS,
  MOCK_SCHEDULES,
  MOCK_STUDENTS,
  OUTCOME_LABELS,
  STUDENT_KIND_LABELS,
  cloneMockTrials,
  formatScheduleLabel,
  getSchedule,
  schedulesForClass,
  type MockDerivedScheduleStatus,
  type MockTrialOutcome,
  type MockTrialRow,
} from "./mockData"

type StatusFilter = "all" | MockDerivedScheduleStatus
type OutcomeFilter = "all" | MockTrialOutcome
type KindFilter = "all" | "new" | "existing"

function chipClass(on: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    on
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-background text-muted-foreground hover:bg-muted/60"
  )
}

export function TrialRecordsPrototypeView() {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const isMobile = useIsMobile()
  const [rows, setRows] = useState<MockTrialRow[]>(() => cloneMockTrials())
  const [scheduleRollCall, setScheduleRollCall] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MOCK_SCHEDULES.map((s) => [s.id, s.rollCallDone]))
  )

  const [studentQ, setStudentQ] = useState("")
  const [kindFilter, setKindFilter] = useState<KindFilter>("all")
  const [teacherId, setTeacherId] = useState("all")
  const [classId, setClassId] = useState("all")
  const [statusTab, setStatusTab] = useState<StatusFilter>("all")
  const [outcomeTab, setOutcomeTab] = useState<OutcomeFilter>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [quickOpen, setQuickOpen] = useState(false)
  const [quickStep, setQuickStep] = useState<1 | 2>(1)
  const [quickStudentMode, setQuickStudentMode] = useState<"existing" | "new">("existing")
  const [quickStudentId, setQuickStudentId] = useState("")
  const [quickNewName, setQuickNewName] = useState("")
  const [quickNewGrade, setQuickNewGrade] = useState("P4")
  const [quickClassId, setQuickClassId] = useState("")
  const [quickScheduleId, setQuickScheduleId] = useState("")
  const [quickRemarks, setQuickRemarks] = useState("")
  const [quickErr, setQuickErr] = useState<string | null>(null)

  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleScheduleId, setRescheduleScheduleId] = useState("")
  const [rescheduleErr, setRescheduleErr] = useState<string | null>(null)

  const [convertId, setConvertId] = useState<string | null>(null)
  const [convertClassId, setConvertClassId] = useState("")
  const [convertForm, setConvertForm] = useState<"full" | "single">("full")

  const [lostId, setLostId] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState<string>(MOCK_LOST_REASONS[0])
  const [lostErr, setLostErr] = useState<string | null>(null)

  const teachers = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of MOCK_CLASSES) map.set(c.teacherId, c.teacherName)
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [])

  const resolveStatus = (row: MockTrialRow): MockDerivedScheduleStatus => {
    if (row.cancelled) return "已取消"
    if (scheduleRollCall[row.scheduleId]) return "已點名"
    return "未點名"
  }

  const trialDateOf = (row: MockTrialRow) => getSchedule(row.scheduleId)?.date ?? ""

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.outcome === "open").length
    const converted = rows.filter((r) => r.outcome === "converted").length
    const lost = rows.filter((r) => r.outcome === "lost").length
    const today = rows.filter((r) => trialDateOf(r) === "2026-07-29").length
    const closed = converted + lost
    const rate = closed > 0 ? Math.round((converted / closed) * 1000) / 10 : null
    return { open, converted, lost, today, rate }
  }, [rows, scheduleRollCall])

  const filtered = useMemo(() => {
    const q = studentQ.trim().toLowerCase()
    return rows
      .filter((r) => {
        if (q && !r.studentName.toLowerCase().includes(q) && !r.studentGrade.toLowerCase().includes(q)) {
          return false
        }
        if (kindFilter !== "all" && r.studentKind !== kindFilter) return false
        if (teacherId !== "all" && r.teacherId !== teacherId) return false
        if (classId !== "all" && r.classId !== classId) return false
        if (statusTab !== "all" && resolveStatus(r) !== statusTab) return false
        if (outcomeTab !== "all" && r.outcome !== outcomeTab) return false
        const d = trialDateOf(r)
        if (dateFrom && d < dateFrom) return false
        if (dateTo && d > dateTo) return false
        return true
      })
      .slice()
      .sort((a, b) => {
        const da = trialDateOf(a)
        const db = trialDateOf(b)
        if (da !== db) return da < db ? 1 : -1
        const sa = getSchedule(a.scheduleId)?.start ?? ""
        const sb = getSchedule(b.scheduleId)?.start ?? ""
        return sa < sb ? 1 : sa > sb ? -1 : 0
      })
  }, [
    rows,
    studentQ,
    kindFilter,
    teacherId,
    classId,
    statusTab,
    outcomeTab,
    dateFrom,
    dateTo,
    scheduleRollCall,
  ])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (studentQ.trim()) n += 1
    if (kindFilter !== "all") n += 1
    if (teacherId !== "all") n += 1
    if (classId !== "all") n += 1
    if (statusTab !== "all") n += 1
    if (outcomeTab !== "all") n += 1
    if (dateFrom) n += 1
    if (dateTo) n += 1
    return n
  }, [studentQ, kindFilter, teacherId, classId, statusTab, outcomeTab, dateFrom, dateTo])

  const resetFilters = () => {
    setStudentQ("")
    setKindFilter("all")
    setTeacherId("all")
    setClassId("all")
    setStatusTab("all")
    setOutcomeTab("all")
    setDateFrom("")
    setDateTo("")
  }

  const resetSandbox = () => {
    setRows(cloneMockTrials())
    setScheduleRollCall(Object.fromEntries(MOCK_SCHEDULES.map((s) => [s.id, s.rollCallDone])))
    pushBanner({ tone: "info", title: "已重設沙盒假資料" })
  }

  const openQuick = () => {
    setQuickStep(1)
    setQuickStudentMode("existing")
    setQuickStudentId("")
    setQuickNewName("")
    setQuickNewGrade("P4")
    setQuickClassId("")
    setQuickScheduleId("")
    setQuickRemarks("")
    setQuickErr(null)
    setQuickOpen(true)
  }

  const quickSchedules = quickClassId ? schedulesForClass(quickClassId) : []

  const submitQuick = () => {
    setQuickErr(null)
    const cls = MOCK_CLASSES.find((c) => c.id === quickClassId)
    const sch = quickSchedules.find((s) => s.id === quickScheduleId)
    if (!cls || !sch) {
      setQuickErr("請選擇班別與排程")
      return
    }
    let studentId = quickStudentId
    let studentName = ""
    let studentGrade = ""
    let studentKind: "existing" | "new" = "existing"
    if (quickStudentMode === "existing") {
      const stu = MOCK_STUDENTS.find((s) => s.id === quickStudentId)
      if (!stu) {
        setQuickErr("請選擇學生")
        return
      }
      studentName = stu.name
      studentGrade = stu.grade
      studentKind = stu.kind
    } else {
      if (!quickNewName.trim()) {
        setQuickErr("請輸入新生姓名")
        return
      }
      studentId = `stu-new-${Date.now()}`
      studentName = quickNewName.trim()
      studentGrade = quickNewGrade
      studentKind = "new"
    }
    setRows((prev) => [
      {
        id: `tr-${Date.now()}`,
        studentId,
        studentName,
        studentGrade,
        studentKind,
        classId: cls.id,
        classLabel: cls.label,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName,
        scheduleId: sch.id,
        cancelled: false,
        paid: false,
        outcome: "open",
        outcomeReason: null,
        enrolledClassLabel: null,
        remarks: quickRemarks.trim() || null,
      },
      ...prev,
    ])
    setQuickOpen(false)
    pushBanner({
      tone: "success",
      title: "沙盒：已登記試堂",
      message: `${studentName}（${STUDENT_KIND_LABELS[studentKind]}）· ${formatScheduleLabel(sch)}`,
    })
  }

  const rescheduleTarget = rows.find((r) => r.id === rescheduleId) ?? null
  const rescheduleOptions = rescheduleTarget
    ? schedulesForClass(rescheduleTarget.classId, rescheduleTarget.scheduleId)
    : []

  const submitReschedule = () => {
    setRescheduleErr(null)
    if (!rescheduleTarget || !rescheduleScheduleId) {
      setRescheduleErr("請選擇新排程")
      return
    }
    const sch = rescheduleOptions.find((s) => s.id === rescheduleScheduleId)
    if (!sch) return
    const oldSch = getSchedule(rescheduleTarget.scheduleId)
    const oldLabel = oldSch ? formatScheduleLabel(oldSch) : rescheduleTarget.scheduleId
    setRows((prev) =>
      prev.map((r) =>
        r.id === rescheduleTarget.id
          ? {
              ...r,
              scheduleId: sch.id,
              cancelled: false,
              remarks: [r.remarks, `由 ${oldLabel} 改期`].filter(Boolean).join("；"),
            }
          : r
      )
    )
    setRescheduleId(null)
    pushBanner({
      tone: "success",
      title: "沙盒：已改期",
      message: `舊排程不再掛此生；現為 ${formatScheduleLabel(sch)}`,
    })
  }

  const convertTarget = rows.find((r) => r.id === convertId) ?? null

  const submitConvert = async () => {
    if (!convertTarget || !convertClassId) return
    const cls = MOCK_CLASSES.find((c) => c.id === convertClassId)
    if (!cls) return
    const schedStatus = resolveStatus(convertTarget)
    if (schedStatus === "未點名") {
      const ok = await confirmDialog({
        title: "尚未完成試堂點名",
        description:
          "學生尚未完成試堂點名。若已收學費但未點名，堂數與出席會對不上。仍要繼續轉正？",
        confirmText: "仍要轉正",
        cancelText: "返回",
        tone: "warning",
      })
      if (!ok) return
    }
    const formLabel = convertForm === "full" ? "報足全期" : "單堂"
    setRows((prev) =>
      prev.map((r) =>
        r.id === convertTarget.id
          ? {
              ...r,
              outcome: "converted" as const,
              outcomeReason: formLabel,
              enrolledClassLabel: cls.label,
              remarks:
                cls.id !== r.classId
                  ? [r.remarks, `跨班轉化：試堂「${r.classLabel}」→ 報讀「${cls.label}」`]
                      .filter(Boolean)
                      .join("；")
                  : r.remarks,
            }
          : r
      )
    )
    setConvertId(null)
    pushBanner({
      tone: "success",
      title: "沙盒：已標轉化",
      message: `${convertTarget.studentName} → ${cls.label}（${formLabel}）`,
    })
  }

  const lostTarget = rows.find((r) => r.id === lostId) ?? null

  const submitLost = () => {
    setLostErr(null)
    if (!lostTarget) return
    if (!lostTarget.cancelled) {
      setLostErr("請先取消試堂，再標流失")
      return
    }
    if (!lostReason.trim()) {
      setLostErr("請選擇流失原因")
      return
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === lostTarget.id
          ? { ...r, outcome: "lost" as const, outcomeReason: lostReason }
          : r
      )
    )
    setLostId(null)
    pushBanner({
      tone: "warning",
      title: "沙盒：已登記流失",
      message: `${lostTarget.studentName} · ${lostReason}`,
    })
  }

  const filterPanel = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>學生</span>
        <Input
          className="h-10 min-h-10"
          placeholder="姓名／年級"
          value={studentQ}
          onChange={(e) => setStudentQ(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>學生類別</span>
        <Select
          className="h-10 min-h-10 w-full"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as KindFilter)}
        >
          <option value="all">全部</option>
          <option value="new">新生</option>
          <option value="existing">現有學生</option>
        </Select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>老師</span>
        <Select className="h-10 min-h-10 w-full" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="all">全部老師</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>班別</span>
        <Select className="h-10 min-h-10 w-full" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="all">全部班別</option>
          {MOCK_CLASSES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>排程日期由</span>
        <Input
          className="h-10 min-h-10"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>排程日期至</span>
        <Input className="h-10 min-h-10" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </label>
    </div>
  )

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles className="h-7 w-7 text-info" aria-hidden />
            試堂紀錄
            <Tag tone="info" size="sm">
              {rows.length} 筆
            </Tag>
            <Tag tone="warning" size="sm">
              沙盒
            </Tag>
          </h1>
          <p className="mt-1 hidden text-sm text-muted-foreground md:block">
            時間扣連班別排程；點名狀態由排程點名推導；學費在收款頁處理。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={resetSandbox}>
            <RotateCcw className="h-4 w-4" />
            重設假資料
          </Button>
          <Button
            type="button"
            className="gap-1 bg-info text-white hover:bg-info"
            onClick={openQuick}
          >
            <Plus className="h-4 w-4" />
            快速登記試堂
          </Button>
        </div>
      </header>

      <div
        role="status"
        className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
      >
        <span className="inline-flex items-center gap-1.5 font-medium">
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
          沙盒預覽・假資料・與正式試堂頁無關
        </span>
        <span className="mt-0.5 block text-muted-foreground md:mt-0 md:ml-2 md:inline">
          路由 <code className="rounded bg-muted px-1 font-mono text-xs">/prototype/TrialRecords</code>
          。點排程會跳正式排程頁（假 ID 可能無資料）。
        </span>
      </div>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3" aria-label="結果復盤概覽">
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
          <div className="text-[11px] text-muted-foreground md:text-xs">轉化率</div>
          <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">
            {stats.rate != null ? `${stats.rate}%` : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">轉化 ÷（轉化＋流失）</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
          <div className="text-[11px] text-muted-foreground md:text-xs">已轉化</div>
          <p className="mt-1 text-xl font-bold tabular-nums text-success md:text-2xl">{stats.converted}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
          <div className="text-[11px] text-muted-foreground md:text-xs">流失</div>
          <p className="mt-1 text-xl font-bold tabular-nums text-destructive md:text-2xl">{stats.lost}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
          <div className="text-[11px] text-muted-foreground md:text-xs">待跟進</div>
          <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">{stats.open}</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="點名狀態">
        {(
          [
            ["all", "全部點名"],
            ["未點名", "未點名"],
            ["已點名", "已點名"],
            ["已取消", "已取消"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={statusTab === id}
            className={chipClass(statusTab === id)}
            onClick={() => setStatusTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="轉化結果">
        {(
          [
            ["all", "全部轉化"],
            ["open", OUTCOME_LABELS.open],
            ["converted", OUTCOME_LABELS.converted],
            ["lost", OUTCOME_LABELS.lost],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={outcomeTab === id}
            className={chipClass(outcomeTab === id)}
            onClick={() => setOutcomeTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {isMobile ? (
        <>
          <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            篩選
            {activeFilterCount > 0 ? (
              <Tag tone="info" size="sm">
                {activeFilterCount}
              </Tag>
            ) : null}
          </Button>
          <MobileFilterSheet
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title="篩選試堂"
            activeCount={activeFilterCount}
            onReset={resetFilters}
          >
            {filterPanel}
          </MobileFilterSheet>
        </>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">篩選</p>
            {activeFilterCount > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                清除篩選
              </Button>
            ) : null}
          </div>
          {filterPanel}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((r) => {
            const schedStatus = resolveStatus(r)
            const sch = getSchedule(r.scheduleId)
            const canReschedule = r.outcome === "open" && !r.cancelled && schedStatus === "未點名"
            const canAct = r.outcome === "open" && !r.cancelled
            return (
              <article
                key={r.id}
                className="rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/Students/${r.studentId}`}
                      className="font-medium text-info hover:underline"
                    >
                      {r.studentName}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{r.studentGrade}</span>
                      <Tag tone={statusToTagTone(STUDENT_KIND_LABELS[r.studentKind])} size="sm">
                        {STUDENT_KIND_LABELS[r.studentKind]}
                      </Tag>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Tag tone={statusToTagTone(OUTCOME_LABELS[r.outcome])} size="sm">
                      {OUTCOME_LABELS[r.outcome]}
                    </Tag>
                    <Tag tone={statusToTagTone(r.paid ? "已繳費" : "未繳費")} size="sm">
                      {r.paid ? "已繳費" : "未繳費"}
                    </Tag>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="tabular-nums text-muted-foreground">
                    {sch ? sch.date : "—"}
                    {sch ? ` · ${sch.start}–${sch.end}` : null}
                  </div>
                  <div>
                    <Link
                      to={`/Classes/${r.classId}`}
                      className="font-medium text-info hover:underline"
                    >
                      {r.classLabel}
                    </Link>
                    <div className="text-xs text-muted-foreground">{r.teacherName}</div>
                  </div>
                  {sch ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        to={`/Schedule/${r.scheduleId}`}
                        className="text-xs font-medium tabular-nums text-info hover:underline"
                      >
                        第{sch.sessionNumber}堂 · 看排程
                      </Link>
                      <Tag tone={statusToTagTone(schedStatus)} size="sm">
                        {schedStatus}
                      </Tag>
                    </div>
                  ) : (
                    <span className="text-xs text-destructive">排程缺失</span>
                  )}
                  {r.outcome === "converted" && r.enrolledClassLabel ? (
                    <p className="text-xs text-muted-foreground">
                      {r.classLabel === r.enrolledClassLabel
                        ? "報讀同班"
                        : `試堂 → ${r.enrolledClassLabel}`}
                    </p>
                  ) : null}
                  {r.outcome === "lost" && r.outcomeReason ? (
                    <p className="text-xs text-muted-foreground">{r.outcomeReason}</p>
                  ) : null}
                </div>

                {canAct ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setConvertId(r.id)
                        setConvertClassId(r.classId)
                        setConvertForm("full")
                      }}
                    >
                      正式報讀
                    </Button>
                    <button
                      type="button"
                      className="text-xs font-medium text-destructive hover:underline"
                      onClick={() => {
                        setLostId(r.id)
                        setLostReason(MOCK_LOST_REASONS[0])
                        setLostErr(null)
                      }}
                    >
                      標流失
                    </button>
                    {canReschedule ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-info hover:underline"
                        onClick={() => {
                          setRescheduleId(r.id)
                          setRescheduleScheduleId("")
                          setRescheduleErr(null)
                        }}
                      >
                        改期
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
          <p className="text-xs text-muted-foreground">
            共 {filtered.length} 筆
            {filtered.length !== rows.length ? `（全部 ${rows.length} 筆）` : null}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="w-[10%] px-3 py-2 font-medium">日期</th>
                <th className="w-[14%] px-3 py-2 font-medium">學生</th>
                <th className="w-[18%] px-3 py-2 font-medium">班別</th>
                <th className="w-[14%] px-3 py-2 font-medium">排程</th>
                <th className="w-[8%] px-3 py-2 font-medium">繳費</th>
                <th className="w-[14%] px-3 py-2 font-medium">結果</th>
                <th className="w-[22%] px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const schedStatus = resolveStatus(r)
                const sch = getSchedule(r.scheduleId)
                const canReschedule = r.outcome === "open" && !r.cancelled && schedStatus === "未點名"
                const canAct = r.outcome === "open" && !r.cancelled
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors hover:bg-muted/60",
                      idx % 2 === 1 ? "bg-muted/20" : ""
                    )}
                  >
                    <td className="px-3 py-2.5 align-top tabular-nums text-muted-foreground">
                      {sch?.date ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <Link
                        to={`/Students/${r.studentId}`}
                        className="font-medium text-info hover:underline"
                      >
                        {r.studentName}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{r.studentGrade}</span>
                        <Tag tone={statusToTagTone(STUDENT_KIND_LABELS[r.studentKind])} size="sm">
                          {STUDENT_KIND_LABELS[r.studentKind]}
                        </Tag>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <Link
                        to={`/Classes/${r.classId}`}
                        className="font-medium text-info hover:underline"
                      >
                        {r.classLabel}
                      </Link>
                      <div className="text-xs text-muted-foreground">{r.teacherName}</div>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      {sch ? (
                        <div className="space-y-1">
                          <Link
                            to={`/Schedule/${r.scheduleId}`}
                            className="font-medium tabular-nums text-info hover:underline"
                            title={formatScheduleLabel(sch)}
                          >
                            {sch.start}–{sch.end}
                          </Link>
                          <div className="text-xs text-muted-foreground">第{sch.sessionNumber}堂</div>
                          <Tag tone={statusToTagTone(schedStatus)} size="sm">
                            {schedStatus}
                          </Tag>
                        </div>
                      ) : (
                        <span className="text-destructive">排程缺失</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <Tag tone={statusToTagTone(r.paid ? "已繳費" : "未繳費")} size="sm">
                        {r.paid ? "已繳費" : "未繳費"}
                      </Tag>
                    </td>
                    <td className="px-3 py-2.5 align-top text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <Tag tone={statusToTagTone(OUTCOME_LABELS[r.outcome])} size="sm">
                          {OUTCOME_LABELS[r.outcome]}
                        </Tag>
                        {r.outcome === "converted" && r.enrolledClassLabel ? (
                          <div>
                            {r.classLabel === r.enrolledClassLabel
                              ? "報讀同班"
                              : `試堂 → ${r.enrolledClassLabel}`}
                          </div>
                        ) : null}
                        {r.outcome === "lost" && r.outcomeReason ? (
                          <div>{r.outcomeReason}</div>
                        ) : null}
                        {r.remarks ? (
                          <div className="line-clamp-2">{r.remarks}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex flex-col items-start gap-1">
                        {canAct ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setConvertId(r.id)
                                setConvertClassId(r.classId)
                                setConvertForm("full")
                              }}
                            >
                              正式報讀
                            </Button>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="text-xs font-medium text-destructive hover:underline"
                                onClick={() => {
                                  setLostId(r.id)
                                  setLostReason(MOCK_LOST_REASONS[0])
                                  setLostErr(null)
                                }}
                              >
                                標流失
                              </button>
                              {canReschedule ? (
                                <button
                                  type="button"
                                  className="text-xs font-medium text-info hover:underline"
                                  onClick={() => {
                                    setRescheduleId(r.id)
                                    setRescheduleScheduleId("")
                                    setRescheduleErr(null)
                                  }}
                                >
                                  改期
                                </button>
                              ) : null}
                            </div>
                            {!r.cancelled ? (
                              <button
                                type="button"
                                className="text-[11px] text-muted-foreground hover:underline"
                                onClick={() => {
                                  setScheduleRollCall((prev) => ({
                                    ...prev,
                                    [r.scheduleId]: !prev[r.scheduleId],
                                  }))
                                  pushBanner({
                                    tone: "info",
                                    title: "沙盒：模擬點名狀態",
                                    message: `→ ${!scheduleRollCall[r.scheduleId] ? "已點名" : "未點名"}（正式版由點名頁決定）`,
                                  })
                                }}
                              >
                                模擬點名
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            共 {filtered.length} 筆試堂紀錄
            {filtered.length !== rows.length ? `（全部 ${rows.length} 筆）` : null}
            {" · "}今日示例 {stats.today} 筆
          </div>
        </div>
      )}

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>快速登記試堂</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            步驟 {quickStep}／2{quickStep === 1 ? " · 學生" : " · 選班別排程"}
          </p>
          {quickErr ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {quickErr}
            </div>
          ) : null}
          {quickStep === 1 ? (
            <div className="grid gap-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={quickStudentMode === "existing" ? "default" : "outline"}
                  onClick={() => setQuickStudentMode("existing")}
                >
                  現有學生
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={quickStudentMode === "new" ? "default" : "outline"}
                  onClick={() => setQuickStudentMode("new")}
                >
                  新生
                </Button>
              </div>
              {quickStudentMode === "existing" ? (
                <label className="grid gap-1 text-xs text-muted-foreground">
                  <span>現有學生 *</span>
                  <Select
                    className="h-10 min-h-10 w-full"
                    value={quickStudentId}
                    onChange={(e) => setQuickStudentId(e.target.value)}
                  >
                    <option value="">請選擇</option>
                    {MOCK_STUDENTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}（{s.grade}）· {STUDENT_KIND_LABELS[s.kind]}
                      </option>
                    ))}
                  </Select>
                </label>
              ) : (
                <>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    <span>新生姓名 *</span>
                    <Input
                      className="h-10 min-h-10"
                      value={quickNewName}
                      onChange={(e) => setQuickNewName(e.target.value)}
                      placeholder="例：陳大文"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    <span>年級</span>
                    <Select
                      className="h-10 min-h-10 w-full"
                      value={quickNewGrade}
                      onChange={(e) => setQuickNewGrade(e.target.value)}
                    >
                      {["P3", "P4", "P5", "P6", "S1", "S2"].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                  </label>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setQuickOpen(false)}>
                  取消
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setQuickErr(null)
                    if (quickStudentMode === "existing" && !quickStudentId) {
                      setQuickErr("請選擇學生")
                      return
                    }
                    if (quickStudentMode === "new" && !quickNewName.trim()) {
                      setQuickErr("請輸入姓名")
                      return
                    }
                    setQuickStep(2)
                  }}
                >
                  下一步
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 text-sm">
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>試堂班別 *</span>
                <Select
                  className="h-10 min-h-10 w-full"
                  value={quickClassId}
                  onChange={(e) => {
                    setQuickClassId(e.target.value)
                    setQuickScheduleId("")
                  }}
                >
                  <option value="">請選擇</option>
                  {MOCK_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>班別排程 *</span>
                <Select
                  className="h-10 min-h-10 w-full"
                  value={quickScheduleId}
                  onChange={(e) => setQuickScheduleId(e.target.value)}
                  disabled={!quickClassId}
                >
                  <option value="">請選擇排程</option>
                  {quickSchedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatScheduleLabel(s)}
                      {scheduleRollCall[s.id] ? " · 已點名" : " · 未點名"}
                    </option>
                  ))}
                </Select>
              </label>
              {quickScheduleId ? (
                <p className="text-xs text-muted-foreground">
                  將掛上：
                  <Link
                    to={`/Schedule/${quickScheduleId}`}
                    className="ml-1 font-medium text-info hover:underline"
                  >
                    {formatScheduleLabel(getSchedule(quickScheduleId)!)}
                  </Link>
                </p>
              ) : null}
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>備註</span>
                <Input
                  className="h-10 min-h-10"
                  value={quickRemarks}
                  onChange={(e) => setQuickRemarks(e.target.value)}
                />
              </label>
              <div className="flex justify-between gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setQuickStep(1)}>
                  上一步
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setQuickOpen(false)}>
                    取消
                  </Button>
                  <Button type="button" onClick={submitQuick}>
                    確認登記
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={rescheduleId != null}
        onOpenChange={(open) => {
          if (!open) setRescheduleId(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>改期（換排程）</DialogTitle>
          </DialogHeader>
          {rescheduleTarget ? (
            <div className="grid gap-3 text-sm">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="font-medium">{rescheduleTarget.studentName}</div>
                <div className="text-muted-foreground">{rescheduleTarget.classLabel}</div>
                <div className="mt-1">
                  <Link
                    to={`/Schedule/${rescheduleTarget.scheduleId}`}
                    className="tabular-nums text-info hover:underline"
                  >
                    {getSchedule(rescheduleTarget.scheduleId)
                      ? formatScheduleLabel(getSchedule(rescheduleTarget.scheduleId)!)
                      : rescheduleTarget.scheduleId}
                  </Link>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                改期＝改扣連的班別排程。確認後舊堂名單不會再出現此生。
              </p>
              {rescheduleErr ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {rescheduleErr}
                </div>
              ) : null}
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>新排程（同班）*</span>
                <Select
                  className="h-10 min-h-10 w-full"
                  value={rescheduleScheduleId}
                  onChange={(e) => setRescheduleScheduleId(e.target.value)}
                >
                  <option value="">請選擇</option>
                  {rescheduleOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatScheduleLabel(s)}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRescheduleId(null)}>
                  取消
                </Button>
                <Button type="button" onClick={submitReschedule}>
                  確認改期
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={convertId != null}
        onOpenChange={(open) => {
          if (!open) setConvertId(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>正式報讀（轉化）</DialogTitle>
          </DialogHeader>
          {convertTarget ? (
            <div className="grid gap-3 text-sm">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{convertTarget.studentName}</span>
                  <Tag tone={statusToTagTone(STUDENT_KIND_LABELS[convertTarget.studentKind])} size="sm">
                    {STUDENT_KIND_LABELS[convertTarget.studentKind]}
                  </Tag>
                </div>
                <div className="mt-1 text-muted-foreground">試堂班：{convertTarget.classLabel}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                沙盒示意：正式版進入報讀流程。可改班；學費在收款頁。
              </p>
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>報讀班別 *</span>
                <Select
                  className="h-10 min-h-10 w-full"
                  value={convertClassId}
                  onChange={(e) => setConvertClassId(e.target.value)}
                >
                  {MOCK_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                      {c.id === convertTarget.classId ? "（試堂班）" : ""}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>報讀形式（示意）</span>
                <Select
                  className="h-10 min-h-10 w-full"
                  value={convertForm}
                  onChange={(e) => setConvertForm(e.target.value as "full" | "single")}
                >
                  <option value="full">報足全期</option>
                  <option value="single">單堂</option>
                </Select>
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setConvertId(null)}>
                  取消
                </Button>
                <Button type="button" onClick={submitConvert}>
                  確認轉化（假）
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={lostId != null}
        onOpenChange={(open) => {
          if (!open) setLostId(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>登記流失</DialogTitle>
          </DialogHeader>
          {lostTarget ? (
            <div className="grid gap-3 text-sm">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="font-medium">{lostTarget.studentName}</div>
                <div className="text-muted-foreground">{lostTarget.classLabel}</div>
              </div>
              {lostErr ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {lostErr}
                </div>
              ) : null}
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>原因 *</span>
                <Select
                  className="h-10 min-h-10 w-full"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                >
                  {MOCK_LOST_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLostId(null)}>
                  取消
                </Button>
                <Button type="button" variant="destructive" onClick={submitLost}>
                  確認流失
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
