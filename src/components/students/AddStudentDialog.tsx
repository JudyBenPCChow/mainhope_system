import { useCallback, useEffect, useState } from "react"
import { Link2, Plus } from "lucide-react"

import { ParentIntakeLinkPanel } from "@/components/frontDesk/ParentIntakeLinkPanel"
import {
  emptyIntakeForm,
  normalizeIntakeForInsert,
  payloadFromPartial,
  StudentIntakeFormFields,
} from "@/components/frontDesk/StudentIntakeFormFields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { confirmCreateGraduatedStudent, logCreateGraduatedStudent } from "@/lib/graduationGuard"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
  consumeFrontDeskIntakeSession,
  createFrontDeskIntakeSession,
  getFrontDeskIntakeSession,
  intakeParentFormUrl,
  type FrontDeskIntakePayload,
  type FrontDeskIntakeSession,
} from "@/services/frontDeskIntakeQueries"
import { allocateNextStudentCode, insertStudent, isUniqueViolation } from "@/services/studentQueries"

type FillMode = "staff" | "parent"

function isValidPhoneForCode(raw: string | null | undefined, countryCode: string | null | undefined): boolean {
  const s = (raw ?? "").trim()
  if (!s) return true
  const digits = s.replace(/[\s-]/g, "")
  if (!/^\d+$/.test(digits)) return false
  if (countryCode === "+86") return digits.length === 11
  return digits.length === 8
}

function isValidBirthDate(raw: string | null | undefined): boolean {
  const s = (raw ?? "").trim()
  if (!s) return true
  const today = new Date()
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  return s <= ymd
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  extraSchools: string[]
  /** 收件匣／URL 帶入的家長填表 token */
  initialIntakeToken?: string | null
  onCreated: () => void | Promise<void>
  /** 關閉時清掉 URL 上的 intakeToken */
  onClearIntakeToken?: () => void
}

