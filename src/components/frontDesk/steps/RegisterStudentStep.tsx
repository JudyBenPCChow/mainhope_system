import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Copy, Link2, MessageCircle, RefreshCw } from "lucide-react"

import {
 emptyIntakeForm,
 normalizeIntakeForInsert,
 payloadFromPartial,
 StudentIntakeFormFields,
} from "@/components/frontDesk/StudentIntakeFormFields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppBanner } from "@/lib/appBanner"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { nextStudentCode } from "@/lib/studentCode"
import {
 consumeFrontDeskIntakeSession,
 createFrontDeskIntakeSession,
 getFrontDeskIntakeSession,
 intakeParentFormUrl,
 type FrontDeskIntakePayload,
 type FrontDeskIntakeSession,
} from "@/services/frontDeskIntakeQueries"
import {
 fetchAllStudents,
 insertStudent,
 isUniqueViolation,
 type StudentRecord,
} from "@/services/studentQueries"

const INTAKE_STORAGE_KEY = "frontDeskIntakeToken"

function isValidPhoneForCode(raw: string | null | undefined, countryCode: string | null | undefined): boolean {
 const s = (raw ?? "").trim()
 if (!s) return true
 const digits = s.replace(/[\s-]/g, "")
 if (!/^\d+$/.test(digits)) return false
 if (countryCode === "+86") return digits.length === 11
 return digits.length === 8
}

function isValidWhatsApp(raw: string | null | undefined): boolean {
 const s = (raw ?? "").trim()
 if (!s) return true
 const digits = s.replace(/[\s-]/g, "")
 return /^\d+$/.test(digits) && (digits.length === 8 || digits.length === 11)
}

function isValidBirthDate(raw: string | null | undefined): boolean {
 const s = (raw ?? "").trim()
 if (!s) return true
 const today = new Date()
 const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
 return s <= ymd
}

type Props = {
 onRegistered: (student: StudentRecord) => void
}

type FillMode = "staff" | "parent"

