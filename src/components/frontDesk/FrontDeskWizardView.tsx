import { useCallback, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { AdminPageHeader, pagePadClass } from "@/components/detail/AdminPageHeader"
import { EnrollClassStep } from "@/components/frontDesk/steps/EnrollClassStep"
import { LeaveStep } from "@/components/frontDesk/steps/LeaveStep"
import { PaymentStep } from "@/components/frontDesk/steps/PaymentStep"
import { RegisterStudentStep } from "@/components/frontDesk/steps/RegisterStudentStep"
import { STEP_LABELS, type WizardStep, type WizardSummary } from "@/components/frontDesk/frontDeskUi"
import { Button } from "@/components/ui/button"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { getStudentById, type StudentRecord } from "@/services/studentQueries"

function stepTitle(step: WizardStep | "done"): string {
 if (step === "done") return "完成"
 return STEP_LABELS[step - 1] ?? ""
}

export function FrontDeskWizardView() {
 const { role } = useAuth()
 const { confirmDialog } = useAppConfirm()
 const [searchParams, setSearchParams] = useSearchParams()
 const [step, setStep] = useState<WizardStep | "done">(1)
 const [maxReached, setMaxReached] = useState<WizardStep>(1)
 const [student, setStudent] = useState<StudentRecord | null>(null)
 const [summary, setSummary] = useState<WizardSummary>({
  enrolledCount: 0,
  trialCount: 0,
  paymentStatus: "none",
  leaveCount: 0,
 })
 const [hydrateErr, setHydrateErr] = useState<string | null>(null)

 const syncStudentId = useCallback(
  (id: string | null) => {
   const next = new URLSearchParams(searchParams)
   if (id) next.set("studentId", id)
   else next.delete("studentId")
   setSearchParams(next, { replace: true })
  },
  [searchParams, setSearchParams]
 )

 const clearIntakeResume = useCallback(() => {
  sessionStorage.removeItem("frontDeskIntakeToken")
  const next = new URLSearchParams(searchParams)
  next.delete("intakeToken")
  setSearchParams(next, { replace: true })
 }, [searchParams, setSearchParams])

 useEffect(() => {
  const id = searchParams.get("studentId")
  if (!id || student?.id === id) return
  let cancelled = false
  void getStudentById(id)
   .then((row) => {
    if (cancelled) return
    if (!row) {
     setHydrateErr("找不到網址中的學生，請重新開始精靈。")
     return
    }
    setStudent(row)
    setStep((prev) => (prev === 1 ? 2 : prev))
    setMaxReached((prev) => (prev < 2 ? 2 : prev))
   })
   .catch((e) => {
    if (!cancelled) reportUserFacingError(e, { source: "FrontDeskWizardView.hydrate", setErr: setHydrateErr })
   })
  return () => {
   cancelled = true
  }
 }, [searchParams, student?.id])

 const goStep = (next: WizardStep) => {
  if (next > maxReached) return
  setStep(next)
 }

 const advanceTo = (next: WizardStep) => {
  setMaxReached((prev) => (next > prev ? next : prev))
  setStep(next)
 }

 const onRegistered = (created: StudentRecord) => {
  setStudent(created)
  syncStudentId(created.id)
  setSummary({ enrolledCount: 0, trialCount: 0, paymentStatus: "none", leaveCount: 0 })
  advanceTo(2)
 }

 const onEnrollmentCountChange = (count: number) => {
  setSummary((s) => ({ ...s, enrolledCount: count }))
 }

 const onTrialCountChange = (count: number) => {
  setSummary((s) => ({ ...s, trialCount: count }))
 }

 const onContinueToPayment = (counts: { enrolledCount: number; trialCount: number }) => {
  setSummary((s) => ({ ...s, enrolledCount: counts.enrolledCount, trialCount: counts.trialCount }))
  advanceTo(3)
 }

 const onPaymentDone = () => {
  setSummary((s) => ({ ...s, paymentStatus: "done" }))
  advanceTo(4)
 }

 const onSkipPayment = () => {
  setSummary((s) => ({ ...s, paymentStatus: "skipped" }))
  advanceTo(4)
 }

 const finish = () => setStep("done")

 const restart = async () => {
  const ok = await confirmDialog({
   title: "重新開始精靈？",
   description: "將清除目前鎖定的學生與進度，開始另一位新生流程。",
   confirmText: "重新開始",
  })
  if (!ok) return
  setStudent(null)
  setStep(1)
  setMaxReached(1)
  setSummary({ enrolledCount: 0, trialCount: 0, paymentStatus: "none", leaveCount: 0 })
  setHydrateErr(null)
  syncStudentId(null)
  clearIntakeResume()
 }

 if (!isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 return (
  <div className={cn("mx-auto max-w-3xl space-y-6", pagePadClass(role, "p-4 md:p-6"))}>
   {role === "admin" ? (
    <AdminPageHeader
     eyebrow="行政工作"
     title="前台指引精靈"
     description={
      step === "done"
       ? "流程已完成"
       : `步驟 ${step}/4：${stepTitle(step)}`
     }
     actions={
      <>
       <Button type="button" variant="outline" size="sm" onClick={() => void restart()}>
        重新開始
       </Button>
       <Button type="button" variant="outline" size="sm" asChild>
        <Link to="/Students">返回學生管理</Link>
       </Button>
      </>
     }
    />
   ) : (
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div>
      <h1 className="text-xl font-semibold">前台指引精靈</h1>
      <p className="text-sm text-muted-foreground">
       {step === "done"
        ? "流程已完成"
        : `步驟 ${step}/4：${stepTitle(step)}`}
      </p>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => void restart()}>
       重新開始
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
       <Link to="/Students">返回學生管理</Link>
      </Button>
     </div>
    </div>
   )}

   <ol className="grid gap-2 sm:grid-cols-4" aria-label="精靈步驟">
    {STEP_LABELS.map((label, i) => {
     const n = (i + 1) as WizardStep
     const reached = n <= maxReached
     const current = step === n
     return (
      <li key={label}>
       <button
        type="button"
        disabled={!reached || step === "done"}
        onClick={() => goStep(n)}
        className={cn(
         "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
         current
          ? "border-primary bg-primary/10 font-medium text-foreground"
          : reached
            ? "border-border bg-card text-foreground hover:border-primary/40"
            : "border-border/60 bg-muted/40 text-muted-foreground"
        )}
       >
        <span className="text-xs text-muted-foreground">{n}</span>
        <div>{label}</div>
       </button>
      </li>
     )
    })}
   </ol>

   {student ? (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
     目前學生：
     <span className="font-medium">
      {student.full_name}
      {student.student_code ? `（${student.student_code}）` : ""}
     </span>
     <Link
      className="ml-2 text-primary underline-offset-2 hover:underline"
      to={`/Students/${encodeURIComponent(student.id)}`}
     >
      開啟詳細頁
     </Link>
    </div>
   ) : null}

   {hydrateErr ? (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {hydrateErr}
    </div>
   ) : null}

   {step === 1 ? <RegisterStudentStep onRegistered={onRegistered} /> : null}

   {step === 2 && student ? (
    <EnrollClassStep
     student={student}
     onEnrollmentCountChange={onEnrollmentCountChange}
     onTrialCountChange={onTrialCountChange}
     onContinueToPayment={onContinueToPayment}
    />
   ) : null}

   {step === 3 && student ? (
    <PaymentStep student={student} onPaymentDone={onPaymentDone} onSkipPayment={onSkipPayment} />
   ) : null}

   {step === 4 && student ? (
    <LeaveStep
     student={student}
     leaveCount={summary.leaveCount}
     onLeaveAdded={() => setSummary((s) => ({ ...s, leaveCount: s.leaveCount + 1 }))}
     onSkip={finish}
     onFinish={finish}
    />
   ) : null}

   {step === "done" && student ? (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
     <h2 className="text-base font-semibold">摘要</h2>
     <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
      <li>
       學生：{student.full_name}
       {student.student_code ? `（${student.student_code}）` : ""}
      </li>
      <li>報讀：{summary.enrolledCount} 筆</li>
      <li>試堂：{summary.trialCount} 筆</li>
      <li>
       付款：
       {summary.paymentStatus === "done"
        ? "已完成收款／出單"
        : summary.paymentStatus === "skipped"
          ? "稍後處理"
          : "未進行"}
      </li>
      <li>請假：{summary.leaveCount} 筆</li>
     </ul>
     <div className="flex flex-wrap gap-2">
      <Button type="button" asChild>
       <Link to={`/Students/${encodeURIComponent(student.id)}`}>前往學生詳細頁面</Link>
      </Button>
      <Button type="button" variant="outline" asChild>
       <Link to={`/Payments?studentId=${encodeURIComponent(student.id)}`}>前往收款登記頁面</Link>
      </Button>
      <Button type="button" variant="outline" asChild>
       <Link to={`/TrialSessions?studentId=${encodeURIComponent(student.id)}`}>前往試堂紀錄</Link>
      </Button>
      <Button type="button" variant="outline" asChild>
       <Link to={`/LeaveManagement?studentId=${encodeURIComponent(student.id)}`}>前往請假管理頁面</Link>
      </Button>
      <Button type="button" variant="ghost" onClick={() => void restart()}>
       處理下一位新生
      </Button>
     </div>
    </div>
   ) : null}

   {step === 2 && !student ? (
    <p className="text-sm text-muted-foreground">請先完成新生登記。</p>
   ) : null}
  </div>
 )
}
