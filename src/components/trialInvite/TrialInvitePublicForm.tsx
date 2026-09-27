import { useEffect, useMemo, useState, type ReactNode } from "react"
import { CheckCircle2, ChevronDown, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade } from "@/lib/studentGrade"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { partitionTrialInviteElectives } from "@/lib/trialInviteElectives"
import {
  assemblePicks,
  buildSubjectGroups,
  classLabelOf,
  classSubLabel,
  filterCatalogClasses,
  formatScheduleLine,
  nearestUpcomingSchedules,
  pruneAndAutofillClasses,
  pruneAndAutofillSchedules,
  selectedClassIdsForGroups,
  selectedSubjectGroups,
  visibleTrialClasses,
  type SubjectGroup,
} from "@/lib/trialInvitePublicFlow"
import { cn } from "@/lib/utils"
import {
  getTrialInviteSession,
  submitTrialInviteSession,
  type TrialInviteClassOption,
  type TrialInviteElectiveOption,
  type TrialInviteIdentity,
  type TrialInviteSubmittedRequest,
} from "@/services/trialInviteQueries"

type FlowStepId = "electives" | "subject" | "confirm"

type FlowStepDef = {
  id: FlowStepId
  label: string
}

const SENIOR_FLOW_STEPS: FlowStepDef[] = [
  { id: "electives", label: "選修" },
  { id: "subject", label: "選堂" },
  { id: "confirm", label: "提交" },
]

const STANDARD_FLOW_STEPS: FlowStepDef[] = [
  { id: "subject", label: "選堂" },
  { id: "confirm", label: "提交" },
]

const GROUP_SUBJECT_INTRO =
  "固定逢星期，按該科上課。主科為中文、英文、數學；初中另有科學；高中另有物理、化學、生物、企業、會計與財務、數學延伸。"

const HOMEWORK_SUBJECT_INTRO = "課後完成學校功課並溫習，不屬某一科專科班。"

/**
 * 家長公開頁：高中先選選修（可跳過）→ 一次選科目並展開班別／堂次 → 確認提交。
 * 選堂步驟與 /AdTrial 相同：科目與班別合併為一頁。
 */