export function AddStudentDialog({
  open,
  onOpenChange,
  extraSchools,
  initialIntakeToken,
  onCreated,
  onClearIntakeToken,
}: Props) {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()

  const [mode, setMode] = useState<FillMode>("staff")
  const [form, setForm] = useState<FrontDeskIntakePayload>(emptyIntakeForm)
  const [studentCode, setStudentCode] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [intake, setIntake] = useState<FrontDeskIntakeSession | null>(null)
  const [intakeUrl, setIntakeUrl] = useState("")
  const [intakeLoading, setIntakeLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [parentSubmitted, setParentSubmitted] = useState(false)

  const resetLocal = useCallback(() => {
    setMode("staff")
    setForm(emptyIntakeForm())
    setErr(null)
    setSaving(false)
    setIntake(null)
    setIntakeUrl("")
    setIntakeLoading(false)
    setChecking(false)
    setParentSubmitted(false)
  }, [])

  const applySession = useCallback(
    (s: FrontDeskIntakeSession, opts?: { notify?: boolean }) => {
      setIntake(s)
      setIntakeUrl(intakeParentFormUrl(s.token))
      if (s.status === "submitted") {
        setForm(payloadFromPartial(s.payload))
        setParentSubmitted(true)
        setMode("parent")
        if (opts?.notify) {
          pushBanner({ tone: "success", title: "家長已提交資料", message: "請核對後建立學生。" })
        }
      } else if (s.status === "open") {
        setParentSubmitted(false)
        setMode("parent")
      } else if (s.status === "consumed" || s.status === "expired" || s.status === "cancelled") {
        setErr(`此填表連結已失效（${s.status}），請重新產生。`)
        setParentSubmitted(false)
        setMode("parent")
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
          reportUserFacingError(e, { source: "AddStudentDialog.checkIntake", setErr })
        }
        return null
      } finally {
        if (!opts?.silent) setChecking(false)
      }
    },
    [applySession]
  )

  // 開啟時預配學號；若有 intakeToken 則載入家長稿
  useEffect(() => {
    if (!open) return
    let cancelled = false
    void allocateNextStudentCode()
      .then((code) => {
        if (!cancelled) setStudentCode(code)
      })
      .catch(() => {
        if (!cancelled) setStudentCode("")
      })

    const token = (initialIntakeToken ?? "").trim()
    if (token && isSupabaseConfigured) {
      setMode("parent")
      void checkIntakeStatus(token, { notify: true })
    }
    return () => {
      cancelled = true
    }
    // 僅在開啟／token 變更時還原
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialIntakeToken])

  useEffect(() => {
    if (!open || mode !== "parent" || !intake?.token || parentSubmitted) return
    const token = intake.token
    const id = window.setInterval(() => {
      void checkIntakeStatus(token, { silent: true, notify: true })
    }, 5000)
    return () => window.clearInterval(id)
  }, [open, mode, intake?.token, parentSubmitted, checkIntakeStatus])

  const createLinkSession = async () => {
    setIntakeLoading(true)
    setErr(null)
    setParentSubmitted(false)
    try {
      const s = await createFrontDeskIntakeSession()
      setIntake(s)
      setIntakeUrl(intakeParentFormUrl(s.token))
      pushBanner({
        tone: "info",
        title: "已產生家長填表連結",
        message: "可先傳給家長；填完後收件匣會通知，或回來按「檢查是否已提交」。",
      })
    } catch (e) {
      reportUserFacingError(e, { source: "AddStudentDialog.createLink", setErr })
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
    if (!isValidBirthDate(form.date_of_birth)) return "出生日期不可為未來日期"
    return null
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetLocal()
      onClearIntakeToken?.()
    }
    onOpenChange(next)
  }

  const onSubmit = async () => {
    if (saving) return
    const v = validateForm()
    if (v) {
      setErr(v)
      return
    }
    const fullName = form.full_name.trim()
    if (form.academic_stage === "已畢業") {
      const ok = await confirmCreateGraduatedStudent(confirmDialog, { studentName: fullName })
      if (!ok) return
    }

    setSaving(true)
    setErr(null)
    const payload = normalizeIntakeForInsert(form)
    try {
      try {
        await insertStudent({ ...payload, student_code: studentCode.trim() || null })
      } catch (e) {
        if (isUniqueViolation(e)) {
          await insertStudent({ ...payload, student_code: await allocateNextStudentCode() })
        } else {
          throw e
        }
      }
      if (payload.academic_stage === "已畢業") {
        logCreateGraduatedStudent({ studentName: fullName, source: "AddStudentDialog.onSubmit" })
      }
      if (intake?.token && parentSubmitted) {
        try {
          await consumeFrontDeskIntakeSession(intake.token)
        } catch {
          /* 非關鍵 */
        }
      }
      pushBanner({
        tone: "success",
        title: "已建立學生",
        message: "請到學生詳細頁「報讀班別」分頁再新增班別。",
      })
      handleOpenChange(false)
      await onCreated()
    } catch (e) {
      if (isUniqueViolation(e)) {
        setErr("學號重複，請關閉視窗重新整理後再試。")
      } else {
        reportUserFacingError(e, { source: "AddStudentDialog.onSubmit", setErr })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="h-4 w-4" />
          新增學生
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增學生</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          新增僅建立學生基本資料，不包含報讀班別；完成後請到學生詳細頁「報讀班別」分頁再新增班別。可由前台填寫，或產生連結給家長自填後核對建立。
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
          <ParentIntakeLinkPanel
            intake={intake}
            intakeUrl={intakeUrl}
            intakeLoading={intakeLoading}
            checking={checking}
            parentSubmitted={parentSubmitted}
            onCreateLink={() => void createLinkSession()}
            onCopyLink={() => void copyLink()}
            onShareWhatsApp={shareWhatsApp}
            onCheckStatus={() => {
              if (intake?.token) void checkIntakeStatus(intake.token, { notify: true })
            }}
          />
        ) : null}

        {err ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {err}
          </div>
        ) : null}

        {(mode === "staff" || parentSubmitted) && (
          <div className="space-y-6">
            <StudentIntakeFormFields
              value={form}
              onChange={setForm}
              extraSchools={extraSchools}
              showStudentCode={studentCode}
              disabled={saving}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={() => handleOpenChange(false)}>
                取消
              </Button>
              <Button
                type="button"
                onClick={() => void onSubmit()}
                disabled={saving || !(form.full_name ?? "").trim()}
              >
                {saving ? "建立中…" : parentSubmitted ? "確認無誤並建立學生" : "建立"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
