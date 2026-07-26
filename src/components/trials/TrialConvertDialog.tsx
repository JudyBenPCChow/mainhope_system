import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PAYMENT_METHOD_PRESETS } from "@/services/paymentQueries"

import {
 TRIAL_CONVERT_DEMO_SESSIONS,
 type TrialConvertDemoCourseMode,
 type TrialConvertDemoSession,
} from "@/components/trials/trialConvertDemoData"

export type TrialConvertDialogTarget = {
 id: string
 studentName: string
 studentGrade: string | null
 classLabel: string
 trialDate: string
 schedStart: string | null
 schedEnd: string | null
 courseMode: TrialConvertDemoCourseMode
 pricePerLesson: number
}

export type TrialConvertSubmitPayload = {
 enrollForm: "full" | "single" | "第一期" | "第二期" | "兩期全報"
 pickedSessionIds: string[]
 payMode: "receive" | "pending" | "skip"
 lessonCount: number
 amount: number
 paymentMethod: string
 formLabel: string
 payLabel: string
}

type Props = {
 open: boolean
 target: TrialConvertDialogTarget | null
 sessions?: TrialConvertDemoSession[]
 onOpenChange: (open: boolean) => void
 onSubmit: (payload: TrialConvertSubmitPayload) => void
}

export function TrialConvertDialog({
 open,
 target,
 sessions = TRIAL_CONVERT_DEMO_SESSIONS,
 onOpenChange,
 onSubmit,
}: Props) {
 const [enrollForm, setEnrollForm] = useState<"full" | "single" | "第一期" | "第二期" | "兩期全報">(
  "full"
 )
 const [pickedSessions, setPickedSessions] = useState<string[]>([])
 const [payMode, setPayMode] = useState<"receive" | "pending" | "skip">("receive")
 const [lessonCount, setLessonCount] = useState("4")
 const [amount, setAmount] = useState("")
 const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [dlgErr, setDlgErr] = useState<string | null>(null)

 useEffect(() => {
  if (!open || !target) return
  setEnrollForm(target.courseMode === "summer_two_period" ? "兩期全報" : "full")
  setPickedSessions([])
  setPayMode("receive")
  setLessonCount("4")
  setAmount(String(Math.round(target.pricePerLesson * 4 * 100) / 100))
  setPayMethod(PAYMENT_METHOD_PRESETS[0] ?? "現金")
  setDlgErr(null)
 }, [open, target])

 const toggleSession = (id: string) => {
  setPickedSessions((prev) =>
   prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  )
 }

 const onLessonCountChange = (raw: string) => {
  setLessonCount(raw)
  if (!target) return
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0) {
   setAmount(String(Math.round(target.pricePerLesson * n * 100) / 100))
  }
 }

 const formLabel = useMemo(() => {
  if (!target) return ""
  if (enrollForm === "single") {
   const nums = pickedSessions
    .map((id) => sessions.find((s) => s.id === id)?.sessionNumber)
    .filter((n): n is number => n != null)
    .sort((a, b) => a - b)
   return nums.length ? `單堂報讀（第${nums.join("、")}堂）` : "單堂報讀"
  }
  if (target.courseMode === "summer_two_period") return String(enrollForm)
  return "報足全期"
 }, [enrollForm, pickedSessions, sessions, target])

 const submit = () => {
  if (!target) return
  if (enrollForm === "single" && pickedSessions.length === 0) {
   setDlgErr("單堂報讀請至少勾選一堂")
   return
  }
  const n = Number(lessonCount)
  const a = Number(amount)
  if (payMode !== "skip") {
   if (!Number.isFinite(n) || n <= 0) {
    setDlgErr("堂數須大於 0")
    return
   }
   if (!Number.isFinite(a) || a < 0) {
    setDlgErr("金額不可為負")
    return
   }
  }
  const payLabel =
   payMode === "skip"
    ? "略過收費"
    : payMode === "pending"
      ? `待繳 $${amount}（${lessonCount} 堂）`
      : `已收款 $${amount}（${lessonCount} 堂）`
  onSubmit({
   enrollForm,
   pickedSessionIds: pickedSessions,
   payMode,
   lessonCount: Number.isFinite(n) ? n : 0,
   amount: Number.isFinite(a) ? a : 0,
   paymentMethod: payMethod,
   formLabel,
   payLabel,
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
    <DialogHeader>
     <DialogTitle>轉正式報讀</DialogTitle>
    </DialogHeader>
    {target ? (
     <div className="grid gap-4 text-sm">
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
       <div className="font-medium">
        {target.studentName}
        {target.studentGrade ? (
         <span className="ml-2 text-muted-foreground">{target.studentGrade}</span>
        ) : null}
       </div>
       <div className="mt-0.5 text-muted-foreground">{target.classLabel}</div>
       <div className="mt-0.5 tabular-nums text-xs text-muted-foreground">
        試堂 {target.trialDate}
        {target.schedStart && target.schedEnd
         ? ` ${target.schedStart}–${target.schedEnd}`
         : null}
       </div>
      </div>

      <fieldset className="grid gap-2">
       <legend className="text-xs font-medium text-muted-foreground">報讀形式</legend>
       {target.courseMode === "regular" ? (
        <Select
         className="h-9"
         value={enrollForm === "single" ? "single" : "full"}
         onChange={(e) => setEnrollForm(e.target.value === "single" ? "single" : "full")}
        >
         <option value="full">報足全期（九月正規）</option>
         <option value="single">單堂（自選堂數）</option>
        </Select>
       ) : (
        <Select
         className="h-9"
         value={enrollForm}
         onChange={(e) =>
          setEnrollForm(e.target.value as "full" | "single" | "第一期" | "第二期" | "兩期全報")
         }
        >
         <option value="第一期">第一期</option>
         <option value="第二期">第二期</option>
         <option value="兩期全報">兩期全報</option>
         <option value="single">單堂（自選堂數）</option>
        </Select>
       )}
       {enrollForm === "single" ? (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
         <p className="mb-1 text-xs text-muted-foreground">勾選要報讀的堂次</p>
         {sessions.map((s) => {
          const checked = pickedSessions.includes(s.id)
          return (
           <label
            key={s.id}
            className={cn(
             "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/60",
             checked && "bg-muted/40"
            )}
           >
            <input
             type="checkbox"
             className="size-4 rounded border-border"
             checked={checked}
             onChange={() => toggleSession(s.id)}
            />
            <span>
             第{s.sessionNumber}堂 · {s.date} {s.start}–{s.end}
            </span>
           </label>
          )
         })}
        </div>
       ) : null}
      </fieldset>

      <fieldset className="grid gap-2">
       <legend className="text-xs font-medium text-muted-foreground">收費</legend>
       <Select
        className="h-9"
        value={payMode}
        onChange={(e) => setPayMode(e.target.value as "receive" | "pending" | "skip")}
       >
        <option value="receive">立即收款</option>
        <option value="pending">開待繳費單</option>
        <option value="skip">稍後再收（只報讀）</option>
       </Select>
       {payMode !== "skip" ? (
        <div className="grid grid-cols-2 gap-2">
         <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">堂數（正規預設 4）</span>
          <Input
           type="number"
           min={1}
           className="h-9"
           value={lessonCount}
           onChange={(e) => onLessonCountChange(e.target.value)}
          />
         </label>
         <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">
           金額（單價 ${target.pricePerLesson}）
          </span>
          <Input
           type="number"
           min={0}
           step="0.01"
           className="h-9"
           value={amount}
           onChange={(e) => setAmount(e.target.value)}
          />
         </label>
         <label className="col-span-2 grid gap-1">
          <span className="text-xs text-muted-foreground">付款方式</span>
          <Select
           className="h-9"
           value={payMethod}
           onChange={(e) => setPayMethod(e.target.value)}
          >
           {PAYMENT_METHOD_PRESETS.map((m) => (
            <option key={m} value={m}>
             {m}
            </option>
           ))}
          </Select>
         </label>
        </div>
       ) : null}
      </fieldset>

      {dlgErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
       >
        {dlgErr}
       </div>
      ) : null}

      <div className="flex justify-end gap-2">
       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        取消
       </Button>
       <Button type="button" onClick={submit}>
        確認轉正
       </Button>
      </div>
     </div>
    ) : null}
   </DialogContent>
  </Dialog>
 )
}
