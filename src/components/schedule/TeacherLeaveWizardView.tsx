import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Copy, RotateCcw, UserRoundX } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { Field } from "@/components/frontDesk/frontDeskUi"
import { StudentAvatarWall } from "@/components/schedule/teacherLeave/StudentAvatarWall"
import {
  CancelPolicyStrip,
  DecisionPickButtons,
  LessonTimeline,
} from "@/components/schedule/teacherLeave/scenarioUi"
import {
  InitialAvatar,
  TEACHER_LEAVE_STEP_LABELS,
  WizardStepRail,
  type TeacherLeaveWizardStep,
} from "@/components/schedule/teacherLeave/visualBits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import { fetchTeacherOptions, type TeacherOption } from "@/services/classQueries"
import { localYmd } from "@/services/leaveQueries"
import {
  executeTeacherLeaveDay,
  loadTeacherLeaveDay,
  type TeacherLeaveDayDecision,
  type TeacherLeaveExecuteResult,
  type TeacherLeaveLessonUnit,
  type TeacherLeaveStudent,
} from "@/services/teacherLeaveWizardQueries"

type LessonDecision =
  | { action: "unset" }
  | { action: "substitute"; substituteTeacherId: string }
  | { action: "cancel" }
  | { action: "keep" }

function partitionStudents(students: TeacherLeaveStudent[]) {
  return {
    expected: students.filter((s) => s.kind === "expected"),
    leave: students.filter((s) => s.kind === "leave"),
    makeup: students.filter((s) => s.kind === "makeup"),
  }
}

function CountStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "success" | "warning" | "info"
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center rounded-xl border px-4 py-5",
        tone === "success" && "border-success/30 bg-success/10",
        tone === "warning" && "border-warning/30 bg-warning/10",
        tone === "info" && "border-info/30 bg-info/10"
      )}
    >
      <span
        className={cn(
          "text-4xl font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "info" && "text-info"
        )}
      >
        {value}
      </span>
      <span className="mt-1 text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}

function ResultRow({
  tone,
  time,
  title,
  right,
  children,
}: {
  tone: "success" | "warning" | "info"
  time: string
  title: string
  right?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-border bg-card">
      <div
        className={cn(
          "w-1.5 shrink-0",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "info" && "bg-info"
        )}
      />
      <div className="min-w-0 flex-1 space-y-2 px-3 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs tabular-nums text-muted-foreground">{time}</p>
            <p className="truncate font-medium">{title}</p>
          </div>
          {right}
        </div>
        {children}
      </div>
    </div>
  )
}

function Pill({
  children,
  tone,
}: {
  children: ReactNode
  tone?: "warning" | "info" | "default"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "warning" && "bg-warning/20 text-warning",
        tone === "info" && "bg-info/20 text-info",
        (!tone || tone === "default") && "bg-neutral-200 text-neutral-700"
      )}
    >
      {children}
    </span>
  )
}

function decisionToApi(d: LessonDecision): TeacherLeaveDayDecision | null {
  if (d.action === "keep") return { action: "keep" }
  if (d.action === "cancel") return { action: "cancel" }
  if (d.action === "substitute") {
    return { action: "substitute", substituteTeacherId: d.substituteTeacherId }
  }
  return null
}

