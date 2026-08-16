import { useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  CheckCircle2,
  Copy,
  FlaskConical,
  RotateCcw,
  UserRoundX,
} from "lucide-react"

import { Field } from "@/components/frontDesk/frontDeskUi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import { StudentAvatarWall } from "./StudentAvatarWall"
import {
  MOCK_TEACHERS,
  SCENARIOS,
  cloneScenario,
  type MockLesson,
  type MockStudentOnLesson,
  type ScenarioId,
  type ScenarioPack,
} from "./mockData"
import {
  CancelPolicyStrip,
  DecisionPickButtons,
  LessonTimeline,
  ScenarioPicker,
} from "./scenarioUi"
import {
  InitialAvatar,
  STEP_LABELS,
  WizardStepRail,
  type WizardStep,
} from "./visualBits"

type LessonDecision =
  | { action: "unset" }
  | { action: "substitute"; substituteTeacherId: string }
  | { action: "cancel" }
  | { action: "keep" }

type ExecutedResult = {
  substituted: Array<{ lesson: MockLesson; substituteName: string }>
  cancelled: Array<{
    lesson: MockLesson
    followUpExpected: MockStudentOnLesson[]
    skippedLeave: MockStudentOnLesson[]
    makeupReset: MockStudentOnLesson[]
  }>
  kept: MockLesson[]
  note: string
}

function teacherName(id: string): string {
  return MOCK_TEACHERS.find((t) => t.id === id)?.full_name ?? id
}

