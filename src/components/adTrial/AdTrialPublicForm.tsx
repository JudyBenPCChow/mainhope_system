import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, ChevronDown, ChevronLeft, MessageCircle } from "lucide-react"

import { SchoolSearchableSelect } from "@/components/students/SchoolSearchableSelect"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade, type StudentGradeCode } from "@/lib/studentGrade"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { partitionTrialInviteElectives } from "@/lib/trialInviteElectives"
import {
  assemblePicks,
  buildSubjectGroups,
  classMeetingLabel,
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
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"
import {
  adTrialPhoneLooksValid,
  getAdTrialCatalog,
  submitAdTrial,
  submitAdTrialInterest,
} from "@/services/adTrialQueries"
import type {
  TrialInviteClassOption,
  TrialInviteElectiveOption,
} from "@/services/trialInviteQueries"

type StepId = "details" | "electives" | "subject" | "confirm"

const GRADE_OPTIONS = ["S1", "S2", "S3", "S4", "S5", "S6"] as const satisfies readonly StudentGradeCode[]
const SENIOR_GRADES = new Set<string>(["S4", "S5", "S6"])

/** 與收據對外聯絡一致（paymentPrint COMPANY.whatsapp）。 */
const MAINHOPE_PUBLIC_WHATSAPP = "94849539"

const GROUP_SUBJECT_INTRO =
  "固定逢星期，按該科上課。主科為中文、英文、數學；初中另有科學；高中另有物理、化學、生物、企業、會計與財務、數學延伸。"

const HOMEWORK_SUBJECT_INTRO = "課後完成學校功課並溫習，不屬某一科專科班。"

type ContactMethod = "WhatsApp" | "WeChat"

type AdTrialCarry = {
  fullName: string
  school: string
  grade: string
  phone: string
  contactMethod: ContactMethod
  wechatId: string
  electedCodes: string[]
  focusSubjectKey?: string
}

function readAdTrialCarry(state: unknown): AdTrialCarry | null {
  if (!state || typeof state !== "object" || !("adTrialCarry" in state)) return null
  const raw = (state as { adTrialCarry?: Partial<AdTrialCarry> }).adTrialCarry
  if (!raw) return null
  const grade = String(raw.grade ?? "")
  if (!GRADE_OPTIONS.includes(grade as (typeof GRADE_OPTIONS)[number])) return null
  return {
    fullName: String(raw.fullName ?? "").slice(0, 80),
    school: String(raw.school ?? "").slice(0, 120),
    grade,
    phone: String(raw.phone ?? ""),
    contactMethod: raw.contactMethod === "WeChat" ? "WeChat" : "WhatsApp",
    wechatId: String(raw.wechatId ?? "").slice(0, 40),
    electedCodes: Array.isArray(raw.electedCodes) ? raw.electedCodes.map((code) => String(code)) : [],
    focusSubjectKey: raw.focusSubjectKey ? String(raw.focusSubjectKey) : undefined,
  }
}

export function AdTrialPublicForm({ mode = "trial" }: { mode?: "trial" | "interest" }) {
  const interestOnly = mode === "interest"
  const location = useLocation()
  const navigate = useNavigate()
  const carried = interestOnly ? null : readAdTrialCarry(location.state)
  /** 成功完成帶資料跳轉後才標 true；勿在 effect 開頭標，否則 StrictMode 第二次會跳過載入。 */
  const carryBootstrappedRef = useRef(false)
  const [fullName, setFullName] = useState(carried?.fullName ?? "")
  const [school, setSchool] = useState(carried?.school ?? "")
  const [grade, setGrade] = useState(carried?.grade ?? "")
  const [phone, setPhone] = useState(carried?.phone ?? "")
  const [contactMethod, setContactMethod] = useState<ContactMethod>(carried?.contactMethod ?? "WhatsApp")
  const [wechatId, setWechatId] = useState(carried?.wechatId ?? "")
  const [note, setNote] = useState("")
  const [company, setCompany] = useState("")
  const [classes, setClasses] = useState<TrialInviteClassOption[]>([])
  const [requiresElectiveSurvey, setRequiresElectiveSurvey] = useState(false)
  const [electiveOptions, setElectiveOptions] = useState<TrialInviteElectiveOption[]>([])
  const [electedCodes, setElectedCodes] = useState<string[]>(carried?.electedCodes ?? [])
  const [step, setStep] = useState<StepId>("details")
  const [selectedSubjectKeys, setSelectedSubjectKeys] = useState<string[]>([])
  const [classBySubject, setClassBySubject] = useState<Record<string, string>>({})
  const [scheduleByClass, setScheduleByClass] = useState<Record<string, string>>({})
  const [expandedClassBySubject, setExpandedClassBySubject] = useState<Record<string, string>>({})
  const [loadingCatalog, setLoadingCatalog] = useState(() => Boolean(!interestOnly && carried))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [bookTrialSubjectKey, setBookTrialSubjectKey] = useState<string | null>(null)

  const electedSet = useMemo(() => new Set(electedCodes), [electedCodes])
  const catalogClasses = useMemo(
    () => filterCatalogClasses(classes, interestOnly ? false : requiresElectiveSurvey, electedSet),
    [classes, interestOnly, requiresElectiveSurvey, electedSet]
  )
  const subjectGroups = useMemo(() => buildSubjectGroups(catalogClasses), [catalogClasses])
  const groupSubjects = subjectGroups.filter((g) => {
    if (g.classKind !== "group") return false
    if (interestOnly && SENIOR_GRADES.has(grade) && g.classes.some((c) => c.subject_category === "senior_elective")) {
      return false
    }
    return true
  })
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
  const electivePartitions = useMemo(
    () => partitionTrialInviteElectives(electiveOptions, classes),
    [electiveOptions, classes]
  )

  const seniorElectiveTags = useMemo(() => {
    const byName = (a: TrialInviteElectiveOption, b: TrialInviteElectiveOption) =>
      (a.short_name || a.name_zh).localeCompare(b.short_name || b.name_zh, "zh-Hant")
    return [...electiveOptions].sort(byName)
  }, [electiveOptions])
  const chosenElectiveLabels = seniorElectiveTags
    .filter((opt) => electedCodes.includes(opt.code))
    .map((opt) => (opt.short_name || opt.name_zh).trim())
    .filter(Boolean)

  useEffect(() => {
    if (!SENIOR_GRADES.has(grade)) {
      setElectiveOptions([])
      setElectedCodes([])
      return
    }
    let cancelled = false
    void getAdTrialCatalog(grade)
      .then((catalog) => {
        if (cancelled) return
        setClasses(catalog.classes)
        setRequiresElectiveSurvey(catalog.requiresElectiveSurvey)
        setElectiveOptions(catalog.electiveOptions)
        const allowed = new Set(catalog.electiveOptions.map((opt) => opt.code))
        setElectedCodes((prev) => prev.filter((code) => allowed.has(code)))
      })
      .catch((e) => {
        if (!cancelled) reportUserFacingError(e, { source: "AdTrialPublicForm.electives", setErr })
      })
    return () => {
      cancelled = true
    }
  }, [interestOnly, grade])

  useEffect(() => {
    if (interestOnly || !carried || carryBootstrappedRef.current) return
    let cancelled = false
    setLoadingCatalog(true)
    setErr(null)
    void getAdTrialCatalog(carried.grade)
      .then((catalog) => {
        if (cancelled) return
        carryBootstrappedRef.current = true
        setClasses(catalog.classes)
        setRequiresElectiveSurvey(catalog.requiresElectiveSurvey)
        setElectiveOptions(catalog.electiveOptions)
        const allowed = new Set(catalog.electiveOptions.map((opt) => opt.code))
        setElectedCodes((prev) => prev.filter((code) => allowed.has(code)))
        resetSelections()
        const focusKey = carried.focusSubjectKey
        if (focusKey) {
          const groups = buildSubjectGroups(
            filterCatalogClasses(catalog.classes, catalog.requiresElectiveSurvey, new Set(carried.electedCodes))
          )
          if (groups.some((g) => g.key === focusKey)) {
            const group = groups.find((g) => g.key === focusKey)!
            const autofilled = pruneAndAutofillClasses([focusKey], [group], {})
            const classId = autofilled[focusKey]
            setSelectedSubjectKeys([focusKey])
            if (classId) {
              setClassBySubject({ [focusKey]: classId })
              setExpandedClassBySubject({ [focusKey]: classId })
              const cls = catalog.classes.find((c) => c.id === classId)
              const upcoming = cls ? nearestUpcomingSchedules(cls) : []
              if (upcoming.length === 1) {
                setScheduleByClass({ [classId]: upcoming[0].id })
              }
            }
          }
        }
        setStep("subject")
      })
      .catch((e) => {
        if (!cancelled) reportUserFacingError(e, { source: "AdTrialPublicForm.carryBootstrap", setErr })
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot bootstrap from interest handoff
  }, [])

  const resetSelections = () => {
    setSelectedSubjectKeys([])
    setClassBySubject({})
    setScheduleByClass({})
    setExpandedClassBySubject({})
  }

  const continueFromDetails = async () => {
    setErr(null)
    if (!fullName.trim() || fullName.trim().length > 80) {
      setErr("請填寫姓名")
      return
    }
    if (!school.trim() || school.trim().length > 120) {
      setErr("請選擇學校")
      return
    }
    if (!GRADE_OPTIONS.includes(grade as (typeof GRADE_OPTIONS)[number])) {
      setErr("請選擇中一至中六")
      return
    }
    if (contactMethod === "WeChat") {
      const id = wechatId.trim()
      if (!id || id.length > 40) {
        setErr("請填寫 WeChat ID")
        return
      }
    } else if (!adTrialPhoneLooksValid(phone)) {
      setErr("請填寫 8 位聯絡電話")
      return
    }
    if (!isSupabaseConfigured) {
      setErr("系統尚未設定，請聯絡職員。")
      return
    }
    setLoadingCatalog(true)
    try {
      const catalog = await getAdTrialCatalog(grade)
      setClasses(catalog.classes)
      setRequiresElectiveSurvey(catalog.requiresElectiveSurvey)
      setElectiveOptions(catalog.electiveOptions)
      if (!interestOnly) {
        const allowed = new Set(catalog.electiveOptions.map((opt) => opt.code))
        setElectedCodes((prev) => prev.filter((code) => allowed.has(code)))
      }
      resetSelections()
      setStep("subject")
    } catch (e) {
      reportUserFacingError(e, { source: "AdTrialPublicForm.catalog", setErr })
    } finally {
      setLoadingCatalog(false)
    }
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
    if (interestOnly) return

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

  const confirmSubjects = () => {
    const keys = selectedSubjectKeys.filter((k) => subjectGroups.some((g) => g.key === k))
    if (interestOnly) {
      if (keys.length === 0 && electedCodes.length === 0) {
        setErr("請至少選擇一科")
        return
      }
      setSelectedSubjectKeys(keys)
      setStep("confirm")
      setErr(null)
      return
    }
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
    setStep("confirm")
    setErr(null)
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

  const onSubmit = async () => {
    const interestLabels = [...new Set([...selectedGroups.map((g) => g.label), ...chosenElectiveLabels])]
    if (interestOnly) {
      if (interestLabels.length === 0) {
        setErr("請至少選擇一科")
        return
      }
    } else if (!picksComplete) {
      setErr("請至少選一堂")
      return
    }
    if (note.trim().length > 500) {
      setErr("備註過長")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      if (interestOnly) {
        await submitAdTrialInterest({
          fullName,
          school,
          grade,
          phone,
          note,
          subjects: interestLabels,
          company,
          contactMethod,
          wechatId,
        })
      } else {
        await submitAdTrial({
          fullName,
          school,
          grade,
          phone,
          note,
          lines: picks.map((p) => ({ class_id: p.classId, schedule_id: p.scheduleId })),
          electedSubjectCodes: requiresElectiveSurvey ? electedCodes : [],
          company,
          contactMethod,
          wechatId,
        })
      }
      setDone(true)
    } catch (e) {
      reportUserFacingError(e, { source: "AdTrialPublicForm.submit", setErr })
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => {
    setErr(null)
    if (step === "confirm") setStep("subject")
    else if (step === "subject" || step === "electives") setStep("details")
  }

  const bookTrialCarryBase: AdTrialCarry = {
    fullName,
    school,
    grade,
    phone,
    contactMethod,
    wechatId,
    electedCodes,
  }

  const confirmBookTrialJump = () => {
    if (!bookTrialSubjectKey) return
    const key = bookTrialSubjectKey
    setBookTrialSubjectKey(null)
    navigate("/AdTrial", {
      state: {
        adTrialCarry: { ...bookTrialCarryBase, focusSubjectKey: key },
      },
    })
  }

  const steps: { id: StepId; label: string }[] = interestOnly
    ? [
        { id: "details", label: "資料" },
        { id: "subject", label: "科目" },
        { id: "confirm", label: "確認" },
      ]
    : [
        { id: "details", label: "資料" },
        { id: "subject", label: "選堂" },
        { id: "confirm", label: "確認" },
      ]

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <Honeypot value={company} onChange={setCompany} />
      <header className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">明學教育</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {interestOnly ? "查詢登記" : "新生試堂登記"}
        </h1>
        {step === "details" && !done ? (
          <div className="space-y-2 pt-2 text-sm leading-relaxed text-muted-foreground">
            <p>明學教育為中一至中六學生提供專科班與功課輔導班，堂數少、小組上課。</p>
            {interestOnly ? (
              <>
                <p>此頁留下聯絡資料，並選擇有興趣的科目。提交後由職員以 WhatsApp 聯絡，再安排時間與收費。</p>
                <p>可只選一科或多科，不必每科都選。此頁不用選擇上課日期。</p>
              </>
            ) : (
              <>
                <p>此頁可先登記有興趣的試堂。提交後由職員以 WhatsApp 聯絡，確認時間與收費。</p>
                <p>可只選一科或多科，不必每科都選；稍後再決定是否繼續。</p>
              </>
            )}
          </div>
        ) : null}
      </header>

      {!done ? (
        <ol className="mt-6 flex gap-1" aria-label="登記進度">
          {steps.map((item, index) => {
            const current = item.id === step
            const past = steps.findIndex((s) => s.id === step) > index
            return (
              <li key={item.id} className="min-w-0 flex-1 text-center">
                <span
                  className={cn(
                    "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    current
                      ? "bg-primary text-primary-foreground"
                      : past
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <span className="mt-1 block truncate text-[11px] text-muted-foreground">{item.label}</span>
              </li>
            )
          })}
        </ol>
      ) : null}

      {err ? (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      {!done && (step === "subject" || step === "electives") ? (
        <section
          className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3"
          aria-label="已填寫的個人資料"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">已填寫個人資料</p>
              <p className="truncate text-base font-semibold text-foreground">{fullName.trim()}</p>
              <p className="text-sm text-muted-foreground">
                {formatStudentGrade(grade)} · {school.trim()}
              </p>
              <p className="text-sm text-muted-foreground">
                {contactMethod === "WeChat"
                  ? `WeChat ${wechatId.trim()}`
                  : `WhatsApp ${phone.trim()}`}
              </p>
              {chosenElectiveLabels.length > 0 ? (
                <p className="text-sm text-muted-foreground">選修：{chosenElectiveLabels.join("、")}</p>
              ) : null}
              <p className="pt-0.5 text-xs text-muted-foreground">如需修改，請返回上一步。</p>
            </div>
          </div>
        </section>
      ) : null}

      {done ? (
        <section className="mt-8 space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <p className="text-lg font-semibold text-foreground">
            {interestOnly ? "已收到查詢" : "已收到試堂登記"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {interestOnly
              ? "職員會以 WhatsApp 聯絡，按你有興趣的科目說明安排與收費。此頁不會即時留位或收款。"
              : "職員會以 WhatsApp 聯絡，核對學校與年級、確認試堂日期，並說明該堂收費。此頁不會即時留位或收款。"}
          </p>
          <ul className="space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm">
            {interestOnly
              ? [...selectedGroups.map((g) => g.label), ...chosenElectiveLabels].map((label) => (
                  <li key={label} className="font-medium text-foreground">
                    {label}
                  </li>
                ))
              : picks.map((p) => (
                  <li key={p.scheduleId}>
                    <p className="font-medium text-foreground">{p.classLabel}</p>
                    <p className="text-muted-foreground">{p.scheduleLabel}</p>
                  </li>
                ))}
          </ul>
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => {
              const name = fullName.trim() || "家長"
              const kind = interestOnly ? "查詢登記" : "新生試堂登記"
              const message = `你好，我是${name}，剛在網上提交了${kind}，想跟進確認。`
              openWhatsAppWithPrefilledText(MAINHOPE_PUBLIC_WHATSAPP, message)
            }}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp 聯絡我們
          </Button>
        </section>
      ) : step === "details" && loadingCatalog && carried ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">載入可選班別…</p>
      ) : step === "details" ? (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
          <Field label="姓名">
            <Input value={fullName} maxLength={80} autoComplete="name" onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="學校">
            <SchoolSearchableSelect value={school} onChange={setSchool} />
          </Field>
          <Field label="年級">
            <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">請選擇</option>
              {GRADE_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {formatStudentGrade(code)}
                </option>
              ))}
            </Select>
          </Field>
          {SENIOR_GRADES.has(grade) && seniorElectiveTags.length > 0 ? (
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-foreground">選修科</p>
              <p className="text-muted-foreground">可選多於一科。</p>
              <div className="flex flex-wrap gap-2">
                {seniorElectiveTags.map((opt) => (
                  <ToggleChip
                    key={opt.code}
                    pressed={electedCodes.includes(opt.code)}
                    label={opt.short_name || opt.name_zh}
                    onClick={() =>
                      setElectedCodes((prev) =>
                        prev.includes(opt.code) ? prev.filter((code) => code !== opt.code) : [...prev, opt.code]
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
          <Field label="聯絡方式">
            <Select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value === "WeChat" ? "WeChat" : "WhatsApp")}
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="WeChat">WeChat</option>
            </Select>
          </Field>
          {contactMethod === "WeChat" ? (
            <Field label="WeChat ID">
              <Input
                value={wechatId}
                maxLength={40}
                autoComplete="off"
                placeholder="WeChat ID"
                onChange={(e) => setWechatId(e.target.value)}
              />
            </Field>
          ) : (
            <Field label="電話號碼">
              <Input
                value={phone}
                inputMode="tel"
                autoComplete="tel"
                placeholder="8 位數字"
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          )}
          <Button type="button" className="w-full" disabled={loadingCatalog} onClick={() => void continueFromDetails()}>
            {loadingCatalog ? "載入科目…" : interestOnly ? "繼續選擇科目" : "繼續選堂"}
          </Button>
        </section>
      ) : step === "electives" ? (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">目前選修科目</h2>
          <p className="text-sm text-muted-foreground">中四至中六可勾選選修（可略過，只看主科與功課輔導班）。</p>
          <div className="flex flex-wrap gap-2">
            {electivePartitions.offered.map((opt) => (
              <ToggleChip
                key={opt.code}
                pressed={electedCodes.includes(opt.code)}
                label={opt.short_name || opt.name_zh}
                onClick={() =>
                  setElectedCodes((prev) =>
                    prev.includes(opt.code) ? prev.filter((c) => c !== opt.code) : [...prev, opt.code]
                  )
                }
              />
            ))}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              resetSelections()
              setStep("subject")
              setErr(null)
            }}
          >
            繼續選擇試堂
          </Button>
        </section>
      ) : classes.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {formatStudentGrade(grade)}暫時沒有已開放的試堂班別。請聯絡職員，或返回更改年級。
        </p>
      ) : step === "subject" ? (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">
            {interestOnly ? "感興趣科目" : "選擇科目與班別"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {interestOnly
              ? "選擇有興趣的科目即可，不必每科都選。我們會發送相關資料供你參考。"
              : "可只選有興趣的科目，不必每科都選。點選後再選班別與堂次。"}
          </p>
          {interestOnly ? (
            <>
              <OptionList
                title="專科班"
                description=""
                groups={groupSubjects}
                selected={selectedSubjectKeys}
                onToggle={toggleSubject}
                onRequestBookTrial={setBookTrialSubjectKey}
              />
              <OptionList
                title="功課輔導班"
                description={HOMEWORK_SUBJECT_INTRO}
                groups={homeworkSubjects}
                selected={selectedSubjectKeys}
                onToggle={toggleSubject}
                onRequestBookTrial={setBookTrialSubjectKey}
              />
            </>
          ) : (
            <>
              <SubjectClassList
                title="專科班"
                description={GROUP_SUBJECT_INTRO}
                groups={groupSubjects}
                selectedKeys={selectedSubjectKeys}
                classBySubject={classBySubject}
                expandedClassBySubject={expandedClassBySubject}
                scheduleByClass={scheduleByClass}
                onToggleSubject={toggleSubject}
                onPickClass={pickClass}
                onPickSchedule={(classId, scheduleId) =>
                  setScheduleByClass((map) => ({ ...map, [classId]: scheduleId }))
                }
              />
              <SubjectClassList
                title="功課輔導班"
                description={HOMEWORK_SUBJECT_INTRO}
                groups={homeworkSubjects}
                selectedKeys={selectedSubjectKeys}
                classBySubject={classBySubject}
                expandedClassBySubject={expandedClassBySubject}
                scheduleByClass={scheduleByClass}
                onToggleSubject={toggleSubject}
                onPickClass={pickClass}
                onPickSchedule={(classId, scheduleId) =>
                  setScheduleByClass((map) => ({ ...map, [classId]: scheduleId }))
                }
              />
            </>
          )}
          {!interestOnly && incompleteSubjectCount > 0 && picksComplete ? (
            <p className="text-center text-xs text-muted-foreground">
              已選齊 {picks.length} 科；未選堂次的科目不會列入登記
            </p>
          ) : null}
          <Button type="button" className="w-full" onClick={confirmSubjects}>
            下一步：確認
          </Button>
        </section>
      ) : (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">確認登記</h2>
          <p className="text-sm text-foreground">
            {fullName.trim()} · {formatStudentGrade(grade)} · {school.trim()} ·{" "}
            {contactMethod === "WeChat" ? wechatId.trim() : phone.trim()}
          </p>
          <ul className="space-y-2 text-sm">
            {interestOnly
              ? [...selectedGroups.map((g) => g.label), ...chosenElectiveLabels].map((label) => (
                  <li key={label} className="font-medium">
                    {label}
                  </li>
                ))
              : picks.map((p) => (
                  <li key={p.scheduleId}>
                    <p className="font-medium">{p.subjectLabel}</p>
                    <p className="text-muted-foreground">
                      {p.classLabel} · {p.scheduleLabel}
                    </p>
                  </li>
                ))}
          </ul>
          <Field label="備註（可選）">
            <textarea
              value={note}
              maxLength={500}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <Button type="button" className="w-full" disabled={saving} onClick={() => void onSubmit()}>
            {saving ? "提交中…" : "提交登記"}
          </Button>
        </section>
      )}

      {!done && step !== "details" ? (
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          disabled={saving}
          onClick={goBack}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          返回上一步
        </button>
      ) : null}

      <Dialog
        open={bookTrialSubjectKey !== null}
        onOpenChange={(open) => {
          if (!open) setBookTrialSubjectKey(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>前往預約試堂</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            即將離開查詢登記，前往新生試堂登記頁選擇班別與堂次。已填寫的個人資料會一併帶過，你會直接進入選堂步驟。
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBookTrialSubjectKey(null)}>
              取消
            </Button>
            <Button type="button" onClick={confirmBookTrialJump}>
              前往預約
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
      <label>
        Company
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

function ToggleChip({
  pressed,
  label,
  onClick,
}: {
  pressed: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm",
        pressed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
      )}
    >
      {label}
    </button>
  )
}

function OptionList({
  title,
  description,
  groups,
  selected,
  onToggle,
  onRequestBookTrial,
}: {
  title: string
  description?: string
  groups: SubjectGroup[]
  selected: string[]
  onToggle: (key: string) => void
  onRequestBookTrial?: (subjectKey: string) => void
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
      {groups.map((g) => {
        const on = selected.includes(g.key)
        const times = [...new Set(g.classes.map((cls) => classMeetingLabel(cls)).filter(Boolean))]
        return (
          <div
            key={g.key}
            className={cn(
              "relative w-full rounded-lg border px-3 py-3 text-left",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
              on && onRequestBookTrial ? "pb-14" : ""
            )}
          >
            <button
              type="button"
              aria-pressed={on}
              aria-expanded={on}
              onClick={() => onToggle(g.key)}
              className="w-full text-left"
            >
              <span className="block text-lg font-medium">{g.label}</span>
              <span className={cn("mt-0.5 block text-xs", on ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {g.classes.length} 個班別
              </span>
              {on && times.length > 0 ? (
                <span className="mt-2 block space-y-1 pr-2 text-sm text-primary-foreground/90">
                  {times.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
            {on && onRequestBookTrial ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRequestBookTrial(g.key)
                }}
                className="absolute bottom-2 right-2 inline-flex items-center rounded-md border border-background/40 bg-background px-2.5 py-1.5 text-xs font-medium text-primary shadow-sm hover:bg-background/90"
              >
                已有心水時間？即時預約試堂
              </button>
            ) : null}
          </div>
        )
      })}
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
                className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", on && "rotate-180")}
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
  onPickClass,
  onPickSchedule,
}: {
  group: SubjectGroup
  selectedClassId: string | null
  expandedClassId: string | null
  selectedScheduleId: string | null
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
              aria-pressed={active}
              aria-expanded={expanded}
              onClick={() => onPickClass(group.key, cls.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{classLabelOf(cls)}</span>
                <span className={cn("mt-0.5 block text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {classSubLabel(cls)}
                </span>
              </span>
              <ChevronDown className={cn("h-4 w-4 shrink-0", expanded && "rotate-180")} aria-hidden />
            </button>
            {expanded
              ? upcoming.map((sch) => {
                  const schActive = selectedScheduleId === sch.id
                  return (
                    <button
                      key={sch.id}
                      type="button"
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