export function TeacherLeaveWizardView() {
  const { role } = useAuth()
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()

  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [teacherId, setTeacherId] = useState("")
  const [leaveDate, setLeaveDate] = useState(localYmd())
  const [leaveNote, setLeaveNote] = useState("")
  const [showNote, setShowNote] = useState(false)

  const [step, setStep] = useState<TeacherLeaveWizardStep | "done">(1)
  const [maxReached, setMaxReached] = useState<TeacherLeaveWizardStep>(1)
  const [units, setUnits] = useState<TeacherLeaveLessonUnit[]>([])
  const [decisions, setDecisions] = useState<Record<string, LessonDecision>>({})
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [step2Err, setStep2Err] = useState<string | null>(null)
  const [result, setResult] = useState<TeacherLeaveExecuteResult | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list = await fetchTeacherOptions()
        if (cancelled) return
        setTeachers(list)
        if (list[0] && !teacherId) setTeacherId(list[0].id)
      } catch (e) {
        if (!cancelled) {
          reportUserFacingError(e, {
            source: "TeacherLeaveWizardView.loadTeachers",
            setErr: setLoadErr,
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 僅首次載入老師名單
  }, [])

  const leaveTeacher = teachers.find((t) => t.id === teacherId)
  const substituteOptions = teachers.filter((t) => t.id !== teacherId)

  const advanceTo = (next: TeacherLeaveWizardStep) => {
    setMaxReached((prev) => (next > prev ? next : prev))
    setStep(next)
  }

  const goStep = (next: TeacherLeaveWizardStep) => {
    if (next > maxReached) return
    setStep(next)
  }

  const setDecision = (primaryId: string, next: LessonDecision) => {
    setDecisions((prev) => ({ ...prev, [primaryId]: next }))
    setStep2Err(null)
  }

  const preview = useMemo(() => {
    const substituted: Array<{
      unit: TeacherLeaveLessonUnit
      substituteName: string
    }> = []
    const cancelled: Array<{
      unit: TeacherLeaveLessonUnit
      expected: TeacherLeaveStudent[]
      leave: TeacherLeaveStudent[]
      makeup: TeacherLeaveStudent[]
    }> = []
    const kept: TeacherLeaveLessonUnit[] = []
    for (const unit of units) {
      const d = decisions[unit.primaryScheduleId] ?? { action: "unset" as const }
      if (d.action === "substitute") {
        substituted.push({
          unit,
          substituteName:
            substituteOptions.find((t) => t.id === d.substituteTeacherId)?.label ??
            d.substituteTeacherId,
        })
      } else if (d.action === "cancel") {
        const parts = partitionStudents(unit.students)
        cancelled.push({
          unit,
          expected: parts.expected,
          leave: parts.leave,
          makeup: parts.makeup,
        })
      } else if (d.action === "keep") {
        kept.push(unit)
      }
    }
    return { substituted, cancelled, kept }
  }, [units, decisions, substituteOptions])

  const continueFromStep1 = async () => {
    if (!teacherId) {
      setLoadErr("請選擇請假老師")
      return
    }
    setLoading(true)
    setLoadErr(null)
    try {
      const loaded = await loadTeacherLeaveDay(teacherId, leaveDate)
      setUnits(loaded)
      const init: Record<string, LessonDecision> = {}
      for (const u of loaded) {
        init[u.primaryScheduleId] = { action: "unset" }
      }
      setDecisions(init)
      setResult(null)
      if (loaded.length === 0) {
        pushBanner({
          tone: "warning",
          title: "當日沒有可處理堂次（可能已全數取消，或該老師當日無排程）",
        })
      }
      advanceTo(2)
    } catch (e) {
      reportUserFacingError(e, {
        source: "TeacherLeaveWizardView.loadDay",
        setErr: setLoadErr,
      })
    } finally {
      setLoading(false)
    }
  }

  const continueFromStep2 = () => {
    const unset = units.filter(
      (u) => (decisions[u.primaryScheduleId] ?? { action: "unset" }).action === "unset"
    )
    if (unset.length > 0) {
      setStep2Err(`尚有 ${unset.length} 堂未決策`)
      return
    }
    for (const u of units) {
      const d = decisions[u.primaryScheduleId]
      if (d?.action === "substitute" && !d.substituteTeacherId) {
        setStep2Err(`「${u.classLabel}」請選擇代堂老師`)
        return
      }
    }
    setStep2Err(null)
    advanceTo(3)
  }

  const execute = async () => {
    const ok = await confirmDialog({
      title: "確認執行老師請假處理？",
      description:
        "將寫入真實排程（代堂／取消）與請假／補課紀錄。取消堂次會為應到課學生建立「老師請假／待安排」。",
      confirmText: "確認執行",
    })
    if (!ok) return

    const items = []
    for (const u of units) {
      const d = decisions[u.primaryScheduleId] ?? { action: "unset" as const }
      const api = decisionToApi(d)
      if (!api) continue
      items.push({ primaryScheduleId: u.primaryScheduleId, decision: api })
    }

    setExecuting(true)
    setLoadErr(null)
    try {
      const executed = await executeTeacherLeaveDay({
        leaveTeacherId: teacherId,
        leaveDate,
        note: leaveNote,
        units,
        items,
      })
      setResult(executed)
      if (executed.errors.length > 0) {
        pushBanner({
          tone: "warning",
          title: `完成，但有 ${executed.errors.length} 項錯誤：${executed.errors[0]}`,
        })
      } else {
        pushBanner({ tone: "success", title: "老師請假處理已完成" })
      }
      setStep("done")
      setMaxReached(4)
    } catch (e) {
      reportUserFacingError(e, {
        source: "TeacherLeaveWizardView.execute",
        setErr: setLoadErr,
      })
    } finally {
      setExecuting(false)
    }
  }

  const copySummary = async () => {
    if (!result) return
    const lines: string[] = [
      `【老師請假處理摘要】`,
      `請假老師：${leaveTeacher?.label ?? "—"}`,
      `日期：${leaveDate}`,
      `備註：${leaveNote.trim() || "（無）"}`,
      "",
    ]
    if (result.substituted.length) {
      lines.push("■ 已指派代堂")
      for (const row of result.substituted) {
        const name =
          teachers.find((t) => t.id === row.substituteTeacherId)?.label ?? row.substituteTeacherId
        lines.push(`· ${row.classLabel} → 代堂：${name}`)
      }
      lines.push("")
    }
    if (result.cancelled.length) {
      lines.push("■ 已取消・需另約")
      for (const row of result.cancelled) {
        lines.push(`· ${row.classLabel}`)
        if (row.followUpNames.length) {
          lines.push(`  待另約：${row.followUpNames.join("、")}`)
        }
        if (row.makeupResetNames.length) {
          lines.push(`  補堂需重約：${row.makeupResetNames.join("、")}`)
        }
        if (row.skippedLeaveNames.length) {
          lines.push(`  已請假（不新建）：${row.skippedLeaveNames.join("、")}`)
        }
      }
      lines.push("")
    }
    if (result.kept.length) {
      lines.push("■ 老師照常（此堂不請假）")
      for (const row of result.kept) {
        lines.push(`· ${row.classLabel}`)
      }
    }
    if (result.errors.length) {
      lines.push("")
      lines.push("■ 錯誤")
      for (const err of result.errors) lines.push(`· ${err}`)
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      pushBanner({ tone: "success", title: "摘要已複製到剪貼簿" })
    } catch {
      pushBanner({ tone: "warning", title: "無法複製" })
    }
  }

  const resetFlow = async () => {
    const ok = await confirmDialog({
      title: "重設流程？",
      description: "將回到第一步；已執行的資料庫變更不會自動還原。",
      confirmText: "重設",
    })
    if (!ok) return
    setStep(1)
    setMaxReached(1)
    setUnits([])
    setDecisions({})
    setResult(null)
    setStep2Err(null)
    setLoadErr(null)
    setLeaveNote("")
    setShowNote(false)
  }

  const handleStepRail = (n: TeacherLeaveWizardStep) => {
    if (step === "done" && n === 4) {
      setStep(4)
      return
    }
    if (step === "done") return
    goStep(n)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      {role === "admin" ? (
        <AdminPageHeader
          eyebrow="行政工作"
          title="老師請假處理"
          description={step === "done" ? "完成" : TEACHER_LEAVE_STEP_LABELS[step - 1]}
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => void resetFlow()}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              重設
            </Button>
          }
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
              <UserRoundX className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold">老師請假處理</h1>
              <p className="text-sm text-muted-foreground">
                {step === "done" ? "完成" : TEACHER_LEAVE_STEP_LABELS[step - 1]}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void resetFlow()}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              重設
            </Button>
          </div>
        </div>
      )}

      <WizardStepRail step={step} maxReached={maxReached} onGo={handleStepRail} />

      {loadErr ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {loadErr}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center gap-4 border-b border-border bg-muted/30 px-4 py-4">
              <InitialAvatar name={leaveTeacher?.label ?? "?"} size="lg" tone="neutral" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">請假老師</p>
                <p className="truncate text-lg font-semibold">{leaveTeacher?.label ?? "—"}</p>
                <p className="font-mono text-sm tabular-nums text-muted-foreground">{leaveDate}</p>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="老師">
                <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                  {teachers.length === 0 ? <option value="">載入中…</option> : null}
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="日期">
                <Input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setShowNote((v) => !v)}
                >
                  {showNote ? "收起備註" : "進階：備註"}
                </button>
                {showNote ? (
                  <div className="mt-2">
                    <Input
                      value={leaveNote}
                      onChange={(e) => setLeaveNote(e.target.value)}
                      placeholder="例如：臨時病假"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" disabled={loading || !teacherId} onClick={() => void continueFromStep1()}>
              {loading ? "載入中…" : "下一步"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              {leaveTeacher?.label} · {leaveDate} · {units.length} 堂
            </p>
            {units.length === 0 ? (
              <p className="text-sm text-muted-foreground">當日無可處理堂次</p>
            ) : (
              <LessonTimeline
                lessons={units.map((u) => ({
                  id: u.primaryScheduleId,
                  startTime: u.startTime,
                  endTime: u.endTime,
                  classLabel: u.classLabel,
                  room: u.room,
                  consecutive: u.consecutive,
                }))}
              />
            )}
          </div>

          {step2Err ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {step2Err}
            </div>
          ) : null}

          {units.map((unit) => {
            const parts = partitionStudents(unit.students)
            const d = decisions[unit.primaryScheduleId] ?? { action: "unset" as const }
            return (
              <section
                key={unit.primaryScheduleId}
                className="space-y-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-semibold tabular-nums">
                    {unit.startTime ?? "—"}
                    <span className="mx-0.5 font-normal text-muted-foreground">–</span>
                    {unit.endTime ?? "—"}
                  </span>
                  <h2 className="font-medium">{unit.classLabel}</h2>
                  {unit.room ? (
                    <Tag tone={statusToTagTone("正常")} size="sm">
                      {unit.room}
                    </Tag>
                  ) : null}
                  {unit.consecutive ? (
                    <Tag tone={statusToTagTone("加堂")} size="sm">
                      連堂
                    </Tag>
                  ) : null}
                  {unit.alreadySubstituted ? (
                    <Tag tone={statusToTagTone("代堂")} size="sm">
                      已代堂
                    </Tag>
                  ) : null}
                </div>

                <DecisionPickButtons
                  action={d.action}
                  onSubstitute={() =>
                    setDecision(unit.primaryScheduleId, {
                      action: "substitute",
                      substituteTeacherId:
                        d.action === "substitute"
                          ? d.substituteTeacherId
                          : (substituteOptions[0]?.id ?? ""),
                    })
                  }
                  onCancel={() => setDecision(unit.primaryScheduleId, { action: "cancel" })}
                  onKeep={() => setDecision(unit.primaryScheduleId, { action: "keep" })}
                />

                {d.action === "substitute" ? (
                  <Field label="代堂老師">
                    <Select
                      value={d.substituteTeacherId}
                      onChange={(e) =>
                        setDecision(unit.primaryScheduleId, {
                          action: "substitute",
                          substituteTeacherId: e.target.value,
                        })
                      }
                    >
                      {substituteOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}

                {d.action === "cancel" ? <CancelPolicyStrip /> : null}

                <StudentAvatarWall
                  expected={parts.expected}
                  leave={parts.leave}
                  makeup={parts.makeup}
                />
              </section>
            )
          })}

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => goStep(1)}>
              上一步
            </Button>
            <Button type="button" disabled={units.length === 0} onClick={continueFromStep2}>
              下一步
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <InitialAvatar name={leaveTeacher?.label ?? "?"} size="md" />
            <div className="min-w-0">
              <p className="font-medium">{leaveTeacher?.label}</p>
              <p className="text-xs text-muted-foreground">
                {leaveDate}
                {leaveNote.trim() ? ` · ${leaveNote.trim()}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <CountStat label="代堂" value={preview.substituted.length} tone="success" />
            <CountStat label="取消另約" value={preview.cancelled.length} tone="warning" />
            <CountStat label="老師照常" value={preview.kept.length} tone="info" />
          </div>

          <div className="space-y-2">
            {preview.substituted.map((row) => (
              <ResultRow
                key={row.unit.primaryScheduleId}
                tone="success"
                time={`${row.unit.startTime ?? "—"}–${row.unit.endTime ?? "—"}`}
                title={row.unit.classLabel}
                right={<Pill>→ {row.substituteName}</Pill>}
              />
            ))}
            {preview.cancelled.map((row) => (
              <ResultRow
                key={row.unit.primaryScheduleId}
                tone="warning"
                time={`${row.unit.startTime ?? "—"}–${row.unit.endTime ?? "—"}`}
                title={row.unit.classLabel}
                right={
                  <div className="flex flex-wrap gap-1">
                    <Pill tone="warning">待另約 {row.expected.length}</Pill>
                    <Pill>跳過 {row.leave.length}</Pill>
                    <Pill tone="info">拆補 {row.makeup.length}</Pill>
                  </div>
                }
              />
            ))}
            {preview.kept.map((unit) => (
              <ResultRow
                key={unit.primaryScheduleId}
                tone="info"
                time={`${unit.startTime ?? "—"}–${unit.endTime ?? "—"}`}
                title={unit.classLabel}
                right={<Pill tone="info">老師照常</Pill>}
              />
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => goStep(2)}>
              上一步
            </Button>
            <Button type="button" disabled={executing} onClick={() => void execute()}>
              {executing ? "執行中…" : "確認執行"}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 || step === "done" ? (
        <div className="space-y-4">
          {result ? (
            <>
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-success/40 bg-success/10 px-6 py-8 text-center">
                <CheckCircle2 className="h-14 w-14 text-success" aria-hidden />
                <p className="text-lg font-semibold text-success">執行完成</p>
                <p className="text-sm text-success/90">可複製摘要聯絡家長</p>
              </div>

              {result.errors.length > 0 ? (
                <div
                  role="alert"
                  className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {result.errors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void copySummary()}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  複製摘要
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/LeaveManagement">前往請假管理</Link>
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to={`/Schedule?date=${leaveDate}`}>前往排程</Link>
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <CountStat label="代堂" value={result.substituted.length} tone="success" />
                <CountStat label="取消另約" value={result.cancelled.length} tone="warning" />
                <CountStat label="老師照常" value={result.kept.length} tone="info" />
              </div>

              <div className="space-y-2">
                {result.substituted.map((row) => {
                  const name =
                    teachers.find((t) => t.id === row.substituteTeacherId)?.label ??
                    row.substituteTeacherId
                  return (
                    <ResultRow
                      key={row.primaryScheduleId}
                      tone="success"
                      time=""
                      title={row.classLabel}
                      right={<Pill>代堂 {name}</Pill>}
                    />
                  )
                })}
                {result.cancelled.map((row) => {
                  const unit = units.find((u) => u.primaryScheduleId === row.primaryScheduleId)
                  const expected =
                    unit?.students.filter((s) => row.followUpNames.includes(s.fullName) && s.kind === "expected") ??
                    row.followUpNames.map((fullName) => ({
                      studentId: fullName,
                      fullName,
                      kind: "expected" as const,
                    }))
                  const leave =
                    unit?.students.filter((s) => row.skippedLeaveNames.includes(s.fullName) && s.kind === "leave") ??
                    row.skippedLeaveNames.map((fullName) => ({
                      studentId: fullName,
                      fullName,
                      kind: "leave" as const,
                    }))
                  const makeup =
                    unit?.students.filter((s) => row.makeupResetNames.includes(s.fullName) && s.kind === "makeup") ??
                    row.makeupResetNames.map((fullName) => ({
                      studentId: fullName,
                      fullName,
                      kind: "makeup" as const,
                    }))
                  return (
                    <ResultRow
                      key={row.primaryScheduleId}
                      tone="warning"
                      time=""
                      title={row.classLabel}
                      right={
                        <Tag tone={statusToTagTone("取消")} size="sm">
                          取消
                        </Tag>
                      }
                    >
                      <StudentAvatarWall expected={expected} leave={leave} makeup={makeup} />
                    </ResultRow>
                  )
                })}
                {result.kept.map((row) => (
                  <ResultRow
                    key={row.primaryScheduleId}
                    tone="info"
                    time=""
                    title={row.classLabel}
                    right={<Pill tone="info">老師照常</Pill>}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">尚未執行，請回到步驟 3。</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
