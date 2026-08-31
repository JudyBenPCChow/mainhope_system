import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type CancelReasonDialogProps = {
 open: boolean
 /** 對話框標題下的說明文字 */
 description?: string
 /** 預填原因（重新編輯既有取消原因時使用） */
 initialReason?: string
 saving?: boolean
 onCancel: () => void
 onConfirm: (reason: string) => void
}

/** 將排程狀態改為「取消」時，要求輸入取消原因的共用對話框 */
export function CancelReasonDialog({
 open,
 description,
 initialReason,
 saving = false,
 onCancel,
 onConfirm,
}: CancelReasonDialogProps) {
 const [reason, setReason] = useState(initialReason ?? "")
 const [err, setErr] = useState<string | null>(null)

 useEffect(() => {
  if (open) {
   setReason(initialReason ?? "")
   setErr(null)
  }
 }, [open, initialReason])

 const submit = () => {
  const trimmed = reason.trim()
  if (!trimmed) {
   setErr("請輸入取消原因")
   return
  }
  onConfirm(trimmed)
 }

 return (
  <Dialog
   open={open}
   onOpenChange={(o) => {
    if (!o && !saving) onCancel()
   }}
  >
   <DialogContent className="max-w-md text-sm">
    <DialogHeader>
     <DialogTitle className="text-lg font-semibold">取消排程原因</DialogTitle>
    </DialogHeader>
    <div className="grid gap-3 text-sm">
     <p className="text-muted-foreground">
      {description ?? "請填寫此節排程取消的原因，方便同事了解狀況。"}
     </p>
     <Textarea
      className="min-h-[120px] text-base"
      value={reason}
      onChange={(e) => {
       setReason(e.target.value)
       if (err) setErr(null)
      }}
      placeholder="例如：老師臨時請假、颱風影響、學生全數請假…"
      autoFocus
     />
     {err ? <p role="alert" className="text-destructive">{err}</p> : null}
     <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
       返回
      </Button>
      <Button
       type="button"
       className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
       disabled={saving}
       onClick={submit}
      >
       {saving ? "儲存中…" : "確認取消排程"}
      </Button>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 )
}
