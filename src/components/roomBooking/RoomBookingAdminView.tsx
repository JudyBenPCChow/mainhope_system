import { useCallback, useEffect, useState } from "react"
import { ClipboardCheck } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 approveRoomBookingRequest,
 fetchAllPendingRoomBookingRequests,
 rejectRoomBookingRequest,
 type RoomBookingRequestAdminRow,
} from "@/services/roomBookingQueries"

export function RoomBookingAdminView() {
 const { role } = useAuth()
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [rows, setRows] = useState<RoomBookingRequestAdminRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [busyId, setBusyId] = useState<string | null>(null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const list = await fetchAllPendingRoomBookingRequests()
   setRows(list)
  } catch (e) {
   reportUserFacingError(e, { source: "RoomBookingAdminView.reload", setErr })
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void reload()
 }, [reload])

 const onApprove = async (id: string) => {
 if (
  !(await confirmDialog({
   title: "核准約房申請",
   description: "核准後將建立排程並寫入課表，確定？",
   confirmText: "確認核准",
   tone: "warning",
  }))
 )
  return
  setBusyId(id)
  try {
   await approveRoomBookingRequest(id)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "RoomBookingAdminView.onApprove" })
   pushBanner({ tone: "error", title: "核准失敗", message: formatUnknownError(e) })
  } finally {
   setBusyId(null)
  }
 }

 const onReject = async (id: string) => {
 if (!(await confirmDialog({ title: "拒絕約房申請", description: "拒絕此約房申請？", confirmText: "確認拒絕", tone: "destructive" }))) return
  setBusyId(id)
  try {
   await rejectRoomBookingRequest(id)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "RoomBookingAdminView.onReject" })
   pushBanner({ tone: "error", title: "拒絕失敗", message: formatUnknownError(e) })
  } finally {
   setBusyId(null)
  }
 }

 if (!isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 return (
  <div className="space-y-4">
   {role === "admin" ? (
    <AdminPageHeader
     eyebrow="行政工作"
     title="約房審批"
     description="審批老師預約空房申請；核准後寫入排程。"
    />
   ) : (
    <header>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <ClipboardCheck className="h-7 w-7 text-info" aria-hidden />
      約房審批
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      老師「預約空房」申請會列於此；核准後會依選擇寫入排程（無班別則備註為「○○老師預約」）。
     </p>
    </header>
   )}

   {err ? (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <div className="flex justify-end">
    <Button type="button" variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
     重新整理
    </Button>
   </div>

   {loading ? (
    <p className="text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <p className="text-muted-foreground">目前沒有待審批的約房申請。</p>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[14%] px-3 py-2 font-medium">申請時間</th>
        <th className="w-[12%] px-3 py-2 font-medium">老師</th>
        <th className="w-[16%] px-3 py-2 font-medium">日期／時段</th>
        <th className="w-[12%] px-3 py-2 font-medium">課室</th>
        <th className="w-[18%] px-3 py-2 font-medium">班別／其他</th>
        <th className="w-[20%] px-3 py-2 font-medium">說明</th>
        <th className="w-[8%] px-3 py-2 font-medium">操作</th>
       </tr>
      </thead>
      <StaggerList as="tbody">
       {rows.map((r) => (
        <StaggerItem key={r.id} as="tr" className="border-b border-border last:border-0">
         <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">
          {r.created_at.slice(0, 16).replace("T", " ")}
         </td>
         <td className="px-3 py-2">{r.teacher_name ?? "—"}</td>
         <td className="px-3 py-2 tabular-nums">
          {r.scheduled_date}
          <br />
          {r.start_time}–{r.end_time}
         </td>
         <td className="px-3 py-2">{r.classroom_name}</td>
         <td className="px-3 py-2">
          {r.is_other ? (
           <span className="text-amber-800">其他</span>
          ) : r.target_class_label ? (
           r.target_class_label
          ) : (
           "—"
          )}
         </td>
         <td className="max-w-[14rem] px-3 py-2 text-xs text-muted-foreground">{r.reason ?? "—"}</td>
         <td className="px-3 py-2">
          <div className="flex flex-wrap gap-1">
           <Button
            type="button"
            size="sm"
            className="bg-success text-white hover:bg-success"
            disabled={busyId === r.id}
            onClick={() => void onApprove(r.id)}
           >
            核准
           </Button>
           <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busyId === r.id}
            onClick={() => void onReject(r.id)}
           >
            拒絕
           </Button>
          </div>
         </td>
        </StaggerItem>
       ))}
      </StaggerList>
     </table>
    </div>
   )}
  </div>
 )
}
