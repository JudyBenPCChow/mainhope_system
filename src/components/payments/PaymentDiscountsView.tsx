import { useCallback, useEffect, useState } from "react"
import { Pencil, Percent, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 deletePaymentDiscount,
 fetchAllPaymentDiscounts,
 insertPaymentDiscount,
 updatePaymentDiscount,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"

function formatErr(e: unknown): string {
 if (e instanceof Error) return e.message
 if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
 return "操作失敗"
}

export function PaymentDiscountsView() {
 const [rows, setRows] = useState<PaymentDiscountRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [dialogOpen, setDialogOpen] = useState(false)
 const [editing, setEditing] = useState<PaymentDiscountRow | null>(null)
 const [name, setName] = useState("")
 const [percentOff, setPercentOff] = useState("")
 const [amountOff, setAmountOff] = useState("")
 const [isActive, setIsActive] = useState(true)
 const [sortOrder, setSortOrder] = useState("0")
 const [saving, setSaving] = useState(false)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   setRows(await fetchAllPaymentDiscounts())
  } catch (e) {
   setErr(formatErr(e))
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 const openCreate = () => {
  setEditing(null)
  setName("")
  setPercentOff("")
  setAmountOff("")
  setIsActive(true)
  setSortOrder("0")
  setDialogOpen(true)
 }

 const openEdit = (r: PaymentDiscountRow) => {
  setEditing(r)
  setName(r.name)
  setPercentOff(r.percentOff != null ? String(r.percentOff) : "")
  setAmountOff(r.amountOff != null ? String(r.amountOff) : "")
  setIsActive(r.isActive)
  setSortOrder(String(r.sortOrder))
  setDialogOpen(true)
 }

 const submit = async () => {
  if (!name.trim()) {
   alert("請填名稱")
   return
  }
  const p = percentOff.trim() ? Number(percentOff) : null
  const a = amountOff.trim() ? Number(amountOff) : null
  if (p != null && (p < 0 || p > 100)) {
   alert("折扣百分比須介於 0–100")
   return
  }
  if (a != null && a < 0) {
   alert("固定減免不可為負數")
   return
  }
  setSaving(true)
  try {
   const sortN = Number(sortOrder) || 0
   if (editing) {
    await updatePaymentDiscount(editing.id, {
     name: name.trim(),
     percentOff: p,
     amountOff: a,
     isActive,
     sortOrder: sortN,
    })
   } else {
    await insertPaymentDiscount({
     name: name.trim(),
     percentOff: p,
     amountOff: a,
     isActive,
     sortOrder: sortN,
    })
   }
   setDialogOpen(false)
   await load()
  } catch (e) {
   alert(formatErr(e))
  } finally {
   setSaving(false)
  }
 }

 const onDelete = async (r: PaymentDiscountRow) => {
  if (!confirm(`刪除優惠「${r.name}」？已關聯的繳費紀錄將保留欄位為空（on delete set null）。`)) return
  try {
   await deletePaymentDiscount(r.id)
   await load()
  } catch (e) {
   alert(formatErr(e))
  }
 }

 const summarize = (r: PaymentDiscountRow) => {
  const parts: string[] = []
  if (r.percentOff != null && r.percentOff > 0) parts.push(`減 ${r.percentOff}%`)
  if (r.amountOff != null && r.amountOff > 0) parts.push(`減 $${r.amountOff}`)
  if (parts.length === 0) return "僅註記（不計算）"
  return parts.join("，")
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Percent className="h-8 w-8 text-rose-600" aria-hidden />
      優惠折扣
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      維護繳費表單可選的優惠項目；可設定百分比、固定減免，或僅作備註標籤。
     </p>
    </div>
    <Button
     type="button"
     className="bg-rose-600 text-white hover:bg-rose-700"
     onClick={openCreate}
     disabled={!isSupabaseConfigured}
    >
     <Plus className="h-4 w-4" />
     新增優惠
    </Button>
   </header>

   {!isSupabaseConfigured ? (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   {err ? (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
     尚無優惠項目，請按「新增優惠」。
    </div>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
      <thead className="border-b bg-muted/40">
       <tr>
        <th className="w-[10%] px-3 py-2 font-medium">排序</th>
        <th className="w-[22%] px-3 py-2 font-medium">名稱</th>
        <th className="w-[38%] px-3 py-2 font-medium">規則</th>
        <th className="w-[12%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[18%] px-3 py-2 font-medium">操作</th>
       </tr>
      </thead>
      <tbody>
       {rows.map((r) => (
        <tr key={r.id} className="border-b border-border/80 last:border-0">
         <td className="px-3 py-2 tabular-nums">{r.sortOrder}</td>
         <td className="px-3 py-2 font-medium">{r.name}</td>
         <td className="px-3 py-2 text-muted-foreground">{summarize(r)}</td>
         <td className="px-3 py-2">{r.isActive ? "啟用" : "停用"}</td>
         <td className="px-3 py-2">
          <div className="flex flex-wrap gap-1">
           <Button type="button" variant="outline" size="sm" onClick={() => openEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
            編輯
           </Button>
           <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => void onDelete(r)}
           >
            <Trash2 className="h-3.5 w-3.5" />
            刪除
           </Button>
          </div>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   )}

   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
     <DialogHeader>
      <DialogTitle>{editing ? "編輯優惠" : "新增優惠"}</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <div className="grid gap-1.5">
       <label className="font-medium">名稱 *</label>
       <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：舊生 95 折" />
      </div>
      <div className="grid gap-1.5">
       <label className="font-medium">減免百分比（0–100，選填）</label>
       <Input
        type="number"
        min={0}
        max={100}
        step="0.01"
        value={percentOff}
        onChange={(e) => setPercentOff(e.target.value)}
        placeholder="例如 5 表示折後付 95%"
       />
      </div>
      <div className="grid gap-1.5">
       <label className="font-medium">固定減免金額 HKD（選填）</label>
       <Input
        type="number"
        min={0}
        step="0.01"
        value={amountOff}
        onChange={(e) => setAmountOff(e.target.value)}
        placeholder="例如 100"
       />
      </div>
      <p className="text-xs text-muted-foreground">
       若兩者皆留空，選擇此優惠時僅作標籤顯示，應繳金額等於各項小計加總。
      </p>
      <div className="grid gap-1.5">
       <label className="font-medium">排序（數字小排前）</label>
       <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
      </div>
      <label className="flex cursor-pointer items-center gap-2">
       <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
       啟用（停用後不會出現在繳費表單）
      </label>
      <Button
       type="button"
       className="bg-rose-600 text-white hover:bg-rose-700"
       disabled={saving}
       onClick={() => void submit()}
      >
       儲存
      </Button>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
