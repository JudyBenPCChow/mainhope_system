import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { FlaskConical } from "lucide-react"

import { Field, STEP_LABELS, localTodayYmd, type WizardStep, type WizardSummary } from "@/components/frontDesk/frontDeskUi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { cn } from "@/lib/utils"

import {
 MOCK_CLASSES,
 MOCK_DEMO_PREFILL,
 MOCK_SCHEDULES,
 newMockId,
 nextMockStudentCode,
 type MockEnrollment,
 type MockLeave,
 type MockPayment,
 type MockStudent,
} from "./mockData"

const PAY_METHODS = [
 "現金",
 "轉數快",
 "信用卡",
 "支票",
 "PayMe",
 "八達通",
 "易辦事",
 "銀聯",
 "銀行轉帳",
 "內地支付寶",
 "香港支付寶",
 "微信支付",
 "其他",
] as const
const LEAVE_REASONS = ["病假", "事假"] as const
const LEAVE_MAKEUPS = ["待安排", "錄影", "調堂", "不補回"] as const

function stepTitle(step: WizardStep | "done"): string {
 if (step === "done") return "完成"
 return STEP_LABELS[step - 1] ?? ""
}

export function FrontDeskWizardPrototypeView() {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()

 const [step, setStep] = useState<WizardStep | "done">(1)
 const [maxReached, setMaxReached] = useState<WizardStep>(1)
 const [studentSeq, setStudentSeq] = useState(1)
 const [student, setStudent] = useState<MockStudent | null>(null)
 const [enrollments, setEnrollments] = useState<MockEnrollment[]>([])
 const [payments, setPayments] = useState<MockPayment[]>([])
 const [leaves, setLeaves] = useState<MockLeave[]>([])
 const [summary, setSummary] = useState<WizardSummary>({
  enrolledCount: 0,
  trialCount: 0,
  paymentStatus: "none",
  leaveCount: 0,
 })
 const [eventLog, setEventLog] = useState<string[]>([])

 const log = (msg: string) => {
  const stamp = new Date().toLocaleTimeString("zh-HK", { hour12: false })
  setEventLog((prev) => [`[${stamp}] ${msg}`, ...prev].slice(0, 40))
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
   description: "將清除本頁記憶體內的假學生與操作紀錄，不會影響真實資料庫。",
   confirmText: "重設沙盒",
  })
  if (!ok) return
  setStep(1)
  setMaxReached(1)
  setStudent(null)
  setEnrollments([])
  setPayments([])
  setLeaves([])
  setSummary({ enrolledCount: 0, trialCount: 0, paymentStatus: "none", leaveCount: 0 })
  setEventLog([])
  setRegForm({
   full_name: "",
   english_name: "",
   grade: "",
   parent_phone: "",
  })
  pushBanner({ tone: "info", title: "沙盒已重設" })
 }

 // —— Step 1 ——
 const [regForm, setRegForm] = useState({
  full_name: "",
  english_name: "",
  grade: "",
  parent_phone: "",
 })
 const [regErr, setRegErr] = useState<string | null>(null)

 const submitRegister = () => {
  const name = regForm.full_name.trim()
  if (!name) {
   setRegErr("請填寫中文姓名")
   return
  }
  setRegErr(null)
  const created: MockStudent = {
   id: newMockId("mock-stu"),
   full_name: name,
   english_name: regForm.english_name.trim(),
   student_code: nextMockStudentCode(studentSeq),
   grade: regForm.grade.trim() || "—",
   parent_phone: regForm.parent_phone.trim(),
  }
  setStudentSeq((n) => n + 1)
  setStudent(created)
  setEnrollments([])
  setPayments([])
  setLeaves([])
  setSummary({ enrolledCount: 0, trialCount: 0, paymentStatus: "none", leaveCount: 0 })
  log(`新生登記（記憶體）：${created.full_name}／${created.student_code}`)
  pushBanner({
   tone: "success",
   title: "（沙盒）已建立假學生",
   message: "資料只存在此分頁記憶體，未寫入資料庫。",
  })
  advanceTo(2)
 }

 // —— Step 2 ——
 const [pickClassId, setPickClassId] = useState(MOCK_CLASSES[0]?.id ?? "")
 const [periodLabel, setPeriodLabel] = useState("報足全期")
 const occupied = useMemo(() => new Set(enrollments.map((e) => e.classId)), [enrollments])
 const availableClasses = MOCK_CLASSES.filter((c) => !occupied.has(c.id))

 const addEnrollment = () => {
  if (!pickClassId) return
  const cls = MOCK_CLASSES.find((c) => c.id === pickClassId)
  if (!cls) return
  const row: MockEnrollment = {
   id: newMockId("mock-enr"),
   classId: cls.id,
   periodLabel: cls.kind === "private" ? "一對一" : periodLabel,
  }
  const next = [...enrollments, row]
  setEnrollments(next)
  log(`報讀（記憶體）：${cls.label} · ${row.periodLabel}`)
  pushBanner({ tone: "success", title: "（沙盒）已加入班別" })
  setSummary((s) => ({ ...s, enrolledCount: next.length }))
  const still = MOCK_CLASSES.filter((c) => !next.some((e) => e.classId === c.id))
  setPickClassId(still[0]?.id ?? "")
 }

 const continueToPayment = () => {
  if (enrollments.length === 0) {
   pushBanner({ tone: "warning", title: "請先至少報讀一班" })
   return
  }
  setSummary((s) => ({ ...s, enrolledCount: enrollments.length }))
  advanceTo(3)
 }

 // —— Step 3 ——
 const [payMode, setPayMode] = useState<"receive" | "invoice">("receive")
 const [payMethod, setPayMethod] = useState<string>(PAY_METHODS[0])
 const [payLessons, setPayLessons] = useState("4")
 const [payClassId, setPayClassId] = useState("")
 const [payErr, setPayErr] = useState<string | null>(null)

 const enrolledClasses = useMemo(
  () =>
   enrollments
    .map((e) => MOCK_CLASSES.find((c) => c.id === e.classId))
    .filter((c): c is NonNullable<typeof c> => Boolean(c)),
  [enrollments]
 )

 const effectivePayClassId = payClassId || enrolledClasses[0]?.id || ""
 const payClass = enrolledClasses.find((c) => c.id === effectivePayClassId)
 const lessonsN = Math.max(0, Math.floor(Number(payLessons) || 0))
 const payAmount = payClass && lessonsN > 0 ? Math.round(payClass.pricePerLesson * lessonsN * 100) / 100 : 0

 const submitPayment = () => {
  if (!payClass || lessonsN < 1 || payAmount <= 0) {
   setPayErr("請選擇班別並填寫有效堂數")
   return
  }
  setPayErr(null)
  const row: MockPayment = {
   id: newMockId("mock-pay"),
   mode: payMode,
   total: payAmount,
   method: payMethod,
   lines: [{ classId: payClass.id, lessons: lessonsN, amount: payAmount }],
  }
  setPayments((prev) => [...prev, row])
  setSummary((s) => ({ ...s, paymentStatus: "done" }))
  log(
   `${payMode === "receive" ? "收款" : "出單"}（記憶體）：HKD ${payAmount.toFixed(2)} · ${payClass.label}`
  )
  pushBanner({
   tone: "success",
   title: payMode === "receive" ? "（沙盒）已登記收款" : "（沙盒）已出單",
  })
  advanceTo(4)
 }

 const skipPayment = async () => {
  const ok = await confirmDialog({
   title: "稍後付款？",
   description: "沙盒內略過付款步驟（不會寫入真實繳費）。",
   confirmText: "稍後付款",
  })
  if (!ok) return
  setSummary((s) => ({ ...s, paymentStatus: "skipped" }))
  log("略過付款（記憶體）")
  advanceTo(4)
 }

 // —— Step 4 ——
 const [leaveClassId, setLeaveClassId] = useState("")
 const [leaveScheduleId, setLeaveScheduleId] = useState("")
 const [leaveReason, setLeaveReason] = useState<(typeof LEAVE_REASONS)[number]>("病假")
 const [leaveMakeup, setLeaveMakeup] = useState<(typeof LEAVE_MAKEUPS)[number]>("待安排")
 const [leaveErr, setLeaveErr] = useState<string | null>(null)

 const leaveClassOptions = enrolledClasses
 const effectiveLeaveClassId = leaveClassId || leaveClassOptions[0]?.id || ""
 const leaveSchedules = MOCK_SCHEDULES.filter(
  (s) =>
   s.classId === effectiveLeaveClassId &&
   !leaves.some((l) => l.scheduleId === s.id)
 )
 const effectiveLeaveScheduleId =
  leaveScheduleId && leaveSchedules.some((s) => s.id === leaveScheduleId)
   ? leaveScheduleId
   : leaveSchedules[0]?.id ?? ""

 const submitLeave = () => {
  if (!effectiveLeaveClassId || !effectiveLeaveScheduleId) {
   setLeaveErr("請選擇班別與未來排程")
   return
  }
  const sched = leaveSchedules.find((s) => s.id === effectiveLeaveScheduleId)
  if (!sched) {
   setLeaveErr("排程無效")
   return
  }
  setLeaveErr(null)
  const row: MockLeave = {
   id: newMockId("mock-leave"),
   classId: effectiveLeaveClassId,
   scheduleId: sched.id,
   leave_date: sched.scheduled_date,
   reason: leaveReason,
   makeup: leaveMakeup,
  }
  setLeaves((prev) => [...prev, row])
  setSummary((s) => ({ ...s, leaveCount: s.leaveCount + 1 }))
  setLeaveScheduleId("")
  log(`請假（記憶體）：${sched.scheduled_date} · ${leaveReason}／${leaveMakeup}`)
  pushBanner({ tone: "success", title: "（沙盒）已登記請假" })
 }

 const finish = () => setStep("done")

 return (
  <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
   <div
    role="status"
    className="flex flex-wrap items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
   >
    <FlaskConical className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
    <div className="min-w-0 flex-1">
     <p className="font-semibold">沙盒測試頁（與業務 SQL 分離）</p>
     <p className="mt-1 text-warning/90">
      所有操作只寫入此分頁的記憶體，<strong>不會</strong>呼叫 Supabase／不會寫入真實學生、報讀、繳費、請假資料。關閉或重設後即消失。
     </p>
    </div>
   </div>

   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="text-xl font-semibold">前台指引精靈（沙盒）</h1>
     <p className="text-sm text-muted-foreground">
      {step === "done" ? "流程已完成" : `步驟 ${step}/4：${stepTitle(step)}`}
     </p>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="outline" size="sm" onClick={() => void resetAll()}>
      重設沙盒
     </Button>
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to="/FrontDeskWizard">正式精靈</Link>
     </Button>
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to="/prototype/TeacherLeaveWizard">老師請假沙盒</Link>
      {" · "}
      <Link to="/TomorrowReminders">明日課堂提醒</Link>
     </Button>
    </div>
   </div>

   <ol className="grid gap-2 sm:grid-cols-4" aria-label="沙盒精靈步驟">
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
     目前假學生：
     <span className="font-medium">
      {student.full_name}（{student.student_code}）
     </span>
     <span className="ml-2 text-muted-foreground">年級 {student.grade}</span>
    </div>
   ) : null}

   {step === 1 ? (
    <div className="space-y-4">
     <p className="text-sm text-muted-foreground">簡化欄位即可體驗流程；正式頁欄位較完整。</p>
     {regErr ? (
      <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
       {regErr}
      </div>
     ) : null}
     <div className="grid gap-4 sm:grid-cols-2">
      <Field label="中文姓名 *">
       <Input
        value={regForm.full_name}
        onChange={(e) => setRegForm((f) => ({ ...f, full_name: e.target.value }))}
       />
      </Field>
      <Field label="英文姓名">
       <Input
        value={regForm.english_name}
        onChange={(e) => setRegForm((f) => ({ ...f, english_name: e.target.value }))}
       />
      </Field>
      <Field label="年級">
       <Input value={regForm.grade} onChange={(e) => setRegForm((f) => ({ ...f, grade: e.target.value }))} />
      </Field>
      <Field label="家長電話">
       <Input
        inputMode="numeric"
        value={regForm.parent_phone}
        onChange={(e) => setRegForm((f) => ({ ...f, parent_phone: e.target.value }))}
       />
      </Field>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={submitRegister}>
       建立假學生並繼續
      </Button>
      <Button
       type="button"
       variant="outline"
       onClick={() =>
        setRegForm({
         full_name: MOCK_DEMO_PREFILL.full_name,
         english_name: MOCK_DEMO_PREFILL.english_name,
         grade: MOCK_DEMO_PREFILL.grade,
         parent_phone: MOCK_DEMO_PREFILL.parent_phone,
        })
       }
      >
       填入示範資料
      </Button>
     </div>
    </div>
   ) : null}

   {step === 2 && student ? (
    <div className="space-y-4">
     <p className="text-sm text-muted-foreground">從假班別清單報讀（記憶體）。</p>
     {enrollments.length > 0 ? (
      <ul className="list-inside list-disc rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
       {enrollments.map((e) => {
        const cls = MOCK_CLASSES.find((c) => c.id === e.classId)
        return (
         <li key={e.id}>
          {cls?.label ?? e.classId} · {e.periodLabel}
         </li>
        )
       })}
      </ul>
     ) : null}
     {availableClasses.length > 0 ? (
      <>
       <Field label="選擇假班別">
        <Select
         className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
         value={pickClassId}
         onChange={(e) => setPickClassId(e.target.value)}
        >
         {availableClasses.map((c) => (
          <option key={c.id} value={c.id}>
           {c.label}
           {c.kind === "private" ? "（一對一）" : ""}
          </option>
         ))}
        </Select>
       </Field>
       {MOCK_CLASSES.find((c) => c.id === pickClassId)?.kind === "group" ? (
        <Field label="報讀方式">
         <Select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
         >
          <option value="報足全期">報足全期</option>
          <option value="第一期">第一期</option>
          <option value="第二期">第二期</option>
          <option value="單堂">單堂</option>
         </Select>
        </Field>
       ) : null}
       <Button type="button" onClick={addEnrollment}>
        加入此班別
       </Button>
      </>
     ) : (
      <p className="text-sm text-muted-foreground">假班別已全部報讀。</p>
     )}
     <Button type="button" variant="outline" disabled={enrollments.length === 0} onClick={continueToPayment}>
      繼續收款／出單
     </Button>
    </div>
   ) : null}

   {step === 3 && student ? (
    <div className="space-y-4">
     <p className="text-sm text-muted-foreground">依已報讀假班別模擬收款／出單。</p>
     {payErr ? (
      <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
       {payErr}
      </div>
     ) : null}
     <div className="flex flex-wrap gap-2">
      <Button type="button" variant={payMode === "receive" ? "default" : "outline"} onClick={() => setPayMode("receive")}>
       收款登記
      </Button>
      <Button type="button" variant={payMode === "invoice" ? "default" : "outline"} onClick={() => setPayMode("invoice")}>
       出單（待繳）
      </Button>
     </div>
     <div className="grid gap-4 sm:grid-cols-2">
      <Field label="班別">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={effectivePayClassId}
        onChange={(e) => setPayClassId(e.target.value)}
       >
        {enrolledClasses.map((c) => (
         <option key={c.id} value={c.id}>
          {c.label}
         </option>
        ))}
       </Select>
      </Field>
      <Field label="付款方式">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={payMethod}
        onChange={(e) => setPayMethod(e.target.value)}
       >
        {PAY_METHODS.map((m) => (
         <option key={m} value={m}>
          {m}
         </option>
        ))}
       </Select>
      </Field>
      <Field label="堂數">
       <Input inputMode="numeric" value={payLessons} onChange={(e) => setPayLessons(e.target.value)} />
      </Field>
      <Field label="金額（自動）">
       <Input readOnly className="bg-muted/30" value={payAmount > 0 ? String(payAmount) : ""} />
      </Field>
     </div>
     <p className="text-xs text-muted-foreground">沙盒日期以今日計：{localTodayYmd()}</p>
     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={enrolledClasses.length === 0} onClick={submitPayment}>
       {payMode === "receive" ? "確認收款並繼續" : "確認出單並繼續"}
      </Button>
      <Button type="button" variant="outline" onClick={() => void skipPayment()}>
       稍後付款
      </Button>
     </div>
    </div>
   ) : null}

   {step === 4 && student ? (
    <div className="space-y-4">
     <p className="text-sm text-muted-foreground">對假排程登記不能出席的堂次（可略過）。</p>
     {summary.leaveCount > 0 ? (
      <p className="text-sm text-success" role="status">
       本沙盒已登記 {summary.leaveCount} 筆請假。
      </p>
     ) : null}
     {leaveErr ? (
      <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
       {leaveErr}
      </div>
     ) : null}
     <Field label="班別">
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
       value={effectiveLeaveClassId}
       onChange={(e) => {
        setLeaveClassId(e.target.value)
        setLeaveScheduleId("")
       }}
      >
       {leaveClassOptions.map((c) => (
        <option key={c.id} value={c.id}>
         {c.label}
        </option>
       ))}
      </Select>
     </Field>
     <Field label="請假排程（未來堂次）">
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
       value={effectiveLeaveScheduleId}
       onChange={(e) => setLeaveScheduleId(e.target.value)}
       disabled={leaveSchedules.length === 0}
      >
       {leaveSchedules.length === 0 ? (
        <option value="">沒有可請假的假排程</option>
       ) : (
        leaveSchedules.map((s) => (
         <option key={s.id} value={s.id}>
          {s.scheduled_date} {s.start_time}–{s.end_time}
         </option>
        ))
       )}
      </Select>
     </Field>
     <div className="grid gap-4 sm:grid-cols-2">
      <Field label="原因">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={leaveReason}
        onChange={(e) => setLeaveReason(e.target.value as (typeof LEAVE_REASONS)[number])}
       >
        {LEAVE_REASONS.map((r) => (
         <option key={r} value={r}>
          {r}
         </option>
        ))}
       </Select>
      </Field>
      <Field label="補課安排">
       <Select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={leaveMakeup}
        onChange={(e) => setLeaveMakeup(e.target.value as (typeof LEAVE_MAKEUPS)[number])}
       >
        {LEAVE_MAKEUPS.map((r) => (
         <option key={r} value={r}>
          {r}
         </option>
        ))}
       </Select>
      </Field>
     </div>
     <Field label="備註（選填，僅沙盒）">
      <Textarea rows={2} placeholder="不會寫入資料庫" />
     </Field>
     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={leaveSchedules.length === 0} onClick={submitLeave}>
       登記此堂請假
      </Button>
      {summary.leaveCount > 0 ? (
       <Button type="button" variant="outline" onClick={finish}>
        完成沙盒
       </Button>
      ) : (
       <Button type="button" variant="outline" onClick={finish}>
        略過請假並完成
       </Button>
      )}
     </div>
    </div>
   ) : null}

   {step === "done" && student ? (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
     <h2 className="text-base font-semibold">沙盒摘要（非真實資料）</h2>
     <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
      <li>
       假學生：{student.full_name}（{student.student_code}）
      </li>
      <li>報讀：{summary.enrolledCount} 筆（記憶體 {enrollments.length}）</li>
      <li>
       付款：
       {summary.paymentStatus === "done"
        ? `已模擬 ${payments.length} 筆`
        : summary.paymentStatus === "skipped"
          ? "稍後處理"
          : "未進行"}
      </li>
      <li>請假：{summary.leaveCount} 筆（記憶體 {leaves.length}）</li>
     </ul>
     <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => void resetAll()}>
       再試一次
      </Button>
      <Button type="button" variant="outline" asChild>
       <Link to="/FrontDeskWizard">前往正式精靈</Link>
      </Button>
     </div>
    </div>
   ) : null}

   {eventLog.length > 0 ? (
    <div className="rounded-xl border border-dashed border-border p-4">
     <h2 className="text-sm font-semibold">記憶體操作紀錄</h2>
     <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-xs text-muted-foreground">
      {eventLog.map((line, i) => (
       <li key={`${line}-${i}`}>{line}</li>
      ))}
     </ul>
    </div>
   ) : null}
  </div>
 )
}
