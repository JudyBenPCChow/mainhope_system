import { useEffect, useMemo, useState, type ReactNode } from "react"
import { CheckCircle2, ChevronDown, ChevronLeft, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade } from "@/lib/studentGrade"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { partitionTrialInviteElectives } from "@/lib/trialInviteElectives"
import {
  assemblePicks,
  buildSubjectGroups,
  classKindLabel,
  classLabelOf,
  classSubLabel,
  dropSelectedSubject,
  filterCatalogClasses,
  formatScheduleLine,
  nearestUpcomingSchedules,
  pickedClassCount,
  pickedScheduleCount,
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

type FlowStepId = "electives" | "subject" | "class" | "confirm"

type FlowStepDef = {
  id: FlowStepId
  label: string
}

const SENIOR_FLOW_STEPS: FlowStepDef[] = [
  { id: "electives", label: "選修" },
  { id: "subject", label: "科目" },
  { id: "class", label: "班別" },
  { id: "confirm", label: "提交" },
]

const STANDARD_FLOW_STEPS: FlowStepDef[] = [
  { id: "subject", label: "科目" },
  { id: "class", label: "班別" },
  { id: "confirm", label: "提交" },
]

/**
 * 家長公開頁：高中先選選修 → 一次多選科目 → 各科選班並展開堂次。
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

  const classProgress = useMemo(
    () => pickedClassCount(selectedSubjectKeys, subjectGroups, classBySubject),
    [selectedSubjectKeys, subjectGroups, classBySubject]
  )

  const selectedClassIds = useMemo(
    () => selectedClassIdsForGroups(selectedGroups, classBySubject),
    [selectedGroups, classBySubject]
  )

  const scheduleProgress = useMemo(
    () => pickedScheduleCount(selectedClassIds, catalogClasses, scheduleByClass),
    [selectedClassIds, catalogClasses, scheduleByClass]
  )

  const picks = useMemo(
    () => assemblePicks(subjectGroups, selectedSubjectKeys, classBySubject, scheduleByClass),
    [subjectGroups, selectedSubjectKeys, classBySubject, scheduleByClass]
  )

  const picksComplete = selectedGroups.length > 0 && picks.length === selectedGroups.length

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

  const editElectives = () => {
    setErr(null)
    resetSelections()
    setElectivesConfirmed(false)
  }

  const toggleSubject = (key: string) => {
    setErr(null)
    setSelectedSubjectKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const pickClassForSubject = (subjectKey: string, classId: string) => {
    setErr(null)
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

  const removeSubject = (subjectKey: string) => {
    if (locked || saving) return
    const keys = dropSelectedSubject(selectedSubjectKeys, subjectKey)
    if (keys.length === selectedSubjectKeys.length) return
    setErr(null)
    setSelectedSubjectKeys(keys)
    const nextClass = pruneAndAutofillClasses(keys, subjectGroups, classBySubject)
    const nextClassIds = selectedClassIdsForGroups(
      selectedSubjectGroups(subjectGroups, keys),
      nextClass
    )
    setClassBySubject(nextClass)
    setScheduleByClass(pruneAndAutofillSchedules(nextClassIds, catalogClasses, scheduleByClass))
    setExpandedClassBySubject((map) => {
      const next = { ...map }
      for (const key of Object.keys(next)) {
        if (!keys.includes(key)) delete next[key]
      }
      return next
    })
  }

  const canRemoveSubject = selectedGroups.length > 1 && !locked && !saving

  const confirmSubjects = () => {
    const keys = selectedSubjectKeys.filter((k) => subjectGroups.some((g) => g.key === k))
    if (keys.length === 0) {
      setErr("請至少選擇一科")
      return
    }
    if (keys.length !== selectedSubjectKeys.length) {
      setSelectedSubjectKeys(keys)
    }
    const nextClass = pruneAndAutofillClasses(keys, subjectGroups, classBySubject)
    const nextClassIds = selectedClassIdsForGroups(
      selectedSubjectGroups(subjectGroups, keys),
      nextClass
    )
    setClassBySubject(nextClass)
    setScheduleByClass(pruneAndAutofillSchedules(nextClassIds, catalogClasses, scheduleByClass))
    setExpandedClassBySubject((map) => {
      const next = { ...map }
      for (const key of Object.keys(next)) {
        if (!keys.includes(key)) delete next[key]
      }
      for (const [key, classId] of Object.entries(nextClass)) {
        if (!next[key]) next[key] = classId
      }
      return next
    })
    setFlowPhase("class")
    setErr(null)
  }

  const confirmClasses = () => {
    if (!picksComplete) {
      setErr("請為每一科選擇班別與堂次")
      return
    }
    setFlowPhase("confirm")
    setErr(null)
  }

  const goBackOneStep = () => {
    setErr(null)
    if (currentStepId === "confirm") {
      setFlowPhase("class")
      return
    }
    if (currentStepId === "class") {
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
    if (stepId === "subject" || stepId === "class" || stepId === "confirm") {
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
      ? "未選選修（僅顯示主科／功輔）"
      : electiveOptions
          .filter((o) => electedCodes.includes(o.code))
          .map((o) => o.short_name || o.name_zh)
          .join("、")

  const subjectPreview =
    selectedGroups.length === 0
      ? "尚未選擇"
      : selectedGroups.map((g) => g.label).join("、") + `（${selectedGroups.length} 科）`

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
              if (stepId === "class") return selectedSubjectKeys.length > 0
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
            currentStepId={currentStepId}
            classProgress={classProgress}
            scheduleProgress={scheduleProgress}
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
              為讓我們作出更好的試堂推薦，請告知你目前的選修科目（多選）。
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
          <Button type="button" className="w-full" disabled={locked || saving} onClick={confirmElectives}>
            繼續選擇試堂
            {electedCodes.length > 0 ? `（已選 ${electedCodes.length} 科選修）` : ""}
          </Button>
        </section>
      ) : classes.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          暫時沒有適合你年級、且已排定堂次的班別。請聯絡職員。
        </p>
      ) : (
        <>
          {currentStepId === "subject" ? (
            <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
              <PickerHeader title="選擇科目" />
              <p className="text-sm text-muted-foreground">
                請勾選所有想試堂的科目，下一步會同時為各科選擇班別與堂次。
              </p>
              {subjectGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  沒有可選科目。請返回修改選修，或聯絡職員。
                </p>
              ) : (
                <div className="space-y-4">
                  <OptionGroup
                    title="專科班（主科／你的選修）"
                    options={groupSubjects.map((g) => ({
                      id: g.key,
                      title: g.label,
                      subtitle: `${g.classes.length} 個班別`,
                    }))}
                    selectedIds={selectedSubjectKeys}
                    disabled={locked || saving}
                    onPick={toggleSubject}
                  />
                  <OptionGroup
                    title="功課輔導班"
                    options={homeworkSubjects.map((g) => ({
                      id: g.key,
                      title: g.label,
                      subtitle: `${g.classes.length} 個班別`,
                    }))}
                    selectedIds={selectedSubjectKeys}
                    disabled={locked || saving}
                    onPick={toggleSubject}
                  />
                </div>
              )}
            </section>
          ) : null}

          {currentStepId === "class" ? (
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <PickerHeader title="選擇班別" />
                <p className="text-sm text-muted-foreground">
                  請為每一科選擇一個班別，並在該班選一次試堂堂次。每科只顯示最近 4 個班別。
                </p>
              </div>
              {selectedGroups.map((group) => {
                const selectedClassId = classBySubject[group.key] ?? null
                const expandedClassId =
                  expandedClassBySubject[group.key] ?? selectedClassId
                const selectedCls = selectedClassId
                  ? group.classes.find((c) => c.id === selectedClassId)
                  : undefined
                const scheduleId = selectedCls ? scheduleByClass[selectedCls.id] ?? null : null
                return (
                  <SubjectClassPicker
                    key={group.key}
                    group={group}
                    selectedClassId={selectedClassId}
                    expandedClassId={expandedClassId}
                    selectedScheduleId={scheduleId}
                    disabled={locked || saving}
                    onPickClass={pickClassForSubject}
                    onPickSchedule={pickScheduleForClass}
                    onRemove={canRemoveSubject ? () => removeSubject(group.key) : undefined}
                  />
                )
              })}
            </div>
          ) : null}

          {currentStepId === "confirm" ? (
            <div className="mt-6 space-y-4">
              <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">已選試堂</h2>
                {picks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">尚未選擇試堂。請返回選擇科目。</p>
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
              <Button
                type="button"
                className="w-full"
                disabled={locked || saving || selectedSubjectKeys.length === 0}
                onClick={confirmSubjects}
              >
                {selectedSubjectKeys.length === 0
                  ? "請先選擇科目"
                  : `繼續選擇班別（${selectedSubjectKeys.length} 科）`}
              </Button>
            ) : null}
            {currentStepId === "class" ? (
              <div className="space-y-2">
                {!picksComplete ? (
                  <p className="text-center text-xs text-muted-foreground">
                    尚有 {selectedGroups.length - picks.length} 科未選班別或堂次
                  </p>
                ) : null}
                <Button
                  type="button"
                  className="w-full"
                  disabled={locked || saving || !picksComplete}
                  onClick={confirmClasses}
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

function SubjectCardHeader({
  title,
  hint,
  picked,
  pendingLabel,
  onRemove,
}: {
  title: string
  hint: string
  picked: boolean
  pendingLabel: string
  onRemove?: () => void
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <span className={cn("text-xs", picked ? "text-muted-foreground" : "text-warning")}>
          {picked ? "已選" : pendingLabel}
        </span>
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label={`刪除${title}`}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </header>
  )
}

function SubjectClassPicker({
  group,
  selectedClassId,
  expandedClassId,
  selectedScheduleId,
  disabled,
  onPickClass,
  onPickSchedule,
  onRemove,
}: {
  group: SubjectGroup
  selectedClassId: string | null
  expandedClassId: string | null
  selectedScheduleId: string | null
  disabled?: boolean
  onPickClass: (subjectKey: string, classId: string) => void
  onPickSchedule: (classId: string, scheduleId: string) => void
  onRemove?: () => void
}) {
  const picked = Boolean(selectedClassId && selectedScheduleId)
  const visibleClasses = visibleTrialClasses(group.classes, selectedClassId)
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4" aria-label={`${group.label} 班別`}>
      <SubjectCardHeader
        title={group.label}
        hint={classKindLabel(group.classKind)}
        picked={picked}
        pendingLabel={selectedClassId ? "未選堂次" : "未選班別"}
        onRemove={onRemove}
      />
      <div className="flex flex-col gap-2">
        {visibleClasses.map((cls) => {
          const expanded = expandedClassId === cls.id
          const active = selectedClassId === cls.id
          const subtitle = classSubLabel(cls) || classKindLabel(cls.class_kind)
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
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary hover:bg-primary/5"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{classLabelOf(cls)}</span>
                  {subtitle ? (
                    <span
                      className={cn(
                        "mt-0.5 block text-xs",
                        active ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {subtitle}
                    </span>
                  ) : null}
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <div className="ml-2 space-y-2 border-l border-border pl-3">
                  {upcoming.length === 0 ? (
                    <p className="text-xs text-muted-foreground">暫時沒有可選堂次</p>
                  ) : (
                    upcoming.map((sch) => {
                      const schActive = selectedScheduleId === sch.id
                      return (
                        <button
                          key={sch.id}
                          type="button"
                          disabled={disabled}
                          aria-pressed={schActive}
                          onClick={() => onPickSchedule(cls.id, sch.id)}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                            schActive
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary hover:bg-primary/5"
                          )}
                        >
                          {formatScheduleLine(sch)}
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
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
  currentStepId,
  classProgress,
  scheduleProgress,
  currentStepLabel,
  currentStepIndex,
  totalSteps,
}: {
  requiresElectiveSurvey: boolean
  electivesConfirmed: boolean
  electivePreview: string
  subjectPreview: string
  currentStepId: FlowStepId
  classProgress: { picked: number; total: number }
  scheduleProgress: { picked: number; total: number }
  currentStepLabel: string
  currentStepIndex: number
  totalSteps: number
}) {
  const showClass = currentStepId === "class" || currentStepId === "confirm"
  const showSchedule = currentStepId === "class" || currentStepId === "confirm"
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
          <span className="text-muted-foreground">科目：</span>
          {subjectPreview}
        </li>
        {showClass ? (
          <li>
            <span className="text-muted-foreground">班別：</span>
            {classProgress.total === 0
              ? "尚未選擇"
              : `已選 ${classProgress.picked}／${classProgress.total}`}
          </li>
        ) : null}
        {showSchedule ? (
          <li>
            <span className="text-muted-foreground">排程：</span>
            {scheduleProgress.total === 0
              ? "尚未選擇"
              : `已選 ${scheduleProgress.picked}／${scheduleProgress.total}`}
          </li>
        ) : null}
      </ul>
    </section>
  )
}

function PickerHeader({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-foreground">{title}</h2>
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

function OptionGroup({
  title,
  options,
  disabled,
  selectedId,
  selectedIds,
  onPick,
}: {
  title?: string
  options: { id: string; title: string; subtitle?: string }[]
  disabled?: boolean
  selectedId?: string | null
  selectedIds?: string[]
  onPick: (id: string) => void
}) {
  if (options.length === 0) return null
  const selectedSet = selectedIds ? new Set(selectedIds) : null
  return (
    <div className="space-y-2">
      {title ? <p className="text-xs font-medium text-muted-foreground">{title}</p> : null}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const active = selectedSet ? selectedSet.has(opt.id) : selectedId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onPick(opt.id)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary hover:bg-primary/5"
              )}
            >
              <p className="text-sm font-medium">{opt.title}</p>
              {opt.subtitle ? (
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {opt.subtitle}
                </p>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
