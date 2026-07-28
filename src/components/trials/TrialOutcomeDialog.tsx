import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

import {
 TRIAL_LOST_REASON_OPTIONS,
 TRIAL_OTHER_RESULT_OPTIONS,
 TRIAL_OUTCOME_LABELS,
<<<<<<< Updated upstream
 type TrialOutcome,
} from "@/components/trials/trialConvertDemoData"
=======
} from "@/lib/trialOutcome"
>>>>>>> Stashed changes

export type TrialOutcomeDialogTarget = {
 id: string
 studentName: string
 studentGrade: string | null
 classLabel: string
 trialDate: string
}

export type TrialOutcomeSubmitPayload = {
 outcome: "lost" | "other"
 reason: string
 note: string | null
}

type Props = {
 open: boolean
 target: TrialOutcomeDialogTarget | null
<<<<<<< Updated upstream
 /** 預設開啟的結果類型 */
 defaultOutcome?: "lost" | "other"
=======
 defaultOutcome?: "lost" | "other"
 saving?: boolean
>>>>>>> Stashed changes
 onOpenChange: (open: boolean) => void
 onSubmit: (payload: TrialOutcomeSubmitPayload) => void
}

export function TrialOutcomeDialog({
 open,
 target,
 defaultOutcome = "lost",
<<<<<<< Updated upstream
=======
 saving = false,
>>>>>>> Stashed changes
 onOpenChange,
 onSubmit,
}: Props) {
 const [outcome, setOutcome] = useState<"lost" | "other">(defaultOutcome)
 const [reason, setReason] = useState<string>(TRIAL_LOST_REASON_OPTIONS[0])
 const [note, setNote] = useState("")
 const [err, setErr] = useState<string | null>(null)

 useEffect(() => {
  if (!open) return
  setOutcome(defaultOutcome)
  setReason(
   defaultOutcome === "lost" ? TRIAL_LOST_REASON_OPTIONS[0] : TRIAL_OTHER_RESULT_OPTIONS[0]
  )
  setNote("")
  setErr(null)
 }, [open, defaultOutcome, target?.id])

 const reasonOptions = outcome === "lost" ? TRIAL_LOST_REASON_OPTIONS : TRIAL_OTHER_RESULT_OPTIONS

 const submit = () => {
  if (!reason.trim()) {
   setErr("請選擇原因／結果")
   return
  }
  onSubmit({
   outcome,
   reason: reason.trim(),
   note: note.trim() || null,
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>登記試堂結果</DialogTitle>
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
       <div className="mt-0.5 text-xs text-muted-foreground">試堂 {target.trialDate}</div>
      </div>

      <fieldset className="grid gap-2">
       <legend className="text-xs font-medium text-muted-foreground">結果類型</legend>
       <Select
        className="h-9"
        value={outcome}
<<<<<<< Updated upstream
=======
        disabled={saving}
>>>>>>> Stashed changes
        onChange={(e) => {
         const next = e.target.value as "lost" | "other"
         setOutcome(next)
         setReason(
          next === "lost" ? TRIAL_LOST_REASON_OPTIONS[0] : TRIAL_OTHER_RESULT_OPTIONS[0]
         )
        }}
       >
        <option value="lost">{TRIAL_OUTCOME_LABELS.lost}</option>
        <option value="other">{TRIAL_OUTCOME_LABELS.other}</option>
       </Select>
       <p className="text-xs text-muted-foreground">
        {outcome === "lost"
         ? "明確不會報讀：記入流失，方便統計原因。"
         : "非轉正、亦非單純流失：例如改期、轉介、暫掛跟進。"}
       </p>
      </fieldset>

      <label className="grid gap-1">
       <span className="text-xs font-medium text-muted-foreground">
        {outcome === "lost" ? "流失原因" : "結果說明"}
       </span>
<<<<<<< Updated upstream
       <Select className="h-9" value={reason} onChange={(e) => setReason(e.target.value)}>
=======
       <Select
        className="h-9"
        value={reason}
        disabled={saving}
        onChange={(e) => setReason(e.target.value)}
       >
>>>>>>> Stashed changes
        {reasonOptions.map((opt) => (
         <option key={opt} value={opt}>
          {opt}
         </option>
        ))}
       </Select>
      </label>

      <label className="grid gap-1">
       <span className="text-xs font-medium text-muted-foreground">補充備註（選填）</span>
       <Input
        className="h-9"
        placeholder="例如比較對象、跟進日期…"
        value={note}
<<<<<<< Updated upstream
=======
        disabled={saving}
>>>>>>> Stashed changes
        onChange={(e) => setNote(e.target.value)}
       />
      </label>

      {err ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
       >
        {err}
       </div>
      ) : null}

      <div className="flex justify-end gap-2">
<<<<<<< Updated upstream
       <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        取消
       </Button>
       <Button type="button" variant={outcome === "lost" ? "destructive" : "default"} onClick={submit}>
        確認登記
=======
       <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
        取消
       </Button>
       <Button
        type="button"
        variant={outcome === "lost" ? "destructive" : "default"}
        disabled={saving}
        onClick={submit}
       >
        {saving ? "儲存中…" : "確認登記"}
>>>>>>> Stashed changes
       </Button>
      </div>
     </div>
    ) : null}
   </DialogContent>
  </Dialog>
 )
}
<<<<<<< Updated upstream

export function formatOutcomeSummary(opts: {
 outcome: TrialOutcome
 reason: string | null
 note: string | null
}): string {
 const label = TRIAL_OUTCOME_LABELS[opts.outcome]
 const bits = [label]
 if (opts.reason) bits.push(opts.reason)
 if (opts.note) bits.push(opts.note)
 return bits.join(" · ")
}
=======
>>>>>>> Stashed changes
