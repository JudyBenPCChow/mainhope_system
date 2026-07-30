import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { money } from "@/components/payments/paymentsUi"
import { voidPaymentRecord } from "@/services/paymentQueries"

export type VoidPaymentTarget = {
 id: string
 receiptNumber: string | null
 studentName: string
 totalAmount: number
 paymentDate: string
 status: string
}

type Props = {
 open: boolean
 target: VoidPaymentTarget | null
 onOpenChange: (open: boolean) => void
 onVoided: () => void
}

export function VoidPaymentDialog({ open, target, onOpenChange, onVoided }: Props) {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [reason, setReason] = useState("")
 const [password, setPassword] = useState("")
 const [err, setErr] = useState<string | null>(null)
 const [saving, setSaving] = useState(false)

 useEffect(() => {
  if (!open) {
   setReason("")
   setPassword("")
   setErr(null)
   setSaving(false)
  }
 }, [open])

 const submit = async () => {
  if (!target) return
  const r = reason.trim()
  if (r.length < 2) {
   setErr("請填寫作廢原因（至少 2 字）。")
   return
  }
  if (!password) {
   setErr("請輸入登入密碼以確認作廢。")
   return
  }
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: target.paymentDate,
    source: "VoidPaymentDialog.submit",
   }))
  ) {
   return
  }
  setSaving(true)
  setErr(null)
  try {
   const result = await voidPaymentRecord({
    paymentId: target.id,
    reason: r,
    password,
   })
   if (!result.ok) {
    setErr(result.message)
    return
   }
   onOpenChange(false)
   onVoided()
   if (result.alreadyVoided) {
    pushBanner({ tone: "info", title: "此單據已作廢" })
    return
   }
   const bits: string[] = ["請檢查該生報讀與堂數對帳是否仍正確；作廢不自動退班。"]
   if (result.emailSent) bits.unshift("已電郵通知管理層。")
   else if (result.emailError) bits.unshift(`通知未送出：${result.emailError}`)
   else if (result.notifySkipped) bits.unshift("待繳單據作廢，未寄管理層電郵。")
   pushBanner({
    tone: result.emailError ? "warning" : "success",
    title: "單據已作廢",
    message: bits.join(" "),
   })
  } finally {
   setSaving(false)
  }
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <DialogTitle>作廢單據</DialogTitle>
    </DialogHeader>
    {target ? (
     <div className="space-y-4 text-sm">
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 space-y-1">
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">單號</span>
        <span className="font-mono text-xs">{target.receiptNumber ?? "—"}</span>
       </div>
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">學生</span>
        <span>{target.studentName}</span>
       </div>
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">金額</span>
        <span className="font-medium tabular-nums">{money(target.totalAmount)}</span>
       </div>
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">日期／狀態</span>
        <span>
         {target.paymentDate} · {target.status}
        </span>
       </div>
      </div>
      <p className="text-xs text-muted-foreground">
       作廢後單據會保留並標示「作廢」，不可刪除或改回已收款。已收款作廢會電郵通知管理層。正式報讀不會自動取消（可視為未付款，對帳／追收仍會顯示）。
      </p>
      <div className="grid gap-1.5">
       <label className="text-sm font-medium" htmlFor="void-reason">
        作廢原因
       </label>
       <Textarea
        id="void-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="例如：金額開錯、重複出單…"
        disabled={saving}
        className="resize-none"
       />
      </div>
      <div className="grid gap-1.5">
       <label className="text-sm font-medium" htmlFor="void-password">
        登入密碼（二次確認）
       </label>
       <Input
        id="void-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={saving}
        onKeyDown={(e) => {
         if (e.key === "Enter") {
          e.preventDefault()
          void submit()
         }
        }}
       />
      </div>
      {err ? (
       <p role="alert" className="text-sm text-destructive">
        {err}
       </p>
      ) : null}
     </div>
    ) : null}
    <DialogFooter className="gap-2 sm:gap-0">
     <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
      取消
     </Button>
     <Button type="button" variant="destructive" disabled={saving || !target} onClick={() => void submit()}>
      {saving ? "處理中…" : "確認作廢"}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 )
}