export function RegisterStudentStep({ onRegistered }: Props) {
 const { pushBanner } = useAppBanner()
 const [searchParams, setSearchParams] = useSearchParams()
 const [mode, setMode] = useState<FillMode>("staff")
 const [form, setForm] = useState<FrontDeskIntakePayload>(emptyIntakeForm)
 const [studentCode, setStudentCode] = useState("")
 const [extraSchools, setExtraSchools] = useState<string[]>([])
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)

 const [intake, setIntake] = useState<FrontDeskIntakeSession | null>(null)
 const [intakeLoading, setIntakeLoading] = useState(false)
 const [checking, setChecking] = useState(false)
 const [intakeUrl, setIntakeUrl] = useState("")
 const [parentSubmitted, setParentSubmitted] = useState(false)

 const persistIntakeToken = useCallback(
  (token: string | null) => {
   if (token) {
    sessionStorage.setItem(INTAKE_STORAGE_KEY, token)
    const next = new URLSearchParams(searchParams)
    next.set("intakeToken", token)
    setSearchParams(next, { replace: true })
   } else {
    sessionStorage.removeItem(INTAKE_STORAGE_KEY)
    const next = new URLSearchParams(searchParams)
    next.delete("intakeToken")
    setSearchParams(next, { replace: true })
   }
  },
  [searchParams, setSearchParams]
 )

 const applySession = useCallback(
  (s: FrontDeskIntakeSession, opts?: { notify?: boolean }) => {
   setIntake(s)
   setIntakeUrl(intakeParentFormUrl(s.token))
   if (s.status === "submitted") {
    setForm(payloadFromPartial(s.payload))
    setParentSubmitted(true)
    if (opts?.notify) {
     pushBanner({ tone: "success", title: "家長已提交資料", message: "請核對後建立學生。" })
    }
   } else if (s.status === "open") {
    setParentSubmitted(false)
   } else if (s.status === "consumed" || s.status === "expired" || s.status === "cancelled") {
    setErr(`此填表連結已失效（${s.status}），請重新產生。`)
    setParentSubmitted(false)
   }
  },
  [pushBanner]
 )

 const checkIntakeStatus = useCallback(
  async (token: string, opts?: { notify?: boolean; silent?: boolean }) => {
   if (!opts?.silent) setChecking(true)
   setErr(null)
   try {
    const s = await getFrontDeskIntakeSession(token)
    applySession(s, { notify: opts?.notify && s.status === "submitted" })
    return s
   } catch (e) {
    if (!opts?.silent) {
     reportUserFacingError(e, { source: "RegisterStudentStep.checkIntake", setErr })
    }
    return null
   } finally {
    if (!opts?.silent) setChecking(false)
   }
  },
  [applySession]
 )

 useEffect(() => {
  void fetchAllStudents()
   .then((rows) => {
    setExtraSchools(rows.map((r) => (r.school ?? "").trim()).filter(Boolean))
    setStudentCode(nextStudentCode(rows))
   })
   .catch(() => setStudentCode(nextStudentCode([])))
 }, [])

 // 進入頁面時還原進行中的家長連結（URL 或本分頁 sessionStorage）
 useEffect(() => {
  const fromUrl = searchParams.get("intakeToken")?.trim() || ""
  const fromStorage = sessionStorage.getItem(INTAKE_STORAGE_KEY)?.trim() || ""
  const token = fromUrl || fromStorage
  if (!token || intake?.token === token) return
  setMode("parent")
  void checkIntakeStatus(token, { notify: true }).then((s) => {
   if (s && !fromUrl) persistIntakeToken(s.token)
  })
  // 僅在初次還原時跑
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [])

 // 停留本頁時輕量輪詢；離開後不強制，回來可按「檢查是否已提交」
 useEffect(() => {
  if (mode !== "parent" || !intake?.token || parentSubmitted) return
  const token = intake.token
  const id = window.setInterval(() => {
   void checkIntakeStatus(token, { silent: true, notify: true })
  }, 5000)
  return () => window.clearInterval(id)
 }, [mode, intake?.token, parentSubmitted, checkIntakeStatus])

 const createLinkSession = async () => {
  setIntakeLoading(true)
  setErr(null)
  setParentSubmitted(false)
  try {
   const s = await createFrontDeskIntakeSession()
   const url = intakeParentFormUrl(s.token)
   setIntake(s)
   setIntakeUrl(url)
   persistIntakeToken(s.token)
   pushBanner({
    tone: "info",
    title: "已產生家長填表連結",
    message: "可先離開做其他事；家長填完後回來按「檢查是否已提交」即可。",
   })
  } catch (e) {
   reportUserFacingError(e, { source: "RegisterStudentStep.createLink", setErr })
  } finally {
   setIntakeLoading(false)
  }
 }

 const copyLink = async () => {
  if (!intakeUrl) return
  try {
   await navigator.clipboard.writeText(intakeUrl)
   pushBanner({ tone: "success", title: "已複製連結" })
  } catch {
   pushBanner({ tone: "warning", title: "無法自動複製", message: intakeUrl })
  }
 }

 const shareWhatsApp = () => {
  if (!intakeUrl) return
  const text = `請填寫新生資料：${intakeUrl}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
 }

 const validateForm = (): string | null => {
  if (!(form.full_name ?? "").trim()) return "請填寫中文姓名"
  if (!isValidPhoneForCode(form.student_phone, form.student_phone_country_code)) {
   return form.student_phone_country_code === "+86"
    ? "學生電話格式不正確（+86 需為 11 位數字）"
    : "學生電話格式不正確（+852 需為 8 位數字）"
  }
  if (!isValidPhoneForCode(form.parent_phone, form.parent_phone_country_code)) {
   return form.parent_phone_country_code === "+86"
    ? "家長電話格式不正確（+86 需為 11 位數字）"
    : "家長電話格式不正確（+852 需為 8 位數字）"
  }
  if (!isValidWhatsApp(form.whatsapp)) return "WhatsApp 號碼格式不正確（需為 8 或 11 位數字）"
  if (!isValidBirthDate(form.date_of_birth)) return "出生日期不可為未來日期"
  return null
 }

 const onSubmit = async () => {
  if (saving) return
  const v = validateForm()
  if (v) {
   setErr(v)
   return
  }
  setSaving(true)
  setErr(null)
  const payload = normalizeIntakeForInsert(form)
  try {
   let created: StudentRecord
   try {
    created = await insertStudent({ ...payload, student_code: studentCode.trim() || null })
   } catch (e) {
    if (isUniqueViolation(e)) {
     const fresh = await fetchAllStudents()
     created = await insertStudent({ ...payload, student_code: nextStudentCode(fresh) })
    } else {
     throw e
    }
   }
   if (intake?.token && parentSubmitted) {
    try {
     await consumeFrontDeskIntakeSession(intake.token)
    } catch {
     /* 非關鍵 */
    }
   }
   persistIntakeToken(null)
   pushBanner({
    tone: "success",
    title: "已建立學生",
    message: "請繼續報讀班別。",
    action: {
     pageLabel: "學生詳細",
     to: `/Students/${encodeURIComponent(created.id)}`,
    },
   })
   onRegistered(created)
  } catch (e) {
   if (isUniqueViolation(e)) {
    setErr("學號重複，請重新整理後再試。")
   } else {
    reportUserFacingError(e, { source: "RegisterStudentStep.onSubmit", setErr })
   }
  } finally {
   setSaving(false)
  }
 }

 return (
  <div className="space-y-6">
   <p className="text-sm text-muted-foreground">
    本步驟只建立學生基本資料。可由前台填寫，或產生連結傳給家長自填後，職員核對再建立。
   </p>

   <div className="flex flex-wrap gap-2">
    <Button
     type="button"
     variant={mode === "staff" ? "default" : "outline"}
     onClick={() => setMode("staff")}
    >
     前台填寫
    </Button>
    <Button
     type="button"
     variant={mode === "parent" ? "default" : "outline"}
     onClick={() => {
      setMode("parent")
      if (!intake) void createLinkSession()
     }}
    >
     <Link2 className="h-4 w-4" aria-hidden />
     家長連結填寫
    </Button>
   </div>

   {mode === "parent" ? (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
       <h3 className="text-sm font-semibold">家長填表連結</h3>
       <p className="mt-1 text-xs text-muted-foreground">
        <strong>不必一直留在本頁。</strong>
        連結約 4 小時有效；可先傳給家長、去做其他事，之後再回來按「檢查是否已提交」。
       </p>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={intakeLoading} onClick={() => void createLinkSession()}>
       <RefreshCw className="h-4 w-4" aria-hidden />
       {intake ? "重新產生" : "產生連結"}
      </Button>
     </div>
     {intakeLoading ? <p className="text-sm text-muted-foreground">產生中…</p> : null}
     {intake && intakeUrl ? (
      <div className="space-y-3 text-sm">
       <p>
        狀態：
        <span className="font-medium">
         {parentSubmitted || intake.status === "submitted" ? "家長已提交，請核對" : "等待家長填寫中"}
        </span>
       </p>
       <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input readOnly value={intakeUrl} className="font-mono text-xs" aria-label="家長填表連結" />
        <div className="flex shrink-0 flex-wrap gap-2">
         <Button type="button" size="sm" onClick={() => void copyLink()}>
          <Copy className="h-4 w-4" aria-hidden />
          複製連結
         </Button>
         <Button type="button" size="sm" variant="outline" onClick={shareWhatsApp}>
          <MessageCircle className="h-4 w-4" aria-hidden />
          用 WhatsApp 傳送
         </Button>
        </div>
       </div>
       {!parentSubmitted ? (
        <Button
         type="button"
         variant="secondary"
         size="sm"
         disabled={checking}
         onClick={() => void checkIntakeStatus(intake.token, { notify: true })}
        >
         <RefreshCw className="h-4 w-4" aria-hidden />
         {checking ? "檢查中…" : "檢查是否已提交"}
        </Button>
       ) : null}
      </div>
     ) : null}
     {parentSubmitted ? (
      <p className="text-sm text-success" role="status">
       已收到家長資料，請核對下方欄位後按「確認無誤並建立學生」。
      </p>
     ) : (
      <p className="text-sm text-muted-foreground">亦可切換「前台填寫」自行輸入。</p>
     )}
    </div>
   ) : null}

   {err ? (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {(mode === "staff" || parentSubmitted) && (
    <>
     <StudentIntakeFormFields
      value={form}
      onChange={setForm}
      extraSchools={extraSchools}
      showStudentCode={studentCode}
      disabled={saving}
     />
     <Button
      type="button"
      disabled={saving || !(form.full_name ?? "").trim()}
      onClick={() => void onSubmit()}
     >
      {saving ? "建立中…" : parentSubmitted ? "確認無誤並建立學生" : "建立並繼續報讀"}
     </Button>
    </>
   )}
  </div>
 )
}
