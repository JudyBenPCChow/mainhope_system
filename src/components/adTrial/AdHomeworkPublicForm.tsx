import { useMemo, useState, type ReactNode } from "react"
import { CheckCircle2, MessageCircle } from "lucide-react"

import { AdPublicCampusAddress, AdPublicCollectionNotice } from "@/components/adTrial/AdPublicCollectionNotice"
import { AdPublicTurnstile, resetAdPublicTurnstile } from "@/components/adTrial/AdPublicTurnstile"
import { SchoolSearchableSelect } from "@/components/students/SchoolSearchableSelect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { collectAdAttribution } from "@/lib/adAttribution"
import { homeworkDateChoices, type HomeworkDateChoice } from "@/lib/adHomeworkPublic"
import {
  adPublicSubmitCooldownRemainingMs,
  adPublicTurnstileSiteKey,
  markAdPublicSubmitCooldown,
} from "@/lib/adPublicOrigin"
import { trackAdPublicLead } from "@/lib/adTracking"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  formatStudentGrade,
  PRIMARY_STUDENT_GRADE_CODES,
  type StudentGradeCode,
} from "@/lib/studentGrade"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"
import {
  adTrialPhoneLooksValid,
  attachAdHomeworkDate,
  getAdHomeworkCatalog,
  submitAdHomeworkDetails,
} from "@/services/adTrialQueries"

type StepId = "details" | "dates"
type Intent = "later" | "trial"
type ContactMethod = "WhatsApp" | "WeChat"
type SchoolBand = "" | "primary" | "secondary"
type PhoneCountryCode = "+852" | "+86"

const SECONDARY_GRADE_OPTIONS = ["S1", "S2", "S3", "S4", "S5", "S6"] as const satisfies readonly StudentGradeCode[]

const MAINHOPE_PUBLIC_WHATSAPP = "94849539"

const STEPS: { id: StepId; label: string }[] = [
  { id: "details", label: "資料" },
  { id: "dates", label: "選日子" },
]

