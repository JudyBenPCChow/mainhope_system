import { useMemo, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AdPublicCollectionNotice } from "@/components/adTrial/AdPublicCollectionNotice"
import { AdHomeworkLanding } from "@/components/adTrial/AdPublicMarketing"
import { AdPublicTurnstile, resetAdPublicTurnstile } from "@/components/adTrial/AdPublicTurnstile"
import { SchoolSearchableSelect } from "@/components/students/SchoolSearchableSelect"
import { HK_PRIMARY_SCHOOLS } from "@/lib/hkPrimarySchools"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useAdHomeworkScrollEffects } from "@/hooks/useAdHomeworkScrollEffects"
import { AD_PUBLIC_CONTACT } from "@/lib/adPublicContact"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"
import "@/components/adTrial/adHomeworkPublic.css"
import { collectAdAttribution } from "@/lib/adAttribution"
import { homeworkDateChoices, type HomeworkDateChoice } from "@/lib/adHomeworkPublic"
import { AD_ENROLL_FORM_ID, scrollToAdEnrollForm } from "@/lib/adPublicFormAnchor"
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
import {
  adTrialPhoneLooksValid,
  attachAdHomeworkDate,
  getAdHomeworkCatalog,
  submitAdHomeworkDetails,
} from "@/services/adTrialQueries"

type StepId = "details" | "dates"
type ContactMethod = "WhatsApp" | "WeChat"
type SchoolBand = "" | "primary" | "secondary"
type PhoneCountryCode = "+852" | "+86"

const SECONDARY_GRADE_OPTIONS = ["S1", "S2", "S3", "S4", "S5", "S6"] as const satisfies readonly StudentGradeCode[]

export function AdHomeworkPublicForm() {
  const rootRef = useRef<HTMLDivElement>(null)
  const motionMode = useAdHomeworkScrollEffects(rootRef)
  const navigate = useNavigate()
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
  const [leadId, setLeadId] = useState<string | null>(null)
  const [dates, setDates] = useState<HomeworkDateChoice[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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
      return "請選擇學校"
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
    navigate("/AdHomework/thanks", {
      state: {
        fullName: fullName.trim(),
        summaryLines: ["功課輔導班", "暫不約堂，請先聯絡我"],
      },
    })
  }

  const submitDate = async () => {
    if (!selectedDate) {
      setErr("請選擇一個試堂日子")
      return
    }
    if (!leadId) {
      setErr("資料已提交。如要預約試堂日子，請用 WhatsApp 聯絡本社。")
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
      navigate("/AdHomework/thanks", {
        state: {
          fullName: fullName.trim(),
          summaryLines: ["功課輔導班", selectedDate.line],
        },
      })
    } catch (e) {
      reportUserFacingError(e, { source: "AdHomeworkPublicForm.date", setErr })
    } finally {
      setSaving(false)
    }
  }

  const askWhatsApp = () => openWhatsAppWithPrefilledText(AD_PUBLIC_CONTACT.whatsappDigits, "想查詢功課輔導班")

  return (
    <div ref={rootRef} className="ad-hw" data-motion={motionMode}>
      <Honeypot value={company} onChange={setCompany} />
      {step === "details" ? (
        <AdHomeworkLanding onPrimary={scrollToAdEnrollForm} />
      ) : (
        <header className="hero is-compact">
          <div className="shell hero-inner hero-enter">
            <p className="eyebrow">明學教育 · 功課輔導班</p>
            <h1>選擇試堂日子</h1>
            <p className="hero-lead">資料已收到。可選一個試堂日子，或請本社先聯絡。</p>
          </div>
        </header>
      )}

      <section className="section section-tint" id={AD_ENROLL_FORM_ID} data-reveal>
        <div className="shell">
          {step === "details" ? (
            <div className="section-head">
              <h2>登記／查詢功輔班</h2>
              <p>提交後可再選試堂日子，或請本社先聯絡。此頁不會即時留位或收款。</p>
            </div>
          ) : null}

          <div className="form-card">
            {err ? (
              <p role="alert" className="form-error">
                {err}
              </p>
            ) : null}

            {step === "details" ? (
              <>
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
                  ) : schoolBand === "primary" ? (
                    <SchoolSearchableSelect value={school} onChange={setSchool} schools={HK_PRIMARY_SCHOOLS} />
                  ) : (
                    <Input value="" disabled placeholder="請先選擇小學或中學" />
                  )}
                </Field>
                <Field label="年級">
                  <Select value={grade} disabled={!schoolBand} onChange={(e) => setGrade(e.target.value)}>
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
                    <div className="phone-row">
                      <Select
                        aria-label="區碼"
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value === "+86" ? "+86" : "+852")}
                      >
                        <option value="+852">+852</option>
                        <option value="+86">+86</option>
                      </Select>
                      <Input
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
                <div className="form-actions">
                  <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void submitDetails()}>
                    {saving ? "提交中…" : "下一步"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {dates.length === 0 ? (
                  <p className="fee-note">暫時沒有已開放的試堂日子。</p>
                ) : (
                  <div className="date-list">
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
                          className={on ? "date-choice is-on" : "date-choice"}
                        >
                          {row.line}
                          {meetingLabels.length > 1 && row.meetingLabel ? <small>{row.meetingLabel}</small> : null}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="form-actions">
                  {dates.length > 0 ? (
                    <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void submitDate()}>
                      {saving ? "提交中…" : "提交此試堂日子"}
                    </button>
                  ) : null}
                  <button type="button" className="escape" disabled={saving} onClick={finishLater}>
                    暫不約堂，請先聯絡我
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <AdHomeworkSiteFooter />
      <nav className="sticky-bar" aria-label="登記與聯絡">
        <button type="button" className="btn btn-primary" onClick={scrollToAdEnrollForm}>
          {step === "details" ? "立即登記半價試堂" : "選擇日子"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={askWhatsApp}>
          WhatsApp
        </button>
      </nav>
    </div>
  )
}

function AdHomeworkSiteFooter() {
  return (
    <footer className="site">
      <div className="shell">
        <p className="brand-lockup">
          {AD_PUBLIC_CONTACT.brandZh}
          <span>{AD_PUBLIC_CONTACT.brandEn}</span>
        </p>
        <dl>
          <dt>地址</dt>
          <dd>{AD_PUBLIC_CONTACT.addressZh}</dd>
          <dt>電話</dt>
          <dd>
            <a href={`tel:${AD_PUBLIC_CONTACT.phoneTel}`}>{AD_PUBLIC_CONTACT.phoneDisplay}</a>
          </dd>
          <dt>WhatsApp</dt>
          <dd>
            <a href={`https://wa.me/852${AD_PUBLIC_CONTACT.whatsappDigits}`} target="_blank" rel="noopener noreferrer">
              {AD_PUBLIC_CONTACT.whatsappDisplay}
            </a>
          </dd>
          <dt>微信</dt>
          <dd>{AD_PUBLIC_CONTACT.wechat}</dd>
          <dt>註冊教育機構編號</dt>
          <dd>{AD_PUBLIC_CONTACT.educationRegNo}</dd>
        </dl>
        <p>
          <Link to="/Privacy">私隱政策</Link>
          <span> · </span>
          <a href={AD_PUBLIC_CONTACT.website} target="_blank" rel="noopener noreferrer">
            官網
          </a>
        </p>
      </div>
    </footer>
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
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  )
}
