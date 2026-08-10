import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

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
import { voidRequiresSecondConfirmer } from "@/lib/entitlementAdjustment"
import { money } from "@/components/payments/paymentsUi"
import { voidPaymentRecord } from "@/services/paymentQueries"

export type VoidPaymentTarget = {
 id: string
 receiptNumber: string | null
 studentName: string
 studentId?: string
 totalAmount: number
 paymentDate: string
 status: string
 /** ISO；用於判斷是否超過 30 分鐘 */
 createdAt?: string | null
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
 const [secondEmail, setSecondEmail] = useState("")
 const [secondPassword, setSecondPassword] = useState("")
 const [err, setErr] = useState<string | null>(null)
 const [saving, setSaving] = useState(false)

 const needsSecond = useMemo(
  () => (target ? voidRequiresSecondConfirmer(target.createdAt) : false),
  [target]
 )

 useEffect(() => {
  if (!open) {
   setReason("")
   setPassword("")
   setSecondEmail("")
   setSecondPassword("")
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
  if (needsSecond) {
   if (!secondEmail.trim() || !secondPassword) {
    setErr("此單已超過 30 分鐘，請由另一位管理層或外星人輸入電郵與密碼。")
    return
   }
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
    ...(needsSecond
     ? {
        secondConfirmerEmail: secondEmail.trim(),
        secondConfirmerPassword: secondPassword,
       }
     : {}),
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
   if (target.studentId) {
    bits.push("金額錯請到收款登記重開正確單。")
   }
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
       作廢後單據會保留並標示「作廢」，不可刪除。堂數／科班錯請改用
       <Link className="mx-1 text-primary underline" to="/PaymentCorrection">
        單據／權益更正
       </Link>
       嘅池調動；金額錯先作廢再重開。
      </p>
      {needsSecond ? (
       <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
        此單開立已超過 30 分鐘，須另一位<strong>管理層或外星人</strong>輸入電郵與密碼作第二確認（不可同你本人）。
       </p>
      ) : (
       <p className="text-xs text-muted-foreground">開立未滿 30 分鐘：只需你本人密碼即可作廢。</p>
      )}
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
        你的登入密碼
       </label>
       <Input
        id="void-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={saving}
       />
      </div>
      {needsSecond ? (
       <>
        <div className="grid gap-1.5">
         <label className="text-sm font-medium" htmlFor="void-second-email">
          第二確認人電郵
         </label>
         <Input
          id="void-second-email"
          type="email"
          autoComplete="off"
          value={secondEmail}
          onChange={(e) => setSecondEmail(e.target.value)}
          disabled={saving}
          placeholder="manager 或 alien 帳號"
         />
        </div>
        <div className="grid gap-1.5">
         <label className="text-sm font-medium" htmlFor="void-second-password">
          第二確認人密碼
         </label>
         <Input
          id="void-second-password"
          type="password"
          autoComplete="off"
          value={secondPassword}
          onChange={(e) => setSecondPassword(e.target.value)}
          disabled={saving}
         />
        </div>
       </>
      ) : null}
      {err ? (
       <p role="alert" className="text-sm text-destructive">
        {err}
       </p>
      ) : null}
      {target.studentId ? (
       <p className="text-xs text-muted-foreground">
        作廢後可到{" "}
        <Link className="text-primary underline" to={`/Payments?studentId=${target.studentId}`}>
         收款登記
        </Link>{" "}
        重開正確單。
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