export function TrialInvitePublicForm({ token }: { token: string }) {
  const [identity, setIdentity] = useState<TrialInviteIdentity | null>(null)
  const [classes, setClasses] = useState<TrialInviteClassOption[]>([])
  const [requiresElectiveSurvey, setRequiresElectiveSurvey] = useState(false)
  const [electiveOptions, setElectiveOptions] = useState<TrialInviteElectiveOption[]>([])
  const [electedCodes, setElectedCodes] = useState<string[]>([])
  const [electivesConfirmed, setElectivesConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState<TrialInviteSubmittedRequest | null>(null)
  const [flowPhase, setFlowPhase] = useState<Exclude<FlowStepId, "electives">>("subject")
  const [selectedSubjectKeys, setSelectedSubjectKeys] = useState<string[]>([])
  const [classBySubject, setClassBySubject] = useState<Record<string, string>>({})
  const [scheduleByClass, setScheduleByClass] = useState<Record<string, string>>({})
  const [expandedClassBySubject, setExpandedClassBySubject] = useState<Record<string, string>>({})
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!token || !isSupabaseConfigured) {
      setLoading(false)
      setErr(!isSupabaseConfigured ? "系統尚未設定，請聯絡職員。" : "連結無效")
      return
    }
    let cancelled = false
    setLoading(true)
    void getTrialInviteSession(token)
      .then((s) => {
        if (cancelled) return
        setIdentity(s.identity)
        setClasses(s.classes)
        setRequiresElectiveSurvey(s.requires_elective_survey)
        setElectiveOptions(s.elective_subject_options)
        setSubmitted(s.submitted_request)
        if (s.status === "submitted" || s.status === "approved") {
          setDone(true)
          setLocked(true)
          setElectivesConfirmed(true)
        } else if (s.status === "open") {
          setDone(false)
          setLocked(false)
          setElectivesConfirmed(!s.requires_elective_survey)
          setFlowPhase("subject")
        } else {
          setErr(
            s.status === "expired"
              ? "此連結已過期，請向職員索取新連結"
              : s.status === "voided"
                ? "此連結已作廢，請向職員索取新連結"
                : `此連結無法使用（${s.status}）`
          )
        }
      })
      .catch((e) => {
        if (!cancelled) {
          reportUserFacingError(e, { source: "TrialInvitePublicForm.load", setErr })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const electedSet = useMemo(() => new Set(electedCodes), [electedCodes])

  const catalogClasses = useMemo(
    () => filterCatalogClasses(classes, requiresElectiveSurvey, electedSet),
    [classes, requiresElectiveSurvey, electedSet]
  )

  const subjectGroups = useMemo(() => buildSubjectGroups(catalogClasses), [catalogClasses])
  const groupSubjects = subjectGroups.filter((g) => g.classKind === "group")
  const homeworkSubjects = subjectGroups.filter((g) => g.classKind === "homework")

  const selectedGroups = useMemo(
    () => selectedSubjectGroups(subjectGroups, selectedSubjectKeys),
    [subjectGroups, selectedSubjectKeys]
  )

  const picks = useMemo(
    () => assemblePicks(subjectGroups, selectedSubjectKeys, classBySubject, scheduleByClass),
    [subjectGroups, selectedSubjectKeys, classBySubject, scheduleByClass]
  )

  const picksComplete = picks.length > 0
  const incompleteSubjectCount = Math.max(0, selectedGroups.length - picks.length)

  const showElectiveStep = requiresElectiveSurvey && !electivesConfirmed && !done

  const electivePartitions = useMemo(
    () => partitionTrialInviteElectives(electiveOptions, classes),
    [electiveOptions, classes]
  )

  const flowSteps = requiresElectiveSurvey ? SENIOR_FLOW_STEPS : STANDARD_FLOW_STEPS

  const currentStepId: FlowStepId = showElectiveStep ? "electives" : flowPhase
  const currentStepIndex = flowSteps.findIndex((s) => s.id === currentStepId)
  const currentStepLabel = flowSteps[currentStepIndex]?.label ?? ""

  const resetSelections = () => {
    setSelectedSubjectKeys([])
    setClassBySubject({})
    setScheduleByClass({})
    setExpandedClassBySubject({})
    setFlowPhase("subject")
  }

  const toggleElective = (code: string) => {
    setElectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const confirmElectives = () => {
    setErr(null)
    resetSelections()
    setElectivesConfirmed(true)
  }

  const skipElectives = () => {
    setErr(null)
    setElectedCodes([])
    resetSelections()
    setElectivesConfirmed(true)
  }

  const editElectives = () => {
    setErr(null)
    resetSelections()
    setElectivesConfirmed(false)
  }

  const toggleSubject = (key: string) => {
    setErr(null)
    const isOn = selectedSubjectKeys.includes(key)
    if (isOn) {
      const prevClassId = classBySubject[key]
      setSelectedSubjectKeys((prev) => prev.filter((k) => k !== key))
      setClassBySubject((map) => {
        const next = { ...map }
        delete next[key]
        return next
      })
      if (prevClassId) {
        setScheduleByClass((map) => {
          const next = { ...map }
          delete next[prevClassId]
          return next
        })
      }
      setExpandedClassBySubject((map) => {
        const next = { ...map }
        delete next[key]
        return next
      })
      return
    }

    setSelectedSubjectKeys((prev) => [...prev, key])
    const group = subjectGroups.find((g) => g.key === key)
    if (!group) return
    const autofilled = pruneAndAutofillClasses([key], [group], classBySubject)
    const classId = autofilled[key]
    if (!classId) return
    setClassBySubject((map) => ({ ...map, [key]: classId }))
    setExpandedClassBySubject((map) => ({ ...map, [key]: classId }))
    const cls = catalogClasses.find((c) => c.id === classId)
    const upcoming = cls ? nearestUpcomingSchedules(cls) : []
    if (upcoming.length === 1) {
      setScheduleByClass((map) => ({ ...map, [classId]: upcoming[0].id }))
    }
  }

  const pickClass = (subjectKey: string, classId: string) => {
    setErr(null)
    if (!selectedSubjectKeys.includes(subjectKey)) {
      setSelectedSubjectKeys((prev) => [...prev, subjectKey])
    }
    setExpandedClassBySubject((map) => ({ ...map, [subjectKey]: classId }))
    const prevClassId = classBySubject[subjectKey]
    setClassBySubject((map) => ({ ...map, [subjectKey]: classId }))
    setScheduleByClass((map) => {
      const next = { ...map }
      if (prevClassId && prevClassId !== classId) delete next[prevClassId]
      const cls = catalogClasses.find((c) => c.id === classId)
      const upcoming = cls ? nearestUpcomingSchedules(cls) : []
      if (upcoming.length === 1) next[classId] = upcoming[0].id
      return next
    })
  }

  const pickScheduleForClass = (classId: string, scheduleId: string) => {
    setErr(null)
    setScheduleByClass((map) => ({ ...map, [classId]: scheduleId }))
  }

  const confirmSubjects = () => {
    const keys = selectedSubjectKeys.filter((k) => subjectGroups.some((g) => g.key === k))
    const nextClass = pruneAndAutofillClasses(keys, subjectGroups, classBySubject)
    const nextClassIds = selectedClassIdsForGroups(
      selectedSubjectGroups(subjectGroups, keys),
      nextClass
    )
    const nextSchedules = pruneAndAutofillSchedules(nextClassIds, catalogClasses, scheduleByClass)
    const assembled = assemblePicks(subjectGroups, keys, nextClass, nextSchedules)
    if (assembled.length === 0) {
      setErr("請至少選擇一科班別與堂次")
      return
    }
    const completeKeys = keys.filter((key) => {
      const classId = nextClass[key]
      return Boolean(classId && nextSchedules[classId])
    })
    setSelectedSubjectKeys(completeKeys)
    setClassBySubject(pruneAndAutofillClasses(completeKeys, subjectGroups, nextClass))
    setScheduleByClass(
      pruneAndAutofillSchedules(
        selectedClassIdsForGroups(selectedSubjectGroups(subjectGroups, completeKeys), nextClass),
        catalogClasses,
        nextSchedules
      )
    )
    setFlowPhase("confirm")
    setErr(null)
  }

  const goBackOneStep = () => {
    setErr(null)
    if (currentStepId === "confirm") {
      setFlowPhase("subject")
      return
    }
    if (currentStepId === "subject" && requiresElectiveSurvey) {
      editElectives()
    }
  }

  const canGoBack =
    !locked &&
    !saving &&
    !done &&
    currentStepId !== "electives" &&
    !(currentStepId === "subject" && !requiresElectiveSurvey)

  const jumpToStep = (stepId: FlowStepId) => {
    if (locked || saving || done) return
    const targetIndex = flowSteps.findIndex((s) => s.id === stepId)
    if (targetIndex < 0 || targetIndex >= currentStepIndex) return
    setErr(null)
    if (stepId === "electives") {
      editElectives()
      return
    }
    if (stepId === "subject" || stepId === "confirm") {
      setFlowPhase(stepId)
    }
  }

  const onSubmit = async () => {
    if (!picksComplete) {
      setErr("請至少選一科試堂堂次")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const s = await submitTrialInviteSession(
        token,
        picks.map((p) => ({ class_id: p.classId, schedule_id: p.scheduleId })),
        note,
        requiresElectiveSurvey ? electedCodes : []
      )
      setSubmitted(s.submitted_request)
      setDone(true)
      setLocked(true)
      setClasses([])
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInvitePublicForm.submit", setErr })
    } finally {
      setSaving(false)
    }
  }

  const electivePreview =
    electedCodes.length === 0
      ? "已跳過（不顯示選修科）"
      : electiveOptions
          .filter((o) => electedCodes.includes(o.code))
          .map((o) => o.short_name || o.name_zh)
          .join("、")

  const subjectPreview =
    picks.length === 0
      ? selectedGroups.length === 0
        ? "尚未選擇"
        : `已勾 ${selectedGroups.length} 科（尚需選堂次）`
      : picks.map((p) => p.subjectLabel).join("、") + `（${picks.length} 科）`

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4 text-sm text-muted-foreground">
        載入中…
      </div>
    )
  }

  if (err && !identity) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-base font-medium text-foreground">無法開啟邀請</p>
        <p className="mt-2 text-sm text-muted-foreground">{err}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <header className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">明學教育</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">邀請報讀試堂</h1>
      </header>

      {identity ? (
        <section className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-medium text-foreground">{identity.full_name}</p>
          <p className="mt-1 text-muted-foreground">
            {[identity.student_code, formatStudentGrade(identity.grade), identity.school]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </section>
      ) : null}

      {!done ? (
        <div className="mt-6 space-y-3">
          <FlowProgress
            steps={flowSteps}
            currentId={currentStepId}
            disabled={locked || saving}
            canJumpTo={(stepId) => {
              const targetIndex = flowSteps.findIndex((s) => s.id === stepId)
              if (targetIndex < 0 || targetIndex >= currentStepIndex) return false
              if (stepId === "electives") return requiresElectiveSurvey
              if (stepId === "subject") return true
              if (stepId === "confirm") return picksComplete
              return false
            }}
            onJump={jumpToStep}
          />
          <ProgressPreview
            requiresElectiveSurvey={requiresElectiveSurvey}
            electivesConfirmed={electivesConfirmed}
            electivePreview={electivePreview}
            subjectPreview={subjectPreview}
            currentStepLabel={currentStepLabel}
            currentStepIndex={currentStepIndex}
            totalSteps={flowSteps.length}
          />
          {canGoBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              disabled={locked || saving}
              onClick={goBackOneStep}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              返回上一步
            </button>
          ) : null}
        </div>
      ) : null}

      {err ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {err}
        </p>
      ) : null}

      {done ? (
        <section className="mt-8 space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <div>
            <p className="text-lg font-semibold text-foreground">已收到你的試堂申請</p>
            <p className="mt-1 text-sm text-muted-foreground">
              職員確認後會與你跟進。此連結已鎖定，無需重複提交。
            </p>
          </div>
          {submitted?.lines?.length ? (
            <ul className="space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm">
              {submitted.lines.map((ln) => (
                <li key={ln.id} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
                  <p className="font-medium text-foreground">{ln.class_label}</p>
                  <p className="text-muted-foreground">
                    {formatScheduleLine({
                      scheduled_date: ln.scheduled_date ?? "",
                      start_time: ln.start_time ?? "",
                      end_time: ln.end_time ?? "",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : showElectiveStep ? (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">目前選修科目</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              可勾選目前選修（多選）。若不選任何一科，可跳過；其後只顯示主科與功課輔導班，不顯示選修科試堂。
            </p>
          </div>
          {electiveOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">暫時未能載入選修科目清單，請聯絡職員。</p>
          ) : (
            <div className="space-y-4">
              {electivePartitions.offered.length > 0 ? (
                <ElectiveOptionGrid
                  title="本社有開設"
                  options={electivePartitions.offered}
                  electedCodes={electedCodes}
                  disabled={locked || saving}
                  onToggle={toggleElective}
                />
              ) : null}
              {electivePartitions.other.length > 0 ? (
                <ElectiveOptionGrid
                  title={electivePartitions.offered.length > 0 ? "其他選修" : undefined}
                  options={electivePartitions.other}
                  electedCodes={electedCodes}
                  disabled={locked || saving}
                  onToggle={toggleElective}
                />
              ) : null}
            </div>
          )}
          <div className="space-y-2">
            {electedCodes.length > 0 ? (
              <Button type="button" className="w-full" disabled={locked || saving} onClick={confirmElectives}>
                繼續選堂（已選 {electedCodes.length} 科選修）
              </Button>
            ) : (
              <>
                <Button type="button" className="w-full" disabled={locked || saving} onClick={skipElectives}>
                  跳過，只看主科與功課輔導班
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  跳過後不會顯示選修科試堂；之後仍可返回修改。
                </p>
              </>
            )}
          </div>
        </section>
      ) : classes.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          暫時沒有適合你年級、且已排定堂次的班別。請聯絡職員。
        </p>
      ) : (
        <>
          {currentStepId === "subject" ? (
            <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
              <h2 className="text-base font-semibold text-foreground">選擇科目與班別</h2>
              <p className="text-sm text-muted-foreground">
                可只選有興趣的科目，不必每科都選。點選後再選班別與堂次。
              </p>
              {subjectGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  沒有可選科目。請返回修改選修，或聯絡職員。
                </p>
              ) : (
                <div className="space-y-4">
                  <SubjectClassList
                    title="專科班"
                    description={GROUP_SUBJECT_INTRO}
                    groups={groupSubjects}
                    selectedKeys={selectedSubjectKeys}
                    classBySubject={classBySubject}
                    expandedClassBySubject={expandedClassBySubject}
                    scheduleByClass={scheduleByClass}
                    disabled={locked || saving}
                    onToggleSubject={toggleSubject}
                    onPickClass={pickClass}
                    onPickSchedule={pickScheduleForClass}
                  />
                  <SubjectClassList
                    title="功課輔導班"
                    description={HOMEWORK_SUBJECT_INTRO}
                    groups={homeworkSubjects}
                    selectedKeys={selectedSubjectKeys}
                    classBySubject={classBySubject}
                    expandedClassBySubject={expandedClassBySubject}
                    scheduleByClass={scheduleByClass}
                    disabled={locked || saving}
                    onToggleSubject={toggleSubject}
                    onPickClass={pickClass}
                    onPickSchedule={pickScheduleForClass}
                  />
                </div>
              )}
              {incompleteSubjectCount > 0 && picksComplete ? (
                <p className="text-center text-xs text-muted-foreground">
                  已選齊 {picks.length} 科；未選堂次的科目不會列入申請
                </p>
              ) : null}
            </section>
          ) : null}

          {currentStepId === "confirm" ? (
            <div className="mt-6 space-y-4">
              <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">已選試堂</h2>
                {picks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">尚未選擇試堂。請返回選堂。</p>
                ) : (
                  <ul className="space-y-2">
                    {picks.map((pick) => (
                      <li
                        key={pick.classId}
                        className="rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <p className="font-medium text-foreground">{pick.subjectLabel}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {pick.classLabel} · {pick.scheduleLabel}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">備註（選填）</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  disabled={locked || saving}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="例如希望優先某科、時間限制等"
                />
              </label>
            </div>
          ) : null}

          <StickyAction>
            {currentStepId === "subject" ? (
              <div className="space-y-2">
                {!picksComplete ? (
                  <p className="text-center text-xs text-muted-foreground">
                    {selectedSubjectKeys.length === 0
                      ? "請先選擇科目並選班別與堂次"
                      : `尚有 ${incompleteSubjectCount} 科未選班別或堂次`}
                  </p>
                ) : null}
                <Button
                  type="button"
                  className="w-full"
                  disabled={locked || saving || !picksComplete}
                  onClick={confirmSubjects}
                >
                  下一步：確認申請
                </Button>
              </div>
            ) : null}
            {currentStepId === "confirm" ? (
              <Button
                type="button"
                className="w-full"
                loading={saving}
                loadingText="提交中…"
                disabled={locked || !picksComplete}
                onClick={() => void onSubmit()}
              >
                {`提交試堂申請（${picks.length} 科）`}
              </Button>
            ) : null}
          </StickyAction>
        </>
      )}
    </div>
  )
}

function SubjectClassList({
  title,
  description,
  groups,
  selectedKeys,
  classBySubject,
  expandedClassBySubject,
  scheduleByClass,
  disabled,
  onToggleSubject,
  onPickClass,
  onPickSchedule,
}: {
  title: string
  description?: string
  groups: SubjectGroup[]
  selectedKeys: string[]
  classBySubject: Record<string, string>
  expandedClassBySubject: Record<string, string>
  scheduleByClass: Record<string, string>
  disabled?: boolean
  onToggleSubject: (key: string) => void
  onPickClass: (subjectKey: string, classId: string) => void
  onPickSchedule: (classId: string, scheduleId: string) => void
}) {
  if (groups.length === 0) return null
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {groups.map((group) => {
        const on = selectedKeys.includes(group.key)
        const selectedClassId = classBySubject[group.key] ?? null
        const expandedClassId = expandedClassBySubject[group.key] ?? selectedClassId
        const selectedScheduleId = selectedClassId ? (scheduleByClass[selectedClassId] ?? null) : null
        const picked = Boolean(selectedClassId && selectedScheduleId)
        return (
          <div
            key={group.key}
            className={cn(
              "rounded-lg border text-left",
              on ? "border-primary bg-background" : "border-border bg-background"
            )}
          >
            <button
              type="button"
              disabled={disabled}
              aria-pressed={on}
              aria-expanded={on}
              onClick={() => onToggleSubject(group.key)}
              className="flex w-full items-start gap-2 px-3 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium text-foreground">{group.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {group.classes.length} 個班別
                  {on ? (picked ? " · 已選堂次" : " · 請選班別與堂次") : ""}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  on && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            {on ? (
              <div className="space-y-2 border-t border-border px-3 py-3">
                <ClassOptions
                  group={group}
                  selectedClassId={selectedClassId}
                  expandedClassId={expandedClassId}
                  selectedScheduleId={selectedScheduleId}
                  disabled={disabled}
                  onPickClass={onPickClass}
                  onPickSchedule={onPickSchedule}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function ClassOptions({
  group,
  selectedClassId,
  expandedClassId,
  selectedScheduleId,
  disabled,
  onPickClass,
  onPickSchedule,
}: {
  group: SubjectGroup
  selectedClassId: string | null
  expandedClassId: string | null
  selectedScheduleId: string | null
  disabled?: boolean
  onPickClass: (subjectKey: string, classId: string) => void
  onPickSchedule: (classId: string, scheduleId: string) => void
}) {
  const visible = visibleTrialClasses(group.classes, selectedClassId)
  return (
    <div className="space-y-2">
      {visible.map((cls) => {
        const active = selectedClassId === cls.id
        const expanded = expandedClassId === cls.id
        const upcoming = nearestUpcomingSchedules(cls)
        return (
          <div key={cls.id} className="space-y-2">
            <button
              type="button"
              disabled={disabled}
              aria-pressed={active}
              aria-expanded={expanded}
              onClick={() => onPickClass(group.key, cls.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{classLabelOf(cls)}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {classSubLabel(cls)}
                </span>
              </span>
              <ChevronDown className={cn("h-4 w-4 shrink-0", expanded && "rotate-180")} aria-hidden />
            </button>
            {expanded
              ? upcoming.length === 0
                ? (
                    <p className="ml-2 text-xs text-muted-foreground">暫時沒有可選堂次</p>
                  )
                : upcoming.map((sch) => {
                    const schActive = selectedScheduleId === sch.id
                    return (
                      <button
                        key={sch.id}
                        type="button"
                        disabled={disabled}
                        aria-pressed={schActive}
                        onClick={() => onPickSchedule(cls.id, sch.id)}
                        className={cn(
                          "ml-2 w-[calc(100%-0.5rem)] rounded-lg border px-3 py-2 text-left text-sm",
                          schActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card"
                        )}
                      >
                        {formatScheduleLine(sch)}
                      </button>
                    )
                  })
              : null}
          </div>
        )
      })}
    </div>
  )
}

function StickyAction({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-6 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
      {children}
    </div>
  )
}

function FlowProgress({
  steps,
  currentId,
  disabled,
  canJumpTo,
  onJump,
}: {
  steps: FlowStepDef[]
  currentId: FlowStepId
  disabled?: boolean
  canJumpTo: (id: FlowStepId) => boolean
  onJump: (id: FlowStepId) => void
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentId)
  return (
    <nav aria-label="問卷進度">
      <ol className="flex items-stretch gap-1">
        {steps.map((step, index) => {
          const current = step.id === currentId
          const past = index < currentIndex
          const jumpable = past && !disabled && canJumpTo(step.id)
          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!jumpable}
                aria-current={current ? "step" : undefined}
                onClick={() => onJump(step.id)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-center transition-colors",
                  current
                    ? "bg-primary/10 text-foreground"
                    : past
                      ? cn("text-foreground", jumpable && "hover:bg-muted")
                      : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    current
                      ? "bg-primary text-primary-foreground"
                      : past
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn("truncate text-[11px] leading-tight", current && "font-medium")}>
                  {step.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function ProgressPreview({
  requiresElectiveSurvey,
  electivesConfirmed,
  electivePreview,
  subjectPreview,
  currentStepLabel,
  currentStepIndex,
  totalSteps,
}: {
  requiresElectiveSurvey: boolean
  electivesConfirmed: boolean
  electivePreview: string
  subjectPreview: string
  currentStepLabel: string
  currentStepIndex: number
  totalSteps: number
}) {
  return (
    <section
      className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm"
      aria-live="polite"
    >
      <p className="text-xs text-muted-foreground">
        步驟 {Math.max(currentStepIndex + 1, 1)}／{totalSteps}
        {currentStepLabel ? ` · ${currentStepLabel}` : ""}
      </p>
      <ul className="mt-2 space-y-1 text-foreground">
        {requiresElectiveSurvey ? (
          <li>
            <span className="text-muted-foreground">選修：</span>
            {electivesConfirmed ? electivePreview : "尚未確認"}
          </li>
        ) : null}
        <li>
          <span className="text-muted-foreground">選堂：</span>
          {subjectPreview}
        </li>
      </ul>
    </section>
  )
}

function ElectiveOptionGrid({
  title,
  options,
  electedCodes,
  disabled,
  onToggle,
}: {
  title?: string
  options: TrialInviteElectiveOption[]
  electedCodes: string[]
  disabled?: boolean
  onToggle: (code: string) => void
}) {
  return (
    <div className="space-y-2">
      {title ? <p className="text-xs font-medium text-muted-foreground">{title}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = electedCodes.includes(opt.code)
          return (
            <button
              key={opt.code}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onToggle(opt.code)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary hover:bg-primary/5"
              )}
            >
              <span className="font-medium">{opt.short_name || opt.name_zh}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