function partitionStudents(students: MockStudentOnLesson[]) {
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

function Pill({ children, tone }: { children: ReactNode; tone?: "warning" | "info" | "default" }) {
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

export function TeacherLeaveWizardPrototypeView() {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()

  const [scenarioId, setScenarioId] = useState<ScenarioId>("mixed")
  const [pack, setPack] = useState<ScenarioPack>(() =>
    cloneScenario(SCENARIOS.find((s) => s.id === "mixed")!)
  )
  const [step, setStep] = useState<WizardStep | "done">(1)
  const [maxReached, setMaxReached] = useState<WizardStep>(1)
  const [leaveNote, setLeaveNote] = useState("臨時病假")
  const [showNote, setShowNote] = useState(false)
  const [decisions, setDecisions] = useState<Record<string, LessonDecision>>({})
  const [result, setResult] = useState<ExecutedResult | null>(null)
  const [eventLog, setEventLog] = useState<string[]>([])
  const [step2Err, setStep2Err] = useState<string | null>(null)

  const log = (msg: string) => {
    const stamp = new Date().toLocaleTimeString("zh-HK", { hour12: false })
    setEventLog((prev) => [`[${stamp}] ${msg}`, ...prev].slice(0, 40))
  }

  const loadScenario = (id: ScenarioId) => {
    const found = SCENARIOS.find((s) => s.id === id)
    if (!found) return
    setScenarioId(id)
    setPack(cloneScenario(found))
    setStep(1)
    setMaxReached(1)
    setDecisions({})
    setResult(null)
    setStep2Err(null)
    setLeaveNote("臨時病假")
    setShowNote(false)
    setEventLog([])
    log(`載入情境：${found.title}`)
    pushBanner({ tone: "info", title: `（沙盒）已載入：${found.shortTitle}` })
  }

  const advanceTo = (next: WizardStep) => {
    setMaxReached((prev) => (next > prev ? next : prev))
    setStep(next)
  }

  const goStep = (next: WizardStep) => {
    if (next > maxReached) return
    setStep(next)
  }

  const resetAll = async () => {
    const ok = await confirmDialog({
      title: "重設沙盒？",
      description: "將清除本頁決策與摘要，不會影響真實資料庫。",
      confirmText: "重設沙盒",
    })
    if (!ok) return
    loadScenario(scenarioId)
    pushBanner({ tone: "info", title: "沙盒已重設" })
  }

  const leaveTeacher = MOCK_TEACHERS.find((t) => t.id === pack.leaveTeacherId)
  const substituteOptions = MOCK_TEACHERS.filter((t) => t.id !== pack.leaveTeacherId)

  const preview = useMemo(() => {
    const substituted: ExecutedResult["substituted"] = []
    const cancelled: ExecutedResult["cancelled"] = []
    const kept: MockLesson[] = []
    for (const lesson of pack.lessons) {
      const d = decisions[lesson.id] ?? { action: "unset" as const }
      if (d.action === "substitute") {
        substituted.push({
          lesson,
          substituteName: teacherName(d.substituteTeacherId),
        })
      } else if (d.action === "cancel") {
        const parts = partitionStudents(lesson.students)
        cancelled.push({
          lesson,
          followUpExpected: parts.expected,
          skippedLeave: parts.leave,
          makeupReset: parts.makeup,
        })
      } else if (d.action === "keep") {
        kept.push(lesson)
      }
    }
    return { substituted, cancelled, kept }
  }, [pack.lessons, decisions])

  const setDecision = (lessonId: string, next: LessonDecision) => {
    setDecisions((prev) => ({ ...prev, [lessonId]: next }))
    setStep2Err(null)
  }

  const continueFromStep1 = () => {
    const hasPartial = pack.lessons.some((x) => x.leaveTarget)
    const init: Record<string, LessonDecision> = {}
    for (const l of pack.lessons) {
      const existing = decisions[l.id]
      if (existing && existing.action !== "unset") {
        init[l.id] = existing
      } else if (l.leaveTarget) {
        init[l.id] = { action: "cancel" }
      } else if (hasPartial) {
        init[l.id] = { action: "keep" }
      } else {
        init[l.id] = { action: "unset" }
      }
    }
    setDecisions(init)
    log(`範圍：${leaveTeacher?.full_name ?? "—"} · ${pack.leaveDate} · ${pack.lessons.length} 堂`)
    advanceTo(2)
  }

  const continueFromStep2 = () => {
    const unset = pack.lessons.filter(
      (l) => (decisions[l.id] ?? { action: "unset" }).action === "unset"
    )
    if (unset.length > 0) {
      setStep2Err(`尚有 ${unset.length} 堂未決策`)
      return
    }
    for (const l of pack.lessons) {
      const d = decisions[l.id]
      if (d?.action === "substitute" && !d.substituteTeacherId) {
        setStep2Err(`「${l.classLabel}」請選擇代堂老師`)
        return
      }
    }
    setStep2Err(null)
    advanceTo(3)
  }

  const execute = async () => {
    const ok = await confirmDialog({
      title: "執行沙盒操作？",
      description: "只寫入本頁記憶體，不會呼叫 Supabase。",
      confirmText: "確認執行",
    })
    if (!ok) return

    const executed: ExecutedResult = {
      ...preview,
      note: leaveNote.trim() || "（無備註）",
    }
    setResult(executed)

    for (const row of executed.substituted) {
      log(`代堂：${row.lesson.classLabel} → ${row.substituteName}`)
    }
    for (const row of executed.cancelled) {
      log(
        `取消：${row.lesson.classLabel} · 待另約 ${row.followUpExpected.length} · 跳過 ${row.skippedLeave.length} · 拆補 ${row.makeupReset.length}`
      )
    }
    for (const lesson of executed.kept) {
      log(`照常：${lesson.classLabel}`)
    }
    pushBanner({ tone: "success", title: "（沙盒）已模擬執行" })
    setStep("done")
    setMaxReached(4)
  }

  const copySummary = async () => {
    if (!result) return
    const lines: string[] = [
      `【老師請假處理摘要｜沙盒】`,
      `請假老師：${leaveTeacher?.full_name ?? "—"}`,
      `日期：${pack.leaveDate}`,
      `備註：${result.note}`,
      "",
    ]
    if (result.substituted.length) {
      lines.push("■ 已指派代堂")
      for (const row of result.substituted) {
        lines.push(
          `· ${row.lesson.start_time}-${row.lesson.end_time} ${row.lesson.classLabel} → 代堂：${row.substituteName}`
        )
      }
      lines.push("")
    }
    if (result.cancelled.length) {
      lines.push("■ 已取消・需另約")
      for (const row of result.cancelled) {
        lines.push(`· ${row.lesson.start_time}-${row.lesson.end_time} ${row.lesson.classLabel}`)
        if (row.followUpExpected.length) {
          lines.push(`  待另約：${row.followUpExpected.map((s) => s.full_name).join("、")}`)
        }
        if (row.makeupReset.length) {
          lines.push(`  補堂需重約：${row.makeupReset.map((s) => s.full_name).join("、")}`)
        }
        if (row.skippedLeave.length) {
          lines.push(`  已請假（不新建）：${row.skippedLeave.map((s) => s.full_name).join("、")}`)
        }
      }
      lines.push("")
    }
    if (result.kept.length) {
      lines.push("■ 老師照常（此堂不請假）")
      for (const lesson of result.kept) {
        lines.push(`· ${lesson.start_time}-${lesson.end_time} ${lesson.classLabel}`)
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      pushBanner({ tone: "success", title: "摘要已複製到剪貼簿" })
    } catch {
      pushBanner({ tone: "warning", title: "無法複製" })
    }
  }

  const handleStepRail = (n: WizardStep) => {
    if (step === "done" && n === 4) {
      setStep(4)
      return
    }
    goStep(n)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      <div
        role="status"
        className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
      >
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
        <span>沙盒｜記憶體假資料，不寫入真實排程／請假</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
            <UserRoundX className="h-5 w-5 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold">老師請假處理</h1>
            <p className="text-sm text-muted-foreground">
              {step === "done" ? "完成" : STEP_LABELS[step - 1]}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void resetAll()}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            重設
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/TeacherLeaveWizard">正式版</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/prototype/FrontDeskWizard">前台精靈沙盒</Link>
          </Button>
        </div>
      </div>

      <ScenarioPicker scenarios={SCENARIOS} activeId={scenarioId} onPick={loadScenario} />

      <WizardStepRail step={step} maxReached={maxReached} onGo={handleStepRail} />

      {step === 1 ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center gap-4 border-b border-border bg-muted/30 px-4 py-4">
              <InitialAvatar name={leaveTeacher?.full_name ?? "?"} size="lg" tone="neutral" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">請假老師</p>
                <p className="truncate text-lg font-semibold">{leaveTeacher?.full_name ?? "—"}</p>
                <p className="font-mono text-sm tabular-nums text-muted-foreground">{pack.leaveDate}</p>
              </div>
              <div className="rounded-xl border border-border bg-card px-5 py-3 text-center">
                <p className="text-3xl font-bold tabular-nums text-primary">{pack.lessons.length}</p>
                <p className="text-xs text-muted-foreground">堂</p>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="老師">
                <Select
                  value={pack.leaveTeacherId}
                  onChange={(e) => setPack((p) => ({ ...p, leaveTeacherId: e.target.value }))}
                >
                  {MOCK_TEACHERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="日期">
                <Input
                  type="date"
                  value={pack.leaveDate}
                  onChange={(e) => setPack((p) => ({ ...p, leaveDate: e.target.value }))}
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
                    <Input value={leaveNote} onChange={(e) => setLeaveNote(e.target.value)} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">當日堂次</p>
            <LessonTimeline lessons={pack.lessons} />
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={continueFromStep1}>
              下一步
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          {step2Err ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {step2Err}
            </div>
          ) : null}

          {pack.lessons.map((lesson) => {
            const parts = partitionStudents(lesson.students)
            const d = decisions[lesson.id] ?? { action: "unset" as const }
            return (
              <section
                key={lesson.id}
                className="space-y-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-semibold tabular-nums">
                    {lesson.start_time}
                    <span className="mx-0.5 font-normal text-muted-foreground">–</span>
                    {lesson.end_time}
                  </span>
                  <h2 className="font-medium">{lesson.classLabel}</h2>
                  <Tag tone={statusToTagTone("正常")} size="sm">
                    {lesson.room}
                  </Tag>
                  {lesson.leaveTarget ? (
                    <Tag tone={statusToTagTone("請假生")} size="sm">
                      此堂請假
                    </Tag>
                  ) : null}
                  {lesson.consecutive ? (
                    <Tag tone={statusToTagTone("加堂")} size="sm">
                      連堂
                    </Tag>
                  ) : null}
                </div>

                <DecisionPickButtons
                  action={d.action}
                  onSubstitute={() =>
                    setDecision(lesson.id, {
                      action: "substitute",
                      substituteTeacherId:
                        d.action === "substitute"
                          ? d.substituteTeacherId
                          : (substituteOptions[0]?.id ?? ""),
                    })
                  }
                  onCancel={() => setDecision(lesson.id, { action: "cancel" })}
                  onKeep={() => setDecision(lesson.id, { action: "keep" })}
                />

                {d.action === "substitute" ? (
                  <Field label="代堂老師">
                    <Select
                      value={d.substituteTeacherId}
                      onChange={(e) =>
                        setDecision(lesson.id, {
                          action: "substitute",
                          substituteTeacherId: e.target.value,
                        })
                      }
                    >
                      {substituteOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
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
            <Button type="button" onClick={continueFromStep2}>
              下一步
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <InitialAvatar name={leaveTeacher?.full_name ?? "?"} size="md" />
            <div className="min-w-0">
              <p className="font-medium">{leaveTeacher?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {pack.leaveDate}
                {leaveNote ? ` · ${leaveNote}` : ""}
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
                key={row.lesson.id}
                tone="success"
                time={`${row.lesson.start_time}–${row.lesson.end_time}`}
                title={row.lesson.classLabel}
                right={<Pill tone="default">→ {row.substituteName}</Pill>}
              />
            ))}
            {preview.cancelled.map((row) => (
              <ResultRow
                key={row.lesson.id}
                tone="warning"
                time={`${row.lesson.start_time}–${row.lesson.end_time}`}
                title={row.lesson.classLabel}
                right={
                  <div className="flex flex-wrap gap-1">
                    <Pill tone="warning">待另約 {row.followUpExpected.length}</Pill>
                    <Pill>跳過 {row.skippedLeave.length}</Pill>
                    <Pill tone="info">拆補 {row.makeupReset.length}</Pill>
                  </div>
                }
              >
                {row.followUpExpected.length > 0 || row.makeupReset.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {row.followUpExpected.map((s) => (
                      <InitialAvatar key={s.id} name={s.full_name} size="sm" tone="warning" />
                    ))}
                    {row.makeupReset.map((s) => (
                      <InitialAvatar key={s.id} name={s.full_name} size="sm" tone="info" />
                    ))}
                  </div>
                ) : null}
              </ResultRow>
            ))}
            {preview.kept.map((lesson) => (
              <ResultRow
                key={lesson.id}
                tone="info"
                time={`${lesson.start_time}–${lesson.end_time}`}
                title={lesson.classLabel}
                right={<Pill tone="info">老師照常</Pill>}
              />
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => goStep(2)}>
              上一步
            </Button>
            <Button type="button" onClick={() => void execute()}>
              確認執行
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

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void copySummary()}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  複製摘要
                </Button>
                <Button type="button" variant="outline" onClick={() => loadScenario(scenarioId)}>
                  再走一次
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <CountStat label="代堂" value={result.substituted.length} tone="success" />
                <CountStat label="取消另約" value={result.cancelled.length} tone="warning" />
                <CountStat label="老師照常" value={result.kept.length} tone="info" />
              </div>

              <div className="space-y-2">
                {result.substituted.map((row) => (
                  <ResultRow
                    key={row.lesson.id}
                    tone="success"
                    time={`${row.lesson.start_time}–${row.lesson.end_time}`}
                    title={row.lesson.classLabel}
                    right={<Pill>代堂 {row.substituteName}</Pill>}
                  />
                ))}
                {result.cancelled.map((row) => (
                  <ResultRow
                    key={row.lesson.id}
                    tone="warning"
                    time={`${row.lesson.start_time}–${row.lesson.end_time}`}
                    title={row.lesson.classLabel}
                    right={
                      <Tag tone={statusToTagTone("取消")} size="sm">
                        取消
                      </Tag>
                    }
                  >
                    <StudentAvatarWall
                      expected={row.followUpExpected}
                      leave={row.skippedLeave}
                      makeup={row.makeupReset}
                    />
                  </ResultRow>
                ))}
                {result.kept.map((lesson) => (
                  <ResultRow
                    key={lesson.id}
                    tone="info"
                    time={`${lesson.start_time}–${lesson.end_time}`}
                    title={lesson.classLabel}
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

      <details className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          事件紀錄
        </summary>
        {eventLog.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">尚無紀錄</p>
        ) : (
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto font-mono text-[11px] text-muted-foreground">
            {eventLog.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        )}
      </details>
    </div>
  )
}