export function AdHomeworkPublicForm() {
  const [fullName, setFullName] = useState("")
  const [schoolBand, setSchoolBand] = useState<SchoolBand>("")
  const [school, setSchool] = useState("")
  const [grade, setGrade] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneCountryCode, setPhoneCountryCode] = useState<PhoneCountryCode>("+852")
  const [contactMethod, setContactMethod] = useState<ContactMethod>("WhatsApp")
  const [wechatId, setWechatId] = useState("")
  const [company, setCompany] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [step, setStep] = useState<StepId>("details")
  const [intent, setIntent] = useState<Intent>("later")
  const [leadId, setLeadId] = useState<string | null>(null)
  const [dates, setDates] = useState<HomeworkDateChoice[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const selectedDate = useMemo(
    () => dates.find((row) => row.scheduleId === selectedScheduleId) ?? null,
    [dates, selectedScheduleId]
  )
  const meetingLabels = useMemo(
    () => [...new Set(dates.map((row) => row.meetingLabel).filter(Boolean))],
    [dates]
  )

  const gradeOptions = schoolBand === "primary" ? PRIMARY_STUDENT_GRADE_CODES : SECONDARY_GRADE_OPTIONS

  const chooseSchoolBand = (next: SchoolBand) => {
    setSchoolBand(next)
    setSchool("")
    setGrade("")
    setErr(null)
  }

  const detailsError = (): string | null => {
    if (!fullName.trim() || fullName.trim().length > 80) return "請填寫稱呼"
    if (schoolBand !== "primary" && schoolBand !== "secondary") return "請選擇小學或中學"
    if (!school.trim() || school.trim().length > 120) {
      return schoolBand === "primary" ? "請填寫學校" : "請選擇學校"
    }
    if (!(gradeOptions as readonly string[]).includes(grade)) return "請選擇年級"
    if (contactMethod === "WeChat") {
      const id = wechatId.trim()
      if (!id || id.length > 40) return "請填寫 WeChat ID"
    } else if (!adTrialPhoneLooksValid(phone, phoneCountryCode)) {
      return phoneCountryCode === "+86" ? "請填寫 11 位聯絡電話" : "請填寫 8 位聯絡電話"
    }
    if (!isSupabaseConfigured) return "系統尚未設定，請聯絡職員。"
    return null
  }

  const submitDetails = async () => {
    const problem = detailsError()
    setErr(problem)
    if (problem) return
    const cooldownMs = adPublicSubmitCooldownRemainingMs()
    if (cooldownMs > 0) {
      setErr(`請稍候 ${Math.ceil(cooldownMs / 1000)} 秒再提交`)
      return
    }
    const needTurnstile = Boolean(adPublicTurnstileSiteKey())
    if (needTurnstile && !turnstileToken) {
      setErr("請完成人機驗證")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const attribution = collectAdAttribution()
      const id = await submitAdHomeworkDetails({
        fullName,
        school,
        grade,
        phone,
        note: "",
        company,
        contactMethod,
        wechatId,
        phoneCountryCode,
        turnstileToken: turnstileToken ?? "",
        attribution,
      })
      markAdPublicSubmitCooldown()
      await trackAdPublicLead({
        eventId: attribution.eventId,
        mode: "homework",
        phone,
        phoneCountryCode,
        contactMethod,
      })
      setLeadId(id)
      try {
        const classes = await getAdHomeworkCatalog()
        const choices = homeworkDateChoices(classes)
        setDates(choices)
        setSelectedScheduleId((prev) => (choices.some((row) => row.scheduleId === prev) ? prev : null))
      } catch (e) {
        setDates([])
        reportUserFacingError(e, { source: "AdHomeworkPublicForm.catalog", setErr })
      }
      setStep("dates")
    } catch (e) {
      resetAdPublicTurnstile()
      setTurnstileToken(null)
      reportUserFacingError(e, { source: "AdHomeworkPublicForm.details", setErr })
    } finally {
      setSaving(false)
    }
  }

  const finishLater = () => {
    setErr(null)
    setIntent("later")
    setDone(true)
  }

  const submitDate = async () => {
    if (!selectedDate) {
      setErr("請選擇一個試堂日子")
      return
    }
    if (!leadId) {
      setErr("資料已提交。如要預約試堂日子，請用 WhatsApp 聯絡我們。")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      await attachAdHomeworkDate({
        leadId,
        classId: selectedDate.classId,
        scheduleId: selectedDate.scheduleId,
        company,
      })
      setIntent("trial")
      setDone(true)
    } catch (e) {
      reportUserFacingError(e, { source: "AdHomeworkPublicForm.date", setErr })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <Honeypot value={company} onChange={setCompany} />
      <header className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">明學教育</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">功課輔導班查詢</h1>
        {step === "details" && !done ? (
          <div className="space-y-2 pt-2 text-sm leading-relaxed text-muted-foreground">
            <AdPublicCampusAddress />
            <p>請先提交聯絡資料。提交後可選擇試堂日子，或請職員先聯絡你。</p>
            <p>此頁不會即時留位或收款。</p>
          </div>
        ) : null}
      </header>

      {!done ? (
        <ol className="mt-6 flex gap-1" aria-label="登記進度">
          {STEPS.map((item, index) => {
            const current = item.id === step
            const past = STEPS.findIndex((s) => s.id === step) > index
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

      {done ? (
        <section className="mt-8 space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <p className="text-lg font-semibold text-foreground">
            {intent === "later" ? "已收到查詢" : "已收到試堂登記"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {intent === "later"
              ? "職員會聯絡你，說明功課輔導班的安排與收費。此頁不會即時留位或收款。"
              : "我們會盡快與你聯絡，以確認試堂日期。你亦可以透過下方 WhatsApp 按鈕與我們聯絡"}
          </p>
          <ul className="space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm">
            <li className="font-medium text-foreground">功課輔導班</li>
            {intent === "trial" && selectedDate ? (
              <li className="text-muted-foreground">{selectedDate.line}</li>
            ) : (
              <li className="text-muted-foreground">暫不約堂，請先聯絡我</li>
            )}
          </ul>
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => {
              const name = fullName.trim() || "家長"
              const message =
                intent === "later"
                  ? `你好，我是${name}，剛在網上提交了功課輔導班查詢，請先聯絡我。`
                  : `你好，我是${name}，剛在網上提交了功課輔導班試堂登記，想跟進確認。`
              openWhatsAppWithPrefilledText(MAINHOPE_PUBLIC_WHATSAPP, message)
            }}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp 聯絡我們
          </Button>
        </section>
      ) : step === "details" ? (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
          <Field label="稱呼">
            <Input value={fullName} maxLength={80} autoComplete="name" onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="就讀">
            <Select
              value={schoolBand}
              onChange={(e) =>
                chooseSchoolBand(
                  e.target.value === "primary" ? "primary" : e.target.value === "secondary" ? "secondary" : ""
                )
              }
            >
              <option value="">請選擇小學或中學</option>
              <option value="primary">小學</option>
              <option value="secondary">中學</option>
            </Select>
          </Field>
          <Field label="學校">
            {schoolBand === "secondary" ? (
              <SchoolSearchableSelect value={school} onChange={setSchool} />
            ) : (
              <Input
                value={school}
                maxLength={120}
                disabled={!schoolBand}
                placeholder={schoolBand === "primary" ? "請輸入學校名稱" : "請先選擇小學或中學"}
                onChange={(e) => setSchool(e.target.value)}
              />
            )}
          </Field>
          <Field label="年級">
            <Select
              value={grade}
              disabled={!schoolBand}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">{schoolBand ? "請選擇" : "請先選擇小學或中學"}</option>
              {schoolBand
                ? gradeOptions.map((code) => (
                    <option key={code} value={code}>
                      {formatStudentGrade(code)}
                    </option>
                  ))
                : null}
            </Select>
          </Field>
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
              <div className="flex gap-2">
                <Select
                  className="w-[7.25rem] shrink-0"
                  aria-label="區碼"
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value === "+86" ? "+86" : "+852")}
                >
                  <option value="+852">+852</option>
                  <option value="+86">+86</option>
                </Select>
                <Input
                  className="min-w-0 flex-1"
                  value={phone}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={phoneCountryCode === "+86" ? "11 位數字" : "8 位數字"}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </Field>
          )}
          <AdPublicCollectionNotice />
          <AdPublicTurnstile onToken={setTurnstileToken} />
          <Button type="button" className="w-full" disabled={saving} onClick={() => void submitDetails()}>
            {saving ? "提交中…" : "下一步"}
          </Button>
        </section>
      ) : (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">選擇試堂日子</h2>
          <p className="text-sm text-muted-foreground">
            請選擇可試堂的日子（期間兩小時），又可跳過等候我們聯絡。
          </p>
          {dates.length === 0 ? (
            <p className="text-sm text-muted-foreground">暫時沒有已開放的試堂日子。</p>
          ) : (
            <div className="space-y-2">
              {dates.map((row) => {
                const on = row.scheduleId === selectedScheduleId
                return (
                  <button
                    key={row.scheduleId}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setErr(null)
                      setSelectedScheduleId(row.scheduleId)
                    }}
                    className={cn(
                      "w-full rounded-lg border px-3 py-3 text-left text-sm",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                    )}
                  >
                    <span className="block font-medium">{row.line}</span>
                    {meetingLabels.length > 1 && row.meetingLabel ? (
                      <span className={cn("mt-0.5 block text-xs", on ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {row.meetingLabel}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
          {dates.length > 0 ? (
            <Button type="button" className="w-full" disabled={saving} onClick={() => void submitDate()}>
              {saving ? "提交中…" : "提交此試堂日子"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="w-full" disabled={saving} onClick={finishLater}>
            暫不約堂，請先聯絡我
          </Button>
        </section>
      )}
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
